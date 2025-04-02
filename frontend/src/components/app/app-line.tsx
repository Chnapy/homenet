import React from 'react';
import { DeviceContext } from '../device/provider/device-provider';
import { InstanceContext } from '../instance/provider/instance-provider';
import { useNetEntityAccessMap } from '../network/hooks/use-net-entity-access-map';
import { AppOSLine } from '../ui/app-os-line';
import { AppContext } from './provider/app-provider';
import { getAppMeta } from './utils/get-app-meta';

export const AppLine: React.FC = () => {
    const { device } = DeviceContext.useValue();
    const instance = InstanceContext.useValueNullable();

    const entity = instance ?? device;

    const app = AppContext.useValue();

    const { data, isLoading } = useNetEntityAccessMap();

    if (isLoading) {
        return 'loading';
    }

    if (!data) {
        return null;
    }

    const { name, description } = getAppMeta(app);

    const netEntityAccess = data[ entity.id ].apps[ app.slug ];

    const appMainAccess = netEntityAccess[ 0 ];
    const appOthersAccessList = netEntityAccess.filter(access => access !== appMainAccess)

    return <AppOSLine
        key={app.slug}
        slug={app.slug}
        name={name}
        description={description}
        mainAccess={appMainAccess}
        accessList={appOthersAccessList}
    />;
};
