#!/usr/bin/env node
// medir-emojis.mjs — mide UNA vez qué tanto se ve cada emoji sobre cada fondo, en los dos sets, y lo guarda en
// scripts/lib/contraste-emojis.json. QA solo lee ese archivo (no mide en cada corrida).
//
//   node scripts/medir-emojis.mjs [--todos] [--salida archivo.json]
//
// Qué emojis: los del diccionario (references/EMOJIS.md), los de la tabla BAJO_CONTRASTE (y sus sustitutos) y
// los de los demos. `--todos` mide el índice completo de Fluent (pruebas/fluent-nombres.txt; tarda: baja
// ~3,400 imágenes la primera vez).
//
// Métrica (0-100): de los píxeles opacos del glifo, el % que se DISTINGUE del fondo: contraste ≥ 2:1 contra
// el fondo o ΔE76 (Lab) ≥ 40 (la misma de lib/contraste-color.mjs). Antes contaba «saturación ≥ 0.45», que daba por
// visible un glifo saturado sobre un fondo igual de saturado. Un 💬 de Fluent (lila casi blanco) da 0; un 💰 da 100.
// Fondos: claro (#ffffff), tarjeta (#f3f3f3: tarjeta, cuadro, bento) y oscura (#0b0b0e).
// Apple se mide con la fuente del sistema (solo en macOS); Fluent con la imagen 3D del CDN (caché en disco).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { argumentos, DIR_SKILL } from './lib/pipeline.mjs';
import { cargarPlaywright } from './lib/playwright.mjs';
import { resolverFluent, BAJO_CONTRASTE, formaEmoji } from './lib/emoji.mjs';
import { puntuarGlifo } from './lib/contraste-color.mjs';

const { flag, opt } = argumentos(process.argv);
const salida = path.resolve(opt('--salida', path.join(DIR_SKILL, 'scripts', 'lib', 'contraste-emojis.json')));
const FONDOS = { claro: [255, 255, 255], tarjeta: [243, 243, 243], oscura: [11, 11, 14] };

// ---------- qué emojis ----------
const seg = new Intl.Segmenter('es', { granularity: 'grapheme' });
const deTexto = t => [...seg.segment(t)].map(x => formaEmoji(x.segment)).filter(Boolean);
const conjunto = new Set();
deTexto(fs.readFileSync(path.join(DIR_SKILL, 'references', 'EMOJIS.md'), 'utf8')).forEach(e => conjunto.add(e));
for (const modo of Object.values(BAJO_CONTRASTE)) for (const t of Object.values(modo)) for (const [a, b] of Object.entries(t)) { deTexto(a).forEach(e => conjunto.add(e)); deTexto(b).forEach(e => conjunto.add(e)); }
for (const d of ['demo']) {
  const f = path.join(DIR_SKILL, 'ejemplos', d, 'deck.json');
  if (fs.existsSync(f)) deTexto(fs.readFileSync(f, 'utf8')).forEach(e => conjunto.add(e));
}
// sospechosos que reportaron las auditorías (Fluent lila pálido, Apple blanco sobre blanco)
deTexto('⚙️🔧📨📃🗒️☁️⛅🌥️🌐🖱️📑🛠️🏪📧📋👆🤔❓📞☎️🗣️🎤💬🗨️💭✉️📩🧾📄🏷️🤍🏳️').forEach(e => conjunto.add(e));
if (flag('--todos')) {
  fs.readFileSync(path.join(DIR_SKILL, 'pruebas', 'fluent-nombres.txt'), 'utf8').split('\n').filter(Boolean)
    .forEach(c => conjunto.add(String.fromCodePoint(...c.split('-').map(x => parseInt(x, 16)))));
}
// La clave de la tabla va sin FE0F (igual que BAJO_CONTRASTE)
const clave = e => e.replace(/️/g, '');
const lista = [...new Map([...conjunto].map(e => [clave(e), e])).values()];
console.log(`Midiendo ${lista.length} emojis…`);

// ---------- Fluent: imágenes ----------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-medir-'));
const fluent = {};
for (const e of lista) {
  const rel = resolverFluent(e, tmp);
  if (rel) fluent[clave(e)] = 'data:image/webp;base64,' + fs.readFileSync(path.join(tmp, rel)).toString('base64');
}

const { chromium } = cargarPlaywright(DIR_SKILL);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.addScriptTag({ content: `window.puntuarGlifo = ${puntuarGlifo.toString()};` });
const medir = await page.evaluate(async ([items, fondos, apple]) => {
  const S = 128;
  const c = new OffscreenCanvas(S, S), g = c.getContext('2d', { willReadFrequently: true });
  const puntuar = datos => Object.fromEntries(Object.entries(fondos).map(([nom, f]) => [nom, window.puntuarGlifo(datos, f)]));
  const r = { apple: {}, fluent: {} };
  for (const [k, e, src] of items) {
    if (apple) {
      g.clearRect(0, 0, S, S); g.font = `${S * 0.8}px "Apple Color Emoji"`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(e, S / 2, S / 2);
      r.apple[k] = puntuar(g.getImageData(0, 0, S, S).data);
    }
    if (src) {
      const im = new Image(); im.src = src;
      try { await im.decode(); g.clearRect(0, 0, S, S); g.drawImage(im, 0, 0, S, S); r.fluent[k] = puntuar(g.getImageData(0, 0, S, S).data); } catch {}
    }
  }
  return r;
}, [lista.map(e => [clave(e), e, fluent[clave(e)] || null]), FONDOS, process.platform === 'darwin']);
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });

// Tabla por set y fondo: { apple: { claro: { '💬': 100, … }, tarjeta: {…}, oscura: {…} }, fluent: {…} }
const tabla = { metrica: '% de píxeles del glifo con contraste ≥ 2:1 contra el fondo o ΔE76 ≥ 40', fondos: FONDOS, apple: {}, fluent: {} };
for (const set of ['apple', 'fluent']) for (const f of Object.keys(FONDOS)) {
  tabla[set][f] = Object.fromEntries(Object.entries(medir[set]).filter(([, v]) => v[f] != null).map(([k, v]) => [k, v[f]]).sort());
}
if (!Object.keys(tabla.apple.claro).length && fs.existsSync(salida)) {
  // fuera de macOS no se puede medir Apple: se conserva lo que ya estaba medido
  try { tabla.apple = JSON.parse(fs.readFileSync(salida, 'utf8')).apple || {}; } catch {}
}
fs.writeFileSync(salida, JSON.stringify(tabla, null, 1) + '\n');
const bajos = (set, f, u = 20) => Object.entries(tabla[set][f] || {}).filter(([, v]) => v < u).map(([k, v]) => `${k} ${v}`).join('  ');
console.log(`→ ${salida}`);
for (const set of ['apple', 'fluent']) for (const f of Object.keys(FONDOS)) console.log(`${set}/${f} < 20: ${bajos(set, f)}`);
