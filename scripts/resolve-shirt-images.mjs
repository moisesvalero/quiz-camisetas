import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shirtsPath = resolve(root, 'src/data/shirts.json');
const outDir = resolve(root, 'public/shirts');
const API = 'https://commons.wikimedia.org/w/api.php';

mkdirSync(outDir, { recursive: true });

const TEAM_META = {
  Uruguay: { en: 'Uruguay', kit: 'uru' },
  Italia: { en: 'Italy', kit: 'ita' },
  Brasil: { en: 'Brazil', kit: 'bra' },
  'Alemania Federal': { en: 'West Germany', kit: 'frg' },
  'Alemania Oriental': { en: 'East Germany', kit: 'gdr' },
  Hungría: { en: 'Hungary', kit: 'hun' },
  Inglaterra: { en: 'England', kit: 'eng' },
  Perú: { en: 'Peru', kit: 'per' },
  'Países Bajos': { en: 'Netherlands', kit: 'ned' },
  Zaire: { en: 'Zaire', kit: 'cod' },
  Argentina: { en: 'Argentina', kit: 'arg' },
  Francia: { en: 'France', kit: 'fra' },
  Dinamarca: { en: 'Denmark', kit: 'den' },
  México: { en: 'Mexico', kit: 'mex' },
  Camerún: { en: 'Cameroon', kit: 'cmr' },
  Colombia: { en: 'Colombia', kit: 'col' },
  Alemania: { en: 'Germany', kit: 'ger' },
  'Estados Unidos': { en: 'United States', kit: 'usa' },
  Nigeria: { en: 'Nigeria', kit: 'nga' },
  Croacia: { en: 'Croatia', kit: 'cro' },
  Jamaica: { en: 'Jamaica', kit: 'jam' },
  Senegal: { en: 'Senegal', kit: 'sen' },
  'Corea del Sur': { en: 'South Korea', kit: 'kor' },
  España: { en: 'Spain', kit: 'esp' },
};

const shirts = JSON.parse(readFileSync(shirtsPath, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wikiApi(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'quiz-camisetas/1.0 (educational project)' },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

async function urlWorks(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'quiz-camisetas/1.0' },
      referrerPolicy: 'no-referrer',
    });
    if (res.ok) return true;
    const getRes = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'quiz-camisetas/1.0' },
      referrerPolicy: 'no-referrer',
    });
    return getRes.ok;
  } catch {
    return false;
  }
}

function scoreTitle(title, meta, year) {
  const t = title.toLowerCase();
  let score = 0;
  const en = meta.en.toLowerCase();
  const kit = meta.kit.toLowerCase();

  if (t.includes(en)) score += 4;
  if (t.includes(kit)) score += 2;
  if (t.includes(String(year))) score += 3;
  if (/world.?cup|fifa/.test(t)) score += 2;
  if (/shirt|jersey|kit|football|soccer|national|squad|team/.test(t)) score += 2;
  if (/kit body|kit_left|kit_right/.test(t)) score += 5;
  if (/\.pdf|stadium|magazine|entomolog|agriculture|herald|register/.test(t)) score -= 8;
  return score;
}

function pagesToImages(pages, meta, year) {
  return Object.values(pages ?? {})
    .filter((p) => p.imageinfo?.[0]?.url)
    .map((p) => ({
      title: p.title,
      thumb: p.imageinfo[0].thumburl ?? p.imageinfo[0].url,
      url: p.imageinfo[0].url,
      score: scoreTitle(p.title, meta, year),
    }))
    .filter((p) => /\.(jpe?g|png|webp|gif)$/i.test(p.url))
    .sort((a, b) => b.score - a.score);
}

async function searchCommons(query, meta, year, limit = 10) {
  const data = await wikiApi({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '500',
  });
  return pagesToImages(data.query?.pages, meta, year);
}

async function resolveByFilename(filename, meta, year) {
  const variants = [`File:${filename}`, `File:${filename.replace(/_/g, ' ')}`];
  for (const title of variants) {
    const data = await wikiApi({
      action: 'query',
      titles: title,
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '500',
    });
    const page = Object.values(data.query?.pages ?? {})[0];
    if (page?.imageinfo?.[0]) {
      return {
        title: page.title,
        thumb: page.imageinfo[0].thumburl ?? page.imageinfo[0].url,
        url: page.imageinfo[0].url,
      };
    }
    await sleep(100);
  }

  const hits = await searchCommons(`intitle:"${filename.replace(/_/g, ' ')}"`, meta, year, 5);
  return hits[0] ?? null;
}

