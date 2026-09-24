#!/usr/bin/env node
// medir-tonos-fluent.mjs — mide el ORDEN real de los tonos de piel en Fluent (@lobehub/fluent-emoji-3d@1.1.0) y lo
// guarda en scripts/lib/tonos-fluent.json. emoji.mjs lo lee para pedir al CDN el archivo que de verdad tiene el tono.
//
//   node scripts/medir-tonos-fluent.mjs [--salida archivo.json]
//
// Por qué: en 1.1.0 el archivo 1f3fc (🏼, medio-claro) de casi todas las personas y manos sale MÁS OSCURO que el 1f3fd
// (🏽, medio): con `piel: "🏼"` un «tú» 🧑‍💻 salía rubio y el mentor 🧑‍🏫 moreno [r4, auditor-iconos: 30 de 34]. Solo las
// secuencias con 💻 y 🧑‍🤝‍🧑 vienen en orden.
//
// Cómo: para cada secuencia con persona o mano del diccionario (EMOJIS.md) y de los ejemplos, baja sus 5 tonos, toma los
// píxeles que CAMBIAN entre tonos (piel y pelo: la plantilla es la misma) y mide su luminancia media en cada tono. Si
// 🏼 sale más oscuro que 🏽, la secuencia está «cruzada». El patrón va con el tono como comodín: 1f9d1-{t}-200d-1f3eb.
// Si cambia la versión del CDN, se vuelve a correr.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { argumentos, DIR_SKILL, lanzarChromium } from './lib/pipeline.mjs';
import { formaEmoji, patronTono, CDN_FLUENT } from './lib/emoji.mjs';

const { opt } = argumentos(process.argv);
const salida = path.resolve(opt('--salida', path.join(DIR_SKILL, 'scripts', 'lib', 'tonos-fluent.json')));
const TONOS = ['1f3fb', '1f3fc', '1f3fd', '1f3fe', '1f3ff'];
const indice = new Set(fs.readFileSync(path.join(DIR_SKILL, 'pruebas', 'fluent-nombres.txt'), 'utf8').split('\n').filter(Boolean));

// ---------- qué secuencias: toda la que tenga un componente que admite tono ----------
const seg = new Intl.Segmenter('es', { granularity: 'grapheme' });
const deTexto = t => [...seg.segment(t)].map(x => formaEmoji(x.segment)).filter(Boolean);
const textos = [fs.readFileSync(path.join(DIR_SKILL, 'references', 'EMOJIS.md'), 'utf8')];
for (const d of fs.readdirSync(path.join(DIR_SKILL, 'ejemplos'))) {
  const f = path.join(DIR_SKILL, 'ejemplos', d, 'deck.json');
  if (fs.existsSync(f)) textos.push(fs.readFileSync(f, 'utf8'));
}
textos.push('🧑👨👩🧑‍💻👨‍💻👩‍💻🧑‍🏫👨‍🏫👩‍🏫🧑‍🎓👨‍🎓👩‍🎓🧑‍💼👨‍💼👩‍💼🧑‍⚕️👨‍⚕️👩‍⚕️🧑‍🍳👩‍🍳🧑‍🔧🧑‍🎨🧑‍🌾🧑‍🔬🙋🙋‍♂️🙅‍♂️💁‍♂️🕵️🤷🧍🧑‍🤝‍🧑👍👆👉✍️🤳🤲🙌💪✋👊🤝');
const base = /^\p{Emoji_Modifier_Base}$/u;
const secuencias = new Map();
for (const t of textos) for (const e of deTexto(t)) {
  const cps = [...e].map(c => c.codePointAt(0).toString(16)).filter(c => c !== 'fe0f' && !/^1f3f[b-f]$/.test(c));
  if (!cps.some(c => base.test(String.fromCodePoint(parseInt(c, 16))))) continue;
  // el tono va tras cada componente que lo admite (🧑‍🤝‍🧑 lleva dos)
  // (el 🤝 del medio de 🧑‍🤝‍🧑 no lleva tono: solo las personas)
  const conTono = tn => cps.flatMap((c, i) => (base.test(String.fromCodePoint(parseInt(c, 16))) && !(c === '1f91d' && cps.length > 1 && i > 0) ? [c, tn] : [c]));
  const nombres = TONOS.map(tn => {
    const sin = conTono(tn);
    // el índice del CDN escribe fe0f en algunos nombres (…-2695-fe0f): se busca la forma que existe
    const conFe = sin.flatMap((c, i) => (i === sin.length - 1 && parseInt(c, 16) < 0x1f000 && !/^1f3f/.test(c) ? [c, 'fe0f'] : [c]));
    return [sin.join('-'), conFe.join('-')].find(n => indice.has(n)) || '';
  });
  if (nombres.every(Boolean)) secuencias.set(patronTono(nombres[0]), { e, nombres });
}
console.log(`Midiendo ${secuencias.size} secuencias con tono…`);

