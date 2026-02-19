"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGraphStore } from "@/lib/store";
import { DetailCard } from "@/components/lists/DetailCard";
import { RouteNode } from "@api-graph/core";
import { RouteFlowModal } from "@/components/routes/RouteFlowModal";
import { GitBranch } from "lucide-react";

const HTTP_COLORS: Record<string, string> = {
  GET: "#10b981",
  POST: "#3b82f6",
  PUT: "#f59e0b",
  PATCH: "#f97316",
  DELETE: "#ef4444",
};

export default function RoutesPage() {
  const graph = useGraphStore((s) => s.graph);
  const routes =
    (graph?.nodes.filter((n) => n.type === "route") as RouteNode[]) || [];
  const [selectedRoute, setSelectedRoute] = useState<RouteNode | null>(null);

  const grouped = routes.reduce(
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
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="px-6 py-4 border-b border-[#334155] bg-[#1e293b]">
          <h1 className="text-xl font-bold text-slate-100">API Routes</h1>
          <p className="text-sm text-slate-400 mt-1">
            All HTTP endpoints · {routes.length} total
          </p>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {methods.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No routes found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {methods.map((method) => (
                <section key={method}>
                  <h2 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <span
                      className="text-sm font-bold px-2 py-0.5 rounded"
                      style={{
                        background: `${HTTP_COLORS[method]}22`,
                        color: HTTP_COLORS[method],
                      }}
                    >
                      {method}
                    </span>
                    <span className="text-slate-500 text-sm font-normal">
                      ({grouped[method].length})
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {grouped[method].map((route) => (
                      <RouteCard
                        key={route.id}
                        route={route}
                        onViewFlow={() => setSelectedRoute(route)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedRoute && (
        <RouteFlowModal
          route={selectedRoute}
          onClose={() => setSelectedRoute(null)}
        />
      )}
    </AppLayout>
  );
}

function RouteCard({
  route,
  onViewFlow,
}: {
  route: RouteNode;
  onViewFlow: () => void;
}) {
  const graph = useGraphStore((s) => s.graph);
  const getEdgesForNode = useGraphStore((s) => s.getEdgesForNode);

  const { outgoing } = getEdgesForNode(route.id);
  const handler = outgoing.find((e) => e.type === "routes-to");
  const handlerNode =
    handler && graph?.nodes.find((n) => n.id === handler.target);

  const middleware = route.metadata.middleware || [];

  return (
    <DetailCard
      title={route.metadata.routePath}
      badge={route.metadata.httpMethod}
      badgeColor={HTTP_COLORS[route.metadata.httpMethod]}
      filePath={route.filePath}
      lineNumber={route.lineNumber}
    >
      {handlerNode && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Handler
          </p>
          <p className="text-sm font-mono text-slate-300">
            {handlerNode.label}
          </p>
        </div>
      )}

      {middleware.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Middleware
          </p>
          <div className="flex flex-wrap gap-1.5">
            {middleware.map((m, i) => (
              <span
                key={i}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-900/30 text-pink-300 border border-pink-800"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onViewFlow}
        className="w-full mt-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 rounded-md text-sm font-medium text-cyan-400 transition-colors flex items-center justify-center gap-2"
      >
        <GitBranch size={16} />
        View API Flow
      </button>
    </DetailCard>
  );
}
