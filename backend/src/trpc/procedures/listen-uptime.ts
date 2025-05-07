import { EventEmitter, on } from "events";
import { uptimeRoutine, UptimeMap } from "../../uptime/uptime";
import { publicProcedure } from "../trpc";

export const uptimeEventEmitter = new EventEmitter<{
  add: [uptimeMap: UptimeMap];
}>();

export const listenUptime = publicProcedure.subscription(async function* (
  opts
): AsyncGenerator<UptimeMap> {
  const eventIterator = on(uptimeEventEmitter, "add", {
    signal: opts.signal,
  });

  await uptimeRoutine.start();

  try {
    for await (const [data] of eventIterator) {
      console.log("uptime", data);
      const uptimeMap = data as Parameters<
        typeof uptimeEventEmitter.emit<"add">
      >[1];
      yield uptimeMap;
    }
  } finally {
    uptimeRoutine.stop();
  }
});
