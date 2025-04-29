import z from "zod";
import { openRootDB } from "../../db/db";
import {
  deviceUserMetadataSchema,
  openDeviceUserMetadataDB,
} from "../../db/device-user-metadata";
import { publicProcedure } from "../trpc";
import { openDeviceDB } from "../../db/device";
import { openAgentMetadataDB } from "../../db/agent-metadata";

export const removeDevice = publicProcedure
  .input(
    z.object({
      deviceId: z.string().min(1),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { deviceId } = input;

    const db = openRootDB();
    const deviceDB = openDeviceDB(db);
    const deviceUserMetadataDB = openDeviceUserMetadataDB(db);
    const agentMetadataDB = openAgentMetadataDB(db);

    await db.transaction(async () => {
      await Promise.all([
        deviceDB.remove(deviceId),
        deviceUserMetadataDB.remove(deviceId),
        Promise.all(
          agentMetadataDB
            .getKeys({ start: deviceId })
            .map((key) => agentMetadataDB.remove(key))
        ),
      ]);
    });

    ctx.res.header("invalidate-queries", [
      "getDevicesFull",
      "getDevicesUserMetadata",
    ]);
  });
