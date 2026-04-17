import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { generateTrpc, TRPCProvider } from "./trpc";
import { getStaticDevicesPath } from './query/use-devices-full-query';
import { getStaticMetadataPath } from './query/use-devices-user-metadata';

const withTrpc = !getStaticDevicesPath() || !getStaticMetadataPath();

export const DataProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [ queryClient ] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: withTrpc ? 60 * 1000 : Infinity,
          },
        },
      })
  );

  const [ trpcClient ] = React.useState(() => withTrpc ? generateTrpc(queryClient) : undefined);

  return (
    <QueryClientProvider client={queryClient}>
      {trpcClient
        ? <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {children}
        </TRPCProvider>
        : children}
    </QueryClientProvider>
  );
};
