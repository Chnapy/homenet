import { Button, Menu, MenuItem, useColorScheme } from '@mui/material';
import React from 'react';

export function ModeToggle() {
    const [ anchorEl, setAnchorEl ] = React.useState<null | HTMLElement>(null);
    const { mode = 'dark', setMode } = useColorScheme();
    // console.log(mode)
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClose = (mode?: any) => {
        if (mode) {
            console.log('SET', mode)
            setMode(mode);
        }
        setAnchorEl(null);
    };

    return (
        <>
            <Button
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
            >
                {mode}
            </Button>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                <MenuItem onClick={() => handleClose('light')}>Light</MenuItem>
                <MenuItem onClick={() => handleClose('dark')}>Dark</MenuItem>
                <MenuItem onClick={() => handleClose('system')}>System</MenuItem>
            </Menu>
        </>
    )
}
