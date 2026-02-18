"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { GraphNode } from "@api-graph/core";
import { useGraphStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface GraphNodeData {
  node: GraphNode;
  selected: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  route: "ROUTE",
  class: "CLASS",
  method: "METHOD",
  function: "FUNC",
  middleware: "MWR",
};

const HTTP_COLORS: Record<string, string> = {
  GET: "text-emerald-400",
  POST: "text-blue-400",
  PUT: "text-amber-400",
  PATCH: "text-orange-400",
  DELETE: "text-red-400",
  ALL: "text-purple-400",
};

export const GraphNodeComponent = memo(({ data }: NodeProps<GraphNodeData>) => {
  const { node, selected } = data;
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === node.id;

  const handleClick = () => {
    setSelectedNodeId(isSelected ? null : node.id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "graph-node",
        `graph-node--${node.type}`,
        isSelected && "selected",
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-30" />

      <div className="flex flex-col items-center gap-0.5">
        {/* Type badge */}
        <span className="text-[9px] opacity-50 tracking-widest font-mono">
          {TYPE_LABELS[node.type] ?? node.type.toUpperCase()}
        </span>

        {/* Label */}
        <span className="text-[11px] font-semibold font-mono truncate max-w-[160px]">
          {node.type === "route" ? (
            <RouteLabel node={node} />
          ) : (
            <span title={node.label}>{shortLabel(node.label)}</span>
          )}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-30" />
    </div>
  );
});

GraphNodeComponent.displayName = "GraphNodeComponent";

function RouteLabel({ node }: { node: GraphNode }) {
  if (node.type !== "route") return null;
  const meta = (node as any).metadata;
  const colorClass = HTTP_COLORS[meta.httpMethod] ?? "text-gray-300";

  return (
    <span className="flex items-center gap-1">
      <span className={cn("font-bold", colorClass)}>{meta.httpMethod}</span>
      <span className="text-gray-300 text-[10px]">{meta.routePath}</span>
    </span>
  );
}

function shortLabel(label: string): string {
  // "UserController.getUsers" → "getUsers" if too long
  if (label.length > 22 && label.includes(".")) {
    return label.split(".").pop() ?? label;
  }
  return label;
}

// function cn(...classes: (string | undefined | false)[]): string {
//   return classes.filter(Boolean).join(" ");
// }
