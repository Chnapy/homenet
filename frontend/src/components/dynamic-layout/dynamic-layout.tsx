import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import ELK from 'elkjs/lib/elk.bundled.js';
import React from 'react';
import { useTRPC } from '../../data/trpc';
import { useNetEntityLinks } from '../network/hooks/use-net-entity-links';

export type DynamicLayoutProps = {
    enabled: boolean;
}

export const DynamicLayout: React.FC<React.PropsWithChildren<DynamicLayoutProps>> = ({
    enabled,
    children
}) => {
    const rootRef = React.useRef<HTMLElement>(null);

    const trpc = useTRPC();
    const devicesFull = useQuery(
        trpc.getDevicesFull.queryOptions()
    );

    const netEntityLinks = useNetEntityLinks();

    React.useEffect(() => {
        const rootEl = rootRef.current;
        if (!enabled || !rootEl || !devicesFull.data || !netEntityLinks.data) {
            return;
        }

        const { deviceMap } = devicesFull.data;

        const cards = Array.from(rootEl.querySelectorAll<HTMLElement>('[data-device-key]'));

        const children = cards.map((card) => ({
            id: card.dataset.deviceKey!,
            width: card.clientWidth,
            height: card.clientHeight,
        }));

        const elk = new ELK();

        elk.layout({
            id: "root",
            layoutOptions: {
                'elk.algorithm': 'layered',
                'elk.layered.spacing.nodeNodeBetweenLayers': '80',
                // 'elk.spacing.nodeNode': '80',
            },
            children,
            edges: netEntityLinks.data
                .filter(link => deviceMap[ link.from.device ] && deviceMap[ link.to.device ])
                .map(link => ({
                    id: `${link.from.device}_${link.from.relatedApp}-${link.to.device}_${link.to.relatedApp}`,
                    sources: [ link.from.device ],
                    targets: [ link.to.device ],
                })),
        })
            .then(data => {
                data.children?.forEach(child => {
                    const card = cards.find(item => item.dataset.deviceKey === child.id)!;

                    card.style.position = 'absolute';
                    if (child.x) {
                        card.style.left = child.x + 'px';
                    }
                    if (child.y) {
                        card.style.top = child.y + 'px';
                    }
                });

                rootEl.style.position = 'relative';
            })
            .catch(console.error)
            .finally(() => {
                rootEl.style.opacity = '1';
            })
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
