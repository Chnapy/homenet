import { uptimeSetup } from "./setup/uptime-setup";
import { PersistantEntities, uptimeWatch } from "./watch/uptime-watch";

const pe: PersistantEntities = {
  setupLock: false,
  hearbeatReady: false,
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
        uptimeRoutine.stop();
        return;
      }

      const { socketAddress, monitorMap, getUptimeMap } = data;

      pe.socketAddress = socketAddress;
      pe.monitorMap = monitorMap;
      pe.getUptimeMap = getUptimeMap;
    } catch (error) {
      console.error("io: setup error:", error);
    } finally {
      pe.setupLock = false;
      console.log("io: setup ended");
    }
  },
  start: () => uptimeWatch(pe),
  stop: () => {
    pe.socket?.disconnect();
  },
};
