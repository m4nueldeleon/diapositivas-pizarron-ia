// comun.mjs — contexto compartido por todos los diseños de lámina.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { marcar, escapar } from './markup.mjs';
import { tamEmoji } from './emoji.mjs';

export { marcar, escapar, tamEmoji };

// Silueta de persona (avatar de chat, pastilla de reparto)
export const PERSONA = '<svg viewBox="0 0 24 24" width="56%" height="56%"><circle cx="12" cy="8.3" r="4.3" fill="#fff"/><path d="M3.6 21.4c0-4.6 3.8-7.8 8.4-7.8s8.4 3.2 8.4 7.8z" fill="#fff"/></svg>';

// Pin rojo del medidor
export const PIN = (color = '#e0182a') => `<svg class="pin" viewBox="0 0 46 58"><path d="M23 55.5C23 55.5 4 34 4 21a19 19 0 0 1 38 0c0 13-19 34.5-19 34.5z" fill="${/^#[0-9a-f]{3,8}$/i.test(color) ? color : '#e0182a'}" stroke="#fff" stroke-width="3.5"/><circle cx="23" cy="21" r="7" fill="#fff"/></svg>`;

// Cursor de mano (estilo macOS) y cursor de flecha
export const CURSOR_MANO = `<svg viewBox="0 0 34 39" width="100%" height="100%"><g stroke="#111" stroke-width="1.7" stroke-linejoin="round" fill="#fff">
<path d="M11 18.5V25.6L7.8 22.2C6.4 20.8 4.2 21 3.6 22.6c-.4 1.1 0 2.3.8 3.2l6.1 6.9c1.2 1.4 2.2 3.3 2.4 5.3h16.5c.2-2.3 2.2-5.5 2.2-9.4v-9z"/>
<rect x="11" y="1.2" width="6" height="21" rx="3"/><rect x="16.6" y="10" width="5.6" height="12.5" rx="2.8"/>
<rect x="21.8" y="11.4" width="5.4" height="11.2" rx="2.7"/><rect x="26.6" y="13.2" width="5" height="9.6" rx="2.5"/></g>
<rect x="11.9" y="21.4" width="18.8" height="8" fill="#fff"/></svg>`;
export const CURSOR_FLECHA = '<svg viewBox="0 0 26 38" width="100%" height="100%"><path d="M2 2v28.5l7.2-6.6 4.6 10.6 4.7-2-4.5-10.5h9.3z" fill="#fff" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/></svg>';

const EXT_IMG = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif']);
const entero = k => { const n = Math.floor(Number(k)); return Number.isFinite(n) && n >= 0 ? Math.min(n, 200) : 0; };

export function crearCtx({ em, dirDeck, dirSalida, formato, revelarTodo = false, uid = 0 }) {
  const ctx = {
    em, dirDeck, dirSalida, formato, revelarTodo, uid,
    max: 0,
    conexiones: [],
    vertical: formato === '9:16',
    P(k) { const v = ctx.revelarTodo ? 0 : entero(k); ctx.max = Math.max(ctx.max, v); return ` data-p="${v}"`; },
    paso(k) { const v = ctx.revelarTodo ? 0 : entero(k); ctx.max = Math.max(ctx.max, v); return v; },
    A(id) { return ` data-a="${escapar(id)}"`; },
    con(spec) { ctx.conexiones.push({ ...spec, p: ctx.revelarTodo ? 0 : entero(spec.p ?? 0) }); },
    emoji(spec, tam, porOmision) { return em.html(spec, tamEmoji(tam, porOmision)); },
    // Solo imágenes, y solo de la carpeta del deck (o URLs https / data:image). Nunca otro archivo del disco.
    img(src) {
      if (!src || typeof src !== 'string') return '';
      if (/^https:\/\//i.test(src) || /^data:image\/(png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+$/i.test(src)) return escapar(src);
      if (/^[a-z]+:/i.test(src)) { ctx.avisos.push(`Imagen rechazada (solo https o archivos del deck): ${src.slice(0, 60)}`); return ''; }
      const abs = path.resolve(dirDeck, src), rel = path.relative(dirDeck, abs);
      if (rel.startsWith('..') || path.isAbsolute(rel)) { ctx.avisos.push(`Imagen fuera de la carpeta del deck, rechazada: ${src}`); return ''; }
      if (!EXT_IMG.has(path.extname(abs).toLowerCase())) { ctx.avisos.push(`No es una imagen (png, jpg, webp, gif, svg, avif): ${src}`); return ''; }
      if (!fs.existsSync(abs)) { ctx.avisos.push(`No existe la imagen ${src}`); return ''; }
      const dir = path.join(dirSalida, 'img');
      fs.mkdirSync(dir, { recursive: true });
      const h = crypto.createHash('sha1').update(rel).digest('hex').slice(0, 8);
      const nombre = `${h}-${path.basename(abs).replace(/[^\w.-]/g, '_')}`;
      fs.copyFileSync(abs, path.join(dir, nombre));
      return `img/${nombre}`;
    },
    avisos: [],
  };
  return ctx;
}

// Envuelve un fragmento para que aparezca en un paso dado
export const bloque = (ctx, k, html, clase = '', extra = '') =>
  `<div class="${clase}"${ctx.P(k)}${extra}>${html}</div>`;

// tam: clase (chico|medio|grande|enorme, más utilidades) o tamaño en px → variable CSS
export const texto = (ctx, t, tam, k = 0, extra = '') => {
  if (!t) return '';
  const partes = String(tam || '').split(/\s+/).filter(Boolean);
  const px = partes.find(x => /^\d+(\.\d+)?px$/.test(x));
  const clases = partes.filter(x => /^[a-z][a-z0-9-]*$/.test(x)).join(' ');
  return `<div class="t ${clases}"${px ? ` style="--t:${px}"` : ''}${ctx.P(k)}${extra}>${marcar(t)}</div>`;
};

export const nota = (ctx, t, k, clase = '') =>
  t ? `<div class="nota ${clase}"${ctx.P(k)}>${marcar(t)}</div>` : '';
