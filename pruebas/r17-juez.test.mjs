// R17 (juez r17, Codex, 84.50): procedencia sin importar quién hable, objeciones que solo valoran el tema, demostraciones que
// solo anuncian, guardia de la capa roja, espacios duros encadenados y composiciones 9:16 (llave, contraste, flujo, cifra, sello).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';
import { avisosProcedencia } from '../scripts/lib/imagenes.mjs';
import { revisarComponentes, demostracionChat } from '../scripts/lib/conversacion.mjs';
import { demuestra } from '../scripts/lib/reglas-deck.mjs';
import { diferenciasRojo } from '../scripts/lib/guardia.mjs';
import { pegarCortas } from '../scripts/lib/markup.mjs';

test('r17: un chat que muestra un resultado pide procedencia aunque lo diga «yo»; una pregunta o un sello neutro no', () => {
  assert.equal(avisosProcedencia({ tipo: 'chat', paga: 'corto', sello: 'Vendido', mensajes: [{ de: 'otro', texto: '¿Ya recibiste mi pago?' }, { de: 'yo', texto: 'Ya recibí tu pago. Pedido confirmado.' }] }).length, 1);
  assert.equal(avisosProcedencia({ tipo: 'chat', sello: 'Resuelto', mensajes: [{ de: 'yo', texto: 'Ana. Pedido registrado.' }] }).length, 1);
  assert.deepEqual(avisosProcedencia({ tipo: 'chat', paga: 'gancho', mensajes: [{ de: 'otro', texto: '¿Qué recibo si te contrato?' }, { de: 'yo', texto: 'Una página y una revisión.' }] }), []);
  assert.deepEqual(avisosProcedencia({ tipo: 'chat', paga: 'gancho', sello: 'Con enlace', mensajes: [{ de: 'otro', texto: '¡Quedó increíble!' }, { de: 'yo', texto: '¿Me dejas una reseña? Aquí está el enlace.' }] }), []);
  assert.deepEqual(avisosProcedencia({ tipo: 'chat', sello: 'Sin anticipo', mensajes: [{ de: 'otro', texto: '¿Te pago todo cuando esté listo?' }] }), []);
});

test('r17: una objeción se responde con un dato, no valorando el tema; un tema conocido no tapa la parte genérica', () => {
  const T = (q, r) => revisarComponentes(q, r).map(x => x.tema);
  assert.deepEqual(T('¿Cuánto cuesta, cuánto tarda y qué incluye?', ['El precio es importante. El plazo es importante. Lo que incluye es importante.']), ['cuesta', 'tarda', 'incluye']);
  assert.deepEqual(T('¿Cuánto cuesta, cuánto tarda y qué incluye?', ['El precio es 800 pesos. El plazo es dos días. Incluye una revisión.']), []);
  assert.deepEqual(T('¿Incluye devoluciones y cuánto tarda?', ['Aceptamos devoluciones.']), ['tarda']);
  assert.deepEqual(T('¿Incluye devoluciones y cuánto tarda?', ['Aceptamos devoluciones. Llega en tres días.']), []);
  assert.deepEqual(T('No tengo computadora ni tiempo.', ['Usa el celular en lugar de la computadora.']), ['tiempo']);
  assert.deepEqual(T('¿Y si no me gusta ni me lo entregas a tiempo?', ['Si no te gusta, lo ajusto dos veces sin costo.', 'Si no te lo entrego el viernes, te devuelvo el anticipo.']), []);
});

test('r17: anunciar una demo no la demuestra; la variable del saludo no es un dato', () => {
  assert.equal(demuestra({ tipo: 'camara', demuestra: 'Vamos a ver una demostración' }), false);
  assert.equal(demuestra({ tipo: 'camara', demuestra: 'Te muestro cómo lleno la cotización en vivo' }), true);
  assert.equal(demostracionChat({ tipo: 'chat', guion: true, mensajes: [{ de: 'yo', texto: 'Hola [nombre], revisamos tu pedido.' }] }), false);
  assert.equal(demostracionChat({ tipo: 'chat', guion: true, mensajes: [{ de: 'yo', texto: 'Hola [nombre], ¿me dejas una reseña aquí?' }] }), true);
  assert.equal(demostracionChat({ tipo: 'chat', guion: true, mensajes: [{ de: 'yo', texto: 'Hola [nombre], ¿qué tal las galletas que llevaste en junio?' }] }), true);
});

