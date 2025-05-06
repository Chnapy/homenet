import {
  Background,
  EdgeTypes,
  MarkerType,
  Node,
  NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { ElkPoint } from "elkjs";
import React from "react";
import { useDevicesFullQuery } from "../../data/query/use-devices-full-query";
import { useNetEntityLinks } from "../network/hooks/use-net-entity-links";
import { themeMap } from "../theme/theme-provider";
import { ContainerFluid } from "../ui/container-fluid";
import ViewportLogger from "./devtools/viewport-logger";
import { PolylineEdge, PolylineEdgeType } from "./edge/polyline-edge";
import { useLayoutAlgorithm } from "./hooks/use-layout-algorithm";
import { DeviceNode, DeviceNodeType } from "./node/device-node";
import { useDevicesUserMetadata } from "../../data/query/use-devices-user-metadata";

import "@xyflow/react/dist/style.css";

type AnyNode = DeviceNodeType | Node<{ label: React.ReactNode }, "default">;

const nodeTypes: NodeTypes = {
  device: DeviceNode,
};

const edgeTypes: EdgeTypes = {
  polyline: PolylineEdge,
};

// memo required for layout algorithm concerns
export const DynamicLayoutFlow: React.FC = React.memo(() => {
  const devicesFullQuery = useDevicesFullQuery();
  const devicesUserMetadata = useDevicesUserMetadata();
  const netEntityLinks = useNetEntityLinks();

  const processingRef = React.useRef(false);

  const getNodesState = () =>
    (devicesFullQuery.data?.deviceList ?? []).map(
      ({ id }): AnyNode => ({
        type: "device",
        id,
        data: {},
        position: { x: 0, y: 0 },
      })
    );

  const [nodes, setNodes, onNodesChange] = useNodesState<AnyNode>(
    getNodesState()
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<PolylineEdgeType>([]);
  // const { fitView } = useReactFlow();

  const getLayoutAlgorithm = useLayoutAlgorithm();

  // query results
  React.useEffect(() => {
    setNodes(getNodesState());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- when data fetching ends only
  }, [devicesFullQuery.data, netEntityLinks.data]);

  React.useEffect(() => {
    if (
      processingRef.current ||
      !getLayoutAlgorithm ||
      !devicesFullQuery.data ||
      !devicesUserMetadata.data
    ) {
      return;
    }

    processingRef.current = true;

    const getNodesFromLayout = (
      layout: Awaited<ReturnType<typeof getLayoutAlgorithm>>
    ) => {
      const edgesSections = (layout.edges ?? []).flatMap(
        (edge) => edge.sections ?? []
      );

      const everyChildren = (layout.children ?? []).flatMap((child) => [
        child,
        ...(child.children ?? []),
      ]);

      const newNodes = everyChildren.map(
        ({ id, x, y, width, height, type, labels, parent }): AnyNode => {
          const partialNode = {
            id,
            parentId: parent?.id,
            position: { x: x!, y: y! },
            width,
            height,
            measured: { width, height },
            draggable: false,
          } satisfies Partial<AnyNode>;

          if (type === "group") {
            const groupLabel = labels?.[0];
            return {
              ...partialNode,
              selectable: false,
              data: {
                label: groupLabel && (
                  <div
                    style={{
                      float: "left",
                      transform: `translate(${groupLabel.x}px, ${groupLabel.y}px)`,
                      fontSize: 16,
                    }}
                  >
                    {groupLabel.text ?? null}
                  </div>
                ),
              },
              style: {
                backgroundColor: "transparent",
                border: "2px dashed currentColor",
                borderRadius: 16,
              },
            };
          }

          return {
            type,
            ...partialNode,
            data: {
              sources: edgesSections.filter(
                (section) => section.incomingShape === id
              ),
              targets: edgesSections.filter(
                (section) => section.outgoingShape === id
              ),
              offset: {
                x: parent?.x ?? 0,
                y: parent?.y ?? 0,
              },
            },
          };
        }
      );

      return {
        everyChildren,
        newNodes,
      };
    };

    // 1st process for nodes only
    getLayoutAlgorithm()
      .then((layout) => {
        const { newNodes } = getNodesFromLayout(layout);

        setNodes(newNodes);

        console.log("1st process layout", { layout, newNodes });
      })
      // 2nd process for group nodes & edges
      .then(getLayoutAlgorithm)
      .then((layout) => {
        const { everyChildren, newNodes } = getNodesFromLayout(layout);

        const newEdges = (layout.edges ?? []).map(
          ({ id, sources, targets, sections, labels }): PolylineEdgeType => {
            // const link = netEntityLinks.data!.find(link => link.id === id)!;

            const source = sources[0];
            const target = targets[0];

            // get source/target offset handling group/no-group cases
            const getOffset = (): ElkPoint | undefined => {
              const sourceNode = everyChildren.find(
                (child) => child.id === source
              );
              const targetNode = everyChildren.find(
                (child) => child.id === target
              );

              if (
                sourceNode?.parent &&
                sourceNode.parent.id === targetNode?.parent?.id
              ) {
                return {
                  x: sourceNode.parent.x ?? 0,
                  y: sourceNode.parent.y ?? 0,
                };
              }
            };

            const deviceUserMetaMap = devicesUserMetadata.data ?? {};

            const inMeta = deviceUserMetaMap[source];
            // const ouMeta = deviceUserMetaMap[ target ];

            const inTheme = themeMap[inMeta.theme];
            // const ouTheme = themeMap[ ouMeta.theme ];

            const pathColor = `color-mix(in HSL, ${inTheme.palette.background.paper} 88%, #FFF)`;

            return {
              type: "polyline",
              id,
              source,
              sourceHandle: id,
              target,
              targetHandle: id,
              selectable: false,
              // animated: true,
              data: {
                offset: getOffset(),
                section: sections![0],
                labels,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                strokeWidth: 1,
                color: pathColor,
                width: 8,
              },
            };
          }
        );

        setNodes(newNodes);
        setEdges(newEdges);

        console.log("2nd process layout", { layout, newNodes, newEdges });
      })
      .finally(() => {
        processingRef.current = false;
      });
  }, [
    devicesFullQuery.data,
    devicesUserMetadata.data,
    getLayoutAlgorithm,
    setEdges,
    setNodes,
  ]);

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
        draggable={false}
        proOptions={{ hideAttribution: true }}
        style={{
          opacity: nodes.length === 1 || edges.length > 0 ? 1 : 0,
          transition: "opacity .2s",
        }}
      >
        <Background />

        {/* <ChangeLogger />
                <NodeInspector /> */}
        <ViewportLogger />
      </ReactFlow>

      {/* <CursorPosition /> */}
    </ContainerFluid>
  );
});
