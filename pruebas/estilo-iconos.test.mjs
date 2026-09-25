// Estilo e íconos (ronda 2 del loop): letra secundaria legible, emojis sin texto impreso (📅 🎟️ 📲), calendario
// pastel, tarjetas con aire, flujo y mapa de columnas iguales, guiones que no se cortan, descartes centrados, foco
// protagonista, stack a sangre, calificación con estrellas, chat con hora y la ✅ de si: del tamaño de la ❌.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararSalida, abrir, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { inyectable } from '../scripts/lib/medidas-dom.mjs';
import { Emojis, TEXTO_IMPRESO, esGlifoDibujado } from '../scripts/lib/emoji.mjs';
import { marcar, plano } from '../scripts/lib/markup.mjs';
import { sanearDeck, validarDeck } from '../scripts/lib/contrato.mjs';
import { LAYOUTS } from '../scripts/lib/construir.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pz-ei-'));
async function conDeck(deck, fn) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  const { browser, page } = await abrir(p.htmlPath, p.W, p.H);
  await page.addScriptTag({ content: inyectable() });
  try { return await fn(page, p); } finally { await browser.close(); }
}
function qa(deck) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const r = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts', 'qa.mjs'), dir, '--salida', path.join(dir, 's'), '--json'], { encoding: 'utf8' });
  return JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
}
const base = (laminas, extra = {}) => ({ emoji: 'apple', marca: false, ...extra, laminas });

test('emoji: en apple 📅 📆 🗓️ son un calendario SVG sin fecha y 🎟️ 🎫 un boleto liso; en fluent salen nativos 3D; 📲 es SVG en los dos', () => {
  const em = new Emojis({ modo: 'apple', dirSalida: tmp() });
  const cal = em.html('📅');
  assert.ok(cal.includes('<svg') && !cal.includes('<img') && !cal.includes('📅'));
  // el mismo dibujo: solo cambia data-e (el spec, para el mapa de pasos)
  const sinE = h => h.replace(/ data-e="[^"]*"/, '');
  assert.equal(sinE(em.html('📆')), sinE(cal));
  assert.equal(sinE(em.html('🗓️')), sinE(cal));
  assert.ok(em.html('🎟️').includes('url(#pz-boleto)') && em.html('🎫').includes('url(#pz-boleto)'));
  assert.ok(!/JUL|ADMIT/.test(cal + em.html('🎟️')));
  const fl = new Emojis({ modo: 'fluent', dirSalida: tmp() });
  // En Fluent el calendario y el boleto son 3D, sin texto y distintos entre sí: nada de clip-art plano [r3]
  assert.match(fl.glifo('📅'), /^<img[^>]*src="emoji\/1f4c5\.webp"/);
  assert.match(fl.glifo('📆'), /1f4c6\.webp/);
  assert.match(fl.glifo('🗓️'), /1f5d3/);
  // r5: el 🎟 de Fluent es rosa (se funde con el tachado rojo): se dibuja el boleto ámbar en los dos sets; el 🎫 de
  // Fluent ya es amarillo y sale nativo
  assert.ok(fl.glifo('🎟️').includes('url(#pz-boleto)'));
  assert.match(fl.glifo('🎫'), /^<img/);
  for (const modo of ['apple', 'fluent']) {
    const e = new Emojis({ modo, dirSalida: tmp() });
    for (const ch of ['📲', '📱', '📄', '💬']) assert.ok(e.glifo(ch).startsWith('<svg'), `${modo} ${ch}`);
    const tel = e.html('📲️');
    assert.ok(tel.includes('url(#pz-pantalla)') && !tel.includes('<img'), '📲');
  }
  assert.ok(esGlifoDibujado('🗓️') && esGlifoDibujado('📲') && esGlifoDibujado('🏪'));
  assert.ok(esGlifoDibujado('🗓️', 'apple') && !esGlifoDibujado('🗓️', 'fluent') && esGlifoDibujado('📲', 'fluent'));
  // en apple el texto conserva sus emojis, salvo los que imprimen una fecha o texto en inglés
  const ap = new Emojis({ modo: 'apple', dirSalida: tmp() });
  assert.ok(ap.enTexto('Hoy 📅').includes('<svg'));
  assert.ok(ap.enTexto('Tu lugar 🎟️').includes('url(#pz-boleto)'));
  assert.equal(ap.enTexto('Listo ✅ 💰'), 'Listo ✅ 💰');
  assert.ok(!TEXTO_IMPRESO.apple['🏪'] && !TEXTO_IMPRESO.fluent['🏪']);
});

