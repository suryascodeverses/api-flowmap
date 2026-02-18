"use client";

import { useGraphStore } from "@/lib/store";

export function Toolbar() {
  const graph = useGraphStore((s) => s.graph);

  if (!graph) return null;

  const date = new Date(graph.metadata.analyzedAt).toLocaleString();

  return (
    <header className="h-10 flex items-center justify-between px-4 bg-[#1e293b] border-b border-[#334155] shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-slate-400">
          <span className="text-slate-600">project /</span>{" "}
          {graph.metadata.projectName}
        </span>
        <span className="text-[10px] text-slate-600">·</span>
        <span className="text-[10px] text-slate-600 font-mono">
          analyzed {date}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800">
          {graph.metadata.framework}
        </span>
      </div>
    </header>
  );
}
