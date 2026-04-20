import React from 'react';

export type Sizing = 'full' | 'small';

const sizingContext = React.createContext<Sizing>('full');

const useValueNullable = () => React.useContext(sizingContext);

const useValue = () => {
    const value = useValueNullable();

    if (!value) {
        throw new Error('value is null');
    }

    return value;
}

export const SizingContext = {
    Provider: sizingContext.Provider,
    useValueNullable,
    useValue,
};
