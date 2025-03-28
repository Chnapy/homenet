import { DeviceApp } from '../../../data/types/get-devices';

export const getAppMeta = (app: DeviceApp): {
    name: string;
    description: string;
} => {
    switch (app.slug) {
        case 'unknown':
            return ({
                name: app.value,
                description: 'Unknown app',
            });
        case 'wireguard':
            return ({
                name: `Wireguard`,
                description: app.mode === 'server'
                    ? 'VPN Server'
                    : 'VPN Client'
            });
        case 'nginx':
            return ({
                name: `Nginx`,
                description: 'Web server'
            });
        case "adguard-home":
            return ({
                name: `AdGuard Home`,
                description: 'Ad blocker'
            });
        case "node-red":
            return ({
                name: 'Node RED',
                description: 'Low code flows',
            });
        case 'zigbee2mqtt':
            return ({
                name: 'Zigbee2MQTT',
                description: 'Zigbee IoT bridge',
            });
        case 'docker':
            return {
                name: 'Docker',
                description: 'Containers'
            }
    }
}
