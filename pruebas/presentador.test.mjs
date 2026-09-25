// Presentador en vivo: guion del orador en el HTML, notas, pantalla en negro, salto por número y cámara limpia.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir, lanzarChromium } from '../scripts/lib/pipeline.mjs';

const deck = { emoji: 'apple', marca: false, laminas: [
  { tipo: 'idea', id: 'uno', emoji: '💡', texto: 'Uno', nota: 'nota', voz: ['Primera frase del orador', 'Segunda frase'] },
  { tipo: 'camara', id: 'cam', nota: 'Te cuento algo', voz: 'Aquí hablo a cámara' },
  { tipo: 'idea', id: 'tres', emoji: '💰', texto: 'Tres', voz: 'Tercera' },
  { tipo: 'idea', id: 'cuatro', emoji: '⏳', texto: 'Cuatro', voz: 'Cuarta' },
  { tipo: 'idea', id: 'cinco', emoji: '🚀', texto: 'Cinco', voz: 'Quinta' },
] };

function preparar() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-pres-'));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  return prepararSalida(dir, path.join(dir, 'salida'));
}

test('el HTML trae el guion del orador (voz y duración por paso) en cada lámina, sin dibujarlo', () => {
  const p = preparar();
  const guiones = [...p.html.matchAll(/<script type="application\/json" class="guion">(.*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  assert.equal(guiones.length, deck.laminas.length);
  assert.deepEqual(guiones[0].voz, ['Primera frase del orador', 'Segunda frase']);
  assert.equal(guiones[0].dur.length, 2);
  assert.deepEqual(guiones[1].voz, ['Aquí hablo a cámara']);
});

test('presentador: N muestra la voz, B pone negro, 5 G salta a la lámina 5 y la cámara sale en negro limpio', { timeout: 120_000 }, async () => {
  const p = preparar();
  const { browser, page } = await abrir(p.htmlPath, 1280, 720, { modo: 'presentador' });
  try {
    await page.waitForSelector('.notas-pres', { state: 'attached' });
    const activa = () => page.evaluate(() => document.querySelector('.lamina.activa').dataset.id);
    assert.equal(await activa(), 'uno');
    await page.keyboard.press('n');
    assert.match(await page.evaluate(() => getComputedStyle(document.querySelector('.notas-pres')).display + '|' + document.querySelector('.notas-pres').textContent), /^block\|.*Primera frase del orador/);
    await page.keyboard.press('b');
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.velo-pres')).backgroundColor), 'rgb(0, 0, 0)');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.velo-pres')).display), 'none', 'avanzar quita el negro');
    await page.keyboard.press('ArrowRight');
    assert.equal(await activa(), 'cam');
    const cam = await page.evaluate(() => { const l = document.querySelector('.lamina.activa'); return [getComputedStyle(l).backgroundColor, getComputedStyle(l.querySelector('.lienzo .nota')).visibility]; });
    assert.deepEqual(cam, ['rgb(0, 0, 0)', 'hidden']);
    await page.keyboard.press('5');
    await page.keyboard.press('g');
    assert.equal(await activa(), 'cinco');
    await page.keyboard.press('Enter');                       // sin número, Intro sigue avanzando (fin del deck)
    assert.equal(await activa(), 'cinco');
    await page.keyboard.press('1'); await page.keyboard.press('Enter');
    assert.equal(await activa(), 'uno');
  } finally { await browser.close(); }
});

test('vista de ensayo (?modo=orador): paso actual, siguiente en miniatura, voz y cronómetro', { timeout: 120_000 }, async () => {
  const p = preparar();
  const { browser, page } = await abrir(p.htmlPath, 1280, 800, { modo: 'orador' });
  try {
    await page.waitForSelector('.orador-ui .o-reloj b');
    const r = await page.evaluate(() => ({
      voz: document.querySelector('.o-voz').textContent, sig: document.querySelector('.o-voz-sig').textContent,
      pos: document.querySelector('.o-pos').textContent, clon: !!document.querySelector('.lamina.clon-sig'), reloj: document.querySelector('.o-reloj').textContent,
    }));
    assert.equal(r.voz, 'Primera frase del orador');
    assert.equal(r.sig, 'Segunda frase');
    assert.match(r.pos, /lámina 1\/5 · paso 1\/2/);
    assert.ok(r.clon);
    assert.match(r.reloj, /total \d+:\d\d · lámina \d+:\d\d \/ \d+:\d\d/);
  } finally { await browser.close(); }
});

