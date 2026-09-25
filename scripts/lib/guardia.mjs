// R17 (juez r16, pendiente 7): la guardia de piezas aprobadas solo miraba errores y una baja de nota de más de 3
// puntos; un cambio que movía una lista o encogía un chat sin tocar la nota pasaba en silencio. Estas funciones dan a
// cada pieza aprobada tres fotos: los avisos del QA (normalizados, sin cifras), la geometría medida por lámina y un
// hash perceptual (dHash 16×16) de cada PNG. pruebas/r14-aprobados.test.mjs las compara contra esperado.json.
import fs from 'node:fs';
import path from 'node:path';

// Un aviso sin sus cifras: «burbuja de 5 renglones» y «burbuja de 6 renglones» son el mismo aviso.
export const normalizarAviso = s => String(s).replace(/\d+([.,]\d+)?/g, '#').replace(/\s+/g, ' ').trim();

export const avisosNuevos = (esperados = [], actuales = []) => {
  const antes = new Set(esperados.map(normalizarAviso));
  return [...new Set(actuales.map(normalizarAviso))].filter(a => !antes.has(a));
};

const redondear = n => Math.round(n * 10) / 10;

// Por lámina, cada medida numérica de geometria_r11 (las listas, como mínimo y máximo).
export function fotoGeometrica(geometria = []) {
  const foto = {};
  for (const g of geometria) {
    const medidas = {};
    for (const [clave, valor] of Object.entries(g)) {
      if (clave === 'lamina') continue;
      if (typeof valor === 'number' && Number.isFinite(valor)) medidas[clave] = redondear(valor);
      else if (Array.isArray(valor) && valor.length && valor.every(v => typeof v === 'number')) {
        medidas[`${clave}_min`] = redondear(Math.min(...valor));
        medidas[`${clave}_max`] = redondear(Math.max(...valor));
      }
    }
    if (Object.keys(medidas).length) foto[g.lamina] = medidas;
  }
  return foto;
}

// Tolerancias: 5 puntos en porcentajes; en px, 10% o 4 px (lo mayor). Una medida que desaparece también cuenta.
export function diferenciasGeometria(antes = {}, ahora = {}) {
  const difs = [];
  for (const [lamina, medidas] of Object.entries(antes)) {
    for (const [clave, valor] of Object.entries(medidas)) {
      const actual = ahora[lamina]?.[clave];
      if (actual === undefined) { difs.push(`lámina ${lamina}: ${clave} ya no se mide (era ${valor})`); continue; }
      const tope = /_pct/.test(clave) ? 5 : Math.max(4, Math.abs(valor) * .1);
      if (Math.abs(actual - valor) > tope) difs.push(`lámina ${lamina}: ${clave} ${valor} → ${actual}`);
    }
  }
  return difs;
}

// dHash 16×16 (256 bits, 64 hex) calculado en Chromium: la misma lámina renderizada dos veces da el mismo hash.
export async function hashesPNG(page, dirLaminas) {
  const archivos = fs.readdirSync(dirLaminas).filter(f => f.endsWith('.png')).sort();
  const hashes = {};
  for (const f of archivos) {
    const datos = 'data:image/png;base64,' + fs.readFileSync(path.join(dirLaminas, f)).toString('base64');
    hashes[f] = await page.evaluate(async src => {
      const img = new Image(); img.src = src; await img.decode();
      const c = document.createElement('canvas'); c.width = 17; c.height = 16;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, 17, 16);
      const px = ctx.getImageData(0, 0, 17, 16).data, gris = i => px[i] * .299 + px[i + 1] * .587 + px[i + 2] * .114;
      let bits = '';
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) bits += gris((y * 17 + x) * 4) > gris((y * 17 + x + 1) * 4) ? '1' : '0';
      return bits.match(/.{4}/g).map(b => parseInt(b, 2).toString(16)).join('');
    }, datos);
  }
  return hashes;
}

// R17 [juez r17]: quitar un subrayado cambia 2 de 256 bits del hash y ninguna medida geométrica. La tinta roja se cuenta
// aparte, a 480×270 (el umbral de la tinta a mano: r > 150, g y b < 110).
export async function rojoPNG(page, dirLaminas) {
  const archivos = fs.readdirSync(dirLaminas).filter(f => f.endsWith('.png')).sort();
  const rojo = {};
  for (const f of archivos) {
    const datos = 'data:image/png;base64,' + fs.readFileSync(path.join(dirLaminas, f)).toString('base64');
    rojo[f] = await page.evaluate(async src => {
      const img = new Image(); img.src = src; await img.decode();
      const w = 480, h = Math.round(480 * img.height / img.width), c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
      // R18 [juez r18]: por celdas (6 × 4). Un 📌 rojo grande escondía la pérdida del subrayado en el total (10390 → 9960).
      const d = ctx.getImageData(0, 0, w, h).data, celdas = Array(24).fill(0);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (d[i] > 150 && d[i + 1] < 110 && d[i + 2] < 110) celdas[Math.min(3, Math.floor(y * 4 / h)) * 6 + Math.min(5, Math.floor(x * 6 / w))]++;
      }
      return celdas;
    }, datos);
  }
  return rojo;
}

// Una celda con tinta roja (≥ 40 px a 480) que pierde o gana más del 30% cambió su capa roja. Acepta la foto vieja (un total).
export function diferenciasRojo(antes = {}, ahora = {}) {
  const difs = [], suma = v => Array.isArray(v) ? v.reduce((a, b) => a + b, 0) : v;
  for (const [archivo, n] of Object.entries(antes)) {
    const m = ahora[archivo]; if (m === undefined) continue;
    const pares = Array.isArray(n) && Array.isArray(m) ? n.map((x, i) => [x, m[i], i]) : [[suma(n), suma(m), -1]];
    for (const [a, b, i] of pares) if (Math.max(a, b) >= 40 && Math.abs(b - a) > .3 * Math.max(a, 1)) {
      difs.push(`${archivo}: tinta roja ${a} → ${b} px${i >= 0 ? ` (celda ${i % 6 + 1},${Math.floor(i / 6) + 1})` : ''}`); break;
    }
  }
  return difs;
}

export const hamming = (a, b) => [...a].reduce((n, c, i) => {
  let x = parseInt(c, 16) ^ parseInt(b[i] ?? '0', 16), k = 0;
  while (x) { k += x & 1; x >>= 1; }
  return n + k;
}, 0);

// Hasta 8 de 256 bits: el antialias no cambia un hash; un bloque que se corre, un trazo nuevo o una letra más chica sí.
export function diferenciasHash(antes = {}, ahora = {}, tope = 8) {
  const difs = [];
  for (const [archivo, h] of Object.entries(antes)) {
    if (!ahora[archivo]) { difs.push(`${archivo}: ya no se genera`); continue; }
    const d = hamming(h, ahora[archivo]);
    if (d > tope) difs.push(`${archivo}: ${d} bits distintos`);
  }
  for (const archivo of Object.keys(ahora)) if (!antes[archivo]) difs.push(`${archivo}: PNG nuevo`);
  return difs;
}

// El hash depende de las fuentes y del set de emojis: solo se compara en la plataforma donde se tomó.
export const plataformaHash = emoji => `${process.platform}-${emoji || 'auto'}`;
