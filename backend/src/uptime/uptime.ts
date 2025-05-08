import { App } from "../trpc/entities/app";
import { Meta } from "../trpc/entities/utils/meta";
import { GetDeviceFull } from "../trpc/procedures/get-devices-full";
import { uptimeEventEmitter } from "../trpc/procedures/listen-uptime";
import { getAccessHref, NetAccess } from "../trpc/utils/get-net-entity-map";
import { createSocket } from "./create-socket";
import { Heartbeat, Monitor, Notification, Tag } from "./uptime-kuma-io-types";

export type UptimeMap = Record<string, "on" | "off" | undefined>;

type PersistantEntities = {
  started: boolean;
  deviceFull?: Omit<GetDeviceFull, "agentMetadataList">;
  netList?: (NetAccess & Meta)[];
  socket?: ReturnType<typeof createSocket>;

  tag?: Tag;
  monitorMap?: Record<number, Monitor | undefined>;
  notificationList?: Notification[];
  lastHeartbeatMap?: Record<number, Heartbeat | undefined>;
  hearbeatReady: boolean;
  processLock: boolean;
};

const pe: PersistantEntities = {
  started: false,
  hearbeatReady: false,
  processLock: false,
};

const getTagOrAdd = () =>
  pe.socket!.emit.getTags().then(async ({ tags }) => {
    const foundTag = tags.find((t) => t.name === "homenet");
    if (foundTag) {
      pe.tag = foundTag;
      return foundTag;
    }

    const { tag } = await pe.socket!.emit.addTag({
      name: "homenet",
      color: "#362236",
    });

    pe.tag = tag;
    return tag;
  });

const prepareData = () => {
  const requiredPeKeys: (keyof PersistantEntities)[] = [
    "hearbeatReady",
    "tag",
    "monitorMap",
    "notificationList",
    "lastHeartbeatMap",
  ];
  const missingPeValues = requiredPeKeys.filter((key) => !pe[key]);
  if (missingPeValues.length > 0) {
    // console.log(
    //   "io: send from",
    //   origin,
    //   "aborted, required values missing:",
    //   missingPeValues,
    //   Object.keys(pe.monitorMap ?? {}),
    //   Object.keys(pe.lastHeartbeatMap ?? {})
    // );
    return;
  }

  return Object.fromEntries(
    Object.values(pe.monitorMap!)
      .filter((monitor): monitor is Monitor =>
        Boolean(monitor?.tags?.some(({ tag_id }) => tag_id === pe.tag!.id))
      )
      .map((monitor) => {
        const key =
          monitor.type === "http"
            ? monitor.url!
            : getAccessHref({
                type: "ssh",
                address: monitor.hostname!,
                port: monitor.port!,
              });

        const value =
          monitor.active &&
          typeof pe.lastHeartbeatMap?.[monitor.id]?.status === "number"
            ? pe.lastHeartbeatMap[monitor.id]!.status === 1
              ? "on"
              : "off"
            : undefined;

        return [key, value] satisfies [
          keyof UptimeMap,
          UptimeMap[keyof UptimeMap]
        ];
      })
  );
};

const sendToClient = (origin: string) => {
  const preparedData = prepareData();

  if (preparedData) {
    console.log("io: send from", origin);
    uptimeEventEmitter.emit("add", preparedData);
  }
};

