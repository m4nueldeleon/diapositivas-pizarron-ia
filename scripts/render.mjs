#!/usr/bin/env node
// render.mjs — deck.json → salida/index.html (presentador) + salida/laminas/NN-id-P.png (un PNG por paso)
//              + salida/hoja.jpg (hoja de contacto: el último paso de cada lámina, «N · id» igual que el PNG y el QA)
//              + salida/hoja-pasos.jpg (todos los pasos, una fila por lámina: el orden del revelado)
//              + salida/pasos.json (manifiesto para video y QA) + salida/hojas.json (qué hojas hay y qué láminas cubren)
//
//   node scripts/render.mjs <carpeta|deck.json> [--salida dir] [--escala 1|2] [--solo-html] [--sin-hoja] [--finales]
//                           [--pdf [--notas | --sin-notas]] [--pdf-pasos] [--pasos] [--qa]
//
//   --qa        al terminar corre qa.mjs sobre la misma salida: nota, ESTADO y la línea del arco (contrato de tiempo,
//               revelación y llamados en %), todo en qa.json
//
//   --pasos     imprime qué entra en cada paso de cada lámina (sin navegador ni PNG) y sale: para escribir la `voz` con
//               una frase por paso ANTES de renderizar (LAYOUTS.md, «Pasos que genera cada diseño»)
//   --pdf-pasos una página por PASO para Keynote/Slides, sin cursor; notas-por-paso.md lleva voz, acción y si falla.
//   --finales   solo el último paso de cada lámina (para revisar rápido; no genera hoja-pasos.jpg)
//   --pdf       además, salida/laminas.pdf: una página por lámina (su último paso, sin la mano del cursor), del tamaño
//               del formato, para mandarlo como documento o imprimir; un `stack` a sangre sale en UNA página con su remate en una
//               banda. Las `camara` no tienen página. En `propuesta`, `vsl` y `vsl-corto` (o con --notas) también
//               salida/laminas-notas.pdf: la lámina y su voz como texto, para mandarlo como documento. --sin-notas lo apaga.
// Con más de 20 láminas la hoja se pagina: hoja-01.jpg, hoja-02.jpg… (20 láminas cada una) y hoja-pasos-01.jpg…
// (10 filas cada una). hoja.jpg y hoja-pasos.jpg quedan como copia de la PRIMERA página, con el encabezado
// «hoja 1/N — revisa TODAS»: la revisión visual recorre todas.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { argumentos, prepararSalida, abrir, ErrorNavegador } from './lib/pipeline.mjs';
import { cuadrosHoja, htmlHoja, filasPasos, htmlHojaPasos, paginar, tituloPagina, archivoPagina, POR_HOJA, FILAS_POR_HOJA } from './lib/hoja.mjs';
import { duracionTotal, duracionPaso, mmss } from './lib/tiempos.mjs';
import { palabras } from './lib/markup.mjs';
import { rutaGlobal } from './lib/marca.mjs';
import { exportarPdf, exportarPdfPasos, conNotas } from './lib/pdf.mjs';
import { duracionVivo } from './lib/construir.mjs';
import { mensajeSinFirma } from './lib/reglas-deck.mjs';
import { registrarRender } from './lib/evidencia-calidad.mjs';

