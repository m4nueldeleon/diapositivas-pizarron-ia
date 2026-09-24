// layouts-texto.mjs — diseños de idea, lista, flujo, pasos, bifurcación, cifra, cita, objeto, tarjetas.
// Cada diseño devuelve el HTML interior del lienzo. Los pasos de revelado se asignan con ctx.P(k):
// el paso 0 es lo que se ve al cortar a la lámina; cada paso siguiente suma UN elemento.
import { marcar, escapar, texto, nota, bloque, pasoDe, estrellas } from './comun.mjs';
import { tamTexto, palabras, plano } from './markup.mjs';

// Etiqueta corta (≤ 3 palabras): no se parte en dos renglones («La / detecta», «Paso / 2»). Si con eso la fila
// no cabe, encajar() la reduce y QA lo cuenta.
const corta = t => (palabras(t) <= 3 ? ' corta' : '');

// `~~tachado~~` dentro de un texto: por omisión el trazo cae en el mismo paso que el texto; con
// `tachar_paso: n` cae n pasos DESPUÉS, para que el texto se alcance a leer antes de tacharlo [4:05].
function tacharDespues(html, ctx, k, n) {
  if (!Number.isInteger(n) || n < 1 || !/data-tachar>/.test(html)) return html;
  return html.replace(/data-tachar>/g, `data-tachar data-tachar-p="${ctx.paso(k + n)}">`);
}

// Par antes/después [10:55]: dos emojis en fila; `apagar_emoji` (0|1) atenúa el negado y `emoji_paso`
// revela el segundo en un paso aparte.
function parEmoji(l, ctx) {
  const [a, b] = l.emoji.slice(0, 2);
  if (l.emoji.length > 2) ctx.avisos.push('«emoji» lleva más de 2 elementos: el par antes/después usa solo los dos primeros');
  const apaga = i => (l.apagar_emoji === i ? ' style="opacity:.3"' : '');
  const k2 = pasoDe(l, 'emoji_paso', 0);
  return `<div class="fila" style="gap:110px;align-items:flex-end"${ctx.P(0)}${ctx.A('emoji')}><div${apaga(0)}>${ctx.emoji(a, l.emoji_tam, 'medio')}</div><div${apaga(1)}${k2 ? ctx.P(k2) : ''}>${ctx.emoji(b, l.emoji_tam, 'medio')}</div></div>`;
}

// IDEA — emoji arriba + frase (+ nota manuscrita). El diseño más usado del estilo.
// `encabezado_pos: "entre"` pone el rótulo gris ENTRE el emoji y la frase [34:25 «Reason #1»].
export function idea(l, ctx) {
  const tam = tamTexto(l.texto, l.tam_texto);
  const par = Array.isArray(l.emoji);
  // al lado del texto el emoji va a ~2 veces la letra (170 px en 16:9), no al tamaño de protagonista
  const tamE = l.emoji_lado && !l.emoji_tam ? (ctx.vertical ? 210 : 170) : l.emoji_tam;
  const emo = !l.emoji ? '' : par ? '' : ctx.emoji(l.emoji, tamE, 'medio');
  const kTexto = pasoDe(l, 'texto_paso', 0);
  const kNota = pasoDe(l, 'nota_paso', l.texto ? kTexto + 1 : 0);
  const entre = l.encabezado_pos === 'entre';
  const rotulo = cls => (l.encabezado ? `<div class="encabezado${cls}"${ctx.P(0)}>${marcar(l.encabezado)}</div>` : '');
  if (l.emoji_lado && !par) {
    return `<div class="pila">${rotulo('')}
      <div class="fila gap-s t ${tam}"${ctx.P(kTexto)}${ctx.A('texto')}><span${ctx.A('emoji')}>${emo.replace('class="emo ', 'class="emo en-linea ')}</span><span>${tacharDespues(marcar(l.texto), ctx, kTexto, l.tachar_paso)}</span></div>
      ${nota(ctx, l.nota, kNota, 'mt-m')}</div>`;
  }
  // `estrellas: { valor, max }` en lugar del emoji: una fila suelta de estrellas sobre la frase [4:10]
  const est = !emo && !par && l.estrellas && typeof l.estrellas === 'object' ? (() => {
    const mx = Math.max(1, Math.min(10, Math.round(Number(l.estrellas.max) || 5)));
    const v = Math.max(0, Math.min(mx, Math.round(Number(l.estrellas.valor) || 0)));
    return `<div class="estrellas suelta"${ctx.P(0)}${ctx.A('emoji')}>${estrellas(v, mx)}</div>`;
  })() : '';
  const vis = par ? parEmoji(l, ctx) : emo ? `<div${ctx.P(0)}${ctx.A('emoji')}>${emo}</div>` : est;
  const hayEmo = Boolean(vis);
  return `<div class="pila">
    ${entre ? '' : rotulo('')}
    ${vis}
    ${entre ? rotulo(' entre') : ''}
    ${tacharDespues(texto(ctx, l.texto, tam + (hayEmo && !(entre && l.encabezado) ? ' mt-e' : ''), kTexto, ctx.A('texto')), ctx, kTexto, l.tachar_paso)}
    ${nota(ctx, l.nota, kNota, 'mt-m')}</div>`;
}

