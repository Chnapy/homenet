import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { generateTrpc, TRPCProvider } from './trpc';

export const DataProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
            },
        },
    });

    const [ trpcClient ] = React.useState(generateTrpc);

    return (
        <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
                {children}
            </TRPCProvider>
        </QueryClientProvider>
    );
};