test('r17 guardia: perder o ganar más del 30% de la tinta roja de una lámina falla', () => {
  assert.deepEqual(diferenciasRojo({ 'a.png': 113 }, { 'a.png': 1 }), ['a.png: tinta roja 113 → 1 px']);
  assert.deepEqual(diferenciasRojo({ 'a.png': 113 }, { 'a.png': 100 }), []);
  assert.deepEqual(diferenciasRojo({ 'a.png': 10 }, { 'a.png': 0 }), [], 'bajo 40 px es ruido');
  // R18: por celdas. El 📌 rojo (celda 1) no esconde la pérdida del subrayado (celda 8)
  const c = (i, v) => { const a = Array(24).fill(0); a[0] = 9000; a[i] = v; return a; };
  assert.deepEqual(diferenciasRojo({ 'b.png': c(8, 430) }, { 'b.png': c(8, 0) }), ['b.png: tinta roja 430 → 0 px (celda 3,2)']);
  assert.deepEqual(diferenciasRojo({ 'b.png': c(8, 430) }, { 'b.png': c(8, 420) }), []);
});

test('r17: dos palabras cortas seguidas se pegan las dos («no·se·pide»)', () => {
  const v = t => [...pegarCortas(t)].map(c => c === ' ' ? '·' : c).join('');
  assert.equal(v('El anticipo no se pide:'), 'El·anticipo no·se·pide:');
  assert.equal(v('Si no te lo entrego el viernes'), 'Si·no·te·lo·entrego el·viernes');
});

async function pagina(t, laminas, formato = '9:16') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r17j-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca: false, emoji: 'apple', formato, laminas }));
  const prep = prepararSalida(dir); let b;
  try { b = await abrir(prep.htmlPath, prep.W, prep.H); } catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(e.motivo); return null; }
  t.after(() => b.browser.close());
  return b.page;
}
const cajas = `(l, sel) => [...l.querySelectorAll(sel)].map(e => { const a = e.getBoundingClientRect(), L = l.getBoundingClientRect(), s = L.width / l.offsetWidth;
  return { x: (a.x - L.x) / s, y: (a.y - L.y) / s, w: a.width / s, h: a.height / s, f: parseFloat(getComputedStyle(e).fontSize) }; })`;

test('r17 9:16: la llave va bajo la lista y su nota cabe; el contraste va a ≥ 64 px; el flujo de texto no invade Reels', async t => {
  const p = await pagina(t, [
    { tipo: 'lista', items: ['Apartar su fecha', 'Comprar el material'], anotaciones: [{ llave: ['i0', 'i1'], texto: 'Por eso es la mitad' }] },
    { tipo: 'lista', columnas: [{ titulo: 'SÍ', tono: 'v', vineta: 'check', items: ['Di para qué', 'Da la fecha'] }, { titulo: 'NO', tono: 'r', vineta: 'cruz', items: ['Pedir perdón', 'Dar descuento'] }] },
    { tipo: 'flujo', nodos: [{ etiqueta: 'Falta café' }, { etiqueta: 'Ana pide' }, { etiqueta: 'Pedido registrado' }] },
  ]); if (!p) return;
  const r = await p.evaluate(`(() => { const C = ${cajas}; const [a, b, c] = window.PZ.lams;
    return { items: C(a, '.lista > *'), nota: C(a, '.anotacion')[0], bajo: a.querySelector('.anotacion').dataset.llaveBajo,
      contraste: C(b, '.lista > *'), etiquetas: C(c, '.nodo .etiqueta') }; })()`);
  assert.equal(r.bajo, '1');
  assert.ok(r.nota.y > Math.max(...r.items.map(i => i.y + i.h)), 'la nota va debajo de la lista');
  assert.ok(r.nota.x >= 30 && r.nota.x + r.nota.w <= 1050, JSON.stringify(r.nota));
  assert.ok(r.contraste.every(i => i.f >= 64), JSON.stringify(r.contraste.map(i => i.f)));
  assert.ok(r.etiquetas.every(e => e.x >= 140 && e.x + e.w <= 940 && e.f >= 76), JSON.stringify(r.etiquetas));
});

test('r17 9:16: una cuenta corta cabe en un renglón y el sello del chat no tapa «Ejemplo ficticio»', async t => {
  const p = await pagina(t, [
    { tipo: 'cifra', lineas: [{ texto: '$8,000 × ((50%)) = **$4,000**' }] },
    { tipo: 'chat', procedencia: 'ejemplo', sello: 'Resuelto', sello_sobre: 'm1', mensajes: [{ de: 'otro', hora: '14:00', texto: '¿Quién pidió el café?' }, { de: 'yo', hora: '14:01', texto: 'Ana. Pedido registrado.' }] },
  ]); if (!p) return;
  const r = await p.evaluate(`(() => { const C = ${cajas}; const [a, b] = window.PZ.lams;
    const cifra = a.querySelector('.cifra'); const s = b.querySelector('.sello .sello-tinta'), pr = b.querySelector('.procedencia');
    const x = (u, v) => Math.max(0, Math.min(u.x + u.w, v.x + v.w) - Math.max(u.x, v.x)) * Math.max(0, Math.min(u.y + u.h, v.y + v.h) - Math.max(u.y, v.y));
    return { partida: cifra.dataset.cifraPartida || '', tapa: pr ? x(C(b, '.sello .sello-tinta')[0], C(b, '.procedencia')[0]) : -1 }; })()`);
  assert.equal(r.partida, '');
  assert.equal(r.tapa, 0);
});

