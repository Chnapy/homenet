import {
  GetUptimeMap,
  LastHeartbeatMap,
} from "../setup/utils/create-uptime-map-getter";
import { createSocket, Socket } from "../socket/create-socket";
import { uptimeEventEmitter } from "../uptime-event-emitter";
import { Heartbeat, MonitorMap } from "../uptime-kuma-io-types";

export type PersistantEntities = {
  setupLock: boolean;

  socketAddress?: string;
  socket?: Socket;

  monitorMap?: MonitorMap;
  lastHeartbeatMap?: LastHeartbeatMap;
  hearbeatReady: boolean;
  getUptimeMap?: GetUptimeMap;
};

export const uptimeWatch = async (pe: PersistantEntities) => {
  const prepareData = () => {
    if (pe.getUptimeMap && pe.monitorMap && pe.lastHeartbeatMap) {
      return pe.getUptimeMap(pe.monitorMap, pe.lastHeartbeatMap);
    }
  };

  const sendToClient = (origin: string) => {
    if (pe.setupLock || !pe.hearbeatReady) {
      return;
    }

    const preparedData = prepareData();

    if (preparedData) {
      console.log("io: send from", origin);
      uptimeEventEmitter.emit("add", preparedData);
    }
  };

  if (!pe.socketAddress) {
    console.log("io: socket address not found, abort");
    return;
  }

  if (pe.socket?.isConnected) {
    console.log("io: socket already connected, abort");
    return;
  }

  const socket = createSocket(pe.socketAddress);
  pe.socket = socket;

  socket.on.disconnect((reason) => {
    console.log("io: disconnect -", reason);
    socket.disconnect();

    delete pe.socket;
    pe.hearbeatReady = false;
  });

  /**
   * First call after login (1)
   */
  socket.on.monitorList(async (monitorMap) => {
    // console.log("io: on.monitorList");
    pe.monitorMap = monitorMap;
    await sendToClient("on.monitorList");
  });

  /**
   * First call after login (2)
   */
  socket.on.notificationList(async () => {
    // console.log("io: on.notificationList");
    await sendToClient("on.notificationList");
  });

  /**
   * First call after login (3)
   */
  socket.on.heartbeatList((monitorIdStr, data) => {
    const monitorId = Number(monitorIdStr);

    const previousHeartbeat = pe.lastHeartbeatMap?.[monitorId];

    const lastHeartbeat = data[data.length - 1] as Heartbeat | undefined;
    pe.lastHeartbeatMap = {
      ...pe.lastHeartbeatMap,
      [monitorId]: lastHeartbeat,
    };

    if (!pe.monitorMap) {
      return;
    }

    if (
      !pe.hearbeatReady &&
      monitorId === Math.max(...Object.keys(pe.monitorMap).map(Number))
    ) {
      pe.hearbeatReady = true;
      sendToClient("on.heartbeatList.1");
    } else if (
      lastHeartbeat &&
      lastHeartbeat.status !== previousHeartbeat?.status
    ) {
      sendToClient("on.heartbeatList.2");
    }
  });

  /**
   * First call after login (4)
   */
  socket.on.heartbeat((data) => {
    const monitorId = data.monitorID;

    const previousHeartbeat = pe.lastHeartbeatMap?.[monitorId];

    const lastHeartbeat = data;
    pe.lastHeartbeatMap = {
      ...pe.lastHeartbeatMap,
      [monitorId]: lastHeartbeat,
    };

    if (!pe.monitorMap) {
      return;
    }

    if (lastHeartbeat.status !== previousHeartbeat?.status) {
      sendToClient("on.heartbeat");
    }
  });

  await socket.connect();
  await socket.emit.login();

  return prepareData();
};
