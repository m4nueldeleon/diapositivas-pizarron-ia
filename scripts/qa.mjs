#!/usr/bin/env node
// qa.mjs — revisa el deck renderizado con reglas que cuentan, no que opinan. Nota 0-100.
//
//   node scripts/qa.mjs <carpeta|deck.json> [--json]
//
// Errores (−12 c/u): desbordes del lienzo, textos encimados, letra menor a 28 px, emojis sin cargar,
//                    anclas de flechas que no existen, más de 35 palabras visibles en un paso.
// Avisos  (−3 c/u):  más de 22 palabras en un paso, más de 2 énfasis por lámina, texto que choca con la
//                    firma, un mismo diseño 4 veces seguidas, un diseño en más del 45% del deck,
//                    4 láminas seguidas sin capa a mano, más de 15% de láminas oscuras.
import fs from 'node:fs';
import path from 'node:path';
import { argumentos, prepararSalida, abrir } from './lib/pipeline.mjs';

const { flag, pos, opt } = argumentos(process.argv);
let prep;
try { prep = prepararSalida(pos[0], opt('--salida')); } catch (e) { console.error('✗ ' + e.message); process.exit(2); }
const { deck, dirSalida, htmlPath, W, H, pasos, avisos: avisosBuild } = prep;
const { browser, page, avisos, errores: errPagina } = await abrir(htmlPath, W, H);

const porLamina = await page.evaluate(([W, H]) => {
  const out = [];
  const visible = e => { const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('.oculto') && e.getClientRects().length; };
  const caja = (e, lam) => { const r = e.getBoundingClientRect(), L = lam.getBoundingClientRect(); return { x: r.left - L.left, y: r.top - L.top, w: r.width, h: r.height }; };
  const cruza = (a, b) => { const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)); return x * y; };
  const TEXTO = '.t, .nota, .item, .etiqueta, .valor, .encabezado, .cifra, .etiqueta-chica, .tarjeta, .opcion, .burbuja, .titulo-marca';
  const CAJAS = TEXTO + ', .emo, img, table, .captura, .pastilla, .calendario, .rejilla, .medidor, .boton-ui, .sello';
  window.PZ.lams.forEach((lam, i) => {
    const n = window.PZ.pasos(lam), r = { i, tipo: lam.dataset.tipo, errores: [], avisos: [], palabras: 0, mano: 0, enfasis: 0 };
    if (lam.dataset.tipo === 'camara') { out.push(r); return; }
    for (let p = 0; p < n; p++) {
      window.PZ.mostrar(lam, p, Infinity);
      const esc = lam; // la escena principal
      const cajas = [...esc.querySelectorAll(CAJAS)].filter(e => visible(e) && !e.closest('.escena:not(.lamina)') && !e.closest('.cuadrantes'));
      for (const e of cajas) {
        const b = caja(e, lam);
        if (e.closest('.sello')) continue;
        if (b.x < -2 || b.y < -2 || b.x + b.w > W + 2 || b.y + b.h > H + 2) {
          r.errores.push(`paso ${p + 1}: «${(e.innerText || e.className || e.tagName).toString().trim().slice(0, 40)}» se sale del lienzo`);
        }
      }
      const textos = [...esc.querySelectorAll(TEXTO)].filter(e => visible(e) && !e.closest('.escena:not(.lamina)') && !e.querySelector(TEXTO));
      for (let a = 0; a < textos.length; a++) for (let b = a + 1; b < textos.length; b++) {
        if (textos[a].contains(textos[b]) || textos[b].contains(textos[a])) continue;
        const A = caja(textos[a], lam), B = caja(textos[b], lam), c = cruza(A, B);
        if (c > 0.06 * Math.min(A.w * A.h, B.w * B.h)) r.errores.push(`paso ${p + 1}: se enciman «${textos[a].innerText.trim().slice(0, 24)}» y «${textos[b].innerText.trim().slice(0, 24)}»`);
      }
      const firma = lam.querySelector(':scope > .firma');
      if (firma && lam.dataset.tipo !== 'tabla') {
        const F = caja(firma, lam);
        for (const t of textos) if (cruza(F, caja(t, lam)) > 4) { r.avisos.push(`paso ${p + 1}: «${t.innerText.trim().slice(0, 24)}» toca la firma`); break; }
      }
      for (const t of textos) {
        const fs = parseFloat(getComputedStyle(t).fontSize);
        if (fs < 28 && !t.closest('.post') && !t.closest('.calendario')) r.errores.push(`paso ${p + 1}: letra de ${fs}px en «${t.innerText.trim().slice(0, 24)}» (mínimo 28)`);
      }
      const lienzo = [...lam.querySelectorAll(':scope > .lienzo')].pop();
      if (lienzo && !['tabla', 'prueba', 'chat', 'calendario'].includes(lam.dataset.tipo)) {
        const txt = [...lienzo.querySelectorAll(TEXTO)].filter(visible).filter(e => !e.querySelector(TEXTO)).map(e => e.innerText).join(' ');
        const np = (txt.match(/[\p{L}\p{N}]+/gu) || []).length;
        r.palabras = Math.max(r.palabras, np);
      }
    }
    window.PZ.mostrar(lam, n - 1, Infinity);
    if (lam.dataset.encaje && +lam.dataset.encaje < 0.8) r.avisos.push(`paso ${n}: el contenido se redujo al ${Math.round(+lam.dataset.encaje * 100)}% para caber; conviene partir la lámina o acortar el texto`);
    r.mano = lam.querySelectorAll('.capa-mano path, .nota, .tabla, .sello, .t-mano').length;
    r.enfasis = lam.querySelectorAll('[data-sub], mark').length;
    [...lam.querySelectorAll('img')].forEach(im => { if (!im.complete || !im.naturalWidth) r.errores.push(`imagen sin cargar: ${im.getAttribute('src')}`); });
    out.push(r);
  });
  return out;
}, [W, H]);
await browser.close();

