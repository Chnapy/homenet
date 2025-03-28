import React from 'react';
import { Device } from '../../../data/types/get-devices';
import { DeviceUserMeta } from '../../../data/types/get-devices-user-meta';

const deviceContext = React.createContext<{
    device: Device;
    deviceUserMeta: DeviceUserMeta;
} | undefined>(undefined);

const useValueNullable = () => React.useContext(deviceContext);

const useValue = () => {
    const value = useValueNullable();

    if (!value) {
        throw new Error('value is null');
    }

    return value;
}

export const DeviceContext = {
    Provider: deviceContext.Provider,
    useValueNullable,
    useValue,
}
