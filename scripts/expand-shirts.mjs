#!/usr/bin/env node
/**
 * Expande shirts.json a ~50 camisetas por modo (easy/medium/hard).
 * 1) Visita cada página FKA con Playwright para obtener la URL CDN de la imagen
 * 2) Descarga la imagen a /public/shirts/<id>.jpg
 * 3) Actualiza fka-quiz-mapping.json, fka-cdn-urls.json y shirts.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SHIRTS_PATH = join(ROOT, 'src/data/shirts.json');
const MAPPING_PATH = join(__dirname, 'fka-quiz-mapping.json');
const CDN_PATH = join(__dirname, 'fka-cdn-urls.json');
const SHIRTS_DIR = join(ROOT, 'public/shirts');

// ============================================================
// NUEVAS CAMISETAS — ~26 easy + 36 medium + 38 hard extra
// (completamos hasta ~50 por modo)
// ============================================================
const NEW_ENTRIES = [
  // ── EASY (≥1994) — necesitamos 26 más ──────────────────────
  { id: 51, page: 'https://www.footballkitarchive.com/spain-1994-home-kit-5294/', team: 'España', year: 1994, color: 'Rojo', desc: 'Camiseta roja con cuello polo de la Roja en el primer mundial norteamericano.' },
  { id: 52, page: 'https://www.footballkitarchive.com/italy-1994-home-kit-32029/', team: 'Italia', year: 1994, color: 'Azul', desc: 'Camiseta azzurra finalista en Estados Unidos, la de Baggio y su penalti.' },
  { id: 53, page: 'https://www.footballkitarchive.com/netherlands-1994-home-kit-65643/', team: 'Países Bajos', year: 1994, color: 'Naranja', desc: 'Camiseta naranja de Holanda con diseño abstracto en USA 94.' },
  { id: 54, page: 'https://www.footballkitarchive.com/nigeria-1994-home-kit-65655/', team: 'Nigeria', year: 1994, color: 'Verde', desc: 'Icónica camiseta verde de las Súper Águilas en su primera Copa del Mundo.' },
  { id: 55, page: 'https://www.footballkitarchive.com/france-1998-home-kit-4738/', team: 'Francia', year: 1998, color: 'Azul', desc: 'Camiseta azul de los campeones del mundo en casa, con Zidane y Thuram.' },
  { id: 56, page: 'https://www.footballkitarchive.com/nigeria-1998-home-kit-65656/', team: 'Nigeria', year: 1998, color: 'Verde', desc: 'Camiseta verde futurista con patrón aguila de Adidas en Francia 98.' },
  { id: 57, page: 'https://www.footballkitarchive.com/cameroon-2002-home-kit-5430/', team: 'Camerún', year: 2002, color: 'Verde', desc: 'Polémica camiseta sin mangas de Camerún censurada por la FIFA en Corea/Japón.' },
  { id: 58, page: 'https://www.footballkitarchive.com/senegal-2002-home-kit-5268/', team: 'Senegal', year: 2002, color: 'Blanco', desc: 'Camiseta blanca del sorprendente cuartofinalista africano en su debut mundial.' },
  { id: 59, page: 'https://www.footballkitarchive.com/south-korea-2002-home-kit-5319/', team: 'Corea del Sur', year: 2002, color: 'Rojo', desc: 'Camiseta roja del histórico semifinalista asiático en el mundial anfitrión.' },
  { id: 60, page: 'https://www.footballkitarchive.com/spain-2002-home-kit-5298/', team: 'España', year: 2002, color: 'Rojo', desc: 'Camiseta roja de España con cuello redondo y escudo bordado en Corea/Japón.' },
  { id: 61, page: 'https://www.footballkitarchive.com/netherlands-1998-home-kit-65644/', team: 'Países Bajos', year: 1998, color: 'Naranja', desc: 'Camiseta naranja de Holanda con el icónico patrón de ola de Nike en Francia.' },
  { id: 62, page: 'https://www.footballkitarchive.com/brazil-2006-home-kit-8224/', team: 'Brasil', year: 2006, color: 'Amarillo', desc: 'Camiseta amarilla clásica de Ronaldinho y Ronaldo en Alemania 2006.' },
  { id: 63, page: 'https://www.footballkitarchive.com/italy-2006-home-kit-32022/', team: 'Italia', year: 2006, color: 'Azul', desc: 'Camiseta azzurra campeona del mundo en Alemania, la de Cannavaro y Buffon.' },
  { id: 64, page: 'https://www.footballkitarchive.com/spain-2010-home-kit-5303/', team: 'España', year: 2010, color: 'Rojo', desc: 'Camiseta roja campeona del mundo en Sudáfrica, la de Iniesta y del Bosque.' },
  { id: 65, page: 'https://www.footballkitarchive.com/netherlands-2010-home-kit-65641/', team: 'Países Bajos', year: 2010, color: 'Naranja', desc: 'Camiseta naranja del subcampeón de Sudáfrica, la de Robben y Van Persie.' },
  { id: 66, page: 'https://www.footballkitarchive.com/brazil-2010-home-kit-8225/', team: 'Brasil', year: 2010, color: 'Amarillo', desc: 'Camiseta amarilla de Brasil en Sudáfrica con el escudo nuevo en el pecho.' },
  { id: 67, page: 'https://www.footballkitarchive.com/argentina-2014-home-kit-4865/', team: 'Argentina', year: 2014, color: 'Celeste/Blanco', desc: 'Camiseta de rayas celestes y blancas del subcampeón de Brasil, con Messi.' },
  { id: 68, page: 'https://www.footballkitarchive.com/brazil-2014-home-kit-8226/', team: 'Brasil', year: 2014, color: 'Amarillo', desc: 'Camiseta amarilla del anfitrión del desastre 1-7 contra Alemania.' },
  { id: 69, page: 'https://www.footballkitarchive.com/france-2014-home-kit-4731/', team: 'Francia', year: 2014, color: 'Azul', desc: 'Camiseta azul Nike de Francia con mangas más oscuras en Brasil 2014.' },
  { id: 70, page: 'https://www.footballkitarchive.com/colombia-2014-home-kit-5381/', team: 'Colombia', year: 2014, color: 'Amarillo', desc: 'Camiseta amarilla con diagonal tricolor, la de James Rodríguez Bota de Oro.' },
  { id: 71, page: 'https://www.footballkitarchive.com/belgium-2018-home-kit-4937/', team: 'Bélgica', year: 2018, color: 'Rojo', desc: 'Camiseta roja del tercer clasificado en Rusia con De Bruyne y Hazard.' },
  { id: 72, page: 'https://www.footballkitarchive.com/england-2018-home-kit-4808/', team: 'Inglaterra', year: 2018, color: 'Blanco', desc: 'Camiseta blanca Nike de los leones en Rusia 2018, cuartofinalistas con Kane.' },
  { id: 73, page: 'https://www.footballkitarchive.com/argentina-2022-away-kit-61773/', team: 'Argentina', year: 2022, color: 'Morado', desc: 'Camiseta visitante morada de la Albiceleste campeona del mundo en Qatar.' },
  { id: 74, page: 'https://www.footballkitarchive.com/france-2022-home-kit-61748/', team: 'Francia', year: 2022, color: 'Azul', desc: 'Camiseta azul del subcampeón de Qatar, con Mbappé como Bota de Oro.' },
  { id: 75, page: 'https://www.footballkitarchive.com/morocco-2022-home-kit-61791/', team: 'Marruecos', year: 2022, color: 'Rojo', desc: 'Camiseta roja del histórico semifinalista africano en Qatar 2022.' },
  { id: 76, page: 'https://www.footballkitarchive.com/brazil-2022-home-kit-61745/', team: 'Brasil', year: 2022, color: 'Amarillo', desc: 'Camiseta amarilla de Brasil en Qatar 2022, eliminado en cuartos por Croacia.' },

  // ── MEDIUM (1974-1993) — necesitamos 36 más ─────────────────
  { id: 77, page: 'https://www.footballkitarchive.com/italy-1982-home-kit-32027/', team: 'Italia', year: 1982, color: 'Azul', desc: 'Camiseta azzurra campeona en España, la del tricampeonato de Rossi y Zoff.' },
  { id: 78, page: 'https://www.footballkitarchive.com/germany-1982-home-kit-4493/', team: 'Alemania Federal', year: 1982, color: 'Blanco', desc: 'Camiseta blanca con rayas tricolores del subcampeón germano en España.' },
  { id: 79, page: 'https://www.footballkitarchive.com/spain-1982-home-kit-5285/', team: 'España', year: 1982, color: 'Rojo', desc: 'Camiseta roja del anfitrión en el Mundial de España con Zamora y Arconada.' },
  { id: 80, page: 'https://www.footballkitarchive.com/england-1982-home-kit-4821/', team: 'Inglaterra', year: 1982, color: 'Blanco', desc: 'Camiseta blanca Admiral de Inglaterra en el mundial español de Keegan.' },
  { id: 81, page: 'https://www.footballkitarchive.com/algeria-1982-home-kit-5397/', team: 'Argelia', year: 1982, color: 'Verde/Blanco', desc: 'Camiseta histórica de la sorpresa africana que derrotó a Alemania en España.' },
  { id: 82, page: 'https://www.footballkitarchive.com/mexico-1986-home-kit-7787/', team: 'México', year: 1986, color: 'Verde', desc: 'Camiseta verde del anfitrión mexicano con la mano de Dios de Maradona.' },
  { id: 83, page: 'https://www.footballkitarchive.com/germany-1986-home-kit-4488/', team: 'Alemania Federal', year: 1986, color: 'Blanco', desc: 'Camiseta blanca del subcampeón germano en México 86, con Rummenigge.' },
  { id: 84, page: 'https://www.footballkitarchive.com/france-1986-home-kit-4743/', team: 'Francia', year: 1986, color: 'Azul', desc: 'Camiseta azul del tercer clasificado francés en México, con Platini.' },
  { id: 85, page: 'https://www.footballkitarchive.com/denmark-1986-home-kit-4980/', team: 'Dinamarca', year: 1986, color: 'Rojo', desc: 'Camiseta roja del histórico equipo danés de Hummel con el diseño icónico.' },
  { id: 86, page: 'https://www.footballkitarchive.com/brazil-1986-home-kit-31032/', team: 'Brasil', year: 1986, color: 'Amarillo', desc: 'Camiseta amarilla del Brasil de Sócrates y Zico eliminado por Francia.' },
  { id: 87, page: 'https://www.footballkitarchive.com/soviet-union-1986-home-kit-5335/', team: 'URSS', year: 1986, color: 'Rojo', desc: 'Camiseta roja de la Unión Soviética en el último mundial comunista.' },
  { id: 88, page: 'https://www.footballkitarchive.com/italy-1986-home-kit-32028/', team: 'Italia', year: 1986, color: 'Azul', desc: 'Camiseta azzurra de la defensa del título italiano en México 86.' },
  { id: 89, page: 'https://www.footballkitarchive.com/italy-1990-home-kit-32024/', team: 'Italia', year: 1990, color: 'Azul', desc: 'Camiseta azzurra del anfitrión en Italia 90, la del tercer puesto de Schillaci.' },
  { id: 90, page: 'https://www.footballkitarchive.com/argentina-1990-home-kit-4888/', team: 'Argentina', year: 1990, color: 'Celeste/Blanco', desc: 'Camiseta celeste y blanca del subcampeón defensor del título de Maradona.' },
  { id: 91, page: 'https://www.footballkitarchive.com/cameroon-1990-home-kit-5432/', team: 'Camerún', year: 1990, color: 'Verde', desc: 'Camiseta verde de los Leones Indomables, la del histórico cuarto Roger Milla.' },
  { id: 92, page: 'https://www.footballkitarchive.com/brazil-1990-home-kit-31033/', team: 'Brasil', year: 1990, color: 'Amarillo', desc: 'Camiseta amarilla del Brasil de Umbro en Italia, eliminado por Argentina.' },
  { id: 93, page: 'https://www.footballkitarchive.com/spain-1990-home-kit-5290/', team: 'España', year: 1990, color: 'Rojo', desc: 'Camiseta roja con detalles de la bandera de España en el mundial italiano.' },
  { id: 94, page: 'https://www.footballkitarchive.com/netherlands-1990-home-kit-65642/', team: 'Países Bajos', year: 1990, color: 'Naranja', desc: 'Camiseta naranja de Holanda en Italia 90, la de Gullit, Rijkaard y Van Basten.' },
  { id: 95, page: 'https://www.footballkitarchive.com/yugoslavia-1990-home-kit-86149/', team: 'Yugoslavia', year: 1990, color: 'Azul', desc: 'Camiseta azul de Yugoslavia con Savicevic y Prosinecki antes de la guerra.' },
  { id: 96, page: 'https://www.footballkitarchive.com/brazil-1978-home-kit-31031/', team: 'Brasil', year: 1978, color: 'Amarillo', desc: 'Camiseta amarilla de Zico y la Canarinha en Argentina, tercer clasificado.' },
  { id: 97, page: 'https://www.footballkitarchive.com/netherlands-1978-home-kit-65645/', team: 'Países Bajos', year: 1978, color: 'Naranja', desc: 'Camiseta naranja del subcampeón de Argentina con Rensenbrink y Rep.' },
  { id: 98, page: 'https://www.footballkitarchive.com/italy-1978-home-kit-32030/', team: 'Italia', year: 1978, color: 'Azul', desc: 'Camiseta azzurra del cuarto clasificado en Argentina 78.' },
  { id: 99, page: 'https://www.footballkitarchive.com/peru-1978-home-kit-65657/', team: 'Perú', year: 1978, color: 'Blanco/Rojo', desc: 'Camiseta blanca con faja roja en diagonal de la selección peruana en Argentina.' },
  { id: 100, page: 'https://www.footballkitarchive.com/west-germany-1978-home-kit-4496/', team: 'Alemania Federal', year: 1978, color: 'Blanco', desc: 'Camiseta blanca del campeón defensor en Argentina 78, con Sepp Maier.' },
  { id: 101, page: 'https://www.footballkitarchive.com/scotland-1978-home-kit-5280/', team: 'Escocia', year: 1978, color: 'Azul', desc: 'Camiseta azul oscuro de la selección escocesa en Argentina 78.' },
  { id: 102, page: 'https://www.footballkitarchive.com/iran-1978-home-kit-5457/', team: 'Irán', year: 1978, color: 'Verde', desc: 'Camiseta verde con sol persa del debut iraní en su único mundial hasta entonces.' },
  { id: 103, page: 'https://www.footballkitarchive.com/hungary-1982-home-kit-5453/', team: 'Hungría', year: 1982, color: 'Rojo', desc: 'Camiseta roja de Hungría con la que se clasificó para el mundial de España.' },
  { id: 104, page: 'https://www.footballkitarchive.com/scotland-1982-home-kit-5276/', team: 'Escocia', year: 1982, color: 'Azul', desc: 'Camiseta azul oscuro de Escocia en el mundial español.' },
  { id: 105, page: 'https://www.footballkitarchive.com/northern-ireland-1982-home-kit-65651/', team: 'Irlanda del Norte', year: 1982, color: 'Verde', desc: 'Camiseta verde de Irlanda del Norte, cuartofinalista sorpresa en España 82.' },
  { id: 106, page: 'https://www.footballkitarchive.com/soviet-union-1982-home-kit-5336/', team: 'URSS', year: 1982, color: 'Rojo', desc: 'Camiseta roja soviética con detalles dorados en el mundial español.' },
  { id: 107, page: 'https://www.footballkitarchive.com/denmark-1986-away-kit-4981/', team: 'Dinamarca', year: 1986, color: 'Blanco', desc: 'Camiseta visitante blanca del equipo danés de Hummel de México 86.' },
  { id: 108, page: 'https://www.footballkitarchive.com/morocco-1986-home-kit-5399/', team: 'Marruecos', year: 1986, color: 'Verde', desc: 'Camiseta verde del histórico primer clasificado africano de la fase de grupos.' },
  { id: 109, page: 'https://www.footballkitarchive.com/republic-of-ireland-1990-home-kit-86133/', team: 'Irlanda', year: 1990, color: 'Verde', desc: 'Camiseta verde de Irlanda en su debut mundialista en Italia 90, con Charlton.' },
  { id: 110, page: 'https://www.footballkitarchive.com/costa-rica-1990-home-kit-5406/', team: 'Costa Rica', year: 1990, color: 'Rojo/Azul', desc: 'Camiseta de la sorpresa costarricense en Italia 90, clasificada en su debut.' },
  { id: 111, page: 'https://www.footballkitarchive.com/south-korea-1986-home-kit-5321/', team: 'Corea del Sur', year: 1986, color: 'Rojo', desc: 'Camiseta roja de Corea del Sur en su segunda aparición mundialista en México.' },
  { id: 112, page: 'https://www.footballkitarchive.com/sweden-1974-home-kit-5348/', team: 'Suecia', year: 1974, color: 'Amarillo/Azul', desc: 'Camiseta amarilla con mangas azules de Suecia, tercer clasificado en Alemania.' },

  // ── HARD (<1974) — necesitamos 38 más ──────────────────────
  { id: 113, page: 'https://www.footballkitarchive.com/brazil-1962-home-kit-31997/', team: 'Brasil', year: 1962, color: 'Amarillo', desc: 'Camiseta amarilla del bicampeón en Chile, sin Pelé lesionado pero con Garrincha.' },
  { id: 114, page: 'https://www.footballkitarchive.com/czechoslovakia-1962-home-kit-65658/', team: 'Checoslovaquia', year: 1962, color: 'Rojo', desc: 'Camiseta roja del subcampeón en Chile, donde se enfrentó al Brasil de Garrincha.' },
  { id: 115, page: 'https://www.footballkitarchive.com/chile-1962-home-kit-5407/', team: 'Chile', year: 1962, color: 'Rojo/Azul', desc: 'Camiseta del anfitrión chileno que logró el tercer puesto en su propio mundial.' },
  { id: 116, page: 'https://www.footballkitarchive.com/england-1966-home-kit-4823/', team: 'Inglaterra', year: 1966, color: 'Blanco', desc: 'Camiseta blanca con la que Inglaterra ganó la Copa del Mundo en Wembley.' },
  { id: 117, page: 'https://www.footballkitarchive.com/germany-1966-home-kit-4692/', team: 'Alemania Federal', year: 1966, color: 'Blanco', desc: 'Camiseta blanca del subcampeón germano que cayó ante Inglaterra en Wembley.' },
  { id: 118, page: 'https://www.footballkitarchive.com/portugal-1966-home-kit-5142/', team: 'Portugal', year: 1966, color: 'Rojo', desc: 'Camiseta roja del histórico tercer puesto de Eusébio y su Bota de Oro.' },
  { id: 119, page: 'https://www.footballkitarchive.com/soviet-union-1966-home-kit-5340/', team: 'URSS', year: 1966, color: 'Rojo', desc: 'Camiseta roja soviética del cuartofinalista con el portero Lev Yashin.' },
  { id: 120, page: 'https://www.footballkitarchive.com/brazil-1966-home-kit-31998/', team: 'Brasil', year: 1966, color: 'Amarillo', desc: 'Camiseta amarilla del Brasil eliminado en la fase de grupos pese a tener a Pelé.' },
  { id: 121, page: 'https://www.footballkitarchive.com/north-korea-1966-home-kit-65659/', team: 'Corea del Norte', year: 1966, color: 'Rojo', desc: 'Camiseta roja del histórico Corea del Norte que eliminó a Italia en 1966.' },
  { id: 122, page: 'https://www.footballkitarchive.com/brazil-1970-away-kit-31999/', team: 'Brasil', year: 1970, color: 'Azul', desc: 'Camiseta azul visitante del tricampeón, con Pelé y Jairzinho en México.' },
  { id: 123, page: 'https://www.footballkitarchive.com/italy-1970-home-kit-32031/', team: 'Italia', year: 1970, color: 'Azul', desc: 'Camiseta azzurra del subcampeón en México, con Rivera y el gol de Boninsegna.' },
  { id: 124, page: 'https://www.footballkitarchive.com/germany-1970-home-kit-4689/', team: 'Alemania Federal', year: 1970, color: 'Blanco', desc: 'Camiseta blanca del tercer puesto alemán en México, la del partido del siglo.' },
  { id: 125, page: 'https://www.footballkitarchive.com/uruguay-1970-home-kit-86139/', team: 'Uruguay', year: 1970, color: 'Celeste', desc: 'Camiseta celeste del cuartofinalista uruguayo en el México de 1970.' },
  { id: 126, page: 'https://www.footballkitarchive.com/england-1970-home-kit-4825/', team: 'Inglaterra', year: 1970, color: 'Blanco', desc: 'Camiseta blanca de la defensa del título inglés en México, eliminada por Alemania.' },
  { id: 127, page: 'https://www.footballkitarchive.com/peru-1970-home-kit-65661/', team: 'Perú', year: 1970, color: 'Blanco/Rojo', desc: 'Camiseta blanca con faja diagonal roja del cuartofinalista peruano de Teófilo Cubillas.' },
  { id: 128, page: 'https://www.footballkitarchive.com/brazil-1958-home-kit-31996/', team: 'Brasil', year: 1958, color: 'Amarillo', desc: 'Camiseta amarilla del primer campeonato brasileño con el joven Pelé en Suecia.' },
  { id: 129, page: 'https://www.footballkitarchive.com/sweden-1958-home-kit-5350/', team: 'Suecia', year: 1958, color: 'Amarillo', desc: 'Camiseta amarilla del anfitrión sueco que llegó a la final ante Brasil.' },
  { id: 130, page: 'https://www.footballkitarchive.com/france-1958-home-kit-4745/', team: 'Francia', year: 1958, color: 'Azul', desc: 'Camiseta azul del tercer puesto francés de Just Fontaine con 13 goles.' },
  { id: 131, page: 'https://www.footballkitarchive.com/germany-1958-home-kit-4693/', team: 'Alemania Federal', year: 1958, color: 'Blanco', desc: 'Camiseta blanca del cuartofinalista defensor del título en Suecia.' },
  { id: 132, page: 'https://www.footballkitarchive.com/hungary-1954-home-kit-5455/', team: 'Hungría', year: 1954, color: 'Rojo', desc: 'Camiseta roja del imbatible equipo húngaro de Puskás que perdió la final ante Alemania.' },
  { id: 133, page: 'https://www.footballkitarchive.com/uruguay-1954-home-kit-86141/', team: 'Uruguay', year: 1954, color: 'Celeste', desc: 'Camiseta celeste del campeón vigente que cayó en semifinales ante Hungría.' },
  { id: 134, page: 'https://www.footballkitarchive.com/austria-1954-home-kit-86145/', team: 'Austria', year: 1954, color: 'Rojo/Blanco', desc: 'Camiseta del tercer puesto austríaco en el torneo más goleador de la historia.' },
  { id: 135, page: 'https://www.footballkitarchive.com/brazil-1954-away-kit-8213/', team: 'Brasil', year: 1954, color: 'Azul', desc: 'Camiseta azul visitante de Brasil en el mundial suizo donde cayó ante Hungría.' },
  { id: 136, page: 'https://www.footballkitarchive.com/germany-1954-away-kit-32190/', team: 'Alemania Federal', year: 1954, color: 'Negro', desc: 'Rara camiseta negra visitante del campeón del Milagro de Berna en Suiza.' },
  { id: 137, page: 'https://www.footballkitarchive.com/sweden-1950-home-kit-5352/', team: 'Suecia', year: 1950, color: 'Amarillo', desc: 'Camiseta amarilla del tercer clasificado sueco del mundial brasileño de 1950.' },
  { id: 138, page: 'https://www.footballkitarchive.com/uruguay-1950-home-kit-86140/', team: 'Uruguay', year: 1950, color: 'Celeste', desc: 'Camiseta celeste del histórico Maracanazo, campeón ante Brasil en el Maracaná.' },
  { id: 139, page: 'https://www.footballkitarchive.com/brazil-1966-away-kit-32000/', team: 'Brasil', year: 1966, color: 'Azul', desc: 'Camiseta azul visitante del Brasil de Pelé en el mundial inglés de 1966.' },
  { id: 140, page: 'https://www.footballkitarchive.com/mexico-1966-home-kit-7789/', team: 'México', year: 1966, color: 'Verde', desc: 'Camiseta verde de México en el mundial inglés de 1966.' },
  { id: 141, page: 'https://www.footballkitarchive.com/france-1966-home-kit-4746/', team: 'Francia', year: 1966, color: 'Azul', desc: 'Camiseta azul de Francia eliminada en la fase de grupos en Wembley 66.' },
  { id: 142, page: 'https://www.footballkitarchive.com/argentina-1966-home-kit-4893/', team: 'Argentina', year: 1966, color: 'Celeste/Blanco', desc: 'Camiseta de rayas celestes y blancas de Argentina en el mundial inglés.' },
  { id: 143, page: 'https://www.footballkitarchive.com/hungary-1966-home-kit-5454/', team: 'Hungría', year: 1966, color: 'Rojo', desc: 'Camiseta roja de Hungría que derrotó a Brasil en el mundial inglés.' },
  { id: 144, page: 'https://www.footballkitarchive.com/italy-1966-home-kit-32032/', team: 'Italia', year: 1966, color: 'Azul', desc: 'Camiseta azzurra eliminada vergonzosamente por Corea del Norte en 1966.' },
  { id: 145, page: 'https://www.footballkitarchive.com/chile-1966-home-kit-5408/', team: 'Chile', year: 1966, color: 'Rojo', desc: 'Camiseta roja de Chile en el mundial inglés de 1966.' },
  { id: 146, page: 'https://www.footballkitarchive.com/italy-1962-home-kit-32033/', team: 'Italia', year: 1962, color: 'Azul', desc: 'Camiseta azzurra eliminada en el polémico Partido de la Batalla de Santiago.' },
  { id: 147, page: 'https://www.footballkitarchive.com/argentina-1962-home-kit-4895/', team: 'Argentina', year: 1962, color: 'Celeste/Blanco', desc: 'Camiseta de rayas celestes y blancas de Argentina en Chile 1962.' },
  { id: 148, page: 'https://www.footballkitarchive.com/hungary-1962-home-kit-5456/', team: 'Hungría', year: 1962, color: 'Rojo', desc: 'Camiseta roja de Hungría cuartofinalista en el Chile de 1962.' },
  { id: 149, page: 'https://www.footballkitarchive.com/mexico-1962-home-kit-7791/', team: 'México', year: 1962, color: 'Verde', desc: 'Camiseta verde de México en el mundial chileno de 1962.' },
  { id: 150, page: 'https://www.footballkitarchive.com/spain-1966-home-kit-5294/', team: 'España', year: 1966, color: 'Rojo', desc: 'Camiseta roja de España eliminada en la fase de grupos del mundial inglés.' },
];

async function main() {
  const { chromium } = await import('playwright');

  // Cargar datos existentes
  const existingMapping = JSON.parse(readFileSync(MAPPING_PATH, 'utf8'));
  const existingCdn = JSON.parse(readFileSync(CDN_PATH, 'utf8'));
  const existingShirts = JSON.parse(readFileSync(SHIRTS_PATH, 'utf8'));

  const existingIds = new Set(existingShirts.map(s => s.id));

  mkdirSync(SHIRTS_DIR, { recursive: true });

  console.log(`\nIniciando Playwright...\n`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // Visitar la home para obtener cookies CF
  console.log('Obteniendo cookies de Cloudflare...');
  await page.goto('https://www.footballkitarchive.com/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(3000);

  const newShirts = [];
  const newMapping = [];
  const newCdn = {};

  const toProcess = NEW_ENTRIES.filter(e => !existingIds.has(e.id));
  console.log(`Procesando ${toProcess.length} camisetas nuevas...\n`);

  for (const entry of toProcess) {
    const destPath = join(SHIRTS_DIR, `${entry.id}.jpg`);

    // Si ya existe el archivo, saltar descarga pero añadir al mapping
    if (existsSync(destPath)) {
      console.log(`[${entry.id}] Ya existe localmente, añadiendo al JSON...`);
      newShirts.push({
        id: entry.id,
        team: entry.team,
        year: entry.year,
        color: entry.color,
        desc: entry.desc,
        filename: entry.page.match(/com\/([^/]+)\//)?.[1] + '.jpg' ?? `${entry.id}.jpg`,
        image: `/shirts/${entry.id}.jpg`,
        original_image: `/shirts/${entry.id}.jpg`,
      });
      newMapping.push(entry);
      newCdn[String(entry.id)] = `local:${destPath}`;
      continue;
    }

    try {
      console.log(`[${entry.id}] Visitando: ${entry.page}`);
      await page.goto(entry.page, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.waitForTimeout(2000);

      // Buscar la imagen principal de la camiseta
      const cdnUrl = await page.evaluate(() => {
        // Intentar encontrar la imagen principal del kit
        const selectors = [
          'img.kit-image',
          '.kit-main-image img',
          'img[src*="/cdn/"]',
          'article img[src*="footballkitarchive"]',
          'main img[src*="/cdn/"]',
          'img[class*="kit"]',
          '.entry-content img',
          'img[loading="lazy"][src*="footballkitarchive"]',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.src && el.src.includes('/cdn/')) return el.src;
        }
        // Fallback: primera imagen con /cdn/ en la página
        const allImgs = Array.from(document.querySelectorAll('img'));
        const cdnImg = allImgs.find(img => img.src && img.src.includes('/cdn/'));
        return cdnImg ? cdnImg.src : null;
      });

      if (!cdnUrl) {
        console.warn(`  ⚠️  Sin imagen CDN para id ${entry.id} — skipping`);
        continue;
      }

      console.log(`  CDN: ${cdnUrl}`);

      // Descargar imagen via fetch desde la página (para usar cookies CF)
      const bytes = await page.evaluate(async (url) => {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return [...new Uint8Array(await res.arrayBuffer())];
      }, cdnUrl);

      writeFileSync(destPath, Buffer.from(bytes));
      console.log(`  ✅ Guardado: ${entry.id}.jpg (${bytes.length} bytes)`);

      const slug = entry.page.match(/com\/([^/]+)\//)?.[1] ?? `fka-${entry.id}`;
      newShirts.push({
        id: entry.id,
        team: entry.team,
        year: entry.year,
        color: entry.color,
        desc: entry.desc,
        filename: `${slug}.jpg`,
        image: `/shirts/${entry.id}.jpg`,
        original_image: `/shirts/${entry.id}.jpg`,
      });
      newMapping.push(entry);
      newCdn[String(entry.id)] = cdnUrl;

      await page.waitForTimeout(800);

    } catch (err) {
      console.error(`  ❌ Error en id ${entry.id}: ${err.message}`);
    }
  }

  await browser.close();

  // Combinar y ordenar por id
  const allShirts = [...existingShirts, ...newShirts].sort((a, b) => a.id - b.id);
  const allMapping = [...existingMapping, ...newMapping].sort((a, b) => a.id - b.id);
  const allCdn = { ...existingCdn, ...newCdn };

  writeFileSync(SHIRTS_PATH, `${JSON.stringify(allShirts, null, 2)}\n`);
  writeFileSync(MAPPING_PATH, `${JSON.stringify(allMapping, null, 2)}\n`);
  writeFileSync(CDN_PATH, `${JSON.stringify(allCdn, null, 2)}\n`);

  // Resumen por modo
  const easy = allShirts.filter(s => s.year >= 1994).length;
  const medium = allShirts.filter(s => s.year >= 1974 && s.year < 1994).length;
  const hard = allShirts.filter(s => s.year < 1974).length;

  console.log(`\n✅ DONE — Total: ${allShirts.length} camisetas`);
  console.log(`   Easy  (≥1994): ${easy}`);
  console.log(`   Medium (1974-1993): ${medium}`);
  console.log(`   Hard  (<1974): ${hard}`);
  console.log(`   Nuevas añadidas: ${newShirts.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
