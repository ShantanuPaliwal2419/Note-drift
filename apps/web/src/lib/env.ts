import fs from 'node:fs';
import path from 'node:path';

export interface WebEnv {
  serpApiKey: string;
  liveDemoEnabled: boolean;
  siteUrl: string;
}

function loadLocalEnvFile(): { serpApiKey?: string; liveDemoEnabled?: boolean; siteUrl?: string } {
  const possiblePaths = [
    path.join(process.cwd(), 'apps', 'web', '.env.local'),
    path.join(process.cwd(), '.env.local'),
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        const parsed: Record<string, string> = {};
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            parsed[key] = val;
          }
        }
        return {
          serpApiKey: parsed['SERPAPI_API_KEY'],
          liveDemoEnabled: parsed['LIVE_DEMO_ENABLED'] !== undefined ? parsed['LIVE_DEMO_ENABLED'] === 'true' : undefined,
          siteUrl: parsed['NEXT_PUBLIC_SITE_URL'],
        };
      } catch {
        // Ignore file read errors
      }
    }
  }
  return {};
}

export function getServerEnv(): WebEnv {
  const fileEnv = loadLocalEnvFile();
  const serpApiKey = process.env.SERPAPI_API_KEY !== undefined
    ? process.env.SERPAPI_API_KEY
    : (fileEnv.serpApiKey || '');
  const liveDemoEnabled = process.env.LIVE_DEMO_ENABLED !== undefined
    ? process.env.LIVE_DEMO_ENABLED === 'true'
    : (fileEnv.liveDemoEnabled ?? false);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || fileEnv.siteUrl || 'http://localhost:3000';

  return {
    serpApiKey,
    liveDemoEnabled,
    siteUrl,
  };
}
