import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { ElkPoint } from 'elkjs';
import React from 'react';
import { useTRPC } from '../../data/trpc';
import { DeviceCard } from '../device/device-card';
import { DeviceContext } from '../device/provider/device-provider';
import { ThemeProvider } from '../theme/theme-provider';

export type DeviceNode = Node<{
    sources?: ElkPoint[];
    targets?: ElkPoint[];
}>;

export const createPointId = ({ x, y }: ElkPoint) => `${x}-${y}`;

export const DeviceNodeType: React.FC<NodeProps<DeviceNode>> = ({ id, data, positionAbsoluteX, positionAbsoluteY, width, height }) => {
    const rootRef = React.useRef<HTMLElement>(null);
    const trpc = useTRPC();
    const devicesFullQuery = useQuery(
        trpc.getDevicesFull.queryOptions()
    );

    const handles = React.useMemo(() => {

        const getRelativePosition = ({ x, y }: ElkPoint) => {
            const relativeX = x - positionAbsoluteX;
            const relativeY = y - positionAbsoluteY;

            const getPositionAndStyle = (): {
                position: Position;
                style: React.CSSProperties;
            } => {
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

                console.error('GetPosition failure', { x, y, relativeX, relativeY, width, height });
                return {
                    position: Position.Left,
                    style: {},
                };
            };

            return {
                id: createPointId({ x, y }),
                x,
                y,
                relativeX,
                relativeY,
                ...getPositionAndStyle(),
            };
        };

        const sourcesPositions = data.sources?.map(getRelativePosition);
        const targetsPositions = data.targets?.map(getRelativePosition);

        return <>
            {sourcesPositions?.map(({ id, position, style }) => (
                <Handle
                    key={id}
                    id={id}
                    type="source"
                    position={position}
                    style={style}
                />
            ))}

            {targetsPositions?.map(({ id, position, style }) => (
                <Handle
                    key={id}
                    id={id}
                    type="target"
                    position={position}
                    style={style}
                />
            ))}
        </>;

        // ignore x/y for dragging case
    }, [ width, height, data.sources, data.targets ]);

    if (!devicesFullQuery.data) {
        return null;
    }

    const { deviceMap, deviceUserMetaMap } = devicesFullQuery.data;

    const device = deviceMap[ id ];
    const deviceUserMeta = deviceUserMetaMap[ id ];

    return (
        <ThemeProvider key={id} themeName={deviceUserMeta.theme}>
            <DeviceContext.Provider
                value={{
                    device,
                    deviceUserMeta,
                }}
            >
                {handles}

                <Box
                    ref={rootRef}
                    data-device-key={id}
                    sx={{
                        width: 'fit-content',
                        // margin: 6
                    }}
                >
                    <DeviceCard />
                </Box>
            </DeviceContext.Provider>
        </ThemeProvider >
    );
};
