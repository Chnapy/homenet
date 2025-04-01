import {
    useNodes,
    useReactFlow,
    ViewportPortal,
    type XYPosition,
} from '@xyflow/react';
import React from 'react';

export default function NodeInspector() {
    const { getInternalNode } = useReactFlow();
    const nodes = useNodes();

    return (
        <ViewportPortal>
            <div className="react-flow__devtools-nodeinspector">
                {nodes.map((node) => {
                    const internalNode = getInternalNode(node.id);
                    if (!internalNode) {
                        return null;
                    }

                    const absPosition = internalNode?.internals.positionAbsolute;

                    return (
                        <NodeInfo
                            key={node.id}
                            id={node.id}
                            selected={!!node.selected}
                            type={node.type || 'default'}
                            position={node.position}
                            absPosition={absPosition}
                            width={node.width ?? node.measured?.width ?? 0}
                            height={node.height ?? node.measured?.height ?? 0}
                            data={node.data}
                        />
                    );
                })}

                <style dangerouslySetInnerHTML={{
                    __html: `.react-flow__devtools-nodeinspector {
                // position: relative;
                z-index: 10;
                pointer-events: none;
                user-select: none;
                font-size: 10px;
            }` }} />
            </div>
        </ViewportPortal>
    );
}

type NodeInfoProps = {
    id: string;
    type: string;
    selected: boolean;
    position: XYPosition;
    absPosition: XYPosition;
    width?: number;
    height?: number;
    data: object;
};

const NodeInfo: React.FC<NodeInfoProps> = ({
    id,
    type,
    selected,
    position,
    absPosition,
    width,
    height,
    data,
}) => {
    const [ open, setOpen ] = React.useState(false);
    if (!width || !height) {
        return null;
    }

    return (
        <div
            style={{
                position: 'absolute',
                transform: `translate(${absPosition.x}px, ${absPosition.y + height}px)`,
                width,
                pointerEvents: 'all',
            }}
        >
            <button onClick={() => setOpen(!open)}>open</button>

            {open && <div
                className="react-flow__devtools-nodeinfo"
                style={{
                    maxHeight: 300,
                    overflow: 'auto',
                }}
            >
                <div>id: {id}</div>
                <div>type: {type}</div>
                <div>selected: {selected ? 'true' : 'false'}</div>
                <div>
                    position: {position.x.toFixed(1)}, {position.y.toFixed(1)}
                </div>
                <div>
                    dimensions: {width} × {height}
                </div>
                <pre>data: {JSON.stringify(data, null, 2)}</pre>
            </div>}
        </div>
    );
};