test('marcar: la palabra compuesta no se corta en el guion (word joiner) y plano() sale limpio', () => {
  const h = marcar('“**Just-Click-The-Buttons**” {v:verde} [MI-DATO]');
  assert.ok(h.includes('Just⁠-⁠Click⁠-⁠The⁠-⁠Buttons'), h);
  assert.ok(h.includes('class="tono-v"'), 'las clases no se tocan');
  assert.ok(h.includes('[MI-DATO]'), 'el dato pendiente queda igual (QA lo cuenta)');
  assert.equal(plano('**Just-Click-The-Buttons**'), 'Just-Click-The-Buttons');
});

test('contrato: stack acepta color, alto, sub y sangre; avisa textos largos y encabezado a sangre; chat con sello suelto', () => {
  const r = sanearDeck({ laminas: [
    { tipo: 'stack', encabezado: 'Incluye', items: [{ texto: 'Un agente que contesta tus mensajes', color: 'morado', alto: 2, sub: 'Por 6 meses' }, { texto: 'Clases', color: 'lila' }] },
    { tipo: 'chat', sello: 'Tarde', mensajes: [{ texto: 'hola', hora: '11:40 pm' }, { texto: 'x', hora: { a: 1 } }] },
    { tipo: 'calendario', color: 'morado' },
  ] });
  const [st, ch] = r.deck.laminas;
  assert.deepEqual([st.items[0].color, st.items[0].alto, st.items[1].color], ['morado', 2, undefined]);
  assert.equal(ch.mensajes[0].hora, '11:40 pm');
  assert.equal(ch.mensajes[1].hora, undefined);
  assert.equal(r.deck.laminas[2].color, undefined, 'el calendario no acepta los colores del stack');
  assert.ok(r.sugerencias.some(s => /no dibuja «encabezado»/.test(s)));
  assert.ok(r.sugerencias.some(s => /6 palabras: es una tarjeta de producto/.test(s)));
  assert.ok(r.sugerencias.some(s => /sello del chat queda suelto/.test(s)));
  assert.deepEqual(validarDeck({ laminas: [{ tipo: 'calificacion', filas: [{ texto: 'A', estrellas: 3 }] }] }, Object.keys(LAYOUTS)), []);
});

test('render: calendario pastel, flujo y mapa de columnas iguales, tarjetas con aire, ✅ del tamaño de la ❌, foco grande', { timeout: 180_000 }, async () => {
  await conDeck(base([
    { tipo: 'calendario', fase_activa: 2, n: 14, fases: [{ nombre: 'Fase 1', desde: 1, hasta: 3, color: 'amarillo' }, { nombre: 'Fase 2', sub: 'Valor', desde: 4, hasta: 9, color: 'azul' }] },
    { tipo: 'flujo', nodos: [{ emoji: '📝', etiqueta: 'Aplica', sub: '2 minutos' }, { emoji: '📞', etiqueta: 'Llamada', sub: '30 minutos' }, { emoji: '✅', etiqueta: 'Decide', sub: 'o te decimos que no' }] },
    { tipo: 'pasos', iconos: ['🔍', '🛠️', '🚀'], etiquetas: ['Find', 'Build', 'Launch'] },
    { tipo: 'tarjetas', items: [{ emoji: '📣', texto: 'Anuncios, al final' }, { emoji: '🧲', texto: 'Qué trabajo hace' }, { emoji: '🤝', texto: 'Un aliado con audiencia' }, { emoji: '💬', texto: 'Quien ya te compró' }] },
    { tipo: 'lista', items: [{ emoji: 'si:🎯', texto: 'Con meta' }, { emoji: 'no:⏰', texto: 'Sin prisa' }] },
    { tipo: 'idea', texto: 'Antes' },
    { tipo: 'foco', texto: 'Sigues cobrando mientras el creador siga promoviendo el producto.' },
  ]), async page => {
    const r = await page.evaluate(() => {
      const L = window.PZ.lams;
      L.forEach(l => window.PZ.mostrar(l, +l.dataset.pasos - 1, Infinity));
      const cx = e => { const b = e.getBoundingClientRect(); return b.left + b.width / 2; };
      const dias = [...L[0].querySelectorAll('.dia')];
      const bar = L[0].querySelector('.barra span');
      const nodos = [...L[1].querySelectorAll('[data-a^="n"]:not([data-a^="nodo"])')].map(cx);   // n0… (emoji), no nodo0… (el nodo)
      const pasos = [...L[2].querySelectorAll('[data-a^="k"]')].map(cx);
      const aire = [...L[3].querySelectorAll('.tarjeta')].map(t => {
        const rg = document.createRange(); rg.selectNodeContents(t.querySelector('.rotulo'));
        return t.getBoundingClientRect().bottom - Math.max(...[...rg.getClientRects()].map(q => q.bottom));
      });
      const ins = [...L[4].querySelectorAll('.insignia.izq')].map(e => e.getBoundingClientRect().width);
      const foco = L[6].querySelector(':scope > .lienzo .nota');
      return {
        activa: getComputedStyle(dias[4]).backgroundImage, apagada: +getComputedStyle(dias[0]).opacity, colorBarra: getComputedStyle(bar).color,
        nodos, pasos, aire, ins, focoPx: parseFloat(getComputedStyle(foco).fontSize), focoW: foco.getBoundingClientRect().width,
      };
    });
    assert.match(r.activa, /rgb\(138, 217, 248\)/, 'la celda activa es pastel, no el degradado de la barra');
    assert.equal(r.apagada, 1, 'las fases apagadas son un tinte plano, sin opacity');
    assert.equal(r.colorBarra, 'rgb(15, 95, 168)', 'la pastilla lleva el tono oscuro de la fase');
    const dif = xs => Math.abs((xs[1] - xs[0]) - (xs[2] - xs[1]));
    assert.ok(dif(r.nodos) <= 4, `flujo: centros ${r.nodos}`);
    assert.ok(dif(r.pasos) <= 4 && r.pasos[1] - r.pasos[0] >= 500, `mapa: centros ${r.pasos}`);
    assert.ok(r.aire.every(a => a >= 24), `tarjetas: aire abajo ${r.aire}`);
    assert.ok(Math.abs(r.ins[0] - r.ins[1]) / r.ins[1] < 0.15, `✅ ${r.ins[0]} contra ❌ ${r.ins[1]}`);
    assert.equal(r.focoPx, 88);
    assert.ok(r.focoW > 1300, `la frase de foco ocupa ${r.focoW} px`);
  });
});

