import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const urlsPath = resolve(root, 'scripts/shirt-image-urls.json');
const outDir = resolve(root, 'public/shirts');
const shirtsPath = resolve(root, 'src/data/shirts.json');
const UA = 'quiz-camisetas/1.0 (educational project)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const urlMap = JSON.parse(readFileSync(urlsPath, 'utf8'));
const shirts = JSON.parse(readFileSync(shirtsPath, 'utf8'));

const missing = shirts
  .map((s) => s.id)
  .filter((id) => !existsSync(resolve(outDir, `${id}.png`)));

console.log(`Faltan ${missing.length}: ${missing.join(', ')}`);

let ok = 0;
let fail = 0;

for (const id of missing) {
  const url = urlMap[String(id)];
  if (!url) {
    fail++;
    console.warn(`✗ ${id} sin URL`);
    continue;
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      referrerPolicy: 'no-referrer',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) throw new Error(`archivo demasiado pequeño (${buf.length} B)`);
    writeFileSync(resolve(outDir, `${id}.png`), buf);
    console.log(`✓ ${id} (${buf.length} B)`);
    ok++;
  } catch (err) {
    fail++;
    console.warn(`✗ ${id} ${err.message} <- ${url}`);
  }

  await sleep(600);
}

for (const shirt of shirts) {
  shirt.image = `/shirts/${shirt.id}.png`;
  shirt.original_image = `/shirts/${shirt.id}.png`;
}
writeFileSync(shirtsPath, `${JSON.stringify(shirts, null, 2)}\n`);

console.log(`\nDone: ${ok} ok, ${fail} failed`);
