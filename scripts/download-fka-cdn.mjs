#!/usr/bin/env node
/**
 * Descarga imágenes FKA usando CDN URLs pre-resueltas.
 * Ejecutar desde navegador con sesión CF: node scripts/download-fka-browser.mjs --via=stdin
 * O con Playwright: node scripts/import-fka.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CDN_PATH = join(__dirname, 'fka-cdn-urls.json');
const MAPPING_PATH = join(__dirname, 'fka-quiz-mapping.json');
const SHIRTS_PATH = join(ROOT, 'src/data/shirts.json');
const URLS_PATH = join(__dirname, 'shirt-image-urls.json');
const SHIRTS_DIR = join(ROOT, 'public/shirts');

async function downloadWithPlaywright() {
  const { chromium } = await import('playwright');
  const cdnMap = JSON.parse(readFileSync(CDN_PATH, 'utf8'));
  const mapping = JSON.parse(readFileSync(MAPPING_PATH, 'utf8'));

  mkdirSync(SHIRTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.footballkitarchive.com/world-cup-kits-l308/', {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.waitForTimeout(5000);

  const shirts = [];
  const urlMap = {};

  for (const entry of mapping) {
    const cdn = cdnMap[String(entry.id)];
    if (!cdn) throw new Error(`Sin CDN para id ${entry.id}`);

    const ext = cdn.endsWith('.png') ? 'png' : 'jpg';
    const localFile = `${entry.id}.${ext}`;
    const dest = join(SHIRTS_DIR, localFile);

    const bytes = await page.evaluate(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return [...new Uint8Array(await res.arrayBuffer())];
    }, cdn);

    writeFileSync(dest, Buffer.from(bytes));

    const slug = entry.page.match(/footballkitarchive\.com\/([^/]+)\//)?.[1] ?? `fka-${entry.id}`;
    shirts.push({
      id: entry.id,
      team: entry.team,
      year: entry.year,
      color: entry.color,
      desc: entry.desc,
      filename: `${slug}.${ext}`,
      image: `/shirts/${localFile}`,
      original_image: `/shirts/${localFile}`,
    });
    urlMap[String(entry.id)] = { page: entry.page, cdn, local: `/shirts/${localFile}` };
    console.log(`[${entry.id}/50] OK`);
    await page.waitForTimeout(200);
  }

  await browser.close();
  writeFileSync(SHIRTS_PATH, `${JSON.stringify(shirts, null, 2)}\n`);
  writeFileSync(URLS_PATH, `${JSON.stringify(urlMap, null, 2)}\n`);
  console.log('Listo: 50/50');
}

downloadWithPlaywright().catch((err) => {
  console.error(err);
  process.exit(1);
});
