import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shirtsPath = resolve(root, 'src/data/shirts.json');
const urlsPath = resolve(root, 'scripts/shirt-image-urls.json');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'quiz-camisetas/1.0 (educational project)';

const TEAM_META = {
  Uruguay: { kit: 'uru', code3: 'URU' },
  Italia: { kit: 'ita', code3: 'ITA' },
  Brasil: { kit: 'bra', code3: 'BRA' },
  'Alemania Federal': { kit: 'frg', code3: 'FRG', alt: ['ger', 'wger'] },
  'Alemania Oriental': { kit: 'gdr', code3: 'GDR', alt: ['ddr'] },
  Hungría: { kit: 'hun', code3: 'HUN' },
  Inglaterra: { kit: 'eng', code3: 'ENG' },
  Perú: { kit: 'per', code3: 'PER' },
  'Países Bajos': { kit: 'ned', code3: 'NED' },
  Zaire: { kit: 'cod', code3: 'COD', alt: ['zai', 'zaire'] },
  Argentina: { kit: 'arg', code3: 'ARG' },
  Francia: { kit: 'fra', code3: 'FRA' },
  Dinamarca: { kit: 'den', code3: 'DEN' },
  México: { kit: 'mex', code3: 'MEX' },
  Camerún: { kit: 'cmr', code3: 'CMR', alt: ['cameroon'] },
  Colombia: { kit: 'col', code3: 'COL' },
  Alemania: { kit: 'ger', code3: 'GER' },
  'Estados Unidos': { kit: 'usa', code3: 'USA' },
  Nigeria: { kit: 'nga', code3: 'NGA' },
  Croacia: { kit: 'cro', code3: 'CRO' },
  Jamaica: { kit: 'jam', code3: 'JAM' },
  Senegal: { kit: 'sen', code3: 'SEN' },
  'Corea del Sur': { kit: 'kor', code3: 'KOR' },
  España: { kit: 'esp', code3: 'ESP' },
};

/** Sin Kit body histórico exacto en Commons: plantillas genéricas por color/equipo */
const MANUAL_KIT_URL = {
  2: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Kit_body_PDC_ITA.png',
  3: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Kit_body_laced_black.png',
  13: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Kit_body_frg78h.png',
  14: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Kit_body_ddr1990h.png',
  15: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Kit_body_collar_green.png',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isKitBodyTitle(title) {
  return /^File:Kit[_ ]body/i.test(title);
}

function kitCodes(meta) {
  const codes = new Set([meta.kit, meta.code3, ...(meta.alt ?? [])]);
  return [...codes];
}

function filenameCandidates(shirt, meta) {
  const yy = String(shirt.year).slice(-2);
  const y4 = String(shirt.year);
  const suffixes = ['a', 'h', 'home', 'gk', 'g1', 'g2'];
  const names = new Set();

  for (const code of kitCodes(meta)) {
    const lower = code.toLowerCase();
    const upper = code.toUpperCase();

    names.add(`Kit_body_${upper}${y4}.png`);
    names.add(`Kit_body_${upper}${y4}h.png`);
    names.add(`Kit_body_${upper}${y4}a.png`);
    names.add(`Kit_body_${lower}${yy}a.png`);
    names.add(`Kit_body_${lower}${yy}h.png`);
    names.add(`Kit_body_${lower}${yy}home.png`);
    names.add(`Kit_body_${lower}${y4}a.png`);
    names.add(`Kit_body_${lower}${y4}h.png`);

    for (const sfx of suffixes) {
      names.add(`Kit body ${lower}${yy}${sfx}.png`);
      names.add(`Kit body ${lower}${y4}${sfx}.png`);
    }

    if (lower === 'cmr') {
      names.add(`Kit_body_cameroon${y4}_home.png`);
      names.add(`Kit_body_cameroon${shirt.year}_home.png`);
    }
    if (lower === 'hun') {
      names.add(`Kit_body_hun_1949_1956_home.png`);
    }
  }

  return [...names];
}

async function wikiApi(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (res.status === 429) {
    await sleep(2000);
    return wikiApi(params);
  }
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

async function resolveTitles(titles) {
  const found = new Map();
  for (let i = 0; i < titles.length; i += 40) {
    const chunk = titles.slice(i, i + 40).map((n) => `File:${n.replace(/^File:/, '')}`);
    const data = await wikiApi({
      action: 'query',
      titles: chunk.join('|'),
      prop: 'imageinfo',
      iiprop: 'url',
    });
    for (const page of Object.values(data.query?.pages ?? {})) {
      if (page.missing !== undefined) continue;
      const url = page.imageinfo?.[0]?.url;
      if (url && isKitBodyTitle(page.title)) found.set(page.title, url);
    }
    await sleep(400);
  }
  return found;
}

async function searchKitBody(meta, year) {
  const yy = String(year).slice(-2);
  const queries = kitCodes(meta).flatMap((code) => [
    `intitle:"Kit body ${code}${yy}"`,
    `intitle:"Kit_body_${code}${yy}"`,
    `intitle:"Kit body ${code}" ${year}`,
  ]);

  for (const q of queries) {
    const data = await wikiApi({
      action: 'query',
      list: 'search',
      srsearch: q,
      srnamespace: '6',
      srlimit: '12',
    });
    const titles = (data.query?.search ?? [])
      .map((s) => s.title)
      .filter(isKitBodyTitle);
    if (!titles.length) {
      await sleep(500);
      continue;
    }
    const resolved = await resolveTitles(titles.map((t) => t.replace(/^File:/, '')));
    const best = [...resolved.entries()].sort((a, b) => {
      const score = (title) => {
        const t = title.toLowerCase();
        let s = 0;
        if (t.includes(String(year))) s += 4;
        if (t.includes(yy)) s += 3;
        if (t.includes(meta.kit)) s += 2;
        if (/home|[^a-z]h\.png$/i.test(t)) s += 1;
        return s;
      };
      return score(b[0]) - score(a[0]);
    })[0];
    if (best) return { title: best[0], url: best[1] };
    await sleep(500);
  }
  return null;
}

const shirts = JSON.parse(readFileSync(shirtsPath, 'utf8'));
const urlMap = {};
let ok = 0;
let manual = 0;
let fail = 0;

for (const shirt of shirts) {
  if (MANUAL_KIT_URL[shirt.id]) {
    urlMap[String(shirt.id)] = MANUAL_KIT_URL[shirt.id];
    console.log(`~ ${shirt.id} manual kit fallback`);
    manual++;
    continue;
  }

  const meta = TEAM_META[shirt.team] ?? {
    kit: shirt.team.slice(0, 3).toLowerCase(),
    code3: shirt.team.slice(0, 3).toUpperCase(),
  };

  const candidates = filenameCandidates(shirt, meta);
  const resolved = await resolveTitles(candidates);
  let hit = [...resolved.entries()][0];

  if (!hit) {
    const searched = await searchKitBody(meta, shirt.year);
    if (searched) hit = [searched.title, searched.url];
  }

  if (!hit) {
    fail++;
    console.warn(`✗ ${shirt.id} ${shirt.team} ${shirt.year}`);
    continue;
  }

  urlMap[String(shirt.id)] = hit[1];
  console.log(`✓ ${shirt.id} ${shirt.team} ${shirt.year} <- ${hit[0]}`);
  ok++;
  await sleep(300);
}

writeFileSync(urlsPath, `${JSON.stringify(urlMap, null, 2)}\n`);
console.log(`\nDone: ${ok} resolved, ${manual} manual, ${fail} failed`);
