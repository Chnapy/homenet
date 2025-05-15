import EventEmitter from "events";
import { UptimeMap } from "./setup/utils/create-uptime-map-getter";

export const uptimeEventEmitter = new EventEmitter<{
  add: [uptimeMap: UptimeMap];
}>();
