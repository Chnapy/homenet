import { EventEmitter, on } from "events";
import { uptimeRoutine, UptimeMap } from "../../uptime/uptime";
import { publicProcedure } from "../trpc";

export const uptimeEventEmitter = new EventEmitter<{
  add: [uptimeMap: UptimeMap];
}>();

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
    // uptimeRoutine.stop();
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
    // uptimeRoutine.stop();
  }
});
