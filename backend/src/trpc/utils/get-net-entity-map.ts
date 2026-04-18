import { AgentWebItem } from "../../grpc/generated/agent";
import { App } from "../entities/app";
import { Instance } from "../entities/instance";

type NetScope = "lan" | "wan" | "dns-domain" | "vpn";

type NetAccessAddressOnly = {
  type: "address-only";
  scope: NetScope;
  address: string;
};

export type NetAccess = {
  type: "web" | "ssh" | "grpc";
  scope: NetScope;
  address: string;
  port?: number;
  ssl?: boolean;
  path?: string;
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
  addressList: NetAccessAddressOnly[];
  os: NetAccess[];
  apps: Record<App["slug"], AppNetAccess[]>;
};

export type NetEntityMap = Record<string, NetEntity>;

const accessSortFn = (
  a: NetAccessAddressOnly,
  b: NetAccessAddressOnly
): number => {
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

  const aValue = getScopeValue(a.scope);
  const bValue = getScopeValue(b.scope);

  if (aValue === bValue) {
    return a.address > b.address ? -1 : 1;
  }

  return aValue < bValue ? -1 : 1;
};

export const getAccessHref = (net: Omit<NetAccess, "scope" | "href">) => {
  const { address, ssl, port, type, path } = net;

  switch (type) {
    case "web":
      const getWebPort = () => {
        if (!port || (port === 80 && !ssl) || (port === 443 && ssl)) {
          return "";
        }

        return ":" + port;
      };

      const getPath = () => {
        if (!path) {
          return "";
        }

        return path.startsWith("/") ? path : "/" + path;
      };

      return `${
        ssl ? "https" : "http"
      }://${address}${getWebPort()}${getPath()}`;
    case "ssh":
      return `ssh ${address}${port && port !== 22 ? " -p " + port : ""}`;
    case "grpc":
      return `${address}${port ? ":" + port : ""}`;
  }
};

const withAccessHref = (net: Omit<NetAccess, "href">): NetAccess => ({
  ...net,
  href: getAccessHref(net),
});

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

    const vpn = entityApps?.find((app) => app.vpnMode === "SERVER")?.vpnAddress;

    const addressList: NetAccessAddressOnly[] = [
      {
        type: "address-only",
        scope: "lan",
        address: lan,
      },
      ...(lanAliases ?? []).map(
        (alias): NetAccessAddressOnly => ({
          type: "address-only",
          scope: "lan",
          address: alias,
        })
      ),
      ...(wan
        ? [
            {
              type: "address-only",
              scope: "wan",
              address: wan,
            } satisfies NetAccessAddressOnly,
          ]
        : []),
      ...(ddns
        ? [
            {
              type: "address-only",
              scope: "dns-domain",
              address: ddns,
            } satisfies NetAccessAddressOnly,
          ]
        : []),
      ...(vpn
        ? [
            {
              type: "address-only",
              scope: "vpn",
              address: vpn,
            } satisfies NetAccessAddressOnly,
          ]
        : []),
    ];

    addressList.sort(accessSortFn);

    const relatedHttpProxies = httpProxies.filter(({ toAddress }) => {
      return addressList.some((addr) => addr.address === toAddress?.address);
    });

    const getWebAccessList = (webListRaw: AgentWebItem[]): NetAccess[] => {
      const webList = webListRaw.flatMap(
        ({
          port,
          ssl,
          paths,
        }): (Pick<AgentWebItem, "port" | "ssl"> & { path?: string })[] => {
          if (!paths?.length) {
            return [{ port, ssl, path: undefined }];
          }

          return paths.map((path) => ({ port, ssl, path }));
        }
      );

      return [
        // web by http-proxies
        ...webList.flatMap((web) =>
          addressList
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
                withAccessHref({
                  type: "web",
                  scope: "dns-domain",
                  address: proxy.fromDomain!.domain,
                  ssl: proxy.fromDomain!.ssl,
                  path: web.path,
                })
            )
        ),

        // web
        ...webList.flatMap((web) =>
          addressList.map(
            (net): NetAccess =>
              withAccessHref({
                ...net,
                type: "web",
                port: web.port,
                ssl: web.ssl,
                path: web.path,
              })
          )
        ),
      ];
    };

    const os: NetAccess[] = [
      ...getWebAccessList(entity.web),

      // ssh
      ...(entity.ssh
        ? addressList.flatMap((net) =>
            entity.ssh!.ports.map(
              (port): NetAccess =>
                withAccessHref({
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

      const accessList: AppNetAccess[] = [
        ...getWebAccessList(web),

        // gRPC
        ...(app.gRPC
          ? addressList.map((net) =>
              withAccessHref({
                ...net,
                type: "grpc",
                port: app.gRPC!.port,
              })
            )
          : []),
      ].map(
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
      addressList,
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
