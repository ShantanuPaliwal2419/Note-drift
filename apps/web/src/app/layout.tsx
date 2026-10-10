import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Activity, Download, Play, BookOpen, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'NoteDrift - Stop your notes from silently becoming outdated',
  description:
    'An Obsidian plugin and verification engine that finds time-sensitive software versions in your notes, checks them against live SerpApi web results, and shows evidence-backed verdicts without silent edits.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-100 hover:text-white">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Activity className="w-4 h-4" />
              </div>
              <span>NoteDrift</span>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-4 text-sm font-medium text-slate-300">
              <Link
                href="/try"
                className="px-3 py-1.5 rounded-md hover:bg-slate-800 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-blue-400" />
                <span>Playground</span>
              </Link>
              <Link
                href="/install"
                className="px-3 py-1.5 rounded-md hover:bg-slate-800 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Install</span>
              </Link>
              <Link
                href="/download"
                className="px-3 py-1.5 rounded-md hover:bg-slate-800 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Downloads</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>

        <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500 text-center">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              NoteDrift - Built for SerpApi India Hackathon 2026. Zero silent edits promise.
            </p>
            <p>MIT Licensed. Pure local Obsidian plugin + Next.js App Router.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
