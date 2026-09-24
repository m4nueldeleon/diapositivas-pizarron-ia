// layouts-datos.mjs — tabla a mano, gráficas, línea de tiempo, medidor, opciones, rejilla, prueba, chat,
// reparto, calendario, botón y círculos.
import { marcar, escapar, texto, nota, PERSONA, PIN } from './comun.mjs';

const COLOR = { v: 'var(--verde)', r: 'var(--rojo)', n: 'var(--naranja)', g: 'var(--gris)', a: 'var(--azul)', k: 'var(--tinta)' };
const HEX = { v: '#22a812', r: '#c8101e', n: '#d0661a', g: '#9a9a9a', a: '#3ea6f2', k: '#111111' };
const celda = c => (typeof c === 'string' || typeof c === 'number' ? { texto: String(c) } : (c || {}));

// TABLA — la «tabla-marcador» escrita a mano que se llena columna por columna.
export function tabla(l, ctx) {
  const cols = l.columnas || [];            // encabezados de las columnas de datos
  const filas = l.filas || [];
  const vacias = l.vacias ?? 0;
  const modo = l.revelar || 'columnas';     // columnas | celdas | filas | todo
  const nCols = cols.length + vacias;
  const W = ctx.vertical ? 1000 : 1840, H = ctx.vertical ? 1500 : 1010;
  const wEt = Math.round(W * (l.ancho_etiqueta || (ctx.vertical ? 0.24 : 0.155)));
  const wC = Math.round((W - wEt) / nCols);
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
  const cab = `<tr style="height:${hF}px"><th class="esq" style="width:${wEt}px">${marcar(l.esquina ?? '')}</th>${
    cols.map((c, i) => `<th style="width:${wC}px"><span${ctx.P(pasoCab[i])}>${marcar(c)}</span></th>`).join('')}${
    Array.from({ length: vacias }, () => `<th style="width:${wC}px"></th>`).join('')}</tr>`;
  const cuerpo = filas.map((f, fi) => `<tr style="height:${hF}px"><td class="fila-et">${marcar(f.etiqueta || '')}</td>${
    cols.map((_, ci) => {
      const c = celda((f.celdas || [])[ci]);
      const col = COLOR[c.tono] || 'var(--tinta)';
      return `<td style="color:${col}"><span${ctx.P(pasoCel[fi][ci])}${c.circulo ? ' data-circulo' : ''}>${marcar(c.texto || '')}</span></td>`;
    }).join('')}${Array.from({ length: vacias }, () => '<td></td>').join('')}</tr>`).join('');
  return `<table class="tabla"${ctx.P(0)} style="width:${W}px">${cab}${cuerpo}</table>`;
}

// Utilidades de SVG para las gráficas
const path = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
const formas = {
  recta: x => x, exponencial: x => Math.pow(x, 2.3), curva: x => Math.sqrt(x), plana: x => 0.12 + x * 0.1,
  s: x => 1 / (1 + Math.exp(-10 * (x - 0.5))), baja: x => 1 - Math.pow(x, 0.7),
};

