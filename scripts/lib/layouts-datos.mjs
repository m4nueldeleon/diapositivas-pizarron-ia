// layouts-datos.mjs — tabla a mano, gráficas, línea de tiempo, medidor, opciones, rejilla, prueba, chat,
// reparto, calendario, botón y círculos.
import { marcar, escapar, texto, nota, fuente, pasoDe, PERSONA, PIN, CURSOR_MANO, estrellas } from './comun.mjs';
import { unirGuiones } from './markup.mjs';

const COLOR = { v: 'var(--verde)', r: 'var(--rojo)', n: 'var(--naranja)', g: 'var(--gris)', a: 'var(--azul)', k: 'var(--tinta)' };
const HEX = { v: '#22a812', r: '#c8101e', n: '#d0661a', g: '#9a9a9a', a: '#3ea6f2', k: '#111111' };
// Rótulo sobre un diseño de datos: gris chico (.encabezado) por omisión; `encabezado_estilo: "frase"` lo
// pone negro a tamaño de frase, como la rejilla de 6:35 («To make $10k/month…»).
const rotulo = (ctx, l, extra = '') => (!l.encabezado ? '' : l.encabezado_estilo === 'frase'
  ? texto(ctx, l.encabezado, 'chico', 0, extra)
  : `<div class="encabezado"${ctx.P(0)}>${marcar(l.encabezado)}</div>`);
const celda = c => (typeof c === 'string' || typeof c === 'number' ? { texto: String(c) } : (c || {}));

// TABLA — la «tabla-marcador» escrita a mano que se llena columna por columna.
// Anclas: `f<N>` (la etiqueta de la fila N) y `c<N>-<M>` (la celda de la fila N, columna M; desde 0), para las
// `anotaciones`. `converger: { columna, texto, emoji?, paso? }` [7:30]: la pregunta manuscrita a la derecha de la tabla
// (que se angosta para dejarle sitio) y una curva roja fina desde cada celda de esa columna, todas en el mismo paso.
export function tabla(l, ctx) {
  const cols = l.columnas || [];            // encabezados de las columnas de datos
  const filas = l.filas || [];
  const vacias = l.vacias ?? 0;
  const modo = l.revelar || 'columnas';     // columnas | celdas | filas | todo
  const nCols = cols.length + vacias;
  const conv = l.converger && typeof l.converger === 'object' && Number.isInteger(l.converger.columna) && l.converger.columna >= 0 && l.converger.columna < cols.length ? l.converger : null;
  const W = (ctx.vertical ? 1000 : 1840) - (conv ? (ctx.vertical ? 0 : 480) : 0), H = ctx.vertical ? 1500 : 1010;
  const wEt = Math.round(W * (l.ancho_etiqueta || (ctx.vertical ? 0.24 : 0.155)));
  const wC = Math.round((W - wEt) / nCols);
  const anchos = tablaAnchos(l, ctx, W, wEt);
  const hF = Math.round(H / (filas.length + 1));
  // «fijas»: columnas que ya se vieron en láminas anteriores (la tabla crece de lámina en lámina)
  const fijas = Math.min(cols.length, Math.max(0, Math.floor(Number(l.fijas) || 0)));
  let paso = 0;
  const pasoCab = [], pasoCel = filas.map(() => []);
  for (let c = 0; c < cols.length; c++) {
    if (modo === 'todo' || c < fijas) { pasoCab[c] = 0; filas.forEach((_, f) => (pasoCel[f][c] = 0)); continue; }
    if (modo === 'filas') { pasoCab[c] = 0; continue; }
    paso++;
    pasoCab[c] = paso;
    filas.forEach(f => { if (modo === 'celdas') paso++; pasoCel[filas.indexOf(f)][c] = paso; });
  }
  if (modo === 'filas') filas.forEach((_, f) => { cols.forEach((__, c) => (pasoCel[f][c] = f + 1)); });
  const wCol = i => (anchos ? anchos.cols[i] : wC), wVac = anchos ? anchos.vacia : wC;
  const cab = `<tr style="height:${hF}px"><th class="esq" style="width:${wEt}px">${marcar(l.esquina ?? '')}</th>${
    cols.map((c, i) => `<th style="width:${wCol(i)}px"><span${ctx.P(pasoCab[i])}>${marcar(c)}</span></th>`).join('')}${
    Array.from({ length: vacias }, () => `<th style="width:${wVac}px"></th>`).join('')}</tr>`;
  const cuerpo = filas.map((f, fi) => `<tr style="height:${hF}px"><td class="fila-et"${ctx.A('f' + fi)}>${marcar(f.etiqueta || '')}</td>${
    cols.map((_, ci) => {
      const c = celda((f.celdas || [])[ci]);
      const col = COLOR[c.tono] || 'var(--tinta)';
      return `<td style="color:${col}"><span${ctx.P(pasoCel[fi][ci])}${ctx.A(`c${fi}-${ci}`)}${c.circulo ? ' data-circulo' : ''}>${marcar(c.texto || '')}</span></td>`;
    }).join('')}${Array.from({ length: vacias }, () => '<td></td>').join('')}</tr>`).join('');
  const tablaHtml = `<table class="tabla${anchos && anchos.parte ? ' parte' : ''}"${ctx.P(0)} style="width:${W}px${anchos ? `;--tt:${anchos.th}px;--td:${anchos.td}px;--tde:${anchos.td + 2}px` : ''}">${cab}${cuerpo}</table>`;
  if (!conv) return tablaHtml;
  const kc = pasoDe(conv, 'paso', ctx.max + 1);
  filas.forEach((_, fi) => ctx.con({ de: `c${fi}-${conv.columna}`, a: 'conv', estilo: 'converge', i: fi, n: filas.length, p: kc }));
  const pregunta = `<div class="pila"${ctx.P(kc)}${ctx.A('conv')} style="max-width:400px">${conv.emoji ? ctx.emoji(conv.emoji, 110) : ''}<div class="nota" style="--tn:60px;color:var(--tinta);margin-top:14px">${marcar(conv.texto || '')}</div></div>`;
  return `<div class="fila" style="gap:${ctx.vertical ? 40 : 110}px;align-items:center">${tablaHtml}${pregunta}</div>`;
}

// En 9:16 (1000 px de ancho) las columnas iguales de 16:9 encimaban las palabras largas («Dropshipping», «$1,000-5,000»):
// las columnas vacías que se llenan después quedan angostas (80 px) y el resto se reparte según la palabra más larga de
// cada columna; la letra baja por tabla hasta un piso de 34 px (td) y 38 (th). Si ni así cabe una tabla de más de 3
// columnas de datos, se avisa: pártela en dos láminas con `fijas` (no se transpone: rompe el revelado por columnas).
const palabraMax = t => Math.max(1, ...String(t ?? '').replace(/[*_=~^]/g, '').split(/[\s\n]+|\\n/).map(w => [...w].length));
function tablaAnchos(l, ctx, W, wEt) {
  if (!ctx.vertical) return null;
  const cols = l.columnas || [], filas = l.filas || [], vacias = l.vacias ?? 0;
  if (!cols.length) return null;
  const vacia = 80, util = W - wEt - vacias * vacia;
  const largo = cols.map((c, i) => Math.max(palabraMax(c) * 50 / 44, ...filas.map(f => palabraMax(celda((f.celdas || [])[i]).texto))));
  const tot = largo.reduce((a, b) => a + b, 0);
  const anchosC = largo.map(x => Math.floor(util * x / tot));
  // letra que hace caber la palabra más larga de cada columna (Caveat ≈ 0.5 em por letra, 24 px de relleno)
  const cabe = Math.min(...anchosC.map((w, i) => (w - 24) / (0.5 * largo[i])));
  const td = Math.max(34, Math.min(44, Math.floor(cabe)));
  const parte = cabe < 34;
  if (parte && cols.length > 3) ctx.avisos.push(`la tabla no cabe en 9:16 con ${cols.length} columnas de datos (la letra quedaría bajo 34 px): pártela en dos láminas con "fijas" o usa 16:9`);
  return { cols: anchosC, vacia, td, th: Math.max(38, Math.min(50, td + 6)), parte };
}

