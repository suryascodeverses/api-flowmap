'use client';

import { useEffect, ReactNode } from 'react';
import { useGraphStore } from '@/lib/store';
import { AppNavigation } from './AppNavigation';
import { LoadingState, ErrorState } from '../ui/States';

export function AppLayout({ children }: { children: ReactNode }) {
  const { graph, loading, error, setGraph, setLoading, setError } = useGraphStore();

  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      try {
        const base = process.env.NEXT_PUBLIC_API_URL ?? '';
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
  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f172a]">
        <div className="text-center space-y-3">
          <div className="text-4xl">📊</div>
          <p className="text-slate-400 text-sm">No data found</p>
          <p className="text-slate-600 text-xs font-mono">
            Run <code className="text-cyan-400">api-graph generate</code> first
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f172a]">
      <AppNavigation />
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
