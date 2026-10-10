import { Download, FolderArchive, Package, CheckCircle2 } from 'lucide-react';

export default function DownloadPage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10 py-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Downloads</h1>
        <p className="text-slate-400 mt-2 text-base">
          Official pre-packaged releases for NoteDrift. Built and verified from source.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Sample Vault */}
        <div className="border border-blue-500/40 bg-blue-950/20 rounded-xl p-6 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <FolderArchive className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Sample Vault ZIP</h2>
            <p className="text-xs font-mono text-blue-400">notedrift-sample-vault.zip</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Complete pre-configured Obsidian vault containing fictional <code className="text-slate-200">libfoo</code> notes, test cases for version drift and dead links, and NoteDrift pre-enabled in offline demo mode.
            </p>

            <div className="text-xs text-slate-400 mt-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero configuration required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Includes community-plugins.json & demo data.json</span>
              </div>
            </div>
          </div>

          <a
            href="/downloads/notedrift-sample-vault.zip"
            download
            className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Download Sample Vault (.zip)</span>
          </a>
        </div>

        {/* Card 2: Plugin ZIP */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Plugin Bundle ZIP</h2>
            <p className="text-xs font-mono text-slate-400">notedrift-plugin.zip</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Production distribution for existing vaults. Contains the verified plugin bundle (<code className="text-slate-200">main.js</code>, <code className="text-slate-200">manifest.json</code>, <code className="text-slate-200">styles.css</code>) inside a top-level <code className="text-slate-200">notedrift</code> directory.
            </p>

            <div className="text-xs text-slate-400 mt-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ready for manual copy into .obsidian/plugins/</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Compliant with Obsidian community plugin specifications</span>
              </div>
            </div>
          </div>

          <a
            href="/downloads/notedrift-plugin.zip"
            download
            className="w-full py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Download Plugin Bundle (.zip)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
