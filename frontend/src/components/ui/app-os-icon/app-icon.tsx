import HelpIcon from '@mui/icons-material/Help';
import { Box, BoxProps } from '@mui/material';
import React from 'react';
import { DeviceAppSlug, DeviceOSSlug } from '../../../data/types/get-devices';
import { getDashboardIcon } from './utils/get-dashboard-icon';
import moonlightIcon from '../../../assets/icons/moonlight.png';

export type AppOSIconProps = {
    slug: DeviceAppSlug | DeviceOSSlug;
} & BoxProps;

export const iconMap: Record<AppOSIconProps[ 'slug' ], string | undefined> = {
    unknown: undefined,

    // os
    "openwrt-glinet": getDashboardIcon('svg', 'openwrt'),
    proxmox: getDashboardIcon('svg', 'proxmox'),
    haos: getDashboardIcon('svg', 'home-assistant'),
    'android-tv': getDashboardIcon('svg', 'android'),
    windows: getDashboardIcon('svg', 'microsoft-windows'),

    // apps
    wireguard: getDashboardIcon('svg', 'wireguard'),
    nginx: getDashboardIcon('svg', 'nginx'),
    "adguard-home": getDashboardIcon('svg', 'adguard-home'),
    "node-red": getDashboardIcon('svg', 'node-red'),
    zigbee2mqtt: getDashboardIcon('svg', 'zigbee2mqtt'),
    docker: getDashboardIcon('svg', 'docker'),
    plex: getDashboardIcon('svg', 'plex'),
    moonlight: moonlightIcon,
    sunshine: getDashboardIcon('svg', 'sunshine'),
};

export const AppOSIcon: React.FC<AppOSIconProps> = ({ slug, ...boxProps }) => {
    const icon = iconMap[ slug ];

    if (!icon) {
        return <Box
            component={HelpIcon}
            {...boxProps}
        />;
    }

    return <Box
        component='img'
        src={icon}
        {...boxProps}
    />;
};
