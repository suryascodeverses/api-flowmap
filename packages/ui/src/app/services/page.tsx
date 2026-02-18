'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useGraphStore } from '@/lib/store';
import { DetailCard } from '@/components/lists/DetailCard';
import { ClassNode, MethodNode } from '@api-graph/core';

export default function ServicesPage() {
  const graph = useGraphStore(s => s.graph);
  
  const services = (graph?.nodes.filter(n => 
    n.type === 'class' && 
    n.label.toLowerCase().includes('service')
  ) || []) as ClassNode[];

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="px-6 py-4 border-b border-[#334155] bg-[#1e293b]">
          <h1 className="text-xl font-bold text-slate-100">Services</h1>
          <p className="text-sm text-slate-400 mt-1">
            Business logic layer · {services.length} total
          </p>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No services found</p>
              <p className="text-xs text-slate-600 mt-2">Classes with "Service" in their name will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {services.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function ServiceCard({ service }: { service: ClassNode }) {
  const graph = useGraphStore(s => s.graph);
  const getEdgesForNode = useGraphStore(s => s.getEdgesForNode);

  const { outgoing } = getEdgesForNode(service.id);
  const methodEdges = outgoing.filter(e => e.type === 'contains');
  const methods = methodEdges
    .map(e => graph?.nodes.find(n => n.id === e.target))
    .filter(Boolean) as MethodNode[];

  return (
    <DetailCard
      title={service.metadata.className}
      badge="SERVICE"
      badgeColor="#8b5cf6"
      filePath={service.filePath}
      lineNumber={service.lineNumber}
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
        </p>
      </div>
    </div>
  );
}
