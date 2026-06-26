/**
 * INSTRUCCIONES:
 * 1. Abre https://www.footballkitarchive.com en tu navegador
 * 2. Abre la consola (F12 → Console)
 * 3. Pega TODO este script y pulsa Enter
 * 4. Espera ~3-4 minutos hasta que aparezca "LISTO"
 * 5. Se descargará automáticamente un archivo fka-new-cdn-urls.json
 */

const PAGES = [
  { id: 51, url: 'https://www.footballkitarchive.com/spain-1994-home-kit-5294/' },
  { id: 52, url: 'https://www.footballkitarchive.com/italy-1994-home-kit-32029/' },
  { id: 53, url: 'https://www.footballkitarchive.com/netherlands-1994-home-kit-65643/' },
  { id: 54, url: 'https://www.footballkitarchive.com/nigeria-1994-home-kit-65655/' },
  { id: 55, url: 'https://www.footballkitarchive.com/france-1998-home-kit-4738/' },
  { id: 56, url: 'https://www.footballkitarchive.com/nigeria-1998-home-kit-65656/' },
  { id: 57, url: 'https://www.footballkitarchive.com/cameroon-2002-home-kit-5430/' },
  { id: 58, url: 'https://www.footballkitarchive.com/senegal-2002-home-kit-5268/' },
  { id: 59, url: 'https://www.footballkitarchive.com/south-korea-2002-home-kit-5319/' },
  { id: 60, url: 'https://www.footballkitarchive.com/spain-2002-home-kit-5298/' },
  { id: 61, url: 'https://www.footballkitarchive.com/netherlands-1998-home-kit-65644/' },
  { id: 62, url: 'https://www.footballkitarchive.com/brazil-2006-home-kit-8224/' },
  { id: 63, url: 'https://www.footballkitarchive.com/italy-2006-home-kit-32022/' },
  { id: 64, url: 'https://www.footballkitarchive.com/spain-2010-home-kit-5303/' },
  { id: 65, url: 'https://www.footballkitarchive.com/netherlands-2010-home-kit-65641/' },
  { id: 66, url: 'https://www.footballkitarchive.com/brazil-2010-home-kit-8225/' },
  { id: 67, url: 'https://www.footballkitarchive.com/argentina-2014-home-kit-4865/' },
  { id: 68, url: 'https://www.footballkitarchive.com/brazil-2014-home-kit-8226/' },
  { id: 69, url: 'https://www.footballkitarchive.com/france-2014-home-kit-4731/' },
  { id: 70, url: 'https://www.footballkitarchive.com/colombia-2014-home-kit-5381/' },
  { id: 71, url: 'https://www.footballkitarchive.com/belgium-2018-home-kit-4937/' },
  { id: 72, url: 'https://www.footballkitarchive.com/england-2018-home-kit-4808/' },
  { id: 73, url: 'https://www.footballkitarchive.com/argentina-2022-away-kit-61773/' },
  { id: 74, url: 'https://www.footballkitarchive.com/france-2022-home-kit-61748/' },
  { id: 75, url: 'https://www.footballkitarchive.com/morocco-2022-home-kit-61791/' },
  { id: 76, url: 'https://www.footballkitarchive.com/brazil-2022-home-kit-61745/' },
  { id: 77, url: 'https://www.footballkitarchive.com/italy-1982-home-kit-32027/' },
  { id: 78, url: 'https://www.footballkitarchive.com/germany-1982-home-kit-4493/' },
  { id: 79, url: 'https://www.footballkitarchive.com/spain-1982-home-kit-5285/' },
  { id: 80, url: 'https://www.footballkitarchive.com/england-1982-home-kit-4821/' },
  { id: 81, url: 'https://www.footballkitarchive.com/algeria-1982-home-kit-5397/' },
  { id: 82, url: 'https://www.footballkitarchive.com/mexico-1986-home-kit-7787/' },
  { id: 83, url: 'https://www.footballkitarchive.com/germany-1986-home-kit-4488/' },
  { id: 84, url: 'https://www.footballkitarchive.com/france-1986-home-kit-4743/' },
  { id: 85, url: 'https://www.footballkitarchive.com/denmark-1986-home-kit-4980/' },
  { id: 86, url: 'https://www.footballkitarchive.com/brazil-1986-home-kit-31032/' },
  { id: 87, url: 'https://www.footballkitarchive.com/soviet-union-1986-home-kit-5335/' },
  { id: 88, url: 'https://www.footballkitarchive.com/italy-1986-home-kit-32028/' },
  { id: 89, url: 'https://www.footballkitarchive.com/italy-1990-home-kit-32024/' },
  { id: 90, url: 'https://www.footballkitarchive.com/argentina-1990-home-kit-4888/' },
  { id: 91, url: 'https://www.footballkitarchive.com/cameroon-1990-home-kit-5432/' },
  { id: 92, url: 'https://www.footballkitarchive.com/brazil-1990-home-kit-31033/' },
  { id: 93, url: 'https://www.footballkitarchive.com/spain-1990-home-kit-5290/' },
  { id: 94, url: 'https://www.footballkitarchive.com/netherlands-1990-home-kit-65642/' },
  { id: 95, url: 'https://www.footballkitarchive.com/brazil-1978-home-kit-31031/' },
  { id: 96, url: 'https://www.footballkitarchive.com/netherlands-1978-home-kit-65645/' },
  { id: 97, url: 'https://www.footballkitarchive.com/italy-1978-home-kit-32030/' },
  { id: 98, url: 'https://www.footballkitarchive.com/peru-1978-home-kit-65657/' },
  { id: 99, url: 'https://www.footballkitarchive.com/scotland-1978-home-kit-5280/' },
  { id: 100, url: 'https://www.footballkitarchive.com/iran-1978-home-kit-5457/' },
  { id: 101, url: 'https://www.footballkitarchive.com/morocco-1986-home-kit-5399/' },
  { id: 102, url: 'https://www.footballkitarchive.com/republic-of-ireland-1990-home-kit-86133/' },
  { id: 103, url: 'https://www.footballkitarchive.com/costa-rica-1990-home-kit-5406/' },
  { id: 104, url: 'https://www.footballkitarchive.com/sweden-1974-home-kit-5348/' },
  { id: 105, url: 'https://www.footballkitarchive.com/brazil-1962-home-kit-31997/' },
  { id: 106, url: 'https://www.footballkitarchive.com/england-1966-home-kit-4823/' },
  { id: 107, url: 'https://www.footballkitarchive.com/germany-1966-home-kit-4692/' },
  { id: 108, url: 'https://www.footballkitarchive.com/portugal-1966-home-kit-5142/' },
  { id: 109, url: 'https://www.footballkitarchive.com/brazil-1966-home-kit-31998/' },
  { id: 110, url: 'https://www.footballkitarchive.com/brazil-1970-away-kit-31999/' },
  { id: 111, url: 'https://www.footballkitarchive.com/italy-1970-home-kit-32031/' },
  { id: 112, url: 'https://www.footballkitarchive.com/germany-1970-home-kit-4689/' },
  { id: 113, url: 'https://www.footballkitarchive.com/uruguay-1970-home-kit-86139/' },
  { id: 114, url: 'https://www.footballkitarchive.com/england-1970-home-kit-4825/' },
  { id: 115, url: 'https://www.footballkitarchive.com/peru-1970-home-kit-65661/' },
  { id: 116, url: 'https://www.footballkitarchive.com/brazil-1958-home-kit-31996/' },
  { id: 117, url: 'https://www.footballkitarchive.com/sweden-1958-home-kit-5350/' },
  { id: 118, url: 'https://www.footballkitarchive.com/france-1958-home-kit-4745/' },
  { id: 119, url: 'https://www.footballkitarchive.com/hungary-1954-home-kit-5455/' },
  { id: 120, url: 'https://www.footballkitarchive.com/uruguay-1954-home-kit-86141/' },
  { id: 121, url: 'https://www.footballkitarchive.com/austria-1954-home-kit-86145/' },
  { id: 122, url: 'https://www.footballkitarchive.com/uruguay-1950-home-kit-86140/' },
  { id: 123, url: 'https://www.footballkitarchive.com/sweden-1950-home-kit-5352/' },
];

