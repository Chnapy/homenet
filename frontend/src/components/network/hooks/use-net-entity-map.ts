import { useDevicesFullQuery } from "../../../data/query/use-devices-full-query";

export type NetEntityMap = NonNullable<
  ReturnType<typeof useNetEntityMap>["data"]
>;

export const useNetEntityMap = () => {
  const { data, isLoading } = useDevicesFullQuery();

  return {
    data: data?.netEntityMap,
    isLoading,
  };
};
