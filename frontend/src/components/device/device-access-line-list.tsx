import { Box } from '@mui/material';
import React from 'react';
import { AccessLine } from '../ui/access-line';
import { useNetEntityMap } from '../network/hooks/use-net-entity-map';
import { DeviceContext } from './provider/device-provider';

export const DeviceAccessLineList: React.FC = () => {
    const { device } = DeviceContext.useValue();
    const netEntityMap = useNetEntityMap();

    if (netEntityMap.isLoading) {
        return 'loading';
    }

    if (!netEntityMap.data) {
        return null;
    }

    const netEntity = netEntityMap.data[ device.id ];

    return <Box sx={{
        display: 'flex',
        flexDirection: 'column'
    }}>
        {netEntity.asList.map((access, i) => <AccessLine
            key={i}
            {...access}
            disablePadding
        />)}
    </Box>
};