test('render: descartes centrados, stack a sangre, calificación y chat con hora', { timeout: 180_000 }, async () => {
  await conDeck(base([
    { tipo: 'lista', items: [{ emoji: '🚚', texto: 'Dropshipping', tachado: true }, { emoji: '📈', texto: 'Trading', tachado: true }] },
    { tipo: 'lista', anclar: 'arriba', encabezado: 'Sin:', vineta: 'x', items: ['uno', 'dos'] },
    { tipo: 'stack', items: [{ emoji: '🤖', texto: 'Tu agente', doble: true }, { texto: 'Clases' }, { texto: 'Mentor', color: 'negro', sub: 'Por 6 meses' }], remate: 'Hecho **contigo**' },
    { tipo: 'calificacion', emoji: '🤔', filas: [{ emoji: '🚚', texto: 'Dropshipping', estrellas: 4 }, { texto: 'Ventas' }, { emoji: '📈', texto: 'Trading', estrellas: 1 }] },
    { tipo: 'chat', sello: 'Tarde', sello_sobre: 'm1', mensajes: [{ de: 'otro', hora: '11:40 pm', texto: '¿Cuánto cuesta?' }, { de: 'yo', hora: '9:05 am', texto: '¡Buen día!' }] },
  ]), async (page, p) => {
    const r = await page.evaluate(() => {
      const L = window.PZ.lams;
      const lz = l => l.querySelector(':scope > .lienzo');
      const st = L[2].querySelector('.stack.sangre').getBoundingClientRect();
      const piezas = [...L[2].querySelectorAll('.bento-lleno')].map(e => e.className);
      const encendidas = paso => { window.PZ.mostrar(L[3], paso, Infinity); return [...L[3].querySelectorAll('.estrellas.llenas')].filter(e => getComputedStyle(e).visibility !== 'hidden').map(e => e.querySelectorAll('path[fill="#f7b500"]').length); };
      const manos = paso => { window.PZ.mostrar(L[3], paso, Infinity); return [...L[3].querySelectorAll('.cal-cursor')].filter(e => getComputedStyle(e).visibility !== 'hidden').length; };
      const horas = [...L[4].querySelectorAll('.chat-hora')].map(h => h.dataset.p);
      const burbujas = [...L[4].querySelectorAll('.burbuja')].map(b => [b.dataset.a, b.closest('[data-p]').dataset.p]);
      return {
        centrada: L[0].querySelector('.lista').classList.contains('centrada'), arriba0: lz(L[0]).classList.contains('arriba'),
        centrada1: L[1].querySelector('.lista').classList.contains('centrada'), arriba1: lz(L[1]).classList.contains('arriba'),
        st: [st.width, st.height], piezas, p1: encendidas(1), p2: encendidas(2), m1: manos(1), m2: manos(2), horas, burbujas,
      };
    });
    assert.deepEqual([r.centrada, r.arriba0, r.centrada1, r.arriba1], [true, false, false, true]);
    assert.ok(r.st[0] > 1860 && r.st[1] > 1020, `el stack llena la lámina: ${r.st}`);
    assert.deepEqual(r.piezas.map(c => c.split(' ')[1]), ['c-morado', 'c-marino', 'c-negro'], 'color por turno y el pedido');
    assert.equal(p.pasos[2], 5, 'vacío + 3 piezas + remate');
    assert.equal(p.pasos[3], 3, 'tarjeta pálida + 2 filas calificadas');
    assert.deepEqual([r.p1, r.p2], [[4], [1]], 'sin acumular solo se ve encendida la fila activa [4:50]');
    assert.deepEqual([r.m1, r.m2], [1, 1]);
    assert.deepEqual(r.horas, ['0', '1']);
    assert.deepEqual(r.burbujas, [['m0', '0'], ['m1', '1']]);
  });
});

