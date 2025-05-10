import HelpIcon from "@mui/icons-material/Help";
import { Box, BoxProps } from "@mui/material";
import React from "react";
import { DeviceAppSlug, DeviceOSSlug } from "../../../data/types/get-devices";
import { getDashboardIcon } from "./utils/get-dashboard-icon";
import homenetIcon from "../../../assets/icons/hn-logo.svg";
import moonlightIcon from "../../../assets/icons/moonlight.png";

export type AppOSIconProps = {
  slug: DeviceAppSlug | DeviceOSSlug;
} & BoxProps;

// eslint-disable-next-line react-refresh/only-export-components
export const iconMap: Record<AppOSIconProps["slug"], string | undefined> = {
  UNRECOGNIZED: undefined,
  UNKNOWN_APP: undefined,
  UNKNOWN_OS: undefined,

  // os
  OPENWRT_GLINET: getDashboardIcon("svg", "openwrt"),
  PROXMOX: getDashboardIcon("svg", "proxmox"),
  HAOS: getDashboardIcon("svg", "home-assistant"),
  ANDROID_TV: getDashboardIcon("svg", "android"),
  WINDOWS: getDashboardIcon("svg", "microsoft-windows"),
  DEBIAN: getDashboardIcon("svg", "debian-linux"),

  // apps
  HOMENET: homenetIcon,
  WIREGUARD: getDashboardIcon("svg", "wireguard"),
  NGINX: getDashboardIcon("svg", "nginx"),
  ADGUARD_HOME: getDashboardIcon("svg", "adguard-home"),
  NODE_RED: getDashboardIcon("svg", "node-red"),
  ZIGBEE2MQTT: getDashboardIcon("svg", "zigbee2mqtt"),
  DOCKER: getDashboardIcon("svg", "docker"),
  DOCKER_REGISTRY: getDashboardIcon("svg", "docker-engine"),
  DOCKER_REGISTRY_UI: getDashboardIcon("svg", "docker-engine"),
  PLEX: getDashboardIcon("svg", "plex"),
  MOONLIGHT: moonlightIcon,
  SUNSHINE: getDashboardIcon("svg", "sunshine"),
  CADDY: getDashboardIcon("svg", "caddy"),
  UPTIME_KUMA: getDashboardIcon("svg", "uptime-kuma"),
  NTFY: getDashboardIcon("svg", "ntfy"),
  CODE_SERVER: getDashboardIcon("svg", "code"),
};

export const AppOSIcon: React.FC<AppOSIconProps> = ({ slug, ...boxProps }) => {
  const icon = iconMap[slug];

  if (!icon) {
    return <Box component={HelpIcon} {...boxProps} />;
  }

  return <Box component="img" src={icon} {...boxProps} />;
};
