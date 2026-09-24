// Maquetación (ronda 2 del loop): mapa de 5 pasos, arrastre de la ruta, sello sobre rejilla con destacadas,
// barras con emoji y cifra, calendario largo, negrita en tarjetas, tachado, etiquetas cortas y recortes.
// Se renderiza en Chromium y se mide el DOM; las reglas de QA se prueban con qa.mjs o con medidas-dom.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararSalida, abrir, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { inyectable } from '../scripts/lib/medidas-dom.mjs';
import { plano } from '../scripts/lib/markup.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pz-maq-'));
async function conDeck(deck, fn) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  const { browser, page, avisos } = await abrir(p.htmlPath, p.W, p.H);
  await page.addScriptTag({ content: inyectable() });
  try { return await fn(page, p, avisos); } finally { await browser.close(); }
}
function qa(deck) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const r = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts', 'qa.mjs'), dir, '--salida', path.join(dir, 's'), '--json'], { encoding: 'utf8' });
  return JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
}
const base = laminas => ({ emoji: 'apple', marca: false, laminas });
const ICONOS5 = ['🎯', '🧲', '📅', '🎟️', '⏰'];

test('pasos: 5 íconos con y sin etiquetas caben (encaje ≥ 0.85) y ningún rótulo se parte', { timeout: 120_000 }, async () => {
  await conDeck(base([
    { tipo: 'pasos', iconos: ICONOS5, etiquetas: ['Promesa', 'Registros', 'Calendario', 'Apartado', 'Recordatorios'], activo: 2 },
    { tipo: 'pasos', iconos: ICONOS5, activo: 2, hechos: [1] },
    { tipo: 'pasos', iconos: ['🔍', '🛠️', '🚀', '📈'], etiquetas: ['Encontrar', 'Construir', 'Lanzar', 'Crecer'] },
  ]), async page => {
    const r = await page.evaluate(() => window.PZ.lams.map(l => ({
      encaje: +(l.dataset.encaje || 1),
      partidos: [...l.querySelectorAll('.rotulo-paso')].map(e => window.lineasPalabras(e)).filter(ls => ls.length > 1).map(ls => ls.map(x => x.join(' ')).join(' / ')),
    })));
    r.forEach((x, i) => {
      assert.ok(x.encaje >= 0.85, `lámina ${i + 1}: encaje ${x.encaje}`);
      assert.deepEqual(x.partidos, [], `lámina ${i + 1}`);
    });
  });
});

test('pasos: con clic la mano arrastra la ruta hasta la última tecla (los tramos nacen en el paso del clic) [1:55]', { timeout: 120_000 }, async () => {
  await conDeck(base([
    { tipo: 'pasos', n: 3, clic: 1, texto: 'El sistema' },
    { tipo: 'pasos', n: 3, clic: 1, arrastre: false, texto: 'El sistema' },
  ]), async page => {
    const r = await page.evaluate(() => {
      const [a, b] = window.PZ.lams, cur = a.querySelector('.cursor');
      const tramos = [...a.querySelectorAll('.capa-mano path[mask]')].map(p => p.dataset.p);
      window.PZ.mostrar(a, +cur.dataset.p, 1500);
      const medio = { cerrada: cur.classList.contains('cerrada'), t: cur.style.transform };
      window.PZ.mostrar(a, +cur.dataset.p, Infinity);
      const fin = { cerrada: cur.classList.contains('cerrada'), t: cur.style.transform, fx: +cur.dataset.fx };
      return { p: cur.dataset.p, tramos, medio, fin, dur: window.PZ.animaDur(a, +cur.dataset.p),
        sinArrastre: [...b.querySelectorAll('.capa-mano path[mask]')].map(p => p.dataset.p), fxB: b.querySelector('.cursor').dataset.fx };
    });
    assert.deepEqual(r.tramos, [r.p, r.p], 'la ruta nace en el paso del clic');
    assert.ok(r.medio.cerrada, 'a media ruta la mano va cerrada');
    assert.ok(!r.fin.cerrada && r.fin.fx > 0 && r.fin.t.includes(`${r.fin.fx}px`), `al final la mano queda sobre la última tecla: ${JSON.stringify(r.fin)}`);
    assert.ok(r.dur > 2000, 'el paso dura hasta que la mano llega');
    assert.deepEqual(r.sinArrastre, ['0', '0'], 'arrastre:false deja la ruta desde el paso 0');
    assert.equal(r.fxB, undefined);
  });
});

// La rejilla de 01-sala (vsl-evento): 41 personas repartidas entre 100 sillas
const DEST = [0, 1, 2, 3, 5, 7, 8, 10, 12, 14, 16, 19, 21, 22, 25, 27, 30, 33, 34, 36, 38, 40, 43, 45, 47, 51, 54, 56, 58, 60, 63, 66, 69, 71, 74, 77, 80, 84, 88, 92, 97];
const SALA = { tipo: 'rejilla', total: 100, columnas: 10, emoji: '🪑', emoji_destacado: '🧑', destacar: DEST, sello: 'Media sala' };

