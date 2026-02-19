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
import { GraphNode } from "@api-graph/core";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

function FullArchitectureGraphInner() {
  const graph = useGraphStore((s) => s.graph);

  const { nodes: rfNodes, edges: rfEdges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };

    // Create root "App" node
    const appNode: Node = {
      id: "app-root",
      type: "default",
      position: { x: 0, y: 0 },
      data: { label: "Express App" },
      style: {
        background: "#7c3aed",
        color: "#e9d5ff",
        border: "2px solid #6d28d9",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 700,
        minWidth: NODE_WIDTH,
        textAlign: "center",
      },
    };

    // Get routes, classes (controllers/services/repos), and methods
    const routes = graph.nodes.filter((n) => n.type === "route");
    const classes = graph.nodes.filter((n) => n.type === "class");
    const methods = graph.nodes.filter((n) => n.type === "method");

    // Build nodes
    const routeNodes: Node[] = routes.map((n) => ({
      id: n.id,
      type: "default",
      position: { x: 0, y: 0 },
      data: { label: n.label },
      style: nodeStyle(n),
    }));

    const classNodes: Node[] = classes.map((n) => ({
      id: n.id,
      type: "default",
      position: { x: 0, y: 0 },
      data: { label: n.label },
      style: nodeStyle(n),
    }));

    const methodNodes: Node[] = methods.map((n) => ({
      id: n.id,
      type: "default",
      position: { x: 0, y: 0 },
      data: { label: n.label.split(".").pop() || n.label }, // Just method name
      style: nodeStyle(n),
    }));

    const allNodes = [appNode, ...routeNodes, ...classNodes, ...methodNodes];

    // Build edges
    const edges: Edge[] = [];

    // App → Routes
    routes.forEach((route) => {
      edges.push({
        id: `app-to-${route.id}`,
        source: "app-root",
        target: route.id,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#94a3b8", strokeWidth: 1.5 },
        markerEnd: { type: "arrowclosed" as any, color: "#94a3b8" },
      });
    });

    // Routes → Controllers, Controllers → Services, etc (use existing edges)
    graph.edges.forEach((e) => {
      const sourceNode = graph.nodes.find((n) => n.id === e.source);
      const targetNode = graph.nodes.find((n) => n.id === e.target);

      if (!sourceNode || !targetNode) return;

      // Skip "contains" edges (class contains method) - we show methods separately
      if (e.type === "contains") return;

      edges.push({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        animated: e.type === "routes-to",
        style: edgeStyle(e.type as any),
        markerEnd: {
          type: "arrowclosed" as any,
          color: edgeColor(e.type as any),
        },
      });
    });

    // Apply layout
    const positioned = applyDagreLayout(allNodes, edges);

    return { nodes: positioned, edges };
  }, [graph]);

  const [nodes, , onNodesChange] = useNodesState(rfNodes);
  const [edges, , onEdgesChange] = useEdgesState(rfEdges);

  if (!graph) return null;

  return (
    <div className="h-[600px] bg-[#0f172a] rounded-lg border border-[#334155] overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1.5}
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
  );
}

export function FullArchitectureGraph() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-100 mb-4">
        Architecture Flow
      </h2>
      <p className="text-sm text-slate-400 mb-4">
        Complete request flow from Express app through your entire stack
      </p>
      <ReactFlowProvider>
        <FullArchitectureGraphInner />
      </ReactFlowProvider>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: 50,
    ranksep: 80,
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

function nodeStyle(node: GraphNode): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "2px solid",
    fontSize: "12px",
    fontWeight: 600,
    fontFamily: "JetBrains Mono, monospace",
    minWidth: NODE_WIDTH,
    textAlign: "center",
  };

  if (node.type === "route") {
    return {
      ...base,
      background: "#065f46",
      borderColor: "#10b981",
      color: "#a7f3d0",
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
      fontSize: "11px",
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
    strokeWidth: type === "routes-to" ? 2.5 : type === "calls" ? 2 : 1.5,
  };
}
