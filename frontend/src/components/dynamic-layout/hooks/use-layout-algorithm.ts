import { useQuery } from '@tanstack/react-query';
import { useNodesInitialized } from '@xyflow/react';
import ELK, { ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk.bundled.js';
import React from 'react';
import { useTRPC } from '../../../data/trpc';
import { getIPMask, useNetEntityLinks } from '../../network/hooks/use-net-entity-links';

export type ElkDeviceNode = ElkNode & {
    type?: 'device' | 'group';
    parent?: ElkDeviceNode;
    children: ElkDeviceNode[];
};

export const useLayoutAlgorithm = () => {
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

        const { deviceMap } = devicesFull.data;
        const deviceList = Object.values(deviceMap);

        const elk = new ELK();

        return async () => {

            const cardsSelector = deviceList.map(({ id }) => `[data-id="${id}"]`).join(',')
            const cards = Array.from(document.querySelectorAll<HTMLElement>(cardsSelector));

            const children = Object.values(
                cards.reduce((acc, card) => {
                    const id = card.dataset.id!;
                    const device = deviceMap[ id ];

                    // if (id === 'uuid-router') {
                    //     return {
                    //         ...acc,
                    //         [ id ]: {
                    //             id,
                    //             type: 'device',
                    //             width: card.clientWidth,
                    //             height: card.clientHeight,
                    //             children: [],
                    //         } satisfies ElkDeviceNode,
                    //     }
                    // }

                    const lanMasq = getIPMask(device.lan);

                    const netNode: ElkDeviceNode = acc[ lanMasq ] ?? {
                        id: lanMasq,
                        type: 'group',
                        children: [],
                    };

                    const node: ElkDeviceNode = {
                        id,
                        parent: netNode,
                        type: 'device',
                        width: card.clientWidth,
                        height: card.clientHeight,
                        children: [],
                    };

                    netNode.children!.push(node);

                    return {
                        ...acc,
                        [ lanMasq ]: netNode,
                    };
                }, {} as Record<string, ElkDeviceNode>)
            );

            const edges = netEntityLinks.data
                .map((link): ElkExtendedEdge => {
                    const getId = (entityId: string) => {
                        if (deviceMap[ entityId ]) {
                            return entityId;
                        }

                        const idFromInstance = deviceList.find(device => device.instances?.some(instance => instance.id === entityId))?.id;
                        if (idFromInstance) {
                            return idFromInstance;
                        }

                        throw new Error('id not found ' + entityId);
                    }

                    const fromId = getId(link.from.device);
                    const toId = getId(link.to.device);

                    return {
                        id: link.id,
                        sources: [ fromId ],
                        targets: [ toId ],
                    };
                });

            const data = await elk.layout<ElkDeviceNode>({
                id: "root",
                layoutOptions: {
                    'elk.algorithm': 'layered',
                    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
                    'elk.layered.spacing.nodeNodeBetweenLayers': '80',
                },
                children,
                edges,
            });

            return data;
        };
    }, [ areNodesInitialized, devicesFull.data, netEntityLinks.data ]);
};
