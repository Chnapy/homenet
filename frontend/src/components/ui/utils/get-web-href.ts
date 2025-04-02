import { NetAccess } from '../../network/hooks/use-net-entity-map';

export const getAccessWebHref = ({ address, port, ssl }: Omit<NetAccess, 'type' | 'scope'>) =>
    `${ssl ? 'https' : 'http'}://${address}${port ? ':' + port : ''}`;
