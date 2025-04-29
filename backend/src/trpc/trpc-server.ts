import cors from "@fastify/cors";
import {
  CreateFastifyContextOptions,
  fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import { HTTPErrorHandler } from "@trpc/server/unstable-core-do-not-import";
import fastify, { FastifyRequest } from "fastify";
import { getAgentByOSRoute } from "./procedures/get-agent-by-os";
import { appRouter } from "./router";

export type Context = Awaited<ReturnType<typeof createContext>>;

const createContext = ({ req, res }: CreateFastifyContextOptions) => ({
  req,
  res,
});

export const setupTRPCServer = () => {
  const tRPCServer = fastify();

  tRPCServer.register(cors).register(fastifyTRPCPlugin, {
    prefix: "/api",
    trpcOptions: {
      router: appRouter,
      createContext,
      onError: (({ path, error }) => {
        // report to error monitoring
        console.error(`tRPC Error in handler on path '${path}':`, error);
      }) satisfies HTTPErrorHandler<any, FastifyRequest>,
    },
  });

  tRPCServer.get("/agent/:os", getAgentByOSRoute);

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
