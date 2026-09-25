import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir, lanzarChromium } from '../scripts/lib/pipeline.mjs';

async function medir(t, laminas, formato = '16:9') {
  try { const b = await lanzarChromium(); await b.close(); }
  catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(e.motivo); return null; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r11-motor-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca: false, emoji: 'apple', formato, laminas }));
  const p = prepararSalida(dir), b = await abrir(p.htmlPath, p.W, p.H);
  t.after(() => b.browser.close());
  return b.page;
}

test('R11: burbuja vertical corta ocupa 82–86% útil y no supera dos renglones', async t => {
  const page = await medir(t, [{ tipo: 'chat', mensajes: [{ de: 'yo', texto: 'Cuesta $800. ¿Para qué fecha?' }] }], '9:16');
  if (!page) return;
  const m = await page.evaluate(() => {
    const l = document.querySelector('.lamina'), z = l.querySelector('.lienzo'), b = l.querySelector('.burbuja'), a = l.querySelector('.yo-av');
    const r = b.getBoundingClientRect(), A = a.getBoundingClientRect(), css = getComputedStyle(z);
    const rg = document.createRange(); rg.selectNodeContents(b);
    return { ancho: r.width / (l.offsetWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight)),
      lineas: new Set([...rg.getClientRects()].map(x => Math.round(x.y))).size, hueco: A.x-r.right };
  });
  assert.ok(m.ancho >= .82 && m.ancho <= .86, JSON.stringify(m));
  assert.ok(m.lineas <= 2, JSON.stringify(m));
  assert.ok(m.hueco >= 12, JSON.stringify(m));
});

for (const formato of ['16:9', '9:16']) test(`R11: listas cortas de cualquier marca centradas y estables ${formato}`, async t => {
  const page = await medir(t, [
    { tipo: 'lista', encabezado: 'Sin:', vineta: 'x', items: ['Compras', 'Llamadas', 'Traslados'] },
    { tipo: 'lista', encabezado: 'Incluye:', vineta: 'check', items: ['Entrega', 'Revisión', 'Archivo', 'Guion', 'Calendario'] },
    { tipo: 'lista', items: ['Precio claro', 'Una pregunta'] },
  ], formato);
  if (!page) return;
  const ms = await page.evaluate(() => window.PZ.lams.map(l => {
    const b = l.querySelector('.lienzo').firstElementChild, L = l.getBoundingClientRect(), a = b.getBoundingClientRect();
    window.PZ.mostrar(l, 0, Infinity); const p = b.getBoundingClientRect();
    return { centro: (a.y-L.y+a.height/2)/L.height, estable: Math.abs(a.y-p.y)<1 };
  }));
  for (const m of ms) { assert.ok(m.centro >= .45 && m.centro <= .50, JSON.stringify(ms)); assert.ok(m.estable); }
});

test('R11: cita vertical mantiene el origen de la flecha en el borde del icono', async t => {
  const page = await medir(t, [{ tipo: 'cita', emoji: '💬', texto: '~~Solo vendo barato~~' }], '9:16');
  if (!page) return;
  const d = await page.evaluate(() => {
    const l = document.querySelector('.lamina'), f = l.querySelector('path[data-clase="flecha"]');
    if (!f) return 0;
    const a = l.querySelector('[data-a="icono"]').getBoundingClientRect(), L = l.getBoundingClientRect(), p = f.getPointAtLength(0);
    const dx=Math.max(a.left-L.left-p.x,0,p.x-(a.right-L.left)),dy=Math.max(a.top-L.top-p.y,0,p.y-(a.bottom-L.top));
    return dx||dy ? Math.hypot(dx,dy) : Math.min(p.x-a.left+L.left,a.right-L.left-p.x,p.y-a.top+L.top,a.bottom-L.top-p.y);
  });
  assert.ok(d <= 24, `Origen a ${d}px`);
});

test('R11: anotación visible nunca baja de 50px; descargo fuera del encaje y firma', async t => {
  const page = await medir(t, [{ tipo: 'idea', emoji: '📦', texto: 'Una entrega concreta antes de comenzar el trabajo',
    anotaciones: [{ a: 'texto', texto: 'Evita rehacer gratis', tam: '40px' }], fuente: 'Archivo de práctica · no es una venta real' },
    { tipo: 'chat', procedencia: 'ejemplo', mensajes: [{ de: 'yo', texto: 'Una fecha concreta para comenzar.' }] }]);
  if (!page) return;
  const m = await page.evaluate(() => ({ tam: parseFloat(getComputedStyle(document.querySelector('.anotacion')).fontSize),
    descargos: [...document.querySelectorAll('.descargo')].map(e => ({ tam:parseFloat(getComputedStyle(e).fontSize), padre:e.parentElement.className, x:e.offsetLeft })) }));
  assert.ok(m.tam >= 50, JSON.stringify(m));
  assert.equal(m.descargos.length, 2, JSON.stringify(m));
  for (const d of m.descargos) { assert.ok(d.tam >= 32); assert.match(d.padre,/lamina/); assert.ok(d.x < 100); }
});

test('R11: descargos conservan el revelado y su zona segura al reubicarse', async t => {
  const page = await medir(t, [
    { tipo:'chat', procedencia:'ejemplo', fuente:'Archivo de práctica · no es una venta real', mensajes:[{de:'yo',texto:'Una entrega'}] },
    { tipo:'prueba', capturas:[{post:{texto:['Primer caso']},ejemplo:true,procedencia:'ejemplo'},{post:{texto:['Segundo caso']},ejemplo:true,procedencia:'ejemplo'}] },
  ], '9:16');
  if (!page) return;
  const m=await page.evaluate(()=> {
    const [a,b]=window.PZ.lams;
    window.PZ.mostrar(b,0,Infinity);
    return { bajos:[...a.querySelectorAll('.descargo')].map(e=>e.getBoundingClientRect().bottom-a.getBoundingClientRect().top),
      pasos:[...b.querySelectorAll('.descargo')].map(e=>({paso:e.dataset.p,visible:getComputedStyle(e).visibility!=='hidden'})) };
  });
  assert.ok(m.bajos.every(y=>y<=1600),JSON.stringify(m));
  assert.deepEqual(m.pasos,[{paso:'0',visible:true},{paso:'1',visible:false}]);
});
