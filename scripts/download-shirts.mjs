import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shirtsPath = resolve(root, 'src/data/shirts.json');
const outDir = resolve(root, 'public/shirts');

mkdirSync(outDir, { recursive: true });

const shirts = JSON.parse(readFileSync(shirtsPath, 'utf8'));

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'quiz-camisetas/1.0 (educational project)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

let ok = 0;
let fail = 0;

for (const shirt of shirts) {
  const ext = shirt.filename?.match(/\.[a-z0-9]+$/i)?.[0] ?? '.jpg';
  const localName = `${shirt.id}${ext}`;
  const localPath = resolve(outDir, localName);
  const publicPath = `/shirts/${localName}`;

  if (existsSync(localPath)) {
    shirt.image = publicPath;
    shirt.original_image = publicPath;
    ok++;
    continue;
  }

  const candidates = [shirt.image, shirt.original_image].filter(Boolean);

  let saved = false;
  for (const url of candidates) {
    try {
      await download(url, localPath);
      shirt.image = publicPath;
      shirt.original_image = publicPath;
      ok++;
      saved = true;
      console.log(`✓ ${shirt.id} ${shirt.team} ${shirt.year}`);
      break;
    } catch (err) {
      console.warn(`✗ ${shirt.id} ${url}: ${err.message}`);
    }
  }

  if (!saved) fail++;
}

writeFileSync(shirtsPath, `${JSON.stringify(shirts, null, 2)}\n`);
console.log(`\nDone: ${ok} ok, ${fail} failed`);
