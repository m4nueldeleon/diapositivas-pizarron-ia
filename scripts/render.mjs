#!/usr/bin/env node
// render.mjs — deck.json → salida/index.html (presentador) + salida/laminas/NN-id-P.png (un PNG por paso)
//              + salida/hoja.jpg (hoja de contacto: el último paso de cada lámina, «N · id» igual que el PNG y el QA)
//              + salida/hoja-pasos.jpg (todos los pasos, una fila por lámina: el orden del revelado)
//              + salida/pasos.json (manifiesto para video y QA)
//
//   node scripts/render.mjs <carpeta|deck.json> [--salida dir] [--escala 1|2] [--solo-html] [--sin-hoja] [--finales]
//
//   --finales   solo el último paso de cada lámina (para revisar rápido; no genera hoja-pasos.jpg)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { argumentos, prepararSalida, abrir } from './lib/pipeline.mjs';
import { cuadrosHoja, htmlHoja, filasPasos, htmlHojaPasos } from './lib/hoja.mjs';
import { duracionTotal, mmss } from './lib/tiempos.mjs';

const { opt, flag, pos } = argumentos(process.argv);
let prep;
try { prep = prepararSalida(pos[0], opt('--salida')); } catch (e) { console.error('✗ ' + e.message); process.exit(2); }
const { deck, dirSalida, htmlPath, W, H, avisos: avisosBuild, modoEmoji, pasos } = prep;
console.log(`HTML → ${htmlPath}  (${deck.laminas.length} láminas · ${W}x${H} · emoji ${modoEmoji} · voz ~${mmss(duracionTotal(deck, pasos))})`);
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
  }
}
fs.writeFileSync(path.join(dirSalida, 'pasos.json'), JSON.stringify(manifiesto, null, 2));
console.log(`PNG → ${dirPng} (${manifiesto.filter(m => m.archivo).length} imágenes de ${lams.length} láminas)`);

// Captura de una hoja de contacto (HTML temporal junto a los PNG)
async function capturar(html, ancho, destino) {
  const hp = path.join(dirSalida, '.hoja.html');
  fs.writeFileSync(hp, html);
  const p2 = await browser.newPage({ viewport: { width: ancho, height: 400 } });
  await p2.goto(pathToFileURL(hp).href, { waitUntil: 'load' });
  await p2.screenshot({ path: destino, type: 'jpeg', quality: 82, fullPage: true });
  await p2.close();
  fs.unlinkSync(hp);
  console.log(`Hoja → ${destino}`);
}
const cuadros = cuadrosHoja(manifiesto);
if (!flag('--sin-hoja') && cuadros.some(c => c.archivo)) {
  const h = htmlHoja(cuadros, { W, H });
  await capturar(h.html, h.cols * (h.ancho + 18) + 18, path.join(dirSalida, 'hoja.jpg'));
  const filas = filasPasos(manifiesto);
  fs.rmSync(path.join(dirSalida, 'hoja-pasos.jpg'), { force: true });
  if (!soloFinales && filas.length) { const hp = htmlHojaPasos(filas, { W, H }); await capturar(hp.html, hp.anchoTotal, path.join(dirSalida, 'hoja-pasos.jpg')); }
}
if (errores.length) console.error('✗ errores de la página:\n  ' + errores.join('\n  '));
await browser.close();
console.log(`Presentador: abre ${htmlPath} (→ avanza, ← regresa, N notas, O vista de ensayo, B negro, 5 G salta, ? ayuda)`);
process.exit(errores.length ? 1 : 0);
