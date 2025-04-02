import { GetDevicesFull } from './get-devices-full';

export type DeviceMap = GetDevicesFull[ 'deviceMap' ];

export type Device = DeviceMap[ string ];

export type DeviceOSSlug = Device[ 'os' ];

export type DeviceDHCP = NonNullable<Device[ 'dhcp' ]>[ number ];

export type DeviceApp = NonNullable<Device[ 'apps' ]>[ number ];

export type DeviceAppSlug = DeviceApp[ 'slug' ];

export type DeviceInstance = NonNullable<Device[ 'instances' ]>[ number ];

export type DeviceInstanceType = DeviceInstance[ 'type' ];

export const isAppReverseProxy = (app: DeviceApp): app is Extract<DeviceApp, { slug: 'nginx' | 'caddy' }> =>
    app.slug === 'nginx' || app.slug === 'caddy';
