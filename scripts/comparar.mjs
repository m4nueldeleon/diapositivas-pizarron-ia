#!/usr/bin/env node
// comparar.mjs — mide la fidelidad de la réplica: cada lámina «r<seg>» contra el cuadro «ref_<seg>.jpg».
//
//   node scripts/comparar.mjs [<carpeta-del-deck>] <carpeta-ref> [--salida dir] [--umbral 8] [--min-parecido 0.7]
//
// Con UN solo argumento, ese argumento es la carpeta de referencias y el deck es pruebas/replica (resuelto desde la
// raíz de la skill). El deck versionado de la réplica es pruebas/replica/deck.json; los cuadros (ref_*.jpg) viven FUERA
// del repo. Es la ÚNICA evidencia de fidelidad de una ronda (comp_N.jpg con su métrica y comparar.json, sellados con
// el sha256 del deck comparado): una hoja armada a mano o con otro deck no vale. Guardas:
//   · de la carpeta de referencias solo se leen los ref_*.jpg: un deck.json que esté ahí (el deck viejo de
//     pizarron-ref/replica) se IGNORA con un aviso; nunca se compara;
//   · si ninguna lámina r<seg> trae `_cuadro` (lo que distingue a la réplica versionada), sale con código 1.
//
// Qué paso se compara: `paso_ref` de la lámina (desde 0; −1 = el último) cuando el cuadro del video es un
// momento intermedio del revelado (con `ms_ref`, ese paso se captura en ese milisegundo de su animación, p. ej. la mano
// que ya aprieta la tecla 1 antes de arrastrar la ruta); sin él, el paso que más se parece al cuadro (correlación de la densidad de
// tinta en 8×5 celdas, lib/tinta.mjs). Antes de medir encuadre se revisa que sean la MISMA escena: con correlación menor que
// --min-parecido el par es «no parece la misma lámina» (error: id desfasado o cuadro de otro momento), cuenta
// aparte y hace salir con código 1. Sale:
//   · <salida>/comp_N.jpg: 5 pares por hoja (referencia a la izquierda, nuestra lámina a la derecha), con la cabecera
//     «comparar.mjs · <deck> · sha … · umbral N · pasan/total»;
//   · <salida>/comparar.json: el deck y su deck_sha, y por par la caja de tinta de cada lado y su diferencia en % del lienzo.
// Un par FALLA si x, y, ancho o alto de la caja difieren más del umbral (8 puntos por omisión).
// Código de salida 1 si falta un par, es otra escena, rebasa el umbral geométrico o falla un ancla.
// Las bandas y la silueta cromática añaden indicios por elemento; no certifican estilo ni secuencias.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { compararSecuencia } from './lib/secuencia-referencia.mjs';
import { selloEvidencia } from './lib/hoja.mjs';
import { pathToFileURL } from 'node:url';
import { argumentos, prepararSalida, abrir, ErrorNavegador, DIR_SKILL, nuevaPagina } from './lib/pipeline.mjs';
import { anclasTinta, compararAnclas, cajaTinta, compararCajas, emparejar, densidadTinta, correlacionMiniaturas, MIN_PARECIDO, esOtraEscena } from './lib/tinta.mjs';