test('sello en rejilla con destacadas: se acomoda para tapar ≤ 2; forzado encima, QA da error; sin destacar sigue centrado [6:45]', { timeout: 180_000 }, async () => {
  await conDeck(base([SALA]), async page => {
    const n = await page.evaluate(() => {
      const lam = window.PZ.lams[0], s = lam.querySelector('.sello'), r = s.getBoundingClientRect();
      const m = new DOMMatrix(getComputedStyle(s).transform), sc = Math.hypot(m.a, m.b), a = Math.atan2(m.b, m.a);
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, hw = s.offsetWidth * sc / 2, hh = s.offsetHeight * sc / 2;
      return [...lam.querySelectorAll('.rejilla [data-a^="d"]')].filter(d => {
        const b = d.getBoundingClientRect(), x = b.left + b.width / 2 - cx, y = b.top + b.height / 2 - cy;
        const u = x * Math.cos(-a) - y * Math.sin(-a), v = x * Math.sin(-a) + y * Math.cos(-a);
        return Math.abs(u) <= hw && Math.abs(v) <= hh;
      }).length;
    });
    assert.ok(n <= 2, `el sello tapa ${n} destacadas`);
  });
  const r = qa(base([SALA, { ...SALA, sello_sobre: 'rejilla' }]));
  assert.ok(!r.errores.some(e => /lámina 1 .*celdas destacadas/.test(e)), r.errores.join('\n'));
  assert.ok(r.errores.some(e => /lámina 2 .*el sello tapa \d+ de las 41 celdas destacadas/.test(e)), r.errores.join('\n'));
});

test('barras: el emoji va ENCIMA de la cifra y ninguno invade el título; QA sin errores', { timeout: 120_000 }, async () => {
  const lam = { tipo: 'grafica', grafica: 'barras', titulo: 'De cada $100', barras: [
    { etiqueta: 'Operación', valor: 50, valor_texto: '50%', emoji: '🏪' }, { etiqueta: 'Sueldo', valor: 30, valor_texto: '30%', emoji: '👔' },
    { etiqueta: 'Impuestos', valor: 15, valor_texto: '15%', emoji: '🏛️' }] };
  await conDeck(base([lam]), async page => {
    const r = await page.evaluate(() => {
      const l = window.PZ.lams[0], tit = l.querySelector('.grafica > div').getBoundingClientRect();
      const cifras = [...l.querySelectorAll('svg text')].filter(t => /%/.test(t.textContent)).map(t => t.getBoundingClientRect());
      const emos = [...l.querySelectorAll('.emo')].map(e => e.getBoundingClientRect());
      return emos.map((e, i) => ({ sobreCifra: e.bottom <= cifras[i].top + 4, bajoTitulo: e.top >= tit.bottom }));
    });
    r.forEach((x, i) => { assert.ok(x.sobreCifra, `barra ${i + 1}: el emoji tapa la cifra`); assert.ok(x.bajoTitulo, `barra ${i + 1}: el emoji invade el título`); });
  });
  const q = qa(base([lam, { tipo: 'grafica', titulo: 'Ahorro', series: [{ nombre: 'Separando', forma: 'recta', tono: 'v' }, { nombre: 'Esperando «lo que sobre»', forma: 'plana', tono: 'r' }] }]));
  assert.deepEqual(q.errores, []);
});

test('calendario: n hasta 42 sin recorte ni corte de la última fila; «DÍA 10» con una fase de un día', { timeout: 120_000 }, async () => {
  const fases = [{ nombre: 'Fase 1', desde: 1, hasta: 14, color: 'azul' }, { nombre: 'Fase 2', desde: 15, hasta: 28, color: 'verde' }];
  await conDeck(base([
    { tipo: 'calendario', titulo: 'Reto de 28 días', n: 28, fases, fase_activa: 2 },
    { tipo: 'calendario', n: 14, fases: [{ nombre: 'Clave', desde: 10, hasta: 10, color: 'rojo' }], fase_activa: 1 },
  ]), async (page, p) => {
    assert.deepEqual(p.avisos, []);
    const r = await page.evaluate(() => window.PZ.lams.map(l => ({ dias: l.querySelectorAll('.dia').length, pastilla: l.querySelector('.barra span').textContent,
      recortes: window.recortes(l, '.calendario, .calendario .dia'), encaje: +(l.dataset.encaje || 1) })));
    assert.equal(r[0].dias, 28);
    assert.equal(r[0].pastilla, 'DÍAS 15-28');
    assert.deepEqual(r[0].recortes, []);
    assert.ok(r[0].encaje >= 0.85, String(r[0].encaje));
    assert.equal(r[1].pastilla, 'DÍA 10');
    // la regla de recorte sí ve el corte si el contenedor se encoge (el defecto de la ronda 2)
    const cortado = await page.evaluate(() => {
      const st = document.createElement('style'); st.textContent = '.lienzo > .calendario { flex-shrink: 1 !important; height: 400px }'; document.head.appendChild(st);
      return window.recortes(window.PZ.lams[0], '.calendario, .calendario .dia');
    });
    assert.ok(cortado.some(q => q.por === 'calendario' && q.px > 4), JSON.stringify(cortado));
  });
});

