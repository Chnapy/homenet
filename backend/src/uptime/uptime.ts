import { App } from "../trpc/entities/app";
import { Meta } from "../trpc/entities/utils/meta";
import { GetDeviceFull } from "../trpc/procedures/get-devices-full";
import { uptimeEventEmitter } from "../trpc/procedures/listen-uptime";
import { NetAccess } from "../trpc/utils/get-net-entity-map";
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
};

const pe: PersistantEntities = {
  started: false,
  hearbeatReady: false,
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

const sendToClient = async () => {
  if (
    !pe.hearbeatReady ||
    !pe.tag ||
    !pe.monitorMap ||
    !pe.notificationList ||
    !pe.lastHeartbeatMap
  ) {
    return;
  }

  const monitorsAfterUpdate = Object.fromEntries(
    Object.values(pe.monitorMap)
      .filter((monitor): monitor is Monitor =>
        Boolean(
          monitor?.url &&
            monitor.tags?.some(({ tag_id }) => tag_id === pe.tag!.id)
        )
      )
      .map(
        (monitor) =>
          [
            monitor.url!,
            monitor.active &&
            typeof pe.lastHeartbeatMap?.[monitor.id]?.status === "number"
              ? pe.lastHeartbeatMap[monitor.id]!.status === 1
                ? "on"
                : "off"
              : undefined,
          ] satisfies [keyof UptimeMap, UptimeMap[keyof UptimeMap]]
      )
  );

  uptimeEventEmitter.emit("add", monitorsAfterUpdate);
};

export const uptimeRoutine = {
  updateDeviceFull: ({
    netEntityMap,
    deviceList,
    instanceList,
    appList,
  }: Omit<GetDeviceFull, "agentMetadataList">) => {
    console.log("io: update device-full");
    let uptimeNetAccess = null as NetAccess | null;

    const mapApp = (net: NetAccess, app: Pick<App, "slug" | "meta">) => {
      if (app.slug === "UPTIME_KUMA") {
        uptimeNetAccess = net;
      }

      return {
        ...net,
        ...app.meta,
      };
    };

    const filter = ({ type, scope, address }: NetAccess) => {
      return (
        type === "web" && scope === "dns-domain" // && address !== "home.assistant"
      );
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

    const socketAddress = `wss://${uptimeNetAccess.address}`;

    pe.socket = createSocket(socketAddress);

    if (pe.started) {
      return uptimeRoutine.start();
    }
  },
  start: async () => {
    pe.started = true;
    console.log("io: start attempt");
    if (!pe.socket || !pe.netList) {
      console.log("io: start cancelled - no socket or netList");
      return;
    }

    if (pe.socket.isConnected()) {
      console.log("io: start cancelled - already started");
      await sendToClient();
      return;
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
      console.log("io: main process");

      const monitorList = Object.values(monitorMap);

      const tag = await getTagOrAdd();

      const monitorAddFns = pe
        .netList!.map((net) => {
          const monitor = monitorList.find(
            (monitor) =>
              monitor?.url === net.href &&
              monitor.tags?.some(({ tag_id }) => tag_id === tag?.id)
          );
          if (monitor) {
            return null;
          }

          return async () => {
            console.log("io: add monitor", net.name, net.href);
            const notificationIDList = notificationList?.length
              ? {
                  [String(notificationList[0].id)]: true,
                }
              : {};

            const { monitorID } = await pe.socket!.emit.addMonitor({
              active: true,
              name: net.name,
              description: "Created by Homenet",
              url: net.href,
              type: "http",
              method: "GET",
              expiryNotification: net.href.startsWith("https://"),
              maxretries: 2,
              notificationIDList,

              interval: 60,
              retryInterval: 60,
              resendInterval: 0,
              timeout: 48,
              ignoreTls: false,
              upsideDown: false,
              packetSize: 56,
              maxredirects: 10,
              accepted_statuscodes: ["200-299"],
              dns_resolve_type: "A",
              dns_resolve_server: "1.1.1.1",
              oauth_auth_method: "client_secret_basic",
              httpBodyEncoding: "json",
              kafkaProducerBrokers: [],
              kafkaProducerSaslOptions: {
                mechanism: "None",
              },
              kafkaProducerSsl: false,
              kafkaProducerAllowAutoTopicCreation: false,
              gamedigGivenPortOnly: true,
            });

            await pe.socket!.emit.addMonitorTag(tag.id, monitorID, "");
          };
        })
        .filter((fn) => fn !== null);

      console.log("io: monitors count to add", monitorAddFns.length);

      if (monitorAddFns.length > 0) {
        onMonitorList.turnOff();
        for (const fn of monitorAddFns) {
          await fn();
        }
        pe.monitorMap = await pe.socket!.emit.getMonitorList();
        onMonitorList.turnOn();
      } else {
        pe.monitorMap = monitorMap;
      }
      pe.monitorMap = Object.fromEntries(
        Object.entries(pe.monitorMap).filter(([id, monitor]) =>
          monitor?.tags?.some(({ tag_id }) => tag_id === tag.id)
        )
      );
    };

    /**
     * First call after login (1)
     */
    const onMonitorList = pe.socket.on.monitorList(async (monitorMap) => {
      console.log("io: on.monitorList");
      if (pe.notificationList) {
        await process(monitorMap, pe.notificationList);
        await sendToClient();
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
        } else {
          await sendToClient();
        }
      },
      false
    );

    /**
     * First call after login (3)
     */
    const onHeartbeatList = pe.socket.on.heartbeatList((monitorIdStr, data) => {
      const monitorId = Number(monitorIdStr);

      if (!pe.monitorMap || !(monitorId in pe.monitorMap)) {
        return;
      }

      const previousHeartbeat = pe.lastHeartbeatMap?.[monitorId];

      const lastHeartbeat = data[data.length - 1] as Heartbeat | undefined;
      pe.lastHeartbeatMap = {
        ...pe.lastHeartbeatMap,
        [monitorId]: lastHeartbeat,
      };

      if (
        !pe.hearbeatReady &&
        monitorId === Math.max(...Object.keys(pe.monitorMap).map(Number))
      ) {
        pe.hearbeatReady = true;
        sendToClient();
      } else if (
        lastHeartbeat &&
        lastHeartbeat.status !== previousHeartbeat?.status
      ) {
        sendToClient();
      }
    }, false);

    /**
     * First call after login (4)
     */
    const onHeartbeat = pe.socket.on.heartbeat((data) => {
      const monitorId = data.monitorID;

      if (!pe.monitorMap || !(monitorId in pe.monitorMap)) {
        return;
      }

      const previousHeartbeat = pe.lastHeartbeatMap?.[monitorId];

      const lastHeartbeat = data;
      pe.lastHeartbeatMap = {
        ...pe.lastHeartbeatMap,
        [monitorId]: lastHeartbeat,
      };

      if (lastHeartbeat.status !== previousHeartbeat?.status) {
        sendToClient();
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
