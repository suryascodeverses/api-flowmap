'use client';

import { useGraphStore } from '@/lib/store';
import { Calendar, FileCode, Layers } from 'lucide-react';

export function ProjectInfo() {
  const graph = useGraphStore(s => s.graph);
  if (!graph) return null;

  const { metadata } = graph;

  return (
    <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Project Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          icon={<FileCode size={20} />}
          label="Project Name"
          value={metadata.projectName}
        />
        <InfoCard
          icon={<Layers size={20} />}
          label="Framework"
          value={metadata.framework.toUpperCase()}
        />
        <InfoCard
          icon={<Calendar size={20} />}
          label="Analyzed"
          value={new Date(metadata.analyzedAt).toLocaleDateString()}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-[#334155]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <Stat label="Files Scanned" value={metadata.fileCount} />
          <Stat label="Total Nodes" value={graph.nodes.length} />
          <Stat label="Total Edges" value={graph.edges.length} />
          <Stat 
            label="Routes" 
            value={graph.nodes.filter(n => n.type === 'route').length} 
            highlight
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-cyan-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-200 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${highlight ? 'text-emerald-400' : 'text-slate-200'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}
