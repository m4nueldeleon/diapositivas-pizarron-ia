// Ronda 5 del loop (motor): calendario y stack en 9:16, etiquetas de barra, fondo del foco con sello y notas, notas
// que no caen sobre su ancla, tramo en vivo en PNG/hoja/QA, avatar del chat, la mano del mapa y `fuente` en más diseños.
// Se renderiza en Chromium y se mide el DOM; las reglas de QA se prueban corriendo qa.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararSalida, abrir, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { cuadrosHoja, htmlHoja } from '../scripts/lib/hoja.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r5-'));
async function conDeck(deck, fn) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  const { browser, page } = await abrir(p.htmlPath, p.W, p.H);
  try { return await fn(page, p); } finally { await browser.close(); }
}
function qa(deck) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const r = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts', 'qa.mjs'), dir, '--salida', path.join(dir, 's'), '--json'], { encoding: 'utf8' });
  return JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
}
const demo = JSON.parse(fs.readFileSync(path.join(DIR_SKILL, 'ejemplos', 'demo', 'deck.json'), 'utf8'));
const deDemo = id => demo.laminas.find(l => l.id === id);

test('calendario 9:16: el plan14 del demo sale sin errores (subs dentro de celdas de ≥ 210 px, flecha por el costado)', { timeout: 180_000 }, async () => {
  const deck = { formato: '9:16', emoji: 'apple', marca: false, laminas: [deDemo('plan14')] };
  const r = qa(deck);
  assert.deepEqual(r.errores, [], r.errores.join('\n'));
  await conDeck(deck, async page => {
    const m = await page.evaluate(() => {
      const lam = window.PZ.lams[0], cal = lam.querySelector('.calendario').getBoundingClientRect();
      const dias = [...lam.querySelectorAll('.dia')].map(d => { const b = d.getBoundingClientRect(), s = d.querySelector('span'); return { w: b.width, cabe: s.scrollWidth <= s.clientWidth + 1 }; });
      const barra = lam.querySelector('.barra').getBoundingClientRect();
      const fl = lam.querySelector('.capa-mano path[data-clase="flecha"]'), tot = fl.getTotalLength();
      let cruza = 0; for (let t = 0; t <= tot; t += 5) { const q = fl.getPointAtLength(t); if (q.x > barra.left + 20 && q.x < barra.right && q.y > barra.top && q.y < barra.bottom) cruza++; }
      return { dias, cruza, ancho: cal.width };
    });
    assert.ok(m.dias.every(d => d.w >= 210 && d.cabe), JSON.stringify(m.dias));
    assert.equal(m.cruza, 0, 'la flecha no cruza la barra de la fase');
  });
});

test('stack 9:16 a sangre: tarjetas a color con su «Bono #1» entre la firma y la zona de Reels; sangre:false también pinta el sub', { timeout: 120_000 }, async () => {
  const items = [{ emoji: '🗺️', texto: 'El Ciclo Semanal', doble: true }, { emoji: '📖', texto: '6 sesiones en vivo' }, { emoji: '🎯', texto: '12 retos' },
    { emoji: '📄', texto: 'Guion' }, { emoji: '🧑‍🏫', texto: 'Revisión 1 a 1' }, { emoji: '🎁', texto: 'Plantillas', sub: 'Bono #1' }, { emoji: '🎁', texto: 'Audios', sub: 'Bono #2' }];
  await conDeck({ formato: '9:16', emoji: 'apple', marca: false, laminas: [{ tipo: 'stack', items }, { tipo: 'stack', items, sangre: false, color: undefined }] }, async page => {
    const m = await page.evaluate(() => window.PZ.lams.map(l => {
      const L = l.getBoundingClientRect();
      return { subs: [...l.querySelectorAll('.b-sub')].map(e => e.textContent), color: [...l.querySelectorAll('.bento-lleno')].every(e => /\bc-/.test(e.className)),
        ys: [...l.querySelectorAll('.bento')].map(e => { const b = e.getBoundingClientRect(); return [b.top - L.top, b.bottom - L.top]; }) };
    }));
    assert.deepEqual(m[0].subs, ['Bono #1', 'Bono #2']);
    assert.ok(m[0].color, 'cada pieza lleva su color');
    assert.ok(m[0].ys.every(([a, b]) => a >= 220 && b <= 1600), JSON.stringify(m[0].ys));
    assert.deepEqual(m[1].subs, ['Bono #1', 'Bono #2'], 'la pila también pinta el sub');
  });
});

