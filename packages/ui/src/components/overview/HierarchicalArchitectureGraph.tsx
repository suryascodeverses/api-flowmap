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

const NODE_WIDTH = 220;
const NODE_HEIGHT = 60;

function HierarchicalArchitectureGraphInner() {
  const graph = useGraphStore((s) => s.graph);

  const { nodes: rfNodes, edges: rfEdges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 1. Root: Express App
    nodes.push({
      id: "app-root",
      type: "default",
      position: { x: 0, y: 0 },
      data: { label: "app = express()" },
      style: {
        background: "#1e3a8a",
        color: "#bfdbfe",
        border: "3px solid #3b82f6",
        padding: "14px 20px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 700,
        minWidth: 200,
        textAlign: "center",
      },
    });

    // 2. Routes & Middleware Layer (single grouped node)
    nodes.push({
      id: "routes-middleware-layer",
      type: "default",
      position: { x: 0, y: 0 },
      data: { label: "Routes & Middleware" },
      style: {
        background: "#581c87",
        color: "#ddd6fe",
        border: "3px solid #7c3aed",
        padding: "14px 20px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 700,
        minWidth: 220,
        textAlign: "center",
      },
    });

    edges.push({
      id: "app-to-routes",
      source: "app-root",
      target: "routes-middleware-layer",
      type: "smoothstep",
      animated: false,
      style: { stroke: "#7c3aed", strokeWidth: 3 },
      markerEnd: { type: "arrowclosed" as any, color: "#7c3aed" },
    });

    // 3. Individual Routes
    const routes = graph.nodes.filter((n) => n.type === "route");
    routes.forEach((route) => {
      nodes.push({
        id: route.id,
        type: "default",
        position: { x: 0, y: 0 },
        data: {
          label: `${(route as any).metadata.httpMethod} ${(route as any).metadata.routePath}`,
        },
        style: {
          background: "#065f46",
          color: "#a7f3d0",
          border: "2px solid #10b981",
          padding: "10px 14px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 600,
          minWidth: 180,
          textAlign: "center",
        },
      });

      edges.push({
        id: `layer-to-${route.id}`,
        source: "routes-middleware-layer",
        target: route.id,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#10b981", strokeWidth: 2 },
        markerEnd: { type: "arrowclosed" as any, color: "#10b981" },
      });
    });

    // 4. Controllers (connected to routes)
    const controllers = graph.nodes.filter((n) => n.type === "class");
    controllers.forEach((controller) => {
      nodes.push({
        id: controller.id,
        type: "default",
        position: { x: 0, y: 0 },
        data: { label: controller.label },
        style: {
          background: "#1e3a8a",
          color: "#bfdbfe",
          border: "2px solid #3b82f6",
          padding: "10px 14px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 600,
          minWidth: NODE_WIDTH,
          textAlign: "center",
        },
      });
    });

    // Connect routes to controllers (routes-to edges)
    graph.edges.forEach((e) => {
      if (e.type === "routes-to") {
        edges.push({
          id: e.id,
          source: e.source,
          target: e.target,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#3b82f6", strokeWidth: 2 },
          markerEnd: { type: "arrowclosed" as any, color: "#3b82f6" },
        });
      }
    });

    // 5. Services
    const services = graph.nodes.filter(
      (n) => n.type === "class" && n.label.toLowerCase().includes("service"),
    );
    services.forEach((service) => {
      if (!nodes.find((n) => n.id === service.id)) {
        nodes.push({
          id: service.id,
          type: "default",
          position: { x: 0, y: 0 },
          data: { label: service.label },
          style: {
            background: "#4c1d95",
            color: "#ddd6fe",
            border: "2px solid #8b5cf6",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            minWidth: NODE_WIDTH,
            textAlign: "center",
          },
        });
      }
    });

    // 6. Repositories
    const repos = graph.nodes.filter(
      (n) =>
        n.type === "class" &&
        (n.label.toLowerCase().includes("repository") ||
          n.label.toLowerCase().includes("repo")),
    );
    repos.forEach((repo) => {
      if (!nodes.find((n) => n.id === repo.id)) {
        nodes.push({
          id: repo.id,
          type: "default",
          position: { x: 0, y: 0 },
          data: { label: repo.label },
          style: {
            background: "#78350f",
            color: "#fde68a",
            border: "2px solid #f59e0b",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            minWidth: NODE_WIDTH,
            textAlign: "center",
          },
        });
      }
    });

    // Connect controllers → services → repos (calls edges)
    graph.edges.forEach((e) => {
      if (e.type === "calls") {
        const sourceExists = nodes.find((n) => n.id === e.source);
        const targetExists = nodes.find((n) => n.id === e.target);
        if (sourceExists && targetExists) {
          edges.push({
            id: e.id,
            source: e.source,
            target: e.target,
            type: "smoothstep",
            animated: false,
            style: { stroke: "#8b5cf6", strokeWidth: 1.5 },
            markerEnd: { type: "arrowclosed" as any, color: "#8b5cf6" },
          });
        }
      }
    });

    // 7. Global middleware/handlers (placed to the side)
    const globalFunctions = graph.nodes.filter(
      (n) =>
        n.type === "function" &&
        (n.label.toLowerCase().includes("handler") ||
          n.label.toLowerCase().includes("middleware") ||
          n.label.toLowerCase().includes("error")),
    );

    globalFunctions.forEach((fn, idx) => {
      nodes.push({
        id: fn.id,
        type: "default",
        position: { x: 0, y: 0 },
        data: { label: fn.label },
        style: {
          background: "#334155",
          color: "#cbd5e1",
          border: "2px solid #64748b",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 600,
          minWidth: 140,
          textAlign: "center",
        },
      });

      // Connect to middleware layer
      edges.push({
        id: `global-${fn.id}`,
        source: "routes-middleware-layer",
        target: fn.id,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#64748b", strokeWidth: 1, strokeDasharray: "4 4" },
        markerEnd: { type: "arrowclosed" as any, color: "#64748b" },
      });
    });

    // Apply dagre layout
    const positioned = applyDagreLayout(nodes, edges);

    return { nodes: positioned, edges };
  }, [graph]);

  const [nodes, , onNodesChange] = useNodesState(rfNodes);
  const [edges, , onEdgesChange] = useEdgesState(rfEdges);

  if (!graph) return null;

  return (
    <div className="h-[700px] bg-[#0f172a] rounded-lg border border-[#334155] overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.1 }}
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

export function HierarchicalArchitectureGraph() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-100 mb-4">
        Application Architecture
      </h2>
      <p className="text-sm text-slate-400 mb-4">
        Complete request flow from Express initialization through your
        application layers
      </p>
      <ReactFlowProvider>
        <HierarchicalArchitectureGraphInner />
      </ReactFlowProvider>
    </div>
  );
}

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: 40,
    ranksep: 100,
    marginx: 50,
    marginy: 50,
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
