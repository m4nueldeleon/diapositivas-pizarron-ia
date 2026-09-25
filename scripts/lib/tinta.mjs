// tinta.mjs — la métrica de encuadre del comparador de réplica (funciones puras: se prueban sin navegador
// y comparar.mjs las inyecta en Chromium para leer los píxeles).
//
// «Caja de tinta» = el rectángulo que encierra lo que está dibujado en la lámina:
//   · píxeles oscuros (luminancia < 150, sin importar la saturación): texto, líneas, emojis oscuros;
//   · píxeles saturados que no son pastel (max−min > 90 y luminancia < 225): el 🏆 dorado, la bolsa 💰 —
//     antes solo contaban en el JPG del video (la compresión los ensucia) y no en nuestro PNG, y el par
//     r90/ref_90 daba un falso dy de +13;
//   · tinta roja (R > 150, G < 90, B < 90): la capa a mano.
// Los fondos pálidos (cuadrantes rosa 247,195,195; calendario; tarjetas) NO cuentan, y se ignora la esquina inferior derecha
// donde viven la marca de agua o la firma (x > 75%, y > 86% del lienzo: una firma larga como
// «Consulting.com» empieza antes del 81%).
// Mide ENCUADRE, no estilo: no sustituye la revisión a ojo.

// rgba: Uint8ClampedArray/Array de w×h×4. Devuelve {x, y, w, h} en % del lienzo, o null si no hay tinta.
export function cajaTinta(rgba, w, h) {
  // autocontenida: comparar.mjs la inyecta sola en el navegador
  const esTintaL = (r, g, b) => { const lum = 0.299 * r + 0.587 * g + 0.114 * b, sat = Math.max(r, g, b) - Math.min(r, g, b); return lum < 150 || (sat > 90 && lum < 225) || (r > 150 && g < 90 && b < 90); };
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

// Densidad de tinta por celda (W×H, por omisión 8×5) de un RGBA de w0×h0: la COMPOSICIÓN de la lámina (dónde
// hay contenido), con la misma regla de tinta que cajaTinta. Calibrada con la réplica (ronda 3): los pares correctos
// dan 0.86-0.99 y los cruzados llegan hasta 0.605 (r255 del deck viejo contra otra escena): umbral 0.7. Dos frases
// centradas pueden parecerse de verdad: ahí manda el ojo. (La calibración salió de 10 pares correctos y 6 cruzados.)
// Una miniatura en gris de 48×27 no separaba nada (un par correcto daba 0.06). Autocontenida (se inyecta).
export function densidadTinta(rgba, w0, h0, W = 8, H = 5) {
  const out = new Array(W * H).fill(0);
  for (let y = 0; y < h0; y++) for (let x = 0; x < w0; x++) {
    const i = (y * w0 + x) * 4, r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b, sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (lum < 150 || (sat > 90 && lum < 225) || (r > 150 && g < 90 && b < 90)) out[Math.min(H - 1, Math.floor((y * H) / h0)) * W + Math.min(W - 1, Math.floor((x * W) / w0))]++;
  }
  return out;
}

// Correlación de Pearson entre dos miniaturas (−1 a 1). Sin varianza (toda blanca) devuelve 0, no NaN.
// Dice si el cuadro del video y nuestra lámina son la MISMA escena (antes de medir encuadre).
export function correlacionMiniaturas(a, b) {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i++) { const da = a[i] - ma, db = b[i] - mb; sab += da * db; saa += da * da; sbb += db * db; }
  return saa && sbb ? sab / Math.sqrt(saa * sbb) : 0;
}

// ¿Es OTRA escena? Con correlación menor que el umbral el par no se mide (id desfasado o cuadro de otro momento).
export const MIN_PARECIDO = 0.7;
export const esOtraEscena = (parecido, minParecido = MIN_PARECIDO) => !(parecido >= minParecido);