test('barras: etiquetas largas en 2 renglones como máximo, separadas ≥ 32 px y dentro del alto; 4 largas en 9:16 piden acortar', { timeout: 180_000 }, async () => {
  const barras = [
    { tipo: 'grafica', grafica: 'barras', barras: [{ etiqueta: 'Solo la pensaron', valor: 43 }, { etiqueta: 'Reportaban cada semana', valor: 76 }] },
    { tipo: 'grafica', grafica: 'barras', barras: [{ etiqueta: 'Solo la pensaron en su casa', valor: 43 }, { etiqueta: 'La escribieron en papel', valor: 56 },
      { etiqueta: 'Se la contaron a un amigo', valor: 64 }, { etiqueta: 'Reportaban cada semana', valor: 76 }] },
  ];
  await conDeck({ emoji: 'apple', marca: false, laminas: barras }, async page => {
    const m = await page.evaluate(() => window.PZ.lams.map(l => {
      const svg = l.querySelector('.grafica svg'), S = svg.getBoundingClientRect();
      const ts = [...svg.querySelectorAll('text')].filter(t => t.querySelector('tspan')).map(t => ({ n: t.querySelectorAll('tspan').length, b: t.getBoundingClientRect() }));
      const huecos = ts.slice(1).map((t, i) => t.b.left - ts[i].b.right);
      return { n: ts.map(t => t.n), huecos, abajo: Math.max(...ts.map(t => t.b.bottom)) - S.bottom };
    }));
    m.forEach(x => { assert.ok(x.n.every(k => k <= 2), JSON.stringify(x)); assert.ok(x.huecos.every(h => h >= 32), JSON.stringify(x)); assert.ok(x.abajo <= 2, JSON.stringify(x)); });
  });
  const r = qa({ emoji: 'apple', marca: false, laminas: barras });
  assert.ok(!r.errores.some(e => /se enciman/.test(e)), r.errores.join('\n'));
  assert.ok(!r.avisos.some(a => /se leen como una sola frase/.test(a)), r.avisos.join('\n'));
  const v = qa({ formato: '9:16', emoji: 'apple', marca: false, laminas: [barras[1]] });
  assert.ok(v.avisos.some(a => /no cabe en su columna.*acórtala/.test(a)), v.avisos.join('\n'));
});

test('foco: el fondo conserva el sello y las anotaciones de la lámina anterior, con su gancho; QA sin errores', { timeout: 180_000 }, async () => {
  const deck = { emoji: 'apple', marca: false, laminas: [
    { tipo: 'idea', emoji: '💸', texto: 'Le bajas el precio a todos', sello: 'Error' },
    { tipo: 'foco', texto: 'El descuento se vuelve tu precio.' },
    { tipo: 'rejilla', emoji: '🧑‍💼', total: 30, columnas: 10, destacar: [25, 26, 27, 28, 29], texto: 'Se pueden ir **5 de 30**', anotaciones: [{ texto: '1 de cada 6', a: 'd29', lado: 'derecha' }] },
    { tipo: 'foco', texto: 'Si se van **menos de 5**, ganas más.' },
  ] };
  await conDeck(deck, async page => {
    const m = await page.evaluate(() => [1, 3].map(i => {
      const clon = window.PZ.lams[i].querySelector('.escena.clon'), prev = window.PZ.lams[i - 1];
      const tinta = svg => [...svg.querySelectorAll('path')].filter(q => !q.closest('defs')).length;
      return { sello: clon.querySelectorAll(':scope > .sello').length, anot: clon.querySelectorAll(':scope > .anotacion').length,
        tinta: [tinta(clon.querySelector(':scope > .capa-mano')), tinta(prev.querySelector(':scope > .capa-mano'))] };
    }));
    assert.equal(m[0].sello, 1);
    assert.equal(m[1].anot, 1);
    assert.equal(m[1].tinta[0], m[1].tinta[1], 'la tinta del clon es la de la lámina anterior (con el gancho de la nota)');
  });
  const r = qa(deck);
  assert.ok(!r.errores.some(e => /foco/.test(e)), r.errores.join('\n'));
});

