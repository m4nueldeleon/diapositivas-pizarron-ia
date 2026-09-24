// Ronda 5 del loop (estilo e íconos): negritas que se distinguen, firma de ~260 px que cabe en la tabla, el mapa que
// vuelve sin saltar, dato pendiente ≠ variable de plantilla, flechas que convergen en UNA punta (y la tabla aislada
// [7:30]), remate del stack como título [42:50], flecha recta corta de punta grande [c_1045], ✕ con halo y boleto ámbar,
// `no:` que niega un paso del mapa, pilares en la oscura [37:40 → 39:45], llamada [36:45], reloj [2:00], cantidad y
// meses [15:15-17:05]. Se renderiza en Chromium y se mide el DOM; las reglas puras se prueban directo.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararSalida, abrir, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { marcar } from '../scripts/lib/markup.mjs';
import { chat } from '../scripts/lib/layouts-datos.mjs';
import { filasCantidad } from '../scripts/lib/layouts-texto.mjs';
import { crearCtx } from '../scripts/lib/comun.mjs';
import { Emojis, TODOS_GLIFOS_SVG, ALIAS_VINETA } from '../scripts/lib/emoji.mjs';
import { medidaFirma } from '../scripts/lib/construir.mjs';
import { validarDeck, resolverComo, sanearDeck } from '../scripts/lib/contrato.mjs';
import { LAYOUTS } from '../scripts/lib/construir.mjs';
import { reglasIconos, inventarioIconos } from '../scripts/lib/reglas-deck.mjs';
import { conceptoDe } from '../scripts/lib/emoji-diccionario.mjs';
import { inyectable } from '../scripts/lib/medidas-dom.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pz-ei5-'));
async function conDeck(deck, fn, dir = tmp()) {
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  const { browser, page } = await abrir(p.htmlPath, p.W, p.H);
  await page.addScriptTag({ content: inyectable() });
  try { return await fn(page, p); } finally { await browser.close(); }
}
function qa(deck, dir = tmp()) {
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const r = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts', 'qa.mjs'), dir, '--salida', path.join(dir, 's'), '--json'], { encoding: 'utf8' });
  return JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
}
const tipos = Object.keys(LAYOUTS);