const errores = [], avis = [];
avisos.forEach(a => errores.push(a));
avisosBuild.forEach(a => errores.push('construcción: ' + a));
errPagina.forEach(a => errores.push('error de la página: ' + a));
porLamina.forEach(r => {
  const n = `lámina ${r.i + 1} (${deck.laminas[r.i].id || r.tipo})`;
  const agrupar = lista => { const m = new Map(); lista.forEach(e => { const k = e.replace(/^paso \d+: /, ''); if (!m.has(k)) m.set(k, e.replace(/^paso (\d+): /, 'desde el paso $1: ')); }); return [...m.values()]; };
  agrupar(r.errores).forEach(e => errores.push(`${n}: ${e}`));
  agrupar(r.avisos).forEach(e => avis.push(`${n}: ${e}`));
  if (r.palabras > 35) errores.push(`${n}: ${r.palabras} palabras a la vista; el estilo pide una idea por lámina (≤ 22)`);
  else if (r.palabras > 22) avis.push(`${n}: ${r.palabras} palabras a la vista (ideal ≤ 22)`);
  if (r.enfasis > 2) avis.push(`${n}: ${r.enfasis} énfasis (subrayado/resaltador); uno por lámina, dos como máximo`);
});
// Reglas del deck completo
const tipos = deck.laminas.map(l => l.tipo).filter(t => t !== 'camara');
let racha = 1;
for (let i = 1; i < tipos.length; i++) { racha = tipos[i] === tipos[i - 1] ? racha + 1 : 1; if (racha === 4) avis.push(`«${tipos[i]}» se usa 4 veces seguidas (desde la lámina ${i - 2}): alterna diseños`); }
const conteo = tipos.reduce((m, t) => ((m[t] = (m[t] || 0) + 1), m), {});
Object.entries(conteo).forEach(([t, c]) => { if (tipos.length >= 8 && c / tipos.length > 0.45) avis.push(`«${t}» es el ${Math.round((c / tipos.length) * 100)}% del deck (máximo 45%)`); });
let sinMano = 0;
porLamina.forEach(r => { if (r.tipo === 'camara') return; sinMano = r.mano ? 0 : sinMano + 1; if (sinMano === 4) avis.push(`4 láminas seguidas sin capa a mano (hasta la ${r.i + 1}): suma una nota, un subrayado o una flecha`); });
const oscuras = deck.laminas.filter(l => l.tipo === 'oscura' || l.oscura).length;
if (tipos.length >= 8 && oscuras / tipos.length > 0.15) avis.push(`${oscuras} láminas oscuras: resérvalas para revelar el producto o la oferta (≤ 15%)`);

const nota = Math.max(0, 100 - 12 * errores.length - 3 * avis.length);
const informe = { nota, laminas: deck.laminas.length, pasos: pasos.reduce((a, b) => a + b, 0), errores, avisos: avis, fecha: new Date().toISOString() };
fs.writeFileSync(path.join(dirSalida, 'qa.json'), JSON.stringify(informe, null, 2));
if (flag('--json')) console.log(JSON.stringify(informe, null, 2));
else {
  console.log(`QA ${nota}/100 · ${informe.laminas} láminas · ${informe.pasos} pasos`);
  errores.forEach(e => console.log('  ✗ ' + e));
  avis.forEach(e => console.log('  ⚠ ' + e));
  if (!errores.length && !avis.length) console.log('  ✓ sin hallazgos');
}
process.exit(errores.length ? 1 : 0);