export const listaCentrada = l => l.alinear === 'centro' || (l.alinear !== 'izquierda' && Array.isArray(l.items) && l.items.length > 0
  && l.items.every(it => it && typeof it === 'object' && it.tachado));

// LISTA — encabezado gris chico + viñetas (❌ ✅ o emoji). Una viñeta por paso.
export function lista(l, ctx) {
  const items = l.items || [];
  const largo = Math.max(0, ...items.map(i => palabras(typeof i === 'string' ? i : i.texto)));
  const px = largo <= 6 ? 72 : largo <= 10 ? 66 : 58;
  const t = l.tam_texto || `${ctx.vertical ? Math.round(px * 1.2) : px}px`;   // en 9:16 el texto crece (hay alto de sobra)
  // Descartes [m_256 4:16]: si TODOS los ítems van tachados (o `alinear: "centro"`), cada renglón va centrado, en
  // seminegrita, y la lista se queda centrada en la lámina con su hueco reservado (construir.mjs, anclaArriba).
  const centrada = listaCentrada(l);
  const gapL = l.separacion || (centrada && items.length <= 3 ? 130 : items.length <= 3 && largo <= 4 ? 110 : items.length <= 4 ? 70 : 48);
  const vin = { x: '❌', no: '❌', check: '✅', si: '✅' };
  const filas = items.map((it, i) => {
    const o = typeof it === 'string' ? { texto: it } : it;
    const e = o.emoji || vin[l.vineta] || l.vineta || '';
    const kT = o.tachado ? ` data-tachar="caja" data-tachar-p="${ctx.paso(i + (l.tachar_despues ? items.length : 0))}"` : '';
    return `<div class="item"${ctx.P(i)}${ctx.A('i' + i)}${kT}>${e ? ctx.em.html(vin[e] || e, '1.12em') : ''}<span>${marcar(o.texto)}</span></div>`;
  }).join('');
  return `<div class="pila">${l.encabezado ? `<div class="encabezado"${ctx.P(0)}>${marcar(l.encabezado)}</div>` : ''}
    <div class="lista${centrada ? ' centrada' : ''}" style="--t:${t};--gap-lista:${gapL}px">${filas}</div>${nota(ctx, l.nota, pasoDe(l, 'nota_paso', items.length), 'mt-l')}</div>`;
}

