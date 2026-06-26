#!/usr/bin/env node
/**
 * Debug: intercepta peticiones de red para capturar URLs CDN del FKA
 */
import { chromium } from 'playwright';

const URL = 'https://www.footballkitarchive.com/spain-1994-home-kit-5294/';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
});
const page = await context.newPage();

// Interceptar todas las peticiones de imagen
const imageRequests = [];
page.on('request', req => {
  const url = req.url();
  if (req.resourceType() === 'image' || url.includes('/cdn/')) {
    imageRequests.push(url);
  }
});
page.on('response', async res => {
  const url = res.url();
  if (url.includes('/cdn/') && res.headers()['content-type']?.startsWith('image/')) {
    console.log('NETWORK IMAGE:', url);
  }
});

console.log('Navegando con domcontentloaded...');
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForTimeout(2000);

// Scroll para activar lazy load
await page.evaluate(() => window.scrollTo(0, 500));
await page.waitForTimeout(2000);
await page.evaluate(() => window.scrollTo(0, 1000));
await page.waitForTimeout(2000);

// Buscar imágenes en el DOM tras el scroll
const imgs = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('img')).map(img => ({
    src: img.src,
    dataSrc: img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original'),
    srcset: img.getAttribute('srcset'),
    alt: img.alt?.substring(0, 50),
    className: img.className?.substring(0, 80),
  })).filter(img => img.src || img.dataSrc);
});

console.log('\n=== IMÁGENES DOM ===');
imgs.forEach(img => console.log(JSON.stringify(img)));

const og = await page.evaluate(() => {
  return document.querySelector('meta[property="og:image"]')?.content || null;
});
console.log('\n=== OG:IMAGE ===', og);
console.log('=== TÍTULO ===', await page.title());

console.log('\n=== URLS DE RED (imagen/cdn) ===');
imageRequests.forEach(u => console.log(u));

const jsonld = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map(s => s.textContent.substring(0, 500));
});
console.log('\n=== JSON-LD ===');
jsonld.forEach(j => console.log(j));

await browser.close();
console.log('\nDone.');
