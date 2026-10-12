import * as fs from 'node:fs';
import * as path from 'node:path';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.obsidian',
  '.quota'
]);

const IGNORED_FILES = new Set([
  '.env.example',
  '.env.local',
  'check-secrets.ts',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
]);

// Patterns that may indicate an exposed API key or secret
const SECRET_PATTERNS = [
  /api_key\s*[:=]\s*["']?[a-zA-Z0-9]{32,64}["']?/i,
  /serpapi[_-]?api[_-]?key\s*[:=]\s*["']?[a-zA-Z0-9]{32,64}["']?/i,
  /["']?[0-9a-f]{64}["']?/i, // 64-char hex key (standard SerpApi key format)
  /ghp_[a-zA-Z0-9]{36}/,
  /sk-[a-zA-Z0-9]{48}/,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/ // JWT token
];

let foundSecrets = 0;

function scanDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        scanDir(fullPath);
      }
      continue;
    }

    if (IGNORED_FILES.has(entry.name) || (entry.name.startsWith('.env') && !entry.name.endsWith('.example'))) {
      continue;
    }

    // Skip binary files and images
    const ext = path.extname(entry.name).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.zip', '.woff', '.woff2', '.ttf'].includes(ext)) {
      continue;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // Skip comments or placeholders in code specifically referring to dummy keys
        if (line.includes('SAMPLE_SERPAPI_KEY') || line.includes('your_api_key_here') || line.includes('test_api_key')) {
          continue;
        }

        for (const pattern of SECRET_PATTERNS) {
          if (pattern.test(line)) {
            // Check if it's a false positive like git commit hashes or css hashes
            if (line.includes('git') || line.includes('commit') || line.includes('sha') || line.includes('hash')) {
              continue;
            }
            console.error(`Potential secret detected in ${fullPath}:${i + 1}`);
            console.error(`  Line snippet: ${line.trim().slice(0, 80)}...`);
            foundSecrets++;
          }
        }
      }
    } catch {
      // Ignore unreadable files
    }
  }
}

console.log('Running NoteDrift secret scanner...');
scanDir(process.cwd());

if (foundSecrets > 0) {
  console.error(`\nSecret check FAILED: Found ${foundSecrets} potential secrets!`);
  process.exit(1);
} else {
  console.log('\nSecret check PASSED: No secrets found in workspace.');
}