// Utilidades de SVG para las gráficas
const path = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
const formas = {
  recta: x => x, exponencial: x => Math.pow(x, 2.3), curva: x => Math.sqrt(x), plana: x => 0.02 + x * 0.1,   // plana nace abajo: no «va ganando» al inicio
  s: x => 1 / (1 + Math.exp(-10 * (x - 0.5))), baja: x => 1 - Math.pow(x, 0.7),
};

// GRÁFICA — líneas (tiempo contra dinero, escala contra costo), barras o crecimiento.
export function grafica(l, ctx) {
  const tipo = l.grafica || 'lineas';   // lineas | barras | crecimiento
  // En 9:16 el área es alta (940×1000) y sin los 330 px de la etiqueta lateral: la banda va arriba, dentro [r4, escala]
  const V = ctx.vertical;
  const W = V ? 940 : 1500, H = V ? 1000 : 660, x0 = 80, y0 = H - 60, x1 = V ? W - 70 : W - 330, y1 = V ? 150 : 50;
  let svg = '';
  if (tipo === 'barras') {
    const bs = l.barras || [];
    const val = b => Math.max(0, Number(b.valor) || 0);
    const max = Math.max(1, ...bs.map(val));
    const nb = Math.max(1, bs.length), gap = nb > 1 ? Math.max(40, Math.min(230, (W - 200) * 0.35 / (nb - 1))) : 0;
    const bw = Math.min(250, (W - 200 - gap * (nb - 1)) / nb);
    const inicio = (W - (bs.length * bw + (bs.length - 1) * gap)) / 2;
    // Sobre la barra van, de abajo hacia arriba, la cifra (valor_texto) y el emoji. La altura que ocupan se
    // reserva UNA vez para toda la gráfica (misma escala en todas las barras): así la barra más alta no manda
    // el emoji al título y el emoji nunca tapa la cifra [6:15, 16:15].
    const hayEmoji = bs.some(b => b.emoji), hayValor = bs.some(b => b.valor_texto);
    const cabeza = 80 + (hayEmoji ? (hayValor ? 240 : 180) : 0);
    svg += `<line x1="40" y1="${y0}" x2="${W - 40}" y2="${y0}" stroke="#bdbdbd" stroke-width="3"/>`;
    bs.forEach((b, i) => {
      const h = Math.max(20, (val(b) / max) * (y0 - cabeza));
      const x = inicio + i * (bw + gap), c = HEX[b.tono] || HEX[i === bs.length - 1 ? 'v' : 'a'];
      const k = l.revelar === 'barras' ? i : 0;
      const gid = `gb-${ctx.uid}-${i}`;
      svg += `<g${ctx.P(k)}><defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".85"/><stop offset="1" stop-color="${c}"/></linearGradient></defs>
        <rect x="${x}" y="${y0 - h}" width="${bw}" height="${h}" rx="6" fill="url(#${gid})"/>
        <text x="${x + bw / 2}" y="${y0 + 66}" text-anchor="middle" font-size="50" font-weight="500" fill="#222">${escapar(b.etiqueta || '')}</text>
        ${b.valor_texto ? `<text x="${x + bw / 2}" y="${y0 - h - 30}" text-anchor="middle" font-size="56" font-weight="800" fill="${c}">${escapar(b.valor_texto)}</text>` : ''}</g>`;
      if (b.emoji) ctx.extraSobreBarras = (ctx.extraSobreBarras || []).concat({ i, x: x + bw / 2, y: y0 - h, e: b.emoji, k, v: !!b.valor_texto });
    });
  } else {
    const series = l.series || (tipo === 'crecimiento' ? [{ forma: 'exponencial', tono: 'v' }] : []);
    const ejes = `<path d="M${x0} ${y1 - 10} L${x0} ${y0} L${x1 + 60} ${y0}" stroke="#555" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    svg += tipo === 'crecimiento' ? ejes : ejes + Array.from({ length: 4 }, (_, i) => `<line x1="${x0}" x2="${x1 + 60}" y1="${y1 + i * (y0 - y1) / 4}" y2="${y1 + i * (y0 - y1) / 4}" stroke="#e6e6e6" stroke-width="2" stroke-dasharray="6 8"/>`).join('');
    const finales = [];
    series.forEach((s, i) => {
      const f = formas[s.forma] || formas.recta;
      const pts = Array.from({ length: 41 }, (_, j) => { const x = j / 40; return [x0 + x * (x1 - x0), y0 - f(x) * (y0 - y1 - 20) - 6]; });
      const c = HEX[s.tono] || HEX[['a', 'r', 'v', 'n'][i % 4]];
      const k = l.revelar === 'series' ? i : 0;
      finales.push({ p: pts[40], c, s, k, pts });
      svg += `<g${ctx.P(k)}><path d="${path(pts)}" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round" data-trazo pathLength="1"/>
        <path d="M${pts[40][0] - 28} ${pts[40][1] + 6} L${pts[40][0]} ${pts[40][1]} L${pts[40][0] - 10} ${pts[40][1] + 28}" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" data-punta/>
        ${s.puntos ? pts.filter((_, j) => j % 8 === 4).map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="10" fill="${c}"/>`).join('') : ''}
        __ETQ${i}__</g>`;
    });
    // Etiquetas de serie: cada una junto a SU línea, sin cruzar ninguna línea, sin tocar la punta de flecha y sin
    // pasar del eje. Se prueban posiciones cerca del final de la línea (arriba-izquierda, abajo-izquierda,
    // abajo-derecha) y, si chocan, más atrás; la de la serie de arriba empieza por encima de su línea.
    const orden = finales.map((f, i) => ({ i, y: f.p[1] })).sort((a, b) => a.y - b.y);
    const ancho = t => [...t].length * 46 * 0.56;
    const obst = [];
    const bandaX = V ? x1 - 300 : x1 + 24, bandaY = y => (V ? y - 130 : y);
    if (l.banda && finales.length >= 2) obst.push({ x0: bandaX, x1: bandaX + 300, y0: bandaY(Math.min(...finales.map(f => f.p[1]))) - 36, y1: bandaY(Math.min(...finales.map(f => f.p[1]))) + 36 });
    const choca = b => finales.some(f => f.pts.some((q, j) => j && [0, 0.25, 0.5, 0.75].some(t => {
      const x = f.pts[j - 1][0] + (q[0] - f.pts[j - 1][0]) * t, y = f.pts[j - 1][1] + (q[1] - f.pts[j - 1][1]) * t;
      return x > b.x0 - 10 && x < b.x1 + 10 && y > b.y0 - 10 && y < b.y1 + 10;
    }))) || obst.some(o => o.x0 < b.x1 && o.x1 > b.x0 && o.y0 < b.y1 && o.y1 > b.y0);
    const caja = (x, y, fin, w) => ({ x0: fin ? x - w : x, x1: fin ? x : x + w, y0: y - 40, y1: y + 10 });
    const dentro = b => b.x0 >= x0 + 10 && b.x1 <= x1 + 60 && b.y0 >= y1 - 40 && b.y1 <= y0 - 10;
    orden.forEach(({ i }, rango) => {
      const f = finales[i];
      if (!f.s.nombre) { svg = svg.replace(`__ETQ${i}__`, ''); return; }
      const w = ancho(f.s.nombre), arriba = rango === 0 && finales.length > 1;
      const cands = [];
      for (const j of arriba ? [30, 26, 34, 22, 18] : [34, 30, 26, 22, 18, 14]) {
        const q = f.pts[j];
        const sobre = [q[0] - 24, q[1] - 24, true], bajo = [q[0] - 20, q[1] + 56, true], der = [q[0] + 26, q[1] + 56, false];
        cands.push(...(arriba ? [sobre, bajo, der] : [bajo, sobre, der]));
      }
      let elegido = cands.find(([x, y, fin]) => { const b = caja(x, y, fin, w); return dentro(b) && !choca(b); });
      if (!elegido) { const q = f.pts[arriba ? 30 : 34]; elegido = arriba ? [q[0] - 24, q[1] - 24, true] : [q[0] - 20, Math.min(q[1] + 56, y0 - 16), true]; }
      const [x, y, fin] = elegido;
      obst.push(caja(x, y, fin, w));
      svg = svg.replace(`__ETQ${i}__`, `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${fin ? 'end' : 'start'}" font-size="46" fill="${f.c}" font-weight="600">${escapar(f.s.nombre)}</text>`);
    });
    if (l.banda && finales.length >= 2) {
      const ys = finales.map(f => f.p[1]).sort((a, b) => a - b);
      svg += `<g${ctx.P(l.banda_paso ?? 0)}><rect x="${bandaX}" y="${bandaY(ys[0]) - 36}" width="300" height="72" rx="8" fill="#b8f5b0"/><text x="${bandaX + 150}" y="${bandaY(ys[0]) + 14}" text-anchor="middle" font-size="42" fill="#1f8a14" font-weight="700">${escapar(l.banda)}</text></g>`;
    }
    if (l.eje_x) svg += `<text x="${x1 + 60}" y="${y0 + 64}" text-anchor="end" font-size="46" fill="#444">${escapar(l.eje_x)}</text>`;
    if (l.eje_y) svg += `<text x="${x0 + 26}" y="${y1 + 12}" font-size="46" fill="#444">${escapar(l.eje_y)}</text>`;
  }
  const arriba = (l.titulo ? `<div style="font-size:72px;font-weight:700;letter-spacing:-.02em;line-height:1.05">${marcar(l.titulo)}</div>` : '') +
    (l.subtitulo ? `<div style="font-size:46px;color:var(--gris);margin-top:8px">${marcar(l.subtitulo)}</div>` : '');
  // emoji de 140 px: sin cifra, de y−170 a y−30; con cifra (línea base en y−30, ~56 px de alto) sube a y−240 → y−100
  const emojis = (ctx.extraSobreBarras || []).map(e => `<div${ctx.P(e.k)} style="position:absolute;left:${e.x}px;top:${e.y - (e.v ? 240 : 170)}px;transform:translateX(-50%)">${ctx.emoji(e.e, 140)}</div>`).join('');
  ctx.extraSobreBarras = null;
  return `<div class="pila grafica">${arriba ? `<div${ctx.P(0)} style="margin-bottom:30px">${arriba}</div>` : ''}
    <div${ctx.P(0)} style="position:relative;width:${W}px;height:${H + 60}px"><svg viewBox="0 0 ${W} ${H + 60}" width="${W}" height="${H + 60}" overflow="visible">${svg}</svg>${emojis}</div>
    ${texto(ctx, l.texto, 'medio mt-m', l.texto_paso ?? 0)}${nota(ctx, l.nota, l.nota_paso ?? 1, 'mt-s')}${fuente(ctx, l.fuente, pasoDe(l, 'fuente_paso', 0))}</div>`;
}

