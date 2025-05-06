import IterableEventEmitter, { on } from "events";
import { startUptimeRoutine, UptimeMap } from "../../uptime/uptime";
import { publicProcedure } from "../trpc";

export const uptimeEventEmitter = new IterableEventEmitter<{
  add: [uptimeMap: UptimeMap];
}>();

export const listenUptime = publicProcedure.subscription(async function* (
  opts
): AsyncGenerator<UptimeMap> {
  // console.log("SUBSCRIBE");

  yield await startUptimeRoutine();

  for await (const [data] of on(uptimeEventEmitter, "add", {
    signal: opts.signal,
  })) {
    //   console.log("event-data", data);
    const post = data as Parameters<typeof uptimeEventEmitter.emit<"add">>[1];
    yield post;
  }
});
