import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shirtsPath = resolve(root, 'src/data/shirts.json');

function unwrapWeserv(url) {
  if (!url?.includes('images.weserv.nl')) return url;
  const parsed = new URL(url);
  const target = parsed.searchParams.get('url');
  return target ?? url;
}

const shirts = JSON.parse(readFileSync(shirtsPath, 'utf8'));

for (const shirt of shirts) {
  shirt.image = unwrapWeserv(shirt.image);
  shirt.original_image = unwrapWeserv(shirt.original_image);
}

writeFileSync(shirtsPath, `${JSON.stringify(shirts, null, 2)}\n`);
console.log(`Fixed ${shirts.length} shirt image URLs`);
