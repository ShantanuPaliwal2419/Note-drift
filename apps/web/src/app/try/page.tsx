'use client';

import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, AlertCircle, Sparkles, Globe, ShieldAlert, CheckCircle, Zap } from 'lucide-react';
import type { Claim, ClaimCheck } from '@notedrift/core';
import { EvidenceCard } from '@/components/evidence-card';

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
  const [loadingType, setLoadingType] = useState<'demo' | 'live' | null>(null);
  const [results, setResults] = useState<{
    claims: Claim[];
    checks: ClaimCheck[];
    isSampleData: boolean;
    remainingLiveScans?: number;
    message?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live status state
  const [liveStatus, setLiveStatus] = useState<{
    liveDemoEnabled: boolean;
    hasKeyConfigured: boolean;
    remainingLiveScans: number;
  }>({
    liveDemoEnabled: false,
    hasKeyConfigured: false,
    remainingLiveScans: 1,
  });

  // Confirmation modal state
  const [showLiveConfirm, setShowLiveConfirm] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/scan');
      if (res.ok) {
        const data = await res.json();
        setLiveStatus({
          liveDemoEnabled: data.liveDemoEnabled ?? false,
          hasKeyConfigured: data.hasKeyConfigured ?? false,
          remainingLiveScans: data.remainingLiveScans ?? 1,
        });
      }
    } catch {
      // Ignore initial status fetch failure
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleScan = async (isLive: boolean) => {
    setLoading(true);
    setLoadingType(isLive ? 'live' : 'demo');
    setError(null);
    setShowLiveConfirm(false);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown, live: isLive }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP error ${res.status}`);
      }

      setResults(data);
      if (isLive) {
        setLiveStatus((prev) => ({
          ...prev,
          remainingLiveScans: 0,
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Scanning failed');
    } finally {
      setLoading(false);
      setLoadingType(null);
      fetchStatus();
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 py-2">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold">
            <span>Interactive Playground (W-04)</span>
          </div>
          {liveStatus.liveDemoEnabled ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
              <Globe className="w-3 h-3" />
              <span>Live SerpApi Integration Active</span>
              <span className="font-mono text-[11px] ml-1 bg-emerald-500/20 px-1.5 py-0.2 rounded">
                {liveStatus.remainingLiveScans}/1 scan available
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-400 text-xs font-medium">
              <span>Live mode: Disabled (Set LIVE_DEMO_ENABLED=true in .env.local)</span>
            </div>
          )}
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Scan Button */}
            <button
              onClick={() => setShowLiveConfirm(true)}
              disabled={loading || !markdown.trim() || !liveStatus.liveDemoEnabled || liveStatus.remainingLiveScans <= 0}
              title={
                !liveStatus.liveDemoEnabled
                  ? 'Enable LIVE_DEMO_ENABLED=true in apps/web/.env.local'
                  : liveStatus.remainingLiveScans <= 0
                  ? 'You have already used your 1 permitted live scan'
                  : 'Execute real Google web search via SerpApi'
              }
              className={`px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg transition-all ${
                liveStatus.remainingLiveScans <= 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : !liveStatus.liveDemoEnabled
                  ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {loading && loadingType === 'live' ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Executing SerpApi Search...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>
                    {liveStatus.remainingLiveScans <= 0
                      ? 'Live Scan Used (1/1)'
                      : 'Run Live Scan (1 Allowed)'}
                  </span>
                </>
              )}
            </button>

            {/* Offline Demo Scan Button */}
            <button
              onClick={() => handleScan(false)}
              disabled={loading || !markdown.trim()}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
            >
              {loading && loadingType === 'demo' ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Analyzing note claims...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Demo Scan (Sample Data)</span>
                </>
              )}
            </button>
          </div>

          <span className="text-xs text-slate-400">
            {liveStatus.remainingLiveScans > 0 && liveStatus.liveDemoEnabled ? (
              <span className="text-emerald-400 font-medium">1 live scan permitted</span>
            ) : liveStatus.liveDemoEnabled ? (
              <span className="text-amber-400 font-medium">Live scan quota exhausted</span>
            ) : (
              <span>Demo mode uses recorded fixtures (0 credits)</span>
            )}
          </span>
        </div>
      </div>

      {/* Confirmation Modal for Live Scan */}
      {showLiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-white">Confirm Live SerpApi Search</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              This action will send an actual search query derived from your note to the{' '}
              <strong>SerpApi Google Search API</strong> using the server&apos;s configured API key.
            </p>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-xs text-slate-300 flex flex-col gap-1">
              <div>
                <strong>Quota Policy:</strong> Each visitor is allowed exactly <strong>1 live scan</strong>.
              </div>
              <div>
                <strong>Allowance Remaining:</strong> {liveStatus.remainingLiveScans} of 1
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLiveConfirm(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleScan(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span>Confirm & Start Live Scan</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
          {/* Sample Data Banner vs Live Result Banner */}
          {results.isSampleData ? (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>SAMPLE DATA:</strong> Demo mode executed on recorded SerpApi fixtures. 0 live API credits spent.
                </span>
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded">
                Offline Replay
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>LIVE RESULT:</strong> Real Google Search queries executed via SerpApi server adapter. Live scan allowance consumed.
                </span>
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded">
                Live SerpApi
              </span>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white">
              Scan Results ({results.claims.length} claims detected)
            </h2>
          </div>

          {results.claims.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800 text-sm">
              {results.message || 'No time-sensitive claims found in the provided markdown text.'}
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
