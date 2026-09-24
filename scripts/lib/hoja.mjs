// hoja.mjs — hojas de contacto para revisar un deck de un vistazo.
//   hoja.jpg        el último paso de cada lámina, rotulado «N · id» con el MISMO número que el PNG
//                   (NN-id-P.png) y que el QA («lámina N»); las `camara` ocupan su lugar como cuadro gris.
//   hoja-pasos.jpg  una fila por lámina con TODOS sus pasos («N.P»): así se revisa el orden del revelado.
import { escapar } from './markup.mjs';

const ESTILO = `body{margin:0;background:#dcdcdc;font:600 18px system-ui}
figure{margin:0;position:relative}img,.cam{display:block;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.cam{background:#9a9a9a;color:#fff;display:grid;place-items:center;font-size:34px}
figcaption{position:absolute;left:8px;top:8px;background:#111;color:#fff;padding:2px 8px;border-radius:4px}`;

// Rótulo común: número de lámina (1 = la primera del deck, contando las cámaras) y su id
export const rotulo = c => `${c.n} · ${c.id}`;

// Cuadros de la hoja a partir del manifiesto de render (pasos.json): uno por lámina, su último paso
export function cuadrosHoja(manifiesto) {
  const porLamina = new Map();
  manifiesto.forEach(m => porLamina.set(m.lamina, m));        // se queda con el último paso de cada una
  return [...porLamina.values()].map(m => ({ n: m.lamina + 1, id: m.id, camara: m.tipo === 'camara', archivo: m.archivo }));
}

export function htmlHoja(cuadros, { W, H, ancho = 560 }) {
  const cols = cuadros.length <= 4 ? 2 : cuadros.length <= 9 ? 3 : 4, alto = Math.round(ancho * H / W);
  const fig = c => `<figure>${c.camara || !c.archivo
    ? `<div class="cam" style="width:${ancho}px;height:${alto}px">🎥 cámara</div>`
    : `<img src="${escapar(c.archivo)}" style="width:${ancho}px;height:${alto}px">`}<figcaption>${escapar(rotulo(c))}</figcaption></figure>`;
  return { cols, ancho, html: `<!doctype html><meta charset="utf-8"><style>${ESTILO}
  .g{display:grid;grid-template-columns:repeat(${cols},${ancho}px);gap:18px;padding:18px}</style>
  <div class="g">${cuadros.map(fig).join('')}</div>` };
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

export function htmlHojaPasos(filas, { W, H, ancho = 320 }) {
  const alto = Math.round(ancho * H / W);
  const max = Math.max(1, ...filas.map(f => f.pasos.length));
  const fila = f => `<div class="f"><div class="id">${escapar(rotulo(f))}</div>${f.pasos.map(p =>
    `<figure><img src="${escapar(p.archivo)}" style="width:${ancho}px;height:${alto}px"><figcaption>${escapar(p.etiqueta)}</figcaption></figure>`).join('')}</div>`;
  return { anchoTotal: 200 + max * (ancho + 12) + 36, html: `<!doctype html><meta charset="utf-8"><style>${ESTILO}
  .f{display:flex;gap:12px;align-items:center;padding:8px 18px}.id{width:188px;flex:none;font-size:20px;word-break:break-word}</style>
  ${filas.map(fila).join('')}` };
}
