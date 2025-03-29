import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTRPC } from '../../../data/trpc';
import { Device, DeviceInstance } from '../../../data/types/get-devices';

export type NetAccess = {
    type: 'address-only' | 'web' | 'ssh';
    scope: 'lan' | 'wan' | 'dns-domain' | 'vpn';
    address: string;
    port?: number;
    ssl?: boolean;
};

export type NetEntity = {
    id: string;
    lan: string;
    lanAliases?: string[];
    wan?: string;
    ddns?: string;
    vpn?: string;
    innerDomains?: string[]
    asList: NetAccess[];
};

const accessSortFn = (a: NetAccess, b: NetAccess): number => {
    const getTypeValue = (scope: NetAccess[ 'type' ]) => {
        switch (scope) {
            case 'address-only':
                return 0;
            case 'web':
                return 100;
            case 'ssh':
                return 200;
        }
    };

    const getScopeValue = (scope: NetAccess[ 'scope' ]) => {
        switch (scope) {
            case 'dns-domain':
                return 0;
            case 'wan':
                return 10;
            case 'lan':
                return 20;
            case 'vpn':
                return 30;
        }
    };

    const aValue = getTypeValue(a.type) + getScopeValue(a.scope);
    const bValue = getTypeValue(b.type) + getScopeValue(b.scope);

    if (aValue === bValue) {
        return a.address > b.address ? -1 : 1;
    }

    return aValue < bValue ? -1 : 1;
}

export const useNetEntityMap = () => {
    const trpc = useTRPC();
    const { data, isLoading } = useQuery(
        trpc.getDevicesFull.queryOptions()
    );

    return React.useMemo(() => {

        if (!data) {
            return { data, isLoading };
        }

        const { deviceMap } = data;

        const deviceList = Object.values(deviceMap);

        const entityList = [
            ...deviceList,
            ...deviceList.flatMap(device => device.instances ?? []),
        ];

        const getEntity = (payload: {
            type: 'device';
            entity: Device;
        } | {
            type: 'instance';
            entity: DeviceInstance;
            device: Device;
        }): NetEntity => {
            const { lan } = payload.entity;

            const id = payload.entity.id;

            const wan = payload.type === 'device'
                ? payload.entity.wan
                : undefined;

            const ddns = payload.type === 'device'
                ? payload.entity.ddns
                : undefined;

            const lanAliases = deviceList
                .flatMap(device => device.dhcp ?? [])
                .filter(dhcpItem => dhcpItem.address === lan)
                .map(dhcpItem => dhcpItem.alias);

            const innerDomains = entityList
                .flatMap(device => device.apps?.flatMap(app => app.slug === 'nginx' && app.reverseProxy || []) ?? [])
                .filter(proxy => [
                    lan, wan, ddns, ...lanAliases
                ].includes(proxy.to.address))
                .map(proxy => proxy.from.domain);

            const vpn = payload.entity.apps?.find(app => app.slug === 'wireguard')
                ?.address;

            const asList: NetAccess[] = [
                {
                    type: 'address-only',
                    scope: 'lan',
                    address: lan,
                },
                ...(lanAliases ?? []).map((alias): NetAccess => ({
                    type: 'address-only',
                    scope: 'lan',
                    address: alias,
                })),
                ...wan ? [ {
                    type: 'address-only',
                    scope: 'wan' as const,
                    address: wan,
                } satisfies NetAccess ] : [],
                ...ddns ? [ {
                    type: 'address-only',
                    scope: 'dns-domain' as const,
                    address: ddns,
                } satisfies NetAccess ] : [],
                ...vpn ? [ {
                    type: 'address-only',
                    scope: 'vpn' as const,
                    address: vpn,
                } satisfies NetAccess ] : [],
            ];

            asList.sort(accessSortFn);

            return {
                id,
                lan,
                wan,
                ddns,
                vpn,
                lanAliases,
                innerDomains,
                asList,
            };
        };

        const netEntityList = deviceList.flatMap((device): NetEntity[] => {

            return [
                getEntity({
                    type: 'device',
                    entity: device,
                }),
                ...(device.instances ?? []).map((instance) => getEntity({
                    type: 'instance',
                    entity: instance,
                    device,
                }))
            ];
        });

        const netEntityMap = Object.fromEntries(
            netEntityList.map(netEntity => [ netEntity.id, netEntity ])
        );

        return {
            data: netEntityMap,
            isLoading,
        };
    }, [ data, isLoading ]);
};
