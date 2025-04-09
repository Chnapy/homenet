import { prepareDBToOpen } from "./db";

export type DeviceUserMetadata = {
  deviceId: string;
  // agentAddress?: string;
  name?: string;
  type?: "server" | "router" | "mediacenter" | "desktop" | "cloud";
  theme: "default" | "mauve" | "blue" | "green" | "yellow";
};

export const openDeviceUserMetadataDB = prepareDBToOpen<DeviceUserMetadata>(
  "device-user-metadata"
);
