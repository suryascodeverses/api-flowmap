"use client";

export function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0f172a]">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm font-mono">Analyzing project...</p>
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0f172a]">
      <div className="max-w-md text-center space-y-4 p-8">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-bold text-red-400">Failed to load graph</h2>
        <p className="text-sm text-slate-400">{message}</p>
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 text-left space-y-2">
          <p className="text-xs text-slate-500 font-mono">
            Make sure you've run:
          </p>
          <code className="block text-xs text-cyan-400 font-mono">
            api-graph generate
          </code>
          <p className="text-xs text-slate-500 font-mono">
            Then start the server again:
          </p>
          <code className="block text-xs text-cyan-400 font-mono">
            api-graph analyze
          </code>
        </div>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0f172a]">
      <div className="text-center space-y-3">
        <div className="text-4xl">📊</div>
        <p className="text-slate-400 text-sm">
          No nodes found in this project.
        </p>
        <p className="text-slate-600 text-xs font-mono">
          Check your api-graph.config.json include paths.
        </p>
      </div>
    </div>
  );
}
