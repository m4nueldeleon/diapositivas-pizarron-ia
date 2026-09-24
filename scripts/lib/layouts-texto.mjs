// layouts-texto.mjs — diseños de idea, lista, flujo, pasos, bifurcación, cifra, cita, objeto, tarjetas.
// Cada diseño devuelve el HTML interior del lienzo. Los pasos de revelado se asignan con ctx.P(k):
// el paso 0 es lo que se ve al cortar a la lámina; cada paso siguiente suma UN elemento.
import { marcar, escapar, texto, nota, bloque } from './comun.mjs';
import { tamTexto, palabras } from './markup.mjs';

// IDEA — emoji arriba + frase (+ nota manuscrita). El diseño más usado del estilo.
export function idea(l, ctx) {
  const tam = tamTexto(l.texto, l.tam_texto);
  const emo = l.emoji ? ctx.emoji(l.emoji, l.emoji_tam, 'medio') : '';
  const kNota = l.nota_paso ?? (l.texto ? 1 : 0);
  if (l.emoji_lado) {
    return `<div class="pila">${l.encabezado ? `<div class="encabezado"${ctx.P(0)}>${marcar(l.encabezado)}</div>` : ''}
      <div class="fila gap-s t ${tam}"${ctx.P(0)}${ctx.A('texto')}><span${ctx.A('emoji')}>${emo.replace('class="emo ', 'class="emo en-linea ')}</span><span>${marcar(l.texto)}</span></div>
      ${nota(ctx, l.nota, kNota, 'mt-m')}</div>`;
  }
  return `<div class="pila">
    ${l.encabezado ? `<div class="encabezado"${ctx.P(0)}>${marcar(l.encabezado)}</div>` : ''}
    ${emo ? `<div${ctx.P(0)}${ctx.A('emoji')}>${emo}</div>` : ''}
    ${texto(ctx, l.texto, tam + (emo ? ' mt-e' : ''), 0, ctx.A('texto'))}
    ${nota(ctx, l.nota, kNota, 'mt-m')}</div>`;
}

// LISTA — encabezado gris chico + viñetas (❌ ✅ o emoji). Una viñeta por paso.
export function lista(l, ctx) {
  const items = l.items || [];
  const largo = Math.max(0, ...items.map(i => palabras(typeof i === 'string' ? i : i.texto)));
  const t = l.tam_texto || (largo <= 6 ? '72px' : largo <= 10 ? '66px' : '58px');
  const gapL = l.separacion || (items.length <= 3 && largo <= 4 ? 110 : items.length <= 4 ? 70 : 48);
  const vin = { x: '❌', no: '❌', check: '✅', si: '✅' };
  const filas = items.map((it, i) => {
    const o = typeof it === 'string' ? { texto: it } : it;
    const e = o.emoji || vin[l.vineta] || l.vineta || '';
    const kT = o.tachado ? ` data-tachar="caja" data-tachar-p="${ctx.paso(i + (l.tachar_despues ? items.length : 0))}"` : '';
    return `<div class="item"${ctx.P(i)}${ctx.A('i' + i)}${kT}>${e ? ctx.em.html(vin[e] || e, '1.12em') : ''}<span>${marcar(o.texto)}</span></div>`;
  }).join('');
  return `<div class="pila">${l.encabezado ? `<div class="encabezado"${ctx.P(0)}>${marcar(l.encabezado)}</div>` : ''}
    <div class="lista" style="--t:${t};--gap-lista:${gapL}px">${filas}</div>${nota(ctx, l.nota, items.length, 'mt-l')}</div>`;
}

