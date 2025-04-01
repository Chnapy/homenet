import { useEffect, useRef, useState } from 'react';
import {
    useStore,
    useStoreApi,
    type OnNodesChange,
    type NodeChange,
} from '@xyflow/react';
import React from 'react';

type ChangeLoggerProps = {
    color?: string;
    limit?: number;
};

type ChangeInfoProps = {
    change: NodeChange;
};

function ChangeInfo({ change }: ChangeInfoProps) {
    const id = 'id' in change ? change.id : '-';
    const { type } = change;

    return (
        <div style={{ marginBottom: 2 }}>
            <div>node id: {id}</div>
            <div>
                {type === 'add' ? JSON.stringify(change.item, null, 2) : null}
                {type === 'dimensions'
                    ? `dimensions: ${change.dimensions?.width} × ${change.dimensions?.height}`
                    : null}
                {type === 'position'
                    ? `position: ${change.position?.x.toFixed(
                        1,
                    )}, ${change.position?.y.toFixed(1)}`
                    : null}
                {type === 'remove' ? 'remove' : null}
                {type === 'select' ? (change.selected ? 'select' : 'unselect') : null}
            </div>
        </div>
    );
}

export default function ChangeLogger({ limit = 10 }: ChangeLoggerProps) {
    const [ changes, setChanges ] = useState<NodeChange[]>([]);
    const onNodesChangeIntercepted = useRef(false);
    const onNodesChange = useStore((s) => s.onNodesChange);
    const store = useStoreApi();
    const [ open, setOpen ] = React.useState(false);

    useEffect(() => {
        if (!onNodesChange || onNodesChangeIntercepted.current) {
            return;
        }

        onNodesChangeIntercepted.current = true;
        const userOnNodesChange = onNodesChange;

        const onNodesChangeLogger: OnNodesChange = (changes) => {
            userOnNodesChange(changes);

            setChanges((oldChanges) => [ ...changes, ...oldChanges ].slice(0, limit));
        };

        store.setState({ onNodesChange: onNodesChangeLogger });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ onNodesChange, limit ]);

    return (
        <div className="react-flow__devtools-changelogger">
            <button
                onClick={() => setOpen(!open)}
                style={{ pointerEvents: 'all' }}
            >change-logger</button>

            {open && <>
                {changes.length === 0 ? (
                    <>no changes triggered</>
                ) : (
                    changes.map((change, index) => (
                        <ChangeInfo key={index} change={change} />
                    ))
                )}
            </>}

            <style dangerouslySetInnerHTML={{
                __html: `.react-flow__devtools-changelogger {
                position: relative;
                z-index: 10;
                pointer-events: none;
                font-size: 12px;
            }` }} />
        </div>
    );
}
