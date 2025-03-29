import { useQuery } from '@tanstack/react-query';
import { useNodesInitialized } from '@xyflow/react';
import ELK, { ElkNode } from 'elkjs/lib/elk.bundled.js';
import React from 'react';
import { useTRPC } from '../../../data/trpc';
import { useNetEntityLinks } from '../../network/hooks/use-net-entity-links';

export const useDynamicLayout = () => {
    const trpc = useTRPC();
    const devicesFull = useQuery(
        trpc.getDevicesFull.queryOptions()
    );

    const netEntityLinks = useNetEntityLinks();

    const areNodesInitialized = useNodesInitialized();

    return React.useMemo(() => {

        if (!areNodesInitialized || !devicesFull.data || !netEntityLinks.data) {
            return;
        }

        return async () => {
            const { deviceMap } = devicesFull.data;

            const cards = Array.from(document.querySelectorAll<HTMLElement>('.react-flow__node-device'));

            const children = cards.map((card) => ({
                id: card.dataset.id!,
                width: card.clientWidth,
                height: card.clientHeight,
                // targetPosition: 'top',
                // sourcePosition: 'bottom',
            }));

            const elk = new ELK();

            const data = await elk.layout<ElkNode>({
                id: "root",
                layoutOptions: {
                    'elk.algorithm': 'layered',
                    'elk.layered.spacing.nodeNodeBetweenLayers': '80',
                    // 'elk.spacing.nodeNode': '80',
                    // 'elk.direction': 'DOWN',
                },
                children,
                edges: netEntityLinks.data
                    .filter(link => deviceMap[ link.from.device ] && deviceMap[ link.to.device ])
                    .map(link => ({
                        id: `${link.from.device}_${link.from.relatedApp}-${link.to.device}_${link.to.relatedApp}`,
                        sources: [ link.from.device ],
                        targets: [ link.to.device ],
                    })),
            });

            return data;
        };
    }, [ areNodesInitialized, devicesFull.data, netEntityLinks.data ]);
};
