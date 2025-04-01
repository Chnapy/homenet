import { Node, NodeProps } from '@xyflow/react';
import { ElkEdgeSection, ElkPoint } from 'elkjs';
import React from 'react';
import { Device } from '../../device/device';
import { DeviceNodeHandles } from './device-node-handles';

export type DeviceNodeType = Node<{
    sources?: ElkEdgeSection[];
    targets?: ElkEdgeSection[];
    offset?: ElkPoint;
}>;

export const DeviceNode: React.FC<NodeProps<DeviceNodeType>> = (props) => {

    return (
        <Device deviceId={props.id}>
            <DeviceNodeHandles {...props} />
        </Device>
    );
};
