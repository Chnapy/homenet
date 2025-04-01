import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Box, CardActionArea, Collapse, Divider, List, Paper, Typography } from '@mui/material';
import React from 'react';
import { DeviceAppSlug, DeviceOSSlug } from '../../data/types/get-devices';
import { NetAccess } from '../network/hooks/use-net-entity-map';
import { AccessLine } from './access-line';
import { AppOSIcon } from './app-os-icon/app-icon';

type AppOSLineProps = {
    slug: DeviceAppSlug | DeviceOSSlug;
    name: string;
    description: string;
    mainAccess?: NetAccess;
    accessList?: NetAccess[];
}

export const AppOSLine: React.FC<React.PropsWithChildren<AppOSLineProps>> = ({
    slug,
    name,
    description,
    mainAccess,
    accessList = [],
    children,
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

            {mainAccess && <>
                <Divider variant='fullWidth' />

                <AccessLine
                    {...mainAccess}
                    disablePadding
                />
            </>}

        </Box>
    )

    return (
        <Paper data-slug={slug} elevation={mainAccess ? 2 : 1} sx={{
            position: 'relative',
            ...(mainAccess ? {} : {
                boxShadow: 'none'
            }),
        }}>
            {mainAccess
                ? <Box sx={{
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
                : content}

            {accessList.length > 0 && <Collapse in={expanded} timeout="auto">
                <List disablePadding>
                    {accessList.map((access, i) => (
                        <AccessLine
                            key={i}
                            {...access}
                            link
                        />
                    ))}
                </List>
            </Collapse>}

            {children}
        </Paper >
    );
}
