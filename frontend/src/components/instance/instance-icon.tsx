import React from 'react';
import { AppOSIcon } from '../ui/app-os-icon/app-icon';
import { InstanceContext } from './provider/instance-provider';

export const InstanceIcon: React.FC = () => {
    const instance = InstanceContext.useValue();

    return <AppOSIcon
        slug={instance.type === 'proxmox' ? 'proxmox' : 'docker'}
        sx={{
            width: '100%',
        }}
    />
};
