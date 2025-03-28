export type DeviceUserMeta = {
    deviceId: string;
    name: string;
    type: 'server' | 'router' | 'mediacenter' | 'desktop' | 'cloud';
    theme: 'default' | 'mauve' | 'blue';
    // position: [ number, number ];
};

export type DeviceUserMetaMap = {
    [ deviceId: string ]: DeviceUserMeta;
};

export const getDeviceUserMetaMap = async (): Promise<DeviceUserMetaMap> => {
    return {
        'uuid-router': {
            deviceId: 'uuid-router',
            name: 'Smart router',
            type: 'router',
            theme: 'mauve',
        },

        'uuid-homelab': {
            deviceId: 'uuid-homelab',
            name: 'Homelab',
            type: 'server',
            theme: 'blue',
        }
    };
};
