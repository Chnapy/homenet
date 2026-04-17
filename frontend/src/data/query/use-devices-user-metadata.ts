import { useQuery } from "@tanstack/react-query";
import { env } from '../../env';
import { useTRPC } from "../trpc";
import { DevicesUserMetadata } from '../types/get-devices-user-meta';

const useTRPCDevicesUserMetadata = () => {
  const trpc = useTRPC();

  return useQuery(trpc.getDevicesUserMetadata.queryOptions());
};

export const getStaticMetadataPath = (): string => env.VITE_STATIC_METADATA_PATH ?? '';

const useStaticMetadataFullQuery: typeof useTRPCDevicesUserMetadata = () => {
  return useQuery({
    queryKey: [ getStaticMetadataPath() ],
    queryFn: () => fetch(getStaticMetadataPath()).then<DevicesUserMetadata>(res => res.json())
  });
};

export const useDevicesUserMetadata = getStaticMetadataPath()
  ? useStaticMetadataFullQuery
  : useTRPCDevicesUserMetadata;
