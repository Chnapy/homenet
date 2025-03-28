import React from 'react';
import { GetDevicesFull } from '../../../data/types/get-devices-full';

const deviceMapContext = React.createContext<GetDevicesFull | undefined>(undefined);

const useValueNullable = () => React.useContext(deviceMapContext);

const useValue = () => {
    const value = useValueNullable();

    if (!value) {
        throw new Error('value is null');
    }

    return value;
}

export const DeviceMapContext = {
    Provider: deviceMapContext.Provider,
    useValueNullable,
    useValue,
}
