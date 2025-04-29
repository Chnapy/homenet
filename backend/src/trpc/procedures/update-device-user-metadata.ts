import { openRootDB } from "../../db/db";
import {
  deviceUserMetadataSchema,
  openDeviceUserMetadataDB,
} from "../../db/device-user-metadata";
import { publicProcedure } from "../trpc";

export const updateDeviceUserMetadata = publicProcedure
  .use(async (opts) => {
    const { type, ctx, next } = opts;

    const result = await next();

    if (type !== "mutation") {
      return result;
    }

    ctx.res.header("Access-Control-Expose-Headers", "invalidate-queries");

    // if (meta?.invalidateQueries && result.ok) {
    //   ctx.res.header("Invalidate-Queries", meta.invalidateQueries);
    // }

    return result;
  })
  .input(deviceUserMetadataSchema)
  // .meta({ invalidateQueries: ["getDevicesFull", "foobar"] })
  .mutation(async ({ input, ctx }) => {
    const db = openRootDB();
    const deviceUserMetadataDB = openDeviceUserMetadataDB(db);

    await deviceUserMetadataDB.put(input.deviceId, input);

    ctx.res.header("invalidate-queries", ["getDevicesFull"]);
  });
