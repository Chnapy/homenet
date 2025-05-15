import {
  NetAccess,
  NetEntityMap,
} from "../../../trpc/utils/get-net-entity-map";

export const getSocketAddress = (
  netEntityMap: NetEntityMap,
  filterFn: (item: NetAccess) => boolean
) => {
  const uptimeNetAccess = Object.values(netEntityMap)
    .flatMap((entity) => entity.apps.UPTIME_KUMA ?? [])
    .filter(filterFn)
    .find((net) => net.type === "web" && net.scope !== "lan");

  if (!uptimeNetAccess) {
    console.log("io: uptime-kuma net-access not found");
    return;
  }

  return `${uptimeNetAccess.ssl ? "wss" : "ws"}://${uptimeNetAccess.address}${
    uptimeNetAccess.port &&
    uptimeNetAccess.port !== 80 &&
    uptimeNetAccess.port !== 443
      ? ":" + uptimeNetAccess.port
      : ""
  }`;
};
