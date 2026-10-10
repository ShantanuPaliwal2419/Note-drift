import React from 'react';
import type { Verdict } from '@notedrift/core';
import { VERDICT_BADGES } from '@notedrift/core';

interface VerdictBadgeProps {
  verdict: Verdict;
}

export function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const info = VERDICT_BADGES[verdict];

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
  if (verdict === 'Likely outdated') {
    colorClasses = 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800';
  } else if (verdict === 'May be outdated') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
  } else if (verdict === 'Looks current') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}
    >
      <span className="font-mono">{info.symbol}</span>
      <span>{info.label}</span>
    </span>
  );
}