export const uptimeRoutine = {
  updateDeviceFull: async ({
    netEntityMap,
    deviceList,
    instanceList,
    appList,
  }: Omit<GetDeviceFull, "agentMetadataList">) => {
    console.log("io: update device-full");
    let uptimeNetAccess = null as NetAccess | null;

    const mapApp = (net: NetAccess, app: Pick<App, "slug" | "meta">) => {
      if (
        app.slug === "UPTIME_KUMA" &&
        net.type === "web" &&
        net.scope !== "lan"
      ) {
        uptimeNetAccess = net;
      }

      return {
        ...net,
        ...app.meta,
      };
    };

    const filter = ({ type, scope, address }: NetAccess) => {
      return type !== "address-only";
      // return (
      //   type === "web" // && scope === "dns-domain" // && address !== "home.assistant"
      // );
    };

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
                .filter(filter)
                .map((net) => ({ ...net, ...osMeta })),
              apps: Object.fromEntries(
                Object.entries(entity.apps)
                  .map(([key, app]) => {
                    const foundApp = appList.find(
                      (ap) => ap.parentId === entity.id && ap.slug === key
                    )!;

                    return [
                      key,
                      app.filter(filter).map((net) => mapApp(net, foundApp)),
                    ] as const;
                  })
                  .filter((v) => v[1].length > 0)
              ),
            },
          ] as const;
        })
        .filter((v) => v[1].os.length > 0 || Object.keys(v[1].apps).length > 0)
    );

    pe.netList = Object.values(hrefMap).flatMap((value) =>
      value.os.concat(...Object.values(value.apps).flatMap((app) => app))
    );

    if (!uptimeNetAccess) {
      console.log("io: uptime-kuma net-access not found");
      pe.socket?.disconnect();
      return;
    }

    if (pe.socket?.isConnected()) {
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

    pe.socket = createSocket(socketAddress);

    if (pe.started) {
      await uptimeRoutine.start();
    }
  },
  start: async () => {
    pe.started = true;
    console.log("io: start attempt");
    if (!pe.socket || !pe.netList?.length) {
      console.log("io: start cancelled - no socket or netList");
      return;
    }

    if (pe.socket.isConnected()) {
      console.log("io: start cancelled - already started");
      return prepareData();
    }

    pe.socket.on.disconnect((reason) => {
      console.log("io: disconnect -", reason);
      pe.socket?.disconnect();
      pe.started = false;
      delete pe.socket;
    });

    const process = async (
      monitorMap: Record<string, Monitor | undefined>,
      notificationList: Notification[]
    ) => {
      if (pe.processLock) {
        // console.log("io: main process already running");
        return;
      }
      console.log("io: main process");
      pe.processLock = true;

      onMonitorList.turnOff();

      const tag = await getTagOrAdd();

      const monitorListWithTag = (
        Object.values(monitorMap) as Monitor[]
      ).filter(
        (monitor) =>
          monitor.type === "group" ||
          monitor.tags?.some(({ tag_id }) => tag_id === tag?.id)
      );

      const notificationIDList = notificationList?.length
        ? {
            [String(notificationList[0].id)]: true,
          }
        : {};

      const monitorAddFns = pe
        .netList!.map((net) => {
          const monitor = monitorListWithTag.find((monitor) => {
            if (net.type === "web") {
              return monitor.type === "http" && monitor.url === net.href;
            } else {
              return (
                monitor.type === "port" &&
                monitor.hostname === net.address &&
                monitor.port === net.port
              );
            }
          });
          if (monitor) {
            return null;
          }

          return async (parent: number) => {
            console.log("io: add monitor", net.name, net.href);

            const namePart =
              net.scope === "lan"
                ? "by lan"
                : net.scope === "vpn"
                ? "by vpn"
                : net.scope === "wan"
                ? "by IP"
                : "";

            const monitorCommonProps = (
              net.type === "web"
                ? {
                    type: "http",
                    url: net.href,
                    name: [net.name, namePart].filter(Boolean).join(" "),
                    method: "GET",
                    expiryNotification: net.href.startsWith("https://"),
                    ignoreTls: net.href.startsWith("https://"),
                  }
                : {
                    type: "port",
                    port: net.port,
                    hostname: net.address,
                    name: [net.name, "SSH", namePart].filter(Boolean).join(" "),
                    method: "GET",
                  }
            ) satisfies Partial<Monitor>;

            const { monitorID } = await pe.socket!.emit.addMonitor({
              active: true,
              parent,
              ...monitorCommonProps,
              description: net.description,
              notificationIDList,
            });

            await pe.socket!.emit.addMonitorTag(tag.id, monitorID, "");
          };
        })
        .filter((fn) => fn !== null);

      console.log("io: monitors count to add", monitorAddFns.length);

      if (monitorAddFns.length > 0) {
        const groupMonitorId =
          monitorListWithTag.find(
            (monitor) => monitor.type === "group" && monitor.name === "Homenet"
          )?.id ??
          (
            await pe.socket!.emit.addMonitor({
              active: true,
              type: "group",
              name: "Homenet",
              description: "Monitors created by Homenet",
              method: "GET",
              notificationIDList,
            })
          ).monitorID;

        for (const fn of monitorAddFns) {
          await fn(groupMonitorId);
        }
        onMonitorList.turnOn();
        console.log("io: monitors add end -", monitorAddFns.length);
        pe.monitorMap = await pe.socket!.emit.getMonitorList();
      } else {
        onMonitorList.turnOn();
        pe.monitorMap = monitorMap;
      }

      pe.monitorMap = Object.fromEntries(
        Object.entries(pe.monitorMap).filter(([id, monitor]) =>
          monitor?.tags?.some(({ tag_id }) => tag_id === tag.id)
        )
      );

      if (pe.lastHeartbeatMap) {
        pe.lastHeartbeatMap = Object.fromEntries(
          Object.entries(pe.lastHeartbeatMap).filter(
            ([id, _]) => id in pe.monitorMap!
          )
        );
        pe.hearbeatReady = true;
      }

      pe.processLock = false;

      await sendToClient("process");
    };

    /**
     * First call after login (1)
     */
    const onMonitorList = pe.socket.on.monitorList(async (monitorMap) => {
      console.log("io: on.monitorList");
      if (pe.notificationList) {
        await process(monitorMap, pe.notificationList);
      }
    }, false);

    /**
     * First call after login (2)
     */
    const onNotificationList = pe.socket.on.notificationList(
      async (notificationList) => {
        console.log("io: on.notificationList");
        pe.notificationList = notificationList;

        if (!pe.monitorMap) {
          onMonitorList.turnOff();
          const monitorMap = await pe.socket!.emit.getMonitorList();
          onMonitorList.turnOn();

          await process(monitorMap, notificationList);
        }
        // else {
        //   await sendToClient("on.notificationList");
        // }
      },
      false
    );

    /**
     * First call after login (3)
     */
    const onHeartbeatList = pe.socket.on.heartbeatList((monitorIdStr, data) => {
      const monitorId = Number(monitorIdStr);

      const previousHeartbeat = pe.lastHeartbeatMap?.[monitorId];

      const lastHeartbeat = data[data.length - 1] as Heartbeat | undefined;
      pe.lastHeartbeatMap = {
        ...pe.lastHeartbeatMap,
        [monitorId]: lastHeartbeat,
      };

      if (!pe.monitorMap || !(monitorId in pe.monitorMap)) {
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
    }, false);

    /**
     * First call after login (4)
     */
    const onHeartbeat = pe.socket.on.heartbeat((data) => {
      const monitorId = data.monitorID;

      const previousHeartbeat = pe.lastHeartbeatMap?.[monitorId];

      const lastHeartbeat = data;
      pe.lastHeartbeatMap = {
        ...pe.lastHeartbeatMap,
        [monitorId]: lastHeartbeat,
      };

      if (!pe.monitorMap || !(monitorId in pe.monitorMap)) {
        return;
      }

      if (lastHeartbeat.status !== previousHeartbeat?.status) {
        sendToClient("on.heartbeat");
      }
    }, false);

    onMonitorList.turnOn();
    onNotificationList.turnOn();
    onHeartbeatList.turnOn();
    onHeartbeat.turnOn();

    await pe.socket.connect();
    await pe.socket.emit.login();
  },
  stop: () => {
    pe.socket?.disconnect();
  },
};
