export type DeviceUserMeta = {
  deviceId: string;
  // agentAddress?: string;
  name: string;
  type: "server" | "router" | "mediacenter" | "desktop" | "cloud";
  theme: "default" | "mauve" | "blue" | "green" | "yellow";
};

export type DeviceUserMetaMap = {
  [deviceId: string]: DeviceUserMeta;
};

export const getDeviceUserMetaMap = async (): Promise<DeviceUserMetaMap> => {
  return {
    "uuid-router": {
      deviceId: "uuid-router",
      name: "Smart router",
      type: "router",
      theme: "mauve",
    },

    "uuid-homelab": {
      deviceId: "uuid-homelab",
      // agentAddress: 'http://192.168.8.217:8881/device-info',
      name: "Homelab",
      type: "server",
      theme: "blue",
    },

    "uuid-media": {
      deviceId: "uuid-media",
      name: "Media box",
      type: "mediacenter",
      theme: "green",
    },

    "uuid-desktop": {
      deviceId: "uuid-desktop",
      name: "Desktop PC",
      type: "desktop",
      theme: "default",
    },

    "uuid-vps": {
      deviceId: "uuid-vps",
      name: "OVH VPS",
      type: "cloud",
      theme: "yellow",
    },
  };
};
