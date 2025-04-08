import { getDeviceUserMetaMap } from "../device-user-meta/device-user-meta";
import { getDeviceInfos } from "../device/device";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  getDevicesFull: publicProcedure.query(async () => {
    const { deviceList, instanceList, appList, netEntityMap } =
      await getDeviceInfos();
    const deviceUserMetaMap = await getDeviceUserMetaMap();

    return {
      deviceUserMetaMap,
      deviceList,
      instanceList,
      appList,
      netEntityMap,
    };
  }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
