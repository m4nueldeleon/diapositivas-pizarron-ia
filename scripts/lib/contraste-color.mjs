// contraste-color.mjs — qué tanto se ve un emoji sobre un fondo de COLOR (pieza del stack, cuadro, botón).
//
// La tabla de contraste-emojis.json solo mide 3 fondos neutros (blanco, tarjeta #f3f3f3 y la oscura). Sobre una pieza
// marino el 🎓 oscuro se funde aunque en blanco se vea perfecto. qa.mjs junta los emojis que caen sobre un fondo que
// no es neutro (con su fondo real: color o las paradas del degradado) y aquí se rasterizan en una página aparte, desde
// data URLs (una imagen file:// ensucia el canvas y no se puede leer):
//   · img (Fluent): el archivo copiado a la salida;
//   · svg (los glifos dibujados: 👥 👤 📱 ✅…): su outerHTML con los degradados globales (#pz-sil, #pz-ok…) adentro;
//   · texto (Apple): fillText con Apple Color Emoji, solo en macOS (fuera de macOS no se mide).
// Métrica (0-100): de los píxeles opacos del glifo, el % con contraste ≥ 2:1, o ΔE76 (Lab) ≥ 40 con color propio (croma ≥ 35) o
// con al menos 1.5:1, contra ESE fondo; sobre un fondo casi negro (luminancia < 0.05) solo cuenta ≥ 3:1 (y el umbral es
// UMBRAL_OSCURA de emoji.mjs: 30). En
// un degradado se toma la PEOR de sus paradas y su promedio. Bajo UMBRAL_COLOR, QA avisa; sobre un PASTEL (todas las
// paradas con luminancia > 0.6: cuadrantes, cuadros, tarjetas de tono) el glifo se ve como sobre la tarjeta #f3f3f3 y
// vale el umbral de la tabla neutra (UMBRAL_CONTRASTE): el 📧 de Apple da 20% en blanco y 17% en el verde pastel.
import fs from 'node:fs';
import path from 'node:path';
import { DEFS_GLOBALES } from './emoji.mjs';

export const UMBRAL_COLOR = 25;
const linC = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
// Todas las paradas casi negras (luminancia < 0.05): vale el umbral de la oscura (UMBRAL_OSCURA)
export const esOscuro = fondos => fondos.every(([r, g, b]) => 0.2126 * linC(r) + 0.7152 * linC(g) + 0.0722 * linC(b) < 0.05);
export const esPastel = fondos => fondos.every(([r, g, b]) => 0.2126 * linC(r) + 0.7152 * linC(g) + 0.0722 * linC(b) > 0.6);
const defs = (DEFS_GLOBALES.match(/<defs>[\s\S]*<\/defs>/) || [''])[0];

// Un <svg> del DOM → documento SVG autónomo de 128 px, con los degradados globales
export function svgAutonomo(outer) {
  let s = String(outer).replace(/\swidth="[^"]*"/, ' width="128"').replace(/\sheight="[^"]*"/, ' height="128"');
  if (!/xmlns=/.test(s)) s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return s.replace(/(<svg[^>]*>)/, `$1${defs}`);
}

// % de los píxeles opacos del glifo que caen a ΔE76 < 25 del rojo de la tinta (#c8101e): un emoji rojo (🎯 ❤️ 🧰) bajo la ✕
// de `no:` o tachado se vuelve una mancha roja [r5]. Pura: se inyecta en la página de medir-emojis.mjs.
export function pctRojo(datos) {
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lab = (r, g, b) => {
    const X = (0.4124 * lin(r) + 0.3576 * lin(g) + 0.1805 * lin(b)) / 0.95047, Y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b), Z = (0.0193 * lin(r) + 0.1192 * lin(g) + 0.9505 * lin(b)) / 1.08883;
    const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
  };
  const R = lab(200, 16, 30);
  let op = 0, rojo = 0;
  for (let i = 0; i < datos.length; i += 4) {
    if (datos[i + 3] < 128) continue;
    op++;
    const L = lab(datos[i], datos[i + 1], datos[i + 2]);
    if (Math.hypot(L[0] - R[0], L[1] - R[1], L[2] - R[2]) < 25) rojo++;
  }
  return op ? Math.round((rojo / op) * 100) : null;
}

// Visibilidad al apagar el glifo: porcentaje con contraste ≥ 1.3:1 sobre blanco.
// Conserva el alfa del píxel y aplica la opacidad efectiva del elemento.
export function pctApagado(datos, opacidad = .35) {
  const lineal = c => { c /= 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
  let total = 0, visibles = 0;
  for (let i = 0; i < datos.length; i += 4) {
    if (datos[i + 3] < 128) continue;
    total++;
    const alfa = datos[i + 3] / 255 * opacidad;
    const rgb = [0, 1, 2].map(j => lineal(datos[i + j] * alfa + 255 * (1 - alfa)));
    if (1.05 / (.2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2] + .05) >= 1.3) visibles++;
  }
  return total ? Math.round(100 * visibles / total) : null;
}

