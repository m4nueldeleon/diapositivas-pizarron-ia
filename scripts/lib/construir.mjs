// construir.mjs — deck.json → index.html autocontenido (fuentes, emojis e imágenes copiados a la salida).
import fs from 'node:fs';
import path from 'node:path';
import { Emojis, DEFS_GLOBALES } from './emoji.mjs';
import { crearCtx, escapar, marcar, CURSOR_MANO, CURSOR_FLECHA } from './comun.mjs';
import * as T from './layouts-texto.mjs';
import * as D from './layouts-datos.mjs';
import { validarDeck, sanearDeck } from './contrato.mjs';

export const LAYOUTS = {
  idea: T.idea, lista: T.lista, flujo: T.flujo, pasos: T.pasos, bifurcacion: T.bifurcacion, cifra: T.cifra,
  cita: T.cita, objeto: T.objeto, tarjetas: T.tarjetas, oscura: T.oscura, cuadrantes: T.cuadrantes,
  tabla: D.tabla, grafica: D.grafica, 'linea-tiempo': D.lineaTiempo, medidor: D.medidor, opciones: D.opciones,
  rejilla: D.rejilla, prueba: D.prueba, chat: D.chat, reparto: D.reparto, calendario: D.calendario,
  boton: D.boton, circulos: D.circulos,
  camara: () => '', foco: () => '',
};

export const FORMATOS = {
  '16:9': { W: 1920, H: 1080, mv: 100, mh: 150, at: 1560 },
  '9:16': { W: 1080, H: 1920, mv: 220, mh: 90, at: 900 },
  '1:1': { W: 1080, H: 1080, mv: 90, mh: 90, at: 920 },
  '4:5': { W: 1080, H: 1350, mv: 110, mh: 90, at: 920 },
};

// Grano para el sello de goma (agujeritos de tinta)
const GRANO = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -2.4 0 0 0 1.75'/></filter><rect width='100%' height='100%' filter='url(%23f)'/></svg>",
).replace(/%2523/g, '%23')}")`;

