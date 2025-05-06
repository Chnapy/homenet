import { App } from "../entities/app";
import { Instance } from "../entities/instance";

export type NetAccess = {
  type: "address-only" | "web" | "ssh";
  scope: "lan" | "wan" | "dns-domain" | "vpn";
  address: string;
  port?: number;
  ssl?: boolean;
  href: string;
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

const withAccessWebHref = (net: Omit<NetAccess, "href">): NetAccess => {
  const { address, ssl, port, type } = net;

  const getWebPort = () => {
    if (!port || (port === 80 && !ssl) || (port === 443 && ssl)) {
      return "";
    }

    return ":" + port;
  };

  const href =
    type === "ssh"
      ? `ssh ${address}${port && port !== 22 ? " -p " + port : ""}`
      : `${ssl ? "https" : "http"}://${address}${getWebPort()}`;

  return {
    ...net,
    href,
  };
};

export const getNetEntityMap = (
  deviceList: Instance[],
  instanceList: Instance[],
  appList: App[]
): NetEntityMap => {
  const entityList = [...deviceList, ...instanceList];

  const httpProxies = appList.flatMap((app) => app.reverseProxy);

  const getEntity = (entity: Instance): NetEntity => {
    const { lan } = entity;

    const id = entity.id;
    const entityApps = appList.filter((app) => app.parentId === id);

    const wan = entity.type === "DEVICE" ? entity.wan : undefined;

    const ddns = entity.type === "DEVICE" ? entity.ddns : undefined;

    const lanAliases = deviceList
      .flatMap((device) => device.dhcp ?? [])
      .filter((dhcpItem) => dhcpItem.address === lan)
      .map((dhcpItem) => dhcpItem.alias);

    const innerDomains = appList
      .flatMap((app) => app.reverseProxy)
      .filter((proxy) =>
        [lan, wan, ddns, ...lanAliases].includes(proxy.toAddress?.address)
      )
      .map((proxy) => proxy.fromDomain!.domain);

    const vpn = entityApps?.find((app) => app.slug === "WIREGUARD")?.vpnAddress;

    const asList: NetAccess[] = [
      withAccessWebHref({
        type: "address-only",
        scope: "lan",
        address: lan,
      }),
      ...(lanAliases ?? []).map(
        (alias): NetAccess =>
          withAccessWebHref({
            type: "address-only",
            scope: "lan",
            address: alias,
          })
      ),
      ...(wan
        ? [
            withAccessWebHref({
              type: "address-only",
              scope: "wan" as const,
              address: wan,
            }),
          ]
        : []),
      ...(ddns
        ? [
            withAccessWebHref({
              type: "address-only",
              scope: "dns-domain" as const,
              address: ddns,
            }),
          ]
        : []),
      ...(vpn
        ? [
            withAccessWebHref({
              type: "address-only",
              scope: "vpn" as const,
              address: vpn,
            }),
          ]
        : []),
    ];

    asList.sort(accessSortFn);

    const relatedHttpProxies = httpProxies.filter(({ toAddress }) => {
      return asList.some((addr) => addr.address === toAddress?.address);
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
                ({ toAddress }) =>
                  toAddress?.address === net.address &&
                  !!toAddress.ssl === !!web.ssl &&
                  (toAddress.port || 80) === (web.port || 80)
              )
            )
            .map(
              (proxy): NetAccess =>
                withAccessWebHref({
                  type: "web",
                  scope: "dns-domain",
                  address: proxy.fromDomain!.domain,
                  ssl: proxy.fromDomain!.ssl,
                })
            )
        ),

        // web
        ...webList.flatMap((web) =>
          asList.map(
            (net): NetAccess =>
              withAccessWebHref({
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
      ...getWebAccessList(entity.web),

      // ssh
      ...(entity.ssh
        ? asList.flatMap((net) =>
            entity.ssh!.ports.map(
              (port): NetAccess =>
                withAccessWebHref({
                  ...net,
                  type: "ssh",
                  port,
                })
            )
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
