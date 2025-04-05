import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { type AppRouter } from '../../../backend/src/trpc/router';

export const generateTrpc = () => createTRPCClient<AppRouter>({
    links: [
        httpBatchLink({
            url: 'http://code.lan:8081/api',
        }),
    ],
});

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

export type { AppRouter };
