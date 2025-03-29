import { Box } from '@mui/material';
import ELK from 'elkjs/lib/elk.bundled.js';
import React from 'react';

export type DynamicLayoutProps = {
    enabled: boolean;
}

export const DynamicLayout: React.FC<React.PropsWithChildren<DynamicLayoutProps>> = ({
    enabled,
    children
}) => {
    const rootRef = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
        const rootEl = rootRef.current;
        if (!enabled || !rootEl) {
            return;
        }

        const cards = Array.from(rootEl.querySelectorAll('& > .MuiBox-root')) as HTMLElement[];

        const children = cards.map((card, i) => ({
            id: i.toString(),
            width: card.clientWidth,
            height: card.clientHeight,
        }));
        console.log('CHILDREN', children);

        const elk = new ELK();

        elk.layout({
            id: "root",
            layoutOptions: {
                'elk.algorithm': 'layered',
                'elk.layered.spacing.nodeNodeBetweenLayers': '80',
                // 'elk.spacing.nodeNode': '80',
            },
            children,
            edges: [
                { id: "e1", sources: [ "0" ], targets: [ "1" ] },
                { id: "e2", sources: [ "0" ], targets: [ "2" ] },
                { id: "e3", sources: [ "0" ], targets: [ "3" ] },
                { id: "e4", sources: [ "2" ], targets: [ "3" ] },
            ]
        })
            .then(data => {
                console.log('LAYOUT', data)
                data.children?.forEach(child => {
                    const i = +child.id;
                    const card = cards[ i ];

                    card.style.position = 'absolute';
                    if (child.x) {
                        card.style.left = child.x + 'px';
                    }
                    if (child.y) {
                        card.style.top = child.y + 'px';
                    }
                });

                rootEl.style.position = 'relative';
                rootEl.style.opacity = '1';
            })
            .catch(console.error)
    }, [ enabled ]);

    return <Box
        ref={rootRef}
        sx={{
            opacity: 0,
        }}
    >
        {children}
    </Box>
};
