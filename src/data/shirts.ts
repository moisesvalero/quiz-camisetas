import shirtsData from './shirts.json';

// Imágenes servidas desde /public/shirts (ver scripts/download-local-shirts.mjs)

export interface Shirt {
  id: number;
  team: string;
  year: number;
  color: string;
  desc: string;
  filename: string;
  image: string;
  original_image: string;
}

const TEAM_META: Record<string, { en: string; code3: string }> = {
  Uruguay: { en: 'Uruguay', code3: 'uru' },
  Italia: { en: 'Italy', code3: 'ita' },
  Brasil: { en: 'Brazil', code3: 'bra' },
  'Alemania Federal': { en: 'West Germany', code3: 'frg' },
  'Alemania Oriental': { en: 'East Germany', code3: 'gdr' },
  Hungría: { en: 'Hungary', code3: 'hun' },
  Inglaterra: { en: 'England', code3: 'eng' },
  Perú: { en: 'Peru', code3: 'per' },
  'Países Bajos': { en: 'Netherlands', code3: 'ned' },
  Zaire: { en: 'Zaire', code3: 'cod' },
  Argentina: { en: 'Argentina', code3: 'arg' },
  Francia: { en: 'France', code3: 'fra' },
  Dinamarca: { en: 'Denmark', code3: 'den' },
  México: { en: 'Mexico', code3: 'mex' },
  Camerún: { en: 'Cameroon', code3: 'cmr' },
  Colombia: { en: 'Colombia', code3: 'col' },
  Alemania: { en: 'Germany', code3: 'ger' },
  'Estados Unidos': { en: 'United States', code3: 'usa' },
  Nigeria: { en: 'Nigeria', code3: 'nga' },
  Croacia: { en: 'Croatia', code3: 'cro' },
  Jamaica: { en: 'Jamaica', code3: 'jam' },
  Senegal: { en: 'Senegal', code3: 'sen' },
  'Corea del Sur': { en: 'South Korea', code3: 'kor' },
  España: { en: 'Spain', code3: 'esp' },
};

export function getShirtImageCandidates(shirt: Shirt): string[] {
  const urls = [shirt.image, shirt.original_image].filter(Boolean);
  return [...new Set(urls)];
}

export const shirts: Shirt[] = shirtsData as Shirt[];

export async function searchShirtImageUrl(team: string, year: number): Promise<string | null> {
  const meta = TEAM_META[team];
  const en = meta?.en ?? team;
  const queries = [
    `Kit body ${en.toLowerCase()} ${year}`,
    `${en} ${year} FIFA World Cup football`,
    `${en} national football team ${year}`,
  ];

  for (const q of queries) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      generator: 'search',
      gsrsearch: q,
      gsrnamespace: '6',
      gsrlimit: '6',
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '500',
    });

    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
    if (!res.ok) continue;

    const data = await res.json();
    const pages = Object.values(data.query?.pages ?? {}) as Array<{
      title?: string;
      imageinfo?: Array<{ thumburl?: string; url?: string }>;
    }>;

    const hit = pages.find((p) => {
      const title = p.title?.toLowerCase() ?? '';
      const url = p.imageinfo?.[0]?.url ?? '';
      if (!/\.(jpe?g|png|webp)$/i.test(url)) return false;
      if (/\.pdf|stadium|magazine/.test(title)) return false;
      return /kit|shirt|jersey|football|world|team|squad|national/.test(title);
    });

    if (hit?.imageinfo?.[0]?.thumburl) return hit.imageinfo[0].thumburl;
  }

  return null;
}