test('anotación: si el lado no cabe va abajo, fuera de la tarjeta; forzada encima con x/y, QA da error', { timeout: 180_000 }, async () => {
  const post = { tipo: 'prueba', encabezado: 'Así se ve un logro en el muro:', capturas: [{ post: { texto: ['Reto de la semana: listo', 'Grabé mi primera clase. Gracias por empujarme.'], clave: 'Grabé mi primera clase.' }, ejemplo: true }] };
  const deck = { emoji: 'apple', marca: false, laminas: [
    { ...post, anotaciones: [{ texto: 'Y el grupo le contesta', a: 'cap0', lado: 'derecha' }] },
    { ...post, anotaciones: [{ texto: 'Y el grupo le contesta', a: 'cap0' }] },
  ] };
  await conDeck(deck, async page => {
    const m = await page.evaluate(() => window.PZ.lams.map(l => {
      const n = l.querySelector(':scope > .anotacion').getBoundingClientRect(), c = l.querySelector('.captura').getBoundingClientRect();
      return { debajo: n.top >= c.bottom, real: l.querySelector(':scope > .anotacion').dataset.ladoReal || '' };
    }));
    assert.ok(m.every(x => x.debajo), JSON.stringify(m));
    assert.equal(m[0].real, 'abajo');
  });
  const r = qa(deck);
  assert.ok(!r.errores.some(e => /anotación|atraviesa/.test(e)), r.errores.join('\n'));
  const mal = qa({ emoji: 'apple', marca: false, laminas: [{ ...post, anotaciones: [{ texto: 'Encima', a: 'cap0', x: 500, y: 460 }] }] });
  assert.ok(mal.errores.some(e => /la anotación «Encima» cae encima/.test(e)), mal.errores.join('\n'));
});

test('tramo en vivo: QA revisa lo que ve el público ([CLAVE] y > 35 palabras); la hoja lo muestra con «EN VIVO»', { timeout: 120_000 }, () => {
  const vivo = { tipo: 'camara', vivo: true, dur: 120, texto: 'Ahora tú: **escribe en el chat cuántos clientes pagan hoy tu precio completo y cuántos te piden descuento**',
    items: ['Abre tu lista de clientes activos del último trimestre completo', 'Marca a los que pagan el precio completo sin pedir nada',
      'Cuenta a los que siempre piden descuento o meses sin intereses', 'Divide el segundo número entre el total de tu lista', 'Escribe el porcentaje con la palabra [CLAVE]'] };
  const r = qa({ formato: '9:16', emoji: 'apple', marca: false, pieza: 'libre', laminas: [{ tipo: 'idea', texto: 'Antes' }, vivo, { tipo: 'idea', texto: 'Después' }] });
  assert.ok(r.errores.some(e => /dato pendiente \[CLAVE\] en la lámina 2/.test(e)), r.errores.join('\n'));
  assert.ok(r.errores.some(e => /lámina 2 .*palabras a la vista/.test(e)), r.errores.join('\n'));
  const cuadros = cuadrosHoja([
    { lamina: 0, id: 'ej', tipo: 'camara', vivo: true, dur: 60, paso: 0, pasos: 1, archivo: 'laminas/01-ej-1.png' },
    { lamina: 1, id: 'cam', tipo: 'camara', paso: 0, pasos: 1, archivo: null },
  ]);
  const h = htmlHoja(cuadros, { W: 1920, H: 1080 }).html;
  assert.match(h, /<img src="laminas\/01-ej-1\.png"/);
  assert.match(h, /1 · ej · EN VIVO · 1:00/);
  assert.equal((h.match(/class="cam"/g) || []).length, 1, 'la cámara normal sigue gris');
  assert.ok(!/figcaption\{position:absolute/.test(h), 'el rótulo no tapa la miniatura');
});

test('render: el tramo en vivo tiene su PNG y pasos.json lo lista con archivo', { timeout: 180_000 }, () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ emoji: 'apple', marca: false, laminas: [{ tipo: 'idea', texto: 'Antes' },
    { tipo: 'camara', id: 'ejercicio', vivo: true, dur: 60, texto: 'Ahora tú: **anota tu precio**', items: ['Abre tu lista', 'Marca uno'] }] }));
  const r = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts', 'render.mjs'), dir, '--salida', path.join(dir, 's'), '--sin-hoja'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(dir, 's', 'laminas', '02-ejercicio-1.png')));
  const m = JSON.parse(fs.readFileSync(path.join(dir, 's', 'pasos.json'), 'utf8')).find(x => x.lamina === 1);
  assert.equal(m.vivo, true);
  assert.equal(m.archivo, 'laminas/02-ejercicio-1.png');
});

