'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { GraphSidebar } from '@/components/graph/GraphSidebar';

export default function ApiFlowPage() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex">
        <GraphSidebar />
        <div className="flex-1 relative">
          <GraphCanvas />
        </div>
      </div>
    </AppLayout>
  );
}
