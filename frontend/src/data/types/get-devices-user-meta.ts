import { GetDevicesFull } from './get-devices-full';

export type DeviceUserMetaMap = GetDevicesFull[ 'deviceUserMetaMap' ];

export type DeviceUserMeta = DeviceUserMetaMap[ string ];

export type DeviceUserMetaType = DeviceUserMeta[ 'type' ];

export type DeviceUserMetaTheme = DeviceUserMeta[ 'theme' ];