// ---------- ronda 2: fondo del proyector, contraste del ensayo, sincronía en Safari y tramos en vivo ----------
import { cargarPlaywright } from '../scripts/lib/playwright.mjs';
import { DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { pathToFileURL } from 'node:url';

const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const rgb = s => s.match(/\d+/g).slice(0, 3).map(Number);

test('proyector 4:3: las bandas salen negras (el html, no solo el body) y la voz del ensayo se lee (≥ 7:1)', { timeout: 120_000 }, async () => {
  const p = preparar();
  const pres = await abrir(p.htmlPath, 1024, 768, { modo: 'presentador' });
  try {
    await pres.page.waitForSelector('.notas-pres', { state: 'attached' });
    const fondo = await pres.page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
    assert.ok(rgb(fondo).every(c => c < 30), `fondo del html ${fondo}`);
  } finally { await pres.browser.close(); }
  const ens = await abrir(p.htmlPath, 1280, 800, { modo: 'orador' });
  try {
    await ens.page.waitForSelector('.orador-ui .o-voz');
    const [voz, html] = await ens.page.evaluate(() => [getComputedStyle(document.querySelector('.o-voz')).color, getComputedStyle(document.documentElement).backgroundColor]);
    assert.ok(contraste(rgb(voz), rgb(html)) >= 7, `voz ${voz} sobre ${html}`);
  } finally { await ens.browser.close(); }
});

// La tecla O abre el ensayo; 4 avances en el público se ven en el ensayo. En WebKit (Safari) BroadcastChannel no
// cruza documentos file://: la sincronía va por postMessage entre la ventana y su opener.
async function sincronia(motor) {
  const p = preparar();
  const pw = cargarPlaywright(DIR_SKILL);
  let browser;
  try { browser = motor === 'chromium' ? await lanzarChromium() : await pw[motor].launch(); } catch (e) { if (motor === 'chromium') throw e; return null; }
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(pathToFileURL(p.htmlPath).href + '?modo=presentador', { waitUntil: 'load' });
    await page.evaluate(() => window.PZ.listo);
    await page.waitForSelector('.notas-pres', { state: 'attached' });
    const [popup] = await Promise.all([page.waitForEvent('popup'), page.keyboard.press('o')]);
    await popup.waitForLoadState('load');
    await popup.evaluate(() => window.PZ.listo);
    await popup.waitForSelector('.orador-ui .o-reloj b');
    for (let k = 0; k < 4; k++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(60); }
    await popup.waitForFunction(() => location.hash === '#4', null, { timeout: 5000 }).catch(() => {});
    const r = [await page.evaluate(() => location.hash), await popup.evaluate(() => location.hash)];
    // y al revés: el ensayo avanza y el público lo sigue
    await popup.keyboard.press('ArrowRight');
    await page.waitForFunction(() => location.hash === '#5', null, { timeout: 5000 }).catch(() => {});
    r.push(await page.evaluate(() => location.hash));
    return r;
  } finally { await browser.close(); }
}
test('sincronía público ↔ ensayo con la tecla O: Chromium', { timeout: 120_000 }, async () => {
  assert.deepEqual(await sincronia('chromium'), ['#4', '#4', '#5']);
});
test('sincronía público ↔ ensayo con la tecla O: WebKit (Safari), si Playwright lo puede lanzar', { timeout: 120_000 }, async t => {
  const r = await sincronia('webkit');
  if (!r) { t.skip('WebKit no pudo iniciarse en este entorno'); return; }
  assert.deepEqual(r, ['#4', '#4', '#5']);
});

