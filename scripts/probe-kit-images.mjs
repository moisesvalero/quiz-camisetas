import { readFileSync } from 'node:fs';

const TEAM = {
  Uruguay: 'uru',
  Italia: 'ita',
  Brasil: 'bra',
  'Alemania Federal': 'frg',
  'Alemania Oriental': 'gdr',
  Hungría: 'hun',
  Inglaterra: 'eng',
  Perú: 'per',
  'Países Bajos': 'ned',
  Zaire: 'cod',
  Argentina: 'arg',
  Francia: 'fra',
  Dinamarca: 'den',
  México: 'mex',
  Camerún: 'cmr',
  Colombia: 'col',
  Alemania: 'ger',
  'Estados Unidos': 'usa',
  Nigeria: 'nga',
  Croacia: 'cro',
  Jamaica: 'jam',
  Senegal: 'sen',
  'Corea del Sur': 'kor',
  España: 'esp',
};

const shirts = JSON.parse(readFileSync('src/data/shirts.json', 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fileExists(name) {
  const url = `https://commons.wikimedia.org/w/index.php?title=Special:FilePath/${encodeURIComponent(name)}`;
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'quiz-camisetas/1.0 (educational)' },
    });
    if (!res.ok) return false;
    const type = res.headers.get('content-type') ?? '';
    return type.includes('image') || res.url.includes('upload.wikimedia');
  } catch {
    return false;
  }
}

function candidates(shirt) {
  const k = TEAM[shirt.team] ?? shirt.team.slice(0, 3).toLowerCase();
  const yy = String(shirt.year).slice(-2);
  const y4 = String(shirt.year);
  const K = k.toUpperCase();
  return [
    `Kit_body_${K}${y4}.png`,
    `Kit_body_${K}${y4}h.png`,
    `Kit_body_${K}${y4}a.png`,
    `Kit_body_${k}${yy}a.png`,
    `Kit_body_${k}${yy}h.png`,
    `Kit_body_${k}${yy}home.png`,
    `Kit body ${k}${yy}a.png`,
    `Kit body ${k}${yy}home.png`,
    `Kit body ${k}${yy}gk.png`,
    `Kit body ${k}${y4}a.png`,
    `Kit body ${k}${y4}home.png`,
    `Kit body ${k}${yy}h.png`,
    `Kit body ${k}${yy}g1.png`,
    `Kit body ${k}${yy}g2.png`,
  ];
}

for (const shirt of shirts) {
  let hit = null;
  for (const name of candidates(shirt)) {
    if (await fileExists(name)) {
      hit = name;
      break;
    }
    await sleep(250);
  }
  console.log(`${shirt.id}\t${shirt.team}\t${shirt.year}\t${hit ?? 'FAIL'}`);
  await sleep(300);
}