// LÍNEA DE TIEMPO — marcas sobre una línea, tramos de color y llaves con nota manuscrita.
// Marcas muy juntas («Semana 1» en 0 y «Semana 2» en 0.125) se enciman: la etiqueta que choca con la de la marca
// anterior en su renglón baja a un segundo renglón, con una guía punteada corta hasta su marca. Las etiquetas de
// tramo que se cruzan suben ~70 px. No se sube nada arriba de la línea: ahí van las llaves.
const anchoTexto = (t, px) => [...String(t || '')].length * px * 0.55;
export function filasEtiquetas(xs, textos, px, sep = 24) {
  const fin = [-Infinity, -Infinity];   // borde derecho ocupado en cada renglón
  return xs.map((x, i) => {
    const w = anchoTexto(textos[i], px), a = x - w / 2, b = x + w / 2;
    const fila = a >= fin[0] + sep ? 0 : a >= fin[1] + sep ? 1 : 0;
    fin[fila] = Math.max(fin[fila], b);
    return fila;
  });
}
export function lineaTiempo(l, ctx) {
  const marcas = l.marcas || [];
  // En 9:16 el ancho es el mismo (900 útiles) pero sobra alto: letra y alturas ×1.35 para que no quede una franja chica
  const f = ctx.vertical ? 1.35 : 1;
  const W = ctx.vertical ? 900 : 1720, y = Math.round(330 * f), m0 = 90, m1 = W - 90;
  const xs = marcas.map((m, i) => m.pos != null ? m0 + m.pos * (m1 - m0) : m0 + (i / Math.max(1, marcas.length - 1)) * (m1 - m0));
  const tM = Math.round(56 * f);
  const filaAbajo = filasEtiquetas(xs, marcas.map(m => m.texto), tM);
  const tamTramo = ctx.vertical ? 72 : 84;
  const tramos = (l.tramos || []).map(t => {
    const a = xs[t.desde] ?? 0, b = t.hasta === 'fin' ? W : xs[t.hasta] ?? W;
    return { t, a, b, mid: (a + b) / 2 };
  });
  const filaTramo = filasEtiquetas(tramos.map(q => q.mid), tramos.map(q => q.t.etiqueta || ''), tamTramo);
  let svg = `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#9a9a9a" stroke-width="4"/>`;
  tramos.forEach(({ t, a, b, mid }, i) => {
    const c = HEX[t.tono] || HEX.v;
    const k = t.paso ?? i + 1;
    const lab = escapar(t.etiqueta || ''), sube = filaTramo[i] * 70;
    svg += `<g${ctx.P(k)}><line x1="${a}" y1="${y}" x2="${b}" y2="${y}" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
      ${lab ? `<path d="M${a + 10} ${y - 44 * f} C${a + 10} ${y - 78 * f}, ${mid - 24} ${y - 56 * f}, ${mid} ${y - 96 * f} C${mid + 24} ${y - 56 * f}, ${b - 10} ${y - 78 * f}, ${b - 10} ${y - 44 * f}" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" data-trazo pathLength="1"/>
      <text x="${mid}" y="${y - 122 * f - sube}" text-anchor="middle" class="t-mano" font-size="${tamTramo}" fill="${c}" font-family="Caveat" font-weight="600">${lab}</text>` : ''}</g>`;
  });
  marcas.forEach((m, i) => {
    const c = HEX[m.tono] || '#9a9a9a', x = xs[i], k = m.paso ?? 0;
    const col = m.tono ? c : '#8a8a8a', yT = y + 100 * f + filaAbajo[i] * 64 * f, yA = y - 56 * f;
    const guia = filaAbajo[i] ? `<line x1="${x}" y1="${y + 40 * f}" x2="${x}" y2="${yT - 50 * f}" stroke="${col}" stroke-width="3" stroke-dasharray="4 7" stroke-linecap="round"/>` : '';
    svg += `<g${ctx.P(k)}><line x1="${x}" y1="${y - 30 * f}" x2="${x}" y2="${y + 30 * f}" stroke="${col}" stroke-width="6" stroke-linecap="round"/>
      ${guia}<text x="${x}" y="${yT}" text-anchor="middle" font-size="${tM}" font-weight="${m.tono ? 700 : 500}" fill="${col}">${escapar(m.texto || '')}</text>
      ${m.arriba ? `<text x="${x}" y="${yA}" text-anchor="middle" font-size="${Math.round(50 * f)}" font-weight="700" fill="${col}">${escapar(m.arriba)}</text>` : ''}</g>`;
  });
  const alto = Math.round(460 * f) + (filaAbajo.some(Boolean) ? Math.round(64 * f) : 0);
  return `<div class="pila grafica">${texto(ctx, l.texto, 'medio', pasoDe(l, 'texto_paso', 0), ' style="margin-bottom:10px"')}
    <div${ctx.P(0)}><svg viewBox="0 0 ${W} ${alto}" width="${W}" height="${alto}" overflow="visible">${svg}</svg></div>
    ${nota(ctx, l.nota, l.nota_paso ?? (l.tramos || []).length + 1, 'mt-s')}</div>`;
}

// MEDIDOR — barra verde→rojo con pin: qué tan difícil es algo.
export function medidor(l, ctx) {
  const v = Math.max(0, Math.min(100, Number.isFinite(Number(l.valor)) ? Number(l.valor) : 85));
  const tono = l.tono || (v < 35 ? '#1fbf2d' : v < 65 ? '#f2a400' : '#e0182a');
  return `<div class="pila"><div class="medidor"${ctx.P(0)}${ctx.A('medidor')}><div style="position:absolute;left:${v}%;top:0">${PIN(tono)}</div></div>
    ${texto(ctx, l.texto, (l.tam_texto || 'medio') + ' mt-e', pasoDe(l, 'texto_paso', 0))}${nota(ctx, l.nota, pasoDe(l, 'nota_paso', pasoDe(l, 'texto_paso', 0) + 1), 'mt-s')}</div>`;
}

