import { App } from "../trpc/entities/app";
import { Instance } from "../trpc/entities/instance";
import { getDevicesFull } from "../trpc/procedures/get-devices-full";
import { uptimeEventEmitter } from "../trpc/procedures/listen-uptime";
import { NetAccess } from "../trpc/utils/get-net-entity-map";
import { UptimeKumaDB } from "./uptime-kuma-db";

export type UptimeMap = Record<string, "on" | "off" | undefined>;

let currentTimeout: NodeJS.Timeout | null = null;

export const startUptimeRoutine = () => {
  if (!currentTimeout) {
    currentTimeout = setInterval(async () => {
      console.log(
        "listeners 'add' count",
        uptimeEventEmitter.listenerCount("add")
      );

      if (uptimeEventEmitter.listenerCount("add") === 0 && currentTimeout) {
        clearInterval(currentTimeout);
        currentTimeout = null;
      }

      const data = await setupUptime();
      uptimeEventEmitter.emit("add", data);
    }, 30_000);
  }

  return setupUptime();
};

export const setupUptime = async (): Promise<UptimeMap> => {
  const { netEntityMap, deviceList, instanceList, appList } =
    await getDevicesFull({
      ctx: {},
      getRawInput: async () => null,
      path: "",
      signal: undefined,
      type: "query",
    });

  const filter = ({ type, scope, address }: NetAccess) => {
    return (
      type === "web" && scope === "dns-domain" // && address !== "home.assistant"
    );
  };

  const mapOS = (net: NetAccess, slug: Instance["os"]) => {
    return {
      ...net,
      ...getOSMeta(slug),
    };
  };

  const mapApp = (net: NetAccess, app: App) => {
    return {
      ...net,
      ...getAppMeta(app),
    };
  };

  const hrefMap = Object.fromEntries(
    Object.entries(netEntityMap)
      .map(([key, entity]) => {
        const osSlug = [...deviceList, ...instanceList].find(
          (instance) => instance.id === entity.id
        )?.os!;

        return [
          key,
          {
            os: entity.os.filter(filter).map((net) => mapOS(net, osSlug)),
            apps: Object.fromEntries(
              Object.entries(entity.apps)
                .map(([key, app]) => {
                  const appp = appList.find(
                    (ap) => ap.parentId === entity.id && ap.slug === key
                  )!;

                  return [
                    key,
                    app.filter(filter).map((net) => mapApp(net, appp)),
                  ] as const;
                })
                .filter((v) => v[1].length > 0)
            ),
          },
        ] as const;
      })
      .filter((v) => v[1].os.length > 0 || Object.keys(v[1].apps).length > 0)
  );

  const hrefList = Object.values(hrefMap).flatMap((value) =>
    value.os.concat(...Object.values(value.apps).flatMap((app) => app))
  );

  const db = new UptimeKumaDB("uptime-data/kuma.db");

  const getTag = async () => {
    const foundTag = await db.getTagByName("homenet");
    if (foundTag) {
      return foundTag;
    }

    await db.createTag({
      name: "homenet",
      color: "#059669",
    });

    return (await db.getTagByName("homenet"))!;
  };

  const tag = await getTag();

  const notificationList = await db.getNotifications();

  const monitors = await db.getHomenetMonitors();

  await Promise.all(
    hrefList.map(async (net) => {
      const monitor = monitors.find((m) => m.url === net.href);
      if (monitor) {
        return monitor;
      }

      const createdMonitorId = await db.createMonitor({
        name: net.name,
        url: net.href,
        type: "http",
        method: "GET",
        expiry_notification: net.href.startsWith("https://"),
        maxretries: 2,
      });

      await db.createMonitorTagAssositation({
        monitor_id: createdMonitorId,
        tag_id: tag.id,
        value: "",
      });

      if (notificationList.length > 0) {
        await db.createMonitorNotificationAssositation({
          monitor_id: createdMonitorId,
          notification_id: notificationList[0].id,
        });
      }

      console.log("Monitor created for href", net.href);
    })
  );

  const monitorsAfterUpdate = await db.getHomenetMonitors();

  await db.close();

  console.log(
    "DB infos",
    monitorsAfterUpdate.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      url: m.url,
      method: m.method,

      status: m.status,
      duration: m.duration,
      msg: m.msg,
    }))
    // JSON.stringify(hrefList, undefined, 2)
    // await db.temp()
    // await db.mapTables()
  );

  return Object.fromEntries(
    monitorsAfterUpdate.map(
      (monitor) =>
        [
          monitor.url!,
          typeof monitor.status === "number"
            ? monitor.status === 1
              ? "on"
              : "off"
            : undefined,
        ] satisfies [keyof UptimeMap, UptimeMap[keyof UptimeMap]]
    )
  );
};

const getOSMeta = (
  slug: Instance["os"]
): {
  name: string;
  description: string;
} => {
  switch (slug) {
    case "UNRECOGNIZED":
    case "UNKNOWN_OS":
      return {
        name: "Unknown", // TODO
        description: "Unknown",
      };
    case "OPENWRT_GLINET":
      return {
        name: "OpenWRT & Gl.inet",
        description: "OS as router",
      };
    case "PROXMOX":
      return {
        name: "Proxmox",
        description: "OS as VE",
      };
    case "HAOS":
      return {
        name: "Home Assistant",
        description: "OS",
      };
    case "ANDROID_TV":
      return {
        name: "Android TV",
        description: "OS",
      };
    case "WINDOWS":
      return {
        name: "Windows",
        description: "OS",
      };
    case "DEBIAN":
      return {
        name: "Debian",
        description: "OS",
      };
  }
};

const getAppMeta = (
  app: App
): {
  name: string;
  description: string;
} => {
  switch (app.slug) {
    case "UNRECOGNIZED":
    case "UNKNOWN_APP":
      return {
        name: "Unknown", // TODO
        description: "Unknown app",
      };
    case "HOMENET":
      return {
        name: "Homenet",
        description: "Home network centralizer",
      };
    case "WIREGUARD":
      return {
        name: `Wireguard`,
        description: app.vpnMode === "SERVER" ? "VPN Server" : "VPN Client",
      };
    case "NGINX":
      return {
        name: `Nginx`,
        description: "Web server",
      };
    case "ADGUARD_HOME":
      return {
        name: `AdGuard Home`,
        description: "Ad blocker",
      };
    case "NODE_RED":
      return {
        name: "Node RED",
        description: "Low code flows",
      };
    case "ZIGBEE2MQTT":
      return {
        name: "Zigbee2MQTT",
        description: "Zigbee IoT bridge",
      };
    case "DOCKER":
      return {
        name: "Docker",
        description: "Containers",
      };
    case "DOCKER_REGISTRY":
      return {
        name: "Docker registry",
        description: "Images registry",
      };
    case "PLEX":
      return {
        name: "Plex",
        description: "Media server",
      };
    case "MOONLIGHT":
      return {
        name: "Moonlight",
        description: "Game streaming client",
      };
    case "SUNSHINE":
      return {
        name: "Sunshine",
        description: "Game streaming host",
      };
    case "CADDY":
      return {
        name: "Caddy",
        description: "Web server with auto https",
      };
    case "UPTIME_KUMA":
      return {
        name: "Uptime Kuma",
        description: "Monitoring services uptime",
      };
    case "NTFY":
      return {
        name: "Ntfy",
        description: "Notification service",
      };
    case "CODE_SERVER":
      return {
        name: "VS Code",
        description: "code-server",
      };
  }
};
