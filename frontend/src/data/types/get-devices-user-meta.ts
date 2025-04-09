import { DevicesFullQuery } from "../query/use-devices-full-query";

export type DeviceUserMetaMap = DevicesFullQuery["deviceUserMetaMap"];

export type DeviceUserMeta = DeviceUserMetaMap[string];

export type DeviceUserMetaType = DeviceUserMeta["type"];

export type DeviceUserMetaTheme = DeviceUserMeta["theme"];
