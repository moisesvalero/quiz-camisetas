// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  image: {
    layout: 'constrained'
  },
  fonts: [
    {
      name: 'Outfit',
      cssVariable: '--font-outfit',
      provider: fontProviders.google(),
      weights: [400, 500, 700, 900],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext']
    },
    {
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      provider: fontProviders.google(),
      weights: [500, 700],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext']
    },
    {
      name: 'Material Symbols Outlined',
      cssVariable: '--font-material-symbols',
      provider: fontProviders.googleicons(),
      styles: ['normal']
    }
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