// FLUJO — nodos (emoji + etiqueta) unidos por flechas rojas a mano. A → B → C.
export function flujo(l, ctx) {
  const nodos = l.nodos || [];
  const n = nodos.length;
  // `flecha: "ninguna"`: una fila de conceptos numerados sin causa→efecto [19:10-19:15]; nodos más chicos y
  // etiqueta regular, cada uno en su paso.
  const sinFlecha = l.flecha === 'ninguna';
  const tamE = l.emoji_tam || (sinFlecha ? 120 : n <= 2 ? 220 : n === 3 ? 180 : n === 4 ? 140 : 104);
  // con columnas iguales (todas del ancho del nodo más ancho) el hueco baja un poco para que 3 nodos con sub quepan
  const gap = l.separacion || (ctx.vertical ? 150 : sinFlecha ? (n <= 3 ? 150 : 90) : n <= 2 ? 380 : n === 3 ? 210 : n === 4 ? 130 : 80);
  const te = n >= 5 ? '40px' : n === 4 ? '54px' : sinFlecha ? '60px' : '76px';
  const estilo = sinFlecha ? 'ninguna' : ctx.vertical ? 'recta' : (l.flecha || 'recta');
  const html = nodos.map((nd, i) => {
    const k = i === 0 ? 0 : i;
    const vis = nd.imagen ? `<img src="${ctx.img(nd.imagen)}" style="height:${nd.alto || 300}px;width:auto;display:block" alt="">` : ctx.emoji(nd.emoji, tamE);
    if (i > 0 && !sinFlecha) {
      const fl = Array.isArray(l.flechas) ? (l.flechas[i - 1] || {}) : {};
      ctx.con({ de: 'n' + (i - 1), a: 'n' + i, estilo: fl.estilo || estilo, tachada: !!fl.tachada, etiqueta: fl.etiqueta, p: k });
    }
    const aNodo = ctx.vertical ? ctx.A('n' + i) : '', aVis = ctx.vertical ? '' : ctx.A('n' + i);
    return `<div class="nodo" style="--te:${te}"${ctx.P(k)}${aNodo}>
      <div${aVis}>${vis}</div>
      ${nd.etiqueta ? `<div class="etiqueta ${nd.normal || sinFlecha ? 'normal' : ''}${corta(nd.etiqueta)}">${marcar(nd.etiqueta)}</div>` : ''}
      ${nd.sub ? `<div class="sub-etiqueta">${marcar(nd.sub)}</div>` : ''}</div>`;
  }).join('');
  // En horizontal, columnas IGUALES (todas del ancho del nodo más ancho): los emojis quedan equidistantes y las
  // flechas, que van de emoji a emoji, miden lo mismo aunque un nodo lleve un sub largo [17:00, 17:20].
  const fila = ctx.vertical ? `<div class="pila" style="gap:${gap}px;align-items:flex-start">`
    : `<div class="fila fila-igual" style="gap:${gap}px">`;
  return `<div class="pila">${l.encabezado ? `<div class="encabezado"${ctx.P(0)}>${marcar(l.encabezado)}</div>` : ''}
    ${fila}${html}</div>
    ${texto(ctx, l.texto, tamTexto(l.texto, l.tam_texto || 'medio') + ' mt-l', pasoDe(l, 'texto_paso', Math.max(0, n - 1)))}
    ${nota(ctx, l.nota, pasoDe(l, 'nota_paso', pasoDe(l, 'texto_paso', Math.max(0, n - 1)) + 1), 'mt-m')}</div>`;
}

