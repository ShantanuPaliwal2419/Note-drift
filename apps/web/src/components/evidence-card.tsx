import React from 'react';
import type { Claim, ClaimCheck } from '@notedrift/core';
import { VerdictBadge } from './verdict-badge';
import { ExternalLink, ShieldCheck, HelpCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface EvidenceCardProps {
  claim: Claim;
  check: ClaimCheck;
}

export function EvidenceCard({ claim, check }: EvidenceCardProps) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-5 bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Claim (Line {claim.line})
          </span>
          <p className="text-base font-medium text-slate-900 dark:text-slate-100 mt-0.5">
            "{claim.text}"
          </p>
        </div>
        <div>
          <VerdictBadge verdict={check.verdict} />
        </div>
      </div>

      {/* Why explanation */}
      {check.reasons.length > 0 && (
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <strong className="text-slate-900 dark:text-slate-200">Why: </strong>
          {check.reasons.join('; ')}
        </div>
      )}

      {/* Sources */}
      {check.evidence.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Evidence Sources
          </span>
          <div className="grid gap-2">
            {check.evidence.map((src, i) => (
              <div
                key={i}
                className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-sm flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    [{src.authority}]
                  </span>
                  <a
                    href={src.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 flex-1 truncate ml-2"
                  >
                    <span className="truncate">{src.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {src.snippet}
                </p>
                <div className="flex gap-4 text-[11px] text-slate-500 dark:text-slate-500 mt-1">
                  <span>{src.link}</span>
                  <span>{src.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Query Meta */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-1">
        <span>Engine: {check.engine} | Query: "{check.query}"</span>
        <span>Retrieved: {check.retrievedAt} ({check.isLive ? 'Live' : 'Sample Data'})</span>
      </div>
    </div>
  );
}
