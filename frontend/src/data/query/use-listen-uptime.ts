/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSubscription } from "@trpc/tanstack-react-query";
import { useTRPC, AppRouter } from "../trpc";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type OutputRaw = AppRouter["listenUptime"]["_def"]["$types"]["output"];

export type UptimeMap = OutputRaw extends AsyncIterable<infer O, any, any>
  ? O
  : OutputRaw;

const queryKey = ["listen-uptime"];

export const useListenUptime = () => {
  return useQuery<UptimeMap>({
    queryKey,
    queryFn: () => ({}),
    enabled: false,
    networkMode: "offlineFirst",
  });
};

export const useListenUptimeSubscribe = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useSubscription(
    trpc.listenUptime.subscriptionOptions(void 0, {
      onData: (data) => {
        queryClient.setQueryData(queryKey, data);
      },
    })
  );
};