// OPCIONES — pastillas (Fácil / Medio / Difícil) y un cursor que elige una.
export function opciones(l, ctx) {
  const items = l.items || [];   // obligatorio (contrato.mjs): sin contenido de demo que se cuele en un deck real
  const el = l.elegida ?? items.length - 1;
  ctx.clic = { a: 'op' + el, p: pasoDe(l, 'clic_paso', 0), tipo: l.cursor || 'flecha' };
  // en 9:16 las pastillas crecen ×1.45: a su tamaño de 16:9 quedaban en una franja chica del alto
  return `<div class="pila gap-m"${ctx.P(0)}${ctx.vertical ? ' style="zoom:1.45"' : ''}>${items.map((it, i) => `<div class="opcion ${['v', 'n', 'r'].includes(it.tono) ? it.tono : 'v'} ${i === el ? '' : 'apagada'}"${ctx.A('op' + i)}><span>${marcar(it.texto)}</span></div>`).join('')}
    </div>${texto(ctx, l.texto, 'medio mt-l', pasoDe(l, 'texto_paso', 0))}`;
}

// REJILLA — cantidad hecha visible: 500 cajas, 99 puntos verdes y 1 rojo, una multitud y «tú».
export function rejilla(l, ctx) {
  const total = Math.min(l.total || 100, 1200);
  const aspecto = l.aspecto || 1.55;
  const cols = l.columnas || Math.max(1, Math.round(Math.sqrt(total * aspecto)));
  const rows = Math.ceil(total / cols);
  // con anotación a la derecha la rejilla deja sitio para el gancho de la flecha y la nota
  const areaW = l.ancho || (ctx.vertical ? 880 : l.anotacion ? 1250 : 1450), areaH = l.alto || (ctx.vertical ? 1100 : 720);
  const c = Math.floor(Math.min(areaW / cols, areaH / rows) * 0.86);
  const g = Math.max(3, Math.floor(c * 0.16));
  const dest = new Set(l.destacar || []);
  // `destacado_paso` > 0: el color de las destacadas aparece DESPUÉS, sobre la rejilla ya vista [43:15]
  const kDest = l.etiqueta_destacado ? 0 : pasoDe(l, 'destacado_paso', 0);
  const celdas = [];
  const unico = l.emoji && !l.punto ? ctx.emoji(l.emoji, c) : '';
  const destE = l.emoji_destacado ? ctx.emoji(l.emoji_destacado, c) : '';
  for (let i = 0; i < total; i++) {
    const d = dest.has(i);
    const cls = l.apagar_resto && !d ? ' apagado' : '';
    const tp = x => (['v', 'r', 'g'].includes(x) ? x : null);
    const capa = h => `<div${ctx.P(kDest)} style="position:absolute;inset:0">${h}</div>`;
    if (l.punto && d && kDest) celdas.push(`<div class="punto ${tp(l.tono) || 'v'}" style="position:relative"${ctx.A('d' + i)}>${capa(`<div class="punto ${tp(l.tono_destacado) || 'r'}"></div>`)}</div>`);
    else if (l.punto) celdas.push(`<div class="punto ${d ? (tp(l.tono_destacado) || 'r') : (tp(l.tono) || 'v')}${cls}"${d ? ctx.A('d' + i) : ''}></div>`);
    else if (d && destE && kDest) celdas.push(`<div${ctx.A('d' + i)} style="position:relative;width:${c}px;height:${c}px">${unico}${capa(`<div style="background:#fff">${destE}</div>`)}</div>`);
    else celdas.push(`<div class="${cls.trim()}"${d ? ctx.A('d' + i) : ''} style="width:${c}px;height:${c}px">${d && destE ? destE : unico}</div>`);
  }
  const kAn = l.anotacion_paso ?? 1;
  if (l.anotacion) ctx.con({ de: 'rejilla', a: 'anot', estilo: 'fina', p: kAn });
  // «Tú» en la multitud [14:55, 15:05]: la etiqueta es un rótulo directo sobre la rejilla, SIN flecha (con 44 px de
  // margen la flecha medía ~30 px por construcción y se leía como garabato). `flecha_etiqueta: true` la dibuja con un
  // largo real (≥ 90 px).
  const conFlecha = l.etiqueta_destacado && dest.size && l.flecha_etiqueta === true;
  if (conFlecha) ctx.con({ de: 'etq', a: 'd' + [...dest][0], estilo: 'fina-abajo', p: l.destacado_paso ?? 0 });
  return `<div class="pila">${rotulo(ctx, l, ' style="margin-bottom:34px"')}
    ${l.etiqueta_destacado ? `<div class="pila"${ctx.P(l.destacado_paso ?? 0)}${ctx.A('etq')} style="margin-bottom:${conFlecha ? 110 : 20}px">${l.emoji_etiqueta ? ctx.emoji(l.emoji_etiqueta, 110) : ''}<div style="font-size:72px;font-weight:700">${marcar(l.etiqueta_destacado)}</div></div>` : ''}
    <div class="fila" style="align-items:center;gap:${l.anotacion ? 150 : 40}px"><div class="rejilla"${ctx.P(0)}${ctx.A('rejilla')} style="--cols:${cols};--c:${c}px;--g:${g}px">${celdas.join('')}</div>
    ${l.anotacion ? `<div class="nota"${ctx.P(kAn)}${ctx.A('anot')} style="--tn:66px;color:var(--tinta);margin-top:110px;white-space:nowrap">${marcar(l.anotacion)}</div>` : ''}</div>
    ${texto(ctx, l.texto, 'chico mt-m', l.texto_paso ?? 0)}</div>`;
}

