import cors from "@fastify/cors";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import fastify from "fastify";
import { AppRouter, appRouter } from "./router";

export const setupTRPCServer = () => {
  const tRPCServer = fastify();

  tRPCServer.register(cors).register(fastifyTRPCPlugin, {
    prefix: "/api",
    trpcOptions: {
      router: appRouter,
      createContext: ({ req, res }) => ({ req, res }),
      onError({ path, error }) {
        // report to error monitoring
        console.error(`tRPC Error in handler on path '${path}':`, error);
      },
    } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
  });

  tRPCServer.listen(
    {
      host: "0.0.0.0",
      port: 8081,
    },
    (err, address) => {
      if (err) {
        tRPCServer.log.error(err);
        process.exit(1);
      }

      console.log(`tRPC server listening at ${address}`);
    }
  );

  return tRPCServer;
};
