import { useQuery } from '@tanstack/react-query';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { ElkPoint } from 'elkjs';
import React from 'react';
import { useTRPC } from '../../../data/trpc';
import { useNetEntityLinks } from '../../network/hooks/use-net-entity-links';
import { DeviceNodeType } from './device-node';

export const DeviceNodeHandles: React.FC<NodeProps<DeviceNodeType>> = ({ data, width, height, ...rest }) => {
    const trpc = useTRPC();
    const devicesFullQuery = useQuery(
        trpc.getDevicesFull.queryOptions()
    );
    const deviceList = Object.values(devicesFullQuery.data?.deviceMap ?? {});

    const deviceIds = deviceList.flatMap(device => {
        const allIds = [
            device.id,
            ...(device.instances ?? []).map(instance => instance.id),
        ];

        if (allIds.includes(rest.id)) {
            return allIds;
        }

        return [];
    });

    const netEntityLinks = useNetEntityLinks();

    const offset = data.offset ?? { x: 0, y: 0 };

    const { positionAbsoluteX, positionAbsoluteY } = React.useMemo(() => ({
        positionAbsoluteX: rest.positionAbsoluteX,
        positionAbsoluteY: rest.positionAbsoluteY,
        // eslint-disable-next-line react-hooks/exhaustive-deps -- memoize x/y for dragging case
    }), [ width, height, data.sources, data.targets ]);

    const getPositionAndStyle = ({ x, y }: ElkPoint): {
        position: Position;
        style: React.CSSProperties;
    } => {
        const relativeX = x - positionAbsoluteX;
        const relativeY = y - positionAbsoluteY;

        const relativePositions = [
            {
                relativeX,
                relativeY
            },
            {
                relativeX: relativeX + offset.x,
                relativeY: relativeY + offset.y,
            },
        ];

        const value = relativePositions.map(({ relativeX, relativeY }) => {

            if (relativeX === 0) {
                return {
                    position: Position.Left,
                    style: {
                        top: relativeY,
                    },
                };
            }

            if (relativeY === 0) {
                return {
                    position: Position.Top,
                    style: {
                        left: relativeX,
                    },
                };
            }

            if (relativeX === width) {
                return {
                    position: Position.Right,
                    style: {
                        top: relativeY,
                    },
                };
            }

            if (relativeY === height) {
                return {
                    position: Position.Bottom,
                    style: {
                        left: relativeX,
                    },
                };
            }
        }).find(Boolean);

        if (value) {
            return value;
        }

        // if (rest.id === 'uuid-media')
        console.error('GetPosition failure', { id: rest.id, x, y, relativeX, relativeY, positionAbsoluteX, positionAbsoluteY, offset });
        return {
            position: Position.Left,
            style: {},
        };
    };

    if (!netEntityLinks.data) {
        return null;
    }

    const handles = netEntityLinks.data.map(link => {
        const renderSourceHandle = () => {
            if (!deviceIds.includes(link.from.device)) {
                return null;
            }

            return <Handle
                id={link.id}
                type="source"
                {...(data.sources
                    ? getPositionAndStyle(
                        data.sources.find(value => value.id === link.id + '_s0')!.startPoint
                    )
                    : {
                        position: Position.Left,
                        style: {
                            display: 'none',
                        },
                    })}
            />;
        };

        const renderTargetHandle = () => {
            if (!deviceIds.includes(link.to.device)) {
                return null;
            }

            return <Handle
                id={link.id}
                type="target"
                {...(data.targets
                    ? getPositionAndStyle(
                        data.targets.find(value => value.id === link.id + '_s0')!.endPoint
                    )
                    : {
                        position: Position.Left,
                        style: {
                            display: 'none',
                        },
                    })}
            />;
        };

        return <React.Fragment key={link.id}>
            {renderSourceHandle()}
            {renderTargetHandle()}
        </React.Fragment>;
    })

    return <>
        {handles}
    </>;

};
