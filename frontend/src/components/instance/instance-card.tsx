import { Box, Card, CardContent } from '@mui/material';
import React from 'react';
import { AppLine } from '../app/app-line';
import { AppContext } from '../app/provider/app-provider';
import { DeviceAccessLineList } from '../device/device-access-line-list';
import { OSLine } from '../os/os-line';
import { InstanceIcon } from './instance-icon';
import { InstanceContext } from './provider/instance-provider';

export const InstanceCard: React.FC = () => {
    const instance = InstanceContext.useValue();

    return <Box>
        <Box sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2,
            px: 2
        }}>
            <Box sx={{
                display: 'flex',
                width: 32,
                marginBottom: '-16px'
            }}>
                <InstanceIcon />
            </Box>

            <DeviceAccessLineList />

        </Box>

        <Card variant='outlined'>
            <OSLine />

            <CardContent sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                pb: '16px !important'
            }}>

                {instance.apps?.map(app => {
                    return <AppContext.Provider
                        key={app.slug}
                        value={app}
                    >
                        <AppLine />
                    </AppContext.Provider>;
                })}

            </CardContent>
        </Card>
    </Box>
};
