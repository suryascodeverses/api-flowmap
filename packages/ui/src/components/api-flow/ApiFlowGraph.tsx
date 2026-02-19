"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { useGraphStore } from "@/lib/store";
import { GraphNode, RouteNode } from "@api-graph/core";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

interface ApiFlowGraphProps {
  selectedRoute: RouteNode | null;
}

function ApiFlowGraphInner({ selectedRoute }: ApiFlowGraphProps) {
  const graph = useGraphStore((s) => s.graph);

  const { nodes: rfNodes, edges: rfEdges } = useMemo(() => {
    if (!graph || !selectedRoute) return { nodes: [], edges: [] };

    // Traverse the graph starting from the selected route
    const visitedNodes = new Set<string>();
    const visitedEdges = new Set<string>();
    const nodesToInclude: GraphNode[] = [selectedRoute];
    const edgesToInclude: any[] = [];

    function traverse(nodeId: string) {
      if (visitedNodes.has(nodeId)) return;
      visitedNodes.add(nodeId);

      const node = graph?.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      if (node.id !== selectedRoute?.id) {
        nodesToInclude.push(node);
      }

      // Find outgoing edges (what this node calls)
      const outgoing = graph?.edges.filter(
        (e) => e.source === nodeId && e.type !== "contains",
      );

      outgoing?.forEach((edge) => {
        if (!visitedEdges.has(edge.id)) {
          visitedEdges.add(edge.id);
          edgesToInclude.push(edge);
          traverse(edge.target);
        }
      });
    }

    traverse(selectedRoute.id);

    // Build React Flow nodes
    const nodes: Node[] = nodesToInclude.map((n) => ({
      id: n.id,
      type: "default",
      position: { x: 0, y: 0 },
      data: {
        label:
          n.type === "method"
            ? n.label.split(".").pop() || n.label // Just method name
            : n.label,
      },
      style: nodeStyle(n, n.id === selectedRoute.id),
    }));

    // Build React Flow edges
    const edges: Edge[] = edgesToInclude.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      animated: e.type === "routes-to",
      style: edgeStyle(e.type),
      markerEnd: { type: "arrowclosed" as any, color: edgeColor(e.type) },
    }));

    // Apply layout
    const positioned = applyDagreLayout(nodes, edges);

    return { nodes: positioned, edges };
  }, [graph, selectedRoute]);

  const [nodes, , onNodesChange] = useNodesState(rfNodes);
  const [edges, , onEdgesChange] = useEdgesState(rfEdges);

  if (!selectedRoute) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f172a]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">
            Select an API
          </h3>
          <p className="text-sm text-slate-400">
            Click an API endpoint from the list to view its flow
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0f172a]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#334155] bg-[#1e293b]">
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-bold px-2 py-1 rounded"
            style={{
              background: `${getMethodColor(selectedRoute.metadata.httpMethod)}22`,
              color: getMethodColor(selectedRoute.metadata.httpMethod),
            }}
          >
            {selectedRoute.metadata.httpMethod}
          </span>
          <h2 className="text-lg font-semibold text-slate-100 font-mono">
            {selectedRoute.metadata.routePath}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Complete execution flow for this endpoint
        </p>
      </div>

      {/* Graph */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={2}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#1e293b"
          />
          <Controls style={{ bottom: 16, left: 16 }} />
        </ReactFlow>
      </div>
    </div>
  );
}

export function ApiFlowGraph({ selectedRoute }: ApiFlowGraphProps) {
  return (
    <ReactFlowProvider>
      <ApiFlowGraphInner selectedRoute={selectedRoute} />
    </ReactFlowProvider>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: 60,
    ranksep: 90,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((n) => {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  return nodes.map((n) => {
    const dagreNode = g.node(n.id);
    return {
      ...n,
      position: {
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      },
    };
  });
}

function nodeStyle(
  node: GraphNode,
  isSelectedRoute: boolean,
): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "2px solid",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "JetBrains Mono, monospace",
    minWidth: NODE_WIDTH,
    textAlign: "center",
  };

  if (isSelectedRoute) {
    return {
      ...base,
      background: "#065f46",
      borderColor: "#10b981",
      color: "#a7f3d0",
      boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.3)",
    };
  }

  if (node.type === "class") {
    const label = node.label.toLowerCase();
    if (label.includes("controller")) {
      return {
        ...base,
        background: "#1e3a8a",
        borderColor: "#3b82f6",
        color: "#bfdbfe",
      };
    }
    if (label.includes("service")) {
      return {
        ...base,
        background: "#581c87",
        borderColor: "#8b5cf6",
        color: "#ddd6fe",
      };
    }
    if (label.includes("repository") || label.includes("repo")) {
      return {
        ...base,
        background: "#78350f",
        borderColor: "#f59e0b",
        color: "#fde68a",
      };
    }
    return {
      ...base,
      background: "#1e3a8a",
      borderColor: "#3b82f6",
      color: "#bfdbfe",
    };
  }

  if (node.type === "method") {
    return {
      ...base,
      background: "#4c1d95",
      borderColor: "#a78bfa",
      color: "#e9d5ff",
      fontSize: "12px",
    };
  }

  return base;
}

function edgeColor(type: string): string {
  switch (type) {
    case "routes-to":
      return "#10b981";
    case "calls":
      return "#8b5cf6";
    default:
      return "#64748b";
  }
}

function edgeStyle(type: string): React.CSSProperties {
  return {
    stroke: edgeColor(type),
    strokeWidth: type === "routes-to" ? 3 : 2,
  };
}

function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: "#10b981",
    POST: "#3b82f6",
    PUT: "#f59e0b",
    PATCH: "#f97316",
    DELETE: "#ef4444",
  };
  return colors[method] || "#64748b";
}
