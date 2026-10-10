'use client';

import React, { useState } from 'react';
import { Play, RotateCcw, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Claim, ClaimCheck } from '@notedrift/core';
import { EvidenceCard } from '@/components/evidence-card';
import { VerdictBadge } from '@/components/verdict-badge';

const PRESET_OUTDATED = `# libfoo Project Notes
We are currently running libfoo 1.5 in production.
This is the latest version recommended by the core maintainers.`;

const PRESET_CURRENT = `# Modern Architecture Notes
The core framework currently targets libfoo 1.5.
All async tests pass cleanly against this release.`;

const PRESET_TEMPORAL = `# Backend Tech Stack
As of 2024, async mode is supported across our database layer.
We also evaluated libfoo 1.2 %% notedrift:ignore %% earlier.`;

export default function TryPlaygroundPage() {
  const [markdown, setMarkdown] = useState(PRESET_OUTDATED);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    claims: Claim[];
    checks: ClaimCheck[];
    isSampleData: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Scanning failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 py-2">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
          <span>Interactive Playground (W-04)</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">NoteDrift Web Playground</h1>
        <p className="text-sm text-slate-400 mt-1">
          Paste any markdown note to test claim extraction, SerpApi search planning, authority classification, and verdict determination.
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 mr-1 font-medium">Load sample:</span>
        <button
          onClick={() => setMarkdown(PRESET_OUTDATED)}
          className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          Outdated claim (libfoo 1.5)
        </button>
        <button
          onClick={() => setMarkdown(PRESET_CURRENT)}
          className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          Current claim
        </button>
        <button
          onClick={() => setMarkdown(PRESET_TEMPORAL)}
          className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          Temporal statement with ignore tag
        </button>
      </div>

      {/* Input Textarea & Action */}
      <div className="flex flex-col gap-3">
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60 focus-within:border-blue-500 transition-colors">
          <div className="bg-slate-800/60 px-4 py-2 text-xs font-mono text-slate-400 border-b border-slate-800 flex justify-between items-center">
            <span>markdown_editor.md</span>
            <span>{markdown.split('\n').length} lines</span>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={6}
            placeholder="Paste your markdown note here..."
            className="w-full bg-transparent p-4 text-sm font-mono text-slate-200 outline-none resize-y"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleScan}
            disabled={loading || !markdown.trim()}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            {loading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Analyzing note claims...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Scan Note Claims</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {results && (
        <div className="flex flex-col gap-6 pt-2">
          {/* Sample Data Banner */}
          {results.isSampleData && (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <strong>SAMPLE DATA:</strong> Demo mode executed on recorded SerpApi fixtures. 0 live API credits spent.
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider">Offline Replay</span>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white">
              Scan Results ({results.claims.length} claims detected)
            </h2>
          </div>

          {results.claims.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800 text-sm">
              No time-sensitive claims found in the provided markdown text.
            </div>
          ) : (
            <div className="grid gap-4">
              {results.claims.map((claim) => {
                const check = results.checks.find((c) => c.claimId === claim.id);
                if (!check) return null;
                return <EvidenceCard key={claim.id} claim={claim} check={check} />;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
