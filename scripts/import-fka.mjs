#!/usr/bin/env node
/**
 * Importa camisetas desde Football Kit Archive (World Cup Kits).
 * Requiere Playwright con sesión que pase Cloudflare.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MAPPING_PATH = join(__dirname, 'fka-quiz-mapping.json');
const SHIRTS_PATH = join(ROOT, 'src/data/shirts.json');
const URLS_PATH = join(__dirname, 'shirt-image-urls.json');
const SHIRTS_DIR = join(ROOT, 'public/shirts');
const LIST_URL = 'https://www.footballkitarchive.com/world-cup-kits-l308/';

const CDN_RE = /https:\/\/www\.footballkitarchive\.com\/cdn\/[^"'\\s]+?\.(?:jpg|png)/gi;

function extractCdn(html) {
  const matches = [...html.matchAll(CDN_RE)].map((m) => m[0].replace(/-small\//, '/'));
  return matches.find((u) => !u.includes('-gk-') && !u.includes('-anthem-') && !u.includes('-travel-')) ?? matches[0] ?? null;
}

async function resolveCdn(page, kitPage) {
  const html = await page.evaluate(async (url) => {
    const res = await fetch(url);
    return res.text();
  }, kitPage);
  return extractCdn(html);
}

async function downloadImage(page, cdnUrl, destPath) {
  const buffer = await page.evaluate(async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    return [...new Uint8Array(ab)];
  }, cdnUrl);
  writeFileSync(destPath, Buffer.from(buffer));
}

async function main() {
  const mapping = JSON.parse(readFileSync(MAPPING_PATH, 'utf8'));
  if (mapping.length !== 50) {
    throw new Error(`Se esperaban 50 entradas, hay ${mapping.length}`);
  }

  mkdirSync(SHIRTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  console.log('Pasando Cloudflare…');
  await page.goto(LIST_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForTimeout(5000);

  const shirts = [];
  const urlMap = {};
  let ok = 0;

  for (const entry of mapping) {
    const { id, page: kitPage, team, year, color, desc } = entry;
    process.stdout.write(`[${id}/50] ${team} ${year}… `);

    try {
      const cdn = await resolveCdn(page, kitPage);
      if (!cdn) throw new Error('CDN no encontrado');

      const ext = cdn.endsWith('.png') ? 'png' : 'jpg';
      const localFile = `${id}.${ext}`;
      const dest = join(SHIRTS_DIR, localFile);
      await downloadImage(page, cdn, dest);

      const slug = kitPage.match(/footballkitarchive\.com\/([^/]+)\//)?.[1] ?? `fka-${id}`;
      shirts.push({
        id,
        team,
        year,
        color,
        desc,
        filename: `${slug}.${ext}`,
        image: `/shirts/${localFile}`,
        original_image: `/shirts/${localFile}`,
      });
      urlMap[String(id)] = { page: kitPage, cdn, local: `/shirts/${localFile}` };
      ok++;
      console.log('OK');
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
    }

    await page.waitForTimeout(400);
  }

  await browser.close();

  if (ok < 50) {
    console.error(`\nSolo ${ok}/50 descargas OK. shirts.json NO se actualiza.`);
    process.exit(1);
  }

  writeFileSync(SHIRTS_PATH, `${JSON.stringify(shirts, null, 2)}\n`);
  writeFileSync(URLS_PATH, `${JSON.stringify(urlMap, null, 2)}\n`);
  console.log(`\nListo: ${ok}/50 camisetas importadas desde Football Kit Archive.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
