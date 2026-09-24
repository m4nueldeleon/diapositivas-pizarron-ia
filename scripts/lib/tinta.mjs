// tinta.mjs — la métrica de encuadre del comparador de réplica (funciones puras: se prueban sin navegador
// y comparar.mjs las inyecta en Chromium para leer los píxeles).
//
// «Caja de tinta» = el rectángulo que encierra lo que está dibujado en la lámina:
//   · píxeles oscuros y poco saturados (luminancia < 120, max−min < 60): texto, emojis oscuros, líneas;
//   · tinta roja (R > 150, G < 90, B < 90): la capa a mano.
// Los fondos pálidos (cuadrantes, calendario, tarjetas) NO cuentan, y se ignora la esquina inferior derecha
// donde viven la marca de agua o la firma (x > 75%, y > 86% del lienzo: una firma larga como
// «Consulting.com» empieza antes del 81%).
// Mide ENCUADRE, no estilo: no sustituye la revisión a ojo.

// rgba: Uint8ClampedArray/Array de w×h×4. Devuelve {x, y, w, h} en % del lienzo, o null si no hay tinta.
export function cajaTinta(rgba, w, h) {
  // autocontenida: comparar.mjs la inyecta sola en el navegador
  const esTintaL = (r, g, b) => { const lum = 0.299 * r + 0.587 * g + 0.114 * b, sat = Math.max(r, g, b) - Math.min(r, g, b); return (lum < 120 && sat < 60) || (r > 150 && g < 90 && b < 90); };
  const xMarca = w * 0.75, yMarca = h * 0.86;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x > xMarca && y > yMarca) continue;
    const i = (y * w + x) * 4;
    if (!esTintaL(rgba[i], rgba[i + 1], rgba[i + 2])) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) return null;
  return { x: (x0 / w) * 100, y: (y0 / h) * 100, w: ((x1 - x0 + 1) / w) * 100, h: ((y1 - y0 + 1) / h) * 100 };
}

// Diferencia entre dos cajas (en puntos porcentuales) y si falla (alguna pasa del umbral)
export function compararCajas(a, b, umbral = 8) {
  if (!a || !b) return { dx: null, dy: null, dw: null, dh: null, falla: true };
  const d = { dx: b.x - a.x, dy: b.y - a.y, dw: b.w - a.w, dh: b.h - a.h };
  return { ...d, falla: Object.values(d).some(v => Math.abs(v) > umbral) };
}

// Empareja láminas «r<seg>» con archivos «ref_<seg>.jpg|png». Devuelve pares y lo que sobra de cada lado.
export function emparejar(ids, archivos) {
  const refs = new Map();
  for (const f of archivos) { const m = /^ref_(\d+)\.(jpe?g|png)$/i.exec(f); if (m) refs.set(m[1], f); }
  const pares = [], sinRef = [];
  for (const id of ids) {
    const m = /^r(\d+)$/.exec(String(id || ''));
    if (!m) continue;
    if (refs.has(m[1])) { pares.push({ id, seg: +m[1], ref: refs.get(m[1]) }); refs.delete(m[1]); } else sinRef.push(id);
  }
  return { pares: pares.sort((a, b) => a.seg - b.seg), sinRef, sinLamina: [...refs.values()] };
}
