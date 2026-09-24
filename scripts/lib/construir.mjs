// construir.mjs — deck.json → index.html autocontenido (fuentes, emojis e imágenes copiados a la salida).
import fs from 'node:fs';
import path from 'node:path';
import { Emojis, DEFS_GLOBALES } from './emoji.mjs';
import { crearCtx, escapar, CURSOR_MANO, CURSOR_PUNO, CURSOR_FLECHA } from './comun.mjs';
import { marcar } from './markup.mjs';
import * as T from './layouts-texto.mjs';
import * as D from './layouts-datos.mjs';
import { validarDeck, sanearDeck, resolverComo } from './contrato.mjs';
import { sustituirDatos } from './datos.mjs';
import { duracionPaso } from './tiempos.mjs';
import { describirPasos } from './pasos-mapa.mjs';

export const LAYOUTS = {
  idea: T.idea, lista: T.lista, flujo: T.flujo, pasos: T.pasos, bifurcacion: T.bifurcacion, cifra: T.cifra,
  cita: T.cita, objeto: T.objeto, tarjetas: T.tarjetas, oscura: T.oscura, cuadrantes: T.cuadrantes,
  tabla: D.tabla, grafica: D.grafica, 'linea-tiempo': D.lineaTiempo, medidor: D.medidor, opciones: D.opciones,
  rejilla: D.rejilla, prueba: D.prueba, chat: D.chat, reparto: D.reparto, calendario: D.calendario,
  boton: D.boton, circulos: D.circulos, stack: D.stack, calificacion: D.calificacion,
  camara: () => '', foco: T.foco,
};

export const FORMATOS = {
  '16:9': { W: 1920, H: 1080, mv: 100, mh: 150, at: 1560 },
  // 9:16: 320 arriba y abajo = la barra de Reels arriba y el caption y los botones abajo no tapan nada
  '9:16': { W: 1080, H: 1920, mv: 320, mh: 90, at: 900 },
  '1:1': { W: 1080, H: 1080, mv: 90, mh: 90, at: 920 },
  '4:5': { W: 1080, H: 1350, mv: 110, mh: 90, at: 920 },
};

// Grano para el sello de goma (agujeritos de tinta). La fila alfa decide cuánto se perfora:
//   GRANO       −2.4·R + 1.75  (tinta muy gastada; se conserva como variable --grano)
//   GRANO_SUAVE −1.2·R + 1.35  (la del sello: tinta de goma limpia con desgaste leve, como en 6:45)
const grano = fila => `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${fila}'/></filter><rect width='100%' height='100%' filter='url(%23f)'/></svg>`,
).replace(/%2523/g, '%23')}")`;
const GRANO = grano('-2.4 0 0 0 1.75');
const GRANO_SUAVE = grano('-1.2 0 0 0 1.35');

function copiarFuentes(dirSkill, dirSalida) {
  const src = path.join(dirSkill, 'assets', 'fonts'), dst = path.join(dirSalida, 'fonts');
  fs.mkdirSync(dst, { recursive: true });
  const faltan = [];
  for (const f of ['Figtree.ttf', 'Figtree-Italic.ttf', 'Caveat.ttf', 'ZillaSlab-Bold.ttf']) {
    const a = path.join(src, f);
    if (fs.existsSync(a)) fs.copyFileSync(a, path.join(dst, f)); else faltan.push(f);
  }
  return faltan;
}

// Firma: abajo a la derecha en horizontal; en 9:16 va ARRIBA por omisión (abajo la tapan el caption y
// los botones de Reels). marca.posicion ('arriba' | 'abajo') lo fuerza.
function firma(marca, ctx, vertical) {
  if (!marca || marca === false) return '';
  const pos = marca.posicion || (vertical ? 'arriba' : 'abajo');
  const cls = `firma${pos === 'arriba' ? ' arriba' : ''}`;
  if (marca.logo) { const src = ctx.img(marca.logo); if (src) return `<div class="${cls}"><img src="${src}" alt=""></div>`; }
  if (!marca.texto) return '';
  return `<div class="${cls}">${escapar(marca.texto)}${marca.sufijo ? `<small>${escapar(marca.sufijo)}</small>` : ''}</div>`;
}

