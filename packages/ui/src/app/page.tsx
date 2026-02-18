"use client";

import { useEffect } from "react";
import { useGraphStore } from "@/lib/store";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toolbar } from "@/components/layout/Toolbar";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";

export default function Home() {
  const { graph, loading, error, setGraph, setLoading, setError } =
    useGraphStore();

  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      try {
        const base = process.env.NEXT_PUBLIC_API_URL ?? "";
        const res = await fetch(`${base}/api/graph`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || `Server returned ${res.status}`);
        }
        const data = await res.json();
        setGraph(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchGraph();
  }, [setGraph, setLoading, setError]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!graph) return <EmptyState />;
  if (graph.nodes.length === 0) return <EmptyState />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f172a]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Toolbar />
        <div className="flex-1 relative">
          <GraphCanvas />
        </div>
      </div>
    </div>
  );
}
