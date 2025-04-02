import { useNodesInitialized } from '@xyflow/react';
import ELK, { ElkExtendedEdge, ElkLabel, ElkNode } from 'elkjs/lib/elk.bundled.js';
import React from 'react';
import { useDevicesFullQuery } from '../../../data/query/use-devices-full-query';
import { getIPMask, useNetEntityLinks } from '../../network/hooks/use-net-entity-links';
import { iconMap } from '../../ui/app-os-icon/app-icon';

export type ElkDeviceNode = ElkNode & {
    type?: 'device' | 'group';
    parent?: ElkDeviceNode;
    children: ElkDeviceNode[];
};

export type ElkLabelWithIcon = ElkLabel & {
    icon?: string;
};

export const useLayoutAlgorithm = () => {
    const devicesFullQuery = useDevicesFullQuery();

    const netEntityLinks = useNetEntityLinks();

    const areNodesInitialized = useNodesInitialized();

    return React.useMemo(() => {

        if (!areNodesInitialized || !devicesFullQuery.data || !netEntityLinks.data) {
            return;
        }

        const { deviceMap } = devicesFullQuery.data;
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

                    const groupNode: ElkDeviceNode = acc[ lanMasq ] ?? {
                        id: lanMasq,
                        type: 'group',
                        children: [],
                        labels: [
                            {
                                id: lanMasq + '-label',
                                text: lanMasq + '0',
                                width: lanMasq.length * 6,  // font-size: 16
                                height: 30,
                                layoutOptions: {
                                    'elk.nodeLabels.placement': 'H_LEFT V_TOP OUTSIDE',
                                },
                            }
                        ],
                    };

                    const node: ElkDeviceNode = {
                        id,
                        parent: groupNode,
                        type: 'device',
                        width: card.clientWidth,
                        height: card.clientHeight,
                        children: [],
                    };

                    groupNode.children!.push(node);

                    return {
                        ...acc,
                        [ lanMasq ]: groupNode,
                    };
                }, {} as Record<string, ElkDeviceNode>)

                // remove groups with only 1 child
            ).map(node => {
                if (node.children?.length === 1) {
                    const child = node.children[ 0 ];
                    delete child.parent;
                    return child;
                }

                return node;
            });

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
                        labels: [
                            link.from.relatedApp && {
                                id: link.id + '-label-tail',
                                text: link.from.relatedApp,
                                icon: iconMap[ link.from.relatedApp ],
                                width: 18,
                                height: 18,
                                layoutOptions: {
                                    'elk.edgeLabels.placement': 'TAIL',
                                }
                            },
                            link.label && {
                                id: link.id + '-label-center',
                                text: link.label,
                                width: link.label.length * 5,
                                height: 18,
                                layoutOptions: {
                                    // 'elk.edgeLabels.placement': 'HEAD',
                                    // 'elk.spacing.edgeLabel': '0',
                                    // 'elk.spacing.labelPortHorizontal': '0',
                                    // 'elk.edgeLabels.inline': 'true',
                                    // 'elk.graphviz.labelDistance': '0',
                                    // 'elk.spacing.labelNode': '0',
                                    // 'elk.layered.edgeLabels.sideSelection': 'ALWAYS_UP',
                                }
                            },
                            link.to.relatedApp && {
                                id: link.id + '-label-head',
                                text: link.to.relatedApp,
                                icon: iconMap[ link.to.relatedApp ],
                                width: 18,
                                height: 18,
                                layoutOptions: {
                                    'elk.edgeLabels.placement': 'HEAD',
                                }
                            },
                        ].filter(Boolean) as ElkLabelWithIcon[],
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
    }, [ areNodesInitialized, devicesFullQuery.data, netEntityLinks.data ]);
};
