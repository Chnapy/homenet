import { Socket } from "../../socket/create-socket";
import { Monitor, MonitorMap } from "../../uptime-kuma-io-types";

export type IsHomenetGroup = (monitor: Monitor) => boolean;

const homenetGroupName = "Homenet";

export const getHomenetGroupIdOrCreate = async (
  socket: Socket,
  monitorMap: MonitorMap,
  notificationIDList: Record<string, boolean>
) => {
  console.log("io: get homenet group with cleanup");
  const monitorList = Object.values(monitorMap);

  const isHomenetGroup: IsHomenetGroup = (monitor: Monitor) =>
    monitor.type === "group" && monitor.name === homenetGroupName;

  const [homenetGroup] = monitorList
    .filter(isHomenetGroup)
    .sort((a, b) => (a.id < b.id ? -1 : 1));

  const createHomenetGroup = () =>
    socket.emit
      .addMonitor({
        active: true,
        type: "group",
        name: homenetGroupName,
        description: "Monitors created by Homenet",
        method: "GET",
        notificationIDList,
      })
      .then(({ monitorID }) => monitorID);

  return {
    homenetGroupId: homenetGroup?.id ?? (await createHomenetGroup()),
    isHomenetGroup,
  };
};
