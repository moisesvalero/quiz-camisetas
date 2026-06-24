import shirtsData from './shirts.json';

// Imágenes servidas desde /public/shirts (Football Kit Archive — scripts/download-fka-cdn.mjs)

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

export function getShirtImageCandidates(shirt: Shirt): string[] {
  const urls = [shirt.image, shirt.original_image].filter(Boolean);
  return [...new Set(urls)];
}

export const shirts: Shirt[] = shirtsData as Shirt[];

export async function searchShirtImageUrl(_team: string, _year: number): Promise<string | null> {
  return null;
}
