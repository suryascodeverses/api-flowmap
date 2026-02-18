'use client';

import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { useGraphStore } from '@/lib/store';
import { GraphNode } from '@api-graph/core';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

function OverviewGraphInner() {
  const graph = useGraphStore(s => s.graph);

  const { nodes: rfNodes, edges: rfEdges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };

    const classNodes = graph.nodes.filter(n => n.type === 'class');
    const routeNodes = graph.nodes.filter(n => n.type === 'route');
    const visibleNodes = [...routeNodes, ...classNodes];
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = graph.edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));

    const nodes: Node[] = visibleNodes.map(node => ({
      id: node.id,
      type: 'default',
      position: { x: 0, y: 0 },
      data: { label: node.label },
      style: nodeStyle(node),
    }));

    const edges: Edge[] = visibleEdges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: e.type === 'routes-to',
      style: edgeStyle(e.type as any),
      markerEnd: { type: 'arrowclosed' as any, color: edgeColor(e.type as any) },
    }));

    return { nodes: applyDagreLayout(nodes, edges), edges };
  }, [graph]);

  const [nodes, , onNodesChange] = useNodesState(rfNodes);
  const [edges, , onEdgesChange] = useEdgesState(rfEdges);

  if (!graph) return null;

  return (
    <div className="h-[500px] bg-[#0f172a] rounded-lg border border-[#334155] overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e293b" />
        <Controls style={{ bottom: 16, left: 16 }} />
      </ReactFlow>
    </div>
  );
}

export function OverviewGraph() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Architecture Diagram</h2>
      <p className="text-sm text-slate-400 mb-4">High-level view showing routes and classes</p>
      <ReactFlowProvider>
        <OverviewGraphInner />
      </ReactFlowProvider>
    </div>
  );
}

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100, marginx: 40, marginy: 40 });
  nodes.forEach(n => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map(n => ({ ...n, position: { x: g.node(n.id).x - NODE_WIDTH/2, y: g.node(n.id).y - NODE_HEIGHT/2 } }));
}

function nodeStyle(node: GraphNode): React.CSSProperties {
  const base = { padding: '12px 16px', borderRadius: '8px', border: '2px solid', fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', minWidth: NODE_WIDTH, textAlign: 'center' as any };
  if (node.type === 'route') return { ...base, background: '#065f46', borderColor: '#10b981', color: '#a7f3d0' };
  if (node.type === 'class') return { ...base, background: '#1e3a8a', borderColor: '#3b82f6', color: '#bfdbfe' };
  return base;
}

function edgeColor(type: string): string {
  return type === 'routes-to' ? '#10b981' : type === 'calls' ? '#8b5cf6' : '#475569';
}

function edgeStyle(type: string): React.CSSProperties {
  return { stroke: edgeColor(type), strokeWidth: type === 'routes-to' ? 2.5 : 1.5 };
}
