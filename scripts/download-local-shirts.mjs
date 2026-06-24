import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shirtsPath = resolve(root, 'src/data/shirts.json');
const urlsPath = resolve(root, 'scripts/shirt-image-urls.json');
const outDir = resolve(root, 'public/shirts');
const force = process.argv.includes('--force');

mkdirSync(outDir, { recursive: true });

const shirts = JSON.parse(readFileSync(shirtsPath, 'utf8'));
const urlMap = JSON.parse(readFileSync(urlsPath, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (force) {
  for (const file of readdirSync(outDir)) {
    if (/^\d+\.(png|jpe?g|webp)$/i.test(file)) unlinkSync(resolve(outDir, file));
  }
  console.log('Modo --force: assets locales anteriores eliminados');
}


async function download(url, dest, retries = 8) {
  let lastStatus = 0;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'quiz-camisetas/1.0 (educational project)' },
        referrerPolicy: 'no-referrer',
      });
      lastStatus = res.status;
      if (res.status === 429) {
        await sleep(3000 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 40) throw new Error(`Respuesta vacía (${buf.length} bytes)`);
      writeFileSync(dest, buf);
      return;
    } catch (err) {
      if (i === retries - 1) {
        throw lastStatus === 429 ? new Error('HTTP 429 tras reintentos') : err;
      }
      await sleep(2000 * (i + 1));
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

  const localName = `${shirt.id}.png`;
  const localPath = resolve(outDir, localName);
  const publicPath = `/shirts/${localName}`;

  if (!force && existsSync(localPath) && statSync(localPath).size > 100) {
    shirt.image = publicPath;
    shirt.original_image = publicPath;
    console.log(`= ${shirt.id} ya existe`);
    ok++;
    continue;
  }

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

  await sleep(1200);
}

writeFileSync(shirtsPath, `${JSON.stringify(shirts, null, 2)}\n`);
console.log(`\nDone: ${ok} ok, ${fail} failed`);
