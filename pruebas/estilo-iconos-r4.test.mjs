// Estilo e íconos, ronda 4 del loop: siluetas claras sobre las piezas de color, multitud «tú» [14:55, 15:05], personas
// dispersas y «unos pocos» dentro del círculo [10:45], cifra (sello y cuentas), botón sin segunda mano [23:15], llave de
// la bifurcación [c_0635], tabla-marcador con plumón grueso [c_0545], tarjetas y emoji_lado calibrados [9:25, 10:15],
// ecuaciones y huecos que no se parten y opciones que se atenúan en el clic.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararSalida, abrir, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { inyectable } from '../scripts/lib/medidas-dom.mjs';
import { puntuarGlifo } from '../scripts/lib/contraste-color.mjs';
import { colorPieza } from '../scripts/lib/layouts-datos.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pz-ei4-'));
export async function conDeck(deck, fn) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  const { browser, page, avisos } = await abrir(p.htmlPath, p.W, p.H);
  await page.addScriptTag({ content: inyectable() });
  try { return await fn(page, p, avisos); } finally { await browser.close(); }
}
export function qa(deck) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const r = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts', 'qa.mjs'), dir, '--salida', path.join(dir, 's'), '--json'], { encoding: 'utf8' });
  return JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
}
// un glifo sintético de un solo color (todos los píxeles opacos)
const glifo = ([r, g, b], n = 400) => { const d = new Uint8ClampedArray(n * 4); for (let i = 0; i < d.length; i += 4) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; } return d; };

test('contraste sobre color: la silueta gris pizarra sobre morado o naranja ya no cuenta como visible; la clara sí', () => {
  const morado = [139, 92, 246], naranja = [232, 89, 12], marino = [44, 68, 134], negro = [58, 58, 58];
  // la mitad y el pie del degradado pz-sil (#768ca7, #5c7390): ΔE ≥ 40 pero < 1.5:1 de luz → no se distinguen
  for (const f of [morado, naranja]) for (const c of [[0x76, 0x8c, 0xa7], [0x5c, 0x73, 0x90]]) assert.equal(puntuarGlifo(glifo(c), f), 0, `${c} sobre ${f}`);
  for (const f of [morado, naranja, marino, negro]) assert.ok(puntuarGlifo(glifo([255, 255, 255]), f) >= 25);
  // un emoji de color saturado sobre otro color distinto y con luz distinta sigue contando
  assert.equal(puntuarGlifo(glifo([255, 214, 10]), morado), 100);
});

test('stack: 👥 y 👤 ya no saltan la pieza; sobre la pieza de color se pintan claras (pz-sil-claro) con sombra', async () => {
  assert.equal(colorPieza('👥', 1, 'morado'), 'marino');
  await conDeck({ emoji: 'apple', marca: false, laminas: [{ tipo: 'stack', items: [{ emoji: '🤖', texto: 'Agente' }, { emoji: '👥', texto: 'Grupo', color: 'morado' }, { emoji: '👤', texto: 'Mentor', color: 'naranja' }] }] }, async page => {
    const r = await page.evaluate(() => [...document.querySelectorAll('.bento-lleno .emo svg [fill="url(#pz-sil)"]')].map(e => ({ fill: getComputedStyle(e).fill, sombra: getComputedStyle(e.closest('svg')).filter })));
    assert.ok(r.length >= 2);
    for (const x of r) { assert.match(x.fill, /pz-sil-claro/); assert.match(x.sombra, /drop-shadow/); }
  });
});

import { repartirPersonas, SEPARACION_PERSONAS, MULTITUD } from '../scripts/lib/layouts-datos.mjs';
import { sanearDeck } from '../scripts/lib/contrato.mjs';
import { tamEmojiTarjeta } from '../scripts/lib/layouts-texto.mjs';
const sug = laminas => sanearDeck({ laminas }).sugerencias.join('\n');

test('círculos: dispersas (no un reloj), `adentro: 2` dentro del círculo interior y la misma semilla da lo mismo', () => {
  const r = repartirPersonas({ n: 12, R: 360, r: 130, adentro: 2 });
  assert.equal(r.dentro.length, 2);
  for (const [x, y] of r.dentro) assert.ok(Math.hypot(x - 360, y - 360) < 130);
  const todos = [...r.pos, ...r.dentro];
  for (let i = 0; i < todos.length; i++) for (let j = i + 1; j < todos.length; j++) assert.ok(Math.hypot(todos[i][0] - todos[j][0], todos[i][1] - todos[j][1]) >= SEPARACION_PERSONAS * r.tam);
  assert.deepEqual(repartirPersonas({ n: 12, R: 360, r: 130, adentro: 2 }), r);
  // no es un anillo: las distancias al centro varían
  const ds = r.pos.map(([x, y]) => Math.hypot(x - 360, y - 360));
  assert.ok(Math.max(...ds) - Math.min(...ds) > 40, `radios ${Math.min(...ds)}-${Math.max(...ds)}`);
});