// PASOS — teclas 1 2 3 unidas por una ruta punteada (el «sistema de N pasos»). Vuelve en cada sección
// con el paso activo encendido y los anteriores con ✅.
// Por omisión todo entra en un solo corte (teclas, título y nota), como en la referencia [1:55]; con
// `revelar: "pasos"` cada tecla entra en su propio paso y la ruta se dibuja tramo por tramo.
// Mapa con íconos [16:40, 28:00]: SIN ruta punteada por omisión, los pasos no activos al 20% y la ✅ de
// los hechos SIEMPRE a todo color (va fuera de la parte atenuada: es la señal de avance).
export function pasos(l, ctx) {
  const n = l.n || (l.iconos ? l.iconos.length : 3);
  const activo = l.activo || 0;
  const hechos = new Set(l.hechos || []);
  const rev = l.revelar === 'pasos' && !activo && !l.hechos;
  const horizontal = !ctx.vertical;
  // En horizontal las columnas son IGUALES y reparten el ancho útil: los pasos quedan a la misma distancia, como
  // en ref_1040 (Find/Build/Launch a ~627 px uno de otro). `separacion` fija la distancia entre centros.
  // Con 4 o 5 pasos el ícono y la etiqueta bajan, y la etiqueta se ajusta a su palabra más larga para no salirse
  // de su columna («Recordatorios» con 5 pasos): una palabra sola no se puede partir.
  const colW = l.separacion ?? Math.min(l.iconos ? 630 : 461, Math.floor(ctx.util / Math.max(1, n)));
  const letras = Math.max(0, ...(l.etiquetas || []).map(x => Math.max(0, ...plano(x).split(/\s+/).map(w => [...w].length))));
  const ajusta = (base, piso) => (letras ? Math.max(piso, Math.min(base, Math.floor((colW - 20) / (0.56 * letras)))) : base);
  const tamIcono = horizontal && n >= 5 ? 150 : 180;
  const baseEtq = horizontal ? (n <= 3 ? 86 : n === 4 ? 74 : 64) : 86;
  const tamEtq = l.tam_etiqueta || (horizontal ? ajusta(baseEtq, 44) : 86);
  const tamPref = horizontal ? Math.round(baseEtq * 0.72) : 62;
  const tamEtqTecla = l.tam_etiqueta || (horizontal ? ajusta(56, 40) : 56);
  const kt = pasoDe(l, 'texto_paso', rev ? n : 0);
  const kClic = l.clic ? pasoDe(l, 'clic_paso', kt + 1) : -1;
  const ruta = l.ruta ?? !l.iconos;
  // Arrastre [1:55]: la mano aprieta la tecla del clic y ARRASTRA la ruta punteada hasta la última tecla. Los
  // tramos desde la tecla del clic nacen en el paso del clic, uno tras otro (~700 ms cada uno) al terminar la
  // onda (~760 ms). `arrastre: false` deja la ruta completa desde el paso 0 y la mano quieta.
  const arrastra = l.clic && ruta && l.arrastre !== false && !rev && l.clic < n;
  // Con clic, la punta del dedo va al PIE del número (runtime.js: 0.64, 0.74 de la tecla [ref_115]) y la mano cuelga
  // ~60 px bajo la tecla: TODAS las etiquetas bajan juntas (siguen alineadas) para que la mano no las toque
  const mEtq = l.clic && !l.iconos ? 75 : 28;
  const cols = [];
  for (let i = 0; i < n; i++) {
    const apagado = activo && activo !== i + 1 ? ' style="opacity:.2"' : '';
    const sobre = l.sobre ? `<div style="margin-bottom:10px">${ctx.emoji(l.sobre, 120)}</div>` : '';
    let cab;
    if (l.iconos) {
      cab = `<div${ctx.A('k' + i)}>${ctx.emoji(l.iconos[i], tamIcono)}</div>
        ${l.prefijo !== false ? `<div class="rotulo-paso" style="font-size:${tamPref}px;color:var(--gris);margin-top:60px;line-height:1.05;white-space:nowrap">${escapar((l.prefijo || 'Paso') + ' ' + (i + 1))}</div>` : ''}
        ${l.etiquetas ? `<div class="rotulo-paso" style="font-size:${tamEtq}px;font-weight:700;letter-spacing:-.02em;line-height:1.05;white-space:nowrap${l.prefijo === false ? ';margin-top:60px' : ''}">${marcar(l.etiquetas[i] || '')}</div>` : ''}`;
    } else {
      cab = `<div class="tecla" style="--s:${ctx.vertical ? 150 : 170}px"${ctx.A('k' + i)}>${i + 1}</div>
        ${l.etiquetas ? `<div class="rotulo-paso${corta(l.etiquetas[i] || '')}" style="font-size:${tamEtqTecla}px;font-weight:700;margin-top:${mEtq}px">${marcar(l.etiquetas[i] || '')}</div>` : ''}`;
    }
    const ok = hechos.has(i + 1) ? `<div style="margin-top:26px">${ctx.emoji('✅', 90)}</div>` : '';
    // flex:0 0 auto: la columna nunca se encoge (encogida partía «Paso / 2»); si la fila no cabe, encaja con zoom
    cols.push(`<div class="pila" style="flex:0 0 auto"${rev ? ctx.P(i) : ''}><div class="pila"${apagado}>${sobre}${cab}</div>${ok}</div>`);
    if (i > 0 && ruta) {
      const j = i - l.clic;   // tramo j-ésimo desde la tecla del clic (0 = el que sale de ella)
      if (arrastra && j >= 0) ctx.con({ de: 'k' + (i - 1), a: 'k' + i, estilo: 'punteada', onda: i % 2 ? 1 : -1, p: kClic, retraso: 760 + j * 700, arrastre: j });
      else ctx.con({ de: 'k' + (i - 1), a: 'k' + i, estilo: 'punteada', onda: i % 2 ? 1 : -1, p: rev ? i : 0 });
    }
  }
  // El punto del dedo sobre la tecla lo decide el motor (runtime.js, punta()); aquí solo el ancla y el arrastre
  if (l.clic) ctx.clic = { a: 'k' + (l.clic - 1), p: kClic, ...(arrastra ? { fin: 'k' + (n - 1) } : {}) };
  // 9:16: una fila con hueco fijo (`separacion` es el hueco)
  const fila = horizontal
    ? `<div class="fila-pasos"${rev ? '' : ctx.P(0)} style="display:grid;grid-template-columns:repeat(${n},${colW}px);justify-items:center;align-items:start">`
    : `<div class="fila"${rev ? '' : ctx.P(0)} style="gap:${l.separacion ?? (l.iconos ? 70 : 110)}px;align-items:flex-start">`;
  // bajo las teclas la frase va a 84 px (ref_115: «3-step "Just-Click-The-Buttons" business» en UN renglón)
  return `<div class="pila">${fila}${cols.join('')}</div>
    ${texto(ctx, l.texto, (l.tam_texto || (l.iconos ? 'grande' : 'medio')) + (l.iconos ? ' mt-e' : ' mt-t'), kt)}
    ${nota(ctx, l.nota, pasoDe(l, 'nota_paso', kt), 'mt-s')}</div>`;
}

