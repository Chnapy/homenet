import { grpcHealthcheckData } from "../../grpc/grpc-healthcheck";
import { getDevicesFullData } from "../../trpc/procedures/get-devices-full";
import { NetAccess } from "../../trpc/utils/get-net-entity-map";
import { createSocket, Socket } from "../socket/create-socket";
import { getSocketAddress } from "../socket/utils/get-socket-address";
import { Monitor, MonitorMap, Notification } from "../uptime-kuma-io-types";
import { addMissingMonitors } from "./utils/add-missing-monitors";
import {
  createUptimeMapGetter,
  GetUptimeMap,
} from "./utils/create-uptime-map-getter";
import { getHomenetGroupIdOrCreate } from "./utils/get-homenet-group-id-or-create";
import { getHomenetTagOrCreate } from "./utils/get-homenet-tag-or-create";
import { getNetList, NetList } from "./utils/get-net-list";
import { removeUnexpectedMonitors } from "./utils/remove-unexpected-monitors";

type UptimeSetupData = {
  socketAddress: string;
  monitorMap: MonitorMap;
  getUptimeMap: GetUptimeMap;
};

const setupProcess = async (
  socketAddress: string,
  socket: Socket,
  netList: NetList,
  notificationList: Notification[]
) => {
  const { homenetTag, isHomenetMonitor, getHomenetMonitorTagsLength } =
    await getHomenetTagOrCreate(socket);

  const notificationIDList = notificationList.length
    ? {
        [String(notificationList[0].id)]: true,
      }
    : {};

  const initialMonitorMap = await socket.emit.getMonitorList();

  console.log(
    "initialMonitorMap count",
    Object.values(initialMonitorMap).length
  );

  const { homenetGroupId, isHomenetGroup } = await getHomenetGroupIdOrCreate(
    socket,
    initialMonitorMap,
    notificationIDList
  );

  const removed = await removeUnexpectedMonitors(
    socket,
    netList,
    initialMonitorMap,
    homenetGroupId,
    isHomenetGroup,
    isHomenetMonitor,
    getHomenetMonitorTagsLength
  );

  const cleanedMonitorMap = removed
    ? await socket.emit.getMonitorList()
    : initialMonitorMap;

  console.log(
    "cleanedMonitorMap count",
    Object.values(cleanedMonitorMap).length
  );

  const added = await addMissingMonitors(
    socket,
    netList,
    homenetGroupId,
    homenetTag.id,
    cleanedMonitorMap,
    isHomenetMonitor,
    notificationIDList
  );

  const updatedMonitorMap = added
    ? await socket.emit.getMonitorList()
    : cleanedMonitorMap;

  console.log(
    "updatedMonitorMap count",
    Object.values(updatedMonitorMap).length
  );

  return {
    socketAddress,
    monitorMap: updatedMonitorMap,
    getUptimeMap: createUptimeMapGetter(isHomenetMonitor),
  };
};

export const uptimeSetup = async () => {
  const { netEntityMap, deviceList, instanceList, appList } =
    await getDevicesFullData();

  const filterFn = ({ type, scope, address }: NetAccess) => {
    return true;
    // return (
    //   type === "web" // && scope === "dns-domain" // && address !== "home.assistant"
    // );
  };

  const socketAddress = getSocketAddress(netEntityMap, filterFn);
  if (!socketAddress) {
    return;
  }

  const netList = getNetList(
    { netEntityMap, deviceList, instanceList, appList },
    filterFn
  );

  const socket = createSocket(socketAddress);

  return new Promise<UptimeSetupData>(async (resolve) => {
    const onNotificationList = socket.on.notificationList(
      async (notificationList) => {
        onNotificationList.turnOff();

        const data = await setupProcess(
          socketAddress,
          socket,
          netList,
          notificationList
        );

        resolve(data);
      }
    );

    await socket.connect();
    await socket.emit.login();
  }).finally(() => {
    socket.disconnect();
  });
};
