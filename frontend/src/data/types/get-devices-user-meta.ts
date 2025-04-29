import { DevicesUserMetadata } from "../query/use-devices-user-metadata";

export type DeviceUserMeta = DevicesUserMetadata[string];

export type DeviceUserMetaType = DeviceUserMeta["type"];

export type DeviceUserMetaTheme = DeviceUserMeta["theme"];