async function resolveByHeuristics(shirt, meta) {
  const year = shirt.year;
  const yy = String(year).slice(-2);
  const kitFilenames = [
    `Kit body ${meta.kit}${yy}a.png`,
    `Kit body ${meta.kit}${yy}home.png`,
    `Kit body ${meta.kit}${yy}gk.png`,
    `Kit body ${meta.en.toLowerCase()} ${year}.png`,
    `Kit body ${meta.en.toLowerCase().replace(/\s+/g, '')}${year} home.png`,
  ];

  for (const filename of kitFilenames) {
    const hit = await resolveByFilename(filename, meta, year);
    if (hit && (await urlWorks(hit.url ?? hit.thumb))) return hit;
    await sleep(150);
  }

  const queries = [
    `Kit body ${meta.kit}${yy}`,
    `Kit body ${meta.en.toLowerCase().replace(/\s+/g, '')}${year} home`,
    `Kit body ${meta.kit}${year} home`,
    `${meta.en} ${year} FIFA World Cup football`,
    `${meta.en} national football team ${year}`,
    `${meta.en} ${year} world cup jersey`,
  ];

  let best = null;
  for (const q of queries) {
    const hits = await searchCommons(q, meta, year, 8);
    if (hits[0] && (!best || hits[0].score > best.score)) best = hits[0];
    if (best?.score >= 7) break;
    await sleep(200);
  }
  return best;
}

async function pickWorkingCandidate(shirt, meta) {
  const candidates = [];

  if (shirt.image?.startsWith('http')) candidates.push({ url: shirt.image, thumb: shirt.image, title: 'existing image' });
  if (shirt.original_image?.startsWith('http') && shirt.original_image !== shirt.image) {
    candidates.push({ url: shirt.original_image, thumb: shirt.original_image, title: 'existing original' });
  }

  const byFilename = await resolveByFilename(shirt.filename, meta, shirt.year);
  if (byFilename) candidates.push(byFilename);
  await sleep(200);

  const byHeuristic = await resolveByHeuristics(shirt, meta);
  if (byHeuristic) candidates.push(byHeuristic);

  for (const c of candidates) {
    const check = c.url ?? c.thumb;
    if (check && (await urlWorks(check))) return c;
    await sleep(150);
  }
  return null;
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'quiz-camisetas/1.0 (educational project)' },
    referrerPolicy: 'no-referrer',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

let ok = 0;
let fail = 0;

for (const shirt of shirts) {
  const meta = TEAM_META[shirt.team] ?? { en: shirt.team, kit: shirt.team.slice(0, 3).toLowerCase() };
  const ext = shirt.filename?.match(/\.[a-z0-9]+$/i)?.[0] ?? '.jpg';
  const localName = `${shirt.id}${ext}`;
  const localPath = resolve(outDir, localName);
  const publicPath = `/shirts/${localName}`;

  if (existsSync(localPath)) {
    shirt.image = publicPath;
    shirt.original_image = publicPath;
    ok++;
    console.log(`= ${shirt.id} local`);
    continue;
  }

  const resolved = await pickWorkingCandidate(shirt, meta);
  if (!resolved) {
    fail++;
    console.warn(`✗ ${shirt.id} ${shirt.team} ${shirt.year}`);
    continue;
  }

  shirt.image = resolved.thumb ?? resolved.url;
  shirt.original_image = resolved.url;

  try {
    await download(resolved.url, localPath);
    shirt.image = publicPath;
    shirt.original_image = publicPath;
    console.log(`✓ ${shirt.id} ${shirt.team} ${shirt.year} <- ${resolved.title}`);
    ok++;
  } catch (err) {
    console.warn(`~ ${shirt.id} remota (${err.message}) <- ${resolved.title}`);
    ok++;
  }

  await sleep(500);
}

writeFileSync(shirtsPath, `${JSON.stringify(shirts, null, 2)}\n`);
console.log(`\nDone: ${ok} ok, ${fail} failed`);
