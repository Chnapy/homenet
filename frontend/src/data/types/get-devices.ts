import type { AppRouterOutputs } from '../trpc';

export type DevicesFullQuery = AppRouterOutputs[ 'getDevicesFull' ];

export type DeviceList = DevicesFullQuery[ "deviceList" ];
export type InstanceList = DevicesFullQuery[ "instanceList" ];
export type AppList = DevicesFullQuery[ "appList" ];
export type AgentMetadataList = DevicesFullQuery[ "agentMetadataList" ];
export type NetEntityMap = DevicesFullQuery[ "netEntityMap" ];

export type NetEntity = NetEntityMap[ string ];
export type NetAccessAddressOnly = NetEntity[ "addressList" ][ number ];
export type NetAccess = NetEntity[ "os" ][ number ];
export type AppNetAccess = NetEntity[ "apps" ][ DeviceAppSlug ][ number ];

export type Device = DeviceList[ number ];

export type DeviceOSSlug = Device[ "os" ];

export type DeviceDHCP = NonNullable<Device[ "dhcp" ]>[ number ];

export type DeviceApp = AppList[ number ];

export type DeviceAppSlug = DeviceApp[ "slug" ];

export type DeviceInstance = InstanceList[ number ];

export type DeviceInstanceType = DeviceInstance[ "type" ];

export type AgentMetadata = AgentMetadataList[ number ];