// GRÁFICA — líneas (tiempo contra dinero, escala contra costo), barras o crecimiento.
export function grafica(l, ctx) {
  const tipo = l.grafica || 'lineas';   // lineas | barras | crecimiento
  const W = 1500, H = 660, x0 = 80, y0 = H - 60, x1 = W - 330, y1 = 50;
  let svg = '';
  if (tipo === 'barras') {
    const bs = l.barras || [];
    const val = b => Math.max(0, Number(b.valor) || 0);
    const max = Math.max(1, ...bs.map(val));
    const nb = Math.max(1, bs.length), gap = nb > 1 ? Math.max(40, Math.min(230, (W - 200) * 0.35 / (nb - 1))) : 0;
    const bw = Math.min(250, (W - 200 - gap * (nb - 1)) / nb);
    const inicio = (W - (bs.length * bw + (bs.length - 1) * gap)) / 2;
    svg += `<line x1="40" y1="${y0}" x2="${W - 40}" y2="${y0}" stroke="#bdbdbd" stroke-width="3"/>`;
    bs.forEach((b, i) => {
      const h = Math.max(20, (val(b) / max) * (y0 - 80));
      const x = inicio + i * (bw + gap), c = HEX[b.tono] || HEX[i === bs.length - 1 ? 'v' : 'a'];
      const k = l.revelar === 'barras' ? i : 0;
      const gid = `gb-${ctx.uid}-${i}`;
      svg += `<g${ctx.P(k)}><defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".85"/><stop offset="1" stop-color="${c}"/></linearGradient></defs>
        <rect x="${x}" y="${y0 - h}" width="${bw}" height="${h}" rx="6" fill="url(#${gid})"/>
        <text x="${x + bw / 2}" y="${y0 + 66}" text-anchor="middle" font-size="50" font-weight="500" fill="#222">${escapar(b.etiqueta || '')}</text>
        ${b.valor_texto ? `<text x="${x + bw / 2}" y="${y0 - h - 30}" text-anchor="middle" font-size="56" font-weight="800" fill="${c}">${escapar(b.valor_texto)}</text>` : ''}</g>`;
      if (b.emoji) ctx.extraSobreBarras = (ctx.extraSobreBarras || []).concat({ i, x: x + bw / 2, y: y0 - h, e: b.emoji, k });
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
        <path d="M${pts[40][0] - 28} ${pts[40][1] + 6} L${pts[40][0]} ${pts[40][1]} L${pts[40][0] - 10} ${pts[40][1] + 28}" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        ${s.puntos ? pts.filter((_, j) => j % 8 === 4).map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="10" fill="${c}"/>`).join('') : ''}
        __ETQ${i}__</g>`;
    });
    // Etiquetas de serie: la de arriba a la izquierda de su línea, la de abajo a la derecha (no chocan)
    const orden = finales.map((f, i) => ({ i, y: f.p[1] })).sort((a, b) => a.y - b.y);
    finales.forEach((f, i) => {
      const s = f.s; let etq = '';
      if (s.nombre) {
        const pts = f.pts, arriba = orden[0].i === i && finales.length > 1;
        const q = pts[arriba ? 30 : 34];
        etq = `<text x="${q[0] + (arriba ? -24 : 26)}" y="${q[1] + (arriba ? -24 : 40)}" text-anchor="${arriba ? 'end' : 'start'}" font-size="46" fill="${f.c}" font-weight="600">${escapar(s.nombre)}</text>`;
      }
      svg = svg.replace(`__ETQ${i}__`, etq);
    });
    if (l.banda && finales.length >= 2) {
      const ys = finales.map(f => f.p[1]).sort((a, b) => a - b);
      svg += `<g${ctx.P(l.banda_paso ?? 0)}><rect x="${x1 + 24}" y="${ys[0] - 36}" width="300" height="72" rx="8" fill="#b8f5b0"/><text x="${x1 + 174}" y="${ys[0] + 14}" text-anchor="middle" font-size="42" fill="#1f8a14" font-weight="700">${escapar(l.banda)}</text></g>`;
    }
    if (l.eje_x) svg += `<text x="${x1 + 60}" y="${y0 + 64}" text-anchor="end" font-size="46" fill="#444">${escapar(l.eje_x)}</text>`;
    if (l.eje_y) svg += `<text x="${x0 + 26}" y="${y1 + 12}" font-size="46" fill="#444">${escapar(l.eje_y)}</text>`;
  }
  const arriba = (l.titulo ? `<div style="font-size:72px;font-weight:700;letter-spacing:-.02em;line-height:1.05">${marcar(l.titulo)}</div>` : '') +
    (l.subtitulo ? `<div style="font-size:46px;color:var(--gris);margin-top:8px">${marcar(l.subtitulo)}</div>` : '');
  const emojis = (ctx.extraSobreBarras || []).map(e => `<div${ctx.P(e.k)} style="position:absolute;left:${e.x}px;top:${e.y - 170}px;transform:translateX(-50%)">${ctx.emoji(e.e, 140)}</div>`).join('');
  ctx.extraSobreBarras = null;
  return `<div class="pila grafica">${arriba ? `<div${ctx.P(0)} style="margin-bottom:30px">${arriba}</div>` : ''}
    <div${ctx.P(0)} style="position:relative;width:${W}px;height:${H + 60}px"><svg viewBox="0 0 ${W} ${H + 60}" width="${W}" height="${H + 60}" overflow="visible">${svg}</svg>${emojis}</div>
    ${texto(ctx, l.texto, 'medio mt-m', l.texto_paso ?? 0)}${nota(ctx, l.nota, l.nota_paso ?? 1, 'mt-s')}</div>`;
}

// LÍNEA DE TIEMPO — marcas sobre una línea, tramos de color y llaves con nota manuscrita.
export function lineaTiempo(l, ctx) {
  const marcas = l.marcas || [];
  const W = ctx.vertical ? 960 : 1720, y = 330, m0 = 90, m1 = W - 90;
  const xs = marcas.map((m, i) => m.pos != null ? m0 + m.pos * (m1 - m0) : m0 + (i / Math.max(1, marcas.length - 1)) * (m1 - m0));
  let svg = `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#9a9a9a" stroke-width="4"/>`;
  (l.tramos || []).forEach((t, i) => {
    const a = xs[t.desde] ?? 0, b = t.hasta === 'fin' ? W : xs[t.hasta] ?? W, c = HEX[t.tono] || HEX.v;
    const k = t.paso ?? i + 1;
    const mid = (a + b) / 2, lab = escapar(t.etiqueta || '');
    svg += `<g${ctx.P(k)}><line x1="${a}" y1="${y}" x2="${b}" y2="${y}" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
      ${lab ? `<path d="M${a + 10} ${y - 44} C${a + 10} ${y - 78}, ${mid - 24} ${y - 56}, ${mid} ${y - 96} C${mid + 24} ${y - 56}, ${b - 10} ${y - 78}, ${b - 10} ${y - 44}" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" data-trazo pathLength="1"/>
      <text x="${mid}" y="${y - 122}" text-anchor="middle" class="t-mano" font-size="${ctx.vertical ? 56 : 84}" fill="${c}" font-family="Caveat" font-weight="600">${lab}</text>` : ''}</g>`;
  });
  marcas.forEach((m, i) => {
    const c = HEX[m.tono] || '#9a9a9a', x = xs[i], k = m.paso ?? 0;
    svg += `<g${ctx.P(k)}><line x1="${x}" y1="${y - 30}" x2="${x}" y2="${y + 30}" stroke="${m.tono ? c : '#8a8a8a'}" stroke-width="6" stroke-linecap="round"/>
      <text x="${x}" y="${y + 100}" text-anchor="middle" font-size="56" font-weight="${m.tono ? 700 : 500}" fill="${m.tono ? c : '#8a8a8a'}">${escapar(m.texto || '')}</text>
      ${m.arriba ? `<text x="${x}" y="${y - 56}" text-anchor="middle" font-size="50" font-weight="700" fill="${m.tono ? c : '#8a8a8a'}">${escapar(m.arriba)}</text>` : ''}</g>`;
  });
  return `<div class="pila grafica">${texto(ctx, l.texto, 'medio', 0, ' style="margin-bottom:10px"')}
    <div${ctx.P(0)}><svg viewBox="0 0 ${W} 460" width="${W}" height="460" overflow="visible">${svg}</svg></div>
    ${nota(ctx, l.nota, l.nota_paso ?? (l.tramos || []).length + 1, 'mt-s')}</div>`;
}

// MEDIDOR — barra verde→rojo con pin: qué tan difícil es algo.
export function medidor(l, ctx) {
  const v = Math.max(0, Math.min(100, Number.isFinite(Number(l.valor)) ? Number(l.valor) : 85));
  const tono = l.tono || (v < 35 ? '#1fbf2d' : v < 65 ? '#f2a400' : '#e0182a');
  return `<div class="pila"><div class="medidor"${ctx.P(0)}${ctx.A('medidor')}><div style="position:absolute;left:${v}%;top:0">${PIN(tono)}</div></div>
    ${texto(ctx, l.texto, (l.tam_texto || 'medio') + ' mt-e', 0)}${nota(ctx, l.nota, 1, 'mt-s')}</div>`;
}

// OPCIONES — pastillas (Fácil / Medio / Difícil) y un cursor que elige una.
export function opciones(l, ctx) {
  const items = l.items || [{ texto: 'FÁCIL', tono: 'v' }, { texto: 'MEDIO', tono: 'n' }, { texto: 'DIFÍCIL', tono: 'r' }];
  const el = l.elegida ?? items.length - 1;
  ctx.clic = { a: 'op' + el, p: 0, tipo: l.cursor || 'flecha' };
  return `<div class="pila gap-m"${ctx.P(0)}>${items.map((it, i) => `<div class="opcion ${['v', 'n', 'r'].includes(it.tono) ? it.tono : 'v'} ${i === el ? '' : 'apagada'}"${ctx.A('op' + i)}>${marcar(it.texto)}</div>`).join('')}
    </div>${texto(ctx, l.texto, 'medio mt-l', 0)}`;
}

// REJILLA — cantidad hecha visible: 500 cajas, 99 puntos verdes y 1 rojo, una multitud y «tú».
export function rejilla(l, ctx) {
  const total = Math.min(l.total || 100, 1200);
  const aspecto = l.aspecto || 1.55;
  const cols = l.columnas || Math.max(1, Math.round(Math.sqrt(total * aspecto)));
  const rows = Math.ceil(total / cols);
  const areaW = l.ancho || (ctx.vertical ? 880 : 1450), areaH = l.alto || (ctx.vertical ? 1100 : 720);
  const c = Math.floor(Math.min(areaW / cols, areaH / rows) * 0.86);
  const g = Math.max(3, Math.floor(c * 0.16));
  const dest = new Set(l.destacar || []);
  const celdas = [];
  const unico = l.emoji && !l.punto ? ctx.emoji(l.emoji, c) : '';
  const destE = l.emoji_destacado ? ctx.emoji(l.emoji_destacado, c) : '';
  for (let i = 0; i < total; i++) {
    const d = dest.has(i);
    const cls = l.apagar_resto && !d ? ' apagado' : '';
    const tp = x => (['v', 'r', 'g'].includes(x) ? x : null);
    if (l.punto) celdas.push(`<div class="punto ${d ? (tp(l.tono_destacado) || 'r') : (tp(l.tono) || 'v')}${cls}"${d ? ctx.A('d' + i) : ''}></div>`);
    else celdas.push(`<div class="${cls.trim()}"${d ? ctx.A('d' + i) : ''} style="width:${c}px;height:${c}px">${d && destE ? destE : unico}</div>`);
  }
  const kAn = l.anotacion_paso ?? 1;
  if (l.anotacion) ctx.con({ de: 'rejilla', a: 'anot', estilo: 'fina', p: kAn });
  if (l.etiqueta_destacado && dest.size) ctx.con({ de: 'etq', a: 'd' + [...dest][0], estilo: 'fina-abajo', p: l.destacado_paso ?? 0 });
  return `<div class="pila">${texto(ctx, l.encabezado, 'chico', 0, ' style="margin-bottom:34px"')}
    ${l.etiqueta_destacado ? `<div class="pila"${ctx.P(l.destacado_paso ?? 0)}${ctx.A('etq')} style="margin-bottom:44px">${l.emoji_etiqueta ? ctx.emoji(l.emoji_etiqueta, 110) : ''}<div style="font-size:72px;font-weight:700">${marcar(l.etiqueta_destacado)}</div></div>` : ''}
    <div class="fila" style="align-items:center;gap:40px"><div class="rejilla"${ctx.P(0)}${ctx.A('rejilla')} style="--cols:${cols};--c:${c}px;--g:${g}px">${celdas.join('')}</div>
    ${l.anotacion ? `<div class="nota"${ctx.P(kAn)}${ctx.A('anot')} style="--tn:66px;color:var(--tinta);margin-top:40px;white-space:nowrap">${marcar(l.anotacion)}</div>` : ''}</div>
    ${texto(ctx, l.texto, 'chico mt-m', l.texto_paso ?? 0)}</div>`;
}

// PRUEBA — capturas reales (o un post armado) con sombra, círculo rojo y datos tachados.
export function prueba(l, ctx) {
  const caps = l.capturas || [];
  const html = caps.map((c, i) => {
    const giro = caps.length > 1 ? `transform:rotate(${[-1.5, 1.2, -0.8][i % 3]}deg);z-index:${i + 1}` : '';
    let dentro;
    if (c.post) {
      const p = c.post;
      const parr = (p.texto || []).map(x => {
        let h = marcar(x);
        if (p.clave) { const k = escapar(p.clave); h = h.replace(k, `<span class="clave" data-circulo="caja">${k}</span>`); }
        return `<p>${h}</p>`;
      }).join('');
      dentro = `<div class="post"><div class="cab"><div class="av"></div><div><b>${escapar(p.nombre || 'Nombre')}</b><span>${escapar(p.usuario || '')}${p.fecha ? ' • ' + escapar(p.fecha) : ''}</span></div><div style="margin-left:auto;color:#999;font-size:40px">···</div></div>${parr}</div>`;
    } else {
      const extra = [
        c.circulo ? ` data-circulo-img="${c.circulo.join(',')}"` : '',
        c.tachar ? ` data-tachon-img="${escapar(JSON.stringify(c.tachar))}"` : '',
      ].join('');
      dentro = `<img src="${ctx.img(c.src)}" alt=""${extra} style="${Number.isFinite(c.alto) ? `max-height:${c.alto}px` : ''}">`;
    }
    return `<div class="captura"${ctx.P(l.revelar === 'todo' ? 0 : i)} style="${giro}">${dentro}</div>`;
  }).join('');
  return `<div class="pila">${texto(ctx, l.encabezado, 'chico', 0, ' style="margin-bottom:40px"')}<div class="pruebas">${html}</div>
    ${texto(ctx, l.texto, 'chico mt-l', l.texto_paso ?? Math.max(0, caps.length - 1))}</div>`;
}

// CHAT — burbujas estilo mensaje: tú en azul a la derecha, los demás en gris a la izquierda.
export function chat(l, ctx) {
  const ms = l.mensajes || [];
  const html = ms.map((m, i) => {
    const yo = (m.de || 'yo') === 'yo';
    const cuerpo = marcar(m.texto).replace(/\[([^\[\]]+)\]/g, '<span class="hueco">[$1]</span>');
    const av = `<div class="${yo ? 'yo-av' : 'otro-av'}">${PERSONA}</div>`;
    return `<div class="msj ${yo ? 'yo' : 'otro'}"${ctx.P(l.revelar === 'todo' ? 0 : i)}>${yo ? '' : av}<div class="burbuja">${cuerpo}</div>${yo ? av : ''}</div>`;
  }).join('');
  return `<div class="pila">${texto(ctx, l.encabezado, 'chico', 0, ' style="margin-bottom:40px"')}<div class="chat">${html}</div></div>`;
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
export function calendario(l, ctx) {
  const fases = l.fases || [];
  const colores = { amarillo: ['#ffd21f', '#f2b705'], azul: ['#5ec8ff', '#1e9be6'], verde: ['#6bf06b', '#1fc31f'], rojo: ['#ff6b6b', '#e0182a'] };
  const iAct = l.fase_activa ? l.fase_activa - 1 : -1;          // se cuenta desde 1, igual que «activo» y «dia»
  const activa = iAct >= 0 ? fases[iAct] || null : null;
  const barra = colores[(activa && activa.color) || l.color] || colores.amarillo;
  const dias = l.dias || Array.from({ length: l.n || 14 }, (_, i) => ({ titulo: `DÍA ${i + 1}` }));
  const cols = l.columnas || 5;
  const faseDe = d => fases.findIndex(f => d + 1 >= f.desde && d + 1 <= f.hasta);
  const html = dias.map((d, i) => {
    const f = faseDe(i), c = f >= 0 ? colores[fases[f].color] || colores.amarillo : null;
    const encendida = activa ? f === iAct : false;
    const st = encendida && c ? `background:linear-gradient(180deg,${c[0]},${c[1]});color:#111` : '';
    const apagada = activa && !encendida ? ' apagado' : '';
    return `<div class="dia${apagada}" style="width:calc((100% - ${(cols - 1) * 20}px)/${cols});${st}"${ctx.A('dia' + i)}><small>${escapar(d.titulo || l.palabra_dia || 'DÍA')}</small><b>${escapar(String(d.numero ?? i + 1))}</b>${d.sub ? `<span>${escapar(d.sub)}</span>` : ''}</div>`;
  }).join('');
  (l.anotaciones || []).forEach((a, i) => ctx.con({ de: 'an' + i, a: 'dia' + (a.dia - 1), estilo: 'curva-roja', p: a.paso ?? 1 }));
  const anot = (l.anotaciones || []).map((a, i) => `<div class="nota"${ctx.P(a.paso ?? 1)}${ctx.A('an' + i)} style="position:absolute;${a.lado === 'derecha' ? 'right:40px' : 'left:40px'};top:${Number.isFinite(Number(a.arriba)) ? Number(a.arriba) : 300}px;--tn:46px;color:var(--tinta);max-width:300px">${marcar(a.texto)}</div>`).join('');
  return `<div class="calendario"${ctx.P(0)}><div class="barra" style="background:linear-gradient(90deg,${barra[0]},${barra[1]})">${escapar(activa ? activa.nombre : (l.titulo || 'Calendario'))}<span>${escapar(activa ? `DÍAS ${activa.desde}-${activa.hasta}` : (l.rango || `DÍAS 1-${dias.length}`))}</span></div>
    <div class="dias" style="display:flex;flex-wrap:wrap;justify-content:center;gap:20px">${html}</div></div>${anot}`;
}

// BOTÓN — un botón de interfaz y el cursor que lo aprieta («solo tienes que dar clic»).
export function boton(l, ctx) {
  ctx.clic = { a: 'boton', p: 0, tipo: l.cursor === 'flecha' ? 'flecha' : 'mano' };
  return `<div class="pila"><div class="boton-ui"${ctx.P(0)}${ctx.A('boton')}>${escapar(l.boton || 'Generar')}${l.emoji ? ctx.emoji(l.emoji, 58) : ''}</div>
    ${texto(ctx, l.texto, (l.tam_texto || 'medio') + ' mt-l', 0)}${nota(ctx, l.nota, 1, 'mt-s')}</div>`;
}

// CÍRCULOS — la audiencia: un anillo de personas y un círculo interior (quién sí / quién no).
export function circulos(l, ctx) {
  const R = l.radio || 360, r = l.radio_interior || 130;
  const tonos = { r: ['#fde3e3', '#f19a9a'], v: ['#dcf9d6', '#8fe08a'], g: ['#f1f1f1', '#cfcfcf'], a: ['#dff0ff', '#8cc8f5'], n: ['#fff1d6', '#f5c56b'] };
  const ext = tonos[l.tono] || tonos.r, int = tonos[l.tono_interior] || tonos.v;
  let semilla = 7;
  const rnd = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const n = l.personas || 12;
  const pos = Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * Math.PI * 2 + rnd() * 0.4;
    const d = r + 50 + rnd() * (R - r - 110);
    return [R + Math.cos(ang) * d, R + Math.sin(ang) * d];
  });
  const gente = pos.map(([x, y]) => `<div style="position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%)">${ctx.emoji(l.emoji || '🧑‍💼', 86)}</div>`).join('');
  const centro = l.centro ? `<div${ctx.P(l.centro_paso ?? 0)} style="position:absolute;left:${R}px;top:${R}px;transform:translate(-50%,-50%)">${ctx.emoji(l.centro, 140)}</div>` : '';
  return `<div class="pila">${texto(ctx, l.texto, 'chico', 0, ' style="margin-bottom:40px"')}
    <div${ctx.P(0)} style="position:relative;width:${2 * R}px;height:${2 * R}px">
      <div style="position:absolute;inset:0;border-radius:50%;background:${ext[0]};border:5px solid ${ext[1]}"></div>
      <div${ctx.P(l.interior_paso ?? 0)} style="position:absolute;left:${R - r}px;top:${R - r}px;width:${2 * r}px;height:${2 * r}px;border-radius:50%;background:${int[0]};border:5px solid ${int[1]}"></div>
      ${gente}${centro}</div>${nota(ctx, l.nota, 1, 'mt-m')}</div>`;
}
