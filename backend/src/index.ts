import cors from "@fastify/cors";
import { fastifyTRPCPlugin, FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import fastify from 'fastify';
import { AppRouter, appRouter } from './trpc/router';

const server = fastify()

server
    .register(cors)
    .register(fastifyTRPCPlugin, {
        prefix: '/api',
        trpcOptions: {
            router: appRouter,
            createContext: ({ req, res }) => ({ req, res }),
            onError({ path, error }) {
                // report to error monitoring
                console.error(`Error in tRPC handler on path '${path}':`, error);
            },
        } satisfies FastifyTRPCPluginOptions<AppRouter>[ 'trpcOptions' ],
    });

server.listen({ port: 8081 }, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1)
    }
    console.log(`Server listening at ${address}`)
});
