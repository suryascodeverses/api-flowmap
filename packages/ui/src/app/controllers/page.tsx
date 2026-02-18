'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useGraphStore } from '@/lib/store';
import { DetailCard } from '@/components/lists/DetailCard';
import { ClassNode, MethodNode } from '@api-graph/core';

export default function ControllersPage() {
  const graph = useGraphStore(s => s.graph);
  const controllers = graph?.nodes.filter(n => n.type === 'class') as ClassNode[] || [];

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="px-6 py-4 border-b border-[#334155] bg-[#1e293b]">
          <h1 className="text-xl font-bold text-slate-100">Controllers</h1>
          <p className="text-sm text-slate-400 mt-1">
            All classes · {controllers.length} total
          </p>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {controllers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No controllers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {controllers.map(controller => (
                <ControllerCard key={controller.id} controller={controller} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function ControllerCard({ controller }: { controller: ClassNode }) {
  const graph = useGraphStore(s => s.graph);
  const getEdgesForNode = useGraphStore(s => s.getEdgesForNode);

  const { outgoing } = getEdgesForNode(controller.id);
  const methodEdges = outgoing.filter(e => e.type === 'contains');
  const methods = methodEdges
    .map(e => graph?.nodes.find(n => n.id === e.target))
    .filter(Boolean) as MethodNode[];

  return (
    <DetailCard
      title={controller.metadata.className}
      badge="CLASS"
      badgeColor="#3b82f6"
      filePath={controller.filePath}
      lineNumber={controller.lineNumber}
    >
      {methods.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            Methods ({methods.length})
          </p>
          <div className="space-y-2">
            {methods.map(method => (
              <MethodItem key={method.id} method={method} />
            ))}
          </div>
        </div>
      )}
    </DetailCard>
  );
}

function MethodItem({ method }: { method: MethodNode }) {
  const params = method.metadata.parameters?.join(', ') || '';

  return (
    <div className="flex items-start gap-3 bg-[#0f172a] rounded-md p-3 border border-[#334155]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-mono font-semibold text-slate-200">
            {method.metadata.methodName}
          </span>
          {method.metadata.isAsync && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-900/30 text-violet-300 border border-violet-800">
              async
            </span>
          )}
          {method.metadata.isPrivate && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              private
            </span>
          )}
        </div>
        <p className="text-xs font-mono text-slate-500 mt-1">
          ({params})
          {method.metadata.returnType && method.metadata.returnType !== 'unknown' && (
            <span> → {method.metadata.returnType}</span>
          )}
        </p>
      </div>
    </div>
  );
}
