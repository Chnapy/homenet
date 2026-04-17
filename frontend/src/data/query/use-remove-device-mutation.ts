import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "../trpc";
import { getStaticDevicesPath } from './use-devices-full-query';

const useTRPCRemoveDeviceMutation = () => {
  const trpc = useTRPC();

  return useMutation(trpc.removeDevice.mutationOptions());
};

const useStaticRemoveDeviceMutation: typeof useTRPCRemoveDeviceMutation = () => {
  return useMutation({});
};

export const useRemoveDeviceMutation = getStaticDevicesPath()
  ? useStaticRemoveDeviceMutation
  : useTRPCRemoveDeviceMutation;
