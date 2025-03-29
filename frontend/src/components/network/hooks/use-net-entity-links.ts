import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTRPC } from '../../../data/trpc';
import { DeviceAppSlug } from '../../../data/types/get-devices';
import { useNetEntityMap } from './use-net-entity-map';

type NetDeviceLink = {
    type: 'network' | 'link';
    from: {
        device: string;
        relatedApp?: DeviceAppSlug;
    };
    to: {
        device: string;
        relatedApp?: DeviceAppSlug;
    };
};

export type NetEntityLinks = {
    devicesLinks: NetDeviceLink[];
}

const getIPMask = (ip: string) => ip.split('.').slice(0, -1).join('.') + '.';

export const useNetEntityLinks = () => {
    const trpc = useTRPC();
    const devicesFull = useQuery(
        trpc.getDevicesFull.queryOptions()
    );

    const netEntityMap = useNetEntityMap();

    const isLoading = devicesFull.isLoading || netEntityMap.isLoading;

    return React.useMemo(() => {
        if (!devicesFull.data || !netEntityMap.data) {
            return {
                data: undefined,
                isLoading,
            };
        }

        const { deviceMap } = devicesFull.data;

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
                                return {
                                    type: 'network',
                                    from: {
                                        device: netEntity.id,
                                    },
                                    to: {
                                        device: entity.id,
                                    },
                                };
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
                                return {
                                    type: 'network',
                                    from: {
                                        device: netEntity.id,
                                        relatedApp: 'wireguard',
                                    },
                                    to: {
                                        device: entity.id,
                                        relatedApp: 'wireguard',
                                    },
                                };
                            })
                    );
                }

                const reverseProxy = device.apps?.find(app => app.slug === 'nginx')?.reverseProxy;

                // http reverse proxy
                if (reverseProxy?.length) {
                    links.push(
                        ...reverseProxy.map(proxy => {
                            return netEntityList.find(entity => [
                                entity.lan, ...(entity.lanAliases ?? []), entity.wan, entity.ddns,
                            ].includes(proxy.to.address)
                            );
                        })
                            .filter(Boolean)
                            .map((entity): NetDeviceLink => ({
                                type: 'link',
                                from: {
                                    device: netEntity.id,
                                    relatedApp: 'nginx',
                                },
                                to: {
                                    device: entity!.id,
                                },
                            }))
                    );
                }

                // moonlight -> sunshine
                if (device.apps?.some(app => app.slug === 'moonlight')) {
                    links.push(
                        ...entityList
                            .filter(device => device.apps?.some(app => app.slug === 'sunshine'))
                            .map((device): NetDeviceLink => ({
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
    }, [ devicesFull.data, netEntityMap.data, isLoading ]);
};