test('tramo en vivo: en el presentador es blanco con la consigna y la cuenta regresiva; en el render no existe', { timeout: 120_000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-vivo-'));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ emoji: 'apple', laminas: [
    { tipo: 'idea', id: 'uno', emoji: '💡', texto: 'Uno' },
    { tipo: 'camara', id: 'actividad', vivo: true, dur: 300, texto: 'Ahora tú: **tu reparto**', items: ['Anota lo que entró', 'Sepáralo en 4'], voz: 'Tienes cinco minutos', accion: 'Abrir el documento', si_falla: 'Usar la copia local' },
    { tipo: 'camara', id: 'cam', voz: 'A cámara' },
  ] }));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  assert.deepEqual(p.avisos, []);
  assert.match(p.html, /data-vivo="1" data-dur="300"/);
  assert.match(p.html.replace(/\u00a0/g, ' '), /<div class="vivo-consigna">Ahora tú: <b>tu reparto<\/b><\/div>/);
  const pres = await abrir(p.htmlPath, 1280, 720, { modo: 'presentador' });
  try {
    await pres.page.waitForSelector('.notas-pres', { state: 'attached' });
    await pres.page.keyboard.press('ArrowRight');
    await pres.page.waitForTimeout(400);
    const r = await pres.page.evaluate(() => {
      const l = document.querySelector('.lamina.activa'), v = l.querySelector('.vivo-pres');
      return { id: l.dataset.id, fondo: getComputedStyle(v).backgroundColor, vis: getComputedStyle(v).display, consigna: v.querySelector('.vivo-consigna').textContent,
        items: v.querySelectorAll('.vivo-items li').length, reloj: v.querySelector('.vivo-reloj').textContent, nota: l.querySelector('.lienzo .nota').checkVisibility() };
    });
    assert.equal(r.id, 'actividad');
    assert.deepEqual([r.fondo, r.vis, r.consigna.replace(/\u00a0/g, ' '), r.items, r.nota], ['rgb(255, 255, 255)', 'flex', 'Ahora tú: tu reparto', 2, false]);
    assert.match(r.reloj, /^(5:00|4:5\d)$/);
    await pres.page.keyboard.press('n');
    const notas = (await pres.page.locator('.notas-pres').innerText()).replace(/\u00a0/g, ' ');
    for (const texto of ['Ahora tú: tu reparto', 'Tienes cinco minutos', 'ACCIÓN: Abrir el documento', 'SI FALLA: Usar la copia local']) assert.ok(notas.includes(texto));
    assert.doesNotMatch(await pres.page.locator('.vivo-pres').first().innerText(), /Abrir el documento|Usar la copia local/);
    // la cámara sin vivo sigue en negro limpio
    await pres.page.keyboard.press('ArrowRight');
    assert.equal(await pres.page.evaluate(() => getComputedStyle(document.querySelector('.lamina.activa')).backgroundColor), 'rgb(0, 0, 0)');
  } finally { await pres.browser.close(); }
  const ensayo = await abrir(p.htmlPath, 1280, 720, { modo: 'orador' });
  try {
    await ensayo.page.waitForSelector('.o-voz');
    await ensayo.page.keyboard.press('ArrowRight');
    const notas = (await ensayo.page.locator('.o-voz').innerText()).replace(/\u00a0/g, ' ');
    for (const texto of ['Ahora tú: tu reparto', 'Tienes cinco minutos', 'ACCIÓN: Abrir el documento', 'SI FALLA: Usar la copia local']) assert.ok(notas.includes(texto));
  } finally { await ensayo.browser.close(); }
  const ren = await abrir(p.htmlPath, 1920, 1080);
  try {
    assert.equal(await ren.page.evaluate(() => getComputedStyle(document.querySelector('.vivo-pres')).display), 'none', 'los PNG y la hoja no cambian');
  } finally { await ren.browser.close(); }
});
