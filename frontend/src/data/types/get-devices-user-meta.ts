import type { AppRouterOutputs } from '../trpc';

export type DevicesUserMetadata = AppRouterOutputs[ 'getDevicesUserMetadata' ];

export type DeviceUserMeta = DevicesUserMetadata[ string ];

export type DeviceUserMetaType = DeviceUserMeta[ "type" ];

export type DeviceUserMetaTheme = DeviceUserMeta[ "theme" ];
