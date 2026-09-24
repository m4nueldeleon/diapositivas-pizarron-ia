// emoji.mjs — el emoji es el ícono del estilo. Dos fuentes:
//   · «apple»  : la fuente Apple Color Emoji del sistema (idéntico a la referencia; solo en macOS).
//   · «fluent» : Microsoft Fluent Emoji 3D (licencia MIT) desde jsDelivr, cacheado en disco. Se ve
//                igual en cualquier máquina (Linux, VPS, Windows).
//   · «auto»   : apple en macOS, fluent en lo demás.
//
// Sintaxis de emoji compuesto (la firma del estilo: un ícono que cuenta una idea entera):
//   "💰"            simple
//   "🧑‍⚕️+💰"        base + insignia abajo a la derecha (médico que gana dinero)
//   "no:🎥"          base + ❌ abajo a la izquierda (sin grabar video)
//   "si:🤖"          base + ✅ abajo a la izquierda
//   "no:🧑‍⚕️+💰"      las dos cosas: ❌ a la izquierda y 💰 a la derecha
// Un solo «+». Para contar una secuencia (🔁 → 💰) se usa un «flujo», no una insignia.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { escapar } from './markup.mjs';

const CDN = 'https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@1.1.0/assets/';
export const CDN_FLUENT = CDN;
const CACHE = path.join(os.homedir(), '.cache', 'diapositivas-pizarron-ia', 'fluent');

export function modoEmoji(pedido = 'auto') {
  if (pedido === 'apple' || pedido === 'fluent') return pedido;
  return process.platform === 'darwin' ? 'apple' : 'fluent';
}

export function codigo(ch, conFE0F = true) {
  const cps = [...ch].map(c => c.codePointAt(0).toString(16));
  return (conFE0F ? cps : cps.filter(c => c !== 'fe0f')).join('-');
}

