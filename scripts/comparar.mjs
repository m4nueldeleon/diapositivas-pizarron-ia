#!/usr/bin/env node
// comparar.mjs — mide la fidelidad de la réplica: cada lámina «r<seg>» contra el cuadro «ref_<seg>.jpg».
//
//   node scripts/comparar.mjs <carpeta-del-deck> <carpeta-ref> [--salida dir] [--umbral 8]
//
// Usa el ÚLTIMO paso de cada lámina. Sale:
//   · <salida>/comp_N.jpg: 5 pares por hoja (referencia a la izquierda, nuestra lámina a la derecha);
//   · <salida>/comparar.json: por par, la caja de tinta de cada lado y su diferencia en % del lienzo.
// Un par FALLA si x, y, ancho o alto de la caja difieren más del umbral (8 puntos por omisión).
// Código de salida 1 si falta un par (lámina sin referencia o referencia sin lámina).
// La métrica mide ENCUADRE, no estilo (ver scripts/lib/tinta.mjs): la revisión a ojo sigue mandando.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { argumentos, prepararSalida, abrir } from './lib/pipeline.mjs';
import { cajaTinta, compararCajas, emparejar } from './lib/tinta.mjs';

const { pos, opt } = argumentos(process.argv);
const [dirDeck, dirRef] = pos;
if (!dirDeck || !dirRef) { console.error('uso: node scripts/comparar.mjs <carpeta-del-deck> <carpeta-ref> [--salida dir] [--umbral 8]'); process.exit(2); }
const umbral = Number(opt('--umbral', 8)) || 8;
let prep;
try { prep = prepararSalida(dirDeck, opt('--salida') ? path.join(opt('--salida'), 'html') : undefined); } catch (e) { console.error('✗ ' + e.message); process.exit(2); }
const salida = path.resolve(opt('--salida') || path.join(prep.dirSalida, 'comparar'));
fs.mkdirSync(salida, { recursive: true });

const ids = prep.deck.laminas.map(l => l.id);
const { pares, sinRef, sinLamina } = emparejar(ids, fs.readdirSync(dirRef));
sinRef.forEach(id => console.warn(`⚠ la lámina «${id}» no tiene referencia (ref_${id.slice(1)}.jpg)`));
sinLamina.forEach(f => console.warn(`⚠ sobra la referencia ${f}: no hay lámina con id «r${f.match(/\d+/)[0]}»`));

const { browser, page } = await abrir(prep.htmlPath, prep.W, prep.H);
const aDataUrl = f => `data:image/${/png$/i.test(f) ? 'png' : 'jpeg'};base64,${fs.readFileSync(f).toString('base64')}`;
for (const par of pares) {
  const i = ids.indexOf(par.id);
  const lam = (await page.$$('section.lamina'))[i];
  await page.evaluate(k => { const l = window.PZ.lams[k]; window.PZ.mostrar(l, window.PZ.pasos(l) - 1, Infinity); }, i);
  par.nuestra = 'data:image/png;base64,' + (await lam.screenshot({ type: 'png' })).toString('base64');
  par.referencia = aDataUrl(path.join(dirRef, par.ref));
}
// Cajas de tinta: se leen los píxeles en un canvas de 480×270 (misma proporción, más rápido)
const medir = await browser.newPage();
await medir.addScriptTag({ content: `window.cajaTinta = ${cajaTinta.toString()};` });
for (const par of pares) {
  const [ref, nuestra] = await medir.evaluate(async urls => Promise.all(urls.map(async u => {
    const im = new Image(); im.src = u; await im.decode();
    const w = 480, h = Math.round(480 * im.naturalHeight / im.naturalWidth);
    const c = new OffscreenCanvas(w, h), g = c.getContext('2d'); g.drawImage(im, 0, 0, w, h);
    return window.cajaTinta(g.getImageData(0, 0, w, h).data, w, h);
  })), [par.referencia, par.nuestra]);
  Object.assign(par, { cajaRef: ref, cajaNuestra: nuestra, ...compararCajas(ref, nuestra, umbral) });
}
// Hojas de comparación
const f1 = v => (v == null ? '—' : (v > 0 ? '+' : '') + v.toFixed(1));
for (let h = 0; h * 5 < pares.length; h++) {
  const grupo = pares.slice(h * 5, h * 5 + 5);
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222;font:600 18px system-ui;color:#fff}
    .f{display:flex;gap:12px;padding:10px 12px;align-items:center}.f img{width:640px;height:360px;object-fit:contain;background:#fff}
    .r{width:170px}.r b{display:block;font-size:24px}.mal{color:#ff6b6b}.bien{color:#7ee07a}</style>
    ${grupo.map(p => `<div class="f"><div class="r"><b>ref_${p.seg}</b>${p.id}<br><span class="${p.falla ? 'mal' : 'bien'}">${p.falla ? 'FALLA' : 'pasa'}</span><br>x ${f1(p.dx)} · y ${f1(p.dy)}<br>w ${f1(p.dw)} · h ${f1(p.dh)}</div><img src="${p.referencia}"><img src="${p.nuestra}"></div>`).join('')}`;
  const hp = path.join(salida, `.comp_${h + 1}.html`);
  fs.writeFileSync(hp, html);
  const pg = await browser.newPage({ viewport: { width: 1500, height: 400 } });
  await pg.goto(pathToFileURL(hp).href, { waitUntil: 'load' });
  await pg.screenshot({ path: path.join(salida, `comp_${h + 1}.jpg`), type: 'jpeg', quality: 80, fullPage: true });
  fs.unlinkSync(hp);
}
await browser.close();

const pasan = pares.filter(p => !p.falla).length;
const informe = { umbral, pasan, total: pares.length, sinRef, sinLamina,
  pares: pares.map(({ referencia, nuestra, ...p }) => p) };
fs.writeFileSync(path.join(salida, 'comparar.json'), JSON.stringify(informe, null, 2));
console.log(`Encuadre: ${pasan}/${pares.length} pares dentro de ±${umbral}% · hojas en ${salida}`);
pares.forEach(p => console.log(`  ${p.falla ? '✗' : '✓'} ${p.id}  x ${f1(p.dx)}  y ${f1(p.dy)}  w ${f1(p.dw)}  h ${f1(p.dh)}`));
process.exit(sinRef.length || sinLamina.length ? 1 : 0);
