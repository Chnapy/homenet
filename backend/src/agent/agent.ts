
export type AgentOS = 'openwrt-glinet' | 'haos' | 'proxmox' | 'android-tv' | 'windows';

export type AgentDHCPItem = {
    address: string;
    alias: string;
};

export type AgentApp =
    | {
        slug: 'unknown';
        value: string;
    }
    | {
        slug: 'wireguard';
        // /etc/config/wireguard_server
        mode: 'client' | 'server';
        address: string;
        // /etc/config/wireguard_server
        clients?: string[];
    }
    | {
        slug: 'nginx';
        // /etc/nginx
        reverseProxy?: {
            from: {
                domain: string;
                ssl?: boolean;
            };
            to: {
                address: string;
                ssl?: boolean;
                port?: number;
            }
        }[];
    }
    | {
        slug:
        // /etc/AdGuardHome/config.yaml
        // http
        //   address
        | 'adguard-home'
        // ha addons info <slug>
        // network
        | 'node-red'
        // ha addons info <slug>
        // network
        | 'zigbee2mqtt'
        | 'plex'
        | 'sunshine'
        web: {
            port?: number;
            ssl?: boolean;
        }[];
    }
    | {
        slug: 'docker';
    }
    | {
        slug: 'moonlight';
    }

export type AgentInstance = Pick<AgentDevice, 'os' | 'lan' | 'web' | 'ssh' | 'apps'> & {
    type: 'proxmox' | 'docker';
}

export type AgentDevice = {
    os: AgentOS;
    lan: string;
    wan?: string;
    ddns?: string;
    dhcp?: AgentDHCPItem[];
    web?: {
        port?: number;
        ssl?: boolean;
    }[];
    ssh?: {
        port?: number;
    };
    apps?: AgentApp[];
    instances?: AgentInstance[];
};

// const router: AgentDevice = {
//     // uname -a
//     // /etc/os-release
//     // /etc/glversion
//     os: 'openwrt-glinet',
//     // ip route
//     lan: '192.168.8.1',
//     wan: '176.131.38.39',
//     // etc/config/gl_ddns
//     ddns: 'ss32d57.glddns.com',
//     // /etc/config/dhcp
//     //   config dnsmasq
//     //     option domain 'lan'
//     dhcp: [
//         {
//             address: '192.168.8.138',
//             alias: 'proxmox.lan'
//         }
//     ],
//     web: [ {
//         ssl: true,
//     } ],
//     // /etc/config/dropbear
//     // /etc/sshd
//     ssh: {
//         port: 22,
//     },
//     apps: [
//         {
//             name: 'wireguard',
//             // /etc/config/wireguard_server
//             mode: 'server',
//             address: '10.0.0.1',
//             // /etc/config/wireguard_server
//             clients: [
//                 '10.0.0.2',
//                 '10.0.0.3',
//             ],
//         },
//         {
//             name: 'nginx',
//             // /etc/nginx
//             reverseProxy: [
//                 {
//                     from: {
//                         domain: 'proxmox.richardhaddad.fr',
//                         ssl: true,
//                     },
//                     to: {
//                         address: '192.168.8.138',
//                         ssl: true,
//                         port: 8006,
//                     }
//                 }
//             ]
//         },
//         {
//             name: 'adguard-home',
//             // /etc/AdGuardHome/config.yaml
//             // http
//             //   address
//             port: 3000,
//         },
//     ]
// };

// const proxmox: AgentDevice = {
//     os: 'proxmox',
//     lan: '192.168.8.138',
//     web: [ {
//         port: 8006,
//         ssl: true,
//     } ],
//     ssh: {},
//     apps: [],
//     // qm list, then:
//     //   qm terminal
//     //   or use ssh
//     instances: [
//         {
//             os: 'haos',
//             lan: '192.168.8.206',
//             web: [
//                 {
//                     port: 8123,
//                 },
//                 {
//                     port: 4357,
//                 },
//             ],
//             // ha addons info <slug>
//             // network
//             ssh: {},
//             apps: [
//                 {
//                     name: 'node-red',
//                     port: 1880,
//                 },
//                 {
//                     name: 'node-red',
//                     port: 8099,
//                 }
//             ],
//         }
//     ]
// };
