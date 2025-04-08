export type AgentOS =
  | "debian"
  | "openwrt-glinet"
  | "haos"
  | "proxmox"
  | "android-tv"
  | "windows";

export type AgentDHCPItem = {
  address: string;
  alias: string;
};

export type AgentApp =
  | {
      slug: "unknown";
      value: string;
    }
  | {
      slug: "wireguard";
      // /etc/config/wireguard_server
      // docker exec wireguard wg show
      mode: "client" | "server";
      // docker exec wireguard wg show
      address: string;
      // /etc/config/wireguard_server
      // docker exec wireguard wg show
      clients?: string[];
    }
  | {
      slug: "nginx" | "caddy";
      // /etc/nginx
      // /etc/caddy/Caddyfile
      reverseProxy?: {
        from: {
          domain: string;
          ssl?: boolean;
        };
        to: {
          address: string;
          ssl?: boolean;
          port?: number;
        };
      }[];
    }
  | {
      slug: // /etc/AdGuardHome/config.yaml
      // http
      //   address
      | "adguard-home"
        // ha addons info <slug>
        // network
        | "node-red"
        // ha addons info <slug>
        // network
        | "zigbee2mqtt"
        | "plex"
        | "sunshine"
        // docker inspect ntfy
        // Config.ExposedPorts
        | "uptime-kuma"
        // docker inspect ntfy
        // Config.Env.NTFY_LISTEN_HTTP
        | "ntfy";
      web: {
        port?: number;
        ssl?: boolean;
      }[];
    }
  | {
      slug: "docker";
    }
  | {
      slug: "moonlight";
    };

type AgentInstanceBase = Pick<AgentDevice, "id" | "lan"> & {
  type: "instance";
  parentId: string;
};

type AgentInstanceDocker = AgentInstanceBase & {
  instanceType: "docker";
  // docker ps
};

type AgentInstanceProxmox = AgentInstanceBase &
  Pick<AgentDevice, "os" | "web" | "ssh"> & {
    instanceType: "proxmox";
    // qm list, then:
    //   qm terminal
    //   or use ssh
  };

export type AgentInstance = AgentInstanceDocker | AgentInstanceProxmox;

export type AgentDevice = {
  id: string;
  type: "device";
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
  //   apps?: AgentApp[];
  //   instances?: AgentInstance[];
};
