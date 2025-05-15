import { GetDeviceFull } from "../../../trpc/procedures/get-devices-full";
import { NetAccess } from "../../../trpc/utils/get-net-entity-map";

export type NetList = ReturnType<typeof getNetList>;

export const getNetList = (
  {
    netEntityMap,
    deviceList,
    instanceList,
    appList,
  }: Omit<GetDeviceFull, "agentMetadataList">,
  filterFn: (item: NetAccess) => boolean
) => {
  const hrefMap = Object.fromEntries(
    Object.entries(netEntityMap)
      .map(([key, entity]) => {
        const osMeta = [...deviceList, ...instanceList].find(
          (instance) => instance.id === entity.id
        )?.meta!;

        return [
          key,
          {
            os: entity.os
              .filter(filterFn)
              .map((net) => ({ ...net, ...osMeta })),
            apps: Object.fromEntries(
              Object.entries(entity.apps)
                .map(([key, app]) => {
                  const foundApp = appList.find(
                    (ap) => ap.parentId === entity.id && ap.slug === key
                  )!;

                  return [
                    key,
                    app.filter(filterFn).map((net) => ({
                      ...net,
                      ...foundApp.meta,
                    })),
                  ] as const;
                })
                .filter((v) => v[1].length > 0)
            ),
          },
        ] as const;
      })
      .filter((v) => v[1].os.length > 0 || Object.keys(v[1].apps).length > 0)
  );

  return Object.values(hrefMap).flatMap((value) =>
    value.os.concat(...Object.values(value.apps).flatMap((app) => app))
  );
};
