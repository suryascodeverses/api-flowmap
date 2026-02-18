"use client";

import { useEffect } from "react";
import { useGraphStore } from "@/lib/store";

export function useGraphData() {
  const { graph, loading, error, setGraph, setLoading, setError } =
    useGraphStore();

  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);

      try {
        const base = process.env.NEXT_PUBLIC_API_URL ?? "";
        const res = await fetch(`${base}/api/graph`);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setGraph(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchGraph();
  }, [setGraph, setLoading, setError]);

  return { graph, loading, error };
}