// ---------- reglas puras ----------
test('marcar: [MAYÚSCULAS] es hueco pendiente (dentro de su tono); el chat pinta [minúsculas] como variable de plantilla; {s:} es sufijo', () => {
  assert.equal(marcar('{g:[PRECIO_ANCLA]}'), '<span class="tono-g"><span class="hueco pendiente">[PRECIO_ANCLA]</span></span>');
  const ctx = crearCtx({ em: new Emojis({ modo: 'apple', dirSalida: tmp() }) });
  const h = chat({ mensajes: [{ de: 'yo', texto: 'Hola [nombre] cuesta [PRECIO]' }] }, ctx);
  assert.ok(h.includes('class="var-plantilla">[nombre]') && h.includes('class="hueco pendiente">[PRECIO]'), h);
  assert.ok(!/hueco[^"]*">\[nombre\]/.test(h));
  assert.equal(marcar('$50k{s:/año}'), '$50k<span class="sufijo">/año</span>');
});

test('cantidad: filas equilibradas (5 → 3+2, 6 → 3+3, 10 → 5+5, 20 → 5×4)', () => {
  assert.deepEqual([5, 6, 10, 20, 3].map(filasCantidad), [[3, 2], [3, 3], [5, 5], [5, 5, 5, 5], [3]]);
});

test('firma: medida a ~260 px en 1920; el «.com» va aparte', () => {
  const m = medidaFirma({ texto: 'Consulting.com' });
  assert.deepEqual([m.t, m.suf], ['Consulting', '.com']);
  assert.ok(m.ancho >= 220 && m.ancho <= 280, JSON.stringify(m));
  assert.equal(medidaFirma({ logo: 'x.png', texto: 'a' }), null);
});

test('iconos: no:X que niega un paso del mapa (después del mapa o en una objeción) avisa; antes del mapa no; el inventario separa no:X', () => {
  const mapa = { tipo: 'pasos', id: 'mapa', iconos: ['🧮', '🪜', '📲'], etiquetas: ['Calcula', 'Sube', 'Avisa'] };
  const obj = { tipo: 'idea', encabezado: 'Objeción #2', encabezado_pos: 'entre', emoji: 'no:🧮', texto: '**«¿Por qué subiste?»**' };
  let r = reglasIconos({ emoji: 'apple', laminas: [mapa, obj] });
  assert.ok(r.avisos.some(a => /lámina 2 .*no:🧮 niega el paso 1 \(«Calcula»\)/.test(a)), r.avisos.join('\n'));
  assert.deepEqual(reglasIconos({ emoji: 'apple', laminas: [mapa, { ...obj, emoji: '🤔' }] }).avisos, []);
  assert.deepEqual(reglasIconos({ emoji: 'apple', laminas: [mapa, { ...obj, emoji: 'no:💰' }] }).avisos, []);
  // antes del mapa, el ícono negado es el dolor que el paso resuelve
  assert.deepEqual(reglasIconos({ emoji: 'apple', laminas: [{ tipo: 'idea', emoji: 'no:📲', texto: 'Nadie te avisa' }, mapa] }).avisos, []);
  // un emoji rojo negado: la ✕ se funde
  r = reglasIconos({ emoji: 'apple', laminas: [{ tipo: 'idea', emoji: 'no:🎯', texto: 'Sin foco' }] });
  assert.ok(r.avisos.some(a => /🎯 es rojo/.test(a)), r.avisos.join('\n'));
  const inv = Object.keys(inventarioIconos({ laminas: [mapa, obj] }));
  assert.ok(inv.some(k => k.startsWith('no:🧮 (')) && inv.some(k => k.startsWith('🧮 (')), inv.join(' | '));
});

test('diccionario: las viñetas del motor (✅ ❌), la ✅ de hechos y los 🙋 ⏱️ por omisión tienen concepto', () => {
  for (const e of [...Object.values(ALIAS_VINETA), '✅', '⏱️', '🙋', '⭐']) assert.ok(conceptoDe(e), e);
});

test('glifos SVG: la ✕ lleva halo blanco debajo del rojo; ningún glifo de objeto está en el rojo de la tinta (el boleto es ámbar)', () => {
  const eq = TODOS_GLIFOS_SVG['❌'];
  assert.ok(eq.indexOf('stroke="#fff"') >= 0 && eq.indexOf('stroke="#fff"') < eq.indexOf('stroke="#d3121f"'));
  const rojo = JSON.parse(fs.readFileSync(path.join(DIR_SKILL, 'scripts', 'lib', 'contraste-emojis.json'), 'utf8')).rojo.svg;
  for (const k of Object.keys(TODOS_GLIFOS_SVG)) {
    if (['❌', '✖'].includes(k)) continue;   // insignias: rojas a propósito
    assert.ok((rojo[k] ?? 0) < 30, `${k}: ${rojo[k]}% en el rojo de la tinta`);
  }
  const fl = new Emojis({ modo: 'fluent', dirSalida: tmp() });
  assert.ok(fl.glifo('🎟️').includes('url(#pz-boleto)'), 'el 🎟 rosa de Fluent se dibuja ámbar');
});

test('contrato: llamada, meses, reloj y pilares que vuelven con «como»', () => {
  assert.deepEqual(validarDeck({ laminas: [{ tipo: 'llamada', otros: 'Tu mentor' }, { tipo: 'meses', celdas: ['Marzo'] }, { tipo: 'objeto', reloj: '10:00' }] }, tipos), []);
  const e = validarDeck({ laminas: [{ tipo: 'llamada' }, { tipo: 'objeto', reloj: '10 min' }, { tipo: 'llamada', otros: ['a', 'b', 'c', 'd'] }] }, tipos);
  assert.ok(e.some(x => /lámina 1 \[llamada\]: falta otros o yo/.test(x)) && e.some(x => /reloj/.test(x)) && e.some(x => /3 como máximo/.test(x)), e.join('\n'));
  const s = sanearDeck({ laminas: [{ tipo: 'llamada', otros: [{ rotulo: 'X', activo: true, rotulo_pos: 'arriba' }] }] });
  assert.deepEqual(s.deck.laminas[0].otros[0], { rotulo: 'X', activo: true, rotulo_pos: 'arriba' });
  assert.deepEqual(s.avisos, []);
  assert.deepEqual(sanearDeck({ laminas: [{ tipo: 'llamada', otros: 'Tu mentor' }] }).deck.laminas[0].otros, [{ rotulo: 'Tu mentor' }]);
  const { deck } = resolverComo({ laminas: [{ tipo: 'lista', id: 'p', oscura: true, items: [{ emoji: '⚙️', texto: 'A' }, { emoji: '🤝', texto: 'B' }] }, { tipo: 'lista', como: 'p', activo: 2 }] });
  assert.equal(deck.laminas[1].items.length, 2);
  // el mapa que vuelve: cada miembro sabe el texto más largo del grupo y si alguno lleva ✅
  const g = resolverComo({ laminas: [{ tipo: 'pasos', id: 'm', iconos: ['🔍', '🛠️'], texto: 'Corto' }, { tipo: 'pasos', como: 'm', texto: 'Un texto bastante más largo', hechos: [1] }] }).deck.laminas;
  assert.ok(g.every(l => l._grupo_texto === 'Un texto bastante más largo' && l._grupo_hechos === true));
});

// ---------- render ----------
test('render r5: negritas, titulo-marca, huecos, remate, flecha recta, mapa sin salto, pilares, llamada, reloj, cantidad y meses', { timeout: 240_000 }, async () => {
  const deck = { emoji: 'apple', marca: false, laminas: [
    { tipo: 'idea', emoji: '💡', texto: 'Antes' },
    { tipo: 'foco', texto: 'Si se van **menos de 5**, ganas más que hoy.' },
    { tipo: 'cifra', lineas: ['30 × $1,000 = **$30,000**'] },
    { tipo: 'cifra', lineas: ['$30,000'] },
    { tipo: 'lista', alinear: 'centro', revelar: 'todo', items: ['Bajar el precio es **caro**'] },
    { tipo: 'oscura', titulo: 'Diplomado en Comunidades de Pago' },
    { tipo: 'chat', revelar: 'todo', mensajes: [{ de: 'yo', texto: 'Hola [nombre]: cuesta [PRECIO]' }] },
    { tipo: 'idea', texto: 'Ancla: {g:[PRECIO_ANCLA]}' },
    { tipo: 'stack', items: [{ emoji: '🤖', texto: 'Tu agente' }, { emoji: '📚', texto: 'Clases' }], remate: 'Hecho **contigo**' },
    { tipo: 'flujo', nodos: [{ emoji: '🔍', etiqueta: 'Identifica' }, { emoji: '🤝', etiqueta: 'Asóciate' }] },
    { tipo: 'pasos', id: 'mapa', iconos: ['🧮', '🪜', '📲'], etiquetas: ['Calcula', 'Sube', 'Avisa'], activo: 1 },
    { tipo: 'pasos', como: 'mapa', activo: 2, hechos: [1], nota: 'ya casi' },
    { tipo: 'pasos', como: 'mapa', activo: 3, hechos: [1, 2] },
    { tipo: 'pasos', iconos: ['🔍', '🛠️', '🚀'], etiquetas: ['Find', 'Build', 'Launch'] },
    { tipo: 'lista', id: 'pil', oscura: true, fondo: 'azul', encabezado: 'UpLevel', items: [{ emoji: '⚙️', texto: 'Software' }, { emoji: '🤝', texto: 'Servicio' }, { emoji: '🧭', texto: 'Estrategia' }] },
    { tipo: 'lista', como: 'pil', oscura: true, fondo: 'azul', activo: 2 },
    { tipo: 'llamada', yo: 'Tú', otros: [{ rotulo: 'Tu mentor' }], texto: 'Programa **hecho contigo**', nota: '1 a 1' },
    { tipo: 'objeto', reloj: '33:00', texto: 'En los **próximos 33 minutos.**' },
    { tipo: 'flujo', nodos: [{ emoji: '💰', cantidad: 5, etiqueta: '**$50k**{s:/año}' }, { emoji: '💰', cantidad: 10, etiqueta: '**$100k**{s:/año}' }] },
    { tipo: 'meses', celdas: [{ mes: 'Marzo', emoji: '🤝', n: 2, valor: '$5,000' }, { mes: 'Abril', emoji: '🤝', valor: '$15,000' }], valores_paso: 1 },
  ] };
  await conDeck(deck, async page => {
    const r = await page.evaluate(() => {
      const L = window.PZ.lams, peso = e => parseFloat(getComputedStyle(e).fontWeight);
      const cj = (e, lam) => { const a = e.getBoundingClientRect(), b = lam.getBoundingClientRect(); return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height }; };
      const out = {};
      const fb = L[1].querySelector('.lienzo.foco-frase .nota');
      out.foco = [peso(fb), peso(fb.querySelector('b'))];
      out.cifra = [peso(L[2].querySelector('.cifra')), peso(L[2].querySelector('.cifra b')), peso(L[3].querySelector('.cifra'))];
      out.lista = [peso(L[4].querySelector('.item')), peso(L[4].querySelector('.item b'))];
      out.planas = [1, 2, 4].map(i => window.negritasPlanas(L[i]).length);
      out.marca = window.lineasPalabras(L[5].querySelector('.titulo-marca')).map(l => l.length);
      const vp = L[6].querySelector('.var-plantilla'), hp = L[6].querySelector('.hueco.pendiente');
      out.varP = [getComputedStyle(vp).backgroundColor, getComputedStyle(vp).color];
      out.pend = [getComputedStyle(hp).backgroundColor !== 'rgb(249, 217, 50)', getComputedStyle(hp).outlineStyle];
      const anc = L[7].querySelector('.hueco.pendiente');
      out.ancla = [getComputedStyle(anc).color, getComputedStyle(anc).fontWeight];
      window.PZ.mostrar(L[8], 3, Infinity);
      const rem = L[8].querySelector('.t-remate');
      out.remate = { pal: rem.querySelector('.palomita').getBoundingClientRect().height, peso: peso(rem.querySelector('span')), b: peso(rem.querySelector('b')), img: rem.querySelectorAll('.emo, img').length };
      // flecha recta
      const f = L[9], fl = f.querySelector('path[data-clase="flecha"]'), pu = f.querySelector('path[data-clase="punta"]');
      const a0 = cj(f.querySelector('[data-a="n0"] .emo'), f), a1 = cj(f.querySelector('[data-a="n1"] .emo'), f);
      const p0 = fl.getPointAtLength(0), p1 = fl.getPointAtLength(fl.getTotalLength()), F = f.getBoundingClientRect();
      const pb = pu.getBBox();
      out.flecha = { largo: Math.hypot(p1.x - p0.x, p1.y - p0.y), punta: pb.height, aireA: p0.x - (a0.x + a0.w), aireB: a1.x - p1.x };
      // mapa: los íconos a la misma altura en la madre y en los regresos (con y sin ✅ y nota)
      out.mapa = [10, 11, 12].map(i => Math.round(cj(L[i].querySelector('[data-a="k0"]'), L[i]).y));
      const suelto = [...L[13].querySelectorAll('[data-a^="k"]')].map(e => cj(e, L[13]));
      out.suelto = Math.round(Math.min(...suelto.map(b => b.y)));
      // pilares: el regreso apaga los ítems 1 y 3
      out.pil = [...L[15].querySelectorAll('.lista .item')].map(e => getComputedStyle(e).opacity);
      out.pilLienzo = L[14].querySelector(':scope > .lienzo').classList.contains('arriba');
      // llamada
      out.llamada = { tarjetas: L[16].querySelectorAll('.llamada-tarjeta').length, activa: getComputedStyle(L[16].querySelector('.llamada-tarjeta.activa')).outlineColor };
      out.reloj = L[17].querySelectorAll('svg.reloj-7seg polygon.on').length;
      out.pila = [...L[18].querySelectorAll('.pila-cantidad')].map(p => [...p.children].map(f => f.querySelectorAll('.emo').length));
      window.PZ.mostrar(L[19], 0, Infinity);
      const vis = e => getComputedStyle(e).visibility !== 'hidden';
      out.meses0 = [vis(L[19].querySelector('.mes-emojis')), vis(L[19].querySelector('.mes-valor'))];
      window.PZ.mostrar(L[19], 1, Infinity);
      out.meses1 = [vis(L[19].querySelector('.mes-emojis')), vis(L[19].querySelector('.mes-valor'))];
      return out;
    });
    assert.deepEqual(r.foco, [400, 700], 'foco: la frase a 400 y la negrita a 700');
    assert.deepEqual(r.cifra, [500, 800, 800], 'cifra de una línea con ** baja la base a 500; sin ** sigue en 800');
    assert.deepEqual(r.lista, [600, 800]);
    assert.deepEqual(r.planas, [0, 0, 0], 'ninguna negrita plana');
    assert.ok(r.marca.at(-1) >= 3 || r.marca.length === 1, `titulo-marca balanceado: ${r.marca}`);
    assert.deepEqual(r.varP, ['rgba(0, 0, 0, 0)', 'rgb(255, 225, 77)']);
    assert.deepEqual(r.pend, [true, 'dashed']);
    assert.deepEqual(r.ancla, ['rgb(138, 138, 138)', '400'], 'el dato pendiente conserva el gris y el peso de su tono');
    assert.ok(r.remate.pal >= 100 && r.remate.peso === 800 && r.remate.b === 800 && r.remate.img === 0, JSON.stringify(r.remate));
    assert.ok(r.flecha.largo >= 140 && r.flecha.largo <= 262, JSON.stringify(r.flecha));
    assert.ok(r.flecha.punta / r.flecha.largo >= 0.2, JSON.stringify(r.flecha));
    assert.ok(r.flecha.aireA >= 24 && r.flecha.aireB >= 24, JSON.stringify(r.flecha));
    assert.equal(new Set(r.mapa).size, 1, `los íconos del mapa se mueven: ${r.mapa}`);
    assert.ok(r.suelto >= 300 && r.suelto <= 420, `un pasos suelto sin ✅ queda centrado (íconos en y=${r.suelto})`);
    assert.deepEqual(r.pil, ['0.25', '1', '0.25']);
    assert.equal(r.pilLienzo, false, 'los pilares van centrados');
    assert.equal(r.llamada.tarjetas, 2); assert.equal(r.llamada.activa, 'rgb(124, 196, 245)');
    assert.ok(r.reloj >= 12, `segmentos encendidos de «33:00»: ${r.reloj}`);
    assert.deepEqual(r.pila, [[3, 2], [5, 5]]);
    assert.deepEqual(r.meses0, [true, false]); assert.deepEqual(r.meses1, [false, true]);
  });
});

