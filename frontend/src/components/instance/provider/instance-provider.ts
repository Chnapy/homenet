import React from 'react';
import { DeviceInstance } from '../../../data/types/get-devices';

const instanceContext = React.createContext<DeviceInstance | undefined>(undefined);

const useValueNullable = () => React.useContext(instanceContext);

const useValue = () => {
    const value = useValueNullable();

    if (!value) {
        throw new Error('value is null');
    }

    return value;
}

export const InstanceContext = {
    Provider: instanceContext.Provider,
    useValueNullable,
    useValue,
}
