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
            }
    }
}
