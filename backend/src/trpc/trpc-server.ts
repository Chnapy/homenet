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

export const setupTRPCServer = async () => {
  const tRPCServer = fastify();

  tRPCServer.register(cors).register(fastifyTRPCPlugin, {
    prefix: "/api",
    trpcOptions: {
      router: appRouter,
      createContext,
      onError: (({ path, error }) => {
        // report to error monitoring
        console.error(`trpc: error in handler on path '${path}'`, error);
      }) satisfies HTTPErrorHandler<any, FastifyRequest>,
    },
  });

  tRPCServer.get("/api/agent/:os", getAgentByOSRoute);

  return new Promise<void>((resolve, reject) => {
    tRPCServer.listen(
      {
        host: "0.0.0.0",
        port: 8081,
      },
      (err, address) => {
        if (err) {
          tRPCServer.log.error(err);
          return reject(err);
        }

        console.log(`trpc: server listening at ${address}`);
        resolve();
      }
    );
  });
};