// FLUJO — nodos (emoji + etiqueta) unidos por flechas rojas a mano. A → B → C.
export function flujo(l, ctx) {
  const nodos = l.nodos || [];
  const n = nodos.length;
  const tamE = l.emoji_tam || (n <= 2 ? 220 : n === 3 ? 180 : n === 4 ? 140 : 104);
  const gap = l.separacion || (ctx.vertical ? 150 : n <= 2 ? 380 : n === 3 ? 260 : n === 4 ? 170 : 96);
  const te = n >= 5 ? '40px' : n === 4 ? '54px' : '76px';
  const estilo = ctx.vertical ? 'recta' : (l.flecha || 'recta');
  const html = nodos.map((nd, i) => {
    const k = i === 0 ? 0 : i;
    const vis = nd.imagen ? `<img src="${ctx.img(nd.imagen)}" style="height:${nd.alto || 300}px;width:auto;display:block" alt="">` : ctx.emoji(nd.emoji, tamE);
    if (i > 0) {
      const fl = Array.isArray(l.flechas) ? (l.flechas[i - 1] || {}) : {};
      ctx.con({ de: 'n' + (i - 1), a: 'n' + i, estilo: fl.estilo || estilo, tachada: !!fl.tachada, etiqueta: fl.etiqueta, p: k });
    }
    const aNodo = ctx.vertical ? ctx.A('n' + i) : '', aVis = ctx.vertical ? '' : ctx.A('n' + i);
    return `<div class="nodo" style="--te:${te}"${ctx.P(k)}${aNodo}>
      <div${aVis}>${vis}</div>
      ${nd.etiqueta ? `<div class="etiqueta ${nd.normal ? 'normal' : ''}">${marcar(nd.etiqueta)}</div>` : ''}
      ${nd.sub ? `<div class="sub-etiqueta">${marcar(nd.sub)}</div>` : ''}</div>`;
  }).join('');
  const dir = ctx.vertical ? 'pila' : 'fila';
  return `<div class="pila">${l.encabezado ? `<div class="encabezado"${ctx.P(0)}>${marcar(l.encabezado)}</div>` : ''}
    <div class="${dir}" style="gap:${gap}px;align-items:flex-start">${html}</div>
    ${texto(ctx, l.texto, tamTexto(l.texto, l.tam_texto || 'medio') + ' mt-l', l.texto_paso ?? Math.max(0, n - 1))}
    ${nota(ctx, l.nota, (l.texto_paso ?? Math.max(0, n - 1)) + 1, 'mt-m')}</div>`;
}

// PASOS — teclas 1 2 3 unidas por una ruta punteada (el «sistema de N pasos»). Vuelve en cada sección
// con el paso activo encendido y los anteriores con ✅.
export function pasos(l, ctx) {
  const n = l.n || (l.iconos ? l.iconos.length : 3);
  const activo = l.activo || 0;
  const hechos = new Set(l.hechos || []);
  const cols = [];
  for (let i = 0; i < n; i++) {
    const apagado = activo && activo !== i + 1 ? ' style="opacity:.28"' : '';
    const sobre = l.sobre ? `<div style="margin-bottom:10px">${ctx.emoji(l.sobre, 120)}</div>` : '';
    let cab;
    if (l.iconos) {
      cab = `<div${ctx.A('k' + i)}>${ctx.emoji(l.iconos[i], 180)}</div>
        ${l.prefijo !== false ? `<div style="font-size:46px;color:var(--gris);margin-top:22px">${escapar((l.prefijo || 'Paso') + ' ' + (i + 1))}</div>` : ''}
        ${l.etiquetas ? `<div style="font-size:80px;font-weight:700;letter-spacing:-.02em;line-height:1.05">${marcar(l.etiquetas[i] || '')}</div>` : ''}`;
    } else {
      cab = `<div class="tecla" style="--s:${ctx.vertical ? 150 : 170}px"${ctx.A('k' + i)}>${i + 1}</div>
        ${l.etiquetas ? `<div style="font-size:56px;font-weight:700;margin-top:28px">${marcar(l.etiquetas[i] || '')}</div>` : ''}`;
    }
    const ok = hechos.has(i + 1) ? `<div style="margin-top:26px">${ctx.emoji('✅', 90)}</div>` : '';
    cols.push(`<div class="pila"${apagado}>${sobre}${cab}${ok}</div>`);
    if (i > 0 && l.ruta !== false) ctx.con({ de: 'k' + (i - 1), a: 'k' + i, estilo: 'punteada', onda: i % 2 ? 1 : -1, p: 0 });
  }
  if (l.clic) ctx.clic = { a: 'k' + (l.clic - 1), p: 1 };
  const kt = 0;
  const gapP = ctx.vertical ? (l.iconos ? 70 : 110) : (l.iconos ? 230 : 330);
  return `<div class="pila"><div class="fila"${ctx.P(0)} style="gap:${gapP}px;align-items:flex-start">${cols.join('')}</div>
    ${texto(ctx, l.texto, (l.tam_texto || 'grande') + ' mt-e', kt)}
    ${nota(ctx, l.nota, kt, 'mt-s')}</div>`;
}

