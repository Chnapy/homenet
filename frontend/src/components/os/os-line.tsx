import { DeviceContext } from '../device/provider/device-provider';
import { useDeviceNetAddressList } from '../device/utils/use-device-net-address-list';
import { InstanceContext } from '../instance/provider/instance-provider';
import { AppOSLine } from '../ui/app-os-line';
import { getOSMeta } from './utils/get-os-meta';

export const OSLine: React.FC = () => {
    const { device } = DeviceContext.useValue();
    const instance = InstanceContext.useValueNullable();

    const deviceLike = instance ?? device;

    const { getDirectAccess } = useDeviceNetAddressList();

    const { name, description } = getOSMeta(deviceLike.os);

    const webAccessList = (deviceLike.web ?? [])?.flatMap(({
        port,
        ssl
    }) => getDirectAccess({
        type: 'web',
        port,
        ssl,
    }));

    const fullAccessList = [
        ...(deviceLike.web ?? [])?.flatMap(({
            port,
            ssl
        }) => getDirectAccess({
            type: 'web',
            port,
            ssl,
        })),
        ...(deviceLike.ssh ? getDirectAccess({
            type: 'ssh',
            port: deviceLike.ssh.port,
        }) : [])
    ];

    const osMainAccess = fullAccessList[ 0 ];
    const osOthersAccessList = fullAccessList.filter(access => access !== osMainAccess)

    return <AppOSLine
        slug={deviceLike.os}
        name={name}
        description={description}
        mainAccess={osMainAccess}
        accessList={osOthersAccessList}
    />;
}
