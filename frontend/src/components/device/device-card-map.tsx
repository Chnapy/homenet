import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTRPC } from '../../data/trpc';
import { ThemeProvider } from '../theme/theme-provider';
import { DeviceCard } from './device-card';
import { DeviceContext } from './provider/device-provider';
import { DynamicLayout } from '../dynamic-layout/dynamic-layout';

export const DeviceCardMap: React.FC = () => {
    const trpc = useTRPC();
    const { data } = useQuery(
        trpc.getDevicesFull.queryOptions()
    );

    console.log({ data });

    if (!data) {
        return null;
    }

    const { deviceMap, deviceUserMetaMap } = data;

    return <DynamicLayout
        enabled={!!data}
    >
        {Object.entries(deviceMap)
            .map(([ deviceKey, device ]) => {
                const deviceUserMeta = deviceUserMetaMap[ deviceKey ];

                return (
                    <ThemeProvider key={deviceKey} themeName={deviceUserMeta.theme}>
                        <DeviceContext.Provider
                            value={{
                                device,
                                deviceUserMeta,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 'fit-content',
                                    margin: 6
                                }}
                            >
                                <DeviceCard />
                            </Box>
                        </DeviceContext.Provider>
                    </ThemeProvider>
                )
            })
        }
    </DynamicLayout>;
};