test('tarjetas y opciones: la negrita conserva el espacio anterior; QA ve un flex con texto y negrita', { timeout: 120_000 }, async () => {
  const items = ['Tu oferta en **una frase**', 'Tu respuesta a **la objeción**', 'Cuándo **te pasa**'];
  await conDeck(base([{ tipo: 'tarjetas', items: items.map(texto => ({ emoji: '📝', texto })) }, { tipo: 'opciones', items: [{ texto: 'Muy **fácil**', tono: 'v' }], elegida: 0 }]), async page => {
    const r = await page.evaluate(() => ({ rot: [...window.PZ.lams[0].querySelectorAll('.rotulo')].map(e => e.innerText.replace(/\s+/g, ' ').trim()),
      op: window.PZ.lams[1].querySelector('.opcion').innerText.trim(), mezcla: window.PZ.lams.flatMap(l => window.flexMezclado(l)) }));
    assert.deepEqual(r.rot, items.map(plano));
    assert.equal(r.op, 'Muy fácil');
    assert.deepEqual(r.mezcla, []);
    const roto = await page.evaluate(() => { const st = document.createElement('style'); st.textContent = '.tarjeta .rotulo { display: flex !important }'; document.head.appendChild(st); return window.flexMezclado(window.PZ.lams[0]); });
    assert.equal(roto.length, 3);
  });
});

test('~~tachado~~: sin el tachón negro del navegador; tachar_paso lo deja para el paso siguiente', { timeout: 120_000 }, async () => {
  await conDeck(base([{ tipo: 'cifra', lineas: [{ texto: '~~Ventas − Gastos = Ganancia~~', tachar_paso: 1 }, 'Ventas − Ganancia = Gastos'] }, { tipo: 'idea', texto: 'Un ~~tachón~~ aquí', tachar_paso: 2 }]), async (page, p) => {
    assert.deepEqual(p.pasos, [2, 3]);
    const r = await page.evaluate(() => window.PZ.lams.map(l => { const s = l.querySelector('[data-tachar]'); return { deco: getComputedStyle(s).textDecorationLine, p: s.dataset.tacharP, trazo: l.querySelector('.capa-mano path[data-dur="240"]').dataset.p }; }));
    assert.deepEqual(r.map(x => x.deco), ['none', 'none']);
    assert.deepEqual(r.map(x => x.trazo), ['1', '2']);
  });
  const q = qa(base([{ tipo: 'idea', texto: 'Un ~~tachón~~ aquí' }]));
  assert.ok(q.avisos.some(a => /sale ya tachado en el paso en que aparece/.test(a)), q.avisos.join('\n'));
});

test('etiquetas cortas: el flujo de 3 no las parte; QA avisa una corta partida en el calendario angosto', { timeout: 180_000 }, async () => {
  await conDeck(base([{ tipo: 'flujo', nodos: [{ emoji: '😠', etiqueta: 'Llega una queja' }, { emoji: '🤖', etiqueta: 'La detecta' }, { emoji: '🙋', etiqueta: 'Te la pasa' }] }]), async page => {
    const ls = await page.evaluate(() => [...window.PZ.lams[0].querySelectorAll('.etiqueta')].map(e => window.lineasPalabras(e).length));
    assert.deepEqual(ls, [1, 1, 1]);
  });
  const r = qa(base([
    { tipo: 'flujo', nodos: [{ emoji: '😠', etiqueta: 'Llega una queja' }, { emoji: '🤖', etiqueta: 'La detecta' }, { emoji: '🙋', etiqueta: 'Te la pasa' }] },
    { tipo: 'calendario', dias: Array.from({ length: 10 }, () => ({ sub: 'Entregar valorado' })), anotaciones: [{ dia: 1, texto: 'Aquí' }] },
  ]));
  assert.ok(!r.avisos.some(a => /lámina 1 .*partida|lámina 1 .*huérfano/.test(a)), r.avisos.join('\n'));
  assert.ok(r.avisos.some(a => /lámina 2 .*etiqueta corta partida.*Entregar \/ valorado/.test(a)), r.avisos.join('\n'));
});

test('foco con texto y nota: pinta las dos (la nota ya no se pierde)', { timeout: 120_000 }, async () => {
  await conDeck(base([{ tipo: 'idea', emoji: '💰', texto: 'Uno' }, { tipo: 'foco', texto: 'Lo verde es tuyo', nota: 'Y esta nota se ve' }]), async page => {
    const t = await page.evaluate(() => window.PZ.lams[1].querySelector(':scope > .lienzo').innerText);
    assert.ok(/Lo verde es tuyo/.test(t) && /Y esta nota se ve/.test(t), t);
  });
});
