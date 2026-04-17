import { useQuery } from "@tanstack/react-query";
import { env } from '../../env';
import { useTRPC } from "../trpc";
import { DevicesFullQuery } from '../types/get-devices';

const useTRPCDevicesFullQuery = () => {
  const trpc = useTRPC();

  return useQuery(trpc.getDevicesFull.queryOptions());
};

export const getStaticDevicesPath = (): string => env.VITE_STATIC_DEVICES_PATH ?? '';

const useStaticDevicesFullQuery: typeof useTRPCDevicesFullQuery = () => {
  return useQuery({
    queryKey: [ getStaticDevicesPath() ],
    queryFn: () => fetch(getStaticDevicesPath()).then<DevicesFullQuery>(res => res.json())
  });
};

export const useDevicesFullQuery = getStaticDevicesPath()
  ? useStaticDevicesFullQuery
  : useTRPCDevicesFullQuery;
