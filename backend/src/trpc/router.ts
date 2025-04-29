import { getDB } from "./procedures/get-db";
import { getDevicesFull } from "./procedures/get-devices-full";
import { updateDeviceUserMetadata } from "./procedures/update-device-user-metadata";
import { router } from "./trpc";

export const appRouter = router({
  getDevicesFull,
  updateDeviceUserMetadata,

  getDB,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
