import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "../trpc";

export type DevicesFullQuery = NonNullable<
  ReturnType<typeof useDevicesFullQuery>["data"]
>;

export const useDevicesFullQuery = () => {
  const trpc = useTRPC();

  return useQuery(trpc.getDevicesFull.queryOptions());
};
