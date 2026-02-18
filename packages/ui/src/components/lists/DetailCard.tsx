'use client';

import { ReactNode } from 'react';
import { FileCode, MapPin } from 'lucide-react';

interface DetailCardProps {
  title: string;
  badge?: string;
  badgeColor?: string;
  subtitle?: string;
  filePath?: string;
  lineNumber?: number;
  children?: ReactNode;
}

export function DetailCard({
  title,
  badge,
  badgeColor = '#3b82f6',
  subtitle,
  filePath,
  lineNumber,
  children,
}: DetailCardProps) {
  return (
    <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-5 hover:border-[#475569] transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {badge && (
            <span
              className="inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider mb-2"
              style={{
                background: `${badgeColor}22`,
                borderColor: badgeColor,
                color: badgeColor,
              }}
            >
              {badge}
            </span>
          )}
          <h3 className="text-base font-semibold text-slate-100 font-mono break-all">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {filePath && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <FileCode size={12} />
          <span className="font-mono truncate" title={filePath}>
            {filePath.split('/').slice(-2).join('/')}
          </span>
          {lineNumber && (
            <>
              <span>·</span>
              <MapPin size={12} />
              <span>Line {lineNumber}</span>
            </>
          )}
        </div>
      )}

      {children && (
        <div className="mt-3 pt-3 border-t border-[#334155]">
          {children}
        </div>
      )}
    </div>
  );
}