// Una lámina: HTML interior + pasos + conexiones + extras (sello, clic).
function armarLamina(l, i, deck, comun) {
  const ctx = crearCtx({ ...comun, uid: i, revelarTodo: l.revelar === 'todo' });
  const fn = LAYOUTS[l.tipo];
  let interior = fn(l, ctx);
  let pasos = ctx.max + 1;
  let extras = '';
  // Anotaciones a mano con flecha sobre CUALQUIER diseño [15:00, 28:35, 2:40, 11:20, 36:45]: una nota en Caveat junto al
  // ancla `a` (del lado `lado`) con su gancho rojo, o, sin texto, con `entra`, una flecha larga que entra desde el borde
  // del lienzo hasta el ancla [15:00]. runtime.js la coloca (colocarAnotaciones) antes de dibujar la capa a mano. Las del
  // calendario con `dia` siguen siendo del calendario.
  const anots = (Array.isArray(l.anotaciones) ? l.anotaciones : []).filter(a => a && typeof a === 'object' && typeof a.a === 'string' && a.a && !(l.tipo === 'calendario' && a.dia != null));
  if (anots.length) {
    const k0 = ctx.paso(pasos);
    anots.forEach((a, i) => {
      const k = Number.isInteger(a.paso) ? ctx.paso(a.paso) : k0;
      const tono = ['r', 'v', 'n'].includes(a.tono) ? a.tono : 'r';
      if (typeof a.texto === 'string' && a.texto.trim()) {
        const pos = [a.x != null ? `left:${typeof a.x === 'number' ? a.x + 'px' : a.x}` : '', a.y != null ? `top:${typeof a.y === 'number' ? a.y + 'px' : a.y}` : ''].filter(Boolean).join(';');
        extras += `<div class="nota anotacion tono-${tono}" data-p="${k}" data-a="anota${i}" data-sobre="${escapar(a.a)}" data-lado="${['izquierda', 'derecha', 'arriba', 'abajo'].includes(a.lado) ? a.lado : ''}"${pos ? ` data-fija="1" style="${pos}${a.tam ? `;--tn:${a.tam}` : ''}"` : a.tam ? ` style="--tn:${a.tam}"` : ''}>${marcar(a.texto)}</div>`;
        ctx.con({ de: 'anota' + i, a: a.a, estilo: 'curva-roja', tono, anot: true, p: k });
      } else if (a.entra) ctx.con({ a: a.a, estilo: 'entrada', lado: a.entra, tono, anot: true, p: k });
      pasos = Math.max(pasos, k + 1);
    });
  }
  if (l.sello) {
    const k = ctx.paso(l.sello_paso ?? pasos);
    // posición: centrado en un ancla (sello_sobre), en una zona del lienzo (sello_pos) o al centro; el
    // runtime lo acota para que, girado, no se salga del lienzo y lo reduce si es muy largo
    // En la rejilla el sello cae centrado SOBRE las cajas, como en la referencia [6:35 «A LOT OF SKILL»].
    // Ese ancla automático lleva data-auto: si la rejilla tiene celdas destacadas (ya no son intercambiables),
    // runtime.js busca la banda entre renglones que menos destacadas tapa, o lo saca a una franja libre.
    const auto = !l.sello_sobre && l.tipo === 'rejilla' && !l.sello_pos;
    const sobre = l.sello_sobre || (auto ? 'rejilla' : '');
    const pos = `${sobre ? ` data-sobre="${escapar(sobre)}"` : ''}${auto ? ' data-auto="1"' : ''}${l.sello_pos ? ` data-pos="${escapar(l.sello_pos)}"` : ''}`;
    // La etiqueta blanca opaca va por fuera y la tinta (con el grano) por dentro: base.css
    extras += `<div class="sello" data-p="${k}"${pos}><div class="sello-tinta">${escapar(l.sello)}</div></div>`;
    pasos = Math.max(pasos, k + 1);
  }
  const clic = ctx.clic || (typeof l.clic === 'string' ? { a: l.clic, p: l.clic_paso ?? pasos, tipo: l.cursor || 'mano' } : null);
  if (clic && Array.isArray(l.clic_pos)) clic.pos = l.clic_pos;
  if (clic) {
    const tipo = (clic.tipo || l.cursor) === 'flecha' ? 'flecha' : 'mano';
    clic.p = ctx.paso(clic.p);
    const dibujo = tipo === 'flecha' ? CURSOR_FLECHA : clic.fin ? `<span class="c-dedo">${CURSOR_MANO}</span><span class="c-puno">${CURSOR_PUNO}</span>` : CURSOR_MANO;
    extras += `<div class="cursor" data-p="${clic.p}" data-tipo="${tipo}">${dibujo}</div><div class="onda" data-p="${clic.p}"></div>`;
    pasos = Math.max(pasos, clic.p + 1);
  }
  const oscura = l.tipo === 'oscura' || l.oscura;
  // qué entra en cada paso (pasos.json → revela, render.mjs --pasos, el error de voz de QA)
  const revela = l.tipo === 'camara' ? [['a cámara']] : describirPasos(interior + extras, pasos, ctx.conexiones);
  return {
    interior, pasos, extras, oscura, revela, conexiones: ctx.conexiones, avisos: ctx.avisos, arriba: anclaArriba(l),
    clic: clic ? JSON.stringify({ a: clic.a, p: clic.p, ...(clic.pos ? { pos: clic.pos } : {}), ...(clic.fin ? { fin: clic.fin } : {}) }) : '',
  };
}