function copiarFuentes(dirSkill, dirSalida) {
  const src = path.join(dirSkill, 'assets', 'fonts'), dst = path.join(dirSalida, 'fonts');
  fs.mkdirSync(dst, { recursive: true });
  const faltan = [];
  for (const f of ['Figtree.ttf', 'Caveat.ttf', 'ZillaSlab-Bold.ttf']) {
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
  if (l.sello) {
    const k = ctx.paso(l.sello_paso ?? pasos);
    // posición: centrado en un ancla (sello_sobre), en una zona del lienzo (sello_pos) o al centro; el
    // runtime lo acota para que, girado, no se salga del lienzo y lo reduce si es muy largo
    // En la rejilla el sello cae centrado SOBRE las cajas, como en la referencia [6:35 «A LOT OF SKILL»]
    const sobre = l.sello_sobre || (l.tipo === 'rejilla' && !l.sello_pos ? 'rejilla' : '');
    const pos = `${sobre ? ` data-sobre="${escapar(sobre)}"` : ''}${l.sello_pos ? ` data-pos="${escapar(l.sello_pos)}"` : ''}`;
    extras += `<div class="sello" data-p="${k}"${pos}>${escapar(l.sello)}</div>`;
    pasos = Math.max(pasos, k + 1);
  }
  const clic = ctx.clic || (typeof l.clic === 'string' ? { a: l.clic, p: l.clic_paso ?? pasos, tipo: l.cursor || 'mano' } : null);
  if (clic && Array.isArray(l.clic_pos)) clic.pos = l.clic_pos;
  if (clic) {
    const tipo = (clic.tipo || l.cursor) === 'flecha' ? 'flecha' : 'mano';
    clic.p = ctx.paso(clic.p);
    extras += `<div class="cursor" data-p="${clic.p}" data-tipo="${tipo}">${tipo === 'flecha' ? CURSOR_FLECHA : CURSOR_MANO}</div><div class="onda" data-p="${clic.p}"></div>`;
    pasos = Math.max(pasos, clic.p + 1);
  }
  const oscura = l.tipo === 'oscura' || l.oscura;
  return {
    interior, pasos, extras, oscura, conexiones: ctx.conexiones, avisos: ctx.avisos,
    clic: clic ? JSON.stringify({ a: clic.a, p: clic.p, ...(clic.pos ? { pos: clic.pos } : {}) }) : '',
  };
}

// Quita los pasos de una escena clonada (el fondo atenuado de «foco» se ve completo)
const sinPasos = html => html.replace(/ data-p="\d+"/g, '');

const jsonSeguro = x => JSON.stringify(x).replace(/</g, '\\u003c');

export function construirHTML({ deck: crudo, dirDeck, dirSalida, dirSkill }) {
  const errores = validarDeck(crudo, Object.keys(LAYOUTS));
  if (errores.length) { const e = new Error('deck.json con errores:\n  · ' + errores.join('\n  · ')); e.errores = errores; throw e; }
  const { deck, avisos: avisosSaneo, sugerencias } = sanearDeck(crudo);
  fs.mkdirSync(dirSalida, { recursive: true });
  const formato = FORMATOS[deck.formato || '16:9'] ? deck.formato || '16:9' : '16:9';
  const F = FORMATOS[formato];
  const em = new Emojis({ modo: deck.emoji || 'auto', dirSalida });
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
    let cuerpo = `<div class="lienzo lz-${escapar(l.tipo)}">${a.interior}</div>`;
    let pasos = a.pasos;
    if (l.tipo === 'foco') {
      const prev = armadas[i - 1];
      const op = Number.isFinite(l.opacidad) ? l.opacidad : 0.2;
      const fondo = prev ? `<div class="escena clon" style="position:absolute;inset:0;opacity:${op}"><div class="lienzo">${sinPasos(prev.interior)}</div><svg class="capa-mano"></svg><script type="application/json" class="con">${jsonSeguro(prev.conexiones.map(c => ({ ...c, p: 0 })))}</script></div>` : '';
      cuerpo = `${fondo}<div class="lienzo" style="z-index:3"><div class="nota" data-p="0" style="--tn:${l.tam || '60px'};color:var(--tinta);font-weight:600;max-width:1300px">${marcar(l.texto || l.nota || '')}</div></div>`;
    }
    const tipo = escapar(l.tipo);
    return `<section class="lamina escena${a.oscura ? ' oscura' : ''}" data-i="${i}" data-tipo="${tipo}" data-id="${escapar(l.id || tipo)}" data-pasos="${pasos}"${a.clic ? ` data-clic='${escapar(a.clic)}'` : ''}>
  ${em.enTexto(cuerpo)}
  <svg class="capa-mano"></svg>${em.enTexto(a.extras)}
  ${l.tipo === 'camara' ? `<div class="lienzo"><div class="nota" style="color:#999">🎥 ${escapar(l.nota || 'A cámara')}</div></div>` : ''}
  ${marca && l.firma !== false && l.tipo !== 'camara' ? marca : ''}
  <script type="application/json" class="con">${jsonSeguro(a.conexiones)}</script>
</section>`;
  });

  const css = fs.readFileSync(path.join(dirSkill, 'templates', 'base.css'), 'utf8');
  const runtime = fs.readFileSync(path.join(dirSkill, 'templates', 'runtime.js'), 'utf8');
  const vars = `:root{--W:${F.W}px;--H:${F.H}px;--margen-v:${F.mv}px;--margen-h:${F.mh}px;--ancho-texto:${F.at}px;--grano:${GRANO}}`;
  if (em.faltantes.size) avisos.push(`Emojis sin imagen Fluent (se usará la fuente del sistema): ${[...em.faltantes].join(' ')}`);
  em.malformados.forEach((motivo, spec) => avisos.push(`emoji «${spec}»: ${motivo}`));
  em.aproximados.forEach((usado, pedido) => sugerencias.push(`Emoji Fluent aproximado: ${pedido} → ${usado} (Fluent no tiene el original)`));
  const html = `<!doctype html>
<html lang="${escapar(deck.idioma || 'es')}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapar(deck.titulo || 'Láminas')}</title>
<style>${vars}\n${css}</style></head>
<body class="${F.W < F.H ? 'f-vertical' : 'f-horizontal'}" data-anim="${deck.animacion === 'suave' ? 'suave' : 'seco'}" data-w="${F.W}" data-h="${F.H}">
${DEFS_GLOBALES}
${secciones.join('\n')}
<script>${runtime}</script>
</body></html>`;
  return { html, avisos, sugerencias, formato, W: F.W, H: F.H, modoEmoji: em.modo, deck, pasos: armadas.map(a => a.pasos) };
}