test('botón: una mano dentro del botón con cursor de mano se avisa; un objeto o el cursor flecha no', () => {
  assert.match(sug([{ tipo: 'boton', boton: 'Aplica', emoji: '👆' }]), /es otra mano|una mano/);
  assert.match(sug([{ tipo: 'boton', boton: 'Aplica', emoji: '✍🏽' }]), /una mano/);
  assert.doesNotMatch(sug([{ tipo: 'boton', boton: 'Aplica', emoji: '🤖' }]), /mano/);
  assert.doesNotMatch(sug([{ tipo: 'boton', boton: 'Aplica', emoji: '👆', cursor: 'flecha' }]), /mano/);
});

test('cifra: una línea que empieza con «=» o «×» cuelga de la anterior y se avisa', () => {
  assert.match(sug([{ tipo: 'cifra', lineas: ['10 × 20% = 2', '= __2 citas__'] }]), /empieza con el operador/);
  assert.doesNotMatch(sug([{ tipo: 'cifra', lineas: ['10 × 20% = 2', '2 × $500 = __$1,000__'] }]), /operador/);
  assert.equal(tamEmojiTarjeta(3), 150); assert.equal(tamEmojiTarjeta(4), 130); assert.equal(tamEmojiTarjeta(6), 104);
});

test('render r4: multitud, opciones con clic tardío, llave alta, tabla corta, cifra en un renglón, hueco entero, tarjetas y emoji_lado', { timeout: 180_000 }, async () => {
  const deck = { emoji: 'apple', marca: false, laminas: [
    { tipo: 'rejilla', multitud: true, emoji: '👤', total: 60, etiqueta_destacado: 'Tú', emoji_etiqueta: '🧑‍💻' },
    { tipo: 'rejilla', multitud: true, emoji: '👤', total: 60, etiqueta_destacado: 'Tú', emoji_etiqueta: '🧑‍💻', destacar: [4], apagar_resto: true, destacado_paso: 1, nota_destacado: '«Sí»' },
    { tipo: 'opciones', texto: '¿Te pasa?', texto_pos: 'arriba', clic_paso: 1, cursor: 'mano', items: [{ texto: 'SÍ', tono: 'v' }, { texto: 'NO', tono: 'r' }], elegida: 0 },
    { tipo: 'bifurcacion', origen: { texto: '1 alianza' }, ramas: [{ emoji: '💸', valor: '$2,000' }, { emoji: '💰', valor: '$50,000' }], llave: 'Mismo trabajo' },
    { tipo: 'tabla', columnas: ['Renunciar ya', 'Esperar', 'Con sueldo'], revelar: 'todo', filas: [{ etiqueta: 'Ingreso', celdas: ['$0', 'Tu sueldo', 'Tu sueldo'] }, { etiqueta: 'Cuándo', celdas: ['Hoy', 'Algún día', 'Lunes'] }, { etiqueta: 'Si falla', celdas: ['Sin sueldo', 'Nunca', 'Sigues'] }] },
    { tipo: 'cifra', lineas: ['2 × 4 semanas = __8 videos al mes__'] },
    { tipo: 'chat', mensajes: [{ de: 'yo', texto: 'Hola, vi que batallas con [el problema] y tengo una idea para ti esta semana' }] },
    { tipo: 'tarjetas', items: [{ emoji: '🎞️', texto: 'Tomas' }, { emoji: '🗣️', texto: 'Voz', emoji_tam: 120 }, { emoji: '🎵', texto: 'Música' }] },
    { tipo: 'idea', emoji: '👥', emoji_lado: true, texto: 'Aprovecha la **audiencia de otros**' },
  ] };
  await conDeck(deck, async (page, p, avisos) => {
    const r = await page.evaluate(() => {
      const L = [...document.querySelectorAll('.lamina')];
      const cj = (e, lam) => { const a = e.getBoundingClientRect(), b = lam.getBoundingClientRect(); return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height }; };
      const out = {};
      // 1) multitud 14:55
      const m = L[0], celdas = [...m.querySelectorAll('.rejilla.multitud .celda')].map(e => cj(e, m));
      out.multitud = { conexiones: m.querySelectorAll('.capa-mano path').length, emoEtq: cj(m.querySelector('.multitud-prota .emo'), m).w,
        celda: celdas[0].w, ancho: Math.max(...celdas.map(c => c.x + c.w)) - Math.min(...celdas.map(c => c.x)), W: m.offsetWidth,
        fila0: celdas[0].x, fila1: celdas.find(c => c.y > celdas[0].y + 10).x, sobre: celdas.some(c => c.y < cj(m.querySelector('.multitud-prota'), m).y + cj(m.querySelector('.multitud-prota'), m).h) };
      // 2) multitud 15:05: paso 0 a color, paso 1 apagada con una oscura y la nota
      const m2 = L[1];
      window.PZ.mostrar(m2, 0, Infinity);
      const a0 = m2.querySelectorAll('.celda.apagada').length;
      window.PZ.mostrar(m2, 1, Infinity);
      out.multitud2 = { a0, a1: m2.querySelectorAll('.celda.apagada').length + 1 - m2.querySelectorAll('.celda').length, oscuras: m2.querySelectorAll('.celda.oscuro.encendido').length, nota: !!m2.querySelector('.nota-multitud') };
      // 3) opciones
      const o = L[2];
      window.PZ.mostrar(o, 0, Infinity); const o0 = o.querySelectorAll('.opcion.apagada').length;
      window.PZ.mostrar(o, 1, Infinity); const o1 = o.querySelectorAll('.opcion.apagada').length;
      out.opciones = { o0, o1, arriba: cj(o.querySelector('.t'), o).y < cj(o.querySelector('.opcion'), o).y };
      // 4) llave
      const b = L[3]; window.PZ.mostrar(b, 9, Infinity);
      const ps = [...b.querySelectorAll('.capa-mano path')].filter(e => e.getAttribute('stroke') === '#c8101e' && !e.dataset.cabeza && e.dataset.clase !== 'subrayado');
      const ys = ps.flatMap(e => { const L0 = e.getTotalLength(); return [0, 0.5, 1].map(k => e.getPointAtLength(k * L0)); });
      const r0 = cj(b.querySelector('[data-a="r0"]'), b), r1 = cj(b.querySelector('[data-a="r1"]'), b);
      const et = b.querySelector('[data-a="llave-et"]');
      out.llave = { alto: Math.max(...ys.map(q => q.y)) - Math.min(...ys.map(q => q.y)), H: b.offsetHeight, x0: Math.min(...ys.map(q => q.x)), x1: Math.max(...ys.map(q => q.x)),
        c0: r0.x + r0.w / 2, c1: r1.x + r1.w / 2, tam: parseFloat(getComputedStyle(et).fontSize), sub: !!et.querySelector('[data-sub]') };
      // 5) tabla corta
      const t = L[4], td = t.querySelector('td:not(.fila-et)');
      out.tabla = { letra: parseFloat(getComputedStyle(td).fontSize), fila: td.getBoundingClientRect().height, peso: getComputedStyle(td).fontWeight };
      // 6) cifra y 7) hueco
      out.cifra = window.lineasPalabras(L[5].querySelector('.cifra')).length;
      out.hueco = window.lineasPalabras(L[6].querySelector('.hueco')).length;
      // 8) tarjetas y 9) emoji_lado
      out.tarjetas = [...L[7].querySelectorAll('.tarjeta .emo')].map(e => e.getBoundingClientRect().width);
      out.lado = cj(L[8].querySelector('.emo'), L[8]).w / parseFloat(getComputedStyle(L[8].querySelector('.t')).fontSize);
      return out;
    });
    assert.equal(r.multitud.conexiones, 0, 'el protagonista no lleva flecha');
    assert.ok(r.multitud.emoEtq >= 110, `emoji del protagonista ${r.multitud.emoEtq}`);
    assert.ok(r.multitud.celda >= 150 && r.multitud.ancho > r.multitud.W, JSON.stringify(r.multitud));
    assert.ok(Math.abs(r.multitud.fila1 - r.multitud.fila0) > 50, 'fila impar escalonada');
    assert.ok(!r.multitud.sobre, 'la multitud arranca debajo del protagonista');
    assert.deepEqual(r.multitud2, { a0: 0, a1: 0, oscuras: 1, nota: true });   // en el paso 1 se apagan todas menos una
    assert.deepEqual(r.opciones, { o0: 0, o1: 1, arriba: true });
    assert.ok(r.llave.alto >= 0.12 * r.llave.H, `llave de ${r.llave.alto}px`);
    assert.ok(Math.abs(r.llave.x0 - r.llave.c0) <= 15 && Math.abs(r.llave.x1 - r.llave.c1) <= 15, JSON.stringify(r.llave));
    assert.ok(r.llave.tam <= 60 && r.llave.sub);
    assert.ok(r.tabla.letra >= 0.3 * r.tabla.fila && r.tabla.peso === '700', JSON.stringify(r.tabla));
    assert.equal(r.cifra, 1); assert.equal(r.hueco, 1);
    assert.ok(Math.abs(r.tarjetas[0] - 150) < 2 && Math.abs(r.tarjetas[1] - 120) < 2, r.tarjetas.join());
    assert.ok(r.lado > 1.05 && r.lado < 1.3, `emoji_lado ${r.lado}× la letra`);
    assert.deepEqual(avisos, []);
  });
  // QA: la multitud a sangre no es desborde
  const q = qa({ emoji: 'apple', marca: false, laminas: [deck.laminas[0], deck.laminas[1]] });
  assert.ok(!q.errores.some(e => /se sale|recortado/.test(e)), q.errores.join('\n'));
});

test('QA: una ecuación que ni encogida cabe se avisa como partida', { timeout: 120_000 }, () => {
  const q = qa({ emoji: 'apple', marca: false, laminas: [{ tipo: 'cifra', lineas: ['100 personas × 20 mensajes al día × 30 días × 5% de respuesta = __3,000 pláticas nuevas cada mes__'] }] });
  assert.ok(q.avisos.some(a => /la ecuación .* se parte/.test(a)), q.avisos.join('\n'));
});
