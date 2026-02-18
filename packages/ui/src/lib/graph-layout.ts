import dagre from "dagre";
import { Node, Edge } from "reactflow";
import { GraphNode, GraphEdge } from "@api-graph/core";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 44;

export function buildReactFlowElements(
  nodes: GraphNode[],
  edges: GraphEdge[],
  selectedNodeId: string | null,
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes: [], edges: [] };

  const rfNodes: Node[] = nodes.map((node) => ({
    id: node.id,
    type: "graphNode",
    position: { x: 0, y: 0 }, // Will be set by dagre
    data: {
      node,
      selected: node.id === selectedNodeId,
    },
    style: { width: NODE_WIDTH },
  }));

  const rfEdges: Edge[] = edges
    .filter((e) => {
      // Only include edges where both nodes are visible
      const hasSource = nodes.some((n) => n.id === e.source);
      const hasTarget = nodes.some((n) => n.id === e.target);
      return hasSource && hasTarget;
    })
    .map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.type === "routes-to" ? "" : undefined,
      type: "smoothstep",
      animated: e.type === "routes-to",
      style: edgeStyle(e.type),
      markerEnd: {
        type: "arrowclosed" as any,
        color: edgeColor(e.type),
      },
    }));

  // Apply dagre layout
  const positioned = applyDagreLayout(rfNodes, rfEdges);

  return { nodes: positioned, edges: rfEdges };
}

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();

  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB", // Top-to-bottom
    nodesep: 60,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      },
    };
  });
}

function edgeColor(type: GraphEdge["type"]): string {
  switch (type) {
    case "routes-to":
      return "#10b981";
    case "calls":
      return "#8b5cf6";
    case "middleware":
      return "#ec4899";
    case "contains":
      return "#475569";
    default:
      return "#475569";
  }
}

function edgeStyle(type: GraphEdge["type"]): React.CSSProperties {
  return {
    stroke: edgeColor(type),
    strokeWidth: type === "routes-to" ? 2.5 : 1.5,
    strokeDasharray: type === "contains" ? "4 2" : undefined,
    opacity: type === "contains" ? 0.4 : 0.85,
  };
}
