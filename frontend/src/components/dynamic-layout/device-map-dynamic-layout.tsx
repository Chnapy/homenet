import { useQuery } from '@tanstack/react-query';
import { Background, Edge, NodeTypes, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import React from 'react';
import { useTRPC } from '../../data/trpc';
import { useNetEntityLinks } from '../network/hooks/use-net-entity-links';
import { ContainerFluid } from '../ui/container-fluid';
import { CursorPosition } from './cursor-position';
import { createPointId, DeviceNode, DeviceNodeType } from './device-node-type';
import { useDynamicLayout } from './hooks/use-dynamic-layout';

import '@xyflow/react/dist/style.css';

const nodeTypes: NodeTypes = {
    device: DeviceNodeType,
};

export const DeviceMapDynamicLayout: React.FC = () => {
    const trpc = useTRPC();
    const devicesFullQuery = useQuery(
        trpc.getDevicesFull.queryOptions()
    );

    const netEntityLinks = useNetEntityLinks();

    const getNodesState = () => Object.keys(devicesFullQuery.data?.deviceMap ?? {})
        .map(deviceKey => ({
            type: 'device',
            id: deviceKey,
            data: {},
            position: { x: 0, y: 0 }
        } satisfies DeviceNode));

    const [ nodes, setNodes, onNodesChange ] = useNodesState<DeviceNode>(getNodesState());
    const [ edges, setEdges, onEdgesChange ] = useEdgesState<Edge>([]);
    // const { fitView } = useReactFlow();

    const dynamicLayout = useDynamicLayout();

    // console.log({ data, nodes, edges });

    // query results
    React.useEffect(() => {
        setNodes(getNodesState());
    }, [ devicesFullQuery.data, netEntityLinks.data ]);

    React.useEffect(() => {
        if (!dynamicLayout) {
            return;
        }

        dynamicLayout().then((layout) => {

            const edgesSections = (layout.edges ?? []).flatMap(edge => edge.sections ?? []);

            const newNodes = (layout.children ?? []).map(({ id, x, y, width, height }): DeviceNode => ({
                type: 'device',
                id,
                data: {
                    sources: edgesSections
                        .filter(section => section.incomingShape === id)
                        .map(section => section.startPoint),
                    targets: edgesSections
                        .filter(section => section.outgoingShape === id)
                        .map(section => section.endPoint),
                },
                position: { x: x!, y: y! },
                width,
                height,
                measured: { width, height },
            }));

            const newEdges = (layout.edges ?? []).map(({
                id, sources, targets, sections
            }): Edge => ({
                id,
                source: sources[ 0 ],
                sourceHandle: createPointId(sections![ 0 ].startPoint),
                target: targets[ 0 ],
                targetHandle: createPointId(sections![ 0 ].endPoint),
                type: 'smoothstep',
            }));

            console.log({ layout, newNodes, newEdges, edgesSections });

            setNodes(newNodes);

            const applyEdgesWithHandles = () => {
                const hasHandles = document.querySelectorAll('[data-handleid]').length > 0;

                if (hasHandles) {
                    setEdges(newEdges);

                    // fitView({ minZoom: 1 });
                } else {
                    requestAnimationFrame(applyEdgesWithHandles);
                }
            };

            applyEdgesWithHandles();
        });
    }, [ dynamicLayout ]);

    return (
        <ContainerFluid>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                // minZoom={1}
                // maxZoom={1}
                // fitView
                style={{
                    cursor: 'crosshair',
                    opacity: edges.length > 0 ? 1 : 0,
                    transition: 'opacity .4s'
                }}
            >
                <Background />
                {/* <MiniMap /> */}
            </ReactFlow>

            <CursorPosition />
        </ContainerFluid>
    );
};