// PRUEBA — capturas reales con sombra, círculo rojo y datos tachados [0:35, 15:45, 19:30].
// Tres variantes por captura:
//   { src }                         la captura real (con permiso), con `circulo` y `tachar`;
//   { post, fuente | ejemplo }      un post escrito: con `fuente` («real, con permiso») se pinta como post
//                                   y la fuente va abajo; con `ejemplo: true` es una MAQUETA: sin avatar,
//                                   usuario ni fecha, con sello «EJEMPLO», y sin círculo sobre dinero;
//   { hueco }                       tarjeta punteada vacía: captura por conseguir (el deck queda en borrador);
//   { hueco, plantilla: true }      marco trazado a mano: el lugar para la captura DEL ESPECTADOR («La tuya va aquí»).
// Nunca un testimonio inventado que parezca real (SKILL, regla 9).
export const DATO_DURO = /[$%€]|\d[\d,.]*\s*(k|mil|clientes?|ventas?|usd|mxn)\b/i;
function post(p, ejemplo) {
  const clave = p.clave && !(ejemplo && DATO_DURO.test(p.clave)) ? escapar(p.clave) : '';
  const parr = (p.texto || []).map(x => {
    let h = marcar(x);
    const claveM = unirGuiones(clave);   // marcar() ya unió los guiones del texto: la clave se busca igual
    if (clave) h = h.replace(claveM, `<span class="clave" data-circulo="caja">${claveM}</span>`);
    return `<p>${h}</p>`;
  }).join('');
  if (ejemplo) return `<div class="post ejemplo"><div class="sello-ejemplo"><div class="sello-tinta">Ejemplo</div></div>${parr}</div>`;
  return `<div class="post"><div class="cab"><div class="av"></div><div><b>${escapar(p.nombre || 'Nombre')}</b><span>${escapar(p.usuario || '')}${p.fecha ? ' • ' + escapar(p.fecha) : ''}</span></div><div style="margin-left:auto;color:#999;font-size:40px">···</div></div>${parr}</div>`;
}
// Marco trazado a mano (tinta negra, el grosor de la capa manuscrita) para una captura PLANTILLA: el lugar donde el
// espectador pone la suya. Un recuadro gris punteado no es tinta de pizarrón y se lee como «falta algo».
function marcoMano(w, h, semilla) {
  let s = semilla * 7919 + 13;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647 - 0.5) * 5;
  const R = 34, pts = [];
  const lado = (x0, y0, x1, y1) => { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 90)); for (let i = 0; i < n; i++) pts.push([x0 + (x1 - x0) * i / n + r(), y0 + (y1 - y0) * i / n + r()]); };
  lado(R, 4, w - R, 4); pts.push([w - 6, R * 0.35]); lado(w - 4, R, w - 4, h - R); pts.push([w - R * 0.35, h - 6]);
  lado(w - R, h - 4, R, h - 4); pts.push([6, h - R * 0.35]); lado(4, h - R, 4, R); pts.push([R * 0.35, 6]); pts.push([R + 26, 2]);
  const d = 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L');
  return `<svg class="marco-mano" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="var(--tinta)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
export function prueba(l, ctx) {
  const caps = l.capturas || [];
  const html = caps.map((c, i) => {
    const giro = caps.length > 1 ? `transform:rotate(${[-1.5, 1.2, -0.8][i % 3]}deg);z-index:${i + 1}` : '';
    const k = ctx.P(l.revelar === 'todo' ? 0 : i);
    // `plantilla: true`: el hueco es A PROPÓSITO (el espectador pone la suya): marco a mano y el deck puede ser final.
    // Sin plantilla es una captura por conseguir: recuadro punteado y QA deja el deck en borrador (CAPTURA_N).
    // ancla `cap<i>` (la captura) y, con `circulo`, `cap<i>-circulo` (la elipse): para las `anotaciones` [15:00, 28:35]
    const aCap = ctx.A('cap' + i);
    const aCirc = Array.isArray(c.circulo) ? `<span${ctx.A(`cap${i}-circulo`)} style="position:absolute;left:${c.circulo[0]}%;top:${c.circulo[1]}%;width:${c.circulo[2]}%;height:${c.circulo[3]}%;pointer-events:none"></span>` : '';
    if (c.hueco && c.plantilla === true) return `<div class="captura hueco-prueba plantilla"${k}${aCap} style="${giro}">${marcoMano(ctx.vertical ? 860 : 1000, ctx.vertical ? 620 : 440, ctx.uid * 3 + i + 1)}<span class="mano">${marcar(c.hueco)}</span></div>`;
    if (c.hueco) return `<div class="captura hueco-prueba"${k}${aCap} style="${giro}"><span class="mano">${marcar(c.hueco)}</span></div>`;
    let dentro;
    if (c.post) dentro = post(c.post, c.ejemplo === true);
    else {
      const extra = [
        c.circulo ? ` data-circulo-img="${c.circulo.join(',')}"` : '',
        c.tachar ? ` data-tachon-img="${escapar(JSON.stringify(c.tachar))}"` : '',
      ].join('');
      dentro = `<img src="${ctx.img(c.src)}" alt=""${extra} style="${Number.isFinite(c.alto) ? `max-height:${c.alto}px` : ''}">`;
    }
    const fuente = c.post && c.ejemplo !== true && typeof c.fuente === 'string' && c.fuente.trim() ? `<div class="fuente">${escapar(c.fuente)}</div>` : '';
    return `<div class="captura"${k}${aCap} style="${giro}">${dentro}${aCirc}${fuente}</div>`;
  }).join('');
  return `<div class="pila">${rotulo(ctx, l, ' style="margin-bottom:40px"')}<div class="pruebas">${html}</div>
    ${texto(ctx, l.texto, 'chico mt-l', l.texto_paso ?? Math.max(0, caps.length - 1))}</div>`;
}

// CHAT — burbujas estilo mensaje: tú en azul a la derecha, los demás en gris medio a la izquierda.
// Mensaje: { de, texto, hora?, avatar? }.
// Avatar: silueta por omisión; `avatar_yo` / `avatar_otro` (o `avatar` por mensaje) con un emoji lo
// cambian (la IA como 🤖), y `false` lo quita.
export function chat(l, ctx) {
  const ms = l.mensajes || [];
  const avatar = (m, yo) => {
    const spec = m.avatar ?? (yo ? l.avatar_yo : l.avatar_otro);
    if (spec === false) return '';
    const cls = yo ? 'yo-av' : 'otro-av';
    return typeof spec === 'string' && spec ? `<div class="${cls} av-emo">${ctx.emoji(spec, ctx.vertical ? 70 : 92)}</div>` : `<div class="${cls}">${PERSONA}</div>`;
  };
  const html = ms.map((m, i) => {
    const yo = (m.de || 'yo') === 'yo';
    // [x] en minúsculas = lo que personalizas en el mensaje; los [MAYÚSCULAS] ya los marcó marcar()
    const cuerpo = marcar(m.texto).replace(/(?<!class="hueco">)\[([^\[\]<>]+)\]/g, '<span class="hueco">[$1]</span>');
    const av = avatar(m, yo), k = l.revelar === 'todo' ? 0 : i;
    // `hora`: el separador gris centrado de un chat real, en el mismo paso que su mensaje. Así el gancho se entiende
    // sin audio (11:40 pm … 9:05 am). Cada burbuja es un ancla m0…mN (sello_sobre: "m2", flechas).
    const hora = typeof m.hora === 'string' && m.hora.trim() ? `<div class="chat-hora"${ctx.P(k)}>${escapar(m.hora)}</div>` : '';
    return `${hora}<div class="msj ${yo ? 'yo' : 'otro'}"${ctx.P(k)}>${yo ? '' : av}<div class="burbuja"${ctx.A('m' + i)}>${cuerpo}</div>${yo ? av : ''}</div>`;
  }).join('');
  const tb = l.tam_texto && /px$/.test(l.tam_texto) ? ` style="--tb:${l.tam_texto}"` : '';
  return `<div class="pila">${rotulo(ctx, l, ' style="margin-bottom:40px"')}<div class="chat"${tb}>${html}</div></div>`;
}

// REPARTO — pastilla verde (audiencia · ingresos) que se parte en «su parte» y «tu parte».
export function reparto(l, ctx) {
  const t = l.total || {};
  const datos = (t.datos || []).map(d => `<div class="dato"><b>${escapar(d.valor)}</b><span>${escapar(d.etiqueta || '')}</span></div>`).join('');
  const partes = l.partes || [];
  partes.forEach((_, i) => ctx.con({ de: 'total', a: 'parte' + i, estilo: 'linea', p: 1 }));
  const sepR = l.separacion || (ctx.vertical ? 40 : 180);
  const ps = partes.map((p, i) => `<div class="pila"${ctx.P(1)}><div class="pastilla chica ${p.tono === 'verde' || p.tono === 'v' ? '' : 'gris'}"${ctx.A('parte' + i)}><div class="dato"><span>${escapar(p.etiqueta || '')}</span><b>${escapar(p.valor || '')}</b></div></div>
    ${p.pct ? `<div class="pct" style="color:${p.tono === 'verde' || p.tono === 'v' ? 'var(--verde)' : '#b5b5b5'}">${escapar(p.pct)}</div>` : ''}</div>`).join('');
  return `<div class="pila">${texto(ctx, l.titulo, 'medio', 0, ' style="margin-bottom:40px;font-weight:600"')}
    <div class="pastilla"${ctx.P(0)}${ctx.A('total')}><div class="avatar">${PERSONA}</div>${datos}</div>
    ${partes.length ? `<div class="fila" style="gap:${sepR}px;margin-top:130px;align-items:flex-start">${ps}</div>` : ''}</div>`;
}

// CALENDARIO — días en tarjetas con fases de color (el plan de N días).
// La barra lleva el degradado saturado de la fase; las CELDAS no: la fase activa va en pastel con borde de su color
// y número casi negro, y las demás fases en un tinte plano casi blanco con el texto gris [ref_1760, 29:25].
const BARRA = { amarillo: ['#ffd21f', '#f2b705'], azul: ['#5ec8ff', '#1e9be6'], verde: ['#6bf06b', '#1fc31f'], rojo: ['#ff6b6b', '#e0182a'] };
// degradado de la celda activa: más saturado arriba a la izquierda, casi blanco abajo a la derecha (160°)
const CELDA = {
  amarillo: { act: ['#ffe07a', '#fff6d6'], borde: '#f2b705', apag: '#f6f3e4', bApag: '#e9e3c6' },
  azul: { act: ['#8ad9f8', '#d6effd'], borde: '#3fb4f0', apag: '#eef7fd', bApag: '#d6eaf7' },
  verde: { act: ['#9ff09a', '#e2fbde'], borde: '#3fd23f', apag: '#e3fbe0', bApag: '#c9efc4' },
  rojo: { act: ['#ffb0b0', '#ffe6e6'], borde: '#e0182a', apag: '#fdeeee', bApag: '#f4d2d2' },
};
// letra de la pastilla del rango: el tono OSCURO de la fase (≥ 3:1 sobre la pastilla blanca al 55% encima de la barra)
const TINTA_FASE = { amarillo: '#b05c00', azul: '#0f5fa8', verde: '#137a13', rojo: '#a3101f' };
export function calendario(l, ctx) {
  // las `anotaciones` con `dia` son del calendario; las que llevan `a` (ancla) son las comunes (construir.mjs)
  l = { ...l, anotaciones: (l.anotaciones || []).filter(a => a && typeof a === 'object' && a.dia != null) };
  const fases = l.fases || [];
  const iAct = l.fase_activa ? l.fase_activa - 1 : -1;          // se cuenta desde 1, igual que «activo» y «dia»
  const activa = iAct >= 0 ? fases[iAct] || null : null;
  const pedido = (activa && activa.color) || l.color;
  const clave = BARRA[pedido] ? pedido : 'amarillo';
  const barra = BARRA[clave];
  const dias = l.dias || Array.from({ length: l.n || 14 }, (_, i) => ({ titulo: `DÍA ${i + 1}` }));
  // Con más de 20 días (4-6 semanas) van de 7 en 7; la fila se achica para que todo quepa en el alto útil
  const cols = l.columnas || (dias.length > 20 ? 7 : 5);
  const filas = Math.ceil(dias.length / cols);
  // Calendario GRANDE [ref_1760]: 16:9, sin notas al margen y ≤ 15 días (3 filas de 5). La tarjeta usa casi todo el alto
  // (1004 de 1080), mide ~1250 de ancho, la barra ~170 y las celdas son CUADRADAS (~234) con ~6-10 px de separación.
  // Con los márgenes normales (alto útil 880) no cabían celdas cuadradas: aquí el alto útil es H − 80 (base.css).
  const grande = !ctx.vertical && ctx.F.W > ctx.F.H && !(l.anotaciones || []).length && dias.length <= 15 && cols === 5;
  const gapDia = grande ? 10 : 20;
  const altoUtil = grande ? ctx.F.H - 80 : ctx.F.H - 2 * ctx.F.mv, barraH = grande ? 160 : 114, pad = grande ? 66 : 70;
  const anchoGrande = 1250, celdaG = (anchoGrande - 68 - gapDia * (cols - 1)) / cols;
  const altoDia = grande ? Math.floor(Math.min(celdaG, (altoUtil - barraH - pad - gapDia * (filas - 1)) / filas))
    : Math.floor(Math.min(196, (altoUtil - barraH - pad - 20 * (filas - 1)) / filas));
  const compacto = altoDia < 110;
  const faseDe = d => fases.findIndex(f => d + 1 >= f.desde && d + 1 <= f.hasta);
  // El sub del día se lee (32 px), pero en un calendario angosto baja hasta 28 para que «Prueba social» quepa en su
  // celda en un renglón (2 palabras de hasta 14 letras no se parten)
  const anchoCal = (l.anotaciones || []).length && !ctx.vertical ? 1080 : ctx.vertical ? 920 : grande ? anchoGrande : 1400;
  const celdaW = (anchoCal - 72 - (cols - 1) * gapDia) / cols;
  const largoSub = Math.max(0, ...dias.map(d => { const t = String(d.sub || '').trim(), ps = t.split(/\s+/); return ps.length <= 2 ? t.length : Math.max(...ps.map(w => w.length)); }));
  const tamSub = largoSub ? Math.max(28, Math.min(32, Math.floor((celdaW - 8) / (0.5 * largoSub)))) : 32;
  // Sin fase activa los días van en gris neutro (la lámina que presenta el plan, 28:45).
  const html = dias.map((d, i) => {
    const f = faseDe(i), c = f >= 0 ? CELDA[fases[f].color] || CELDA.amarillo : null;
    const encendida = activa ? f === iAct : false;
    const st = !activa || !c ? ''
      : encendida ? `background:linear-gradient(160deg,${c.act[0]},${c.act[1]});border:3px solid ${c.borde};color:#13243a`
        : `background:${c.apag};border:2px solid ${c.bApag};color:#c4c4c4`;
    const apagada = activa && !encendida ? ` apagado${c ? ' tinte' : ''}` : '';
    // «10 / mensajes»: un subtítulo de 2 palabras cortas no se parte
    const sd = String(d.sub || '').trim(), corto = sd.split(/\s+/).length <= 2 && sd.length <= 14 ? ' class="corta"' : '';
    return `<div class="dia${apagada}" style="width:calc((100% - ${(cols - 1) * gapDia}px)/${cols});${st}"${ctx.A('dia' + i)}><small>${escapar(d.titulo || l.palabra_dia || 'DÍA')}</small><b>${escapar(String(d.numero ?? i + 1))}</b>${d.sub ? `<span${corto}>${escapar(d.sub)}</span>` : ''}</div>`;
  }).join('');
  (l.anotaciones || []).forEach((a, i) => ctx.con({ de: 'an' + i, a: 'dia' + (a.dia - 1), estilo: 'curva-roja', p: a.paso ?? 1 }));
  // `arriba`: px (número) o un porcentaje del alto («40%»); `tam` en px (52-58 en m_1740, 56 por omisión)
  const arriba = a => (typeof a.arriba === 'string' && /^\d{1,3}(\.\d+)?%$/.test(a.arriba) ? a.arriba : `${Number.isFinite(Number(a.arriba)) ? Number(a.arriba) : 300}px`);
  const anot = (l.anotaciones || []).map((a, i) => `<div class="nota"${ctx.P(a.paso ?? 1)}${ctx.A('an' + i)} style="position:absolute;${a.lado === 'derecha' ? 'right:40px' : 'left:40px'};top:${arriba(a)};--tn:${a.tam || '56px'};color:var(--tinta);max-width:340px">${marcar(a.texto)}</div>`).join('');
  const sub = activa && activa.sub ? `<em class="sub">${escapar(activa.sub)}</em>` : '';
  // con notas al margen el calendario se angosta para que la nota quede FUERA, como en m_1740
  const angosto = (l.anotaciones || []).length && !ctx.vertical;
  // Una fase de un solo día dice «DÍA 10», no «DÍAS 10-10»
  const pastilla = !activa ? (l.rango || `DÍAS 1-${dias.length}`)
    : activa.desde === activa.hasta ? `${l.palabra_dia || 'DÍA'} ${activa.desde}` : `${l.palabra_dia ? l.palabra_dia + 'S' : 'DÍAS'} ${activa.desde}-${activa.hasta}`;
  // el nombre de la fase va a ~60 px [ref_1760]; en un calendario angosto un título largo baja para no partirse
  const nombre = activa ? activa.nombre : (l.titulo || 'Calendario');
  const libre = anchoCal - 80 - (String(pastilla).length * 40 * 0.66 + 60) - (sub ? String(activa.sub).length * 42 * 0.52 + 80 : 0);
  const tamBarra = Math.max(44, Math.min(grande ? 64 : 60, Math.floor(libre / (0.6 * Math.max(1, String(nombre).length)))));
  const estilo = `--alto-dia:${altoDia}px;--t-sub-dia:${tamSub}px;--t-barra:${tamBarra}px;--c-fase:${TINTA_FASE[clave]}${angosto ? ';width:1080px' : ''}`
    + (grande ? `;--ancho-cal:${anchoGrande}px;--barra-h:${barraH}px` : '');
  return `<div class="calendario${compacto ? ' compacto' : ''}${grande ? ' grande' : ''}"${ctx.P(0)} style="${estilo}"><div class="barra" style="background:linear-gradient(90deg,${barra[0]},${barra[1]})"><b>${escapar(nombre)}</b>${sub}<span>${escapar(pastilla)}</span></div>
    <div class="dias" style="display:flex;flex-wrap:wrap;justify-content:center;gap:${gapDia}px">${html}</div></div>${anot}`;
}

