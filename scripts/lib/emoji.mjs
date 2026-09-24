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

// Nombres a probar en el CDN, en orden y sin repetir:
//   1) la secuencia tal cual (muchos tonos de piel sí existen, como 👍🏽 1f44d-1f3fd);
//   2) la misma secuencia sin tonos de piel (🧑🏻‍🤝‍🧑🏿 → 🧑‍🤝‍🧑, 🤝🏽 → 🤝);
//   3) una equivalencia de sentido (🫱🏼‍🫲🏿 → 🤝);
//   4) si es una secuencia ZWJ: su primer componente sin tono (⛓️‍💥 → ⛓️, 🐦‍🔥 → 🐦, 🙂‍↔️ → 🙂).
//      Los pasos 3 y 4 pierden matiz: resolverFluent lo reporta como «aproximado».
export function candidatos(ch) {
  const cps = [...ch].map(c => c.codePointAt(0).toString(16));
  const sinTono = cps.filter(c => !TONO.test(c));
  const lista = [...variantes(cps), ...variantes(sinTono)];
  const exactos = new Set(lista);
  const base = sinTono.filter(c => c !== 'fe0f').join('-');
  if (EQUIVALENTES[base]) lista.push(...variantes(EQUIVALENTES[base].split('-')));
  if (sinTono.includes('200d')) lista.push(...variantes(sinTono.slice(0, sinTono.indexOf('200d'))));
  const unicos = [...new Set(lista)];
  return Object.assign(unicos, { exactos });
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
// El degradado de las siluetas se define UNA vez fuera de las láminas (construir.mjs → DEFS_GLOBALES):
// si viviera dentro de una lámina oculta, las demás láminas lo perderían en el presentador.
export const DEFS_GLOBALES = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="pz-sil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#90a6be"/><stop offset="1" stop-color="#5c7390"/></linearGradient><linearGradient id="pz-ok" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#45c91f"/><stop offset="1" stop-color="#1f9a0d"/></linearGradient><linearGradient id="pz-pantalla" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b8def"/><stop offset="1" stop-color="#9b6ee0"/></linearGradient><linearGradient id="pz-boleto" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a8a"/><stop offset="1" stop-color="#e0182a"/></linearGradient></defs></svg>';
const DEF_SIL = '';
// La ✕ llena su caja (la insignia de «no:» cruza la esquina del emoji como en ref_628) y la ✅ es verde
// saturado con palomita gruesa: el ✅ de Fluent es verde menta pálido y se perdía sobre el cuadrante verde.
const EQUIS = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M3.5 3.5 20.5 20.5M20.5 3.5 3.5 20.5" stroke="#d3121f" stroke-width="3.6" stroke-linecap="round"/></svg>';
const PALOMITA = '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="url(#pz-ok)"/><path d="M6.6 12.4l3.6 3.6 7.4-8" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// 📱 celular: vertical (1:2), cuerpo negro y rejilla de apps de color, igual en Apple y en Fluent. El 📱 de
// Fluent es una tableta morada que se confunde con 📅 (EMOJIS.md, «Se ven distinto según el modo»).
// `dx` lo corre a la derecha: 📲 es el mismo celular con una flecha azul que entra (el 📲 de Fluent también era
// la tableta morada, y era el sustituto que QA proponía para 💬).
const APPS = ['#ff5f57', '#ffbd2e', '#28c840', '#5ac8fa', '#af52de', '#ff9500', '#34c759', '#007aff', '#ff2d55', '#ffcc00', '#30b0c7', '#5856d6'];
const f1 = v => (Math.round(v * 100) / 100).toString();
const cuerpoCelular = (dx = 0) => `<rect x="${f1(6.2 + dx)}" y="0.6" width="11.6" height="22.8" rx="2.7" fill="#1c1c1e"/>`
  + `<rect x="${f1(7.2 + dx)}" y="2" width="9.6" height="20" rx="1.7" fill="url(#pz-pantalla)"/><rect x="${f1(10.3 + dx)}" y="1.3" width="3.4" height="1" rx=".5" fill="#1c1c1e"/>`
  + APPS.map((c, k) => `<rect x="${f1(7.8 + dx + (k % 3) * 3.1)}" y="${f1(4 + Math.floor(k / 3) * 3.1)}" width="2.2" height="2.2" rx=".6" fill="${c}"/>`).join('')
  + `<rect x="${f1(7.8 + dx)}" y="18.2" width="8.4" height="2.9" rx=".9" fill="#fff" fill-opacity=".35"/>`
  + ['#28c840', '#007aff', '#ff9500'].map((c, k) => `<rect x="${f1(8.1 + dx + k * 2.75)}" y="18.55" width="2.2" height="2.2" rx=".6" fill="${c}"/>`).join('');
const CELULAR = `<svg viewBox="0 0 24 24" width="100%" height="100%">${cuerpoCelular()}</svg>`;
const CELULAR_ENTRA = `<svg viewBox="0 0 24 24" width="100%" height="100%">${cuerpoCelular(3.6)}`
  + '<path d="M0.9 12H8.2M5.3 9 8.3 12 5.3 15" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>'
  + '<path d="M0.9 12H8.2M5.3 9 8.3 12 5.3 15" fill="none" stroke="#1e88e5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// 📅 📆 🗓 calendario SIN fecha: el de Apple imprime «JUL 17» (una fecha falsa en un deck que habla de otra) y en
// Fluent los tres son la misma rejilla lila. Cuerpo blanco, encabezado rojo liso, dos argollas y una celda marcada.
const CALENDARIO = '<svg viewBox="0 0 24 24" width="100%" height="100%">'
  + '<rect x="2.3" y="3.6" width="19.4" height="18.4" rx="2.6" fill="#fff" stroke="#c9ced6" stroke-width="0.9"/>'
  + '<path d="M2.3 6.2a2.6 2.6 0 0 1 2.6-2.6h14.2a2.6 2.6 0 0 1 2.6 2.6v3.3H2.3z" fill="#e5484d"/>'
  + '<rect x="6.6" y="1.6" width="1.9" height="4.4" rx=".95" fill="#8e96a3"/><rect x="15.5" y="1.6" width="1.9" height="4.4" rx=".95" fill="#8e96a3"/>'
  + Array.from({ length: 12 }, (_, k) => `<rect x="${f1(4.3 + (k % 4) * 4)}" y="${f1(11.2 + Math.floor(k / 4) * 3.4)}" width="3.2" height="2.6" rx=".6" fill="${k === 6 ? '#e5484d' : '#d9dde3'}"/>`).join('')
  + '</svg>';
// 🎟 🎫 boleto liso: el de Apple dice «ADMIT ONE» / «LIVE CONCERT TICKET» en inglés, a tamaño protagonista.
const BOLETO = '<svg viewBox="0 0 24 24" width="100%" height="100%">'
  + '<g transform="rotate(-14 12 12)"><path d="M3.2 6.4h17.6a1.2 1.2 0 0 1 1.2 1.2v2.6a2 2 0 0 0 0 3.8v2.6a1.2 1.2 0 0 1-1.2 1.2H3.2A1.2 1.2 0 0 1 2 16.6V14a2 2 0 0 0 0-3.8V7.6a1.2 1.2 0 0 1 1.2-1.2z" fill="url(#pz-boleto)"/>'
  + '<path d="M16.4 7.6v8.8" stroke="#fff" stroke-width=".9" stroke-dasharray="1.1 1.1" stroke-linecap="round"/>'
  + '<path d="M9.2 9.2l.85 1.75 1.9.27-1.38 1.34.33 1.9-1.7-.9-1.7.9.33-1.9-1.38-1.34 1.9-.27z" fill="#fff" fill-opacity=".92"/></g></svg>';
// 📄 📃 documento, base de conocimiento: en los dos sets la hoja sale pálida (8-21% medido) y su sustituto era 📋,
// que ya es «tarea». Hoja blanca con borde oscuro, renglones oscuros y la esquina doblada azul; se lee sobre
// blanco, tarjeta y lámina oscura.
const DOCUMENTO = '<svg viewBox="0 0 24 24" width="100%" height="100%">'
  + '<path d="M5.4 1.6h9.3l4.9 4.9v15.1a.9.9 0 0 1-.9.9H5.4a.9.9 0 0 1-.9-.9V2.5a.9.9 0 0 1 .9-.9z" fill="#fff" stroke="#39414f" stroke-width="1.2" stroke-linejoin="round"/>'
  + '<path d="M14.7 1.6v4a.9.9 0 0 0 .9.9h4z" fill="#3e7bfa" stroke="#39414f" stroke-width="1.2" stroke-linejoin="round"/>'
  + [9.6, 12.3, 15, 17.7].map((y, k) => `<path d="M7.4 ${y}H${k === 3 ? 13.2 : 16.8}" stroke="#39414f" stroke-width="1.3" stroke-linecap="round"/>`).join('')
  + '</svg>';
const GLIFOS_SVG = {
  '📱': CELULAR, '📲': CELULAR_ENTRA, '📄': DOCUMENTO, '📃': DOCUMENTO,
  '📅': CALENDARIO, '📆': CALENDARIO, '🗓': CALENDARIO,
  '🎟': BOLETO, '🎫': BOLETO,
  '❌': EQUIS, '✖': EQUIS, '✅': PALOMITA, '☑': PALOMITA, '✔': PALOMITA,
  '👤': `<svg viewBox="0 0 24 24" width="100%" height="100%">${DEF_SIL}${SIL(0)}</svg>`,
  '👥': `<svg viewBox="0 0 24 24" width="100%" height="100%">${DEF_SIL}<g opacity=".75">${SIL(5.2, 0.8)}</g>${SIL(-2.4, 0.86)}</svg>`,
};
// En modo apple el texto conserva sus emojis de la fuente del sistema, SALVO los que imprimen texto falso (el
// calendario con «JUL 17», el boleto «ADMIT ONE»): esos se cambian por su SVG también dentro del texto.
const EN_TEXTO_APPLE = new Set(['📅', '📆', '🗓', '🎟', '🎫']);
export const esGlifoDibujado = ch => Boolean(GLIFOS_SVG[String(ch || '').replace(/️/g, '')]);

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
  constructor({ modo = 'auto', dirSalida }) {
    this.modo = modoEmoji(modo);
    this.dirSalida = dirSalida;
    this.faltantes = new Set();
    this.malformados = new Map();   // spec → motivo (se reporta en la construcción)
    this.aproximados = new Map();   // emoji pedido → emoji Fluent que se usó en su lugar
  }

  glifo(ch, clase = '') {
    const dibujado = GLIFOS_SVG[ch.replace(/\uFE0F/g, '')];
    if (dibujado) return dibujado;
    if (this.modo === 'fluent') {
      const src = resolverFluent(ch, this.dirSalida, this.aproximados);
      if (src) return `<img class="${escapar(clase)}" src="${escapar(src)}" alt="${escapar(ch)}" draggable="false">`;
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
    return `<span class="emo ${escapar(extra)}" style="--s:${tamCss}">${base}${izq}${der}</span>`;
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
        out += toca ? `<span class="emo en-texto" style="--s:1.15em">${this.glifo(f)}</span>` : g;
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
    claro: { '🏷': '💵', '✉': '📧', '🤍': '❤', '🧾': '💵', '🏳': '🚩', '🖱': '👆', '☁': '🌐' },
    oscura: { '🗨': '💬', '📞': '☎', '💲': '💵', '🎥': '📹', '🤍': '❤' },
  },
  fluent: {
    claro: { '💬': '📲', '🗨': '📲', '💭': '💡', '✉': '📧', '📩': '📲', '🤍': '❤', '🧾': '💵', '🏳': '🚩',
      '🔧': '🛠', '📨': '📧', '🗒': '📄', '☁': '🌐', '🖱': '👆', '⚙': '🛠' },
    oscura: { '🗣': '🎤', '🤍': '❤' },
  },
};
export const UMBRAL_CONTRASTE = 15;
// Sustituto para un emoji que solo la MEDIDA marca (p. ej. 💬 de Apple sobre tarjeta gris)
// (📄 y 📃 ya se dibujan en SVG: son el sustituto de toda «hoja»; 📋 es «tarea», no «documento»)
export const SUGERIDO = { '💬': '📲', '🗨': '📲', '💭': '💡', '📑': '📄', '🗒': '📄', '🔖': '📌', '☁': '🌐', '🖱': '👆', '🔧': '🛠', '📨': '📧', '📩': '📲', '🧾': '💵', '✉': '📧', '🏷': '💵', '🤍': '❤', '🏳': '🚩' };
export const VISTOS_OK = { apple: ['📈', '📉', '💡', '📩'], fluent: [] };
// Emojis que cambian de SENTIDO entre sets (no de contraste): EMOJIS.md, «Se ven distinto según el modo»
export const DIVERGE = { fluent: { '🤔': '❓' }, apple: {} };
// Emojis que IMPRIMEN texto en su set (un número, un nombre, inglés): a tamaño de ícono se lee y confunde. Los
// calendarios y boletos ya se dibujan en SVG (GLIFOS_SVG); estos siguen saliendo del set. QA avisa desde ~80 px.
export const TEXTO_IMPRESO = {
  apple: { '🏪': ['«24»', '🏬 o 🏠'], '🪪': ['«Jo Appleseed»', '🎭 (rol) o 👤 (persona)'], '🧾': ['«RECEIPT»', '💵 o ✍️'] },
  fluent: { '🏪': ['«24 H»', '🏬 o 🏠'] },
};
// Emojis que se ven casi iguales en un set (EMOJIS.md, «Evita» y «Parecidos»): en un mismo deck se confunden. Sin
// selector FE0F. Los calendarios 📅 🗓 📆 se dibujan con el MISMO SVG en los dos sets.
export const PARECIDOS = {
  apple: [['🧑‍💼', '👨‍💼'], ['📅', '🗓', '📆'], ['🎟', '🎫'], ['📄', '📃']],
  fluent: [['🏦', '🏛'], ['🧑‍💼', '👨‍💼'], ['📅', '🗓', '📆'], ['🎟', '🎫'], ['📄', '📃']],
};
let medidas = null;
export function contrasteMedido() {
  if (medidas) return medidas;
  try { medidas = JSON.parse(fs.readFileSync(new URL('./contraste-emojis.json', import.meta.url), 'utf8')); } catch { medidas = { apple: {}, fluent: {} }; }
  return medidas;
}
// Sustituto sugerido si el emoji es de bajo contraste en ese set y fondo ('claro' | 'tarjeta' | 'oscura'); ''
// si se ve bien. Un emoji medido bajo el umbral sin sustituto en la tabla devuelve '?' (elige otro).
export function bajoContraste(ch, modo, fondo) {
  const k = String(ch || '').replace(/\uFE0F/g, '');
  if (GLIFOS_SVG[k]) return '';   // se dibuja en SVG: no sale del set
  const t = (BAJO_CONTRASTE[modo] || {})[fondo === 'oscura' ? 'oscura' : 'claro'] || {};
  if (t[k]) return t[k];
  const m = ((contrasteMedido()[modo] || {})[fondo === 'oscura' ? 'oscura' : fondo === 'tarjeta' ? 'tarjeta' : 'claro'] || {})[k];
  return m != null && m < UMBRAL_CONTRASTE && !(VISTOS_OK[modo] || []).includes(k) ? SUGERIDO[k] || '?' : '';
}
