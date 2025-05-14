import { grpcHealthcheckData } from "../grpc/grpc-healthcheck";
import { getDevicesFullData } from "../trpc/procedures/get-devices-full";
import { getAccessHref, NetAccess } from "../trpc/utils/get-net-entity-map";
import { createSocket } from "./create-socket";
import { UptimeMap } from "./uptime";
import { Heartbeat, Monitor, Notification, Tag } from "./uptime-kuma-io-types";

export const uptimeSetup = async () => {
  const { netEntityMap, deviceList, instanceList, appList } =
    await getDevicesFullData();

  const filterFn = ({ type, scope, address }: NetAccess) => {
    return true;
    // return (
    //   type === "web" // && scope === "dns-domain" // && address !== "home.assistant"
    // );
  };

  const uptimeNetAccess = Object.values(netEntityMap)
    .flatMap((entity) => entity.apps.UPTIME_KUMA ?? [])
    .filter(filterFn)
    .find((net) => net.type === "web" && net.scope !== "lan");

  if (!uptimeNetAccess) {
    console.log("io: uptime-kuma net-access not found");
    return;
  }

  const socketAddress = `${uptimeNetAccess.ssl ? "wss" : "ws"}://${
    uptimeNetAccess.address
  }${
    uptimeNetAccess.port &&
    uptimeNetAccess.port !== 80 &&
    uptimeNetAccess.port !== 443
      ? ":" + uptimeNetAccess.port
      : ""
  }`;

  const hrefMap = Object.fromEntries(
    Object.entries(netEntityMap)
      .map(([key, entity]) => {
        const osMeta = [...deviceList, ...instanceList].find(
          (instance) => instance.id === entity.id
        )?.meta!;

        return [
          key,
          {
            os: entity.os
              .filter(filterFn)
              .map((net) => ({ ...net, ...osMeta })),
            apps: Object.fromEntries(
              Object.entries(entity.apps)
                .map(([key, app]) => {
                  const foundApp = appList.find(
                    (ap) => ap.parentId === entity.id && ap.slug === key
                  )!;

                  return [
                    key,
                    app.filter(filterFn).map((net) => ({
                      ...net,
                      ...foundApp.meta,
                    })),
                  ] as const;
                })
                .filter((v) => v[1].length > 0)
            ),
          },
        ] as const;
      })
      .filter((v) => v[1].os.length > 0 || Object.keys(v[1].apps).length > 0)
  );

  const netList = Object.values(hrefMap).flatMap((value) =>
    value.os.concat(...Object.values(value.apps).flatMap((app) => app))
  );

  const socket = createSocket(socketAddress);

  return new Promise<{
    socketAddress: string;
    monitorMap: Record<string, Monitor>;
    homenetTag: Tag;
    notificationList: Notification[];
    getUptimeMap: (
      monitorMap: Record<string, Monitor>,
      lastHeartbeatMap: Record<number, Heartbeat | undefined>
    ) => UptimeMap;
  }>(async (resolve) => {
    const onNotificationList = socket.on.notificationList(
      async (notificationList) => {
        onNotificationList.turnOff();

        const homenetTag = await socket.emit
          .getTags()
          .then(async ({ tags }) => {
            const foundTag = tags.find((t) => t.name === "homenet");
            if (foundTag) {
              return foundTag;
            }

            const { tag } = await socket.emit.addTag({
              name: "homenet",
              color: "#362236",
            });

            return tag;
          });

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

        const getHomenetGroupId = async (
          monitorMap: Record<string, Monitor>
        ) => {
          console.log("io: get homenet group with cleanup");
          const initialMonitorList = Object.values(monitorMap);

          console.log("io: check duplicated homenet groups");

          const [homenetGroup] = initialMonitorList
            .filter(
              (monitor) =>
                monitor.type === "group" && monitor.name === "Homenet"
            )
            .sort((a, b) => (a.id < b.id ? -1 : 1));

          if (homenetGroup) {
            return homenetGroup.id;
          }

          return await socket.emit
            .addMonitor({
              active: true,
              type: "group",
              name: "Homenet",
              description: "Monitors created by Homenet",
              method: "GET",
              notificationIDList,
            })
            .then(({ monitorID }) => monitorID);
        };

        const homenetGroupId = await getHomenetGroupId(initialMonitorMap);

        //   const getHomenetMonitorMap = () =>
        //     socket.emit
        //       .getMonitorList()
        //       .then((monitorMap) =>
        //         Object.fromEntries(
        //           Object.entries(monitorMap).filter(
        //             ([id, monitor]) =>
        //               monitor.type === "group" ||
        //               monitor.parent === homenetGroupId ||
        //               monitor.tags?.some(({ tag_id }) => tag_id === homenetTag.id)
        //           )
        //         )
        //       );

        const removeObsoleteMonitors = async (
          monitorMap: Record<string, Monitor>
        ) => {
          console.log("io: remove obsolete monitors");

          const homenetMonitorMap = Object.fromEntries(
            Object.entries(monitorMap).filter(
              ([id, monitor]) =>
                monitor.type === "group" ||
                monitor.parent === homenetGroupId ||
                monitor.tags?.some(({ tag_id }) => tag_id === homenetTag.id)
            )
          );

          const homenetMonitorList = Object.values(homenetMonitorMap);

          const getMonitorsWithDuplicatedGroups = () => {
            console.log("io: check duplicated homenet groups");

            const groupsToRemove = homenetMonitorList.filter(
              (monitor) =>
                monitor.id !== homenetGroupId &&
                monitor.type === "group" &&
                monitor.name === "Homenet"
            );

            const monitors = groupsToRemove.flatMap((group) => [
              group,
              ...homenetMonitorList.filter(
                (monitor) => monitor.parent === group.id
              ),
            ]);

            console.log(
              "io: duplicated homenet groups count (+ monitors children):",
              groupsToRemove.length,
              `(+ ${monitors.length - groupsToRemove.length})`
            );

            return monitors;
          };

          const getMonitorsWithDuplicates = () => {
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

          const getMonitorsWithObsoleteValues = () => {
            console.log("io: check monitors with obsolete values");

            const monitors = homenetMonitorList.filter((monitor) => {
              if (monitor.type === "group") {
                return false;
              }

              if (
                monitor.tags?.filter(({ tag_id }) => tag_id === homenetTag.id)
                  ?.length !== 1
              ) {
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

            console.log(
              "io: monitors with obsolete values count",
              monitors.length
            );
            return monitors;
          };

          const monitorsToRemove = [
            ...new Set([
              ...getMonitorsWithDuplicatedGroups().map((monitor) => monitor.id),
              ...getMonitorsWithDuplicates().map((monitor) => monitor.id),
              ...getMonitorsWithObsoleteValues().map((monitor) => monitor.id),
            ]),
          ].map((id) => homenetMonitorMap[id]);

          console.log(
            "io: all monitors to remove count",
            monitorsToRemove.length
          );

          if (monitorsToRemove.length === 0) {
            return false;
          }

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

          return true;
        };

        const addMissingMonitors = async (
          monitorMap: Record<string, Monitor>
        ) => {
          const homenetMonitorMap = Object.fromEntries(
            Object.entries(monitorMap).filter(([id, monitor]) =>
              monitor.tags?.some(({ tag_id }) => tag_id === homenetTag.id)
            )
          );

          const homenetMonitorList = Object.values(homenetMonitorMap);

          const monitorAddFns = netList
            .map((net) => {
              const monitor = homenetMonitorList.find((monitor) => {
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
              if (monitor) {
                return null;
              }

              return async () => {
                console.log("\nio: add monitor", net.name, net.href);

                const getMonitorCommonProps = (): Partial<Monitor> => {
                  const namePart =
                    net.scope === "lan"
                      ? "by lan"
                      : net.scope === "vpn"
                      ? "by vpn"
                      : net.scope === "wan"
                      ? "by IP"
                      : "";

                  switch (net.type) {
                    case "web":
                      return {
                        type: "http",
                        name: [net.name, namePart].filter(Boolean).join(" "),
                        url: net.href,
                        method: "GET",
                        expiryNotification: net.href.startsWith("https://"),
                        ignoreTls: net.href.startsWith("https://"),
                      };
                    case "ssh":
                      return {
                        type: "port",
                        name: [net.name, "SSH", namePart]
                          .filter(Boolean)
                          .join(" "),
                        port: net.port,
                        hostname: net.address,
                        method: "GET",
                      };
                    case "grpc":
                      return {
                        type: "grpc-keyword",
                        name: [net.name, "gRPC", namePart]
                          .filter(Boolean)
                          .join(" "),
                        grpcUrl: net.href,
                        grpcProtobuf: grpcHealthcheckData.protobuf,
                        grpcServiceName: grpcHealthcheckData.service,
                        grpcMethod: grpcHealthcheckData.method,
                        grpcEnableTls: grpcHealthcheckData.tls,
                        grpcBody: grpcHealthcheckData.expectedRequestBody,
                        keyword: `"${grpcHealthcheckData.expectedResponseValue}"`,
                      };
                  }
                };

                const { monitorID } = await socket.emit.addMonitor({
                  active: true,
                  parent: homenetGroupId,
                  ...getMonitorCommonProps(),
                  description: net.description,
                  notificationIDList,
                });

                await socket.emit.addMonitorTag(homenetTag.id, monitorID, "");
              };
            })
            .filter((fn) => fn !== null);

          console.log(
            "io: missing monitors count to add",
            monitorAddFns.length
          );

          if (monitorAddFns.length === 0) {
            return false;
          }

          for (const fn of monitorAddFns) {
            try {
              await fn();
            } catch (error) {
              console.error("io: add monitor error (not breaking):", error);
            }
          }

          console.log("io: missing monitors add end -", monitorAddFns.length);
          return true;
        };

        const removed = await removeObsoleteMonitors(initialMonitorMap);

        const cleanedMonitorMap = removed
          ? await socket.emit.getMonitorList()
          : initialMonitorMap;

        console.log(
          "cleanedMonitorMap count",
          Object.values(cleanedMonitorMap).length
        );

        const added = await addMissingMonitors(cleanedMonitorMap);

        const updatedMonitorMap = added
          ? await socket.emit.getMonitorList()
          : cleanedMonitorMap;

        console.log(
          "updatedMonitorMap count",
          Object.values(updatedMonitorMap).length
        );

        const getUptimeMap = (
          monitorMap: Record<string, Monitor>,
          lastHeartbeatMap: Record<number, Heartbeat | undefined>
        ) =>
          Object.fromEntries(
            Object.values(monitorMap)
              .filter((monitor) =>
                Boolean(
                  monitor.tags?.some(({ tag_id }) => tag_id === homenetTag.id)
                )
              )
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

        socket.disconnect();
        resolve({
          socketAddress,
          monitorMap: updatedMonitorMap,
          homenetTag,
          notificationList,
          getUptimeMap,
        });
      }
    );

    await socket.connect();
    await socket.emit.login();
  }).finally(() => {
    socket.disconnect();
  });
};
