import { grpcHealthcheckData } from "../../../grpc/grpc-healthcheck";
import { Socket } from "../../socket/create-socket";
import { Monitor, MonitorMap } from "../../uptime-kuma-io-types";
import { IsHomenetGroup } from "./get-homenet-group-id-or-create";
import {
  GetHomenetMonitorTagsLength,
  IsHomenetMonitor,
} from "./get-homenet-tag-or-create";
import { NetList } from "./get-net-list";

export const removeUnexpectedMonitors = async (
  socket: Socket,
  netList: NetList,
  monitorMap: MonitorMap,
  homenetGroupId: number,
  isHomenetGroup: IsHomenetGroup,
  isHomenetMonitor: IsHomenetMonitor,
  getHomenetMonitorTagsLength: GetHomenetMonitorTagsLength
): Promise<boolean> => {
  console.log("io: remove obsolete monitors");

  const homenetMonitorMap = Object.fromEntries(
    Object.entries(monitorMap).filter(
      ([id, monitor]) =>
        monitor.type === "group" ||
        monitor.parent === homenetGroupId ||
        isHomenetMonitor(monitor)
    )
  );

  const homenetMonitorList = Object.values(homenetMonitorMap);

  const monitorsToRemove = [
    ...new Set(
      [
        ...getMonitorsWithDuplicatedGroups(
          homenetMonitorList,
          homenetGroupId,
          isHomenetGroup
        ),

        ...getMonitorsWithDuplicates(homenetMonitorList),

        ...getMonitorsWithObsoleteValues(
          homenetMonitorList,
          getHomenetMonitorTagsLength,
          netList
        ),
      ]
        .map((monitor) => monitor.id)
        .sort()
    ),
  ].map((id) => homenetMonitorMap[id]);

  console.log("io: all monitors to remove count", monitorsToRemove.length);

  for (const monitor of monitorsToRemove) {
    console.log(
      "\nio: remove monitor",
      monitor.name,
      monitor.type,
      monitor.grpcUrl ?? monitor.hostname ?? monitor.url
    );

    try {
      await socket.emit.deleteMonitor(monitor.id);
    } catch (error) {
      console.error("io: remove monitor error (not breaking):", error);
    }
  }

  console.log("io: monitors remove end -", monitorsToRemove.length);

  return monitorsToRemove.length > 0;
};

const getMonitorsWithDuplicatedGroups = (
  homenetMonitorList: Monitor[],
  homenetGroupId: number,
  isHomenetGroup: IsHomenetGroup
) => {
  console.log("io: check duplicated homenet groups");

  const groupsToRemove = homenetMonitorList.filter(
    (monitor) => monitor.id !== homenetGroupId && isHomenetGroup(monitor)
  );

  const monitors = groupsToRemove.flatMap((group) => [
    group,
    ...homenetMonitorList.filter((monitor) => monitor.parent === group.id),
  ]);

  console.log(
    "io: duplicated homenet groups count (+ monitors children):",
    groupsToRemove.length,
    `(+ ${monitors.length - groupsToRemove.length})`
  );

  return monitors;
};

const getMonitorsWithDuplicates = (homenetMonitorList: Monitor[]) => {
  console.log("io: check duplicated monitors");

  const monitors = homenetMonitorList.filter((mA) => {
    const mAKeys = Object.keys(mA)
      .filter((key) => key !== "id")
      .sort() as (keyof Monitor)[];
    const mAChecksum = mAKeys
      .map((key) => key + "=" + String(mA[key]))
      .join(";");

    return homenetMonitorList.some((mB) => {
      if (mB.id === mA.id) {
        return false;
      }

      const mBKeys = Object.keys(mB)
        .filter((key) => key !== "id")
        .sort() as (keyof Monitor)[];
      const mBChecksum = mBKeys
        .map((key) => key + "=" + String(mB[key]))
        .join(";");

      return mAChecksum === mBChecksum;
    });
  });

  console.log("io: duplicated monitors count:", monitors.length);

  return monitors;
};

const getMonitorsWithObsoleteValues = (
  homenetMonitorList: Monitor[],
  getHomenetMonitorTagsLength: GetHomenetMonitorTagsLength,
  netList: NetList
) => {
  console.log("io: check monitors with obsolete values");

  const monitors = homenetMonitorList.filter((monitor) => {
    if (monitor.type === "group") {
      return false;
    }

    if (getHomenetMonitorTagsLength(monitor) !== 1) {
      return true;
    }

    return !netList.some((net) => {
      switch (net.type) {
        case "web":
          return monitor.type === "http" && monitor.url === net.href;
        case "ssh":
          return (
            monitor.type === "port" &&
            monitor.hostname === net.address &&
            monitor.port === net.port
          );
        case "grpc":
          return (
            monitor.type === "grpc-keyword" &&
            monitor.grpcUrl === net.href &&
            monitor.grpcServiceName === grpcHealthcheckData.service &&
            monitor.grpcMethod === grpcHealthcheckData.method
          );
      }
    });
  });

  console.log("io: monitors with obsolete values count", monitors.length);
  return monitors;
};