// Puntuación pura (se inyecta también en la página): rgba del glifo contra un fondo [r,g,b]
export function puntuarGlifo(datos, [br, bg, bb]) {
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const lab = (r, g, b) => {
    const X = (0.4124 * lin(r) + 0.3576 * lin(g) + 0.1805 * lin(b)) / 0.95047, Y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b), Z = (0.0193 * lin(r) + 0.1192 * lin(g) + 0.9505 * lin(b)) / 1.08883;
    const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
  };
  const lf = lum(br, bg, bb), Lf = lab(br, bg, bb);
  // Fondo muy oscuro (la lámina oscura #0b0b0e, un marino casi negro): 2:1 es un piso bajísimo (un morado oscuro ya pasa)
  // y el ΔE sobre negro engaña. Ahí solo cuenta el contraste de 3:1 de WCAG 1.4.11 (objetos gráficos).
  const oscuro = lf < 0.05;
  let op = 0, ve = 0;
  for (let i = 0; i < datos.length; i += 4) {
    const a = datos[i + 3] / 255; if (a < 0.5) continue;
    op++;
    const r = datos[i] * a + br * (1 - a), g = datos[i + 1] * a + bg * (1 - a), b = datos[i + 2] * a + bb * (1 - a);
    const l = lum(r, g, b), k = (Math.max(l, lf) + 0.05) / (Math.min(l, lf) + 0.05);
    const L = lab(r, g, b), de = Math.hypot(L[0] - Lf[0], L[1] - Lf[1], L[2] - Lf[2]);
    // ΔE ≥ 40 cuenta si el píxel tiene color propio (croma ≥ 35: el amarillo de ⚠️ o 💡 sobre gris claro se ve) o algo de
    // contraste de luz (≥ 1.5:1). Una silueta gris azulada (croma ~17) sobre morado da ΔE ≥ 40 con 1.1:1 y se ve apagada.
    if (oscuro ? k >= 3 : (k >= 2 || (de >= 40 && (k >= 1.5 || Math.hypot(L[1], L[2]) >= 35)))) ve++;
  }
  return op ? Math.round((ve / op) * 100) : null;
}

// porLamina[i].medir: [{ tipo, ch, src, svg, fondos, neutro? }] → [{ i, ch, pct, neutro? }] (pct = el peor fondo). `neutro`:
// un emoji fuera de la tabla medida sobre blanco, tarjeta u oscura (qa.mjs le aplica el umbral de la tabla, no el de color).
export async function medirSobreColor(browser, porLamina, dirSalida) {
  const items = [], cache = new Map();
  porLamina.forEach(r => (r.medir || []).forEach(m => {
    let url = '';
    if (m.tipo === 'img' && m.src) { const f = path.join(dirSalida, m.src); if (fs.existsSync(f)) url = `data:image/${/\.png$/i.test(f) ? 'png' : /\.svg$/i.test(f) ? 'svg+xml' : 'webp'};base64,${fs.readFileSync(f).toString('base64')}`; }
    if (m.tipo === 'svg') url = 'data:image/svg+xml;base64,' + Buffer.from(svgAutonomo(m.svg)).toString('base64');
    if (m.tipo === 'txt' && process.platform !== 'darwin') return;
    const promedio = [0, 1, 2].map(j => Math.round(m.fondos.reduce((s, c) => s + c[j], 0) / m.fondos.length));
    const fondos = m.fondos.length > 1 ? [...m.fondos, promedio] : m.fondos;
    const clave = `${m.tipo}|${m.ch}|${url.length}|${url.slice(-64)}|${JSON.stringify(fondos)}|${m.apagado ?? ""}`;
    if (!cache.has(clave)) { cache.set(clave, items.length); items.push({ tipo: m.tipo, ch: m.ch, url, fondos, apagado: m.apagado }); }
    m._k = cache.get(clave); m._pastel = esPastel(m.fondos); m._oscuro = esOscuro(m.fondos); m._neutro = m.neutro === true;
  }));
  if (!items.length) return [];
  const pg = await browser.newPage();
  let pcts = [];
  try {
    await pg.addScriptTag({ content: `window.puntuarGlifo = ${puntuarGlifo.toString()}; window.pctApagado = ${pctApagado.toString()};` });
    pcts = await pg.evaluate(async lista => {
      const S = 128, c = new OffscreenCanvas(S, S), g = c.getContext('2d', { willReadFrequently: true });
      const out = [];
      for (const it of lista) {
        g.clearRect(0, 0, S, S);
        try {
          if (it.tipo === 'txt') { g.font = `${S * 0.8}px "Apple Color Emoji"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.ch, S / 2, S / 2); }
          else { const im = new Image(); im.src = it.url; await im.decode(); g.drawImage(im, 0, 0, S, S); }
          const d = g.getImageData(0, 0, S, S).data;
          if (it.apagado != null) { out.push(window.pctApagado(d, it.apagado)); continue; }
          const ps = it.fondos.map(f => window.puntuarGlifo(d, f)).filter(x => x != null);
          out.push(ps.length ? Math.min(...ps) : null);
        } catch { out.push(null); }
      }
      return out;
    }, items);
  } finally { await pg.close(); }
  const res = [];
  porLamina.forEach(r => (r.medir || []).forEach(m => { if (m._k != null) res.push({ i: r.i, ch: m.ch, pct: pcts[m._k], apagado: m.apagado, pastel: m._pastel, oscuro: m._oscuro, ...(m._neutro ? { neutro: true, fondoN: m.fondoN } : {}) }); }));
  // un hallazgo por emoji y lámina
  return [...new Map(res.map(x => [`${x.i}|${x.ch}|${x.pct}|${x.apagado ?? ""}`, x])).values()];
}
