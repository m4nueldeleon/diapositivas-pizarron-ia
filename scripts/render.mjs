#!/usr/bin/env node
// render.mjs — deck.json → salida/index.html (presentador) + salida/laminas/NN-id-P.png (un PNG por paso)
//              + salida/hoja.jpg (hoja de contacto) + salida/pasos.json (manifiesto para video y QA)
//
//   node scripts/render.mjs <carpeta|deck.json> [--salida dir] [--escala 1|2] [--solo-html] [--sin-hoja] [--finales]
//
//   --finales   solo el último paso de cada lámina (para revisar rápido)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { argumentos, prepararSalida, abrir } from './lib/pipeline.mjs';

const { opt, flag, pos } = argumentos(process.argv);
let prep;
try { prep = prepararSalida(pos[0], opt('--salida')); } catch (e) { console.error('✗ ' + e.message); process.exit(2); }
const { deck, dirSalida, htmlPath, W, H, avisos: avisosBuild, modoEmoji } = prep;
console.log(`HTML → ${htmlPath}  (${deck.laminas.length} láminas · ${W}x${H} · emoji ${modoEmoji})`);
avisosBuild.forEach(a => console.warn('⚠ ' + a));
if (flag('--solo-html')) process.exit(0);

const escala = Number(opt('--escala', 1));
const soloFinales = flag('--finales');
const dirPng = path.join(dirSalida, 'laminas');
fs.rmSync(dirPng, { recursive: true, force: true });
fs.mkdirSync(dirPng, { recursive: true });

const { browser, page, errores, avisos } = await abrir(htmlPath, W, H, { escala });
avisos.forEach(a => console.warn('⚠ ' + a));
const manifiesto = [];
const finales = [];
const lams = await page.$$('section.lamina');
for (let i = 0; i < lams.length; i++) {
  const l = deck.laminas[i];
  const n = await page.evaluate(k => window.PZ.pasos(window.PZ.lams[k]), i);
  if (l.tipo === 'camara') { manifiesto.push({ lamina: i, id: l.id || 'camara', tipo: 'camara', paso: 0, pasos: 1, archivo: null }); continue; }
  for (let p = soloFinales ? n - 1 : 0; p < n; p++) {
    await page.evaluate(([k, q]) => window.PZ.mostrar(window.PZ.lams[k], q, Infinity), [i, p]);
    const nombre = `${String(i + 1).padStart(2, '0')}-${String(l.id || l.tipo).replace(/[^\w-]/g, '') || 'lamina'}-${p + 1}.png`;
    await lams[i].screenshot({ path: path.join(dirPng, nombre), type: 'png' });
    manifiesto.push({ lamina: i, id: l.id || l.tipo, tipo: l.tipo, paso: p, pasos: n, archivo: `laminas/${nombre}` });
    if (p === n - 1) finales.push(`laminas/${nombre}`);
  }
}
fs.writeFileSync(path.join(dirSalida, 'pasos.json'), JSON.stringify(manifiesto, null, 2));
console.log(`PNG → ${dirPng} (${manifiesto.filter(m => m.archivo).length} imágenes de ${lams.length} láminas)`);

if (!flag('--sin-hoja') && finales.length) {
  const cols = finales.length <= 4 ? 2 : finales.length <= 9 ? 3 : 4, ancho = 560, alto = Math.round(ancho * H / W);
  const hoja = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#dcdcdc;font:600 18px system-ui}
  .g{display:grid;grid-template-columns:repeat(${cols},${ancho}px);gap:18px;padding:18px}
  figure{margin:0;position:relative}img{width:${ancho}px;height:${alto}px;display:block;box-shadow:0 2px 8px rgba(0,0,0,.15)}
  figcaption{position:absolute;left:8px;top:8px;background:#111;color:#fff;padding:2px 8px;border-radius:4px}</style>
  <div class="g">${finales.map((f, k) => `<figure><img src="${f}"><figcaption>${k + 1}</figcaption></figure>`).join('')}</div>`;
  const hp = path.join(dirSalida, '.hoja.html');
  fs.writeFileSync(hp, hoja);
  const p2 = await browser.newPage({ viewport: { width: cols * (ancho + 18) + 18, height: 400 } });
  await p2.goto(pathToFileURL(hp).href, { waitUntil: 'load' });
  await p2.screenshot({ path: path.join(dirSalida, 'hoja.jpg'), type: 'jpeg', quality: 82, fullPage: true });
  fs.unlinkSync(hp);
  console.log(`Hoja → ${path.join(dirSalida, 'hoja.jpg')}`);
}
if (errores.length) console.error('✗ errores de la página:\n  ' + errores.join('\n  '));
await browser.close();
console.log(`Presentador: abre ${htmlPath} en el navegador (→ avanza, ← regresa, F pantalla completa)`);
process.exit(errores.length ? 1 : 0);