// BIFURCACIÓN — un origen arriba y dos ramas abajo con flechas negras curvas; llave roja con nota.
export function bifurcacion(l, ctx) {
  const o = l.origen || {};
  const ramas = l.ramas || [];
  ramas.forEach((r, i) => ctx.con({ de: 'o', a: 'r' + i, estilo: 'codo', p: l.revelar === 'ramas' ? 1 + i : 1 }));
  const kLlave = l.revelar === 'ramas' ? ramas.length + 1 : 2;
  if (l.llave) ctx.con({ de: 'r0', a: 'r' + (ramas.length - 1), via: 'llave-et', estilo: 'llave', p: kLlave });
  const tamE = l.emoji_tam || 124;
  const tamT = l.tam_texto && /px$/.test(l.tam_texto) ? l.tam_texto : ctx.vertical ? '76px' : '88px';
  const rs = ramas.map((r, i) => `<div class="nodo"${ctx.P(l.revelar === 'ramas' ? 1 + i : 1)}${ctx.A('r' + i)}>
      ${r.emoji ? ctx.emoji(r.emoji, tamE) : ''}
      ${r.valor ? `<div class="valor">${marcar(r.valor)}</div>` : ''}
      ${r.texto ? `<div class="etiqueta normal${corta(r.texto)}" style="--te:54px">${marcar(r.texto)}</div>` : ''}</div>`).join('');
  return `<div class="pila">
    <div class="nodo"${ctx.P(0)}>${o.emoji ? ctx.emoji(o.emoji, tamE) : ''}
      <div class="t grande"${ctx.A('o')} style="font-size:${tamT}">${marcar(o.texto || '')}</div></div>
    <div class="fila" style="gap:${l.separacion || (ctx.vertical ? 200 : 640)}px;margin-top:100px;align-items:flex-start">${rs}</div>
    ${l.llave ? `<div class="nota roja"${ctx.P(kLlave)}${ctx.A('llave-et')} style="margin-top:120px;--tn:76px;font-weight:600">${marcar(l.llave)}</div>` : ''}</div>`;
}

