import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '../../../data/trpc';
import { Device } from '../../../data/types/get-devices';
import { InstanceContext } from '../../instance/provider/instance-provider';
import { DeviceContext } from '../provider/device-provider';

export type DeviceLike = Pick<Device, 'lan' | 'wan' | 'ddns' | 'apps'>;

export const useDeviceNetAddressList = () => {
    const { device } = DeviceContext.useValue();
    const instance = InstanceContext.useValueNullable();

    const deviceLike = instance ?? device;

    const trpc = useTRPC();
    const { data } = useQuery(
        trpc.getDevicesFull.queryOptions()
    );

    const deviceMap = data?.deviceMap;

    const netAddressList: {
        type: 'lan' | 'wan' | 'wan-domain' | 'vpn';
        value: string;
    }[] = [
            {
                type: 'lan',
                value: deviceLike.lan
            },
        ];

    if (!instance) {
        if (device.wan) {
            netAddressList.push({
                type: 'wan',
                value: device.wan
            });
        }

        if (device.ddns) {
            netAddressList.push({
                type: 'wan-domain',
                value: device.ddns
            });
        }
    }

    const vpnAddr = deviceLike.apps?.find(app => app.slug === 'wireguard')?.address;
    if (vpnAddr) {
        netAddressList.push({
            type: 'vpn',
            value: vpnAddr,
        });
    }

    const proxies = [
        ...Object.values(deviceMap ?? {})
            .flatMap(device => device.apps ?? []),
        ...instance?.apps ?? []
    ]
        .flatMap(app => app.slug === 'nginx' && app.reverseProxy || [])
        .filter(({ to }) => {
            return netAddressList.some(addr => addr.value === to.address);
        });

    // dhcp
    Object.values(deviceMap ?? {})
        .flatMap(device => device.dhcp ?? [])
        .filter(({ address }) => netAddressList.some(({ value }) => value === address))
        .forEach(({ alias }) => {
            netAddressList.push({
                type: 'lan',
                value: alias,
            })
        })

    const getAddressList = (): typeof netAddressList => {
        const deviceAccessList: typeof netAddressList = [
            ...netAddressList
        ];

        if (!instance && device.web) {
            proxies
                .filter(({ to }) => device.web?.some(web =>
                    to.address === device.lan
                    && to.port === web.port
                    && to.ssl === web.ssl
                ))
                .forEach(proxy => {
                    deviceAccessList.push({
                        type: 'wan-domain',
                        value: proxy.from.domain,
                    });
                });
        } else if (instance && instance.web) {
            proxies
                .filter(({ to }) => instance.web?.some(web =>
                    to.address === instance.lan
                    && to.port === web.port
                    && to.ssl === web.ssl
                ))
                .forEach(proxy => {
                    deviceAccessList.push({
                        type: 'wan-domain',
                        value: proxy.from.domain,
                    });
                });
        }

        return deviceAccessList
            .sort((a, b) => {
                const getTypeValue = (type: typeof a.type) => {
                    switch (type) {
                        case 'wan-domain':
                            return 0;
                        case 'wan':
                            return 10;
                        case 'lan':
                            return 20;
                        case 'vpn':
                            return 30;
                    }
                };

                const aTypeValue = getTypeValue(a.type);
                const bTypeValue = getTypeValue(b.type);

                if (aTypeValue === bTypeValue) {
                    return a.value > b.value ? -1 : 1;
                }

                return aTypeValue < bTypeValue ? -1 : 1;
            });
    };

    const getDirectAccess = (access: {
        type: 'web' | 'ssh'
        port?: number
        ssl?: boolean;
    }) => {
        return netAddressList
            .flatMap(({ type, value }) => {

                if (access.type === 'ssh') {
                    return [
                        {
                            type,
                            value: `ssh ${value}${access.port && access.port !== 22 ? ' -p ' + access.port : ''}`
                        }
                    ];
                }

                const proxiesAdressList: typeof netAddressList = proxies
                    .filter(({ to }) => to.address === value
                        && !!to.ssl === !!access.ssl
                        && to.port === access.port
                    )
                    .map(proxy => ({
                        type: 'wan-domain',
                        value: `${proxy.from.ssl ? 'https' : 'http'}://${proxy.from.domain}`
                    }));

                return [
                    {
                        type,
                        value: `${access.ssl ? 'https' : 'http'}://${value}${access.port ? ':' + access.port : ''}`
                    },
                    ...proxiesAdressList,
                ];
            })
            .sort((a, b) => {
                const getTypeValue = (type: typeof a.type) => {
                    switch (type) {
                        case 'wan-domain':
                            return 0;
                        case 'wan':
                            return 10;
                        case 'lan':
                            return 20;
                        case 'vpn':
                            return 30;
                    }
                };

                const aTypeValue = getTypeValue(a.type);
                const bTypeValue = getTypeValue(b.type);

                if (aTypeValue === bTypeValue) {
                    return a.value > b.value ? -1 : 1;
                }

                return aTypeValue < bTypeValue ? -1 : 1;
            });
    };

    return {
        getAddressList,
        getDirectAccess,
    };
};
