import React from 'react';
import { useDevicesFullQuery } from '../../../data/query/use-devices-full-query';
import { DeviceAppSlug, isAppReverseProxy } from '../../../data/types/get-devices';
import { useNetEntityMap } from './use-net-entity-map';

type NetDeviceLink = {
    id: string;
    type: 'network' | 'link';
    from: {
        device: string;
        relatedApp?: DeviceAppSlug;
    };
    to: {
        device: string;
        relatedApp?: DeviceAppSlug;
    };
    label?: string;
};

export type NetEntityLinks = {
    devicesLinks: NetDeviceLink[];
}

export const getIPMask = (ip: string) => ip.split('.').slice(0, -1).join('.') + '.';

const injectLinkId = (link: Omit<NetDeviceLink, 'id'>): NetDeviceLink => {
    const id = `${link.from.device}_${link.from.relatedApp}-${link.to.device}_${link.to.relatedApp}-${link.label}`;

    return { ...link, id };
};

export const useNetEntityLinks = () => {
    const devicesFullQuery = useDevicesFullQuery();

    const netEntityMap = useNetEntityMap();

    const isLoading = devicesFullQuery.isLoading || netEntityMap.isLoading;

    return React.useMemo(() => {
        if (!devicesFullQuery.data || !netEntityMap.data) {
            return {
                data: undefined,
                isLoading,
            };
        }

        const { deviceMap } = devicesFullQuery.data;

        const entityList = Object.values(deviceMap)
            .flatMap(device => [ device, ...device.instances ?? [] ]);

        const entityMap = Object.fromEntries(
            entityList.map(entity => [ entity.id, entity ])
        );

        const netEntityList = Object.values(netEntityMap.data);

        const devicesLinks: NetDeviceLink[] = netEntityList
            .flatMap(netEntity => {
                const device = entityMap[ netEntity.id ];

                const links: NetDeviceLink[] = [];

                // router local network
                if (netEntity.wan) {
                    const lanMask = getIPMask(netEntity.lan);

                    links.push(
                        ...netEntityList
                            .filter(entity => entity.lan !== netEntity.lan
                                && entity.lan.startsWith(lanMask))
                            .map((entity): NetDeviceLink => {
                                return injectLinkId({
                                    type: 'network',
                                    from: {
                                        device: netEntity.id,
                                    },
                                    to: {
                                        device: entity.id,
                                    },
                                    label: entity.lan,
                                });
                            })
                    );
                }

                const wireguardServer = netEntity.vpn && device.apps
                    ?.find(app => app.slug === 'wireguard' && app.mode === 'server');

                // vpn server network
                if (netEntity.vpn && wireguardServer) {
                    const vpnMask = getIPMask(netEntity.vpn);

                    links.push(
                        ...netEntityList
                            .filter(entity => entity.vpn
                                && entity.vpn !== netEntity.vpn
                                && entity.vpn.startsWith(vpnMask))
                            .map((entity): NetDeviceLink => {
                                return injectLinkId({
                                    type: 'network',
                                    from: {
                                        device: netEntity.id,
                                        relatedApp: 'wireguard',
                                    },
                                    to: {
                                        device: entity.id,
                                        relatedApp: 'wireguard',
                                    },
                                    label: entity.vpn,
                                });
                            })
                    );
                }

                const reverseProxyApp = device.apps?.find(isAppReverseProxy);

                // http reverse proxy
                if (reverseProxyApp?.reverseProxy?.length) {
                    links.push(
                        ...reverseProxyApp.reverseProxy.map(proxy => {
                            const entity = netEntityList.find(entity => [
                                entity.lan, ...(entity.lanAliases ?? []), entity.wan, entity.ddns,
                            ].includes(proxy.to.address)
                            );

                            return {
                                proxy,
                                entity,
                            };
                        })
                            .filter(obj => obj.entity)
                            .map(({ proxy, entity }): NetDeviceLink => injectLinkId({
                                type: 'link',
                                from: {
                                    device: netEntity.id,
                                    relatedApp: reverseProxyApp.slug,
                                },
                                to: {
                                    device: entity!.id,
                                },
                                label: proxy.from.domain,
                            }))
                    );
                }

                // moonlight -> sunshine
                if (device.apps?.some(app => app.slug === 'moonlight')) {
                    links.push(
                        ...entityList
                            .filter(device => device.apps?.some(app => app.slug === 'sunshine'))
                            .map((device): NetDeviceLink => injectLinkId({
                                type: 'link',
                                from: {
                                    device: netEntity.id,
                                    relatedApp: 'moonlight',
                                },
                                to: {
                                    device: device.id,
                                    relatedApp: 'sunshine',
                                },
                            }))
                    );
                }

                return links;
            });

        return {
            data: devicesLinks,
            isLoading,
        };
    }, [ devicesFullQuery.data, netEntityMap.data, isLoading ]);
};