// Listas y tarjetas que se revelan de a uno arrancan ARRIBA y crecen hacia abajo: el hueco de abajo le
// anuncia al ojo que viene más [ref_95 «Without:», 3:25, 9:25]. Una lista que entra entera se queda
// centrada [15:35]. `anclar: "arriba" | "centro"` lo fuerza en cualquier diseño.
function anclaArriba(l) {
  if (l.anclar === 'centro') return false;
  if (l.anclar === 'arriba') return true;
  if (!['lista', 'tarjetas'].includes(l.tipo) || l.revelar === 'todo') return false;
  // la lista de descartes va centrada: sus pasos ocultos ya reservan el hueco, así que el primer renglón aparece desde
  // el inicio en su lugar final (~28%), como en 4:05
  if (l.tipo === 'lista' && T.listaCentrada(l)) return false;
  return Array.isArray(l.items) && l.items.length >= 2;
}

// El fondo atenuado de «foco» es el ESTADO FINAL de la lámina anterior [15:20]: sin pasos (se ve completo), los
// tachones y los atenuados en el paso 0 (siguen tachados y atenuados: una lista de errores tachada no puede leerse
// como recomendación) y lo que se fue antes del final (`data-hasta`: la mano de una calificación) sigue fuera.
export const sinPasos = html => html
  .replace(/ data-p="\d+"/g, '')
  .replace(/ data-(tachar-p|atenuar)="\d+"/g, ' data-$1="0"')
  .replace(/ data-hasta="\d+"/g, ' data-hasta="-1"');

const jsonSeguro = x => JSON.stringify(x).replace(/</g, '\\u003c');

// Guion del orador: la voz y la duración planeada de cada paso. No se dibuja (PNG, video y montaje no
// cambian); lo leen el presentador (tecla N) y la vista de ensayo (?modo=orador).
function guion(l, pasos) {
  const n = l.tipo === 'camara' ? 1 : pasos;
  const vozDe = k => (Array.isArray(l.voz) ? l.voz[k] : k === 0 ? l.voz : '') || (l.tipo === 'camara' && k === 0 ? l.nota || '' : '');
  const voz = Array.from({ length: n }, (_, k) => String(vozDe(k) || ''));
  const dur = Array.from({ length: n }, (_, k) => +duracionPaso(l, k).toFixed(2));
  return `<script type="application/json" class="guion">${jsonSeguro({ voz, dur })}</script>`;
}

