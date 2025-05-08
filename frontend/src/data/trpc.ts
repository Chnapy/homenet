import { QueryClient } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  splitLink,
  TRPCClientError,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { type AppRouter } from "../../../backend/src/trpc/router";

export const generateTrpc = (queryClient: QueryClient) => {
  if (!import.meta.env.VITE_BACKEND_API) {
    throw new Error("Env VITE_BACKEND_API missing");
  }

  return createTRPCClient<AppRouter>({
    links: [
      splitLink({
        // uses the httpSubscriptionLink for subscriptions
        condition: (op) => op.type === "subscription",
        true: httpSubscriptionLink({
          url: import.meta.env.VITE_BACKEND_API,
        }),
        false: httpBatchLink({
          url: import.meta.env.VITE_BACKEND_API,
          fetch: async (input, init) => {
            const response = await fetch(input, init);

            if (response.ok) {
              const invalidateQueriesKeysRaw =
                response.headers.get("invalidate-queries");

              const invalidateQueriesKeys =
                !!invalidateQueriesKeysRaw &&
                invalidateQueriesKeysRaw
                  .split(" ")
                  .map((value) =>
                    value.split(",").filter((value) => value.trim())
                  );

              if (invalidateQueriesKeys) {
                await Promise.all(
                  invalidateQueriesKeys.map((queryKey) =>
                    queryClient.invalidateQueries({
                      queryKey: [queryKey],
                    })
                  )
                );
              }
            }

            return {
              body: response.body,
              json:
                response.ok &&
                response.headers.get("content-type")?.includes("json")
                  ? () => response.json()
                  : () => {
                      throw new TRPCClientError(response.statusText, {
                        meta: {
                          code: response.status,
                        },
                      });
                    },
            };
          },
        }),
      }),
    ],
  });
};

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();

export type { AppRouter };
