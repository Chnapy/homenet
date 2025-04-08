import { GetDevicesFull } from "./get-devices-full";

export type DeviceList = GetDevicesFull["deviceList"];
export type InstanceList = GetDevicesFull["instanceList"];
export type AppList = GetDevicesFull["appList"];
export type NetEntityMap = GetDevicesFull["netEntityMap"];

export type NetEntity = NetEntityMap[string];
export type NetAccess = NetEntity["asList"][number];

export type Device = DeviceList[number];

export type DeviceOSSlug = Device["os"];

export type DeviceDHCP = NonNullable<Device["dhcp"]>[number];

export type DeviceApp = AppList[number];

export type DeviceAppSlug = DeviceApp["slug"];

export type DeviceInstance = InstanceList[number];

export type DeviceInstanceType = DeviceInstance["type"];

export const isAppReverseProxy = (
  app: DeviceApp
): app is Extract<DeviceApp, { slug: "nginx" | "caddy" }> =>
  app.slug === "nginx" || app.slug === "caddy";