// CIFRA — números y ecuaciones grandes. Una línea por paso. Cada línea puede ser texto o un objeto
// { texto, tam, peso, tono } para jerarquizar: un ancla chica y gris arriba y el precio grande abajo.
const TONO_LINEA = { v: 'var(--verde)', r: 'var(--rojo)', n: 'var(--naranja)', g: 'var(--gris)', a: 'var(--azul)', k: 'var(--tinta)', o: 'var(--oro)' };
export function cifra(l, ctx) {
  const lineas = (l.lineas || (l.valor ? [l.valor] : [])).map(x => (x && typeof x === 'object' ? x : { texto: x }));
  const unica = lineas.length === 1 && !l.tam;
  const tc = l.tam || (unica ? '140px' : '84px');
  const peso = unica ? 800 : 500;
  const html = lineas.map((x, i) => {
    const col = TONO_LINEA[x.tono] ? `color:${TONO_LINEA[x.tono]};` : '';
    return `<div class="cifra"${ctx.P(i)}${ctx.A('l' + i)} style="--tc:${x.tam || tc};font-weight:${x.peso || peso};${col}${i ? 'margin-top:34px' : ''}">${tacharDespues(marcar(x.texto), ctx, i, x.tachar_paso ?? l.tachar_paso)}</div>`;
  }).join('');
  const k = Math.max(0, lineas.length - 1);
  return `<div class="pila">
    ${l.arriba ? `<div class="nota" ${ctx.P(0)} style="margin-bottom:40px">${marcar(l.arriba)}</div>` : ''}
    ${html}
    ${l.abajo ? `<div class="etiqueta-chica"${ctx.P(0)}>${marcar(l.abajo)}</div>` : ''}
    ${l.fuente ? `<div class="fuente"${ctx.P(k)}>${escapar(l.fuente)}</div>` : ''}
    ${l.texto ? texto(ctx, l.texto, 'medio mt-l', l.texto_paso ?? k) : ''}
    ${nota(ctx, l.nota, (l.nota_paso ?? k + 1), 'mt-m')}</div>`;
}

// CITA — frase manuscrita con flecha roja curva desde un ícono (la «nota al margen» del profesor).
export function cita(l, ctx) {
  ctx.con({ de: 'icono', a: 'cita', estilo: 'curva-roja', p: 0 });
  return `<div class="pila">
    <div${ctx.P(0)}${ctx.A('icono')}>${ctx.emoji(l.emoji || '📝', l.emoji_tam, 'medio')}</div>
    <div class="nota"${ctx.P(0)}${ctx.A('cita')} style="--tn:${l.tam_texto && /px$/.test(l.tam_texto) ? l.tam_texto : '64px'};color:var(--tinta);margin-top:90px;max-width:1400px">${tacharDespues(marcar(l.texto), ctx, 0, l.tachar_paso)}</div>
    ${nota(ctx, l.nota, pasoDe(l, 'nota_paso', 1), 'mt-m')}</div>`;
}

// OBJETO — foto real recortada (sin fondo) o emoji gigante como protagonista.
export function objeto(l, ctx) {
  const vis = l.imagen
    ? `<img src="${ctx.img(l.imagen)}" style="height:${l.alto || 520}px;width:auto;display:block;filter:drop-shadow(0 26px 30px rgba(0,0,0,.14))" alt="">`
    : ctx.emoji(l.emoji || '📦', l.emoji_tam || 'heroe');
  return `<div class="pila"><div${ctx.P(0)}${ctx.A('objeto')}>${vis}</div>
    ${texto(ctx, l.texto, tamTexto(l.texto, l.tam_texto) + ' mt-m', pasoDe(l, 'texto_paso', 0))}
    ${nota(ctx, l.nota, pasoDe(l, 'nota_paso', pasoDe(l, 'texto_paso', 0) + 1), 'mt-s')}</div>`;
}