test('tabla-marcador r5: firma dentro de la columna vacía; converger en una punta; aislada con 2 columnas; 9:16 con la pregunta debajo', { timeout: 240_000 }, async () => {
  const comp = { id: 'comparar', tipo: 'tabla', revelar: 'celdas', columnas: ['Curso grabado', 'Comunidad de pago'],
    filas: [{ etiqueta: 'Cobras', celdas: ['Una vez', 'Cada mes'] }, { etiqueta: 'Si te atoras', celdas: ['Nadie lo nota', 'Alguien te busca'] }, { etiqueta: 'Se acaba', celdas: ['En el último video', 'Cuando dejas de avanzar'] }],
    converger: { columna: 1, texto: '¿Por qué se quedan?' } };
  const aisl = { tipo: 'tabla', como: 'comparar', revelar: 'todo', converger: { columna: 1, texto: '¿Por qué se quedan?', emoji: '🤔' } };
  const marcador = { tipo: 'tabla', esquina: 'Métrica', vacias: 1, revelar: 'todo', columnas: ['High-Ticket Sales', 'Dropshipping', 'Affiliate', 'Trading'],
    filas: ['Ganancia', 'Capital', 'Velocidad', 'Habilidad', 'Entrega', 'Escala'].map(e => ({ etiqueta: e, celdas: ['$1,000', '$20', '$50', 'High'] })) };
  const medir = page => page.evaluate(() => window.PZ.lams.map(lam => {
    const L = lam.getBoundingClientRect(), cj = e => { const a = e.getBoundingClientRect(); return { x: a.left - L.left, y: a.top - L.top, w: a.width, h: a.height }; };
    const firma = lam.querySelector(':scope > .firma');
    const lineasV = [...lam.querySelectorAll('.tabla tr:first-child th + th')].map(th => cj(th).x);
    const tx = lam.querySelector('.conv-texto');
    const fins = [...lam.querySelectorAll('path[data-estilo="converge"]')].map(p => { const q = p.getPointAtLength(p.getTotalLength()); return [q.x, q.y]; });
    return { firma: firma && cj(firma), lineasV, cols: lam.querySelectorAll('.tabla tr:first-child th').length,
      puntas: lam.querySelectorAll('path[data-clase="punta"]').length, fins, tn: tx ? parseFloat(getComputedStyle(tx).fontSize) : 0,
      pregunta: tx && cj(tx), tabla: lam.querySelector('.tabla') && cj(lam.querySelector('.tabla')), W: lam.offsetWidth };
  }));
  await conDeck({ emoji: 'apple', marca: { texto: 'Consulting.com' }, laminas: [marcador, comp, aisl] }, async page => {
    const [m, c, a] = await medir(page);
    assert.ok(m.firma.w <= 280, `firma de ${m.firma.w} px`);
    assert.ok(m.lineasV.every(x => x < m.firma.x - 4 || x > m.firma.x + m.firma.w + 4), `una línea cruza la firma: ${m.lineasV} / ${JSON.stringify(m.firma)}`);
    assert.equal(c.cols, 3, 'la lámina que revela conserva todas las columnas');
    assert.equal(c.puntas, 1, 'una sola punta');
    assert.ok(c.fins.every(([x, y]) => Math.hypot(x - c.fins[0][0], y - c.fins[0][1]) <= 6), JSON.stringify(c.fins));
    assert.ok(c.tn >= 68, `pregunta a ${c.tn} px`);
    assert.ok(c.fins[0][0] <= c.pregunta.x && c.pregunta.x - c.fins[0][0] <= 30, `la punta queda a ${c.pregunta.x - c.fins[0][0]} px del texto`);
    assert.equal(a.cols, 2, 'aislada: etiquetas + la columna juzgada');
    assert.ok(a.tn >= 64, `pregunta aislada a ${a.tn}`);
  });
  await conDeck({ emoji: 'apple', formato: '9:16', marca: false, laminas: [comp] }, async page => {
    const [c] = await medir(page);
    assert.ok(c.pregunta.y > c.tabla.y + c.tabla.h, 'la pregunta va debajo de la tabla');
    assert.ok(c.pregunta.x + c.pregunta.w <= c.W - 140, 'fuera de la franja de Reels');
    assert.ok(c.tn >= 80, `pregunta a ${c.tn}`);
    assert.equal(c.puntas, 1);
  });
});

