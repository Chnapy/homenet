import { Box } from '@mui/material';
import React from 'react';

export const ContainerFluid: React.FC<React.PropsWithChildren> = ({ children }) => {
    // const rootRef = React.useRef<HTMLElement>(null);

    // React.useEffect(() => {
    //     const handleWindowResize = () => {
    //         const { innerWidth, innerHeight } = window;

    //         const rootEl = rootRef.current;
    //         if (rootEl) {
    //             rootEl.style.width = innerWidth + 'px';
    //             rootEl.style.height = innerHeight + 'px';
    //             // fitView();
    //         }
    //     };

    //     // window.addEventListener('resize', handleWindowResize, true);

    //     // return () => {
    //     //     window.removeEventListener('resize', handleWindowResize);
    //     // };
    // }, [])

    return <Box
        // ref={rootRef}
        sx={{
            width: '100%',
            height: '100%',
        }}
    >
        {children}
    </Box>
};