// BIFURCACIÓN — un origen arriba y dos ramas abajo con flechas negras curvas; llave roja con nota.
export function bifurcacion(l, ctx) {
  const o = l.origen || {};
  const ramas = l.ramas || [];
  ramas.forEach((r, i) => ctx.con({ de: 'o', a: 'r' + i, estilo: 'codo', p: l.revelar === 'ramas' ? 1 + i : 1 }));
  const kLlave = l.revelar === 'ramas' ? ramas.length + 1 : 2;
  if (l.llave) ctx.con({ de: 'r0', a: 'r' + (ramas.length - 1), via: 'llave-et', estilo: 'llave', p: kLlave });
  const rs = ramas.map((r, i) => `<div class="nodo"${ctx.P(l.revelar === 'ramas' ? 1 + i : 1)}${ctx.A('r' + i)}>
      ${r.emoji ? ctx.emoji(r.emoji, 124) : ''}
      ${r.valor ? `<div class="valor">${marcar(r.valor)}</div>` : ''}
      ${r.texto ? `<div class="etiqueta normal" style="--te:54px">${marcar(r.texto)}</div>` : ''}</div>`).join('');
  return `<div class="pila">
    <div class="nodo"${ctx.P(0)}>${o.emoji ? ctx.emoji(o.emoji, 124) : ''}
      <div class="t grande"${ctx.A('o')} style="font-size:88px">${marcar(o.texto || '')}</div></div>
    <div class="fila" style="gap:${l.separacion || (ctx.vertical ? 200 : 640)}px;margin-top:100px;align-items:flex-start">${rs}</div>
    ${l.llave ? `<div class="nota roja"${ctx.P(kLlave)}${ctx.A('llave-et')} style="margin-top:120px;--tn:76px;font-weight:600">${marcar(l.llave)}</div>` : ''}</div>`;
}

// CIFRA — números y ecuaciones grandes. Una línea por paso.
export function cifra(l, ctx) {
  const lineas = l.lineas || (l.valor ? [l.valor] : []);
  const unica = lineas.length === 1 && !l.tam;
  const tc = l.tam || (unica ? '140px' : '84px');
  const peso = unica ? 800 : 500;
  const html = lineas.map((x, i) => `<div class="cifra"${ctx.P(i)}${ctx.A('l' + i)} style="--tc:${tc};font-weight:${peso};${i ? 'margin-top:34px' : ''}">${marcar(x)}</div>`).join('');
  const k = Math.max(0, lineas.length - 1);
  return `<div class="pila">
    ${l.arriba ? `<div class="nota" ${ctx.P(0)} style="margin-bottom:40px">${marcar(l.arriba)}</div>` : ''}
    ${html}
    ${l.abajo ? `<div class="etiqueta-chica"${ctx.P(0)}>${marcar(l.abajo)}</div>` : ''}
    ${l.texto ? texto(ctx, l.texto, 'medio mt-l', l.texto_paso ?? k) : ''}
    ${nota(ctx, l.nota, (l.nota_paso ?? k + 1), 'mt-m')}</div>`;
}