test('r17 9:16: una marca corta que es casi toda la frase baja hasta 84 px para quedar entera; una larga sigue avisando', async t => {
  const p = await pagina(t, [
    { tipo: 'idea', emoji: '📌', texto: '__Guarda este formato__' },
    { tipo: 'idea', emoji: '📝', texto: 'Entrega el turno\n__sin perseguir pendientes__' },
  ]); if (!p) return;
  const r = await p.evaluate(() => window.PZ.lams.map(l => {
    const m = l.querySelector('[data-sub]'), t = l.querySelector('.t');
    return { renglones: new Set([...m.getClientRects()].map(x => Math.round(x.top))).size, letra: parseFloat(getComputedStyle(t).fontSize) };
  }));
  assert.equal(r[0].renglones, 1, JSON.stringify(r));
  assert.ok(r[0].letra >= 84, JSON.stringify(r));
  assert.ok(r[1].letra >= 84, 'la larga no se encoge por debajo de 84');
});

test('r18: ningún documento dice que el chat ignora la procedencia (LAYOUTS y ESTILO dicen lo mismo que el motor)', async () => {
  const { DIR_SKILL } = await import('../scripts/lib/pipeline.mjs');
  for (const doc of ['references/LAYOUTS.md', 'references/ESTILO.md', 'SKILL.md', 'REGLAS-DEL-AUTOR.md', 'references/ARRANQUE.md']) {
    const t = fs.readFileSync(path.join(DIR_SKILL, doc), 'utf8');
    assert.ok(!/(idea\/chat ignoran|se ignora en idea\/chat|chat ignora\w* (la )?procedencia)/.test(t), doc);
  }
});

test('r18: una objeción pide valor, plazo o contenido; «merece atención» o una contrapregunta no responden', () => {
  const T = (q, r) => revisarComponentes(q, r).map(x => x.tema);
  const Q = '¿Cuánto cuesta, cuánto tarda y qué incluye?';
  assert.deepEqual(T(Q, ['El precio es importante para todos. El plazo es importante para todos. Lo que incluye es importante para todos.']), ['cuesta', 'tarda', 'incluye']);
  assert.deepEqual(T(Q, ['El precio merece atención. El plazo merece atención. Lo que incluye merece atención.']), ['cuesta', 'tarda', 'incluye']);
  assert.deepEqual(T(Q, ['¿Qué precio te gustaría pagar? ¿Qué plazo te gustaría tener? ¿Qué incluye para tu equipo?']), ['cuesta', 'tarda', 'incluye']);
  assert.deepEqual(T(Q, ['Cuesta 490 pesos. Lo entregas en tres días. Incluye tres plantillas.']), []);
  assert.deepEqual(T('¿No tengo tiempo ni ganas?', ['Diez segundos al día.', 'Las ganas llegan al ver el primer resultado.']), []);
});

test('r18: un anuncio o un saludo con fecha no demuestran; una salida vaga tampoco', () => {
  assert.equal(demuestra({ tipo: 'camara', demuestra: 'Enseguida veremos una demostración de todo esto' }), false);
  assert.equal(demostracionChat({ tipo: 'chat', guion: true, mensajes: [{ de: 'yo', texto: 'Hola [nombre], revisamos tu pedido el lunes.' }] }), false);
  assert.equal(demostracionChat({ tipo: 'chat', mensajes: [{ de: 'otro', texto: '¿Cuánto cuesta y cuándo entregas?' }, { de: 'yo', texto: 'Puedes revisar todo tranquilamente.' }] }), false);
  assert.equal(demostracionChat({ tipo: 'chat', mensajes: [{ de: 'otro', texto: '¿Cuánto cuesta y cuándo entregas?' }, { de: 'yo', texto: 'Cuesta 900 pesos y te lo entrego el viernes.' }] }), true);
});

test('r18 9:16: con llave, los renglones de la lista van juntos y la llave los abraza a los dos', async t => {
  const p = await pagina(t, [{ tipo: 'lista', items: ['Piso 3', 'Junto al elevador'], anotaciones: [{ llave: ['i0', 'i1'], texto: 'Sin confusiones' }] }]); if (!p) return;
  const r = await p.evaluate(`(() => { const C = ${cajas}; const l = window.PZ.lams[0]; return { items: C(l, '.lista > *'), nota: C(l, '.anotacion')[0] }; })()`);
  const hueco = r.items[1].y - (r.items[0].y + r.items[0].h);
  assert.ok(hueco <= r.items[0].f * .9, `hueco de ${hueco} px con letra de ${r.items[0].f}`);
  assert.ok(r.nota.y > r.items[1].y + r.items[1].h);
});
