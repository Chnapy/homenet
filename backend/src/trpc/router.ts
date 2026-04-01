// import { getDB } from "./procedures/get-db";
import { getDevicesFull } from "./procedures/get-devices-full";
import { getDevicesUserMetadata } from "./procedures/get-devices-user-metadata";
import { listenUptime } from "./procedures/listen-uptime";
import { removeDevice } from "./procedures/remove-device";
import { updateDeviceUserMetadata } from "./procedures/update-device-user-metadata";
import { isPublicSafeMode } from './public-safe-mode';
import { router } from "./trpc";

const queries = {
  getDevicesFull,
  getDevicesUserMetadata,
  // getDB,
  listenUptime,
} as const;

const mutations = isPublicSafeMode()
  ? {} as never
  : {
    updateDeviceUserMetadata,
    removeDevice,
  } as const;

export const appRouter = router({
  ...queries,
  ...mutations,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
