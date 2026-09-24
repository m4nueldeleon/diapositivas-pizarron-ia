// hoja.mjs — hojas de contacto para revisar un deck de un vistazo.
//   hoja.jpg        el último paso de cada lámina, rotulado «N · id» con el MISMO número que el PNG
//                   (NN-id-P.png) y que el QA («lámina N»); las `camara` ocupan su lugar como cuadro gris, salvo el
//                   tramo en vivo (`vivo: true`), que sale con la consigna que ve el público y el rótulo «EN VIVO · m:ss».
//   hoja-pasos.jpg  una fila por lámina con TODOS sus pasos («N.P»): así se revisa el orden del revelado.
// Una clase (220-400 láminas) o un webinar (450-700) no caben en una imagen legible: con más de POR_HOJA láminas
// se pagina en hoja-01.jpg, hoja-02.jpg… (y hoja-pasos-01.jpg…, FILAS_POR_HOJA filas cada una), cada página
// con su encabezado «láminas 21-40 de 240 · hoja 2/12». El rótulo de cada cuadro sigue siendo el número global.
import { escapar } from './markup.mjs';

export const POR_HOJA = 20, FILAS_POR_HOJA = 10, ANCHO_MAX_PASOS = 2400;

// Trozos de n elementos como máximo, parejos (41 láminas → 14, 14, 13; no 20, 20, 1). Siempre al menos uno.
export function paginar(lista, n) {
  if (!lista.length) return [[]];
  const k = Math.ceil(lista.length / n), t = Math.ceil(lista.length / k);
  const out = [];
  for (let i = 0; i < lista.length; i += t) out.push(lista.slice(i, i + t));
  return out;
}
// Encabezado de una página: «láminas 21-40 de 240 · hoja 2/12» (vacío si hay una sola página)
export function tituloPagina(trozo, k, paginas, total) {
  if (paginas <= 1 || !trozo.length) return '';
  const r = `láminas ${trozo[0].n}-${trozo[trozo.length - 1].n} de ${total} · hoja ${k + 1}/${paginas}`;
  return k === 0 ? `${r} — revisa TODAS: hay ${paginas} hojas` : r;
}
// Nombre del archivo de cada página: hoja.jpg si es una sola; si no, hoja-01.jpg, hoja-02.jpg…
export const archivoPagina = (base, k, paginas) => (paginas <= 1 ? `${base}.jpg` : `${base}-${String(k + 1).padStart(2, '0')}.jpg`);
const encabezado = t => (t ? `<h1 style="margin:18px 18px 0;font:700 30px system-ui;color:#111">${escapar(t)}</h1>` : '');

// El rótulo va EN FLUJO, como una franja encima de la miniatura: sobre ella tapaba la esquina de la lámina (el primer
// encabezado de una tabla).
const ESTILO = `body{margin:0;background:#dcdcdc;font:600 18px system-ui}
figure{margin:0;display:flex;flex-direction:column;align-items:flex-start;gap:4px}img,.cam{display:block;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.cam{background:#9a9a9a;color:#fff;display:grid;place-items:center;font-size:34px}
figcaption{background:#111;color:#fff;padding:2px 8px;border-radius:4px;line-height:22px}`;

// Rótulo común: número de lámina (1 = la primera del deck, contando las cámaras) y su id; un cuadro clave dice su paso
const mmssV = s => `${Math.floor((Number(s) || 0) / 60)}:${String(Math.round(Number(s) || 0) % 60).padStart(2, '0')}`;
export const rotulo = c => `${c.n} · ${c.id}${c.clave ? ` · paso ${c.paso + 1}` : ''}${c.vivo ? ` · EN VIVO · ${mmssV(c.dur)}` : ''}`;

// Cuadros de la hoja a partir del manifiesto de render (pasos.json): uno por lámina, su último paso. Un paso
// `clave` (el stack a sangre lleno, antes de que el remate lo tape) sale además, antes del final y con el mismo número.
export function cuadrosHoja(manifiesto) {
  const porLamina = new Map();
  manifiesto.forEach(m => {
    const c = porLamina.get(m.lamina) || { claves: [], ultimo: null };
    if (m.clave) c.claves.push(m);
    c.ultimo = m;                                               // se queda con el último paso de cada una
    porLamina.set(m.lamina, c);
  });
  const cuadro = m => ({ n: m.lamina + 1, id: m.id, camara: m.tipo === 'camara' && !m.archivo, archivo: m.archivo, ...(m.vivo ? { vivo: true, dur: m.dur } : {}) });
  return [...porLamina.values()].flatMap(({ claves, ultimo }) => [
    ...claves.filter(m => m !== ultimo).map(m => ({ ...cuadro(m), clave: true, paso: m.paso })),
    cuadro(ultimo),
  ]);
}

export function htmlHoja(cuadros, { W, H, ancho = 560, titulo = '' }) {
  const cols = cuadros.length <= 4 ? 2 : cuadros.length <= 9 ? 3 : 4, alto = Math.round(ancho * H / W);
  const fig = c => `<figure><figcaption>${escapar(rotulo(c))}</figcaption>${c.camara || !c.archivo
    ? `<div class="cam" style="width:${ancho}px;height:${alto}px">🎥 cámara</div>`
    : `<img src="${escapar(c.archivo)}" style="width:${ancho}px;height:${alto}px">`}</figure>`;
  return { cols, ancho, html: `<!doctype html><meta charset="utf-8"><style>${ESTILO}
  .g{display:grid;grid-template-columns:repeat(${cols},${ancho}px);gap:18px;padding:18px}</style>
  ${encabezado(titulo)}<div class="g">${cuadros.map(fig).join('')}</div>` };
}

// Filas de la hoja de pasos: una por lámina que no es cámara, con todos sus PNG
export function filasPasos(manifiesto) {
  const filas = new Map();
  manifiesto.filter(m => m.archivo).forEach(m => {
    if (!filas.has(m.lamina)) filas.set(m.lamina, { n: m.lamina + 1, id: m.id, pasos: [] });
    filas.get(m.lamina).pasos.push({ archivo: m.archivo, etiqueta: `${m.lamina + 1}.${m.paso + 1}` });
  });
  return [...filas.values()];
}

export function htmlHojaPasos(filas, { W, H, ancho: anchoPedido = 320, titulo = '' }) {
  const max = Math.max(1, ...filas.map(f => f.pasos.length));
  // una lámina de muchos pasos no ensancha la hoja más de ~2400 px: los cuadros se achican
  const ancho = Math.max(120, Math.min(anchoPedido, Math.floor((ANCHO_MAX_PASOS - 236) / max) - 12));
  const alto = Math.round(ancho * H / W);
  const fila = f => `<div class="f"><div class="id">${escapar(rotulo(f))}</div>${f.pasos.map(p =>
    `<figure><figcaption>${escapar(p.etiqueta)}</figcaption><img src="${escapar(p.archivo)}" style="width:${ancho}px;height:${alto}px"></figure>`).join('')}</div>`;
  return { anchoTotal: 200 + max * (ancho + 12) + 36, html: `<!doctype html><meta charset="utf-8"><style>${ESTILO}
  .f{display:flex;gap:12px;align-items:center;padding:8px 18px}.id{width:188px;flex:none;font-size:20px;word-break:break-word}</style>
  ${encabezado(titulo)}${filas.map(fila).join('')}` };
}