// Tramo en vivo (`camara` con `vivo: true`): la actividad, la demostración o las preguntas de una clase. En el
// presentador el público ve la consigna en blanco, con su emoji y una cuenta regresiva desde `dur`; los PNG, la
// hoja y el montaje no cambian (siguen como tramo a cámara). Todo texto pasa por marcar().
const MAX_ITEMS_VIVO = 5;
export function duracionVivo(l) {
  const d = Array.isArray(l.dur) ? l.dur.reduce((a, b) => a + (Number(b) || 0), 0) : Number(l.dur) || 0;
  return Math.max(0, Math.round(d));
}
function bloqueVivo(l, em) {
  const consigna = typeof l.texto === 'string' && l.texto.trim() ? l.texto : typeof l.nota === 'string' ? l.nota : '';
  const preguntas = /pregunt|dudas/i.test(`${consigna} ${l.id || ''}`);
  const emoji = typeof l.emoji === 'string' && l.emoji.trim() ? l.emoji : preguntas ? '🙋' : '⏱️';
  const items = (Array.isArray(l.items) ? l.items : []).map(x => (typeof x === 'string' ? x : x && typeof x === 'object' && typeof x.texto === 'string' ? x.texto : ''))
    .filter(x => x.trim()).slice(0, MAX_ITEMS_VIVO);
  const lista = items.length ? `<ol class="vivo-items">${items.map(t => `<li>${marcar(t)}</li>`).join('')}</ol>` : '';
  return `<div class="vivo-pres">${em.html(emoji, 190)}<div class="vivo-consigna">${marcar(consigna)}</div>${lista}<div class="vivo-reloj">${reloj(duracionVivo(l))}</div></div>`;
}
const reloj = s => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;

