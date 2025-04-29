import z from "zod";
import { prepareDBToOpen } from "./db";

export type DeviceUserMetadata = z.infer<typeof deviceUserMetadataSchema>;

export const deviceUserMetadataSchema = z.object({
  deviceId: z.string().min(1),
  name: z.string().min(1).optional(),
  type: z
    .enum(["server", "router", "mediacenter", "desktop", "cloud"])
    .optional(),
  theme: z.enum(["default", "mauve", "blue", "green", "yellow"]),
});

export const openDeviceUserMetadataDB = prepareDBToOpen<DeviceUserMetadata>(
  "device-user-metadata"
);
