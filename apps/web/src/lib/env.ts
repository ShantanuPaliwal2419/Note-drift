export interface WebEnv {
  serpApiKey: string;
  liveDemoEnabled: boolean;
  siteUrl: string;
}

export function getServerEnv(): WebEnv {
  return {
    serpApiKey: process.env.SERPAPI_API_KEY ?? '',
    liveDemoEnabled: process.env.LIVE_DEMO_ENABLED === 'true',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  };
}
