const UA = "quiz-camisetas/1.0 (educational)";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
async function api(params, retries = 6) {
  for (let i = 0; i <= retries; i++) {
    const now = Date.now();
    const wait = Math.max(0, lastCall + 600 - now);
    if (wait) await delay(wait);
    lastCall = Date.now();
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("format", "json");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429) { await delay(4000 * (i + 1)); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  throw new Error("429");
}
async function queryTitle(title) {
  const data = await api({ action: "query", titles: title, prop: "imageinfo", iiprop: "url" });
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined) return null;
  return page.imageinfo?.[0]?.url ?? null;
}
async function search(q) {
  const data = await api({ action: "query", list: "search", srsearch: q, srnamespace: "6", srlimit: "50" });
  return (data.query?.search ?? []).map((s) => s.title).filter((t) => /Kit[_ ]body/i.test(t));
}
async function special(fn) {
  await delay(500);
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fn.replace(/^File:/, ""))}`;
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA }, redirect: "follow" });
    const ct = res.headers.get("content-type") || "";
    return res.ok && ct.startsWith("image/") ? res.url : null;
  } catch { return null; }
}
const SEARCHES = ["Kit body ita","Kit body ger","Kit body gdr","Kit body ddr","Kit body cod","Kit body zai","Kit body frg","Kit body west","Kit body ita34","Kit body ita38","Kit body frg74","Kit body ger74","Kit body gdr74","Kit body cod74","Kit body zai74"];
const SHIRTS = {
  "Italy 1934 (blue home)": ["Kit_body_ita34h.png","Kit_body_ita34a.png","Kit body ita34h.png","Kit body ita34a.png","Kit_body_ITA1934.png","Kit body ita1934 home.png"],
  "Italy 1938 (black away)": ["Kit_body_ita38a.png","Kit_body_ita38h.png","Kit body ita38a.png","Kit body ita38h.png","Kit_body_ITA1938.png"],
  "West Germany 1974 (white, green collar)": ["Kit_body_frg74h.png","Kit_body_frg74a.png","Kit body frg74h.png","Kit_body_ger74h.png","Kit body ger74h.png","Kit_body_GER1974.png","Kit body west germany 1974 home.png"],
  "East Germany 1974 (blue)": ["Kit_body_gdr74h.png","Kit_body_gdr74a.png","Kit body gdr74h.png","Kit_body_GDR1974.png","Kit body gdr 1974 home.png","Kit_body_ddr74h.png"],
  "Zaire 1974 (green)": ["Kit_body_cod74h.png","Kit_body_cod74a.png","Kit body cod74h.png","Kit_body_zai74h.png","Kit body zai74h.png","Kit_body_ZAI1974.png"],
};
const TEST = ["Kit_body_URU1930.png","Kit_body_bra50.png","Kit_body_ger54h.png","Kit_body_ned74a.png","Kit_body_ger90h.png"];
function matchShirt(title) {
  const t = title.toLowerCase();
  const out = [];
  if (/ita|italy/.test(t) && /34|1934/.test(t)) out.push("Italy 1934 (blue home)");
  if (/ita|italy/.test(t) && /38|1938/.test(t)) out.push("Italy 1938 (black away)");
  if (/(frg|ger|west|brd|federal)/.test(t) && !/(gdr|ddr|east|oriental)/.test(t) && /74|1974/.test(t)) out.push("West Germany 1974 (white, green collar)");
  if (/(gdr|ddr|east|oriental)/.test(t) && /74|1974/.test(t)) out.push("East Germany 1974 (blue)");
  if (/(cod|zai|zaire|drc)/.test(t) && /74|1974/.test(t)) out.push("Zaire 1974 (green)");
  return out;
}
(async () => {
  const pool = new Set();
  for (const q of SEARCHES) {
    for (const t of await search(q)) pool.add(t);
    console.error(q, pool.size);
  }
  const poolArr = [...pool].sort();
  const poolByShirt = {};
  for (const t of poolArr) {
    for (const s of matchShirt(t)) {
      poolByShirt[s] ??= [];
      poolByShirt[s].push(t);
    }
  }
  console.log("=== FilePath tests ===");
  for (const f of TEST) console.log(JSON.stringify({ file: f, uploadUrl: await special(f), works: !!(await special(f)) }));
  console.log("=== Direct probes ===");
  const best = {};
  for (const [shirt, pats] of Object.entries(SHIRTS)) {
    let hit = null;
    for (const p of pats) {
      const fn = p.startsWith("Kit body") ? p : p;
      const sp = await special(fn);
      const apiUrl = await queryTitle(fn.startsWith("File:") ? fn : `File:${fn.replace(/^Kit body /, "Kit body ")}`);
      const titleUnderscore = fn.includes(" ") ? `File:${fn.replace(/ /g, "_")}` : (fn.startsWith("File:") ? fn : `File:${fn}`);
      const api2 = await queryTitle(titleUnderscore);
      const u = sp || apiUrl || api2;
      if (u) { hit = { title: titleUnderscore, uploadUrl: u }; break; }
    }
    best[shirt] = hit;
    console.log(JSON.stringify({ shirt, direct: hit }));
  }
  console.log("=== Search pool matches ===");
  for (const shirt of Object.keys(SHIRTS)) {
    const titles = poolByShirt[shirt] ?? [];
    const resolved = [];
    for (const t of titles.slice(0, 20)) {
      const u = await queryTitle(t);
      if (u) resolved.push({ title: t, uploadUrl: u });
    }
    console.log(JSON.stringify({ shirt, poolTitles: titles.slice(0, 25), resolved, bestFromPool: resolved[0] ?? null, bestOverall: best[shirt] ?? resolved[0] ?? null }));
  }
  console.log("=== Full pool sample (ita/ger/gdr/cod/frg) ===");
  console.log(JSON.stringify(poolArr.filter(t => /ita|ger|gdr|ddr|frg|cod|zai|west|italy|zaire/i.test(t))));
})();
