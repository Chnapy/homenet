import { App, Device, Instance } from "./device";

export type NetAccess = {
  type: "address-only" | "web" | "ssh";
  scope: "lan" | "wan" | "dns-domain" | "vpn";
  address: string;
  port?: number;
  ssl?: boolean;
};

type AppNetAccess = NetAccess & {
  appSlug: App["slug"];
};

export type NetEntity = {
  id: string;
  lan: string;
  lanAliases?: string[];
  wan?: string;
  ddns?: string;
  vpn?: string;
  innerDomains?: string[];
  asList: NetAccess[];
  os: NetAccess[];
  apps: Record<App["slug"], AppNetAccess[]>;
};

export type NetEntityMap = Record<string, NetEntity>;

const accessSortFn = (a: NetAccess, b: NetAccess): number => {
  const getTypeValue = (scope: NetAccess["type"]) => {
    switch (scope) {
      case "address-only":
        return 0;
      case "web":
        return 100;
      case "ssh":
        return 200;
    }
  };

  const getScopeValue = (scope: NetAccess["scope"]) => {
    switch (scope) {
      case "dns-domain":
        return 0;
      case "wan":
        return 10;
      case "lan":
        return 20;
      case "vpn":
        return 30;
    }
  };

  const aValue = getTypeValue(a.type) + getScopeValue(a.scope);
  const bValue = getTypeValue(b.type) + getScopeValue(b.scope);

  if (aValue === bValue) {
    return a.address > b.address ? -1 : 1;
  }

  return aValue < bValue ? -1 : 1;
};

const isAppReverseProxy = (
  app: App
): app is Extract<App, { slug: "nginx" | "caddy" }> =>
  app.slug === "nginx" || app.slug === "caddy";

export const getNetEntityMap = (
  deviceList: Device[],
  instanceList: Instance[],
  appList: App[]
): NetEntityMap => {
  const entityList = [...deviceList, ...instanceList];

  const httpProxies = appList.flatMap(
    (app) => (isAppReverseProxy(app) && app.reverseProxy) || []
  );

  const getEntity = (entity: Device | Instance): NetEntity => {
    const { lan } = entity;

    const id = entity.id;
    const entityApps = appList.filter((app) => app.parentId === id);

    const wan = entity.type === "device" ? entity.wan : undefined;

    const ddns = entity.type === "device" ? entity.ddns : undefined;

    const lanAliases = deviceList
      .flatMap((device) => device.dhcp ?? [])
      .filter((dhcpItem) => dhcpItem.address === lan)
      .map((dhcpItem) => dhcpItem.alias);

    const innerDomains = appList
      .flatMap((app) => (isAppReverseProxy(app) && app.reverseProxy) || [])
      .filter((proxy) =>
        [lan, wan, ddns, ...lanAliases].includes(proxy.to.address)
      )
      .map((proxy) => proxy.from.domain);

    const vpn = entityApps?.find((app) => app.slug === "wireguard")?.address;

    const asList: NetAccess[] = [
      {
        type: "address-only",
        scope: "lan",
        address: lan,
      },
      ...(lanAliases ?? []).map(
        (alias): NetAccess => ({
          type: "address-only",
          scope: "lan",
          address: alias,
        })
      ),
      ...(wan
        ? [
            {
              type: "address-only",
              scope: "wan" as const,
              address: wan,
            } satisfies NetAccess,
          ]
        : []),
      ...(ddns
        ? [
            {
              type: "address-only",
              scope: "dns-domain" as const,
              address: ddns,
            } satisfies NetAccess,
          ]
        : []),
      ...(vpn
        ? [
            {
              type: "address-only",
              scope: "vpn" as const,
              address: vpn,
            } satisfies NetAccess,
          ]
        : []),
    ];

    asList.sort(accessSortFn);

    const relatedHttpProxies = httpProxies.filter(({ to }) => {
      return asList.some((addr) => addr.address === to.address);
    });

    const getWebAccessList = (
      webList: {
        port?: number;
        ssl?: boolean;
      }[] = []
    ): NetAccess[] => {
      return [
        // web by http-proxies
        ...webList.flatMap((web) =>
          asList
            .flatMap((net) =>
              relatedHttpProxies.filter(
                ({ to }) =>
                  to.address === net.address &&
                  !!to.ssl === !!web.ssl &&
                  to.port === web.port
              )
            )
            .map(
              (proxy): NetAccess => ({
                type: "web",
                scope: "dns-domain",
                address: proxy.from.domain,
                ssl: proxy.from.ssl,
              })
            )
        ),

        // web
        ...webList.flatMap((web) =>
          asList.map(
            (net): NetAccess => ({
              ...net,
              type: "web",
              port: web.port,
              ssl: web.ssl,
            })
          )
        ),
      ];
    };

    const os: NetAccess[] = [
      ...("web" in entity ? getWebAccessList(entity.web) : []),

      // ssh
      ...("ssh" in entity && entity.ssh
        ? asList.map(
            (net): NetAccess => ({
              ...net,
              type: "ssh",
              port: "ssh" in entity ? entity.ssh!.port : undefined,
            })
          )
        : []),
    ];

    const apps = entityApps.reduce((acc, app) => {
      const web = ("web" in app && app.web) || [];

      const accessList: AppNetAccess[] = getWebAccessList(web).map(
        (access): AppNetAccess => ({
          appSlug: app.slug,
          ...access,
        })
      );

      return {
        ...acc,
        [app.slug]: accessList,
      };
    }, {} as Record<App["slug"], AppNetAccess[]>);

    return {
      id,
      lan,
      wan,
      ddns,
      vpn,
      lanAliases,
      innerDomains,
      asList,
      os,
      apps,
    };
  };

  const netEntityList = entityList.map(getEntity);

  const netEntityMap = Object.fromEntries(
    netEntityList.map((netEntity) => [netEntity.id, netEntity])
  );

  return netEntityMap;
};