try {
const { opt, flag, pos } = argumentos(process.argv);
if (flag('--pdf-pasos') && flag('--finales')) { console.error('✗ --pdf-pasos es incompatible con --finales: exporta todos los pasos o solo los finales'); process.exit(2); }
if (flag('--pdf-pasos') && flag('--pasos')) console.warn('⚠ --pasos solo imprime el mapa y sale antes del navegador; quita --pasos para generar laminas-pasos.pdf');
let prep;
try { prep = prepararSalida(pos[0], opt('--salida'), { forzar: flag('--forzar') }); } catch (e) { console.error('✗ ' + e.message); process.exit(2); }
const { deck, dirSalida, htmlPath, W, H, avisos: avisosBuild, modoEmoji, pasos, revela = [] } = prep;
if (flag('--pasos')) {
  // Mapa de pasos: numerado desde 1 como la hoja; entre corchetes, cuántos textos trae la voz
  deck.laminas.forEach((l, i) => {
    const nv = Array.isArray(l.voz) ? l.voz.length : l.voz ? 1 : 0;
    const marca = l.tipo === 'camara' ? '' : nv && nv !== pasos[i] ? `  ✗ voz: ${nv} textos` : '';
    console.log(`${String(i + 1).padStart(2)} · ${l.id || l.tipo} (${l.tipo}) · ${pasos[i]} ${pasos[i] === 1 ? 'paso' : 'pasos'}${marca}`);
    (revela[i] || []).forEach((xs, k) => {
      const v = Array.isArray(l.voz) ? l.voz[k] : k === 0 ? l.voz : '', np = palabras(v), d = duracionPaso(l, k);
      const alerta = d > 5 || (l.dur != null && np / 2.7 + .35 > d + .3);
      console.log(`     paso ${k + 1}: ${xs.length ? xs.join(' + ') : '(sin cambio visible)'} · ~${d.toFixed(1)} s · ${np} palabras${alerta ? ' ⚠' : ''}`);
    });
  });
  process.exit(0);
}
const auto = !prep.crudo.emoji || prep.crudo.emoji === 'auto' ? ` (auto → ${modoEmoji} en esta máquina; fluent en Linux: fija "emoji" en el deck)` : '';
console.log(`HTML → ${htmlPath}  (${deck.laminas.length} láminas · ${W}x${H} · emoji ${modoEmoji}${auto} · voz ~${mmss(duracionTotal(deck, pasos))})`);
avisosBuild.forEach(a => console.warn('⚠ ' + a));
if (prep.firmaDe) console.log(`Firma tomada de ${prep.firmaDe}`);
else if (prep.crudo.marca === undefined) console.log(`ℹ ${mensajeSinFirma({ ficha: prep.fichaMarca, rutaGlobal: rutaGlobal() })}`);
(prep.infoDatosFicha || []).forEach(x => console.log(`ℹ ${x}`));
if (prep.avisoFirma) console.warn('⚠ ' + prep.avisoFirma);
if (prep.avisoReplica) console.warn('⚠ ' + prep.avisoReplica);
if (prep.evidencia.invalido) fs.writeFileSync(path.join(dirSalida, 'NO-VALE.txt'), `deck_sha: ${prep.evidencia.deck_sha}\nla fidelidad se mide con node scripts/comparar.mjs <carpeta-ref>\n`);
else if (flag('--forzar')) fs.rmSync(path.join(dirSalida, 'NO-VALE.txt'), { force: true });
if (flag('--solo-html')) process.exit(prep.evidencia.invalido ? 3 : 0);

const escala = Number(opt('--escala', 1));
const soloFinales = flag('--finales');
// Primero arranca Chromium. Los archivos anteriores sobreviven a cualquier fallo de captura.
const { browser, page, errores, avisos } = await abrir(htmlPath, W, H, { escala });
const temporal = fs.mkdtempSync(path.join(dirSalida, '.render-'));
const laminasDir = prep.evidencia.laminas_dir, prefijoPng = prep.evidencia.invalido ? 'NO-VALE-' : '';
const dirPng = path.join(temporal, laminasDir);
fs.mkdirSync(dirPng, { recursive: true });
try {
avisos.forEach(a => console.warn('⚠ ' + a));
const manifiesto = [];
const lams = await page.$$('section.lamina');
for (let i = 0; i < lams.length; i++) {
  const l = deck.laminas[i];
  const n = await page.evaluate(k => window.PZ.pasos(window.PZ.lams[k]), i);
  if (l.tipo === 'camara' && l.vivo !== true) { manifiesto.push({ lamina: i, id: l.id || 'camara', tipo: 'camara', paso: 0, pasos: 1, laminas_dir: laminasDir, archivo: null }); continue; }
  // Tramo en vivo: se captura lo que ve el público (la consigna con su reloj congelado en `dur`), no un cuadro gris
  if (l.tipo === 'camara') {
    const nombre = `${prefijoPng}${String(i + 1).padStart(2, '0')}-${String(l.id || 'vivo').replace(/[^\w-]/g, '') || 'vivo'}-1.png`;
    await page.evaluate(k => window.PZ.lams[k].classList.add('captura-vivo'), i);
    await lams[i].screenshot({ path: path.join(dirPng, nombre), type: 'png' });
    await page.evaluate(k => window.PZ.lams[k].classList.remove('captura-vivo'), i);
    manifiesto.push({ lamina: i, id: l.id || 'vivo', tipo: 'camara', vivo: true, dur: duracionVivo(l), paso: 0, pasos: 1, laminas_dir: laminasDir, archivo: `${laminasDir}/${nombre}`, revela: ['consigna en vivo'] });
    continue;
  }
  // pasos clave: un layout cuyo cierre tapa lo anterior (stack a sangre + remate) marca data-clave-paso
  const claves = new Set(await page.evaluate(k => [...window.PZ.lams[k].querySelectorAll('[data-clave-paso]')]
    .map(e => Number(e.dataset.clavePaso)), i).then(v => v.filter(q => Number.isInteger(q) && q >= 0 && q < n - 1)));
  for (let p = 0; p < n; p++) {
    if (soloFinales && p < n - 1 && !claves.has(p)) continue;
    await page.evaluate(([k, q]) => window.PZ.mostrar(window.PZ.lams[k], q, Infinity), [i, p]);
    const nombre = `${prefijoPng}${String(i + 1).padStart(2, '0')}-${String(l.id || l.tipo).replace(/[^\w-]/g, '') || 'lamina'}-${p + 1}.png`;
    await lams[i].screenshot({ path: path.join(dirPng, nombre), type: 'png' });
    manifiesto.push({ lamina: i, id: l.id || l.tipo, tipo: l.tipo, paso: p, pasos: n, laminas_dir: laminasDir, archivo: `${laminasDir}/${nombre}`, revela: (revela[i] || [])[p] || [], ...(claves.has(p) ? { clave: true } : {}) });
  }
}
fs.writeFileSync(path.join(temporal, 'pasos.json'), JSON.stringify(manifiesto, null, 2));
console.log(`PNG → ${path.join(dirSalida, laminasDir)} (${manifiesto.filter(m => m.archivo).length} imágenes de ${lams.length} láminas)`);

// Captura de una hoja de contacto (HTML temporal junto a los PNG)
async function capturar(html, ancho, destino) {
  const hp = path.join(temporal, '.hoja.html');
  fs.writeFileSync(hp, html);
  const p2 = await browser.newPage({ viewport: { width: ancho, height: 400 } });
  await p2.goto(pathToFileURL(hp).href, { waitUntil: 'load' });
  await p2.screenshot({ path: destino, type: 'jpeg', quality: 82, fullPage: true });
  await p2.close();
  fs.unlinkSync(hp);
  console.log(`Hoja → ${path.join(dirSalida, path.basename(destino))}`);
}
if (prep.evidencia.invalido) console.warn('⚠ láminas NO VALE: la fidelidad se mide con node scripts/comparar.mjs <carpeta-ref>');
const cuadros = cuadrosHoja(manifiesto);
// El manifiesto se prepara junto a las capturas nuevas y se publica al terminar todas las hojas.
const hojasJson = path.join(temporal, 'hojas.json');
if (!flag('--sin-hoja') && cuadros.some(c => c.archivo)) {
  const hojas = { laminas_dir: laminasDir, hojas: [], pasos: [], invalido: prep.evidencia.invalido, deck_sha: prep.evidencia.deck_sha };
  const total = deck.laminas.length;
  const paginas = paginar(cuadros, POR_HOJA);
  for (let k = 0; k < paginas.length; k++) {
    const h = htmlHoja(paginas[k], { W, H, sello: prep.evidencia.sello, titulo: tituloPagina(paginas[k], k, paginas.length, total) });
    const archivo = archivoPagina('hoja', k, paginas.length);
    await capturar(h.html, h.cols * (h.ancho + 18) + 18, path.join(temporal, archivo));
    hojas.hojas.push({ archivo, desde: paginas[k][0].n, hasta: paginas[k][paginas[k].length - 1].n });
  }
  if (paginas.length > 1) fs.copyFileSync(path.join(temporal, archivoPagina('hoja', 0, paginas.length)), path.join(temporal, 'hoja.jpg'));
  const filas = filasPasos(manifiesto);
  if (!soloFinales && filas.length) {
    const pp = paginar(filas, FILAS_POR_HOJA);
    for (let k = 0; k < pp.length; k++) {
      const hp = htmlHojaPasos(pp[k], { W, H, sello: prep.evidencia.sello, titulo: tituloPagina(pp[k], k, pp.length, total) });
      const archivo = archivoPagina('hoja-pasos', k, pp.length);
      await capturar(hp.html, hp.anchoTotal, path.join(temporal, archivo));
      hojas.pasos.push({ archivo, desde: pp[k][0].n, hasta: pp[k][pp[k].length - 1].n });
    }
    if (pp.length > 1) fs.copyFileSync(path.join(temporal, archivoPagina('hoja-pasos', 0, pp.length)), path.join(temporal, 'hoja-pasos.jpg'));
  }
  fs.writeFileSync(hojasJson + '.tmp', JSON.stringify(hojas, null, 2));
  fs.renameSync(hojasJson + '.tmp', hojasJson);
  if (paginas.length > 1) console.log(`⚠ ${paginas.length} hojas de finales (${hojas.hojas.map(x => `${x.archivo}: ${x.desde}-${x.hasta}`).join(' · ')}): la revisión visual recorre TODAS, no solo hoja.jpg`);
}

// Publica únicamente después de capturar todas las hojas y todos los pasos.
fs.readdirSync(dirSalida).filter(f => f === 'laminas' || f === 'laminas-NO-VALE' || f === 'pasos.json' || f === 'hojas.json' || /^hoja(-pasos)?(-\d+)?\.jpg$/.test(f))
  .forEach(f => fs.rmSync(path.join(dirSalida, f), { recursive: true, force: true }));
for (const archivo of fs.readdirSync(temporal)) fs.renameSync(path.join(temporal, archivo), path.join(dirSalida, archivo));
} catch (error) {
  await browser.close();
  throw error;
} finally { fs.rmSync(temporal, { recursive: true, force: true }); }

// PDF para mandar (lib/pdf.mjs): una página por lámina sin cursor, el stack con su remate en una página, y en
// propuesta o VSL además laminas-notas.pdf con la voz como texto
if (flag('--pdf')) {
  const notas = conNotas(deck.pieza, { notas: flag('--notas'), sinNotas: flag('--sin-notas') });
  const r = await exportarPdf({ browser, page, deck, dirSalida, W, H, notas });
  if (r.paginas) console.log(`PDF → ${path.join(dirSalida, 'laminas.pdf')} (${r.paginas} páginas, una por lámina)${r.notas ? ` + laminas-notas.pdf (la lámina y su voz como texto)` : ''}`);
  r.avisos.forEach(a => console.warn('⚠ ' + a));
}
if (flag('--pdf-pasos')) {
  const r = await exportarPdfPasos({ browser, page, deck, dirSalida, W, H, conservarResumen: flag('--pdf') });
  console.log(`PDF → ${path.join(dirSalida, 'laminas-pasos.pdf')} (${r.paginas_pasos} páginas) + notas-por-paso.md`);
  r.avisos.forEach(a => console.warn('⚠ ' + a));
}
if (errores.length) console.error('✗ errores de la página:\n  ' + errores.join('\n  '));
await browser.close();
if (!errores.length && !prep.evidencia.invalido) registrarRender(dirSalida, { ...prep.evidencia, html_sha: prep.html_sha });
console.log(`Presentador: abre ${htmlPath} (→ avanza, ← regresa, N notas, O vista de ensayo, B negro, 5 G salta, ? ayuda)`);
// --qa: corre QA sobre la misma salida al terminar (ESTADO, falta_para_final y la línea del arco: contrato, revelación y
// llamados en %), para que la entrega salga de qa.json y no de juntar a mano (SKILL §4)
if (flag('--qa')) {
  const { spawnSync } = await import('node:child_process');
  const q = spawnSync(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'qa.mjs'), prep.jsonPath, '--salida', dirSalida], { stdio: 'inherit' });
  process.exit(errores.length ? 1 : prep.evidencia.invalido ? 3 : q.status ?? 1);
}
process.exit(errores.length ? 1 : prep.evidencia.invalido ? 3 : 0);

} catch (error) {
  if (!(error instanceof ErrorNavegador)) throw error;
  console.error('✗ ' + error.message);
  process.exit(4);
}
