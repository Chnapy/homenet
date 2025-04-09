const getDeviceInfos = async () => {
  const deviceList = [
    {
      id: "uuid-router",
      type: "device",
      // uname -a
      // /etc/os-release
      // /etc/glversion
      os: "openwrt-glinet",
      // ip route
      lan: "192.168.8.1",
      wan: "176.131.38.39",
      // etc/config/gl_ddns
      ddns: "ss32d57.glddns.com",
      // /etc/config/dhcp
      //   config dnsmasq
      //     option domain 'lan'
      dhcp: [
        {
          address: "192.168.8.138",
          alias: "proxmox.lan",
        },
        {
          address: "192.168.8.206",
          alias: "homeassistant.lan",
        },
        {
          address: "192.168.8.248",
          alias: "shield.lan",
        },
        {
          address: "192.168.8.147",
          alias: "pc.lan",
        },
      ],
      web: [
        {
          ssl: true,
        },
      ],
      // /etc/config/dropbear
      // /etc/sshd
      ssh: {
        port: 22,
      },
    },
    {
      id: "uuid-homelab",
      type: "device",
      os: "proxmox",
      lan: "192.168.8.138",
      web: [
        {
          port: 8006,
          ssl: true,
        },
      ],
      ssh: {},
    },
    {
      id: "uuid-media",
      type: "device",
      lan: "192.168.8.248",
      os: "android-tv",
    },
    {
      id: "uuid-desktop",
      type: "device",
      lan: "192.168.8.147",
      os: "windows",
    },
    {
      id: "uuid-vps",
      type: "device",
      os: "debian",
      wan: "141.94.221.48",
      lan: "192.168.100.1",
      ddns: "vps-0c88ff97.vps.ovh.net",
      ssh: {},
    },
  ];

  const instanceList = [
    {
      id: "uuid-homelab_instance-0",
      os: "haos",
      type: "instance",
      parentId: "uuid-homelab",
      instanceType: "proxmox",
      lan: "192.168.8.206",
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
    },
    {
      id: "uuid-vps_instance-0",
      type: "instance",
      parentId: "uuid-vps",
      instanceType: "docker",
      lan: "192.168.100.2",
    },
  ];

  const appList = [
    {
      id: "uuid-router-wireguard",
      parentId: "uuid-router",
      slug: "wireguard",
      // /etc/config/wireguard_server
      mode: "server",
      address: "10.0.0.1",
      // /etc/config/wireguard_server
      clients: ["10.0.0.2", "10.0.0.3"],
    },
    {
      id: "uuid-router-nginx",
      parentId: "uuid-router",
      slug: "nginx",
      // /etc/nginx
      reverseProxy: [
        {
          from: {
            domain: "proxmox.richardhaddad.fr",
            ssl: true,
          },
          to: {
            address: "192.168.8.138",
            ssl: true,
            port: 8006,
          },
        },
        {
          from: {
            domain: "ha.richardhaddad.fr",
            ssl: true,
          },
          to: {
            address: "192.168.8.206",
            port: 8123,
          },
        },
      ],
    },
    {
      id: "uuid-router-adguard",
      parentId: "uuid-router",
      slug: "adguard-home",
      // /etc/AdGuardHome/config.yaml
      // http
      //   address
      web: [
        {
          port: 3000,
        },
      ],
    },
    {
      id: "uuid-media-plex",
      parentId: "uuid-media",
      slug: "plex",
      web: [
        {
          port: 32400,
        },
      ],
    },
    {
      id: "uuid-media-moonlight",
      parentId: "uuid-media",
      slug: "moonlight",
    },
    {
      id: "uuid-desktop-wireguard",
      parentId: "uuid-desktop",
      slug: "wireguard",
      mode: "client",
      address: "10.0.0.4",
    },
    {
      id: "uuid-desktop-sunshine",
      parentId: "uuid-desktop",
      slug: "sunshine",
      web: [
        {
          port: 47990,
        },
      ],
    },
    {
      id: "uuid-vps-docker",
      parentId: "uuid-vps",
      slug: "docker",
    },
    {
      id: "uuid-homelab_instance-0-node-red",
      parentId: "uuid-homelab_instance-0",
      slug: "node-red",
      web: [
        {
          port: 1880,
        },
      ],
    },
    {
      id: "uuid-homelab_instance-0-zigbee2mqtt",
      parentId: "uuid-homelab_instance-0",
      slug: "zigbee2mqtt",
      web: [
        {
          port: 8099,
        },
      ],
    },
    {
      id: "uuid-vps_instance-0-wireguard",
      parentId: "uuid-vps_instance-0",
      slug: "wireguard",
      mode: "client",
      address: "10.0.0.5",
    },
    {
      id: "uuid-vps_instance-0-caddy",
      parentId: "uuid-vps_instance-0",
      slug: "caddy",
      reverseProxy: [
        {
          from: {
            domain: "uptime.richardhaddad.fr",
            ssl: true,
          },
          to: {
            address: "192.168.100.2",
            port: 3001,
          },
        },
        {
          from: {
            domain: "ntfy.richardhaddad.fr",
            ssl: true,
          },
          to: {
            address: "192.168.100.2",
            port: 8080,
          },
        },
      ],
    },
    {
      id: "uuid-vps_instance-0-uptime",
      parentId: "uuid-vps_instance-0",
      slug: "uptime-kuma",
      web: [
        {
          port: 3001,
        },
      ],
    },
    {
      id: "uuid-vps_instance-0-ntfy",
      parentId: "uuid-vps_instance-0",
      slug: "ntfy",
      web: [
        {
          port: 8080,
        },
      ],
    },
  ];

  return {
    deviceList,
    instanceList,
    appList,
  };
};
