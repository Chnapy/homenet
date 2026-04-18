import { AppOSIconProps } from '../app-icon';
import type Tree from './tree';
import homenetIcon from "../../../../assets/icons/hn-logo.svg";
import moonlightIcon from "../../../../assets/icons/moonlight.png";

// type Tree = typeof tree;

type GetDashboardIconParams<E extends keyof Tree, F extends Tree[ E ][ number ]> = [
    E,
    F extends `${infer V}.${string}` ? V : never,
];

export const getDashboardIcon = <E extends keyof Tree, F extends Tree[ E ][ number ]>(
    ...[ ext, value ]: GetDashboardIconParams<E, F>
) => `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/${ext}/${value}.${ext}`;

export const getDashboardIconAll = <F extends Tree[ keyof Tree ][ number ]>(
    value: GetDashboardIconParams<keyof Tree, F>[ 1 ]
) => [ 'svg', 'webp', 'png' ].map(ext => `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/${ext}/${value}.${ext}`);

const iconMap: Record<AppOSIconProps[ "slug" ], string[]> = {
    UNRECOGNIZED: [],
    UNKNOWN_APP: [],
    UNKNOWN_OS: [],

    // os
    OPENWRT_GLINET: getDashboardIconAll("openwrt"),
    PROXMOX: getDashboardIconAll("proxmox"),
    HAOS: getDashboardIconAll("home-assistant"),
    ANDROID_TV: getDashboardIconAll("android"),
    WINDOWS: getDashboardIconAll("microsoft-windows"),
    DEBIAN: getDashboardIconAll("debian-linux"),

    // apps
    HOMENET: [ homenetIcon ],
    WIREGUARD: getDashboardIconAll("wireguard"),
    NGINX: getDashboardIconAll("nginx"),
    ADGUARD_HOME: getDashboardIconAll("adguard-home"),
    NODE_RED: getDashboardIconAll("node-red"),
    ZIGBEE2MQTT: getDashboardIconAll("zigbee2mqtt"),
    DOCKER: getDashboardIconAll("docker"),
    DOCKER_REGISTRY: getDashboardIconAll("docker-engine"),
    DOCKER_REGISTRY_UI: getDashboardIconAll("docker-engine"),
    PLEX: getDashboardIconAll("plex"),
    MOONLIGHT: [ moonlightIcon ],
    SUNSHINE: getDashboardIconAll("sunshine"),
    CADDY: getDashboardIconAll("caddy"),
    UPTIME_KUMA: getDashboardIconAll("uptime-kuma"),
    NTFY: getDashboardIconAll("ntfy"),
    CODE_SERVER: getDashboardIconAll("code"),
};

export const getDashboardIconAny = (value: string) => {
    if (iconMap[ value ]) {
        return iconMap[ value ];
    }

    if (value.includes("://")) {
        return [ value ];
    }

    return getDashboardIconAll(value as never);
};
