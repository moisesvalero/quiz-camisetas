import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

const WIDTHS = [480, 800] as const;
const SIZES = '(min-width: 768px) 500px, 100vw';

const rawImages = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/shirts/*.jpg',
  { eager: true }
);

export interface ShirtImageData {
  src: string;
  width: number;
  height: number;
  webpSrcset: string;
  avifSrcset: string;
  sizes: string;
}

function extractId(path: string): number | null {
  const match = path.match(/\/(\d+)\.jpg$/);
  return match ? Number(match[1]) : null;
}

function loadImage(_id: number, meta: ImageMetadata): Promise<ShirtImageData> {
  return (async () => {
    const [webp, avif] = await Promise.all([
      getImage({ src: meta, widths: [...WIDTHS], format: 'webp' }),
      getImage({ src: meta, widths: [...WIDTHS], format: 'avif' })
    ]);

    return {
      src: webp.src,
      width: webp.attributes.width ?? 800,
      height: webp.attributes.height ?? 1000,
      webpSrcset: webp.srcSet.attribute,
      avifSrcset: avif.srcSet.attribute,
      sizes: SIZES
    };
  })();
}

export async function buildShirtImageMap(): Promise<Record<number, ShirtImageData>> {
  const entries: Array<[number, Promise<ShirtImageData>]> = [];

  for (const [path, mod] of Object.entries(rawImages)) {
    const id = extractId(path);
    if (id === null) continue;
    entries.push([id, loadImage(id, mod.default)]);
  }

  const resolved = await Promise.all(entries.map(async ([id, p]) => [id, await p] as const));
  return Object.fromEntries(resolved);
}
