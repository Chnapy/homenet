import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Box, CardActionArea, Collapse, Divider, List, Paper, Typography } from '@mui/material';
import React from 'react';
import { DeviceAppSlug, DeviceOSSlug } from '../../data/types/get-devices';
import { AccessLine, AccessType } from './access-line';
import { AppOSIcon } from './app-os-icon/app-icon';

type AppOSLineProps = {
    slug: DeviceAppSlug | DeviceOSSlug;
    name: string;
    description: string;
    mainAccess?: {
        type: AccessType;
        value: string;
    };
    accessList?: {
        type: AccessType;
        value: string;
    }[];
}

export const AppOSLine: React.FC<AppOSLineProps> = ({
    slug,
    name,
    description,
    mainAccess,
    accessList = [],
}) => {
    const [ expanded, setExpanded ] = React.useState(false);

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    const content = (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            p: 2
        }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <AppOSIcon
                    slug={slug}
                    sx={{
                        width: 32,
                        height: 'fit-content'
                    }}
                />

                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant='body1' fontWeight={500}>
                        {name}
                    </Typography>
                    <Typography variant='body2'>
                        {description}
                    </Typography>
                </Box>
            </Box>

            {mainAccess && <Divider variant='fullWidth' />}

            {mainAccess &&
                <AccessLine
                    type={mainAccess.type}
                    value={mainAccess.value}
                    disablePadding
                />}

        </Box>
    )

    return (
        <Paper elevation={mainAccess ? 2 : 1} sx={mainAccess ? undefined : {
            boxShadow: 'none'
        }}>
            {
                mainAccess
                    ? (
                        <Box sx={{
                            display: 'flex'
                        }} >
                            <CardActionArea>
                                {content}
                            </CardActionArea>

                            {accessList.length > 0 && <>

                                <Divider orientation='vertical' flexItem />

                                <Box sx={{ display: 'flex' }}>
                                    <CardActionArea
                                        onClick={handleExpandClick}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                        }}
                                    >
                                        <Box sx={{ px: 1, py: 2 }}>
                                            {expanded
                                                ? <ArrowDropUpIcon />
                                                : <ArrowDropDownIcon />}
                                        </Box>
                                    </CardActionArea>
                                </Box>
                            </>}
                        </Box >
                    )
                    : content
            }

            {accessList.length > 0 && <Collapse in={expanded} timeout="auto">
                <List disablePadding>
                    {accessList.map(({ type, value }) => (
                        <AccessLine
                            key={value}
                            type={type}
                            value={value}
                            link
                        />
                    ))}
                </List>
            </Collapse>}
        </Paper >
    );
}