// ---------- bajar ----------
// en la misma caché que emoji.mjs (el nombre del archivo es el del CDN, sin corregir)
const tmp = path.join(os.homedir(), '.cache', 'diapositivas-pizarron-ia', 'fluent');
fs.mkdirSync(tmp, { recursive: true });
const { execFileSync } = await import('node:child_process');
const datos = [];
for (const [pat, { e, nombres }] of secuencias) {
  const urls = nombres.map(n => {
    const f = path.join(tmp, n + '.webp');
    if (!(fs.existsSync(f) && fs.statSync(f).size > 200)) try { execFileSync('curl', ['-sSL', '--max-time', '20', CDN_FLUENT + n + '.webp', '-o', f]); } catch { return ''; }
    return fs.existsSync(f) && fs.statSync(f).size > 200 ? 'data:image/webp;base64,' + fs.readFileSync(f).toString('base64') : '';
  });
  if (urls.every(Boolean)) datos.push([pat, e, urls]);
  else console.warn(`  sin red para ${e} (${pat}): se omite`);
}

// ---------- medir: luminancia media de los píxeles que cambian entre tonos ----------
const browser = await lanzarChromium();
const page = await browser.newPage();
const medidas = await page.evaluate(async items => {
  const S = 160, c = new OffscreenCanvas(S, S), g = c.getContext('2d', { willReadFrequently: true });
  const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const out = {};
  for (const [pat, , urls] of items) {
    const px = [];
    for (const u of urls) { const im = new Image(); im.src = u; await im.decode(); g.clearRect(0, 0, S, S); g.drawImage(im, 0, 0, S, S); px.push(g.getImageData(0, 0, S, S).data); }
    // píxeles que cambian con el tono (piel y pelo) y, de esos, los de color piel en CADA tono: rojo > verde > azul con
    // saturación media (el pelo rubio del 🏼 cruzado y el castaño engañaban a un promedio bruto); mediana por tono
    const piel = (r, g, b) => r >= g && g >= b && r > 40 && (r - b) / r > 0.12 && (r - b) / r < 0.75;
    const vals = px.map(() => []);
    for (let i = 0; i < S * S * 4; i += 4) {
      if (px.some(d => d[i + 3] < 200)) continue;
      const ls = px.map(d => 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
      if (Math.max(...ls) - Math.min(...ls) < 0.08) continue;   // no cambia con el tono: ropa, objeto, fondo
      if (!px.every(d => piel(d[i], d[i + 1], d[i + 2]))) continue;
      ls.forEach((l, k) => vals[k].push(l));
    }
    const med = a => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
    out[pat] = vals[0].length > 30 ? vals.map(v => Math.round(med(v) * 1000) / 1000) : null;
  }
  return out;
}, datos);
await browser.close();

const cruzados = [], correctos = [];
for (const [pat, L] of Object.entries(medidas)) {
  if (!L) continue;
  (L[1] < L[2] ? cruzados : correctos).push(pat);
  const orden = (L[1] < L[2] ? [L[0], L[2], L[1], L[3], L[4]] : L).every((x, i, a) => !i || x < a[i - 1]);
  console.log(`${L[1] < L[2] ? 'CRUZADO ' : 'en orden'} ${secuencias.get(pat).e} ${pat} ${JSON.stringify(L)}${orden ? '' : '  ⚠ ni corregido baja en orden'}`);
}
const tabla = {
  version: '@lobehub/fluent-emoji-3d@1.1.0',
  nota: 'generado por scripts/medir-tonos-fluent.mjs: en «cruzados» el archivo 1f3fc es más oscuro que el 1f3fd y emoji.mjs los intercambia; una secuencia sin medir también se intercambia (es lo normal en 1.1.0). Si cambia la versión del CDN, vuelve a correrlo.',
  cruzados: cruzados.sort(), correctos: correctos.sort(),
  medidas: Object.fromEntries(Object.entries(medidas).sort()),
};
fs.writeFileSync(salida, JSON.stringify(tabla, null, 1) + '\n');
console.log(`→ ${salida}: ${cruzados.length} cruzados, ${correctos.length} en orden`);