// Devuelve 'ok', '404' (no existe en el CDN: se recuerda) o 'red' (falla pasajera: NO se recuerda)
function bajar(url, destino) {
  let codigoHttp = '';
  try { codigoHttp = execFileSync('curl', ['-sSL', '--max-time', '20', '-w', '%{http_code}', url, '-o', destino], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { codigoHttp = ''; }
  const ok = codigoHttp === '200' && fs.existsSync(destino) && fs.statSync(destino).size > 200;
  if (!ok) try { fs.unlinkSync(destino); } catch {}
  return ok ? 'ok' : codigoHttp === '404' ? '404' : 'red';
}

// Variantes de una secuencia de code points: tal cual, sin FE0F, y con FE0F donde la secuencia completa lo lleva
function variantes(cps) {
  const sin = cps.filter(c => c !== 'fe0f');
  const completo = [];
  sin.forEach((c, i) => {
    completo.push(c);
    const sig = sin[i + 1];
    const esSimbolo = parseInt(c, 16) < 0x1f000 && c !== '200d' && !/^(20e3|1f3f[b-f])$/.test(c);
    if (c !== '200d' && (sig === '200d' || i === sin.length - 1) && esSimbolo) completo.push('fe0f');
  });
  return [cps.join('-'), sin.join('-'), completo.join('-'), sin.join('-') + '-fe0f'];
}

// Equivalencias de sentido: cuando Fluent no tiene la secuencia, el emoji que dice lo mismo
const EQUIVALENTES = { '1faf1-200d-1faf2': '1f91d' };   // 🫱‍🫲 (dos manos) → 🤝 apretón de manos
const TONO = /^1f3f[b-f]$/;

// ---------- tonos 🏼/🏽 cruzados en Fluent 1.1.0 ----------
// En casi todas las personas y manos del paquete el archivo 1f3fc (🏼) es MÁS oscuro que el 1f3fd (🏽): con `piel: "🏼"`
// el «tú» 🧑‍💻 salía rubio y el mentor 🧑‍🏫 moreno [r4]. scripts/medir-tonos-fluent.mjs mide cada secuencia y deja en
// tonos-fluent.json cuáles vienen cruzadas y cuáles en orden (las de 💻 y 🧑‍🤝‍🧑). Una secuencia sin medir se intercambia:
// es lo normal en 1.1.0. El intercambio es EXACTO (el tono que se pide es el que se ve), no una aproximación.
export const patronTono = nombre => String(nombre).split('-').filter(c => c !== 'fe0f').map(c => (TONO.test(c) ? '{t}' : c)).join('-');
let tonosFluent = null;
function tablaTonos() {
  if (tonosFluent) return tonosFluent;
  try { const t = JSON.parse(fs.readFileSync(new URL('./tonos-fluent.json', import.meta.url), 'utf8')); tonosFluent = { cruzados: new Set(t.cruzados || []), correctos: new Set(t.correctos || []) }; }
  catch { tonosFluent = { cruzados: new Set(), correctos: new Set() }; }
  return tonosFluent;
}
export function corregirTono(cps) {
  if (!cps.some(c => c === '1f3fc' || c === '1f3fd')) return cps;
  if (tablaTonos().correctos.has(patronTono(cps.join('-')))) return cps;
  return cps.map(c => (c === '1f3fc' ? '1f3fd' : c === '1f3fd' ? '1f3fc' : c));
}

// Nombres a probar en el CDN, en orden y sin repetir:
//   1) la secuencia tal cual (muchos tonos de piel sí existen, como 👍🏽 1f44d-1f3fd);
//   2) la misma secuencia sin tonos de piel (🧑🏻‍🤝‍🧑🏿 → 🧑‍🤝‍🧑, 🤝🏽 → 🤝);
//   3) una equivalencia de sentido (🫱🏼‍🫲🏿 → 🤝);
//   4) si es una secuencia ZWJ: su primer componente sin tono (⛓️‍💥 → ⛓️, 🐦‍🔥 → 🐦, 🙂‍↔️ → 🙂).
//      Los pasos 3 y 4 pierden matiz: resolverFluent lo reporta como «aproximado».
//   Pasar de un emoji con tono a su forma sin tono (paso 2) también pierde matiz: se reporta como «aproximado».
export function candidatos(ch) {
  const cps = corregirTono([...ch].map(c => c.codePointAt(0).toString(16)));
  const direccional = /-200d-27a1(?:-fe0f)?$/.test(cps.join('-'));
  const raiz = direccional ? cps.slice(0, cps.lastIndexOf('200d')) : cps;
  const sinTono = raiz.filter(c => !TONO.test(c));
  const lista = [...variantes(raiz), ...variantes(cps), ...variantes(sinTono)];
  const exactos = new Set([...variantes(raiz), ...variantes(cps)]);
  const espejos = new Set(direccional ? [...variantes(raiz), ...variantes(sinTono)] : []);
  const base = sinTono.filter(c => c !== 'fe0f').join('-');
  if (EQUIVALENTES[base]) lista.push(...variantes(EQUIVALENTES[base].split('-')));
  if (sinTono.includes('200d')) {
    const respaldo = variantes(sinTono.slice(0, sinTono.indexOf('200d')));
    lista.push(...respaldo);
    if (direccional) respaldo.forEach(c => espejos.add(c));
  }
  const unicos = [...new Set(lista)];
  return Object.assign(unicos, { exactos, espejos });
}

export function imagenFluent(ch, src, clase = '') {
  const codigo = path.basename(src, '.webp');
  const espejo = candidatos(ch).espejos.has(codigo) ? ' style="transform:scaleX(-1)"' : '';
  return `<img class="${escapar(clase)}" src="${escapar(src)}" alt="${escapar(ch)}" draggable="false"${espejo}>`;
}

// Descarga (una vez) el PNG/WebP 3D y lo copia a la carpeta de salida. Devuelve la ruta relativa o null.
export function resolverFluent(ch, dirSalida, aproximados) {
  fs.mkdirSync(CACHE, { recursive: true });
  const lista = candidatos(ch);
  for (const c of lista) {
    const cache = path.join(CACHE, `${c}.webp`);
    const falla = cache + '.404';
    if (fs.existsSync(cache) && fs.statSync(cache).size <= 200) fs.unlinkSync(cache);
    if (!fs.existsSync(cache) && !fs.existsSync(falla)) {
      const r = bajar(CDN + c + '.webp', cache);
      if (r === '404') { try { fs.writeFileSync(falla, ''); } catch {} }
      if (r !== 'ok') continue;
    }
    if (fs.existsSync(cache)) {
      const dir = path.join(dirSalida, 'emoji');
      fs.mkdirSync(dir, { recursive: true });
      const dst = path.join(dir, `${c}.webp`);
      if (!fs.existsSync(dst)) fs.copyFileSync(cache, dst);
      if (aproximados && !lista.exactos.has(c)) aproximados.set(ch, String.fromCodePoint(...c.split('-').map(x => parseInt(x, 16))));
      return `emoji/${c}.webp`;
    }
  }
  return null;
}

// Glifos que se dibujan igual en cualquier sistema (la ✕ gruesa y las siluetas de la referencia)
const SIL = (x, s = 1) => `<circle cx="${12 * s + x}" cy="${8 * s}" r="${4.6 * s}" fill="url(#pz-sil)"/><path d="M${x + 3 * s} ${22 * s}c0-5 ${4 * s}-${8.2 * s} ${9 * s}-${8.2 * s}s${9 * s} ${3.2 * s} ${9 * s} ${8.2 * s}z" fill="url(#pz-sil)"/>`;
// Los degradados se definen UNA vez fuera de las láminas (construir.mjs → DEFS_GLOBALES): si vivieran dentro de una
// lámina oculta, las demás láminas los perderían en el presentador. Los de objeto (calendario, hoja, celular, burbuja,
// flecha) le dan al SVG el volumen de su set: cuerpo con degradado vertical, brillo blanco arriba y la sombra suave
// que pone base.css (`.emo svg.vol`). Plano, el SVG se veía clip-art junto a los emojis 3D [r3: 📅 del llamado].
const DEG = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
export const DEFS_GLOBALES = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
  + DEG('pz-sil', '#90a6be', '#5c7390') + DEG('pz-sil-claro', '#ffffff', '#dfe6f2') + DEG('pz-ok', '#45c91f', '#1f9a0d') + DEG('pz-pantalla', '#5b8def', '#9b6ee0')
  + DEG('pz-boleto', '#ffd84d', '#f2a900', 1, 1) + DEG('pz-cal-cab', '#ff7a7e', '#d8343a') + DEG('pz-cal-cuerpo', '#ffffff', '#e2e7ee')
  + DEG('pz-anillo', '#b9c0cb', '#6f7784') + DEG('pz-hoja', '#ffffff', '#dde3ec') + DEG('pz-doblez', '#7aaaff', '#2f68e6')
  + DEG('pz-marco', '#4a4a4f', '#0d0d0f') + DEG('pz-chat', '#45a8ff', '#0a66dc') + DEG('pz-flecha', '#52b2ff', '#1466dc')
  + '<linearGradient id="pz-brillo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
  + '</defs></svg>';
const DEF_SIL = '';
// Un SVG de objeto: la clase `vol` le da la sombra (base.css) y QA sabe que es un glifo con volumen
const OBJ = cuerpo => `<svg class="vol" viewBox="0 0 24 24" width="100%" height="100%">${cuerpo}</svg>`;
// La ✕ llena su caja (la insignia de «no:» cruza la esquina del emoji como en ref_628) y la ✅ es verde
// saturado con palomita gruesa: el ✅ de Fluent es verde menta pálido y se perdía sobre el cuadrante verde.
// La ✕ lleva un halo blanco debajo (6 de ancho, llega de 0.5 a 23.5: cabe en la caja de 24): sobre 🎯 ❤️ 🧰 o el boleto,
// el rojo sobre rojo solo se leía donde la ✕ salía del glifo [r5, prueba-no]. Sobre blanco el halo no se ve [ref_628].
const EQUIS = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path class="halo" d="M3.5 3.5 20.5 20.5M20.5 3.5 3.5 20.5" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M3.5 3.5 20.5 20.5M20.5 3.5 3.5 20.5" stroke="#d3121f" stroke-width="3.6" stroke-linecap="round"/></svg>';
const PALOMITA = '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="url(#pz-ok)"/><path d="M6.6 12.4l3.6 3.6 7.4-8" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// 📱 celular: vertical (1:2), marco negro con degradado, pantalla con brillo y rejilla de apps de color, igual en Apple
// y en Fluent. El 📱 de Fluent es una tableta morada que se confunde con 📅 (EMOJIS.md, «Se ven distinto según el modo»).
// `dx` lo corre a la derecha: 📲 es el mismo celular con una flecha azul que entra (el 📲 de Fluent también era
// la tableta morada). La flecha es una pieza RELLENA con contorno blanco que arranca en x ≥ 0.9: como trazo de 4.2 con
// punta redonda desde x = 0.9 se salía del viewBox y la cola salía cortada en seco [r3, short 08-comenta].
const APPS = ['#ff5f57', '#ffbd2e', '#28c840', '#5ac8fa', '#af52de', '#ff9500', '#34c759', '#007aff', '#ff2d55', '#ffcc00', '#30b0c7', '#5856d6'];
const f1 = v => (Math.round(v * 100) / 100).toString();
const cuerpoCelular = (dx = 0) => `<rect x="${f1(6.2 + dx)}" y="0.6" width="11.6" height="22.8" rx="2.7" fill="url(#pz-marco)"/>`
  + `<rect x="${f1(7.2 + dx)}" y="2" width="9.6" height="20" rx="1.7" fill="url(#pz-pantalla)"/><rect x="${f1(10.3 + dx)}" y="1.3" width="3.4" height="1" rx=".5" fill="#1c1c1e"/>`
  + APPS.map((c, k) => `<rect x="${f1(7.8 + dx + (k % 3) * 3.1)}" y="${f1(4 + Math.floor(k / 3) * 3.1)}" width="2.2" height="2.2" rx=".6" fill="${c}"/>`).join('')
  + `<rect x="${f1(7.8 + dx)}" y="18.2" width="8.4" height="2.9" rx=".9" fill="#fff" fill-opacity=".35"/>`
  + ['#28c840', '#007aff', '#ff9500'].map((c, k) => `<rect x="${f1(8.1 + dx + k * 2.75)}" y="18.55" width="2.2" height="2.2" rx=".6" fill="${c}"/>`).join('')
  + `<path d="M${f1(7.2 + dx)} 3.7a1.7 1.7 0 0 1 1.7-1.7h6.2L${f1(7.2 + dx)} 12.6z" fill="url(#pz-brillo)" opacity=".55"/>`
  + `<rect x="${f1(6.9 + dx)}" y="1" width="10.2" height=".5" rx=".25" fill="#fff" fill-opacity=".22"/>`;
const CELULAR = OBJ(cuerpoCelular());
const CELULAR_ENTRA = OBJ(cuerpoCelular(3.6)
  + '<path d="M1.5 10.2H5.1V7.3L9.5 12 5.1 16.7V13.8H1.5z" fill="url(#pz-flecha)" stroke="#fff" stroke-width="1.1" stroke-linejoin="round" paint-order="stroke"/>');
// 📅 📆 🗓 calendario SIN fecha, SOLO en apple: el de Apple imprime «JUL 17» (una fecha falsa en un deck que habla de
// otra). En Fluent los tres son 3D, sin texto y distintos entre sí (liso, con argollas, con espiral): salen nativos.
// Cuerpo blanco con degradado, encabezado rojo con brillo, dos argollas y una celda marcada.
const CALENDARIO = OBJ('<rect x="2.3" y="3.6" width="19.4" height="18.4" rx="2.8" fill="url(#pz-cal-cuerpo)" stroke="#c3cad4" stroke-width=".6"/>'
  + '<path d="M2.3 6.4a2.8 2.8 0 0 1 2.8-2.8h13.8a2.8 2.8 0 0 1 2.8 2.8v3.1H2.3z" fill="url(#pz-cal-cab)"/>'
  + '<path d="M3.3 6.3a1.9 1.9 0 0 1 1.9-1.9h13.6a1.9 1.9 0 0 1 1.9 1.9v.5H3.3z" fill="#fff" fill-opacity=".28"/>'
  + '<rect x="6.6" y="1.4" width="1.9" height="4.6" rx=".95" fill="url(#pz-anillo)"/><rect x="15.5" y="1.4" width="1.9" height="4.6" rx=".95" fill="url(#pz-anillo)"/>'
  + Array.from({ length: 12 }, (_, k) => `<rect x="${f1(4.3 + (k % 4) * 4)}" y="${f1(11.2 + Math.floor(k / 4) * 3.4)}" width="3.2" height="2.6" rx=".6" fill="${k === 6 ? '#e5484d' : '#d2d8e0'}"/>`).join('')
  + '<rect x="2.9" y="20.9" width="18.2" height=".6" rx=".3" fill="#000" fill-opacity=".06"/>');
// 🎟 boleto liso en ÁMBAR, en los dos sets; 🎫 igual, pero solo en apple. El de Apple dice «ADMIT ONE» / «LIVE CONCERT
// TICKET» en inglés; el 🎟 de Fluent es rosa y el 🎫 de Fluent ya es amarillo sin texto (sale nativo). Antes era rojo
// (#ff7a8a → #e0182a, casi el --rojo de la tinta): tachado con `no:` o encerrado en un círculo rojo se volvía una mancha
// roja [r5, ref_255 usa un 🎫 amarillo]. Los detalles van en café translúcido para leerse sobre el ámbar.
const BOLETO = OBJ('<g transform="rotate(-14 12 12)"><path d="M3.2 6.4h17.6a1.2 1.2 0 0 1 1.2 1.2v2.6a2 2 0 0 0 0 3.8v2.6a1.2 1.2 0 0 1-1.2 1.2H3.2A1.2 1.2 0 0 1 2 16.6V14a2 2 0 0 0 0-3.8V7.6a1.2 1.2 0 0 1 1.2-1.2z" fill="url(#pz-boleto)" stroke="#b07800" stroke-width=".5"/>'
  + '<path d="M3.4 7.1h17.2a.7.7 0 0 1 .7.7v1H2.7v-1a.7.7 0 0 1 .7-.7z" fill="#fff" fill-opacity=".35"/>'
  + '<path d="M16.4 7.6v8.8" stroke="#7a4f00" stroke-opacity=".6" stroke-width=".9" stroke-dasharray="1.1 1.1" stroke-linecap="round"/>'
  + '<path d="M9.2 9.2l.85 1.75 1.9.27-1.38 1.34.33 1.9-1.7-.9-1.7.9.33-1.9-1.38-1.34 1.9-.27z" fill="#7a4f00" fill-opacity=".6"/></g>');
// 📄 📃 documento, base de conocimiento: en los dos sets la hoja sale pálida (8-21% medido) y su sustituto era 📋,
// que ya es «tarea». Hoja con degradado blanco → gris azulado y borde fino (≤ 0.7: el contorno negro de 1.2 la hacía
// clip-art), renglones gris pizarra y la esquina doblada azul; se lee sobre blanco, tarjeta y lámina oscura.
const DOCUMENTO = OBJ('<path d="M5.4 1.6h9.3l4.9 4.9v15.1a.9.9 0 0 1-.9.9H5.4a.9.9 0 0 1-.9-.9V2.5a.9.9 0 0 1 .9-.9z" fill="url(#pz-hoja)" stroke="#9aa5b6" stroke-width=".7" stroke-linejoin="round"/>'
  + '<path d="M14.7 1.6v4a.9.9 0 0 0 .9.9h4z" fill="url(#pz-doblez)" stroke="#2a5bc8" stroke-width=".5" stroke-linejoin="round"/>'
  + '<path d="M14.7 5.6a.9.9 0 0 0 .9.9h4l-.9.9h-3.3a1.5 1.5 0 0 1-1.5-1.5z" fill="#000" fill-opacity=".08"/>'
  + [9.6, 12.3, 15, 17.7].map((y, k) => `<path d="M7.4 ${y}H${k === 3 ? 13.2 : 16.8}" stroke="#56627a" stroke-width="1.3" stroke-linecap="round"/>`).join(''));
// 💬 🗨 burbuja de comentario azul con tres puntos: la de Fluent es lila casi blanca (0% medido sobre blanco) y la de
// Apple se pierde en la tarjeta (11%). Era el ícono del llamado «comenta [PALABRA]», que caía en 📲 («te llega»).
const BURBUJA = OBJ('<path d="M8 3h8a6 6 0 0 1 6 6v1.6a6 6 0 0 1-6 6h-4.7l-4.6 4.1a.6.6 0 0 1-1-.55l.75-3.75A6 6 0 0 1 2 10.6V9a6 6 0 0 1 6-6z" fill="url(#pz-chat)" stroke="#0a55bd" stroke-width=".5" stroke-linejoin="round"/>'
  + '<path d="M8 3.9h8a5.1 5.1 0 0 1 5 4.1H3a5.1 5.1 0 0 1 5-4.1z" fill="url(#pz-brillo)" opacity=".7"/>'
  + [7.5, 12, 16.5].map(x => `<circle cx="${x}" cy="10" r="1.5" fill="#fff"/>`).join(''));
// Credencial azul sin nombre, recibo con total verde y tienda sin letrero ni toldo rojo.
const CREDENCIAL = OBJ('<rect x="1.2" y="4" width="21.6" height="16" rx="2.4" fill="url(#pz-chat)"/>'
  + '<rect x="2.1" y="4.9" width="19.8" height="14.2" rx="1.6" fill="#e8f0fa"/>'
  + '<rect x="3.2" y="7.1" width="7" height="9.8" rx="1" fill="#bcd9f2"/><circle cx="6.7" cy="10" r="1.8" fill="#547695"/>'
  + '<path d="M3.9 15.6c0-3.8 5.6-3.8 5.6 0" fill="#547695"/>'
  + [8.3, 11.4, 14.5].map((y, i) => `<path d="M12.2 ${y}h${i === 2 ? 5 : 7}" stroke="#6b7d8d" stroke-width="1.2" stroke-linecap="round"/>`).join('')
  + '<path d="M3.6 5.5h16.8" stroke="#fff" stroke-width=".7" stroke-linecap="round"/>');
const RECIBO = OBJ('<path d="M4 1.5l2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1v21l-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" fill="url(#pz-hoja)" stroke="#94a3b8" stroke-width=".6" stroke-linejoin="round"/>'
  + [6, 9, 12, 15].map((y, i) => `<path d="M6.8 ${y}h${i % 2 ? 8.2 : 10.4}" stroke="#64748b" stroke-width="1.1" stroke-linecap="round"/>`).join('')
  + '<path d="M7 19h10" stroke="#24934b" stroke-width="2.2" stroke-linecap="round"/>');
const TIENDA = OBJ('<rect x="2.5" y="8.7" width="19" height="13.3" rx="1.2" fill="#d8e3eb" stroke="#7c95a8" stroke-width=".5"/>'
  + '<rect x="4" y="12" width="9" height="7.8" rx=".6" fill="#64b6d8"/><path d="M4.8 12.8h7.4l-7.4 5.8z" fill="#fff" fill-opacity=".35"/>'
  + '<rect x="15" y="11.8" width="4.8" height="10.2" rx=".5" fill="#437d9d"/><rect x="15.8" y="12.8" width="3.2" height="6" fill="#a6d6e8"/>'
  + '<circle cx="18.8" cy="19.5" r=".35" fill="#d9e3eb"/><path d="M3 2.5h18l2 6H1z" fill="#2c9e73"/>'
  + [1, 5.4, 9.8, 14.2, 18.6].map((x, i) => `<path d="M${x} 8.5h4.4v1a2.2 2.2 0 0 1-4.4 0z" fill="${i % 2 ? '#438bc2' : '#43b78b'}"/>`).join('')
  + '<path d="M3.5 3.2h17" stroke="#fff" stroke-opacity=".45" stroke-width=".7" stroke-linecap="round"/>');
// Se dibujan en los DOS sets: el nativo imprime algo, se confunde (la tableta de Fluent) o se pierde en el fondo
const GLIFOS_SVG = {
  '📱': CELULAR, '📲': CELULAR_ENTRA, '📄': DOCUMENTO, '📃': DOCUMENTO, '💬': BURBUJA, '🗨': BURBUJA, '🎟': BOLETO,
  '🧾': RECIBO, '🏪': TIENDA,
  '➕': '<svg class="signo-mas" viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 4v16M4 12h16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  '❌': EQUIS, '✖': EQUIS, '✅': PALOMITA, '☑': PALOMITA, '✔': PALOMITA,
  '👤': `<svg viewBox="0 0 24 24" width="100%" height="100%">${DEF_SIL}${SIL(0)}</svg>`,
  '👥': `<svg viewBox="0 0 24 24" width="100%" height="100%">${DEF_SIL}<g opacity=".75">${SIL(5.2, 0.8)}</g>${SIL(-2.4, 0.86)}</svg>`,
};
// Solo en apple: el nativo imprime texto (el calendario con «JUL 17», el boleto «ADMIT ONE»). En fluent el 3D nativo no
// trae texto y se usa (si el CDN falla, cae a este SVG). En apple también se cambian DENTRO del texto (EN_TEXTO_APPLE).
const GLIFOS_SVG_APPLE = { '📅': CALENDARIO, '📆': CALENDARIO, '🗓': CALENDARIO, '🎫': BOLETO, '🪪': CREDENCIAL };
const EN_TEXTO_APPLE = new Set([...Object.keys(GLIFOS_SVG_APPLE), '🎟', '🧾', '🏪', '➕']);
export const TODOS_GLIFOS_SVG = { ...GLIFOS_SVG, ...GLIFOS_SVG_APPLE };   // pruebas: geometría de cada glifo
const sinSel = ch => String(ch || '').replace(/️/g, '');
// El SVG que se dibuja para ese emoji en ese set ('' si sale del set)
export const glifoSVG = (ch, modo = 'apple') => GLIFOS_SVG[sinSel(ch)] || (modo === 'fluent' ? '' : GLIFOS_SVG_APPLE[sinSel(ch)] || '');
export const esGlifoDibujado = (ch, modo = 'apple') => Boolean(glifoSVG(ch, modo));

// ---------- tono de piel (campo `piel` del deck) ----------
// En el video las personas protagonistas llevan tono humano (👨🏻‍⚕️ ref_10, 🙅🏻‍♂️ ref_628, 💁🏻‍♂️ 12:45); las siluetas 👥 👤 no.
// Con `piel` (🏻…🏿) cada componente de PERSONA (no manos) que admite tono (\p{Emoji_Modifier_Base}) lo recibe, salvo que el emoji
// ya traiga uno escrito a mano. `ninguno` (o sin campo) no cambia nada.
export const PIELES = ['🏻', '🏼', '🏽', '🏾', '🏿'];
const RE_TONO = /[\u{1F3FB}-\u{1F3FF}]/u;
const RE_BASE_TONO = /^\p{Emoji_Modifier_Base}$/u;
// Manos y partes del cuerpo (👆 🤝 👍 💪 🤳 ✍️…) admiten tono pero no son personas: se quedan como están
const RE_CUERPO = /^[\u{1F442}\u{1F443}\u{1F446}-\u{1F450}\u{1F485}\u{1F4AA}\u{1F590}-\u{1F596}\u{1F64C}\u{1F64F}\u{1F90C}\u{1F90F}\u{1F918}-\u{1F91F}\u{1F932}\u{1F933}\u{1F9B5}\u{1F9B6}\u{1F9BB}\u{1FAF0}-\u{1FAF8}\u261D\u270A-\u270D]$/u;
export function conPiel(ch, piel) {
  const s = String(ch || '');
  if (!PIELES.includes(piel) || !s || RE_TONO.test(s)) return s;
  const partes = s.split('\u200D');
  // solo las personas: el 🤝 de «dos personas de la mano» (🧑‍🤝‍🧑) y las manos sueltas no llevan tono
  const r = partes.map(parte => {
    const cps = [...parte];
    if (!cps.length || !RE_BASE_TONO.test(cps[0]) || RE_CUERPO.test(cps[0])) return parte;
    return cps[0] + piel + cps.slice(1).filter(c => c !== '\uFE0F').join('');
  }).join('\u200D');
  return /^\p{RGI_Emoji}$/v.test(r) ? r : s;   // si la forma con tono no existe, se queda como estaba
}

// Sintaxis de un emoji compuesto: [no:|si:]base[+insignia]
//   Devuelve { base, prefijo, insignia, error } sin descartar nada en silencio.
export function analizarCompuesto(spec) {
  let s = String(spec ?? '').trim();
  let prefijo = '';
  const m = s.match(/^([a-z]+):\s*/i);
  if (m) {
    const error = ['no', 'si'].includes(m[1].toLowerCase()) ? '' : `prefijo «${m[1]}:» no existe (usa no: o si:)`;
    s = s.slice(m[0].length);
    if (error) { const r = analizarCompuesto(s); return { ...r, error }; }
    prefijo = m[1].toLowerCase();
  }
  const partes = s.split('+').map(t => t.trim());
  if (partes.some(p => !p)) return { base: partes.find(Boolean) || '', prefijo, insignia: partes.filter(Boolean)[1] || '', error: '«+» sin emoji a un lado' };
  if (partes.length > 2) return { base: partes[0], prefijo, insignia: partes[1], error: `lleva ${partes.length} partes; la sintaxis es base+insignia (un solo «+»). Para una secuencia usa un «flujo»` };
  return { base: partes[0], prefijo, insignia: partes[1] || '', error: '' };
}

const RE_EMOJI_TEXTO = /^\p{RGI_Emoji}$/v;
const segmentador = new Intl.Segmenter('es', { granularity: 'grapheme' });
// Símbolos que existen como emoji pero se usan como tipografía: sin FE0F se quedan como texto
const TIPOGRAFICOS = /^[©®™#*0-9\u2194-\u21AA\u2934\u2935\u2B05-\u2B07▪▫▶◀◻◼◽◾‼⁉〰〽♀♂⚕]$/u;
// Un grafema es emoji para el texto: RGI tal cual o, si es un símbolo de presentación texto escrito SIN FE0F
// (✔ ❤ ☎ ⚠ ✉ ✂ ☀), con el FE0F que le falta. Devuelve la forma a dibujar, o '' si es texto.
export function formaEmoji(g) {
  if (RE_EMOJI_TEXTO.test(g)) return g;
  const cps = [...g];
  if (cps.length !== 1 || TIPOGRAFICOS.test(g) || !/\p{Extended_Pictographic}/u.test(g) || /\p{Emoji_Presentation}/u.test(g)) return '';
  const con = g + '\uFE0F';
  return RE_EMOJI_TEXTO.test(con) ? con : '';
}
export const esEmojiTexto = g => Boolean(formaEmoji(g));

export class Emojis {
  constructor({ modo = 'auto', dirSalida, piel = '' }) {
    this.modo = modoEmoji(modo);
    this.piel = PIELES.includes(piel) ? piel : '';
    this.dirSalida = dirSalida;
    this.faltantes = new Set();
    this.malformados = new Map();   // spec → motivo (se reporta en la construcción)
    this.aproximados = new Map();   // emoji pedido → emoji Fluent que se usó en su lugar
  }

  glifo(ch0, clase = '') {
    const ch = conPiel(ch0, this.piel);
    const dibujado = glifoSVG(ch, this.modo);
    if (dibujado) return dibujado;
    if (this.modo === 'fluent') {
      const src = resolverFluent(ch, this.dirSalida, this.aproximados);
      if (src) return imagenFluent(ch, src, clase);
      const respaldo = GLIFOS_SVG_APPLE[sinSel(ch)];   // sin red: el calendario/boleto dibujado, nunca el texto crudo
      if (respaldo) return respaldo;
      this.faltantes.add(ch);
    }
    return `<span class="emo-txt ${escapar(clase)}">${escapar(ch)}</span>`;
  }

  // Devuelve el HTML de un emoji (simple o compuesto) a un tamaño en px.
  //   prefijo no:/si: → ❌/✅ abajo a la izquierda · +insignia → abajo a la derecha (pueden ir juntos)
  html(spec, tam = 130, extra = '') {
    if (!spec) return '';
    const c = analizarCompuesto(spec);
    if (c.error) this.malformados.set(String(spec), c.error);
    const base = this.glifo(c.base);
    const izq = c.prefijo ? `<span class="insignia izq${c.prefijo === 'no' ? ' no' : ''}">${this.glifo(c.prefijo === 'no' ? '❌' : '✅')}</span>` : '';
    const der = c.insignia ? `<span class="insignia">${this.glifo(c.insignia)}</span>` : '';
    const tamCss = typeof tam === 'number' && Number.isFinite(tam) ? tam + 'px' : /^[\d.]+(px|em)$/.test(String(tam)) ? tam : '130px';
    return `<span class="emo ${escapar(extra)}" style="--s:${tamCss}" data-e="${encodeURIComponent(String(spec).trim())}">${base}${izq}${der}</span>`;
  }

  // Solo se aplica al contenido de una lámina oscura. La medida es del glifo sin halo.
  enOscura(html) {
    return String(html).replace(/<span class="emo\b([^\"]*)"([^>]*\bdata-e="([^\"]*)"[^>]*)>/g, (todo, clases, atributos, spec) => {
      const { base } = analizarCompuesto(decodeURIComponent(spec));
      if (necesitaHalo(base, this.modo)) return /\bhundido\b/.test(clases) ? todo : `<span class="emo${clases} hundido"${atributos}>`;
      if (glifoSVG(base, this.modo) || HALO_INSUFICIENTE.includes(sinSel(base)) || contrasteMedido()[this.modo]?.oscura?.[sinSel(base)] != null) return todo;
      const rel = this.modo === 'fluent' ? resolverFluent(base, this.dirSalida) : '';
      // La imagen local se vuelve data URL para medir sin contaminar el canvas de un HTML file://.
      const src = rel ? ` data-halo-src="data:image/webp;base64,${fs.readFileSync(path.join(this.dirSalida, rel)).toString('base64')}"` : '';
      return `<span class="emo${clases}"${atributos} data-halo-medir="${UMBRAL_OSCURA}"${src}>`;
    });
  }

  // Emojis escritos DENTRO del texto (burbujas, etiquetas, tarjetas…). En modo fluent se cambian por la
  // imagen 3D, para que la lámina use una sola familia de emojis; en apple el HTML sale idéntico, salvo los
  // calendarios y boletos (EN_TEXTO_APPLE), que se dibujan sin la fecha ni el texto en inglés.
  // Solo toca los trozos de texto: nunca etiquetas, atributos, <script>, <svg> (ahí no cabe <img>) ni
  // el texto de un .emo-txt ya resuelto. ©, ® y ™ no son RGI_Emoji: se quedan como texto.
  enTexto(html) {
    if (!html) return html;
    const apple = this.modo !== 'fluent';
    if (apple && ![...EN_TEXTO_APPLE].some(e => String(html).includes(e))) return html;
    const trozos = String(html).split(/(<script[\s\S]*?<\/script>|<svg[\s\S]*?<\/svg>|<[^>]+>)/);
    let dentroEmo = 0;
    return trozos.map(t => {
      if (!t) return t;
      if (t.startsWith('<')) {
        if (/^<span class="emo-txt/.test(t)) dentroEmo++;
        else if (dentroEmo && /^<\/span>/.test(t)) dentroEmo--;
        return t;
      }
      if (dentroEmo) return t;
      let out = '';
      for (const { segment: g } of segmentador.segment(t)) {
        const f = formaEmoji(g);
        const toca = f && (!apple || EN_TEXTO_APPLE.has(f.replace(/\uFE0F/g, '')));
        out += toca ? `<span class="emo en-texto" style="--s:1.15em" data-e="${encodeURIComponent(f)}">${this.glifo(f)}</span>` : g;
      }
      return out;
    }).join('');
  }
}

// Tamaños con nombre: la CAJA en px sobre el lienzo de 1920. El glifo 3D llena ~85% de su caja, así que
// medio 230 se ve de ~197 (el 🏆 de ref_90) y heroe 360 de ~310 (el médico de ref_10).
export const TAM_EMOJI = { chico: 150, medio: 230, grande: 290, heroe: 360 };
export function tamEmoji(v, porOmision = 'medio') {
  if (typeof v === 'number') return v;
  return TAM_EMOJI[v] || TAM_EMOJI[porOmision];
}

// Emojis que casi desaparecen según el set y el fondo. Dos fuentes:
//   · BAJO_CONTRASTE: la tabla revisada a ojo, con el SUSTITUTO que QA propone (sin selector FE0F);
//   · contraste-emojis.json: la medida de scripts/medir-emojis.mjs (% del glifo que se distingue del fondo).
//     Bajo UMBRAL_CONTRASTE QA avisa, salvo los de VISTOS_OK (medida baja pero se leen: la línea roja de 📈).
export const BAJO_CONTRASTE = {
  apple: {
    claro: { '🏷': '💵', '✉': '📧', '🤍': '❤', '🏳': '🚩', '🖱': '👆', '☁': '🌐' },
    oscura: { '📞': '☎', '💲': '💵', '🎥': '📹', '🤍': '❤' },
  },
  fluent: {
    claro: { '💭': '💡', '✉': '📧', '📩': '📲', '🤍': '❤', '🏳': '🚩',
      '🔧': '🛠', '📨': '📧', '🗒': '📄', '☁': '🌐', '🖱': '👆', '⚙': '🛠' },
    oscura: { '🗣': '🎤', '🤍': '❤', '🎥': '📹' },
  },
};
export const UMBRAL_CONTRASTE = 15;
// Sobre la lámina oscura la medida es más estricta (solo ≥ 3:1, contraste-color.mjs) y el umbral más alto: con 30 se
// separan sin un error los que se hunden (📞 💲 de Apple; 🎓 ♟ 🎵 🗣 de Fluent) de los que se ven (☎ 📹 💵 🚀 💰 🎤).
export const UMBRAL_OSCURA = 30;
// Sustituto para un emoji que solo la MEDIDA marca (p. ej. 💬 de Apple sobre tarjeta gris)
// (📄 y 📃 ya se dibujan en SVG: son el sustituto de toda «hoja»; 📋 es «tarea», no «documento»)
// (💬 y 🗨 se dibujan en SVG: la burbuja azul; ya no se sustituyen por 📲, que es «te llega al celular»)
export const SUGERIDO = { '💭': '💡', '📑': '📄', '🗒': '📄', '🔖': '📌', '☁': '🌐', '🖱': '👆', '🔧': '🛠', '📨': '📧', '📩': '📲', '✉': '📧', '🏷': '💵', '🤍': '❤', '🏳': '🚩' };
export const VISTOS_OK = { apple: ['📈', '📉', '💡', '📩'], fluent: [] };
// Emojis que cambian de SENTIDO entre sets (no de contraste): EMOJIS.md, «Se ven distinto según el modo»
export const DIVERGE = { fluent: { '🤔': '❓' }, apple: {} };
// Emojis que IMPRIMEN texto en su set (un número, un nombre, inglés): a tamaño de ícono se lee y confunde. Los
// calendarios y boletos de apple ya se dibujan en SVG (GLIFOS_SVG_APPLE; en fluent no imprimen nada); estos siguen
// saliendo del set. QA avisa desde ~80 px.
export const TEXTO_IMPRESO = {
  apple: {}, fluent: {},
};
// Emojis que se ven casi iguales en un set (EMOJIS.md, «Evita» y «Parecidos»): en un mismo deck se confunden. Sin
// selector FE0F. En apple los calendarios 📅 🗓 📆 (y los boletos) se dibujan con el MISMO SVG; en fluent salen nativos
// y distintos (liso, con argollas, con espiral; boleto rosa y amarillo), así que ahí no se confunden. 📄 📃 son el mismo
// SVG en los dos sets, y 💬 🗨 la misma burbuja.
export const PARECIDOS = {
  apple: [['🏢', '🏬'], ['🧑‍💼', '👨‍💼'], ['🧑‍💼', '🤵'], ['📅', '🗓', '📆'], ['🎟', '🎫'], ['📄', '📃'], ['💬', '🗨']],
  fluent: [['🏢', '🏬'], ['🏦', '🏛'], ['🧑‍💼', '👨‍💼'], ['📄', '📃'], ['💬', '🗨']],
};
let medidas = null;
export function contrasteMedido() {
  if (medidas) return medidas;
  try { medidas = JSON.parse(fs.readFileSync(new URL('./contraste-emojis.json', import.meta.url), 'utf8')); } catch { medidas = { apple: {}, fluent: {} }; }
  return medidas;
}
// El gris plano no gana un contorno reconocible con halo; ➕ ya tiene SVG que hereda blanco en oscura.
export const HALO_INSUFICIENTE = ['➕', '➖', '➗', '✖', '⚫', '◼', '🔗', '🔊', '🔉', '🔈'];
export function necesitaHalo(ch, modo) {
  const k = sinSel(ch);
  if (glifoSVG(k, modo) || HALO_INSUFICIENTE.includes(k)) return false;
  const medida = contrasteMedido()[modo]?.oscura?.[k];
  return medida != null && medida < UMBRAL_OSCURA;
}
// Sustituto sugerido si el emoji es de bajo contraste en ese set y fondo ('claro' | 'tarjeta' | 'oscura'); ''
// si se ve bien. Un emoji medido bajo el umbral sin sustituto en la tabla devuelve '?' (elige otro).
export function bajoContraste(ch, modo, fondo) {
  const k = String(ch || '').replace(/\uFE0F/g, '');
  if (glifoSVG(k, modo)) return '';   // se dibuja en SVG en ese set: no sale del set
  const t = (BAJO_CONTRASTE[modo] || {})[fondo === 'oscura' ? 'oscura' : 'claro'] || {};
  if (t[k]) return t[k];
  const m = ((contrasteMedido()[modo] || {})[fondo === 'oscura' ? 'oscura' : fondo === 'tarjeta' ? 'tarjeta' : 'claro'] || {})[k];
  return m != null && m < (fondo === 'oscura' ? UMBRAL_OSCURA : UMBRAL_CONTRASTE) && !(VISTOS_OK[modo] || []).includes(k) ? SUGERIDO[k] || '?' : '';
}

// Manos (👆 👉 ✍️ 🖱…): en un `boton` con cursor de mano serían dos manos [23:15]. Sin tono ni FE0F.
const MANO_EMOJI = /^(👆|👉|👇|👈|☝|✍|🖐|🤚|✋|👋|🫵|👌|🤞|🤙|👍|🖱)/u;
export const esMano = e => MANO_EMOJI.test(String(e || '').replace(/^(no|si):/, '').replace(/[\u{1F3FB}-\u{1F3FF}\uFE0F]/gu, ''));

// ---------- campos de emoji del deck (una sola lista para el contrato y para QA) ----------
// Todo campo que se dibuja como ícono: `emoji`, `iconos`, la viñeta de una lista, los avatares del chat, `sobre`
// y `centro`, y los `emoji_*` que no son un tamaño, un lado o un paso. La viñeta acepta alias (x, no, check, si).
export const NO_EMOJI = ['emoji_tam', 'emoji_lado', 'emoji_paso'];
export const ALIAS_VINETA = { x: '❌', cruz: '❌', no: '❌', check: '✅', si: '✅' };
const CAMPOS_EMOJI = new Set(['emoji', 'iconos', 'vineta', 'avatar', 'avatar_yo', 'avatar_otro', 'sobre', 'centro']);
export const esCampoEmoji = k => typeof k === 'string' && (CAMPOS_EMOJI.has(k) || (k.startsWith('emoji_') && !NO_EMOJI.includes(k)));
// Los textos de emoji de un campo (lista si es lista, alias de viñeta ya traducidos); [] si no es un campo de emoji
export function specsDeCampo(k, v) {
  if (!esCampoEmoji(k)) return [];
  const lista = Array.isArray(v) ? v : [v];
  return lista.filter(x => typeof x === 'string' && x.trim() && !(k === 'vineta' && x === 'letras')).map(x => (k === 'vineta' && Object.hasOwn(ALIAS_VINETA, x) ? ALIAS_VINETA[x] : x));
}
