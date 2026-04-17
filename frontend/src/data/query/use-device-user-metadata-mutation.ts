import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "../trpc";
import { getStaticMetadataPath } from './use-devices-user-metadata';

const useTRPCDeviceUserMetadataMutation = () => {
  const trpc = useTRPC();

  return useMutation(trpc.updateDeviceUserMetadata.mutationOptions());
};

const useStaticDeviceUserMetadataMutation: typeof useTRPCDeviceUserMetadataMutation = () => {
  return useMutation({});
};

export const useDeviceUserMetadataMutation = getStaticMetadataPath()
  ? useStaticDeviceUserMetadataMutation
  : useTRPCDeviceUserMetadataMutation;
