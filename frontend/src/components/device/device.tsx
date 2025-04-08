import { Box } from '@mui/material';
import React from 'react';
import { useDevicesFullQuery } from '../../data/query/use-devices-full-query';
import { DeviceCard } from '../device/device-card';
import { DeviceContext } from '../device/provider/device-provider';
import { ThemeProvider } from '../theme/theme-provider';

export type DeviceProps = {
    deviceId: string;
};

export const Device: React.FC<React.PropsWithChildren<DeviceProps>> = ({ deviceId, children }) => {
    const rootRef = React.useRef<HTMLElement>(null);
    const devicesFullQuery = useDevicesFullQuery();

    if (!devicesFullQuery.data) {
        return null;
    }

    const { deviceList, deviceUserMetaMap } = devicesFullQuery.data;

    const device = deviceList.find(device => device.id === deviceId)!;
    const deviceUserMeta = deviceUserMetaMap[ deviceId ];

    return (
        <ThemeProvider themeName={deviceUserMeta.theme}>
            <DeviceContext.Provider
                value={{
                    device,
                    deviceUserMeta,
                }}
            >
                {children}

                <Box
                    ref={rootRef}
                    data-device-key={deviceId}
                    sx={{
                        width: 'fit-content',
                        // margin: 6
                    }}
                >
                    <DeviceCard />
                </Box>
            </DeviceContext.Provider>
        </ThemeProvider >
    );
};