// CALIFICACIÓN — opciones calificadas con estrellas antes de la tabla-marcador [4:45, 4:50]: un 🤔 arriba y una
// tarjeta gris con una fila por opción (emoji, nombre y `max` estrellas pálidas). Paso 0: todas pálidas. Luego un
// paso por cada fila con `estrellas`: la mano enciende sus estrellas. Por omisión solo se ve encendida la fila
// activa y las anteriores vuelven a pálido, como en 4:50; `acumular: true` las deja encendidas.
export function calificacion(l, ctx) {
  const filas = l.filas || [];
  const max = l.max || 5;
  const tamS = ctx.vertical ? 58 : 64, gapS = 10;
  const calificadas = filas.map((f, i) => (Number.isInteger(f.estrellas) && f.estrellas > 0 ? i : -1)).filter(i => i >= 0);
  const pasoFila = new Map(calificadas.map((fi, j) => [fi, j + 1]));
  const ultimo = calificadas.length;
  const html = filas.map((f, i) => {
    const kf = pasoFila.get(i), n = Math.min(max, f.estrellas || 0);
    // la mano y (sin acumular) las estrellas encendidas se van al paso siguiente
    const hasta = kf && kf < ultimo ? ` data-hasta="${ctx.paso(kf)}"` : '';
    const llenas = kf ? `<div class="estrellas llenas"${ctx.P(kf)}${l.acumular ? '' : hasta}>${estrellas(n, max)}</div>` : '';
    const xs = (n - 1) * (tamS + gapS) + tamS / 2, ys = tamS * 0.62;   // punta del dedo sobre la última estrella encendida
    const mano = kf ? `<div class="cal-cursor"${ctx.P(kf)}${hasta} style="left:${Math.round(xs - 104 * 0.41)}px;top:${Math.round(ys - 119 * 0.03)}px">${CURSOR_MANO}</div>` : '';
    return `<div class="cal-fila">${f.emoji ? ctx.emoji(f.emoji, ctx.vertical ? 80 : 88) : ''}<span class="cal-texto">${marcar(f.texto || '')}</span>
      <div class="cal-estrellas"${ctx.A('e' + i)}><div class="estrellas">${estrellas(0, max)}</div>${llenas}${mano}</div></div>`;
  }).join('');
  return `<div class="pila">${l.emoji ? `<div${ctx.P(0)} style="margin-bottom:40px">${ctx.emoji(l.emoji, 'chico')}</div>` : ''}
    ${l.encabezado ? `<div class="encabezado"${ctx.P(0)}>${marcar(l.encabezado)}</div>` : ''}
    <div class="calificacion"${ctx.P(0)} style="--s-est:${tamS}px;--g-est:${gapS}px">${html}</div>
    ${nota(ctx, l.nota, pasoDe(l, 'nota_paso', ultimo + 1), 'mt-m')}</div>`;
}

