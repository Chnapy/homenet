import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "../trpc";

export const useDeviceUserMetadataMutation = () => {
  const trpc = useTRPC();

  return useMutation(trpc.updateDeviceUserMetadata.mutationOptions());
};
