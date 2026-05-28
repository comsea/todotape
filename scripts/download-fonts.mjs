#!/usr/bin/env node
/**
 * Downloads Google Fonts woff2 files into public/fonts/.
 * Runs automatically via the "postinstall" npm hook.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, '..', 'public', 'fonts');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const FONTS = [
  { family: 'Kalam:wght@300',    dest: 'Kalam-Light.woff2' },
  { family: 'Kalam:wght@400',    dest: 'Kalam-Regular.woff2' },
  { family: 'Kalam:wght@700',    dest: 'Kalam-Bold.woff2' },
  { family: 'VT323',             dest: 'VT323-Regular.woff2' },
  { family: 'Press+Start+2P',   dest: 'PressStart2P-Regular.woff2' },
];

// Skip if all fonts already present (e.g. offline reinstall)
const allPresent = FONTS.every(f => existsSync(join(FONTS_DIR, f.dest)));
if (allPresent) {
  console.log('Fonts already downloaded, skipping.');
  process.exit(0);
}

mkdirSync(FONTS_DIR, { recursive: true });

async function getFontUrl(family) {
  const res = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}&display=swap`,
    { headers: { 'User-Agent': UA } },
  );
  const css = await res.text();
  const m = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+woff2[^)]*)\)/);
  if (!m) throw new Error(`No woff2 URL found for ${family}`);
  return m[1];
}

async function downloadFont(family, dest) {
  const url = await getFontUrl(family);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = await res.arrayBuffer();
  writeFileSync(join(FONTS_DIR, dest), Buffer.from(buf));
  console.log(`  ✓ ${dest}  (${(buf.byteLength / 1024).toFixed(1)} KB)`);
}

console.log('Downloading fonts…');
try {
  await Promise.all(FONTS.map(f => downloadFont(f.family, f.dest)));
  console.log('All fonts ready.');
} catch (err) {
  console.error('Font download failed:', err.message);
  console.error('Run `npm run fonts` again when you have internet access.');
  process.exit(1);
}