test('chat: el emoji del avatar llena ~85% del círculo; avatar_tam agranda los dos avatares', { timeout: 120_000 }, async () => {
  const chat = extra => ({ tipo: 'chat', avatar_otro: '🤖', mensajes: [{ de: 'otro', texto: 'Hola, soy tu IA' }, { de: 'yo', texto: 'Hola' }], ...extra });
  await conDeck({ formato: '9:16', emoji: 'apple', marca: false, laminas: [chat({}), chat({ avatar_tam: 120 })] }, async page => {
    const m = await page.evaluate(() => window.PZ.lams.map(l => {
      const av = l.querySelector('.av-emo'), e = av.querySelector('.emo'), yo = l.querySelector('.yo-av');
      return { circ: av.offsetWidth, emo: e.offsetWidth, yo: yo.offsetWidth };
    }));
    assert.equal(m[0].circ, 135, 'en 9:16 un chat corto sube la letra a 104 px y el avatar a ~1.3×');
    assert.ok(m[0].emo >= 109 && m[0].emo <= 117, JSON.stringify(m));
    assert.equal(m[1].circ, 120);
    assert.equal(m[1].yo, 120, 'los dos avatares miden lo mismo');
  });
});

test('mapa con clic: la mano entra en el mismo paso que las teclas, aprieta la 1 y se queda antes de arrastrar; el botón no cambia', { timeout: 120_000 }, async () => {
  await conDeck({ emoji: 'apple', marca: false, laminas: [{ tipo: 'pasos', n: 3, clic: 1, texto: 'El sistema' }, { tipo: 'boton', boton: 'Generar', emoji: '🤖' }] }, async page => {
    const m = await page.evaluate(() => {
      const [a, b] = window.PZ.lams, cur = a.querySelector('.cursor');
      const mascaras = () => [...a.querySelectorAll('mask path[data-trazo]')].map(e => +e.style.strokeDashoffset);
      window.PZ.mostrar(a, 0, 900);
      const en900 = { t: cur.style.transform, op: cur.style.opacity, cerrada: cur.classList.contains('cerrada'), mascaras: mascaras() };
      window.PZ.mostrar(b, 0, 100);
      return { pasos: window.PZ.pasos(a), p: cur.dataset.p, en900, boton: b.querySelector('.cursor').style.transform };
    });
    assert.equal(m.pasos, 1);
    assert.equal(m.p, '0');
    assert.match(m.en900.t, /translate\(0px, ?0px\)/, JSON.stringify(m.en900));
    assert.ok(!m.en900.cerrada && m.en900.mascaras.every(x => x === 1), 'a los 900 ms la ruta todavía no se arrastra');
    assert.doesNotMatch(m.boton, /translate\(0px, ?0px\)/, 'el botón conserva su entrada larga');
  });
});

test('fuente en rejilla, tabla, tarjetas y línea de tiempo: el pie gris sale en la lámina', { timeout: 120_000 }, async () => {
  const f = 'Reich y Ruipérez-Valiente, Science (2019)';
  await conDeck({ emoji: 'apple', marca: false, laminas: [
    { tipo: 'rejilla', punto: true, total: 100, columnas: 20, destacar: [1, 2], texto: '**54 de 100** no lo terminaron', fuente: f },
    { tipo: 'tabla', columnas: ['A', 'B'], filas: [{ etiqueta: 'x', celdas: ['1', '2'] }], fuente: f },
    { tipo: 'tarjetas', items: [{ emoji: '📖', texto: 'Uno' }, { emoji: '🎯', texto: 'Dos' }], fuente: f },
    { tipo: 'linea-tiempo', marcas: [{ texto: '2019' }, { texto: '2024' }], fuente: f },
  ] }, async page => {
    const m = await page.evaluate(() => window.PZ.lams.map(l => { window.PZ.mostrar(l, window.PZ.pasos(l) - 1, Infinity); const e = l.querySelector('.fuente'); return e && !e.classList.contains('oculto') ? e.textContent : ''; }));
    assert.deepEqual(m, [f, f, f, f]);
  });
});
