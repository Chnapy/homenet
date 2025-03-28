import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LanIcon from '@mui/icons-material/Lan';
import LinkIcon from '@mui/icons-material/Link';
import CloudIcon from '@mui/icons-material/Cloud';
// import TerminalIcon from '@mui/icons-material/Terminal';
import { ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

export type AccessType = 'lan' | 'wan' | 'wan-domain' | 'vpn';

type AccessLineProps = {
    type: AccessType;
    value: string;
    link?: boolean;
    disablePadding?: boolean;
}

const iconMap: Record<AccessType, typeof CloudIcon> = {
    lan: LanIcon,
    wan: CloudIcon,
    'wan-domain': LinkIcon,
    vpn: VpnKeyIcon,
    // ssh: TerminalIcon,
}

export const AccessLine: React.FC<AccessLineProps> = ({
    type,
    value,
    link,
    disablePadding,
}) => {
    const Icon = iconMap[ type ];

    const content = <>
        <ListItemIcon sx={{ minWidth: 0 }}>
            <Icon fontSize='small' />
        </ListItemIcon>
        <ListItemText
            primary={value}
            slotProps={{
                primary: {
                    variant: 'caption'
                }
            }}
        />
    </>;

    if (link) {
        return <ListItemButton disableGutters={disablePadding} sx={{ gap: 1 }}>
            {content}
        </ListItemButton>
    }

    return <ListItem disablePadding={disablePadding} sx={{ gap: 1 }}>
        {content}
    </ListItem>
}
