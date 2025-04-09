import { DevicesFullQuery } from "../query/use-devices-full-query";

export type DeviceList = DevicesFullQuery["deviceList"];
export type InstanceList = DevicesFullQuery["instanceList"];
export type AppList = DevicesFullQuery["appList"];
export type NetEntityMap = DevicesFullQuery["netEntityMap"];

export type NetEntity = NetEntityMap[string];
export type NetAccess = NetEntity["asList"][number];

export type Device = DeviceList[number];

export type DeviceOSSlug = Device["os"];

export type DeviceDHCP = NonNullable<Device["dhcp"]>[number];

export type DeviceApp = AppList[number];

export type DeviceAppSlug = DeviceApp["slug"];

export type DeviceInstance = InstanceList[number];

export type DeviceInstanceType = DeviceInstance["type"];
