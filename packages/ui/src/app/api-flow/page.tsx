"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ApiList } from "@/components/api-flow/ApiList";
import { ApiFlowGraph } from "@/components/api-flow/ApiFlowGraph";
import { useState } from "react";
import { RouteNode } from "@api-graph/core";

export default function ApiFlowPage() {
  const [selectedRoute, setSelectedRoute] = useState<RouteNode | null>(null);

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex">
        <ApiList
          selectedRoute={selectedRoute}
          onSelectRoute={setSelectedRoute}
        />
        <div className="flex-1 relative">
          <ApiFlowGraph selectedRoute={selectedRoute} />
        </div>
      </div>
    </AppLayout>
  );
}
