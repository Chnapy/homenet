import { useDevicesFullQuery } from '../../../data/query/use-devices-full-query';
import { Device, DeviceAppSlug, DeviceInstance, isAppReverseProxy } from '../../../data/types/get-devices';
import { NetAccess, useNetEntityMap } from './use-net-entity-map';

type AppNetAccess = NetAccess & {
    appSlug: DeviceAppSlug;
};

export type NetEntityAccess = {
    id: string;
    os: NetAccess[];
    apps: Record<DeviceAppSlug, AppNetAccess[]>;
};

export const useNetEntityAccessMap = () => {
    const devicesFullQuery = useDevicesFullQuery();

    const netEntityMapQuery = useNetEntityMap();

    const isLoading = devicesFullQuery.isLoading || netEntityMapQuery.isLoading;

    if (!devicesFullQuery.data || !netEntityMapQuery.data) {
        return {
            data: undefined,
            isLoading,
        };
    }

    const { deviceMap } = devicesFullQuery.data;

    const netEntityMap = netEntityMapQuery.data;

    const deviceList = Object.values(deviceMap);

    const httpProxies = [
        ...deviceList.flatMap(device => device.apps ?? []),
        ...deviceList.flatMap(device => device.instances ?? [])
            .flatMap(instance => instance.apps ?? []),
    ]
        .flatMap(app => isAppReverseProxy(app) && app.reverseProxy || []);

    const getEntityAccess = (payload: {
        type: 'device';
        entity: Device;
    } | {
        type: 'instance';
        entity: DeviceInstance;
        device: Device;
    }): NetEntityAccess => {

        const id = payload.entity.id;

        const netEntity = netEntityMap[ id ];

        const relatedHttpProxies = httpProxies
            .filter(({ to }) => {
                return netEntity.asList.some(addr => addr.address === to.address);
            });

        const getWebAccessList = (webList: {
            port?: number;
            ssl?: boolean;
        }[] = []): NetAccess[] => {
            return [
                // web by http-proxies
                ...webList.flatMap(web =>
                    netEntity.asList.flatMap((net) =>
                        relatedHttpProxies.filter(({ to }) => to.address === net.address
                            && !!to.ssl === !!web.ssl
                            && to.port === web.port
                        ))
                        .map((proxy): NetAccess => ({
                            type: 'web',
                            scope: 'dns-domain',
                            address: proxy.from.domain,
                            ssl: proxy.from.ssl,
                        }))
                ),

                // web
                ...webList.flatMap(web => netEntity.asList.map((net): NetAccess => ({
                    ...net,
                    type: 'web',
                    port: web.port,
                    ssl: web.ssl,
                }))),
            ]
        };

        const os: NetAccess[] = [
            ...('web' in payload.entity ? getWebAccessList(payload.entity.web) : []),

            // ssh
            ...('ssh' in payload.entity && payload.entity.ssh
                ? netEntity.asList.map((net): NetAccess => ({
                    ...net,
                    type: 'ssh',
                    port: 'ssh' in payload.entity ? payload.entity.ssh!.port : undefined,
                }))
                : []),
        ];

        const apps = (payload.entity.apps ?? []).reduce((acc, app) => {
            const web = 'web' in app && app.web || [];

            const accessList: AppNetAccess[] = getWebAccessList(web)
                .map((access): AppNetAccess => ({
                    appSlug: app.slug,
                    ...access,
                }));

            return {
                ...acc,
                [ app.slug ]: accessList,
            }
        }, {} as Record<DeviceAppSlug, AppNetAccess[]>);

        return {
            id,
            os,
            apps,
        };
    };

    const netEntityAccessList = deviceList.flatMap((device): NetEntityAccess[] => {
        return [
            getEntityAccess({
                type: 'device',
                entity: device,
            }),
            ...(device.instances ?? []).map((instance) => getEntityAccess({
                type: 'instance',
                entity: instance,
                device,
            }))
        ];
    });

    const netEntityAccessMap = Object.fromEntries(
        netEntityAccessList.map(netEntityAccess => [ netEntityAccess.id, netEntityAccess ])
    );

    return {
        data: netEntityAccessMap,
        isLoading,
    }
};
