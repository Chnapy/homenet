import React from 'react';
import { DeviceApp } from '../../../data/types/get-devices';

const appContext = React.createContext<DeviceApp | undefined>(undefined);

const useValueNullable = () => React.useContext(appContext);

const useValue = () => {
    const value = useValueNullable();

    if (!value) {
        throw new Error('value is null');
    }

    return value;
}

export const AppContext = {
    Provider: appContext.Provider,
    useValueNullable,
    useValue,
}
