import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const targetIds = [16, 17, 25, 27, 29, 30, 31, 32, 34, 38, 39, 40, 44];
const urlsPath = resolve(root, "scripts/shirt-image-urls.json");
const shirtsPath = resolve(root, "src/data/shirts.json");
const outDir = resolve(root, "public/shirts");
const urlMap = JSON.parse(readFileSync(urlsPath, "utf8"));
const shirts = JSON.parse(readFileSync(shirtsPath, "utf8"));
const byId = Object.fromEntries(shirts.map((s) => [s.id, s]));
mkdirSync(outDir, { recursive: true });

const UA = "quiz-camisetas/1.0 (educational project)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isPng(buf) {
  return buf && buf.length >= 40 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}

async function fetchWithRetry(url, retries = 6) {
  let lastStatus = 0;
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      referrerPolicy: "no-referrer",
    });
    lastStatus = res.status;
    if (res.status === 429) {
      await sleep(2500 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (!isPng(buf)) throw new Error(`Not PNG (${buf.length} bytes)`);
    return buf;
  }
  throw new Error(`HTTP ${lastStatus || 429} after retries`);
}

async function commonsSearch(titleHint) {
  const q = encodeURIComponent(`intitle:"${titleHint}"`);
  const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${q}&srnamespace=6&srlimit=12`;
  const res = await fetch(api, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.query?.search ?? []).map((x) => x.title);
}

function pickKitBody(titles, prefer) {
  const lowerPrefer = prefer.toLowerCase();
  const kit = titles.filter((t) => /file:kit body/i.test(t));
  return kit.find((t) => t.toLowerCase().includes(lowerPrefer)) ?? kit[0] ?? null;
}

async function titleToUrl(fileTitle) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url`;
  const res = await fetch(api, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const data = await res.json();
  const page = Object.values(data.query?.pages ?? {})[0];
  return page?.imageinfo?.[0]?.url ?? null;
}

async function resolveAndDownload(id, current) {
  try {
    const buf = await fetchWithRetry(current);
    return { url: current, buf, source: "existing" };
  } catch (err) {
    /* try commons */
  }

  const shirt = byId[id];
  const base = current.split("/").pop()?.replace(/\.png$/i, "") ?? "";
  const hints = [base, base.replace(/a$/i, ""), `Kit body ${shirt.team} ${shirt.year}`, `Kit body ${shirt.team}`];
  for (const hint of hints) {
    if (!hint) continue;
    const titles = await commonsSearch(hint);
    const picked = pickKitBody(titles, base.replace(/^Kit_body_/i, ""));
    if (!picked) continue;
    const url = await titleToUrl(picked);
    if (!url) continue;
    try {
      const buf = await fetchWithRetry(url);
      return { url, buf, source: `commons:${picked}` };
    } catch {
      await sleep(800);
    }
  }
  throw new Error("No working URL found");
}

const report = [];
for (const id of targetIds) {
  const dest = resolve(outDir, `${id}.png`);
  if (existsSync(dest) && isPng(readFileSync(dest))) {
    report.push({ id, ok: true, skipped: true, url: urlMap[String(id)] });
    continue;
  }

  const current = urlMap[String(id)];
  try {
    const result = await resolveAndDownload(id, current);
    writeFileSync(dest, result.buf);
    if (result.url !== current) urlMap[String(id)] = result.url;
    report.push({ id, ok: true, url: result.url, source: result.source, bytes: result.buf.length });
  } catch (err) {
    report.push({ id, ok: false, url: current, error: err.message });
  }
  await sleep(1200);
}

writeFileSync(urlsPath, `${JSON.stringify(urlMap, null, 2)}\n`);
const count = readdirSync(outDir).filter((f) => /^\d+\.png$/i.test(f)).length;
console.log(JSON.stringify({ report, pngCount: count }, null, 2));
