import { App } from "../app";
import { Meta } from "./meta";

export const getAppMeta = (app: Omit<App, "meta">): Meta => {
  switch (app.slug) {
    case "UNRECOGNIZED":
    case "UNKNOWN_APP":
      return {
        name: "Unknown", // TODO
        description: "Unknown app",
      };
    case "HOMENET":
      return {
        name: "Homenet",
        description: "Home network centralizer",
      };
    case "WIREGUARD":
      return {
        name: `Wireguard`,
        description: app.vpnMode === "SERVER" ? "VPN Server" : "VPN Client",
      };
    case "NGINX":
      return {
        name: `Nginx`,
        description: "Web server",
      };
    case "ADGUARD_HOME":
      return {
        name: `AdGuard Home`,
        description: "Ad blocker",
      };
    case "NODE_RED":
      return {
        name: "Node RED",
        description: "Low code flows",
      };
    case "ZIGBEE2MQTT":
      return {
        name: "Zigbee2MQTT",
        description: "Zigbee IoT bridge",
      };
    case "DOCKER":
      return {
        name: "Docker",
        description: "Containers",
      };
    case "DOCKER_REGISTRY":
      return {
        name: "Docker registry",
        description: "Images registry",
      };
    case "PLEX":
      return {
        name: "Plex",
        description: "Media server",
      };
    case "MOONLIGHT":
      return {
        name: "Moonlight",
        description: "Game streaming client",
      };
    case "SUNSHINE":
      return {
        name: "Sunshine",
        description: "Game streaming host",
      };
    case "CADDY":
      return {
        name: "Caddy",
        description: "Web server with auto https",
      };
    case "UPTIME_KUMA":
      return {
        name: "Uptime Kuma",
        description: "Monitoring services uptime",
      };
    case "NTFY":
      return {
        name: "Ntfy",
        description: "Notification service",
      };
    case "CODE_SERVER":
      return {
        name: "VS Code",
        description: "code-server",
      };
  }
};
