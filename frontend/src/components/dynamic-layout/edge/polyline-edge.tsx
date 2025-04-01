import { BaseEdge, Edge, EdgeProps } from '@xyflow/react';
import { ElkEdgeSection, ElkPoint } from 'elkjs';
import React from 'react';
import { getPolylinePath } from './utils/get-polyline-path';

export type PolylineEdgeType = Edge<{
    offset?: ElkPoint;
    section: ElkEdgeSection;
}>;

export const PolylineEdge: React.FC<EdgeProps<PolylineEdgeType>> = ({
    sourceX, sourceY, data, id, markerStart, markerEnd, style,
    label, labelBgBorderRadius, labelBgPadding, labelBgStyle, labelShowBg, labelStyle, interactionWidth
}) => {
    const { offset = { x: 0, y: 0 } } = data!;

    // console.log(props.id, sourceX, sourceY)

    // eslint-disable-next-line react-hooks/exhaustive-deps -- keep initial value for related section to compute relative diff
    const initialSource = React.useMemo(() => ({ sourceX, sourceY }), [ data?.section ]);
    const diffX = sourceX - initialSource.sourceX;
    const diffY = sourceY - initialSource.sourceY;

    const withOffset = (pt: ElkPoint) => ({
        x: pt.x + diffX + offset.x,
        y: pt.y + diffY + offset.y,
    });

    const getEdgePath = () => {
        if (!data?.section) {
            return '';
        }

        const section: ElkEdgeSection = {
            ...data.section,
            startPoint: withOffset(data.section.startPoint),
            endPoint: withOffset(data.section.endPoint),
            bendPoints: data.section.bendPoints?.map(withOffset),
        };

        const { startPoint, endPoint, bendPoints = [] } = section;

        return getPolylinePath({
            source: startPoint,
            target: endPoint,
            bends: bendPoints,
        });
    };

    // console.log(edgePath, props)

    // let labels: (Label | string | React.ReactNode)[] = []
    // if (props.label) {
    //     labels.push(props.label as string)
    // }
    // if (props.data?.labels?.length > 0) {
    //     labels = labels.concat(props.data?.labels)
    // }

    return (
        <>
            <BaseEdge
                id={id}
                path={getEdgePath()}
                label={label}
                labelStyle={labelStyle}
                labelShowBg={labelShowBg}
                labelBgStyle={labelBgStyle}
                labelBgPadding={labelBgPadding}
                labelBgBorderRadius={labelBgBorderRadius}
                style={style}
                markerEnd={markerEnd}
                markerStart={markerStart}
                interactionWidth={interactionWidth}
            />
            {/* <EdgeLabelRenderer>
                <EdgeLabels
                    labels={labels}
                    ownerId={props.id}
                    labelBoxes={props.data?.yData?.labelBoxes ?? []}
                    labelStyle={props.labelStyle}
                    key={`${props.id}-edgeLabels`}
                ></EdgeLabels>
            </EdgeLabelRenderer> */}
        </>
    );
};
