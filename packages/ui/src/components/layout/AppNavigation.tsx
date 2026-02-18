"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGraphStore } from "@/lib/store";
import {
  LayoutDashboard,
  Route,
  Box,
  Layers,
  Database,
  GitBranch,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/overview",
    label: "Overview",
    icon: LayoutDashboard,
    description: "High-level architecture",
  },
  {
    href: "/routes",
    label: "Routes",
    icon: Route,
    description: "API endpoints",
  },
  {
    href: "/controllers",
    label: "Controllers",
    icon: Box,
    description: "Request handlers",
  },
  {
    href: "/services",
    label: "Services",
    icon: Layers,
    description: "Business logic",
  },
  {
    href: "/repositories",
    label: "Repositories",
    icon: Database,
    description: "Data access",
  },
  {
    href: "/api-flow",
    label: "API Flow",
    icon: GitBranch,
    description: "Detailed graph",
  },
];

export function AppNavigation() {
  const pathname = usePathname();
  const graph = useGraphStore((s) => s.graph);

  if (!graph) return null;

  const routeCount = graph.nodes.filter((n) => n.type === "route").length;
  const classCount = graph.nodes.filter((n) => n.type === "class").length;

  return (
    <aside className="w-64 flex flex-col bg-[#1e293b] border-r border-[#334155] shrink-0">
      <div className="px-5 py-4 border-b border-[#334155]">
        <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          ⚡ api-graph
        </h1>
        <p
          className="text-xs text-slate-400 mt-0.5 font-mono truncate"
          title={graph.metadata.projectName}
        >
          {graph.metadata.projectName}
        </p>
      </div>

      <div className="px-4 py-3 border-b border-[#334155]">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0f172a] rounded-md p-2 border border-[#334155]">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">
              Routes
            </p>
            <p className="text-lg font-bold text-emerald-400">{routeCount}</p>
          </div>
          <div className="bg-[#0f172a] rounded-md p-2 border border-[#334155]">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">
              Classes
            </p>
            <p className="text-lg font-bold text-blue-400">{classCount}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative
                ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 font-medium"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#0f172a]/50"
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />
              )}
              <Icon size={16} />
              <div className="flex-1">
                <div className="text-sm">{item.label}</div>
                <div className="text-[10px] text-slate-500">
                  {item.description}
                </div>
              </div>
              {isActive && <ChevronRight size={14} className="text-cyan-500" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-[#334155]">
        <p className="text-[10px] text-slate-600 font-mono">
          {graph.nodes.length} nodes · {graph.edges.length} edges
        </p>
        <p className="text-[9px] text-slate-700 mt-1">
          {new Date(graph.metadata.analyzedAt).toLocaleString()}
        </p>
      </div>
    </aside>
  );
}
