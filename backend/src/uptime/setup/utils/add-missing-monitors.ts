import { Socket } from "../../socket/create-socket";
import { Monitor, MonitorMap } from "../../uptime-kuma-io-types";
import { IsHomenetMonitor } from "./get-homenet-tag-or-create";
import { NetList } from "./get-net-list";
import { getNetMonitorFns } from "./get-net-monitor-fns";

export const addMissingMonitors = async (
  socket: Socket,
  netList: NetList,
  homenetGroupId: number,
  homenetTagId: number,
  monitorMap: MonitorMap,
  isHomenetMonitor: IsHomenetMonitor,
  notificationIDList: Monitor["notificationIDList"]
): Promise<boolean> => {
  const homenetMonitorMap = Object.fromEntries(
    Object.entries(monitorMap).filter(([id, monitor]) =>
      isHomenetMonitor(monitor)
    )
  );

  const homenetMonitorList = Object.values(homenetMonitorMap);

  const monitorAddFns = netList
    .map((net) => {
      const { matchMonitor, getMonitorProps } = getNetMonitorFns(net);

      const monitor = homenetMonitorList.find(matchMonitor);
      if (monitor) {
        return null;
      }

      return async () => {
        console.log("\nio: add monitor", net.name, net.href);

        const { monitorID } = await socket.emit.addMonitor({
          active: true,
          parent: homenetGroupId,
          description: net.description,
          notificationIDList,
          ...getMonitorProps(),
        });

        await socket.emit.addMonitorTag(homenetTagId, monitorID, "");
      };
    })
    .filter((fn) => fn !== null);

  console.log("io: missing monitors count to add", monitorAddFns.length);

  for (const fn of monitorAddFns) {
    try {
      await fn();
    } catch (error) {
      console.error("io: add monitor error (not breaking):", error);
    }
  }

  console.log("io: missing monitors add end -", monitorAddFns.length);
  return monitorAddFns.length > 0;
};