// BOTÓN — un botón de interfaz y el cursor que lo aprieta («solo tienes que dar clic»).
export function boton(l, ctx) {
  ctx.clic = { a: 'boton', p: pasoDe(l, 'clic_paso', 0), tipo: l.cursor === 'flecha' ? 'flecha' : 'mano' };
  const kt = pasoDe(l, 'texto_paso', 0);
  // en 9:16 el botón crece ×1.6 (con su emoji) y la frase va grande: a 68 px quedaba chico en el alto de sobra
  return `<div class="pila"><div class="boton-ui"${ctx.P(0)}${ctx.A('boton')}${ctx.vertical ? ' style="zoom:1.6"' : ''}><span class="boton-txt">${escapar(l.boton || '')}</span>${l.emoji ? ctx.emoji(l.emoji, 68) : ''}</div>
    ${texto(ctx, l.texto, (l.tam_texto || (ctx.vertical ? 'grande' : 'medio')) + ' mt-l', kt)}${nota(ctx, l.nota, pasoDe(l, 'nota_paso', kt + 1), 'mt-s')}</div>`;
}

// CÍRCULOS — la audiencia: un anillo de personas y un círculo interior (quién sí / quién no).
// Las personas van en 1 o 2 anillos concéntricos dentro de la corona (r+60 … R−60), a intervalos iguales con un
// temblor chico (≤ 0.12 rad, y nunca tanto que se toquen): en la referencia se ven chicas, parejas y sin tocarse
// [hoja_05 10:45-10:50]. Cada par queda a ≥ 1.15 × el tamaño del emoji; si no caben, el emoji se achica (86 → 64) y,
// si ni así, se dibujan las que caben y se avisa. Semilla fija: el mismo dibujo en cada render.
export const SEPARACION_PERSONAS = 1.15;
export function repartirPersonas({ n = 12, R = 360, r = 130, tam = 86, tamMin = 64 } = {}) {
  let semilla = 7;
  const rnd = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const dIn = r + 60, dOut = R - 60;
  const anillos = t => (dOut - dIn >= SEPARACION_PERSONAS * t ? [dIn, dOut] : [(dIn + dOut) / 2]);
  const cap = (d, t) => Math.max(1, Math.floor((2 * Math.PI * d) / (1.25 * t)));
  let t = tam;
  const capTotal = x => anillos(x).reduce((a, d) => a + cap(d, x), 0);
  while (t > tamMin && capTotal(t) < n) t = Math.max(tamMin, t - 4);
  const total = capTotal(t), m = Math.min(n, total);
  // reparto proporcional a la capacidad de cada anillo (con un solo anillo si alcanza)
  const ds = m <= cap((dIn + dOut) / 2, t) ? [(dIn + dOut) / 2] : anillos(t);
  const caps = ds.map(d => cap(d, t)), sumCap = caps.reduce((a, b) => a + b, 0);
  let resto = m;
  const cuantos = caps.map((c, i) => { const q = i === caps.length - 1 ? resto : Math.min(c, Math.round((m * c) / sumCap)); resto -= q; return q; });
  const pos = [];
  ds.forEach((d, a) => {
    const k = cuantos[a]; if (!k) return;
    const paso = (2 * Math.PI) / k, necesita = 2 * Math.asin(Math.min(1, (SEPARACION_PERSONAS * t) / (2 * d)));
    const jit = Math.max(0, Math.min(0.12, (paso - necesita) / 2 - 0.01));
    const desfase = a % 2 ? paso / 2 : 0;
    for (let i = 0; i < k; i++) {
      const ang = -Math.PI / 2 + desfase + i * paso + (rnd() - 0.5) * 2 * jit;
      pos.push([R + Math.cos(ang) * d, R + Math.sin(ang) * d]);
    }
  });
  return { pos, tam: t, dibujadas: m, pedidas: n };
}
export function circulos(l, ctx) {
  const R = l.radio || 360, r = l.radio_interior || 130;
  const tonos = { r: ['#fde3e3', '#f19a9a'], v: ['#dcf9d6', '#8fe08a'], g: ['#f1f1f1', '#cfcfcf'], a: ['#dff0ff', '#8cc8f5'], n: ['#fff1d6', '#f5c56b'] };
  const ext = tonos[l.tono] || tonos.r, int = tonos[l.tono_interior] || tonos.v;
  const rep = repartirPersonas({ n: l.personas ?? 12, R, r });
  if (rep.dibujadas < rep.pedidas) ctx.avisos.push(`círculos: ${rep.pedidas} personas no caben sin encimarse en el anillo; se dibujan ${rep.dibujadas} (sube «radio» o baja «personas»)`);
  const pos = rep.pos;
  const gente = pos.map(([x, y]) => `<div style="position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%)">${ctx.emoji(l.emoji || '🧑‍💼', rep.tam)}</div>`).join('');
  const centro = l.centro ? `<div${ctx.P(l.centro_paso ?? 0)} style="position:absolute;left:${R}px;top:${R}px;transform:translate(-50%,-50%)">${ctx.emoji(l.centro, 140)}</div>` : '';
  const kt = pasoDe(l, 'texto_paso', 0);
  return `<div class="pila">${texto(ctx, l.texto, 'chico', kt, ' style="margin-bottom:40px"')}
    <div${ctx.P(0)} style="position:relative;width:${2 * R}px;height:${2 * R}px">
      <div style="position:absolute;inset:0;border-radius:50%;background:${ext[0]};border:5px solid ${ext[1]}"></div>
      <div${ctx.P(l.interior_paso ?? 0)} style="position:absolute;left:${R - r}px;top:${R - r}px;width:${2 * r}px;height:${2 * r}px;border-radius:50%;background:${int[0]};border:5px solid ${int[1]}"></div>
      ${gente}${centro}</div>${nota(ctx, l.nota, pasoDe(l, 'nota_paso', kt + 1), 'mt-m')}</div>`;
}