test('QA: letra secundaria bajo 48 px avisa; emoji con texto impreso avisa; mapa de 5 con nombres no se encima', { timeout: 180_000 }, () => {
  // un post largo se encoge con el encaje: su letra real baja de 48 (en el celular no se lee)
  const texto = Array.from({ length: 9 }, (_, i) => `Renglón ${i + 1} de un post que cuenta la historia completa, con detalle.`);
  const r = qa(base([
    { tipo: 'prueba', capturas: [{ post: { texto }, ejemplo: true }] },
    { tipo: 'idea', emoji: '🏪', texto: 'Tu negocio local' },
    { tipo: 'pasos', iconos: ['🎯', '🧲', '📅', '🎟️', '⏰'], etiquetas: ['Promesa', 'Registros', 'Calendario', 'Apartado', 'Recordatorios'] },
  ]));
  assert.ok(r.avisos.some(e => /lámina 1 .*texto secundario\) se ve a \d+px/.test(e)), r.avisos.join('\n'));
  assert.ok(!r.avisos.some(e => /lámina 2 .*emoji con texto impreso/.test(e)), r.avisos.join('\n'));
  assert.ok(!r.errores.some(e => /lámina 3 /.test(e)), r.errores.join('\n'));
});

// Ronda 3: cada figura de cada glifo SVG (con la mitad de su trazo) cabe en el viewBox. La cola de la flecha del 📲
// arrancaba en x=0.9 con trazo de 4.2 y punta redonda: el viewBox la cortaba en seco.
test('glifos SVG: ninguna figura (ni su trazo) se sale del viewBox; los de objeto llevan volumen', { timeout: 60_000 }, async () => {
  const { TODOS_GLIFOS_SVG, DEFS_GLOBALES } = await import('../scripts/lib/emoji.mjs');
  const { lanzarChromium } = await import('../scripts/lib/pipeline.mjs');
  const b = await lanzarChromium();
  try {
    const pg = await b.newPage();
    const S = 240;
    await pg.setContent(`<html><body style="margin:0">${DEFS_GLOBALES}${Object.entries(TODOS_GLIFOS_SVG).map(([k, s]) => `<div data-k="${k}" style="width:${S}px;height:${S}px;margin:40px">${s}</div>`).join('')}</body></html>`);
    const fuera = await pg.evaluate(S => {
      const out = [];
      document.querySelectorAll('[data-k]').forEach(d => {
        const svg = d.querySelector('svg'), R = svg.getBoundingClientRect(), k = S / 24;
        svg.querySelectorAll('path, rect, circle').forEach(e => {
          const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
          const sw = cs.stroke && cs.stroke !== 'none' ? (parseFloat(e.getAttribute('stroke-width')) || 1) * k / 2 : 0;
          const x0 = r.left - sw - R.left, y0 = r.top - sw - R.top, x1 = r.right + sw - R.left, y1 = r.bottom + sw - R.top;
          if (x0 < -0.5 || y0 < -0.5 || x1 > S + 0.5 || y1 > S + 0.5) out.push(`${d.dataset.k} <${e.tagName}> ${[x0, y0, x1, y1].map(v => (v / k).toFixed(2)).join(',')}`);
        });
      });
      return out;
    }, S);
    assert.deepEqual(fuera, []);
  } finally { await b.close(); }
  for (const ch of ['📅', '🎟', '📄', '📱', '📲', '💬']) {
    const s = TODOS_GLIFOS_SVG[ch];
    assert.ok(/class="vol"/.test(s) && /fill="url\(#pz-/.test(s), `${ch} con clase vol y degradado`);
    const contornos = [...s.matchAll(/stroke="#[0-9a-f]{3,6}" stroke-width="([\d.]+)"/g)].filter(m => !/stroke="#fff"/.test(m[0]));
    assert.ok(contornos.every(m => +m[1] <= 1.3), `${ch}: sin contorno grueso de clip-art`);
  }
  // 👤 👥 conservan las siluetas grises de la referencia (sin volumen brillante) y ✅ ❌ son insignias planas
  for (const ch of ['👤', '👥', '✅', '❌']) assert.ok(!/class="vol"/.test(TODOS_GLIFOS_SVG[ch]), ch);
});
