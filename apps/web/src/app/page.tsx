import Link from 'next/link';
import { Play, Download, ShieldCheck, Zap, RefreshCw, Link as LinkIcon, CheckCircle2, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-14 py-4">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold">
          <span>SerpApi India Hackathon 2026</span>
          <span className="w-1 h-1 rounded-full bg-blue-400" />
          <span>Obsidian Community Plugin</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Stop your notes from{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            silently drifting
          </span>{' '}
          out of date.
        </h1>

        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          NoteDrift inspects time-sensitive claims and software versions in your personal knowledge base, checks them against live web results via SerpApi, and presents evidence-backed verdicts.
          <strong className="text-slate-200"> Zero silent overwrites. Ever.</strong>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/try"
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Play className="w-4 h-4" />
            <span>Try in Playground</span>
          </Link>
          <Link
            href="/install"
            className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-2 transition-all border border-slate-700"
          >
            <span>Install Plugin</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </section>

      {/* Try It In 2 Minutes Quickstart Box */}
      <section className="border border-blue-900/60 bg-blue-950/20 rounded-2xl p-6 sm:p-8 backdrop-blur">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-900/40 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Try NoteDrift in 2 minutes
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Test with the pre-built fictional sample vault — completely offline without any API key.
            </p>
          </div>
          <Link
            href="/download"
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Sample Vault
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 1</span>
            <h3 className="font-semibold text-slate-200 text-sm">Download & Unzip</h3>
            <p className="text-xs text-slate-400">
              Download <code className="text-slate-300">notedrift-sample-vault.zip</code> and extract it anywhere on your computer.
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 2</span>
            <h3 className="font-semibold text-slate-200 text-sm">Open in Obsidian</h3>
            <p className="text-xs text-slate-400">
              In Obsidian, click <em>Open folder as vault</em>, choose the extracted folder, and click <em>Trust author & enable plugins</em>.
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 3</span>
            <h3 className="font-semibold text-slate-200 text-sm">Scan Note</h3>
            <p className="text-xs text-slate-400">
              Open <code className="text-slate-300">libfoo-overview.md</code> and click the activity ribbon icon to see real-time drift detection!
            </p>
          </div>
        </div>
      </section>

      {/* Visual Terminal / ASCII Preview Mockup */}
      <section className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden font-mono text-xs">
        <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-sans font-medium text-slate-300">NoteDrift Review Panel</span>
          </div>
          <span>demo_mode: on</span>
        </div>
        <div className="p-4 sm:p-6 text-slate-300 overflow-x-auto leading-relaxed">
          <pre>{`+-----------------------------------------------+
| NoteDrift                      [Scan] [Links] |
+-----------------------------------------------+
| libfoo.md                           2 flagged |
|                                               |
| [!] LIKELY OUTDATED                           |
|     libfoo 1.5 (line 4)                       |
|     Official source lists 2.0     > details   |
|                                               |
| [?] CAN'T VERIFY                              |
|     'latest version' (line 12)    > details   |
|                                               |
| [=] LOOKS CURRENT                             |
|     async-mode claim (line 20)    > details   |
+-----------------------------------------------+
| Scan: 3 searches (sample fixtures)  Budget: 10|
+-----------------------------------------------+`}</pre>
        </div>
      </section>

      {/* Feature Value Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Byte-Exact Note Safety</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your original text is sacred. NoteDrift never overwrites note text silently. Verifications are inserted as dated callouts or companion notes only after an explicit click and visual preview.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Strict SerpApi Credit Caps</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Built-in TTL caching, in-scan deduplication, query preview modal, and hard per-scan/daily caps keep your credit usage low and 100% visible before searches run.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Source Authority Classification</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Never marks a note <em>Likely outdated</em> without an Official-class source (e.g. official docs, release logs). Community rumors are strictly labeled <em>May be outdated</em>.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <LinkIcon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Dead-Link Rescue</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Scans links in your notes for 404s or connection failures, finds authoritative replacement candidates using SerpApi, and lets you review replacements with one click.
          </p>
        </div>
      </section>
    </div>
  );
}
