import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "../trpc";

export type DevicesUserMetadata = NonNullable<
  ReturnType<typeof useDevicesUserMetadata>["data"]
>;

export const useDevicesUserMetadata = () => {
  const trpc = useTRPC();

  return useQuery(trpc.getDevicesUserMetadata.queryOptions());
};