export function construirHTML({ deck: original, dirDeck, dirSalida, dirSkill }) {
  // `como`: las láminas que reusan un objeto (mapa, calendario, tabla) heredan sus campos antes de validar
  const { deck: crudo, errores: erroresComo, avisos: avisosComo } = resolverComo(original);
  const errores = [...erroresComo, ...validarDeck(crudo, Object.keys(LAYOUTS))];
  if (errores.length) { const e = new Error('deck.json con errores:\n  · ' + errores.join('\n  · ')); e.errores = errores; throw e; }
  // {{CLAVE}} → valor de «datos» (o «[CLAVE]», que QA cuenta como pendiente). Luego, listas cerradas.
  const { deck: conDatos, faltan, propuestos, declarados } = sustituirDatos(crudo);
  const { deck, avisos: avisosSaneo, sugerencias: sugSaneo } = sanearDeck(conDatos);
  const sugerencias = [...avisosComo, ...sugSaneo];
  fs.mkdirSync(dirSalida, { recursive: true });
  const formato = FORMATOS[deck.formato || '16:9'] ? deck.formato || '16:9' : '16:9';
  const F = FORMATOS[formato];
  const em = new Emojis({ modo: deck.emoji || 'auto', dirSalida, piel: deck.piel });
  const faltanFuentes = copiarFuentes(dirSkill, dirSalida);
  const comun = { em, dirDeck, dirSalida, formato, F };
  const ctxMarca = crearCtx(comun);
  const marca = em.enTexto(deck.marca === false ? '' : firma(deck.marca || {}, ctxMarca, F.W < F.H));
  const avisos = [...avisosSaneo, ...ctxMarca.avisos];
  if (faltanFuentes.length) avisos.push(`Faltan tipografías (${faltanFuentes.join(', ')}): corre scripts/setup.sh`);

  const armadas = [];
  const secciones = deck.laminas.map((l, i) => {
    let a;
    try { a = armarLamina(l, i, deck, comun); }
    catch (e) { throw new Error(`lámina ${i + 1} (${l.id || l.tipo}): ${e.message}`, { cause: e }); }
    armadas.push(a);
    avisos.push(...a.avisos.map(x => `lámina ${i + 1}: ${x}`));
    let cuerpo = `<div class="lienzo lz-${escapar(l.tipo)}${a.arriba ? ' arriba' : ''}">${a.interior}</div>`;
    let pasos = a.pasos;
    if (l.tipo === 'foco') {
      const prev = armadas[i - 1];
      const op = Number.isFinite(l.opacidad) ? l.opacidad : 0.2;
      // data-op-fija: el autor puso la opacidad; runtime.js no la baja aunque la frase no encuentre hueco
      const fondo = prev ? `<div class="escena clon"${Number.isFinite(l.opacidad) ? ' data-op-fija="1"' : ''} style="position:absolute;inset:0;opacity:${op}"><div class="lienzo${prev.arriba ? ' arriba' : ''}">${sinPasos(prev.interior)}</div><svg class="capa-mano"></svg><script type="application/json" class="con">${jsonSeguro(prev.conexiones.map(c => ({ ...c, p: 0 })))}</script></div>` : '';
      // El sello y las anotaciones de la lámina anterior (sus `extras`) NO se arman aquí: runtime.js (copiarExtrasAlClon)
      // los copia ya colocados, en su lugar final, y el clon dibuja también las flechas de las notas (anot).
      // La frase se acomoda en el hueco entre los renglones del fondo más cercano al centro (runtime.js, acomodarFoco);
      // con `anclar` se respeta tal cual (arriba o al centro)
      cuerpo = `${fondo}<div class="lienzo foco-frase${a.arriba ? ' arriba' : ''}"${l.anclar ? ' data-anclar="1"' : ''} style="z-index:3">${a.interior}</div>`;
    }
    const tipo = escapar(l.tipo);
    const claseFondo = a.oscura && ['azul', 'negro'].includes(l.fondo) ? ` fondo-${l.fondo}` : '';
    const vivo = l.tipo === 'camara' && l.vivo === true;
    return `<section class="lamina escena${a.oscura ? ' oscura' + claseFondo : ''}" data-i="${i}" data-tipo="${tipo}" data-id="${escapar(l.id || tipo)}" data-pasos="${pasos}"${a.clic ? ` data-clic='${escapar(a.clic)}'` : ''}${vivo ? ` data-vivo="1" data-dur="${duracionVivo(l)}"` : ''}>
  ${em.enTexto(cuerpo)}
  <svg class="capa-mano"></svg>${em.enTexto(a.extras)}
  ${l.tipo === 'camara' ? `<div class="lienzo"><div class="nota" style="color:#999">🎥 ${escapar(l.nota || l.texto || 'A cámara')}</div></div>` : ''}
  ${vivo ? em.enTexto(bloqueVivo(l, em)) : ''}
  ${marca && l.firma !== false && l.tipo !== 'camara' ? marca : ''}
  <script type="application/json" class="con">${jsonSeguro(a.conexiones)}</script>
  ${guion(l, pasos)}
</section>`;
  });

  const css = fs.readFileSync(path.join(dirSkill, 'templates', 'base.css'), 'utf8');
  // runtime.js lleva adentro la colocación del sello (runtime-sello.js), en el mismo ámbito
  const runtime = fs.readFileSync(path.join(dirSkill, 'templates', 'runtime.js'), 'utf8')
    .replace('/*@@SELLO@@*/', () => fs.readFileSync(path.join(dirSkill, 'templates', 'runtime-sello.js'), 'utf8'));
  const presentador = fs.readFileSync(path.join(dirSkill, 'templates', 'presentador.js'), 'utf8');
  const vars = `:root{--W:${F.W}px;--H:${F.H}px;--margen-v:${F.mv}px;--margen-h:${F.mh}px;--ancho-texto:${F.at}px;--grano:${GRANO};--grano-suave:${GRANO_SUAVE}}`;
  if (em.faltantes.size) avisos.push(`Emojis sin imagen Fluent (se usará la fuente del sistema): ${[...em.faltantes].join(' ')}`);
  em.malformados.forEach((motivo, spec) => avisos.push(`emoji «${spec}»: ${motivo}`));
  em.aproximados.forEach((usado, pedido) => sugerencias.push(`Emoji Fluent aproximado: ${pedido} → ${usado} (Fluent no tiene el original)`));
  const html = `<!doctype html>
<html lang="${escapar(deck.idioma || 'es')}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapar(deck.titulo || 'Láminas')}</title>
<style>${vars}\n${css}</style></head>
<body class="${F.W < F.H ? 'f-vertical' : 'f-horizontal'}" data-anim="${deck.animacion === 'suave' ? 'suave' : 'seco'}" data-emoji="${em.modo}" data-w="${F.W}" data-h="${F.H}">
${DEFS_GLOBALES}
${secciones.join('\n')}
<script>${runtime}</script>
<script>${presentador}</script>
</body></html>`;
  return { html, avisos, sugerencias, formato, W: F.W, H: F.H, modoEmoji: em.modo, deck, crudoResuelto: crudo, pasos: armadas.map(a => a.pasos), revela: armadas.map(a => a.revela), faltan, propuestos, declarados };
}
