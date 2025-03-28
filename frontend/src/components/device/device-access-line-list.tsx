import { Box } from '@mui/material';
import React from 'react';
import { AccessLine } from '../ui/access-line';
import { useDeviceNetAddressList } from './utils/use-device-net-address-list';

export const DeviceAccessLineList: React.FC = () => {
    const { getAddressList } = useDeviceNetAddressList();

    return <Box sx={{
        display: 'flex',
        flexDirection: 'column'
    }}>
        {getAddressList().map(({ type, value }) => <AccessLine
            key={value}
            type={type}
            value={value}
            disablePadding
        />)}
    </Box>
};
