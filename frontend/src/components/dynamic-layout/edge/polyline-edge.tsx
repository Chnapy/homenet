import { BaseEdge, Edge, EdgeProps, EdgeText } from "@xyflow/react";
import { ElkEdgeSection, ElkPoint } from "elkjs";
import React from "react";
import { useDevicesFullQuery } from "../../../data/query/use-devices-full-query";
import { themeMap } from "../../theme/theme-provider";
import { ElkLabelWithIcon } from "../hooks/use-layout-algorithm";
import { getPolylinePath } from "./utils/get-polyline-path";
import { useDevicesUserMetadata } from "../../../data/query/use-devices-user-metadata";

export type PolylineEdgeType = Edge<{
  offset?: ElkPoint;
  section: ElkEdgeSection;
  labels?: ElkLabelWithIcon[];
}>;

export const PolylineEdge: React.FC<EdgeProps<PolylineEdgeType>> = ({
  sourceX,
  sourceY,
  data,
  id,
  markerStart,
  markerEnd,
  style,
  labelBgBorderRadius,
  labelBgPadding,
  labelBgStyle,
  labelShowBg,
  labelStyle,
  interactionWidth,
}) => {
  const devicesFullQuery = useDevicesFullQuery();
  const devicesUserMetadata = useDevicesUserMetadata();
  // const netEntityLinks = useNetEntityLinks();

  const { offset = { x: 0, y: 0 } } = data ?? {};

  const initialSource = React.useMemo(
    () => ({ sourceX, sourceY }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keep initial value for related section to compute relative diff
    [data?.section]
  );
  const diffX = sourceX - initialSource.sourceX;
  const diffY = sourceY - initialSource.sourceY;

  // const link = netEntityLinks.data?.find(link => link.id === id)!;

  const getStyles = () => {
    if (!devicesFullQuery.data || !devicesUserMetadata.data) {
      return {};
    }

    const inId = data?.section.incomingShape;
    const ouId = data?.section.outgoingShape;

    if (!inId || !ouId) {
      return {};
    }

    const inMeta = devicesUserMetadata.data[inId];
    // const ouMeta = deviceUserMetaMap[ ouId ];

    const inTheme = themeMap[inMeta.theme];
    // const ouTheme = themeMap[ ouMeta.theme ];

    const pathColor = `color-mix(in HSL, ${inTheme.palette.background.paper} 88%, #FFF)`;

    return {
      path: {
        "--xy-edge-stroke": pathColor,
      },
    };
  };

  // console.log(id, data?.section)

  const withOffset = (pt: ElkPoint) => ({
    x: pt.x + diffX + offset.x,
    y: pt.y + diffY + offset.y,
  });

  const labels: ElkLabelWithIcon[] = (data?.labels ?? []).map((label) => ({
    ...label,
    ...withOffset({
      x: label.x!,
      y: label.y!,
    }),
  }));

  const getEdgePath = (): string => {
    if (!data?.section) {
      return "";
    }

    const section: ElkEdgeSection = {
      ...data.section,
      startPoint: withOffset(data.section.startPoint),
      endPoint: withOffset(data.section.endPoint),
      bendPoints: data.section.bendPoints?.map(withOffset),
    };

    const { startPoint, endPoint, bendPoints = [] } = section;

    // const fullBendPoints = [
    //     startPoint,
    //     ...bendPoints,
    //     endPoint,
    // ];

    // const source = {
    //     x: sourceX,
    //     y: sourceY
    // };

    // const target = {
    //     x: targetX,
    //     y: targetY
    // };

    return getPolylinePath({
      source: startPoint,
      target: endPoint,
      bends: bendPoints,
    });
  };

  const styles = getStyles();

  return (
    <>
      <BaseEdge
        id={id}
        path={getEdgePath()}
        style={{
          ...styles.path,
          ...style,
        }}
        markerEnd={markerEnd}
        markerStart={markerStart}
        interactionWidth={interactionWidth}
      />

      {labels.map((label) =>
        label.icon ? (
          <image
            key={label.id}
            href={label.icon}
            x={label.x}
            y={label.y}
            width={18}
            height={18}
          />
        ) : (
          <EdgeText
            key={label.id}
            x={label.x! + label.width! / 2}
            y={label.y! + label.height! / 2}
            width={label.width}
            height={label.height}
            label={label.text}
            labelStyle={labelStyle}
            labelShowBg={labelShowBg}
            labelBgStyle={{
              ...labelBgStyle,
            }}
            labelBgPadding={labelBgPadding}
            labelBgBorderRadius={labelBgBorderRadius}
          />
        )
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
                // .react-flow__edges { z-index: 1; }

                .react-flow {
                    --xy-edge-label-background-color: transparent; //${
                      themeMap.default.palette.background.default
                    };
                    --xy-edge-label-color: ${
                      themeMap.default.palette.primary.main
                    };
                    --xy-edge-stroke-width: ${3};

                }
                `,
        }}
      />
    </>
  );
};
