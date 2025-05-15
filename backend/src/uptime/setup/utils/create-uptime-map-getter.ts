import { getAccessHref } from "../../../trpc/utils/get-net-entity-map";
import { Heartbeat, Monitor, MonitorMap } from "../../uptime-kuma-io-types";

export type UptimeMap = Record<string, "on" | "off" | undefined>;

export type GetUptimeMap = ReturnType<typeof createUptimeMapGetter>;

export type LastHeartbeatMap = Record<number, Heartbeat | undefined>;

export const createUptimeMapGetter =
  (isHomenetMonitor: (monitor: Monitor) => boolean) =>
  (monitorMap: MonitorMap, lastHeartbeatMap: LastHeartbeatMap) =>
    Object.fromEntries(
      Object.values(monitorMap)
        .filter(isHomenetMonitor)
        .map((monitor) => {
          const getKey = (): string => {
            switch (monitor.type) {
              case "http":
                return monitor.url!;
              case "port":
                return getAccessHref({
                  type: "ssh",
                  address: monitor.hostname!,
                  port: monitor.port!,
                });
              case "grpc-keyword":
                return monitor.grpcUrl!;
              default:
                throw new Error("Switch case not handled");
            }
          };

          const value =
            monitor.active &&
            typeof lastHeartbeatMap[monitor.id]?.status === "number"
              ? lastHeartbeatMap[monitor.id]!.status === 1
                ? "on"
                : "off"
              : undefined;

          return [getKey(), value] satisfies [
            keyof UptimeMap,
            UptimeMap[keyof UptimeMap]
          ];
        })
    );
