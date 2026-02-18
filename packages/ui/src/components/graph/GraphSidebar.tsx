'use client';

import { useGraphStore } from '@/lib/store';
import { GraphNode } from '@api-graph/core';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All', color: '#94a3b8' },
  { value: 'route', label: 'Routes', color: '#10b981' },
  { value: 'class', label: 'Classes', color: '#3b82f6' },
  { value: 'method', label: 'Methods', color: '#8b5cf6' },
  { value: 'function', label: 'Functions', color: '#f59e0b' },
] as const;

export function GraphSidebar() {
  const graph = useGraphStore(s => s.graph);
  const filterType = useGraphStore(s => s.filterType);
  const searchQuery = useGraphStore(s => s.searchQuery);
  const setFilterType = useGraphStore(s => s.setFilterType);
  const setSearchQuery = useGraphStore(s => s.setSearchQuery);
  const selectedNode = useGraphStore(s => s.getSelectedNode());
  const getEdgesForNode = useGraphStore(s => s.getEdgesForNode);
  const getNodeById = useGraphStore(s => s.getNodeById);

  if (!graph) return null;

  return (
    <aside className="w-72 flex flex-col bg-[#1e293b] border-r border-[#334155] overflow-hidden shrink-0">
      <div className="px-4 py-3 border-b border-[#334155]">
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      <div className="px-4 py-3 border-b border-[#334155]">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Filter</p>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              className="px-2.5 py-1 rounded-md text-xs font-medium border transition-all"
              style={
                filterType === opt.value
                  ? { background: opt.color + '22', borderColor: opt.color, color: opt.color }
                  : { background: 'transparent', borderColor: '#334155', color: '#94a3b8' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {selectedNode ? (
          <NodeDetails
            node={selectedNode}
            edges={getEdgesForNode(selectedNode.id)}
            getNodeById={getNodeById}
          />
        ) : (
          <div className="text-center text-slate-500 text-sm mt-8">
            <p className="text-2xl mb-2">🔍</p>
            <p>Click a node to see details</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function NodeDetails({ node, edges, getNodeById }: {
  node: GraphNode;
  edges: { incoming: any[]; outgoing: any[] };
  getNodeById: (id: string) => GraphNode | null;
}) {
  const meta = (node as any).metadata ?? {};

  return (
    <div className="space-y-4">
      <div>
        <TypeBadge type={node.type} />
        <p className="text-sm font-semibold font-mono text-slate-100 mt-2 break-all">{node.label}</p>
        <p className="text-[10px] text-slate-500 mt-1 font-mono truncate" title={node.filePath}>
          {node.filePath.split('/').slice(-2).join('/')}:{node.lineNumber}
        </p>
      </div>

      {edges.outgoing.filter(e => e.type !== 'contains').length > 0 && (
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            Calls ({edges.outgoing.filter(e => e.type !== 'contains').length})
          </p>
          <div className="space-y-1">
            {edges.outgoing.filter(e => e.type !== 'contains').map((edge: any) => {
              const target = getNodeById(edge.target);
              if (!target) return null;
              return (
                <div key={edge.id} className="flex items-center gap-2 bg-[#0f172a] rounded-md px-2.5 py-1.5 border border-[#334155]">
                  <TypeBadge type={target.type} />
                  <span className="text-xs font-mono text-slate-300 truncate">{target.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {edges.incoming.filter(e => e.type !== 'contains').length > 0 && (
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            Called by ({edges.incoming.filter(e => e.type !== 'contains').length})
          </p>
          <div className="space-y-1">
            {edges.incoming.filter(e => e.type !== 'contains').map((edge: any) => {
              const source = getNodeById(edge.source);
              if (!source) return null;
              return (
                <div key={edge.id} className="flex items-center gap-2 bg-[#0f172a] rounded-md px-2.5 py-1.5 border border-[#334155]">
                  <TypeBadge type={source.type} />
                  <span className="text-xs font-mono text-slate-300 truncate">{source.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    route: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    class: 'bg-blue-900/40 text-blue-400 border-blue-800',
    method: 'bg-violet-900/40 text-violet-400 border-violet-800',
    function: 'bg-amber-900/40 text-amber-400 border-amber-800',
  };
  return (
    <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${styles[type] ?? ''}`}>
      {type}
    </span>
  );
}