// TARJETAS — criterios o métricas en tarjetas gris suave con emoji. Una por paso.
// El ancho de cada tarjeta sale del ancho útil del formato (1620 en 16:9, 900 en vertical): 4 tarjetas en
// 16:9 caben en una fila de ~378 px sin que el encaje tenga que reducir la letra.
export function tarjetas(l, ctx) {
  const items = l.items || [];
  const angosto = ctx.util < 1200;
  const cols = l.columnas || (angosto && items.length >= 4 ? 2 : items.length <= 4 ? items.length : 3);
  const tw = Math.min(l.ancho || (items.length <= 3 ? 520 : 480), Math.floor((ctx.util - (cols - 1) * 36) / Math.max(1, cols)));
  const tt = l.tam_texto && /px$/.test(l.tam_texto) ? `;--tt:${l.tam_texto}` : '';
  // Emoji arriba y a la misma altura en toda la fila; un rótulo de dos renglones crece hacia abajo [9:25]
  const html = items.map((it, i) => `<div class="tarjeta ${['v', 'r', 'n'].includes(it.tono) ? 'tono-b' + it.tono : ''}"${ctx.P(i)}>${it.emoji ? ctx.emoji(it.emoji, 104) : ''}<div class="rotulo">${marcar(it.texto)}</div></div>`).join('');
  return `<div class="pila">${l.encabezado ? `<div class="encabezado"${ctx.P(0)}>${marcar(l.encabezado)}</div>` : ''}
    <div class="tarjetas" style="--cols:${cols};--tw:${tw}px;--th:${items.length <= 3 ? 320 : 280}px${tt}">${html}</div>
    ${nota(ctx, l.nota, pasoDe(l, 'nota_paso', items.length), 'mt-l')}</div>`;
}

// OSCURA — revelación de producto u oferta: fondo negro con brillo violeta. Rompe el blanco a propósito.
export function oscura(l, ctx) {
  const logo = l.imagen ? `<img src="${ctx.img(l.imagen)}" style="height:${l.alto || 150}px;width:auto" alt="">` : (l.emoji ? ctx.emoji(l.emoji, l.emoji_tam || 150) : '');
  return `<div class="pila">${logo ? `<div${ctx.P(0)}>${logo}</div>` : ''}
    ${l.titulo ? `<div class="titulo-marca"${ctx.P(0)} style="${logo ? 'margin-top:30px' : ''}">${marcar(l.titulo)}</div>` : ''}
    ${texto(ctx, l.texto, 'chico mt-m', pasoDe(l, 'texto_paso', 0))}
    ${nota(ctx, l.nota, pasoDe(l, 'nota_paso', pasoDe(l, 'texto_paso', 0) + 1), 'mt-s')}</div>`;
}

// CUADRANTES — bloques de color a sangre (rojo = lo que NO necesitas, verde = lo que sí). Uno por paso.
export function cuadrantes(l, ctx) {
  const items = l.items || [];
  const cols = l.columnas || (items.length <= 2 ? items.length : 2);
  const html = items.map((it, i) => `<div class="cuadro ${['r', 'v', 'n', 'g', 'a', 'b'].includes(it.tono) ? it.tono : 'g'}"${ctx.P(l.revelar === 'todo' ? 0 : i)}>
      ${it.emoji ? `<div>${ctx.emoji(it.emoji, it.emoji_tam || 130)}</div>` : ''}<div>${marcar(it.texto || '')}</div></div>`).join('');
  return `<div class="cuadrantes" style="--cols:${cols}">${html}</div>`;
}

// FOCO — atenúa la lámina anterior (el fondo lo arma construir.mjs) y escribe encima la frase a mano [15:20].
// `nota` va debajo, más chica, en el mismo corte (o en `nota_paso`): nunca se descarta en silencio.
export function foco(l, ctx) {
  const principal = l.texto || l.nota || '';
  const debajo = l.texto && l.nota ? `<div class="nota"${ctx.P(pasoDe(l, 'nota_paso', 0))} style="--tn:56px;margin-top:28px;max-width:min(1640px, var(--ancho-texto))">${marcar(l.nota)}</div>` : '';
  // La frase de foco es la PROTAGONISTA, no una nota al margen: Caveat a ~88 px y casi de lado a lado (~1560 px) [15:20]
  const largo = palabras(principal) > 14, horizontal = ctx.F.W > ctx.F.H;
  const tam = l.tam || (horizontal ? (largo ? '84px' : '88px') : (largo ? '88px' : '96px'));
  return `<div class="pila"><div class="nota"${ctx.P(0)} style="--tn:${tam};color:var(--tinta);font-weight:600;max-width:min(1640px, var(--ancho-texto))">${marcar(principal)}</div>${debajo}</div>`;
}
