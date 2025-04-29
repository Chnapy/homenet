import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "../trpc";

export const useRemoveDeviceMutation = () => {
  const trpc = useTRPC();

  return useMutation(trpc.removeDevice.mutationOptions());
};
