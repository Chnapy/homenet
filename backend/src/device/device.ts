import { AgentDevice } from '../agent/agent';

export type Device = {
    id: string;
} & AgentDevice;

export type DeviceMap = {
    [ id: string ]: Device;
};

export const getDeviceMap = async (): Promise<DeviceMap> => {
    return {
        'uuid-router': {
            id: 'uuid-router',
            // uname -a
            // /etc/os-release
            // /etc/glversion
            os: 'openwrt-glinet',
            // ip route
            lan: '192.168.8.1',
            wan: '176.131.38.39',
            // etc/config/gl_ddns
            ddns: 'ss32d57.glddns.com',
            // /etc/config/dhcp
            //   config dnsmasq
            //     option domain 'lan'
            dhcp: [
                {
                    address: '192.168.8.138',
                    alias: 'proxmox.lan'
                },
                {
                    address: '192.168.8.206',
                    alias: 'homeassistant.lan'
                },
            ],
            web: [
                {
                    ssl: true,
                }
            ],
            // /etc/config/dropbear
            // /etc/sshd
            ssh: {
                port: 22,
            },
            apps: [
                {
                    slug: 'wireguard',
                    // /etc/config/wireguard_server
                    mode: 'server',
                    address: '10.0.0.1',
                    // /etc/config/wireguard_server
                    clients: [
                        '10.0.0.2',
                        '10.0.0.3',
                    ],
                },
                {
                    slug: 'nginx',
                    // /etc/nginx
                    reverseProxy: [
                        {
                            from: {
                                domain: 'proxmox.richardhaddad.fr',
                                ssl: true,
                            },
                            to: {
                                address: '192.168.8.138',
                                ssl: true,
                                port: 8006,
                            }
                        },
                        {
                            from: {
                                domain: 'ha.richardhaddad.fr',
                                ssl: true,
                            },
                            to: {
                                address: '192.168.8.206',
                                port: 8123,
                            }
                        },
                    ]
                },
                {
                    slug: 'adguard-home',
                    // /etc/AdGuardHome/config.yaml
                    // http
                    //   address
                    port: 3000,
                },
            ]
        },

        'uuid-homelab': {
            id: 'uuid-homelab',
            os: 'proxmox',
            lan: '192.168.8.138',
            web: [ {
                port: 8006,
                ssl: true,
            } ],
            ssh: {},
            apps: [],
            // qm list, then:
            //   qm terminal
            //   or use ssh
            instances: [
                {
                    os: 'haos',
                    type: 'proxmox',
                    lan: '192.168.8.206',
                    web: [
                        {
                            port: 8123,
                        },
                        {
                            port: 4357,
                        },
                    ],
                    // ha addons info <slug>
                    // network
                    ssh: {},
                    apps: [
                        {
                            slug: 'node-red',
                            port: 1880,
                        },
                        {
                            slug: 'zigbee2mqtt',
                            port: 8099,
                        }
                    ],
                }
            ]
        },
    };
};
