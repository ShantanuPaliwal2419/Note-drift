import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import AdmZip from 'adm-zip';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PLUGIN_DIST_DIR = path.join(DIST_DIR, 'notedrift');
const PLUGIN_SRC_DIR = path.join(ROOT_DIR, 'apps', 'plugin');
const SAMPLE_VAULT_DIR = path.join(ROOT_DIR, 'sample-vault');
const WEB_DOWNLOADS_DIR = path.join(ROOT_DIR, 'apps', 'web', 'public', 'downloads');

function createZipArchive(sourceDir: string, outZipPath: string, zipRootPrefix = ''): void {
  const zip = new AdmZip();
  if (zipRootPrefix) {
    zip.addLocalFolder(sourceDir, zipRootPrefix);
  } else {
    zip.addLocalFolder(sourceDir);
  }
  zip.writeZip(outZipPath);
}

function runPackaging() {
  console.log('--- NoteDrift Packaging Script ---');

  // 1. Ensure dist and target directories exist
  fs.mkdirSync(PLUGIN_DIST_DIR, { recursive: true });
  fs.mkdirSync(WEB_DOWNLOADS_DIR, { recursive: true });

  // 2. Build the plugin first
  console.log('Building Obsidian plugin bundle...');
  try {
    execSync('npm run build:plugin', { stdio: 'inherit', cwd: ROOT_DIR });
  } catch {
    console.error('Failed to build plugin bundle!');
    process.exit(1);
  }

  // 3. Verify main.js, manifest.json, styles.css exist in apps/plugin
  const mainJs = path.join(PLUGIN_SRC_DIR, 'main.js');
  const manifestJson = path.join(PLUGIN_SRC_DIR, 'manifest.json');
  const stylesCss = path.join(PLUGIN_SRC_DIR, 'styles.css');

  if (!fs.existsSync(mainJs) || !fs.existsSync(manifestJson) || !fs.existsSync(stylesCss)) {
    console.error('Missing expected plugin files in apps/plugin (main.js, manifest.json, or styles.css)');
    process.exit(1);
  }

  // Copy to dist/notedrift
  fs.copyFileSync(mainJs, path.join(PLUGIN_DIST_DIR, 'main.js'));
  fs.copyFileSync(manifestJson, path.join(PLUGIN_DIST_DIR, 'manifest.json'));
  fs.copyFileSync(stylesCss, path.join(PLUGIN_DIST_DIR, 'styles.css'));
  console.log('Copied plugin files to dist/notedrift/');

  // 4. Validate manifest.json
  const manifest = JSON.parse(fs.readFileSync(manifestJson, 'utf8'));
  if (manifest.id !== 'notedrift') {
    console.error(`Invalid manifest ID: expected "notedrift", got "${manifest.id}"`);
    process.exit(1);
  }
  if (manifest.id.toLowerCase().includes('obsidian') || manifest.name.toLowerCase().includes('obsidian')) {
    console.error('Manifest id or name contains forbidden word "obsidian"!');
    process.exit(1);
  }

  // 5. Create notedrift-plugin.zip containing a top-level 'notedrift' directory
  const pluginZipPath = path.join(DIST_DIR, 'notedrift-plugin.zip');
  if (fs.existsSync(pluginZipPath)) fs.unlinkSync(pluginZipPath);

  console.log('Creating notedrift-plugin.zip...');
  createZipArchive(PLUGIN_DIST_DIR, pluginZipPath, 'notedrift');

  // 6. Prepare and package sample vault
  console.log('Preparing sample vault with pre-installed plugin...');
  const vaultStageDir = path.join(DIST_DIR, 'sample-vault-stage');
  if (fs.existsSync(vaultStageDir)) {
    fs.rmSync(vaultStageDir, { recursive: true, force: true });
  }
  fs.mkdirSync(vaultStageDir, { recursive: true });

  // Copy sample-vault contents to stage
  if (fs.existsSync(SAMPLE_VAULT_DIR)) {
    fs.cpSync(SAMPLE_VAULT_DIR, vaultStageDir, { recursive: true });
  }

  // Create .obsidian/plugins/notedrift structure in sample vault
  const vaultPluginsDir = path.join(vaultStageDir, '.obsidian', 'plugins', 'notedrift');
  fs.mkdirSync(vaultPluginsDir, { recursive: true });
  fs.copyFileSync(mainJs, path.join(vaultPluginsDir, 'main.js'));
  fs.copyFileSync(manifestJson, path.join(vaultPluginsDir, 'manifest.json'));
  fs.copyFileSync(stylesCss, path.join(vaultPluginsDir, 'styles.css'));

  // Add community-plugins.json enabling notedrift
  const communityPluginsPath = path.join(vaultStageDir, '.obsidian', 'community-plugins.json');
  fs.writeFileSync(communityPluginsPath, JSON.stringify(['notedrift'], null, 2), 'utf8');

  // Add data.json enabling demoMode by default
  const pluginDataPath = path.join(vaultPluginsDir, 'data.json');
  const defaultPluginData = {
    settings: {
      apiKey: '',
      demoMode: true,
      maxSearchesPerScan: 10,
      maxSearchesPerDay: 40,
      cacheTtlDays: 7,
      scanScope: 'flagged',
      previewQueries: true,
      writeToProperties: false,
      officialDomains: ['libfoo.dev', 'docs.libfoo.dev', 'github.com/libfoo']
    },
    history: {}
  };
  fs.writeFileSync(pluginDataPath, JSON.stringify(defaultPluginData, null, 2), 'utf8');

  const sampleVaultZipPath = path.join(DIST_DIR, 'notedrift-sample-vault.zip');
  if (fs.existsSync(sampleVaultZipPath)) fs.unlinkSync(sampleVaultZipPath);

  console.log('Creating notedrift-sample-vault.zip...');
  createZipArchive(vaultStageDir, sampleVaultZipPath, '');

  // Clean up vault stage
  fs.rmSync(vaultStageDir, { recursive: true, force: true });

  // 7. Copy ZIPs to web public downloads directory
  console.log('Copying ZIP archives to apps/web/public/downloads/...');
  fs.copyFileSync(pluginZipPath, path.join(WEB_DOWNLOADS_DIR, 'notedrift-plugin.zip'));
  fs.copyFileSync(sampleVaultZipPath, path.join(WEB_DOWNLOADS_DIR, 'notedrift-sample-vault.zip'));

  // 8. Verification checks
  console.log('\n--- Packaging Verification ---');
  console.log(`Plugin ZIP created: ${pluginZipPath} (${fs.statSync(pluginZipPath).size} bytes)`);
  console.log(`Sample Vault ZIP created: ${sampleVaultZipPath} (${fs.statSync(sampleVaultZipPath).size} bytes)`);
  console.log(`Web download copy 1: ${path.join(WEB_DOWNLOADS_DIR, 'notedrift-plugin.zip')}`);
  console.log(`Web download copy 2: ${path.join(WEB_DOWNLOADS_DIR, 'notedrift-sample-vault.zip')}`);

  // Strict check: verify no .env or .env.local files in either ZIP archive
  function verifyNoEnvInZip(zipPath: string, zipName: string) {
    const zip = new AdmZip(zipPath);
    for (const entry of zip.getEntries()) {
      const lower = entry.entryName.toLowerCase();
      if (lower.includes('.env')) {
        console.error(`SECURITY ERROR: Distributable ${zipName} contains prohibited env file: ${entry.entryName}`);
        process.exit(1);
      }
    }
    console.log(`Verified ${zipName}: 0 env/secret files present.`);
  }

  verifyNoEnvInZip(pluginZipPath, 'notedrift-plugin.zip');
  verifyNoEnvInZip(sampleVaultZipPath, 'notedrift-sample-vault.zip');

  // Run secret check on dist
  console.log('\nRunning secret check on build outputs...');
  execSync('npm run check:secrets', { stdio: 'inherit', cwd: ROOT_DIR });

  console.log('\nPackaging completed successfully!');
}

runPackaging();
