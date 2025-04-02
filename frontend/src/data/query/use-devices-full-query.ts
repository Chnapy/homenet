import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '../trpc';

export const useDevicesFullQuery = () => {
    const trpc = useTRPC();

    return useQuery(
        trpc.getDevicesFull.queryOptions()
    );
};
