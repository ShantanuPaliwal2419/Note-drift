import Link from 'next/link';
import { Download, Sparkles, FolderArchive, Terminal, CheckCircle2 } from 'lucide-react';

export default function InstallPage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10 py-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Installing NoteDrift</h1>
        <p className="text-slate-400 mt-2 text-base">
          Choose the installation method that fits your Obsidian workflow. All three methods are completely functional.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Method 1: Sample Vault */}
        <div className="border border-blue-500/40 bg-blue-950/20 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white">Method 1: Sample Vault ZIP (Fastest / Recommended)</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Recommended
            </span>
          </div>

          <p className="text-sm text-slate-300">
            A complete Obsidian vault with sample notes and NoteDrift pre-installed and enabled in Demo mode. Ideal for testing without modifying your existing vault.
          </p>

          <ol className="list-decimal list-inside text-sm text-slate-300 space-y-2 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
            <li>
              Download <Link href="/download" className="text-blue-400 underline font-medium">notedrift-sample-vault.zip</Link>.
            </li>
            <li>Extract the ZIP folder to a convenient folder (e.g. <code>~/Documents/NoteDrift-Vault</code>).</li>
            <li>Open Obsidian and choose <strong>Open folder as vault</strong>.</li>
            <li>When prompted, click <strong>Trust author and enable plugins</strong>.</li>
            <li>Open <code>notes/libfoo-overview.md</code> and run <strong>NoteDrift: Scan current note</strong>!</li>
          </ol>
        </div>

        {/* Method 2: BRAT */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
              <Terminal className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Method 2: Obsidian BRAT (Beta Reviewer's Auto-update Tool)</h2>
          </div>

          <p className="text-sm text-slate-300">
            Install directly into any existing vault using the official Obsidian BRAT community plugin.
          </p>

          <ol className="list-decimal list-inside text-sm text-slate-300 space-y-2 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
            <li>In Obsidian, ensure the <strong>BRAT</strong> plugin is installed and enabled (from Community Plugins).</li>
            <li>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs">Ctrl+P</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs">Cmd+P</kbd> to open command palette.</li>
            <li>Run command: <code>BRAT: Add a beta plugin for testing</code>.</li>
            <li>Enter repository URL: <code>https://github.com/notedrift/notedrift</code>.</li>
            <li>BRAT will download NoteDrift directly into your vault's plugin directory.</li>
          </ol>
        </div>

        {/* Method 3: Manual Copy */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
              <FolderArchive className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Method 3: Manual 3-File Copy</h2>
          </div>

          <p className="text-sm text-slate-300">
            Directly copy the pre-built bundle into your vault's plugins folder.
          </p>

          <ol className="list-decimal list-inside text-sm text-slate-300 space-y-2 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
            <li>
              Download <Link href="/download" className="text-blue-400 underline font-medium">notedrift-plugin.zip</Link>.
            </li>
            <li>
              Navigate to your Obsidian vault's plugin directory:
              <pre className="mt-1 p-2 bg-slate-950 rounded text-xs text-slate-400 overflow-x-auto">
                {"<Your-Vault>/.obsidian/plugins/notedrift/"}
              </pre>
            </li>
            <li>
              Extract the 3 files inside the folder:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-xs text-slate-400">
                <li><code>main.js</code></li>
                <li><code>manifest.json</code></li>
                <li><code>styles.css</code></li>
              </ul>
            </li>
            <li>In Obsidian, go to <strong>Settings → Community Plugins</strong>, click <em>Reload plugins</em>, and toggle <strong>NoteDrift</strong> to ON.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
