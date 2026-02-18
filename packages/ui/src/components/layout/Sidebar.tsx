"use client";

import { useGraphStore } from "@/lib/store";
import { GraphNode, GraphEdge } from "@api-graph/core";

const FILTER_OPTIONS = [
  { value: "all", label: "All", color: "#94a3b8" },
  { value: "route", label: "Routes", color: "#10b981" },
  { value: "class", label: "Classes", color: "#3b82f6" },
  { value: "method", label: "Methods", color: "#8b5cf6" },
  { value: "function", label: "Functions", color: "#f59e0b" },
  { value: "middleware", label: "Middleware", color: "#ec4899" },
] as const;

const HTTP_BADGE_COLORS: Record<string, string> = {
  GET: "bg-emerald-900 text-emerald-300 border-emerald-700",
  POST: "bg-blue-900    text-blue-300    border-blue-700",
  PUT: "bg-amber-900   text-amber-300   border-amber-700",
  PATCH: "bg-orange-900  text-orange-300  border-orange-700",
  DELETE: "bg-red-900     text-red-300     border-red-700",
};

export function Sidebar() {
  const graph = useGraphStore((s) => s.graph);
  const filterType = useGraphStore((s) => s.filterType);
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const setFilterType = useGraphStore((s) => s.setFilterType);
  const setSearchQuery = useGraphStore((s) => s.setSearchQuery);
  const selectedNode = useGraphStore((s) => s.getSelectedNode());
  const getEdgesForNode = useGraphStore((s) => s.getEdgesForNode);
  const getNodeById = useGraphStore((s) => s.getNodeById);

  if (!graph) return null;

  const routeCount = graph.nodes.filter((n) => n.type === "route").length;
  const classCount = graph.nodes.filter((n) => n.type === "class").length;
  const funcCount = graph.nodes.filter((n) => n.type === "function").length;
  const methodCount = graph.nodes.filter((n) => n.type === "method").length;

  return (
    <aside className="w-72 flex flex-col bg-[#1e293b] border-r border-[#334155] overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#334155]">
        <h1 className="text-base font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          ⚡ api-graph
        </h1>
        <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">
          {graph.metadata.projectName}
        </p>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-[#334155]">
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Routes" value={routeCount} color="#10b981" />
          <StatCard label="Classes" value={classCount} color="#3b82f6" />
          <StatCard label="Functions" value={funcCount} color="#f59e0b" />
          <StatCard label="Methods" value={methodCount} color="#8b5cf6" />
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-[#334155]">
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-[#334155]">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">
          Filter
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              className="px-2.5 py-1 rounded-md text-xs font-medium border transition-all"
              style={
                filterType === opt.value
                  ? {
                      background: opt.color + "22",
                      borderColor: opt.color,
                      color: opt.color,
                    }
                  : {
                      background: "transparent",
                      borderColor: "#334155",
                      color: "#94a3b8",
                    }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Node Details */}
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

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#334155]">
        <p className="text-[10px] text-slate-600 font-mono">
          {graph.nodes.length} nodes · {graph.edges.length} edges
        </p>
      </div>
    </aside>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-[#0f172a] rounded-lg p-3 border border-[#334155]">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xl font-bold mt-0.5" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function NodeDetails({
  node,
  edges,
  getNodeById,
}: {
  node: GraphNode;
  edges: { incoming: GraphEdge[]; outgoing: GraphEdge[] };
  getNodeById: (id: string) => GraphNode | null;
}) {
  const meta = (node as any).metadata ?? {};

  return (
    <div className="space-y-4">
      {/* Main info */}
      <div>
        <TypeBadge type={node.type} />
        <p className="text-sm font-semibold font-mono text-slate-100 mt-2 break-all">
          {node.label}
        </p>
        <p
          className="text-[10px] text-slate-500 mt-1 font-mono truncate"
          title={node.filePath}
        >
          {node.filePath.split("/").slice(-2).join("/")}:{node.lineNumber}
        </p>
      </div>

      {/* Route-specific */}
      {node.type === "route" && meta.httpMethod && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            Route Info
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${HTTP_BADGE_COLORS[meta.httpMethod] ?? ""}`}
            >
              {meta.httpMethod}
            </span>
            <span className="text-xs font-mono text-slate-300">
              {meta.routePath}
            </span>
          </div>
          {meta.middleware?.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-500 mt-2 mb-1">Middleware</p>
              {meta.middleware.map((m: string) => (
                <span
                  key={m}
                  className="inline-block text-[10px] font-mono bg-pink-900/30 text-pink-300 border border-pink-800 rounded px-1.5 py-0.5 mr-1 mb-1"
                >
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Method/Function specific */}
      {(node.type === "method" || node.type === "function") && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            Details
          </p>
          {meta.parameters?.length > 0 && (
            <p className="text-xs font-mono text-slate-400">
              <span className="text-slate-500">params: </span>
              {meta.parameters.join(", ")}
            </p>
          )}
          {meta.isAsync && (
            <span className="inline-block text-[10px] font-mono bg-violet-900/30 text-violet-300 border border-violet-800 rounded px-1.5 py-0.5">
              async
            </span>
          )}
        </div>
      )}

      {/* Outgoing (calls) */}
      {edges.outgoing.filter((e) => e.type !== "contains").length > 0 && (
        <EdgeList
          title="Calls"
          edges={edges.outgoing.filter((e) => e.type !== "contains")}
          getNodeById={getNodeById}
          direction="out"
        />
      )}

      {/* Incoming (called by) */}
      {edges.incoming.filter((e) => e.type !== "contains").length > 0 && (
        <EdgeList
          title="Called by"
          edges={edges.incoming.filter((e) => e.type !== "contains")}
          getNodeById={getNodeById}
          direction="in"
        />
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    route: "bg-emerald-900/40 text-emerald-400 border-emerald-800",
    class: "bg-blue-900/40    text-blue-400    border-blue-800",
    method: "bg-violet-900/40  text-violet-400  border-violet-800",
    function: "bg-amber-900/40   text-amber-400   border-amber-800",
    middleware: "bg-pink-900/40    text-pink-400    border-pink-800",
  };

  return (
    <span
      className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${styles[type] ?? ""}`}
    >
      {type}
    </span>
  );
}

function EdgeList({
  title,
  edges,
  getNodeById,
  direction,
}: {
  title: string;
  edges: GraphEdge[];
  getNodeById: (id: string) => GraphNode | null;
  direction: "in" | "out";
}) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
        {title} ({edges.length})
      </p>
      <div className="space-y-1">
        {edges.map((edge) => {
          const nodeId = direction === "out" ? edge.target : edge.source;
          const node = getNodeById(nodeId);
          if (!node) return null;

          return (
            <div
              key={edge.id}
              className="flex items-center gap-2 bg-[#0f172a] rounded-md px-2.5 py-1.5 border border-[#334155]"
            >
              <TypeBadge type={node.type} />
              <span
                className="text-xs font-mono text-slate-300 truncate"
                title={node.label}
              >
                {node.label.includes(".")
                  ? node.label.split(".").pop()
                  : node.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
