import { DeviceOSSlug } from "../../../data/types/get-devices";

export const getOSMeta = (
  slug: DeviceOSSlug
): {
  name: string;
  description: string;
} => {
  switch (slug) {
    case "UNRECOGNIZED":
    case "UNKNOWN_OS":
      return {
        name: "Unknown", // TODO
        description: "Unknown",
      };
    case "OPENWRT_GLINET":
      return {
        name: "OpenWRT & Gl.inet",
        description: "OS as router",
      };
    case "PROXMOX":
      return {
        name: "Proxmox",
        description: "OS as VE",
      };
    case "HAOS":
      return {
        name: "Home Assistant",
        description: "OS",
      };
    case "ANDROID_TV":
      return {
        name: "Android TV",
        description: "OS",
      };
    case "WINDOWS":
      return {
        name: "Windows",
        description: "OS",
      };
    case "DEBIAN":
      return {
        name: "Debian",
        description: "OS",
      };
  }
};
