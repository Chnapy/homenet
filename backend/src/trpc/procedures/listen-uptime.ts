import { on } from "events";
import { UptimeMap } from "../../uptime/setup/utils/create-uptime-map-getter";
import { uptimeRoutine } from "../../uptime/uptime";
import { uptimeEventEmitter } from "../../uptime/uptime-event-emitter";
import { publicProcedure } from "../trpc";

export const listenUptime = publicProcedure.subscription(async function* (
  opts
): AsyncGenerator<UptimeMap> {
  console.log("listenUptime: subscription");

  const eventIterator = on(uptimeEventEmitter, "add", {
    signal: opts.signal,
  });

  try {
    const initialData = await uptimeRoutine.start();
    if (initialData) {
      yield initialData;
    }
  } catch (err) {
    console.error("listenUptime: uptimeRoutine start error", err);
    return;
  }

  try {
    for await (const [data] of eventIterator) {
      console.log("trpc: listenUptime - event", data);
      const uptimeMap = data as Parameters<
        typeof uptimeEventEmitter.emit<"add">
      >[1];
      yield uptimeMap;
    }
  } finally {
    uptimeRoutine.stop();
  }
});
