const UA = "quiz-camisetas/1.0 (educational)";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
async function api(params, retries = 8) {
  for (let i = 0; i <= retries; i++) {
    const now = Date.now();
    const wait = Math.max(0, lastCall + 1500 - now);
    if (wait) await delay(wait);
    lastCall = Date.now();
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("format", "json");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429) { await delay(5000 * (i + 1)); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(params).slice(0,120)}`);
    return res.json();
  }
  throw new Error("HTTP 429 after retries");
}
async function batchUrls(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const data = await api({ action: "query", titles: chunk.join("|"), prop: "imageinfo", iiprop: "url" });
    for (const p of Object.values(data.query?.pages ?? {})) {
      if (p.missing !== undefined) continue;
      const u = p.imageinfo?.[0]?.url;
      if (u) out.set(p.title, u);
    }
  }
  return out;
}
async function searchCommons(gsrsearch) {
  const data = await api({ action: "query", list: "search", srsearch: gsrsearch, srnamespace: "6", srlimit: "50" });
  return (data.query?.search ?? []).map((s) => s.title).filter((t) => /Kit[_ ]body/i.test(t));
}
async function resolveSpecialPath(filename) {
  await delay(500);
  const base = filename.replace(/^File:/, "");
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(base).replace(/%20/g, "_")}`;
  const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA }, redirect: "follow" });
  const ct = res.headers.get("content-type") || "";
  return res.ok && ct.startsWith("image/") ? res.url : null;
}
const SEARCHES = ["Kit body ita","Kit body ger","Kit body gdr","Kit body ddr","Kit body cod","Kit body zai","Kit body frg","Kit body west","Kit body ita 1934","Kit body ita 1938","Kit body ger 1974","Kit body gdr 1974","Kit body zai 1974"];
const TEST_FILES = ["Kit_body_URU1930.png","Kit_body_bra50.png","Kit_body_ger54h.png","Kit_body_ned74a.png","Kit_body_ger90h.png"];
const DIRECT = {
  "Italy 1934 (blue home)": ["Kit_body_ita34h.png","Kit_body_ita34a.png","Kit_body_ita34.png","Kit_body_ITA1934.png","Kit_body_ITA1934h.png","Kit_body_ITA1934a.png","Kit_body_ita1934h.png"],
  "Italy 1938 (black away)": ["Kit_body_ita38a.png","Kit_body_ita38h.png","Kit_body_ita38.png","Kit_body_ITA1938.png","Kit_body_ITA1938a.png","Kit_body_ita1938a.png"],
  "West Germany 1974 (white, green collar)": ["Kit_body_ger74h.png","Kit_body_ger74a.png","Kit_body_ger74.png","Kit_body_FRG1974.png","Kit_body_frg74h.png","Kit_body_wger74h.png","Kit_body_ger1974h.png"],
  "East Germany 1974 (blue)": ["Kit_body_gdr74h.png","Kit_body_gdr74a.png","Kit_body_gdr74.png","Kit_body_GDR1974.png","Kit_body_ddr74h.png","Kit_body_ddr74a.png","Kit_body_gdr1974h.png"],
  "Zaire 1974 (green)": ["Kit_body_zai74h.png","Kit_body_zai74a.png","Kit_body_zai74.png","Kit_body_ZAI1974.png","Kit_body_cod74h.png","Kit_body_cod74a.png","Kit_body_zaire74h.png"],
};
function pickBest(label, titles, urlMap) {
  const rules = {
    "Italy 1934 (blue home)": (t) => /ita|italy/i.test(t) && /34|1934/i.test(t),
    "Italy 1938 (black away)": (t) => /ita|italy/i.test(t) && /38|1938/i.test(t),
    "West Germany 1974 (white, green collar)": (t) => /(ger|frg|west)/i.test(t) && !/(gdr|ddr|east)/i.test(t) && /74|1974/i.test(t),
    "East Germany 1974 (blue)": (t) => /(gdr|ddr|east)/i.test(t) && /74|1974/i.test(t),
    "Zaire 1974 (green)": (t) => /(zai|zaire|cod|drc)/i.test(t) && /74|1974/i.test(t),
  };
  const pred = rules[label];
  const hits = titles.filter((t) => pred(t));
  hits.sort((a,b)=>{
    const score = (t)=> (/(h\.png|home)/i.test(t)?3:0)+(/(a\.png|away)/i.test(t)?2:0)+(/1974|1934|1938/.test(t)?2:0);
    return score(b)-score(a);
  });
  for (const t of hits) {
    const u = urlMap.get(t);
    if (u) return { title: t, uploadUrl: u };
  }
  return null;
}
async function main() {
  const pool = new Set();
  for (const q of SEARCHES) {
    for (const t of await searchCommons(q)) pool.add(t);
    console.error("search done", q, "pool", pool.size);
  }
  const titles = [...pool];
  const urlMap = await batchUrls(titles);
  console.log("=== Special:FilePath tests ===");
  for (const f of TEST_FILES) {
    const u = await resolveSpecialPath(f);
    console.log(JSON.stringify({ file: f, uploadUrl: u, works: !!u }));
  }
  console.log("\n=== Direct pattern probes ===");
  for (const [shirt, patterns] of Object.entries(DIRECT)) {
    let found = null;
    for (const p of patterns) {
      const u = await resolveSpecialPath(p);
      if (u) { found = { title: `File:${p}`, uploadUrl: u, source: "Special:FilePath" }; break; }
    }
    console.log(JSON.stringify({ shirt, direct: found }));
  }
  console.log("\n=== Best from search pool ===");
  for (const shirt of Object.keys(DIRECT)) {
    const best = pickBest(shirt, titles, urlMap);
    console.log(JSON.stringify({ shirt, best, relatedFromPool: titles.filter((t)=>{
      const s=shirt; if(s.includes("Italy 1934")) return /ita/i.test(t)&&/34|1934/i.test(t);
      if(s.includes("1938")) return /ita/i.test(t)&&/38|1938/i.test(t);
      if(s.includes("West")) return /ger|frg|west/i.test(t)&&!/gdr|ddr/i.test(t)&&/74/i.test(t);
      if(s.includes("East")) return /gdr|ddr/i.test(t)&&/74/i.test(t);
      if(s.includes("Zaire")) return /zai|zaire|cod/i.test(t)&&/74/i.test(t);
      return false;
    }).slice(0,15).map((t)=>({title:t,uploadUrl:urlMap.get(t)||null})) }));
  }
}
main().catch((e)=>{ console.error(e); process.exit(1); });
