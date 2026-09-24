// emoji.mjs — el emoji es el ícono del estilo. Dos fuentes:
//   · «apple»  : la fuente Apple Color Emoji del sistema (idéntico a la referencia; solo en macOS).
//   · «fluent» : Microsoft Fluent Emoji 3D (licencia MIT) desde jsDelivr, cacheado en disco. Se ve
//                igual en cualquier máquina (Linux, VPS, Windows).
//   · «auto»   : apple en macOS, fluent en lo demás.
//
// Sintaxis de emoji compuesto (la firma del estilo: un ícono que cuenta una idea entera):
//   "💰"            simple
//   "🧑‍⚕️+💰"        base + insignia abajo a la derecha (médico que gana dinero)
//   "no:🎥"          base + ❌ abajo a la izquierda (sin mostrar la cara)
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
export const DEFS_GLOBALES = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="pz-sil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#90a6be"/><stop offset="1" stop-color="#5c7390"/></linearGradient></defs></svg>';
const DEF_SIL = '';
const GLIFOS_SVG = {
  '❌': '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5.2 5.2 18.8 18.8M18.8 5.2 5.2 18.8" stroke="#d3121f" stroke-width="4.4" stroke-linecap="round"/></svg>',
  '✖': '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5.2 5.2 18.8 18.8M18.8 5.2 5.2 18.8" stroke="#d3121f" stroke-width="4.4" stroke-linecap="round"/></svg>',
  '👤': `<svg viewBox="0 0 24 24" width="100%" height="100%">${DEF_SIL}${SIL(0)}</svg>`,
  '👥': `<svg viewBox="0 0 24 24" width="100%" height="100%">${DEF_SIL}<g opacity=".75">${SIL(5.2, 0.8)}</g>${SIL(-2.4, 0.86)}</svg>`,
};

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
    const izq = c.prefijo ? `<span class="insignia izq">${this.glifo(c.prefijo === 'no' ? '❌' : '✅')}</span>` : '';
    const der = c.insignia ? `<span class="insignia">${this.glifo(c.insignia)}</span>` : '';
    const tamCss = typeof tam === 'number' && Number.isFinite(tam) ? tam + 'px' : /^[\d.]+(px|em)$/.test(String(tam)) ? tam : '130px';
    return `<span class="emo ${escapar(extra)}" style="--s:${tamCss}">${base}${izq}${der}</span>`;
  }

  // Emojis escritos DENTRO del texto (burbujas, etiquetas, tarjetas…). En modo fluent se cambian por la
  // imagen 3D, para que la lámina use una sola familia de emojis; en apple el HTML sale idéntico.
  // Solo toca los trozos de texto: nunca etiquetas, atributos, <script>, <svg> (ahí no cabe <img>) ni
  // el texto de un .emo-txt ya resuelto. ©, ® y ™ no son RGI_Emoji: se quedan como texto.
  enTexto(html) {
    if (this.modo !== 'fluent' || !html) return html;
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
        out += RE_EMOJI_TEXTO.test(g) ? `<span class="emo en-texto" style="--s:1.15em">${this.glifo(g)}</span>` : g;
      }
      return out;
    }).join('');
  }
}

// Tamaños con nombre (px en el lienzo de 1920 de ancho)
export const TAM_EMOJI = { chico: 110, medio: 170, grande: 240, heroe: 300 };
export function tamEmoji(v, porOmision = 'medio') {
  if (typeof v === 'number') return v;
  return TAM_EMOJI[v] || TAM_EMOJI[porOmision];
}
