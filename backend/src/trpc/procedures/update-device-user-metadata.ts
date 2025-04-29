import { openRootDB } from "../../db/db";
import {
  deviceUserMetadataSchema,
  openDeviceUserMetadataDB,
} from "../../db/device-user-metadata";
import { publicProcedure } from "../trpc";

export const updateDeviceUserMetadata = publicProcedure
  .input(deviceUserMetadataSchema)
  // .meta({ invalidateQueries: ["getDevicesFull", "foobar"] })
  .mutation(async ({ input, ctx }) => {
    const db = openRootDB();
    const deviceUserMetadataDB = openDeviceUserMetadataDB(db);

    await deviceUserMetadataDB.put(input.deviceId, input);

    ctx.res.header("invalidate-queries", [
      "getDevicesFull",
      "getDevicesUserMetadata",
    ]);
  });
