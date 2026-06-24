import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shirtsPath = resolve(root, 'src/data/shirts.json');
const urlsPath = resolve(root, 'scripts/shirt-image-urls.json');
const outDir = resolve(root, 'public/shirts');

mkdirSync(outDir, { recursive: true });

const shirts = JSON.parse(readFileSync(shirtsPath, 'utf8'));
const urlMap = JSON.parse(readFileSync(urlsPath, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extFromUrl(url) {
  const path = new URL(url).pathname.toLowerCase();
  if (path.endsWith('.png')) return '.png';
  if (path.endsWith('.jpeg')) return '.jpeg';
  if (path.endsWith('.jpg')) return '.jpg';
  if (path.endsWith('.webp')) return '.webp';
  return '.jpg';
}

async function download(url, dest, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'quiz-camisetas/1.0 (educational project)' },
        referrerPolicy: 'no-referrer',
      });
      if (res.status === 429) {
        await sleep(2000 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1500 * (i + 1));
    }
  }
}

let ok = 0;
let fail = 0;

for (const shirt of shirts) {
  const url = urlMap[String(shirt.id)];
  if (!url) {
    fail++;
    console.warn(`✗ ${shirt.id} sin URL en shirt-image-urls.json`);
    continue;
  }

  const ext = extFromUrl(url);
  const localName = `${shirt.id}${ext}`;
  const localPath = resolve(outDir, localName);
  const publicPath = `/shirts/${localName}`;

  try {
    await download(url, localPath);
    shirt.image = publicPath;
    shirt.original_image = publicPath;
    console.log(`✓ ${shirt.id} ${shirt.team} ${shirt.year}`);
    ok++;
  } catch (err) {
    fail++;
    console.warn(`✗ ${shirt.id} ${err.message}`);
  }

  await sleep(400);
}

writeFileSync(shirtsPath, `${JSON.stringify(shirts, null, 2)}\n`);
console.log(`\nDone: ${ok} ok, ${fail} failed`);
