"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProjectInfo } from "@/components/overview/ProjectInfo";
import { FullArchitectureGraph } from "../../components/overview/FullArchitectureGraph";

export default function OverviewPage() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="px-6 py-4 border-b border-[#334155] bg-[#1e293b]">
          <h1 className="text-xl font-bold text-slate-100">Project Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete architecture flow from app to database
          </p>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <ProjectInfo />
          <FullArchitectureGraph />
        </div>
      </div>
    </AppLayout>
  );
}