// CITA — frase manuscrita con flecha roja curva desde un ícono (la «nota al margen» del profesor).
export function cita(l, ctx) {
  ctx.con({ de: 'icono', a: 'cita', estilo: 'curva-roja', p: 0 });
  return `<div class="pila">
    <div${ctx.P(0)}${ctx.A('icono')}>${ctx.emoji(l.emoji || '📝', l.emoji_tam, 'medio')}</div>
    <div class="nota"${ctx.P(0)}${ctx.A('cita')} style="--tn:80px;color:var(--tinta);margin-top:130px;margin-left:80px;max-width:1500px">${marcar(l.texto)}</div>
    ${nota(ctx, l.nota, 1, 'mt-m')}</div>`;
}

// OBJETO — foto real recortada (sin fondo) o emoji gigante como protagonista.
export function objeto(l, ctx) {
  const vis = l.imagen
    ? `<img src="${ctx.img(l.imagen)}" style="height:${l.alto || 520}px;width:auto;display:block;filter:drop-shadow(0 26px 30px rgba(0,0,0,.14))" alt="">`
    : ctx.emoji(l.emoji || '📦', l.emoji_tam || 'heroe');
  return `<div class="pila"><div${ctx.P(0)}${ctx.A('objeto')}>${vis}</div>
    ${texto(ctx, l.texto, tamTexto(l.texto, l.tam_texto) + ' mt-m', 0)}
    ${nota(ctx, l.nota, 1, 'mt-s')}</div>`;
}

// TARJETAS — criterios o métricas en tarjetas gris suave con emoji. Una por paso.
export function tarjetas(l, ctx) {
  const items = l.items || [];
  const cols = l.columnas || (items.length <= 4 ? items.length : 3);
  const tw = items.length <= 3 ? 520 : 480;
  const html = items.map((it, i) => `<div class="tarjeta ${['v', 'r', 'n'].includes(it.tono) ? 'tono-b' + it.tono : ''}"${ctx.P(i)}>${it.emoji ? ctx.emoji(it.emoji, 104) : ''}<div>${marcar(it.texto)}</div></div>`).join('');
  return `<div class="pila">${l.encabezado ? `<div class="encabezado" style="color:var(--tinta-suave);font-size:54px"${ctx.P(0)}>${marcar(l.encabezado)}</div>` : ''}
    <div class="tarjetas" style="--cols:${cols};--tw:${tw}px;--th:${items.length <= 3 ? 320 : 280}px">${html}</div>
    ${nota(ctx, l.nota, items.length, 'mt-l')}</div>`;
}

// OSCURA — revelación de producto u oferta: fondo negro con brillo violeta. Rompe el blanco a propósito.
export function oscura(l, ctx) {
  const logo = l.imagen ? `<img src="${ctx.img(l.imagen)}" style="height:${l.alto || 150}px;width:auto" alt="">` : (l.emoji ? ctx.emoji(l.emoji, 150) : '');
  return `<div class="pila">${logo ? `<div${ctx.P(0)}>${logo}</div>` : ''}
    ${l.titulo ? `<div class="titulo-marca"${ctx.P(0)} style="${logo ? 'margin-top:30px' : ''}">${marcar(l.titulo)}</div>` : ''}
    ${texto(ctx, l.texto, 'chico mt-m', l.texto_paso ?? 0)}
    ${nota(ctx, l.nota, 1, 'mt-s')}</div>`;
}

// CUADRANTES — bloques de color a sangre (rojo = lo que NO necesitas, verde = lo que sí). Uno por paso.
export function cuadrantes(l, ctx) {
  const items = l.items || [];
  const cols = l.columnas || (items.length <= 2 ? items.length : 2);
  const html = items.map((it, i) => `<div class="cuadro ${['r', 'v', 'n', 'g', 'a', 'b'].includes(it.tono) ? it.tono : 'g'}"${ctx.P(l.revelar === 'todo' ? 0 : i)}>
      ${it.emoji ? `<div>${ctx.emoji(it.emoji, it.emoji_tam || 130)}</div>` : ''}<div>${marcar(it.texto || '')}</div></div>`).join('');
  return `<div class="cuadrantes" style="--cols:${cols}">${html}</div>`;
}
