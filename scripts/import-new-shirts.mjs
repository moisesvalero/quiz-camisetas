#!/usr/bin/env node
/**
 * Procesa las imágenes nuevas en public/shirts/ que no son numéricas,
 * les asigna IDs consecutivos, las copia renombradas y genera entradas para shirts.json
 */
import { readFileSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SHIRTS_DIR = join(ROOT, 'public/shirts');
const SHIRTS_PATH = join(ROOT, 'src/data/shirts.json');

// Mapeo de slug español → nombre de equipo normalizado
const TEAM_MAP = {
  'alemania': 'Alemania',
  'arabia-saudi': 'Arabia Saudí',
  'argelia': 'Argelia',
  'argentina': 'Argentina',
  'australia': 'Australia',
  'austria': 'Austria',
  'belgica': 'Bélgica',
  'brasil': 'Brasil',
  'bulgaria': 'Bulgaria',
  'cabo-verde': 'Cabo Verde',
  'canada': 'Canadá',
  'colombia': 'Colombia',
  'corea-del-sur': 'Corea del Sur',
  'costa-de-marfil': 'Costa de Marfil',
  'croacia': 'Croacia',
  'curacao': 'Curaçao',
  'ecuador': 'Ecuador',
  'ee-uu': 'Estados Unidos',
  'egipto': 'Egipto',
  'escocia': 'Escocia',
  'espana': 'España',
  'francia': 'Francia',
  'inglaterra': 'Inglaterra',
  'iran': 'Irán',
  'iraq': 'Iraq',
  'japon': 'Japón',
  'marruecos': 'Marruecos',
  'mexico': 'México',
  'noruega': 'Noruega',
  'paises-bajos': 'Países Bajos',
  'portugal': 'Portugal',
  'republica-checa': 'República Checa',
  'senegal': 'Senegal',
  'sudafrica': 'Sudáfrica',
  'suecia': 'Suecia',
  'suiza': 'Suiza',
  'turquia': 'Turquía',
  'uniao-portuguesa-de-futebol': 'Unión Portuguesa de Fútbol',
  'uruguay': 'Uruguay',
};

const TIPO_MAP = {
  'local': 'Local',
  'visitante': 'Visitante',
  'pt-1': 'Alternativa',
  'tercera': 'Tercera',
  'entrenamiento': 'Entrenamiento',
};

function parseFilename(filename) {
  // Patrones:
  // camiseta-local-EQUIPO-AÑO.jpg
  // camiseta-visitante-EQUIPO-AÑO.jpg
  // camiseta-pt-1-EQUIPO-AÑO.jpg
  // tercera-camiseta-EQUIPO-AÑO.jpg
  // shirt-entrenamiento-EQUIPO-AÑO.jpg

  const name = filename.replace(/\.(jpg|png|webp)$/i, '');

  // Extraer año (últimos 4 dígitos, o con guion como 2001-02)
  const yearMatch = name.match(/[-_](\d{4}(?:-\d{2})?)$/);
  if (!yearMatch) return null;
  const yearRaw = yearMatch[1];
  const year = parseInt(yearRaw.substring(0, 4));

  // Quitar el año del nombre para buscar equipo y tipo
  const withoutYear = name.slice(0, name.lastIndexOf(yearRaw) - 1);

  // Detectar tipo
  let tipo = 'Local';
  let afterTipo = withoutYear;

  if (withoutYear.startsWith('camiseta-local-')) {
    tipo = 'Local';
    afterTipo = withoutYear.replace('camiseta-local-', '');
  } else if (withoutYear.startsWith('camiseta-visitante-')) {
    tipo = 'Visitante';
    afterTipo = withoutYear.replace('camiseta-visitante-', '');
  } else if (withoutYear.startsWith('camiseta-pt-1-')) {
    tipo = 'Alternativa';
    afterTipo = withoutYear.replace('camiseta-pt-1-', '');
  } else if (withoutYear.startsWith('tercera-camiseta-')) {
    tipo = 'Tercera';
    afterTipo = withoutYear.replace('tercera-camiseta-', '');
  } else if (withoutYear.startsWith('shirt-entrenamiento-')) {
    tipo = 'Entrenamiento';
    afterTipo = withoutYear.replace('shirt-entrenamiento-', '');
  }

  // El slug del equipo es lo que queda
  const teamSlug = afterTipo;
  const team = TEAM_MAP[teamSlug] || teamSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return { team, year, tipo, teamSlug };
}

function generateDesc(team, year, tipo) {
  const tipoStr = tipo === 'Local' ? 'local' : tipo === 'Visitante' ? 'visitante' : tipo.toLowerCase();
  return `Camiseta ${tipoStr} de ${team} de ${year}.`;
}

// Leer shirts.json actual
const existingShirts = JSON.parse(readFileSync(SHIRTS_PATH, 'utf8'));
const existingIds = new Set(existingShirts.map(s => s.id));
let nextId = Math.max(...existingShirts.map(s => s.id)) + 1;

// Leer archivos no numéricos de la carpeta
const allFiles = readdirSync(SHIRTS_DIR);
const newFiles = allFiles.filter(f => !/^\d+\.(jpg|png|webp)$/i.test(f) && /\.(jpg|png|webp)$/i.test(f));

console.log(`Archivos nuevos encontrados: ${newFiles.length}`);
console.log(`Siguiente ID: ${nextId}\n`);

const newShirts = [];
const skipped = [];

for (const filename of newFiles.sort()) {
  const parsed = parseFilename(filename);
  if (!parsed) {
    skipped.push(filename);
    continue;
  }

  const { team, year, tipo } = parsed;
  const id = nextId++;
  const ext = extname(filename);
  const newFilename = `${id}${ext}`;

  // Copiar/renombrar
  copyFileSync(join(SHIRTS_DIR, filename), join(SHIRTS_DIR, newFilename));

  const entry = {
    id,
    team,
    year,
    color: tipo,
    desc: generateDesc(team, year, tipo),
    filename,
    image: `/shirts/${newFilename}`,
    original_image: `/shirts/${newFilename}`,
  };

  newShirts.push(entry);
  console.log(`[${id}] ${team} ${year} (${tipo}) → ${newFilename}`);
}

// Guardar shirts.json actualizado
const allShirts = [...existingShirts, ...newShirts].sort((a, b) => a.id - b.id);
writeFileSync(SHIRTS_PATH, `${JSON.stringify(allShirts, null, 2)}\n`);

console.log(`\n✅ Añadidas: ${newShirts.length} camisetas`);
console.log(`   Total: ${allShirts.length}`);
if (skipped.length) console.warn(`   Sin parsear: ${skipped.join(', ')}`);
