import { uptimeEventEmitter } from "../trpc/procedures/listen-uptime";
import { createSocket } from "./create-socket";
import { Heartbeat, Monitor, Notification, Tag } from "./uptime-kuma-io-types";
import { uptimeSetup } from "./uptime-setup";

export type UptimeMap = Record<string, "on" | "off" | undefined>;

type PersistantEntities = {
  setupLock: boolean;

  socketAddress?: string;
  // socket?: ReturnType<typeof createSocket>;
  getUptimeMap?: (
    monitorMap: Record<string, Monitor>,
    lastHeartbeatMap: Record<number, Heartbeat | undefined>
  ) => UptimeMap;

  tag?: Tag;
  monitorMap?: Record<number, Monitor>;
  notificationList?: Notification[];
  lastHeartbeatMap?: Record<number, Heartbeat | undefined>;
  hearbeatReady: boolean;
};

const pe: PersistantEntities = {
  setupLock: false,
  hearbeatReady: false,
};

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

export const uptimeRoutine = {
  setup: async () => {
    console.log("io: setup uptime");
    if (pe.setupLock) {
      console.log("io: setup already running, abort");
      return;
    }
    pe.setupLock = true;

    try {
      const data = await uptimeSetup();
      if (!data) {
        // uptimeRoutine.stop();
        return;
      }

      const {
        socketAddress,
        homenetTag,
        monitorMap,
        notificationList,
        getUptimeMap,
      } = data;

      pe.socketAddress = socketAddress;
      pe.tag = homenetTag;
      pe.notificationList = notificationList;
      pe.monitorMap = monitorMap;
      pe.getUptimeMap = getUptimeMap;
    } catch (error) {
      console.error("io: setup error:", error);
    } finally {
      pe.setupLock = false;
      console.log("io: setup ended");
    }
  },
  start: async () => {
    if (!pe.socketAddress) {
      console.log("io: socket address not found, abort");
      return;
    }

    const socket = createSocket(pe.socketAddress);
    // pe.socket = socket;

    socket.on.disconnect((reason) => {
      console.log("io: disconnect -", reason);
      socket.disconnect();

      // delete pe.socket;
      pe.hearbeatReady = false;
    });

    /**
     * First call after login (1)
     */
    socket.on.monitorList(async (monitorMap) => {
      console.log("io: on.monitorList");
      pe.monitorMap = monitorMap;
      await sendToClient("on.monitorList");
    });

    /**
     * First call after login (2)
     */
    socket.on.notificationList(async (notificationList) => {
      console.log("io: on.notificationList");
      pe.notificationList = notificationList;
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
  },
  // stop: () => {
  //   pe.socket?.disconnect();
  // },
};