function extractCdnUrl(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 1. og:image
  const og = doc.querySelector('meta[property="og:image"]');
  if (og && og.content && og.content.includes('/cdn/')) return og.content;

  // 2. Cualquier img con /cdn/ en src
  const imgs = Array.from(doc.querySelectorAll('img'));
  for (const img of imgs) {
    if (img.src && img.src.includes('/cdn/')) return img.src;
    if (img.dataset.src && img.dataset.src.includes('/cdn/')) return img.dataset.src;
  }

  // 3. Buscar en el HTML raw cualquier URL /cdn/ seguida de imagen
  const match = html.match(/https:\/\/www\.footballkitarchive\.com\/cdn\/[^"'\s]+\.(jpg|png|webp)/i);
  return match ? match[0] : null;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const results = {};
  const failed = [];
  const total = PAGES.length;

  console.log(`%cIniciando extracción de ${total} URLs...`, 'color: #00aaff; font-weight: bold');

  for (let i = 0; i < PAGES.length; i++) {
    const { id, url } = PAGES[i];
    try {
      const res = await fetch(url, { credentials: 'include' });
      const html = await res.text();
      const cdnUrl = extractCdnUrl(html);

      if (cdnUrl) {
        results[id] = cdnUrl;
        console.log(`%c[${i+1}/${total}] ✅ ${id} → ${cdnUrl.split('/cdn/')[1]?.substring(0,40)}`, 'color: #00cc44');
      } else {
        failed.push(id);
        console.warn(`[${i+1}/${total}] ⚠️  ${id} — sin URL CDN`);
      }
    } catch (err) {
      failed.push(id);
      console.error(`[${i+1}/${total}] ❌ ${id} — ${err.message}`);
    }

    // Pausa entre peticiones para no saturar
    await sleep(300);
  }

  console.log(`\n%c✅ LISTO: ${Object.keys(results).length}/${total} URLs obtenidas`, 'color: #ffaa00; font-size:14px; font-weight:bold');
  if (failed.length > 0) console.warn('IDs sin URL:', failed);

  // Descargar el JSON resultante
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fka-new-cdn-urls.json';
  a.click();
  console.log('%c📥 Descargando fka-new-cdn-urls.json...', 'color: #ffaa00');

  return results;
}

run();