// Trazo de concepto propio: misma semilla, temblor transversal y curva suave que runtime.js.
function azarTrazo(texto) {
  let s = [...texto].reduce((n, c) => Math.imul(n ^ c.codePointAt(0), 16777619), 2166136261) >>> 0;
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function curvaTrazo(puntos) {
  const f = n => n.toFixed(1);
  return `M${puntos[0].map(f).join(' ')}` + puntos.slice(1).map((p2, i) => {
    const p0 = puntos[i - 1] || puntos[i], p1 = puntos[i], p3 = puntos[i + 2] || p2;
    const a = p1.map((v, k) => v + (p2[k] - p0[k]) / 6), b = p2.map((v, k) => v - (p3[k] - p1[k]) / 6);
    return ` C${[...a, ...b, ...p2].map(f).join(' ')}`;
  }).join('');
}
export function figuraTrazo(figura, rotulo) {
  const azar = azarTrazo(`${figura}|${rotulo}`);
  if (figura === 'circulo') {
    const puntos = Array.from({ length: 49 }, (_, i) => {
      const t = i / 48 * Math.PI * 2, radio = 99 + (azar() - .5) * 2.4;
      return [120 + Math.cos(t) * radio, 120 + Math.sin(t) * radio];
    });
    return [curvaTrazo(puntos) + 'Z'];
  }
  const vertices = figura === 'triangulo' ? [[120, 18], [224, 215], [16, 215], [120, 18]] : [[18, 42], [222, 42], [222, 198], [18, 198], [18, 42]];
  return vertices.slice(1).map((q, j) => {
    const p = vertices[j], dx = q[0] - p[0], dy = q[1] - p[1], largo = Math.hypot(dx, dy), curvatura = (azar() - .5) * 2.4 * 2.2;
    return curvaTrazo(Array.from({ length: 7 }, (_, i) => {
      const t = i / 6, desvio = Math.sin(Math.PI * t) * curvatura + (i && i < 6 ? (azar() - .5) * 2.4 : 0);
      return [p[0] + dx * t - dy / largo * desvio, p[1] + dy * t + dx / largo * desvio];
    }));
  });
}

// Anclas medidas independientemente en ambos cuadros. Autocontenida para Chromium.
// Las bandas de tinta detectan distribución vertical; el glifo cromático excluye tinta roja.
export function anclasTinta(rgba, w, h) {
  const filas = new Array(h).fill(0), pixeles = [], color = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x > w * .8 && y > h * .88) continue;
    const i = (y * w + x) * 4, [r, g, b] = rgba.slice(i, i + 3);
    const lum = .299 * r + .587 * g + .114 * b, sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (lum < 150 || (sat > 90 && lum < 225)) { filas[y]++; pixeles.push([x,y]); }
    if (sat > 55 && lum < 235 && !(r > g * 1.5 && r > b * 1.5)) color.push([x,y]);
  }
  const caja = ps => {
    if (!ps.length) return null;
    const limites = ps.reduce((r,[x,y]) => [Math.min(r[0],x),Math.min(r[1],y),Math.max(r[2],x),Math.max(r[3],y)], [w,h,0,0]);
    return { x: limites[0]/w*100, y: limites[1]/h*100,
      w: (limites[2]-limites[0]+1)/w*100, h:(limites[3]-limites[1]+1)/h*100 };
  };
  const bandas=[]; let inicio=null, ultimo=0;
  for (let y=0;y<=h+6;y++) {
    if (filas[y]>1) { if(inicio===null) inicio=y; ultimo=y; }
    else if(inicio!==null && y-ultimo>6) {
      const ps=pixeles.filter(p=>p[1]>=inicio&&p[1]<=ultimo);
      if(ps.length>25) bandas.push(caja(ps));
      inicio=null;
    }
  }
  const emoji=caja(color), silueta=new Array(256).fill(0);
  if(emoji) for(const [x,y] of color) {
    const xx=Math.min(15,Math.floor((x/w*100-emoji.x)/emoji.w*16));
    const yy=Math.min(15,Math.floor((y/h*100-emoji.y)/emoji.h*16));
    silueta[yy*16+xx]=1;
  }
  return { bandas, emoji, silueta, limite: 'El glifo cromático puede agrupar varios emojis; tonos y texturas requieren juicio visual.' };
}

export function compararAnclas(a,b,umbral=3) {
  const comparar=(x,y)=>x&&y ? Object.fromEntries(['x','y','w','h'].map(k=>[k,+(y[k]-x[k]).toFixed(2)])) : null;
  const bandas=a.bandas.map((x,i)=>comparar(x,b.bandas[i]));
  const emoji=comparar(a.emoji,b.emoji);
  const distancias = a.bandas.slice(1).map((x,i)=>({
    referencia: +(x.y-a.bandas[i].y-a.bandas[i].h).toFixed(2),
    nuestra: b.bandas[i+1] ? +(b.bandas[i+1].y-b.bandas[i].y-b.bandas[i].h).toFixed(2) : null,
  }));
  const union=a.silueta.reduce((n,x,i)=>n+Number(x||b.silueta[i]),0);
  const inter=a.silueta.reduce((n,x,i)=>n+Number(x&&b.silueta[i]),0);
  const iou=union ? +(inter/union).toFixed(3) : null;
  const falla=a.bandas.length!==b.bandas.length || bandas.some(x=>!x||Object.values(x).some(v=>Math.abs(v)>umbral))
    || (emoji && Object.values(emoji).some(v=>Math.abs(v)>umbral)) || Boolean(a.emoji)!==Boolean(b.emoji) || (iou!==null && iou<.8);
  return { umbral, bandas, emoji, distancias, silueta_iou:iou, falla: Boolean(falla), estado:falla?'revisar-elementos':'sin-desvio-detectado',
    secuencia:{estado:'sin-referencia-temporal',motivo:'Un cuadro aislado no acredita el orden de aparición.'} };
}
