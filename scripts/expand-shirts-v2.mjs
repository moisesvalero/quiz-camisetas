#!/usr/bin/env node
/**
 * Estrategia: navegador visible (headless:false) para pasar CF challenge,
 * luego guarda cookies y las usa para el resto de descargas en headless.
 * 
 * Uso: node scripts/expand-shirts-v2.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SHIRTS_PATH = join(ROOT, 'src/data/shirts.json');
const MAPPING_PATH = join(__dirname, 'fka-quiz-mapping.json');
const CDN_PATH = join(__dirname, 'fka-cdn-urls.json');
const SHIRTS_DIR = join(ROOT, 'public/shirts');
const COOKIES_PATH = join(__dirname, 'fka-cookies.json');

const NEW_ENTRIES = [
  // EASY (≥1994)
  { id: 51, page: 'https://www.footballkitarchive.com/spain-1994-home-kit-5294/', team: 'España', year: 1994, color: 'Rojo', desc: 'Camiseta roja con cuello polo de la Roja en el primer mundial norteamericano.' },
  { id: 52, page: 'https://www.footballkitarchive.com/italy-1994-home-kit-32029/', team: 'Italia', year: 1994, color: 'Azul', desc: 'Camiseta azzurra finalista en Estados Unidos, la de Baggio y su penalti.' },
  { id: 53, page: 'https://www.footballkitarchive.com/netherlands-1994-home-kit-65643/', team: 'Países Bajos', year: 1994, color: 'Naranja', desc: 'Camiseta naranja de Holanda con diseño abstracto en USA 94.' },
  { id: 54, page: 'https://www.footballkitarchive.com/nigeria-1994-home-kit-65655/', team: 'Nigeria', year: 1994, color: 'Verde', desc: 'Icónica camiseta verde de las Súper Águilas en su primera Copa del Mundo.' },
  { id: 55, page: 'https://www.footballkitarchive.com/france-1998-home-kit-4738/', team: 'Francia', year: 1998, color: 'Azul', desc: 'Camiseta azul de los campeones del mundo en casa, con Zidane y Thuram.' },
  { id: 56, page: 'https://www.footballkitarchive.com/nigeria-1998-home-kit-65656/', team: 'Nigeria', year: 1998, color: 'Verde', desc: 'Camiseta verde futurista con patrón águila de Adidas en Francia 98.' },
  { id: 57, page: 'https://www.footballkitarchive.com/cameroon-2002-home-kit-5430/', team: 'Camerún', year: 2002, color: 'Verde', desc: 'Polémica camiseta sin mangas de Camerún censurada por la FIFA.' },
  { id: 58, page: 'https://www.footballkitarchive.com/senegal-2002-home-kit-5268/', team: 'Senegal', year: 2002, color: 'Blanco', desc: 'Camiseta blanca del sorprendente cuartofinalista africano en su debut mundial.' },
  { id: 59, page: 'https://www.footballkitarchive.com/south-korea-2002-home-kit-5319/', team: 'Corea del Sur', year: 2002, color: 'Rojo', desc: 'Camiseta roja del histórico semifinalista asiático en el mundial anfitrión.' },
  { id: 60, page: 'https://www.footballkitarchive.com/spain-2002-home-kit-5298/', team: 'España', year: 2002, color: 'Rojo', desc: 'Camiseta roja de España en Corea/Japón 2002.' },
  { id: 61, page: 'https://www.footballkitarchive.com/netherlands-1998-home-kit-65644/', team: 'Países Bajos', year: 1998, color: 'Naranja', desc: 'Camiseta naranja de Holanda con el icónico patrón de ola de Nike en Francia.' },
  { id: 62, page: 'https://www.footballkitarchive.com/brazil-2006-home-kit-8224/', team: 'Brasil', year: 2006, color: 'Amarillo', desc: 'Camiseta amarilla clásica de Ronaldinho y Ronaldo en Alemania 2006.' },
  { id: 63, page: 'https://www.footballkitarchive.com/italy-2006-home-kit-32022/', team: 'Italia', year: 2006, color: 'Azul', desc: 'Camiseta azzurra campeona del mundo en Alemania, la de Cannavaro y Buffon.' },
  { id: 64, page: 'https://www.footballkitarchive.com/spain-2010-home-kit-5303/', team: 'España', year: 2010, color: 'Rojo', desc: 'Camiseta roja campeona del mundo en Sudáfrica, la de Iniesta.' },
  { id: 65, page: 'https://www.footballkitarchive.com/netherlands-2010-home-kit-65641/', team: 'Países Bajos', year: 2010, color: 'Naranja', desc: 'Camiseta naranja del subcampeón de Sudáfrica, la de Robben.' },
  { id: 66, page: 'https://www.footballkitarchive.com/brazil-2010-home-kit-8225/', team: 'Brasil', year: 2010, color: 'Amarillo', desc: 'Camiseta amarilla de Brasil en Sudáfrica con el escudo nuevo en el pecho.' },
  { id: 67, page: 'https://www.footballkitarchive.com/argentina-2014-home-kit-4865/', team: 'Argentina', year: 2014, color: 'Celeste/Blanco', desc: 'Camiseta de rayas celestes y blancas del subcampeón de Brasil, con Messi.' },
  { id: 68, page: 'https://www.footballkitarchive.com/brazil-2014-home-kit-8226/', team: 'Brasil', year: 2014, color: 'Amarillo', desc: 'Camiseta amarilla del anfitrión del desastre 1-7 contra Alemania.' },
  { id: 69, page: 'https://www.footballkitarchive.com/france-2014-home-kit-4731/', team: 'Francia', year: 2014, color: 'Azul', desc: 'Camiseta azul Nike de Francia en Brasil 2014.' },
  { id: 70, page: 'https://www.footballkitarchive.com/colombia-2014-home-kit-5381/', team: 'Colombia', year: 2014, color: 'Amarillo', desc: 'Camiseta amarilla con diagonal tricolor, la de James Rodríguez Bota de Oro.' },
  { id: 71, page: 'https://www.footballkitarchive.com/belgium-2018-home-kit-4937/', team: 'Bélgica', year: 2018, color: 'Rojo', desc: 'Camiseta roja del tercer clasificado en Rusia con De Bruyne y Hazard.' },
  { id: 72, page: 'https://www.footballkitarchive.com/england-2018-home-kit-4808/', team: 'Inglaterra', year: 2018, color: 'Blanco', desc: 'Camiseta blanca Nike de los leones en Rusia 2018, cuartofinalistas con Kane.' },
  { id: 73, page: 'https://www.footballkitarchive.com/argentina-2022-away-kit-61773/', team: 'Argentina', year: 2022, color: 'Morado', desc: 'Camiseta visitante morada de la Albiceleste campeona del mundo en Qatar.' },
  { id: 74, page: 'https://www.footballkitarchive.com/france-2022-home-kit-61748/', team: 'Francia', year: 2022, color: 'Azul', desc: 'Camiseta azul del subcampeón de Qatar, con Mbappé como Bota de Oro.' },
  { id: 75, page: 'https://www.footballkitarchive.com/morocco-2022-home-kit-61791/', team: 'Marruecos', year: 2022, color: 'Rojo', desc: 'Camiseta roja del histórico semifinalista africano en Qatar 2022.' },
  { id: 76, page: 'https://www.footballkitarchive.com/brazil-2022-home-kit-61745/', team: 'Brasil', year: 2022, color: 'Amarillo', desc: 'Camiseta amarilla de Brasil en Qatar 2022, eliminado en cuartos por Croacia.' },
  // MEDIUM (1974-1993)
  { id: 77, page: 'https://www.footballkitarchive.com/italy-1982-home-kit-32027/', team: 'Italia', year: 1982, color: 'Azul', desc: 'Camiseta azzurra campeona en España, la del tricampeonato de Rossi y Zoff.' },
  { id: 78, page: 'https://www.footballkitarchive.com/germany-1982-home-kit-4493/', team: 'Alemania Federal', year: 1982, color: 'Blanco', desc: 'Camiseta blanca del subcampeón germano en España.' },
  { id: 79, page: 'https://www.footballkitarchive.com/spain-1982-home-kit-5285/', team: 'España', year: 1982, color: 'Rojo', desc: 'Camiseta roja del anfitrión en el Mundial de España con Arconada.' },
  { id: 80, page: 'https://www.footballkitarchive.com/england-1982-home-kit-4821/', team: 'Inglaterra', year: 1982, color: 'Blanco', desc: 'Camiseta blanca Admiral de Inglaterra en el mundial español de Keegan.' },
  { id: 81, page: 'https://www.footballkitarchive.com/algeria-1982-home-kit-5397/', team: 'Argelia', year: 1982, color: 'Verde/Blanco', desc: 'Camiseta histórica de la sorpresa africana que derrotó a Alemania en España.' },
  { id: 82, page: 'https://www.footballkitarchive.com/mexico-1986-home-kit-7787/', team: 'México', year: 1986, color: 'Verde', desc: 'Camiseta verde del anfitrión mexicano en el mundial de la Mano de Dios.' },
  { id: 83, page: 'https://www.footballkitarchive.com/germany-1986-home-kit-4488/', team: 'Alemania Federal', year: 1986, color: 'Blanco', desc: 'Camiseta blanca del subcampeón germano en México 86, con Rummenigge.' },
  { id: 84, page: 'https://www.footballkitarchive.com/france-1986-home-kit-4743/', team: 'Francia', year: 1986, color: 'Azul', desc: 'Camiseta azul del tercer clasificado francés en México, con Platini.' },
  { id: 85, page: 'https://www.footballkitarchive.com/denmark-1986-home-kit-4980/', team: 'Dinamarca', year: 1986, color: 'Rojo', desc: 'Icónica camiseta roja del equipo danés de Hummel en México 86.' },
  { id: 86, page: 'https://www.footballkitarchive.com/brazil-1986-home-kit-31032/', team: 'Brasil', year: 1986, color: 'Amarillo', desc: 'Camiseta amarilla del Brasil de Sócrates y Zico eliminado por Francia.' },
  { id: 87, page: 'https://www.footballkitarchive.com/soviet-union-1986-home-kit-5335/', team: 'URSS', year: 1986, color: 'Rojo', desc: 'Camiseta roja de la Unión Soviética en el último mundial de la era soviética.' },
  { id: 88, page: 'https://www.footballkitarchive.com/italy-1986-home-kit-32028/', team: 'Italia', year: 1986, color: 'Azul', desc: 'Camiseta azzurra de la defensa del título italiano en México 86.' },
  { id: 89, page: 'https://www.footballkitarchive.com/italy-1990-home-kit-32024/', team: 'Italia', year: 1990, color: 'Azul', desc: 'Camiseta azzurra del anfitrión en Italia 90, la del tercer puesto de Schillaci.' },
  { id: 90, page: 'https://www.footballkitarchive.com/argentina-1990-home-kit-4888/', team: 'Argentina', year: 1990, color: 'Celeste/Blanco', desc: 'Camiseta del subcampeón defensor del título de Maradona en Italia 90.' },
  { id: 91, page: 'https://www.footballkitarchive.com/cameroon-1990-home-kit-5432/', team: 'Camerún', year: 1990, color: 'Verde', desc: 'Camiseta verde de los Leones Indomables, la del histórico cuarto Roger Milla.' },
  { id: 92, page: 'https://www.footballkitarchive.com/brazil-1990-home-kit-31033/', team: 'Brasil', year: 1990, color: 'Amarillo', desc: 'Camiseta amarilla del Brasil de Umbro en Italia, eliminado por Argentina.' },
  { id: 93, page: 'https://www.footballkitarchive.com/spain-1990-home-kit-5290/', team: 'España', year: 1990, color: 'Rojo', desc: 'Camiseta roja de España en el mundial italiano de 1990.' },
  { id: 94, page: 'https://www.footballkitarchive.com/netherlands-1990-home-kit-65642/', team: 'Países Bajos', year: 1990, color: 'Naranja', desc: 'Camiseta naranja de Holanda en Italia 90, la de Gullit, Rijkaard y Van Basten.' },
  { id: 95, page: 'https://www.footballkitarchive.com/brazil-1978-home-kit-31031/', team: 'Brasil', year: 1978, color: 'Amarillo', desc: 'Camiseta amarilla de Zico y la Canarinha en Argentina, tercer clasificado.' },
  { id: 96, page: 'https://www.footballkitarchive.com/netherlands-1978-home-kit-65645/', team: 'Países Bajos', year: 1978, color: 'Naranja', desc: 'Camiseta naranja del subcampeón de Argentina con Rensenbrink y Rep.' },
  { id: 97, page: 'https://www.footballkitarchive.com/italy-1978-home-kit-32030/', team: 'Italia', year: 1978, color: 'Azul', desc: 'Camiseta azzurra del cuarto clasificado en Argentina 78.' },
  { id: 98, page: 'https://www.footballkitarchive.com/peru-1978-home-kit-65657/', team: 'Perú', year: 1978, color: 'Blanco/Rojo', desc: 'Camiseta blanca con faja roja en diagonal de la selección peruana en Argentina.' },
  { id: 99, page: 'https://www.footballkitarchive.com/scotland-1978-home-kit-5280/', team: 'Escocia', year: 1978, color: 'Azul', desc: 'Camiseta azul oscuro de la selección escocesa en Argentina 78.' },
  { id: 100, page: 'https://www.footballkitarchive.com/iran-1978-home-kit-5457/', team: 'Irán', year: 1978, color: 'Verde', desc: 'Camiseta verde del debut iraní en su primer mundial, Argentina 78.' },
  { id: 101, page: 'https://www.footballkitarchive.com/morocco-1986-home-kit-5399/', team: 'Marruecos', year: 1986, color: 'Verde', desc: 'Camiseta verde del histórico Marruecos que pasó la fase de grupos en México 86.' },
  { id: 102, page: 'https://www.footballkitarchive.com/republic-of-ireland-1990-home-kit-86133/', team: 'Irlanda', year: 1990, color: 'Verde', desc: 'Camiseta verde de Irlanda en su debut mundialista en Italia 90, con Charlton.' },
  { id: 103, page: 'https://www.footballkitarchive.com/costa-rica-1990-home-kit-5406/', team: 'Costa Rica', year: 1990, color: 'Rojo/Azul', desc: 'Camiseta de la sorpresa costarricense en Italia 90.' },
  { id: 104, page: 'https://www.footballkitarchive.com/sweden-1974-home-kit-5348/', team: 'Suecia', year: 1974, color: 'Amarillo/Azul', desc: 'Camiseta amarilla con mangas azules de Suecia, tercer clasificado en Alemania 74.' },
  // HARD (<1974)
  { id: 105, page: 'https://www.footballkitarchive.com/brazil-1962-home-kit-31997/', team: 'Brasil', year: 1962, color: 'Amarillo', desc: 'Camiseta amarilla del bicampeón en Chile, sin Pelé pero con Garrincha.' },
  { id: 106, page: 'https://www.footballkitarchive.com/england-1966-home-kit-4823/', team: 'Inglaterra', year: 1966, color: 'Blanco', desc: 'Camiseta blanca con la que Inglaterra ganó la Copa del Mundo en Wembley.' },
  { id: 107, page: 'https://www.footballkitarchive.com/germany-1966-home-kit-4692/', team: 'Alemania Federal', year: 1966, color: 'Blanco', desc: 'Camiseta blanca del subcampeón germano que cayó ante Inglaterra en Wembley.' },
  { id: 108, page: 'https://www.footballkitarchive.com/portugal-1966-home-kit-5142/', team: 'Portugal', year: 1966, color: 'Rojo', desc: 'Camiseta roja del histórico tercer puesto de Eusébio y su Bota de Oro.' },
  { id: 109, page: 'https://www.footballkitarchive.com/brazil-1966-home-kit-31998/', team: 'Brasil', year: 1966, color: 'Amarillo', desc: 'Camiseta amarilla del Brasil eliminado pese a tener a Pelé.' },
  { id: 110, page: 'https://www.footballkitarchive.com/brazil-1970-away-kit-31999/', team: 'Brasil', year: 1970, color: 'Azul', desc: 'Camiseta azul visitante del tricampeón, con Pelé y Jairzinho en México.' },
  { id: 111, page: 'https://www.footballkitarchive.com/italy-1970-home-kit-32031/', team: 'Italia', year: 1970, color: 'Azul', desc: 'Camiseta azzurra del subcampeón en México, con Rivera.' },
  { id: 112, page: 'https://www.footballkitarchive.com/germany-1970-home-kit-4689/', team: 'Alemania Federal', year: 1970, color: 'Blanco', desc: 'Camiseta blanca del tercer puesto alemán en México, la del partido del siglo.' },
  { id: 113, page: 'https://www.footballkitarchive.com/uruguay-1970-home-kit-86139/', team: 'Uruguay', year: 1970, color: 'Celeste', desc: 'Camiseta celeste del cuartofinalista uruguayo en México 1970.' },
  { id: 114, page: 'https://www.footballkitarchive.com/england-1970-home-kit-4825/', team: 'Inglaterra', year: 1970, color: 'Blanco', desc: 'Camiseta blanca de la defensa del título inglés en México, eliminada por Alemania.' },
  { id: 115, page: 'https://www.footballkitarchive.com/peru-1970-home-kit-65661/', team: 'Perú', year: 1970, color: 'Blanco/Rojo', desc: 'Camiseta blanca con faja diagonal roja del cuartofinalista peruano de Cubillas.' },
  { id: 116, page: 'https://www.footballkitarchive.com/brazil-1958-home-kit-31996/', team: 'Brasil', year: 1958, color: 'Amarillo', desc: 'Camiseta amarilla del primer campeonato brasileño con el joven Pelé en Suecia.' },
  { id: 117, page: 'https://www.footballkitarchive.com/sweden-1958-home-kit-5350/', team: 'Suecia', year: 1958, color: 'Amarillo', desc: 'Camiseta amarilla del anfitrión sueco que llegó a la final ante Brasil.' },
  { id: 118, page: 'https://www.footballkitarchive.com/france-1958-home-kit-4745/', team: 'Francia', year: 1958, color: 'Azul', desc: 'Camiseta azul del tercer puesto francés de Just Fontaine con 13 goles.' },
  { id: 119, page: 'https://www.footballkitarchive.com/hungary-1954-home-kit-5455/', team: 'Hungría', year: 1954, color: 'Rojo', desc: 'Camiseta roja del imbatible equipo húngaro de Puskás que perdió la final.' },
  { id: 120, page: 'https://www.footballkitarchive.com/uruguay-1954-home-kit-86141/', team: 'Uruguay', year: 1954, color: 'Celeste', desc: 'Camiseta celeste del campeón vigente que cayó en semifinales ante Hungría.' },
  { id: 121, page: 'https://www.footballkitarchive.com/austria-1954-home-kit-86145/', team: 'Austria', year: 1954, color: 'Rojo/Blanco', desc: 'Camiseta del tercer puesto austríaco en el torneo más goleador de la historia.' },
  { id: 122, page: 'https://www.footballkitarchive.com/uruguay-1950-home-kit-86140/', team: 'Uruguay', year: 1950, color: 'Celeste', desc: 'Camiseta celeste del histórico Maracanazo, campeón ante Brasil en el Maracaná.' },
  { id: 123, page: 'https://www.footballkitarchive.com/sweden-1950-home-kit-5352/', team: 'Suecia', year: 1950, color: 'Amarillo', desc: 'Camiseta amarilla del tercer clasificado sueco del mundial brasileño de 1950.' },
];

async function getCookies() {
  // Navegador VISIBLE para pasar el challenge de CF
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  console.log('Abriendo navegador VISIBLE para pasar CF challenge...');
  await page.goto('https://www.footballkitarchive.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  // Esperar a que CF challenge se resuelva (hasta 20s)
  for (let i = 0; i < 20; i++) {
    const title = await page.title();
    if (!title.includes('Just a moment') && !title.includes('Checking')) break;
    await page.waitForTimeout(1000);
  }
  const cookies = await context.cookies();
  await browser.close();
  return cookies;
}

async function downloadWithCookies(cookies) {
  const existingMapping = JSON.parse(readFileSync(MAPPING_PATH, 'utf8'));
  const existingCdn = JSON.parse(readFileSync(CDN_PATH, 'utf8'));
  const existingShirts = JSON.parse(readFileSync(SHIRTS_PATH, 'utf8'));
  const existingIds = new Set(existingShirts.map(s => s.id));

  mkdirSync(SHIRTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  });
  // Inyectar cookies de CF
  await context.addCookies(cookies);
  const page = await context.newPage();

  const newShirts = [];
  const newMapping = [];
  const newCdn = {};

  const toProcess = NEW_ENTRIES.filter(e => !existingIds.has(e.id));
  console.log(`\nProcesando ${toProcess.length} camisetas...\n`);

  for (const entry of toProcess) {
    const destPath = join(SHIRTS_DIR, `${entry.id}.jpg`);
    if (existsSync(destPath)) {
      console.log(`[${entry.id}] Ya existe, skip descarga.`);
      newShirts.push({ id: entry.id, team: entry.team, year: entry.year, color: entry.color, desc: entry.desc,
        filename: `${entry.id}.jpg`, image: `/shirts/${entry.id}.jpg`, original_image: `/shirts/${entry.id}.jpg` });
      newMapping.push(entry);
      continue;
    }

    try {
      // Interceptar imágenes CDN durante la navegación
      const capturedCdn = [];
      const responseHandler = res => {
        const url = res.url();
        if (url.includes('footballkitarchive.com/cdn/') && !url.includes('challenge')) {
          capturedCdn.push(url);
        }
      };
      page.on('response', responseHandler);

      console.log(`[${entry.id}] ${entry.team} ${entry.year}...`);
      await page.goto(entry.page, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);

      // Scroll para activar lazy load
      await page.evaluate(() => window.scrollTo(0, 600));
      await page.waitForTimeout(1500);

      page.off('response', responseHandler);

      // Buscar URL CDN: primero en red, luego en DOM
      let cdnUrl = capturedCdn.find(u => u.match(/\.(jpg|png|webp)(\?|$)/i));

      if (!cdnUrl) {
        cdnUrl = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          const cdn = imgs.find(img => img.src && img.src.includes('footballkitarchive.com/cdn/'));
          return cdn ? cdn.src : null;
        });
      }

      // og:image como último recurso
      if (!cdnUrl) {
        cdnUrl = await page.evaluate(() => document.querySelector('meta[property="og:image"]')?.content || null);
      }

      if (!cdnUrl) {
        const title = await page.title();
        console.warn(`  ⚠️  Sin URL CDN (título: "${title}")`);
        continue;
      }

      // Descargar
      const bytes = await page.evaluate(async (url) => {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return [...new Uint8Array(await res.arrayBuffer())];
      }, cdnUrl);

      writeFileSync(destPath, Buffer.from(bytes));
      console.log(`  ✅ ${entry.id}.jpg (${(bytes.length / 1024).toFixed(0)}KB) — ${cdnUrl}`);

      const slug = entry.page.match(/com\/([^/]+)\//)?.[1] ?? `fka-${entry.id}`;
      newShirts.push({ id: entry.id, team: entry.team, year: entry.year, color: entry.color, desc: entry.desc,
        filename: `${slug}.jpg`, image: `/shirts/${entry.id}.jpg`, original_image: `/shirts/${entry.id}.jpg` });
      newMapping.push(entry);
      newCdn[String(entry.id)] = cdnUrl;

      await page.waitForTimeout(600);

    } catch (err) {
      console.error(`  ❌ [${entry.id}] ${err.message}`);
    }
  }

  await browser.close();

  // Guardar todo
  const allShirts = [...existingShirts, ...newShirts].sort((a, b) => a.id - b.id);
  const allMapping = [...existingMapping, ...newMapping].sort((a, b) => a.id - b.id);
  const allCdn = { ...existingCdn, ...newCdn };

  writeFileSync(SHIRTS_PATH, `${JSON.stringify(allShirts, null, 2)}\n`);
  writeFileSync(MAPPING_PATH, `${JSON.stringify(allMapping, null, 2)}\n`);
  writeFileSync(CDN_PATH, `${JSON.stringify(allCdn, null, 2)}\n`);

  const easy = allShirts.filter(s => s.year >= 1994).length;
  const medium = allShirts.filter(s => s.year >= 1974 && s.year < 1994).length;
  const hard = allShirts.filter(s => s.year < 1974).length;

  console.log(`\n✅ DONE — Total: ${allShirts.length}`);
  console.log(`   Easy  (≥1994): ${easy}`);
  console.log(`   Medium (1974-1993): ${medium}`);
  console.log(`   Hard  (<1974): ${hard}`);
  console.log(`   Nuevas: ${newShirts.length}`);
}

// Main
const cookies = await getCookies();
console.log(`Cookies obtenidas: ${cookies.length}`);
await downloadWithCookies(cookies);
