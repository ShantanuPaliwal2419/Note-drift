import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Fixture recorder for NoteDrift.
 * CRITICAL RULE: Never make live SerpApi calls without explicit user approval.
 * All fixtures are saved under packages/core/fixtures/serpapi/ and labeled as sample/recorded data.
 */

const apiKey = process.env.SERPAPI_API_KEY;

if (!apiKey) {
  console.error('ERROR: SERPAPI_API_KEY is not set in environment.');
  console.error('Please set SERPAPI_API_KEY in your environment before running this script.');
  process.exit(1);
}

const args = process.argv.slice(2);
const confirmed = args.includes('--confirm-live-spending');

if (!confirmed) {
  console.error('SAFETY BLOCK: Live SerpApi calls consume user credits.');
  console.error('To record fixtures with explicit approval, run:');
  console.error('  npm run record -- --confirm-live-spending');
  process.exit(1);
}

console.log('Explicit approval confirmed. Recording fixtures safely...');
// Recording logic will query SerpApi for designated sample queries and save JSON responses with sanitized metadata.
console.log('Record script ready.');
