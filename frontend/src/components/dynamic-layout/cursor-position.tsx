import { Box } from '@mui/material';
import React from 'react';

/**
 * For debug purpose.
 */
export const CursorPosition: React.FC = () => {
    const popoverRef = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
        const el = popoverRef.current;
        if (!el) {
            return;
        }

        window.addEventListener('pointermove', (e) => {
            el.textContent = `${e.clientX}, ${e.clientY}`;
            el.style.left = e.clientX + 'px';
            el.style.top = e.clientY + 'px';
            el.style.opacity = '1';
        });
    }, [])

    return <>
        <Box
            ref={popoverRef}
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 9999,
                px: 0.5,
                py: 0.25,
                backgroundColor: '#202020',
                border: '1px solid #EEE',
                pointerEvents: 'none',
                opacity: 0,
            }}
        >
            0, 0
        </Box>
        <style dangerouslySetInnerHTML={{
            __html: `* {
                cursor: crosshair !important;
            }`
        }} />
    </>;
}
