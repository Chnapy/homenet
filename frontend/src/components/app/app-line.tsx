import React from 'react';
import { useDeviceNetAddressList } from '../device/utils/use-device-net-address-list';
import { AppOSLine } from '../ui/app-os-line';
import { AppContext } from './provider/app-provider';
import { getAppMeta } from './utils/get-app-meta';

export const AppLine: React.FC = () => {
    const app = AppContext.useValue();

    const { getDirectAccess } = useDeviceNetAddressList();

    const { name, description } = getAppMeta(app);

    const appAccessList = 'port' in app
        ? getDirectAccess({
            type: 'web',
            port: app.port,
        })
        : [];

    const appMainAccess = appAccessList[ 0 ];
    const appOthersAccessList = appAccessList.filter(access => access !== appMainAccess)

    return <AppOSLine
        key={app.slug}
        slug={app.slug}
        name={name}
        description={description}
        mainAccess={appMainAccess}
        accessList={appOthersAccessList}
    />;
}
