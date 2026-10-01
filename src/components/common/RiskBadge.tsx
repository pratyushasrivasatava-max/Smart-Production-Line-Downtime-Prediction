import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel;
  prob?: number;
  compact?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, prob, compact = false }) => {
  const config = {
    LOW: {
      label: 'LOW RISK',
      textClass: 'text-emerald-700 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30',
      dotClass: 'bg-emerald-600 dark:bg-emerald-500',
    },
    MEDIUM: {
      label: 'ELEVATED',
      textClass: 'text-amber-800 dark:text-amber-400',
      bgClass: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30',
      dotClass: 'bg-amber-600 dark:bg-amber-500',
    },
    HIGH: {
      label: 'HIGH RISK',
      textClass: 'text-orange-800 dark:text-orange-400',
      bgClass: 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30',
      dotClass: 'bg-orange-600 dark:bg-orange-500 animate-pulse',
    },
    CRITICAL: {
      label: 'CRITICAL',
      textClass: 'text-red-800 dark:text-red-400',
      bgClass: 'bg-red-50 border-red-200 dark:bg-red-500/15 dark:border-red-500/40',
      dotClass: 'bg-red-600 dark:bg-red-500 animate-ping',
    },
  }[level];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-xs font-semibold ${config.bgClass} ${config.textClass} tracking-wide`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
      {prob !== undefined && !compact && (
        <span className="opacity-75 tabular-nums">· {(prob * 100).toFixed(0)}%</span>
      )}
    </div>
  );
};
