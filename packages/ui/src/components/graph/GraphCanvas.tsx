"use client";

import { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import { useGraphStore } from "@/lib/store";
import { buildReactFlowElements } from "@/lib/graph-layout";
import { GraphNodeComponent } from "./GraphNode";

const nodeTypes = {
  graphNode: GraphNodeComponent,
};

function GraphCanvasInner() {
  const graph = useGraphStore((s) => s.graph);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const getFilteredNodes = useGraphStore((s) => s.getFilteredNodes);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);

  const { fitView } = useReactFlow();

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  const filteredNodes = getFilteredNodes();

  // Rebuild layout when filter or selection changes
  useEffect(() => {
    if (!graph) return;

    const filteredEdges = graph.edges.filter((e) => {
      const hasSource = filteredNodes.some((n) => n.id === e.source);
      const hasTarget = filteredNodes.some((n) => n.id === e.target);
      return hasSource && hasTarget;
    });

    const { nodes, edges } = buildReactFlowElements(
      filteredNodes,
      filteredEdges,
      selectedNodeId,
    );

    setRfNodes(nodes);
    setRfEdges(edges);

    // Fit view after layout
    setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
  }, [graph, filteredNodes.length, selectedNodeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  if (!graph) return null;

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.1}
      maxZoom={2.5}
      defaultEdgeOptions={{
        type: "smoothstep",
      }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="#1e293b"
      />
      <Controls showInteractive={false} style={{ bottom: 24, left: 24 }} />
      <MiniMap
        nodeColor={minimapNodeColor}
        maskColor="rgba(15, 23, 42, 0.7)"
        style={{ bottom: 24, right: 24 }}
      />
    </ReactFlow>
  );
}

function minimapNodeColor(node: any): string {
  const type = node.data?.node?.type;
  switch (type) {
    case "route":
      return "#10b981";
    case "class":
      return "#3b82f6";
    case "method":
      return "#8b5cf6";
    case "function":
      return "#f59e0b";
    case "middleware":
      return "#ec4899";
    default:
      return "#475569";
  }
}

export function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner />
    </ReactFlowProvider>
  );
}
