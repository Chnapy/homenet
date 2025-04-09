import { getDevicesFull } from "./procedures/get-devices-full";
import { router } from "./trpc";

export const appRouter = router({
  getDevicesFull,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
