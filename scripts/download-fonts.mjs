import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const FONTS_DIR = join(import.meta.dirname, '..', 'public', 'fonts');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const FONT_SPECS = [
  {
    name: 'Outfit',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Outfit:ital,wght@0,400;0,500;0,700;0,900;1,400;1,500;1,700;1,900&display=swap',
  },
  {
    name: 'JetBrains Mono',
    cssUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap',
  },
  {
    name: 'Material Symbols Outlined',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap',
  },
];

function slug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function weightKey(w) {
  const s = String(w).toLowerCase().trim();
  if (s === 'regular') return '400';
  return s.replace(/\s+/g, '');
}

async function fetchCSS(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseFontFaces(css, familyName) {
  const faces = [];
  let m;
  const blockRe = /@font-face\s*\{([^}]+)\}/gi;
  while ((m = blockRe.exec(css)) !== null) {
    const block = m[1];
    const props = {};
    for (const [, k, v] of block.matchAll(
      /\s*(font-family|src|font-style|font-weight|font-display|unicode-range)\s*:\s*([^;]+);/gi,
    )) {
      props[k.trim()] = v.trim();
    }
    if (props['font-family'] && props['src']) {
      const urlM = props['src'].match(/url\(([^)]+)\)/);
      if (urlM) {
        const family = props['font-family'].replace(/['"]/g, '');
        faces.push({
          family: familyName,
          fontFamily: family,
          src: urlM[1],
          style: props['font-style'] || 'normal',
          weight: weightKey(props['font-weight'] || '400'),
          unicodeRange: props['unicode-range'] || 'U+0-10FFFF',
        });
      }
    }
  }
  return faces;
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

function makeFilename(face, idx) {
  const s = slug(face.family);
  const w = face.weight;
  const st = face.style === 'italic' ? 'i' : 'n';
  // usa índice para evitar colisiones de nombre entre mismos peso/rango
  return `${s}-${w}${st}-${idx}.woff2`;
}

// Extrae el nombre del archivo de la URL para logging
function urlFilename(url) {
  const p = url.split('/');
  return p[p.length - 1] || url;
}

async function main() {
  mkdirSync(FONTS_DIR, { recursive: true });

  const allFaces = [];

  for (const spec of FONT_SPECS) {
    console.log(`Fetching CSS for ${spec.name}...`);
    const css = await fetchCSS(spec.cssUrl);
    const faces = parseFontFaces(css, spec.name);
    allFaces.push(...faces);
    console.log(`  → ${faces.length} @font-face rules`);
  }

  const cssLines = [];
  let idx = 0;

  for (const face of allFaces) {
    const filename = makeFilename(face, idx);
    const dest = join(FONTS_DIR, filename);

    try {
      const size = await downloadFile(face.src, dest);
      console.log(`[${idx + 1}/${allFaces.length}] ${filename}  (${(size / 1024).toFixed(1)} KB)  ← ${urlFilename(face.src)}`);
    } catch (err) {
      console.error(`[${idx + 1}/${allFaces.length}] FAILED ${filename}: ${err.message}`);
      // Skip this face
      idx++;
      continue;
    }

    cssLines.push(`@font-face {
  font-family: '${face.fontFamily}';
  font-style: ${face.style};
  font-weight: ${face.weight};
  font-display: swap;
  src: url('/fonts/${filename}') format('woff2');
  unicode-range: ${face.unicodeRange};
}`);

    idx++;
  }

  const outCss = join(FONTS_DIR, 'fonts.css');
  writeFileSync(outCss, cssLines.join('\n\n') + '\n', 'utf-8');
  console.log(`\n✅ Done! ${cssLines.length} fonts downloaded.`);
  console.log(`📄 ${outCss}`);
}

main().catch(console.error);