try {
const { pos, opt } = argumentos(process.argv);
const esRef = d => { try { return fs.statSync(d).isDirectory() && fs.readdirSync(d).some(f => /^ref_\d+\.(jpe?g|png)$/i.test(f)); } catch { return false; } };
let [dirDeck, dirRef] = pos;
if (dirDeck && !dirRef && esRef(dirDeck)) { dirRef = dirDeck; dirDeck = path.join(DIR_SKILL, 'pruebas', 'replica'); }
if (!dirDeck || !dirRef) { console.error('uso: node scripts/comparar.mjs [<carpeta-del-deck>] <carpeta-ref> [--salida dir] [--umbral 8] [--min-parecido 0.7]'); process.exit(2); }
const umbral = Number(opt('--umbral', 8)) || 8;
const minParecido = Number(opt('--min-parecido', MIN_PARECIDO));
const deckJson = fs.existsSync(dirDeck) && fs.statSync(dirDeck).isDirectory() ? path.join(dirDeck, 'deck.json') : dirDeck;
// Guarda 1: de la carpeta de referencias solo se leen los cuadros. Un deck.json ahí (el deck viejo) se ignora.
const deckJunto = path.join(dirRef, 'deck.json');
if (fs.existsSync(deckJunto) && path.resolve(deckJunto) !== path.resolve(deckJson)) {
  console.error(`⚠ ignoro ${deckJunto}: de esa carpeta solo se leen los ref_*.jpg; se compara ${path.relative(process.cwd(), deckJson) || deckJson}`);
}
// Sello de la evidencia: el sha256 del deck.json que de verdad se compara
let deckSha = '';
try { deckSha = crypto.createHash('sha256').update(fs.readFileSync(deckJson)).digest('hex').slice(0, 12); } catch { deckSha = ''; }
let prep;
try { prep = prepararSalida(dirDeck, opt('--salida') ? path.join(opt('--salida'), 'html') : undefined); } catch (e) { console.error('✗ ' + e.message); process.exit(2); }
const salida = path.resolve(opt('--salida') || path.join(prep.dirSalida, 'comparar'));
fs.mkdirSync(salida, { recursive: true });

const ids = prep.deck.laminas.map(l => l.id);
// Guarda 2: la réplica versionada anota en cada lámina qué cuadro replica (`_cuadro`); un deck sin eso no es ella
const replicas = prep.deck.laminas.filter(l => /^r\d+$/.test(String(l.id || '')));
const sinCuadro = replicas.filter(l => !l._cuadro);
if (replicas.length && sinCuadro.length === replicas.length) { console.error('✗ ninguna lámina r<seg> trae _cuadro: ¿no es pruebas/replica/deck.json?'); process.exit(1); }
sinCuadro.forEach(l => console.warn(`⚠ ${l.id} sin _cuadro: ¿no es pruebas/replica?`));
// R19: una lámina `_solo_rafaga` replica una SECUENCIA (aparición y estabilidad), no su cuadro fijo: en r103 el video usa
// fotos propias (alcancía con billetes, tragamonedas) que la skill no replica a propósito; su silueta mediría la foto.
const soloRafaga = new Set(prep.deck.laminas.filter(l => l._solo_rafaga).map(l => l.id));
const { pares, sinRef, sinLamina } = emparejar(ids.filter(id => !soloRafaga.has(id)), fs.readdirSync(dirRef).filter(f => !soloRafaga.has('r' + (f.match(/^ref_(\d+)\./) || [])[1])));
sinRef.forEach(id => console.warn(`⚠ la lámina «${id}» no tiene referencia (ref_${id.slice(1)}.jpg)`));
sinLamina.forEach(f => console.warn(`⚠ sobra la referencia ${f}: no hay lámina con id «r${f.match(/\d+/)[0]}»`));

const { browser, page } = await abrir(prep.htmlPath, prep.W, prep.H);
const aDataUrl = f => `data:image/${/png$/i.test(f) ? 'png' : 'jpeg'};base64,${fs.readFileSync(f).toString('base64')}`;
for (const par of pares) {
  const i = ids.indexOf(par.id), l = prep.deck.laminas[i];
  const lam = (await page.$$('section.lamina'))[i];
  const n = await page.evaluate(k => window.PZ.pasos(window.PZ.lams[k]), i);
  par.pasos = [];
  for (let q = 0; q < n; q++) {
    await page.evaluate(([k, x]) => window.PZ.mostrar(window.PZ.lams[k], x, Infinity), [i, q]);
    par.pasos.push('data:image/png;base64,' + (await lam.screenshot({ type: 'png' })).toString('base64'));
  }
  if (Number.isInteger(l.paso_ref)) {
    par.pasoRef = l.paso_ref < 0 ? n - 1 : l.paso_ref;
    if (l.paso_ref >= n) console.warn(`⚠ ${par.id}: paso_ref ${l.paso_ref} y la lámina tiene ${n} pasos: uso el último`);
    par.pasoRef = Math.min(par.pasoRef, n - 1);
    // `ms_ref`: el cuadro del video es un instante DENTRO de la animación del paso (la mano ya en la tecla 1 y sin ruta
    // [ref_115]): ese paso se captura en ese milisegundo, no en su estado final
    if (Number.isFinite(l.ms_ref)) {
      await page.evaluate(([k, x, ms]) => window.PZ.mostrar(window.PZ.lams[k], x, ms), [i, par.pasoRef, l.ms_ref]);
      par.pasos[par.pasoRef] = 'data:image/png;base64,' + (await lam.screenshot({ type: 'png' })).toString('base64');
    }
  }
  par.cuadro = l._cuadro || '';
  par.referencia = aDataUrl(path.join(dirRef, par.ref));
}
// Cajas de tinta: se leen los píxeles en un canvas de 480×270 (misma proporción, más rápido)
const medir = await nuevaPagina(browser);
await medir.addScriptTag({ content: [cajaTinta, densidadTinta, anclasTinta].map(f => `window.${f.name} = ${f.toString()};`).join('\n') });
for (const par of pares) {
  const medidas = await medir.evaluate(async urls => Promise.all(urls.map(async u => {
    const im = new Image(); im.src = u; await im.decode();
    const w = 480, h = Math.round(480 * im.naturalHeight / im.naturalWidth);
    const c = new OffscreenCanvas(w, h), g = c.getContext('2d'); g.drawImage(im, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    return { anclas: window.anclasTinta(d,w,h), caja: window.cajaTinta(d, w, h), mini: window.densidadTinta(d, w, h) };
  })), [par.referencia, ...par.pasos]);
  const [ref, ...nuestros] = medidas;
  const corr = nuestros.map(m => correlacionMiniaturas(ref.mini, m.mini));
  const k = par.pasoRef ?? corr.reduce((b, c, j) => (c > corr[b] ? j : b), 0);
  par.paso = k; par.parecido = +corr[k].toFixed(3); par.nuestra = par.pasos[k];
  par.elementos = compararAnclas(ref.anclas, nuestros[k].anclas);
  par.secuencia_render = prep.revela[ids.indexOf(par.id)];
  par.distinta = esOtraEscena(par.parecido, minParecido);
  Object.assign(par, { cajaRef: ref.caja, cajaNuestra: nuestros[k].caja, ...compararCajas(ref.caja, nuestros[k].caja, umbral) });
  if (!par.distinta && [par.dw, par.dh].some(v => v != null && Math.abs(v) > 30)) console.warn(`⚠ ${par.id}: la caja difiere más de 30 puntos de ancho o alto: ¿par de otro momento?`);
}
// Hojas de comparación
const pasanAhora = pares.filter(p => !p.distinta && !p.falla).length, medAhora = pares.filter(p => !p.distinta).length;
const f1 = v => (v == null ? '—' : (v > 0 ? '+' : '') + v.toFixed(1));
for (let h = 0; h * 5 < pares.length; h++) {
  const grupo = pares.slice(h * 5, h * 5 + 5);
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222;font:600 18px system-ui;color:#fff}
    .f{display:flex;gap:12px;padding:10px 12px;align-items:center}.f img{width:640px;height:360px;object-fit:contain;background:#fff}
    .r{width:170px}.r b{display:block;font-size:24px}.mal{color:#ff6b6b}.bien{color:#7ee07a}.cab{padding:10px 12px 0;font-size:20px;color:#ffd35c}</style>
    ${selloEvidencia(prep.evidencia.sello)}<div class="cab">comparar.mjs · ${path.relative(DIR_SKILL, path.resolve(deckJson)).replace(/[<&]/g, '')} · sha ${deckSha} · umbral ±${umbral} · encuadre: pasan ${pasanAhora}/${medAhora} · elementos: ${pares.filter(p => !p.distinta && !p.elementos.falla).length}/${pares.length}</div>
    ${grupo.map(p => `<div class="f"><div class="r"><b>ref_${p.seg}</b>${p.id} · paso ${p.paso + 1}<br><small>${String(p.cuadro).replace(/[<&]/g, '')}</small><br><span class="${p.falla || p.distinta || p.elementos.falla ? 'mal' : 'bien'}">${p.distinta ? 'NO ES LA MISMA' : p.falla ? 'FALLA' : p.elementos.falla ? 'REVISAR' : 'pasa'}</span> · r ${p.parecido}<br>x ${f1(p.dx)} · y ${f1(p.dy)}<br>w ${f1(p.dw)} · h ${f1(p.dh)}<br><small>Elementos: ${p.elementos.estado}<br>IoU: ${p.elementos.silueta_iou ?? "—"}<br>Secuencia: ${opt('--rafagas') ? 'informe separado en comparar.json' : 'sin referencia'}</small></div><img src="${p.referencia}"><img src="${p.nuestra}"></div>`).join('')}`;
  const hp = path.join(salida, `.comp_${h + 1}.html`);
  fs.writeFileSync(hp, html);
  const pg = await nuevaPagina(browser, { viewport: { width: 1500, height: 400 } });
  await pg.goto(pathToFileURL(hp).href, { waitUntil: 'load' });
  await pg.screenshot({ path: path.join(salida, `comp_${h + 1}.jpg`), type: 'jpeg', quality: 80, fullPage: true });
  fs.unlinkSync(hp);
}
const secuencia = await compararSecuencia({dir:opt('--rafagas'),page,medir,ids,salida});
await browser.close();

const medibles = pares.filter(p => !p.distinta), distintas = pares.filter(p => p.distinta);
const pasan = medibles.filter(p => !p.falla).length;
const elementosPasan = pares.filter(p => !p.distinta && !p.elementos.falla).length;
const informe = { fidelidad_profesional: 'pendiente-humana', elementos_pasan: elementosPasan, secuencia, secuencias: secuencia.estado, invalido: prep.evidencia.invalido, deck: path.relative(DIR_SKILL, path.resolve(deckJson)), deck_sha: deckSha, umbral, minParecido, pasan, total: medibles.length, distintas: distintas.map(p => p.id), sinRef, sinLamina,
  pares: pares.map(({ referencia, nuestra, pasos, ...p }) => p) };
fs.writeFileSync(path.join(salida, 'comparar.json'), JSON.stringify(informe, null, 2));
console.log(`Deck ${informe.deck} · sha ${deckSha}`);
console.log(`Elementos: ${elementosPasan}/${pares.length}; secuencia: ${secuencia.estado}. No acredita fidelidad profesional.`);
console.log(`Encuadre: ${pasan}/${medibles.length} pares dentro de ±${umbral}%${distintas.length ? ` · ${distintas.length} no parecen la misma lámina` : ''} · hojas en ${salida}`);
pares.forEach(p => console.log(`  ${p.distinta ? '✗✗' : p.falla || p.elementos.falla ? '✗' : '✓'} ${p.id} (paso ${p.paso + 1}, r ${p.parecido})  x ${f1(p.dx)}  y ${f1(p.dy)}  w ${f1(p.dw)}  h ${f1(p.dh)}${p.distinta ? '  ← no parece la misma lámina: ¿id o cuadro de otro momento?' : ''}`));
process.exit(sinRef.length || sinLamina.length || distintas.length || pasan < medibles.length || elementosPasan < pares.length ? 1 : 0);

} catch (error) {
  if (!(error instanceof ErrorNavegador)) throw error;
  console.error('✗ ' + error.message);
  process.exit(4);
}
