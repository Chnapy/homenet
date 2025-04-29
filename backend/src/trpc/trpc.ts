import { initTRPC } from "@trpc/server";
import { Context } from "./trpc-server";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC
  .context<Context>()
  // .meta<{ invalidateQueries?: string[] }>()
  .create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
