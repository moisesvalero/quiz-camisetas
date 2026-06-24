import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ids = [17, 25, 34, 38, 39, 40, 44];
const urlsPath = resolve(root, "scripts/shirt-image-urls.json");
const outDir = resolve(root, "public/shirts");
const urlMap = JSON.parse(readFileSync(urlsPath, "utf8"));
const UA = "quiz-camisetas/1.0 (educational project)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isPng(buf) {
  return buf && buf.length >= 40 && buf[0] === 0x89 && buf[1] === 0x50;
}

function fileNameFromUrl(url) {
  return decodeURIComponent(url.split("/").pop() ?? "");
}

function altUrls(url) {
  const name = fileNameFromUrl(url);
  return [
    url,
    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}`,
    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name.replace(/\.png$/i, ".svg"))}`,
  ];
}

async function fetchPng(url, retries = 8) {
  let last = 0;
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    last = res.status;
    if (res.status === 429) {
      await sleep(5000 * (i + 1));
      continue;
    }
    if (!res.ok) break;
    const buf = Buffer.from(await res.arrayBuffer());
    if (isPng(buf)) return buf;
    break;
  }
  throw new Error(`fetch failed (${last}) for ${url}`);
}

const report = [];
for (const id of ids) {
  const dest = resolve(outDir, `${id}.png`);
  if (existsSync(dest) && isPng(readFileSync(dest))) {
    report.push({ id, ok: true, skipped: true });
    continue;
  }
  const current = urlMap[String(id)];
  let saved = false;
  for (const url of altUrls(current)) {
    try {
      const buf = await fetchPng(url);
      writeFileSync(dest, buf);
      if (url !== current && url.includes("upload.wikimedia.org")) urlMap[String(id)] = url;
      report.push({ id, ok: true, url, bytes: buf.length });
      saved = true;
      break;
    } catch (e) {
      report.push({ id, try: url, error: e.message });
    }
    await sleep(3000);
  }
  if (!saved) report.push({ id, ok: false });
  await sleep(8000);
}

writeFileSync(urlsPath, `${JSON.stringify(urlMap, null, 2)}\n`);
const count = readdirSync(outDir).filter((f) => /^\d+\.png$/i.test(f)).length;
console.log(JSON.stringify({ report: report.filter((r) => r.ok || r.ok === false), pngCount: count }, null, 2));