test('QA r5: firma de logo sobre la tabla es error; pilares en la oscura no avisan; negrita plana avisa', { timeout: 240_000 }, () => {
  const dir = tmp();
  // un logo ancho (8:1) como firma: sin medida estimada, la tabla no le deja sitio y la firma cruza una línea
  fs.writeFileSync(path.join(dir, 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="100"><rect width="800" height="100" fill="#35c"/></svg>');
  const tabla = { tipo: 'tabla', revelar: 'todo', columnas: ['A', 'B', 'C', 'D'], filas: ['a', 'b', 'c', 'd', 'e', 'f'].map(e => ({ etiqueta: e, celdas: ['1', '2', '3', '4'] })) };
  let r = qa({ emoji: 'apple', pieza: 'libre', marca: { logo: 'logo.svg' }, laminas: [tabla] }, dir);
  assert.ok(r.errores.some(e => /firma cruza una línea de la tabla|toca la firma/.test(e)), r.errores.join('\n'));
  r = qa({ emoji: 'apple', pieza: 'libre', marca: false, laminas: [
    { tipo: 'oscura', titulo: 'UpLevel' },
    { tipo: 'lista', oscura: true, items: [{ emoji: '⚙️', texto: 'Software' }, { emoji: '🤝', texto: 'Servicio' }] },
    { tipo: 'cifra', oscura: true, lineas: ['Desde {o:$25,000}'] },
    { tipo: 'idea', texto: '**Todo** en **negrita** pesada', tam_texto: 'enorme' },
  ] });
  assert.ok(!r.avisos.some(e => /«oscura» en un\(a\) (lista|cifra)/.test(e)), r.avisos.join('\n'));
  assert.ok(r.avisos.some(e => /lámina 4 .*no se distingue del resto de su frase/.test(e)), r.avisos.join('\n'));
});
