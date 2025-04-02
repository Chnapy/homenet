import { DeviceOSSlug } from '../../../data/types/get-devices';

export const getOSMeta = (slug: DeviceOSSlug): {
    name: string;
    description: string;
} => {
    switch (slug) {
        case 'openwrt-glinet':
            return {
                name: 'OpenWRT & Gl.inet',
                description: 'OS as router',
            }
        case 'proxmox':
            return {
                name: 'Proxmox',
                description: 'OS as VE'
            }
        case 'haos':
            return {
                name: 'Home Assistant',
                description: 'OS'
            };
        case 'android-tv':
            return {
                name: 'Android TV',
                description: 'OS',
            };
        case 'windows':
            return {
                name: 'Windows',
                description: 'OS',
            };
        case 'debian':
            return {
                name: 'Debian',
                description: 'OS',
            };
    }
}
