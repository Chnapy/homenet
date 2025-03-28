import { getDeviceUserMetaMap } from '../device-user-meta/device-user-meta';
import { getDeviceMap } from '../device/device';
import { publicProcedure, router } from './trpc';

export const appRouter = router({
    getDevicesFull: publicProcedure
        .query(async () => {
            const deviceMap = await getDeviceMap();
            const deviceUserMetaMap = await getDeviceUserMetaMap();

            return {
                deviceMap,
                deviceUserMetaMap,
            };
        }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
