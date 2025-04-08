import { useDevicesFullQuery } from "../../../data/query/use-devices-full-query";

export const useNetEntityMap = () => {
  const { data, isLoading } = useDevicesFullQuery();

  return {
    data: data?.netEntityMap,
    isLoading,
  };
};