// STACK — lo que incluye la oferta [42:30-42:45]. En 16:9 va A SANGRE: el bento llena la lámina de borde a borde
// (18 px de margen), las casillas vacías se ven grises al cortar y cada pieza se llena en su paso como una TARJETA DE
// PRODUCTO a color con la letra blanca en mayúsculas (morado, marino, naranja, verde, azul, negro, por turno si la
// pieza no trae `color`). `doble` ocupa dos columnas, `alto: 2` dos filas y `sub` es un subrenglón («For 6 Months»).
// El `remate` (✅ Hecho contigo) es una lámina aparte en la referencia [42:50]: aquí entra en su paso sobre un
// lienzo limpio. `sangre: false` (y el 9:16) usa la pila de tarjetas grises con el remate debajo.
export const COLOR_PIEZA = ['morado', 'marino', 'naranja', 'verde', 'azul', 'negro'];
const TONO_PIEZA = { v: 'tono-bv', r: 'tono-br', n: 'tono-bn' };
// Emojis oscuros o grises que se funden con la pieza marino o negra (y los grises también con la verde y la azul): el
// 🎓 sobre marino da 16% del glifo visible y la 🕶️ sobre negro 8% (contraste-color.mjs). Sin `color` explícito, la pieza
// sigue la rotación y salta a la siguiente que sí contrasta; con `color`, se respeta y QA avisa.
const EMOJI_OSCURO = new Set(['🎓', '🕶', '🎩', '♟', '🖤', '⚫', '🐈‍⬛', '🦇', '🕷', '🎱']);
const EMOJI_GRIS = new Set(['👥', '👤', '⚙', '🔧', '🛠', '🔩', '⛓', '🗿', '🐺', '🦏']);
// `previo`: el color de la pieza anterior; al saltar no se repite (el 🎓 saltaba de marino a naranja junto a otra naranja)
export function colorPieza(emoji, i, previo = '') {
  const base = String(emoji || '').replace(/^(no|si):/, '').split('+')[0].replace(/\uFE0F/g, '');
  const evita = EMOJI_GRIS.has(base) ? ['marino', 'negro', 'verde', 'azul'] : EMOJI_OSCURO.has(base) ? ['marino', 'negro'] : [];
  for (let j = 0; j < COLOR_PIEZA.length; j++) { const c = COLOR_PIEZA[(i + j) % COLOR_PIEZA.length]; if (!evita.includes(c) && c !== previo) return c; }
  for (let j = 0; j < COLOR_PIEZA.length; j++) { const c = COLOR_PIEZA[(i + j) % COLOR_PIEZA.length]; if (!evita.includes(c)) return c; }
  return COLOR_PIEZA[i % COLOR_PIEZA.length];
}
export function stack(l, ctx) {
  const sangre = !ctx.vertical && ctx.F.W > ctx.F.H && l.sangre !== false;
  return sangre ? stackSangre(l, ctx) : stackPila(l, ctx);
}
// El ícono es el protagonista de la pieza [42:40: la imagen de «Dedicated Consultant» ocupa ~37-45% del alto]: ~40% del
// alto de la pieza y ≤ 45% de su ancho (tope 220). Siempre deja lugar al rótulo de dos renglones (2 × 57), al `sub`
// (58) y a 24 px de aire bajo el padding. Con el tope viejo de 120 px medía ~19% y se perdía contra el color.
export function tamEmojiPieza(alto, ancho, conSub = false) {
  const cabe = alto - 48 - 2 * 57 - (conSub ? 58 : 0) - 18 - 24;
  return Math.max(72, Math.min(Math.round(alto * 0.40), Math.round(ancho * 0.45), 220, cabe));
}
function stackSangre(l, ctx) {
  const items = l.items || [];
  const cols = l.columnas || (items.length >= 7 ? 4 : 3);
  const celdas = items.reduce((s, it) => s + (it.doble ? 2 : 1) * (it.alto === 2 ? 2 : 1), 0);
  const filas = Math.max(1, Math.ceil(celdas / cols));
  const altoFila = Math.floor((ctx.F.H - 36 - (filas - 1) * 16) / filas);
  const anchoCol = Math.floor((ctx.F.W - 36 - (cols - 1) * 16) / cols);
  const usados = [];
  const piezas = items.map((it, i) => {
    const tamE = tamEmojiPieza(altoFila * (it.alto === 2 ? 2 : 1), anchoCol * (it.doble ? 2 : 1), Boolean(it.sub));
    const color = COLOR_PIEZA.includes(it.color) ? it.color : !it.color && TONO_PIEZA[it.tono] ? '' : colorPieza(it.emoji, i, usados[i - 1]);
    usados.push(color);
    const clase = color ? `c-${color}` : TONO_PIEZA[it.tono];
    const span = [it.doble ? 'grid-column:span 2' : '', it.alto === 2 ? 'grid-row:span 2' : ''].filter(Boolean).join(';');
    const vis = it.imagen ? `<img src="${ctx.img(it.imagen)}" style="height:${tamE}px;width:auto" alt="">` : it.emoji ? ctx.emoji(it.emoji, tamE) : '';
    return `<div class="bento"${span ? ` style="${span}"` : ''}${ctx.A('s' + i)}><div class="bento-lleno ${clase}"${ctx.P(i + 1)}>${vis}${it.texto ? `<span class="b-texto">${marcar(it.texto)}</span>` : ''}${it.sub ? `<span class="b-sub">${marcar(it.sub)}</span>` : ''}</div></div>`;
  }).join('');
  const kRem = pasoDe(l, 'remate_paso', items.length + 1);
  const kNota = pasoDe(l, 'nota_paso', kRem + (l.remate || l.total ? 1 : 0));
  const cierre = l.remate || l.total || l.nota ? `<div class="stack-remate"${ctx.P(Math.min(kRem, kNota))}>
    ${l.remate ? `<div class="t grande"${ctx.P(kRem)}>${ctx.em.html('✅', '1.1em', 'en-linea')}${marcar(l.remate)}</div>` : ''}
    ${l.total ? `<div class="etiqueta-chica"${ctx.P(kRem)} style="margin-top:24px">${marcar(l.total)}</div>` : ''}
    ${nota(ctx, l.nota, kNota, 'mt-m')}</div>` : '';
  // El cierre tapa las piezas: el paso anterior (el stack lleno) es un cuadro CLAVE para la hoja, el PDF y --finales
  const clave = cierre ? ` data-clave-paso="${Math.min(kRem, kNota) - 1}"` : '';
  return `<div class="stack sangre"${ctx.P(0)}${clave} style="--cols:${cols};--alto-fila:${altoFila}px">${piezas}</div>${cierre}`;
}
function stackPila(l, ctx) {
  const items = l.items || [];
  const cols = l.columnas || (ctx.vertical ? 2 : 3);
  const cw = Math.min(480, Math.floor((ctx.util - (cols - 1) * 28) / Math.max(1, cols)));
  const piezas = items.map((it, i) => {
    const vis = it.imagen ? `<img src="${ctx.img(it.imagen)}" style="height:${ctx.vertical ? 80 : 96}px;width:auto" alt="">` : it.emoji ? ctx.emoji(it.emoji, ctx.vertical ? 84 : 96) : '';
    return `<div class="bento"${it.doble ? ' style="grid-column:span 2"' : ''}${ctx.A('s' + i)}><div class="bento-lleno ${TONO_PIEZA[it.tono] || ''}"${ctx.P(i + 1)}>${vis}${it.texto ? `<span class="b-texto">${marcar(it.texto)}</span>` : ''}</div></div>`;
  }).join('');
  const kRem = pasoDe(l, 'remate_paso', items.length + 1);
  return `<div class="pila">${l.encabezado ? `<div class="encabezado"${ctx.P(0)}>${marcar(l.encabezado)}</div>` : ''}
    <div class="stack"${ctx.P(0)} style="--cols:${cols};--cw:${cw}px">${piezas}</div>
    ${l.remate ? `<div class="t chico mt-m"${ctx.P(kRem)}>${ctx.em.html('✅', '1.1em', 'en-linea')}${marcar(l.remate)}</div>` : ''}
    ${l.total ? `<div class="etiqueta-chica"${ctx.P(kRem)} style="margin-top:18px">${marcar(l.total)}</div>` : ''}
    ${nota(ctx, l.nota, pasoDe(l, 'nota_paso', kRem + (l.remate || l.total ? 1 : 0)), 'mt-s')}</div>`;
}
