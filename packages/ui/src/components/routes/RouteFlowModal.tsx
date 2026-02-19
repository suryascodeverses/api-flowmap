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
import { RouteNode } from "@api-graph/core";
import { X } from "lucide-react";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 70;

interface RouteFlowModalProps {
  route: RouteNode;
  onClose: () => void;
}

function RouteFlowGraphInner({ route }: { route: RouteNode }) {
  const graph = useGraphStore((s) => s.graph);

  const { nodes: rfNodes, edges: rfEdges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const visited = new Set<string>();

    // 1. Route node (center, highlighted)
    nodes.push({
      id: route.id,
      type: "default",
      position: { x: 0, y: 0 },
      data: {
        label: (
          <div className="text-center">
            <div className="text-sm font-bold">{route.metadata.httpMethod}</div>
            <div className="text-xs mt-1">{route.metadata.routePath}</div>
          </div>
        ),
      },
      style: {
        background: "#7c3aed",
        color: "#e9d5ff",
        border: "3px solid #a78bfa",
        padding: "14px 18px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 700,
        minWidth: NODE_WIDTH,
        textAlign: "center",
        boxShadow: "0 0 0 4px rgba(167, 139, 250, 0.3)",
      },
    });

    visited.add(route.id);

    // 2. Route middlewares (inline in flow)
    const routeMiddleware = route.metadata.middleware || [];
    routeMiddleware.forEach((mw, idx) => {
      const mwId = `mw-${route.id}-${idx}`;
      nodes.push({
        id: mwId,
        type: "default",
        position: { x: 0, y: 0 },
        data: { label: mw },
        style: {
          background: "#0e7490",
          color: "#cffafe",
          border: "2px solid #06b6d4",
          padding: "10px 14px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 600,
          minWidth: 200,
          textAlign: "center",
        },
      });

      edges.push({
        id: `route-to-${mwId}`,
        source: idx === 0 ? route.id : `mw-${route.id}-${idx - 1}`,
        target: mwId,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#06b6d4", strokeWidth: 2 },
        markerEnd: { type: "arrowclosed" as any, color: "#06b6d4" },
      });
    });

    // 3. Traverse from route → controller → service → repo
    function traverse(nodeId: string, depth: number) {
      if (visited.has(nodeId) || depth > 10) return;
      visited.add(nodeId);

      const node = graph?.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      // Add node if not already added
      if (!nodes.find((n) => n.id === node.id) && node.id !== route.id) {
        nodes.push({
          id: node.id,
          type: "default",
          position: { x: 0, y: 0 },
          data: {
            label: (
              <div className="text-center">
                <div className="text-xs opacity-70">
                  {node.type.toUpperCase()}
                </div>
                <div className="text-sm mt-1">
                  {node.label.split(".").pop() || node.label}
                </div>
                <div className="text-[10px] mt-1 opacity-60">
                  {node.filePath.split("/").pop()}
                </div>
              </div>
            ),
          },
          style: nodeStyle(node),
        });
      }

      // Find outgoing edges (calls, routes-to)
      const outgoing = graph?.edges.filter(
        (e) =>
          e.source === nodeId && (e.type === "routes-to" || e.type === "calls"),
      );

      outgoing?.forEach((edge) => {
        // Determine source (last middleware or route)
        let actualSource = route.id;
        if (routeMiddleware.length > 0 && edge.source === route.id) {
          actualSource = `mw-${route.id}-${routeMiddleware.length - 1}`;
        } else {
          actualSource = edge.source;
        }

        if (!edges.find((e) => e.id === edge.id)) {
          edges.push({
            id: edge.id,
            source: actualSource,
            target: edge.target,
            type: "smoothstep",
            animated: edge.type === "routes-to",
            style: {
              stroke: edge.type === "routes-to" ? "#10b981" : "#8b5cf6",
              strokeWidth: 2.5,
            },
            markerEnd: {
              type: "arrowclosed" as any,
              color: edge.type === "routes-to" ? "#10b981" : "#8b5cf6",
            },
          });
        }

        traverse(edge.target, depth + 1);
      });
    }

    traverse(route.id, 0);

    // 4. Global handlers (side nodes)
    const globalHandlers = graph.nodes.filter(
      (n) =>
        n.type === "function" &&
        (n.label.toLowerCase().includes("errorhandler") ||
          n.label.toLowerCase().includes("notfoundhandler")),
    );

    globalHandlers.forEach((handler) => {
      if (!visited.has(handler.id)) {
        nodes.push({
          id: handler.id,
          type: "default",
          position: { x: 0, y: 0 },
          data: { label: handler.label },
          style: {
            background: "#334155",
            color: "#cbd5e1",
            border: "2px solid #64748b",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 600,
            minWidth: 160,
            textAlign: "center",
          },
        });
      }
    });

    // 5. Response node (end)
    nodes.push({
      id: "response",
      type: "default",
      position: { x: 0, y: 0 },
      data: { label: "Response" },
      style: {
        background: "#065f46",
        color: "#a7f3d0",
        border: "2px solid #10b981",
        padding: "10px 14px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 600,
        minWidth: 140,
        textAlign: "center",
      },
    });

    // Apply layout
    const positioned = applyDagreLayout(nodes, edges);

    return { nodes: positioned, edges };
  }, [graph, route]);

  const [nodes, , onNodesChange] = useNodesState(rfNodes);
  const [edges, , onEdgesChange] = useEdgesState(rfEdges);

  return (
    <div className="h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.15 }}
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
  );
}

export function RouteFlowModal({ route, onClose }: RouteFlowModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e293b] rounded-lg w-full max-w-7xl h-[90vh] flex flex-col border border-[#334155]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#334155] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100">API Flow</h2>
            <p className="text-sm text-slate-400 mt-1">
              Execution path for{" "}
              <span className="font-mono text-cyan-400">
                {route.metadata.routePath}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#0f172a] rounded-md transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Graph */}
        <div className="flex-1 bg-[#0f172a]">
          <ReactFlowProvider>
            <RouteFlowGraphInner route={route} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: 60,
    ranksep: 100,
    marginx: 60,
    marginy: 60,
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

function nodeStyle(node: any): React.CSSProperties {
  const base = {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "2px solid",
    fontSize: "12px",
    fontWeight: 600,
    minWidth: NODE_WIDTH,
    textAlign: "center" as any,
  };

  const label = node.label.toLowerCase();

  if (node.type === "class") {
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
  }

  return {
    ...base,
    background: "#334155",
    borderColor: "#64748b",
    color: "#cbd5e1",
  };
}
