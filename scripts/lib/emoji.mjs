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

// Nombres a probar en el CDN: tal cual, sin FE0F, y con FE0F donde la secuencia completa lo lleva
function candidatos(ch) {
  const cps = [...ch].map(c => c.codePointAt(0).toString(16));
  const sin = cps.filter(c => c !== 'fe0f');
  const completo = [];
  sin.forEach((c, i) => {
    completo.push(c);
    const sig = sin[i + 1];
    const esSimbolo = parseInt(c, 16) < 0x1f000 && c !== '200d' && !/^(20e3|1f3f[b-f])$/.test(c);
    if (c !== '200d' && (sig === '200d' || i === sin.length - 1) && esSimbolo) completo.push('fe0f');
  });
  return [...new Set([cps.join('-'), sin.join('-'), completo.join('-'), sin.join('-') + '-fe0f'])];
}

// Descarga (una vez) el PNG/WebP 3D y lo copia a la carpeta de salida. Devuelve la ruta relativa o null.
export function resolverFluent(ch, dirSalida) {
  fs.mkdirSync(CACHE, { recursive: true });
  for (const c of candidatos(ch)) {
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

export class Emojis {
  constructor({ modo = 'auto', dirSalida }) {
    this.modo = modoEmoji(modo);
    this.dirSalida = dirSalida;
    this.faltantes = new Set();
  }

  glifo(ch, clase = '') {
    const dibujado = GLIFOS_SVG[ch.replace(/\uFE0F/g, '')];
    if (dibujado) return dibujado;
    if (this.modo === 'fluent') {
      const src = resolverFluent(ch, this.dirSalida);
      if (src) return `<img class="${escapar(clase)}" src="${escapar(src)}" alt="${escapar(ch)}" draggable="false">`;
      this.faltantes.add(ch);
    }
    return `<span class="emo-txt ${escapar(clase)}">${escapar(ch)}</span>`;
  }

  // Devuelve el HTML de un emoji (simple o compuesto) a un tamaño en px.
  html(spec, tam = 130, extra = '') {
    if (!spec) return '';
    let s = String(spec).trim();
    let insignia = '', izq = false;
    if (s.startsWith('no:')) { s = s.slice(3); insignia = '❌'; izq = true; }
    else if (s.startsWith('si:')) { s = s.slice(3); insignia = '✅'; izq = true; }
    else if (s.includes('+')) { const [a, b] = s.split('+'); s = a; insignia = b; }
    const base = this.glifo(s.trim());
    const ins = insignia ? `<span class="insignia${izq ? ' izq' : ''}">${this.glifo(insignia.trim())}</span>` : '';
    const tamCss = typeof tam === 'number' && Number.isFinite(tam) ? tam + 'px' : /^[\d.]+(px|em)$/.test(String(tam)) ? tam : '130px';
    return `<span class="emo ${escapar(extra)}" style="--s:${tamCss}">${base}${ins}</span>`;
  }
}

// Tamaños con nombre (px en el lienzo de 1920 de ancho)
export const TAM_EMOJI = { chico: 110, medio: 170, grande: 240, heroe: 300 };
export function tamEmoji(v, porOmision = 'medio') {
  if (typeof v === 'number') return v;
  return TAM_EMOJI[v] || TAM_EMOJI[porOmision];
}
