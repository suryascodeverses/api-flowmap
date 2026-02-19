"use client";

import { useGraphStore } from "@/lib/store";
import { RouteNode } from "@api-graph/core";
import { Search } from "lucide-react";
import { useState } from "react";

const HTTP_COLORS: Record<string, string> = {
  GET: "#10b981",
  POST: "#3b82f6",
  PUT: "#f59e0b",
  PATCH: "#f97316",
  DELETE: "#ef4444",
};

interface ApiListProps {
  selectedRoute: RouteNode | null;
  onSelectRoute: (route: RouteNode) => void;
}

export function ApiList({ selectedRoute, onSelectRoute }: ApiListProps) {
  const graph = useGraphStore((s) => s.graph);
  const [searchQuery, setSearchQuery] = useState("");

  if (!graph) return null;

  const routes = graph.nodes.filter((n) => n.type === "route") as RouteNode[];

  // Filter by search
  const filtered = routes.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.label.toLowerCase().includes(q) ||
      r.metadata.routePath.toLowerCase().includes(q) ||
      r.metadata.httpMethod.toLowerCase().includes(q)
    );
  });

  // Group by HTTP method
  const grouped = filtered.reduce(
    (acc, route) => {
      const method = route.metadata.httpMethod;
      if (!acc[method]) acc[method] = [];
      acc[method].push(route);
      return acc;
    },
    {} as Record<string, RouteNode[]>,
  );

  const methods = Object.keys(grouped).sort();

  return (
    <aside className="w-80 flex flex-col bg-[#1e293b] border-r border-[#334155] shrink-0">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#334155]">
        <h2 className="text-lg font-bold text-slate-100 mb-3">API Endpoints</h2>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search APIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-md pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-[#334155]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Total APIs</span>
          <span className="text-slate-200 font-semibold">{routes.length}</span>
        </div>
        {selectedRoute && (
          <div className="mt-2 text-xs text-cyan-400">✓ Viewing flow</div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {methods.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            {searchQuery ? "No matching APIs" : "No APIs found"}
          </div>
        ) : (
          methods.map((method) => (
            <div key={method} className="mb-2">
              <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: HTTP_COLORS[method] }}
                />
                {method} ({grouped[method].length})
              </div>
              <div className="space-y-1 px-2">
                {grouped[method].map((route) => (
                  <button
                    key={route.id}
                    onClick={() => onSelectRoute(route)}
                    className={`
                      w-full text-left px-3 py-2 rounded-md transition-all
                      ${
                        selectedRoute?.id === route.id
                          ? "bg-cyan-500/20 border-l-2 border-cyan-500"
                          : "hover:bg-[#0f172a] border-l-2 border-transparent"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: `${HTTP_COLORS[method]}22`,
                          color: HTTP_COLORS[method],
                        }}
                      >
                        {method}
                      </span>
                      <span className="text-xs font-mono text-slate-300 truncate">
                        {route.metadata.routePath}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      {route.filePath.split("/").slice(-1)[0]}:
                      {route.lineNumber}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
