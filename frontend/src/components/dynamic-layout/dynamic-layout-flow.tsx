import { useQuery } from '@tanstack/react-query';
import { Background, EdgeTypes, NodeTypes, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import { ElkPoint } from 'elkjs';
import React from 'react';
import { useTRPC } from '../../data/trpc';
import { useNetEntityLinks } from '../network/hooks/use-net-entity-links';
import { ContainerFluid } from '../ui/container-fluid';
import ChangeLogger from './devtools/change-logger';
import { CursorPosition } from './devtools/cursor-position';
import NodeInspector from './devtools/node-inspector';
import ViewportLogger from './devtools/viewport-logger';
import { PolylineEdge, PolylineEdgeType } from './edge/polyline-edge';
import { useLayoutAlgorithm } from './hooks/use-layout-algorithm';
import { DeviceNode, DeviceNodeType } from './node/device-node';

import '@xyflow/react/dist/style.css';

const nodeTypes: NodeTypes = {
    device: DeviceNode,
};

const edgeTypes: EdgeTypes = {
    polyline: PolylineEdge,
};

export const DynamicLayoutFlow: React.FC = () => {
    const trpc = useTRPC();
    const devicesFullQuery = useQuery(
        trpc.getDevicesFull.queryOptions()
    );

    const netEntityLinks = useNetEntityLinks();

    const getNodesState = () => Object.keys(devicesFullQuery.data?.deviceMap ?? {})
        .map((deviceKey): DeviceNodeType => ({
            type: 'device',
            id: deviceKey,
            data: {},
            position: { x: 0, y: 0 }
        }));

    const [ nodes, setNodes, onNodesChange ] = useNodesState<DeviceNodeType>(getNodesState());
    const [ edges, setEdges, onEdgesChange ] = useEdgesState<PolylineEdgeType>([]);
    // const { fitView } = useReactFlow();

    const getLayoutAlgorithm = useLayoutAlgorithm();

    // console.log({ data, nodes, edges });

    // query results
    React.useEffect(() => {
        setNodes(getNodesState());
        // eslint-disable-next-line react-hooks/exhaustive-deps -- when data fetching ends only
    }, [ devicesFullQuery.data, netEntityLinks.data ]);

    React.useEffect(() => {
        if (!getLayoutAlgorithm) {
            return;
        }

        getLayoutAlgorithm().then((layout) => {

            const edgesSections = (layout.edges ?? []).flatMap(edge => edge.sections ?? []);

            const everyChildren = (layout.children ?? [])
                .flatMap(child => [ child, ...child.children ?? [] ]);

            const newNodes = everyChildren.map(({
                id, x, y, width, height, type, parent
            }): DeviceNodeType => {

                return {
                    type,
                    id,
                    parentId: parent?.id,
                    data: {
                        sources: edgesSections
                            .filter(section => section.incomingShape === id),
                        targets: edgesSections
                            .filter(section => section.outgoingShape === id),
                        offset: {
                            x: parent?.x ?? 0,
                            y: parent?.y ?? 0,
                        },
                    },
                    position: { x: x!, y: y! },
                    width,
                    height,
                    measured: { width, height },
                    draggable: type === 'group',
                };
            });

            const newEdges = (layout.edges ?? []).map(({
                id, sources, targets, sections
            }): PolylineEdgeType => {

                const source = sources[ 0 ];
                const target = targets[ 0 ];

                const getOffset = (): ElkPoint | undefined => {
                    const sourceNode = everyChildren.find(child => child.id === source);
                    const targetNode = everyChildren.find(child => child.id === target);

                    if (sourceNode?.parent && targetNode?.parent) {
                        return {
                            x: sourceNode.parent.x ?? 0,
                            y: sourceNode.parent.y ?? 0,
                        };
                    }
                };

                return {
                    // type: 'smoothstep',
                    type: 'polyline',
                    id,
                    source,
                    sourceHandle: id,
                    target,
                    targetHandle: id,
                    data: {
                        offset: getOffset(),
                        section: sections![ 0 ],
                    },
                };
            });

            console.log({ layout, newNodes, newEdges, edgesSections });

            setNodes(newNodes);
            setEdges(newEdges);
        });
    }, [ getLayoutAlgorithm, setEdges, setNodes ]);

    return (
        <ContainerFluid>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                // minZoom={1}
                // maxZoom={1}
                // fitView
                proOptions={{ hideAttribution: true }}
                style={{
                    cursor: 'crosshair',
                    opacity: edges.length > 0 ? 1 : 0,
                    transition: 'opacity .2s',
                }}
            >
                <Background />

                <ChangeLogger />
                <NodeInspector />
                <ViewportLogger />
            </ReactFlow>

            <CursorPosition />
        </ContainerFluid>
    );
};
