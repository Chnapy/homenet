import React from 'react';
import { DeviceContext } from '../device/provider/device-provider';
import { InstanceContext } from '../instance/provider/instance-provider';
import { useNetEntityAccessMap } from '../network/hooks/use-net-entity-access-map';
import { AppOSLine } from '../ui/app-os-line';
import { getOSMeta } from './utils/get-os-meta';

export const OSLine: React.FC = () => {
    const { device } = DeviceContext.useValue();
    const instance = InstanceContext.useValueNullable();

    const { data, isLoading } = useNetEntityAccessMap();

    if (isLoading) {
        return 'loading';
    }

    if (!data
        || instance?.type === 'docker'
    ) {
        return null;
    }

    const entity = instance ?? device;

    const netEntityAccess = data[ entity.id ].os;

    const { name, description } = getOSMeta(entity.os);

    const osMainAccess = netEntityAccess[ 0 ];
    const osOthersAccessList = netEntityAccess.filter(access => access !== osMainAccess)

    return <AppOSLine
        slug={entity.os}
        name={name}
        description={description}
        mainAccess={osMainAccess}
        accessList={osOthersAccessList}
    />;
}
