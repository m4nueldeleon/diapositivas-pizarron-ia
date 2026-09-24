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

test('sello en rejilla con destacadas: a todo el ancho se acomoda para tapar ≤ 25%; forzado encima, QA avisa (no error) [6:45]', { timeout: 180_000 }, async () => {
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
    assert.ok(n <= 10, `el sello tapa ${n} de 41 destacadas (tope 25%)`);
  });
  // forzado encima de una rejilla con las destacadas en la franja del centro: tapa más del 25% → aviso
  const CENTRO = Array.from({ length: 40 }, (_, i) => 30 + i);
  const r = qa(base([SALA, { ...SALA, destacar: CENTRO, sello_sobre: 'rejilla' }]));
  assert.ok(!r.errores.some(e => /celdas destacadas/.test(e)), 'tapar destacadas ya no es error: el sello es el remate\n' + r.errores.join('\n'));
  assert.ok(!r.avisos.some(e => /lámina 1 .*celdas destacadas/.test(e)), r.avisos.join('\n'));
  assert.ok(r.avisos.some(e => /lámina 2 .*el sello tapa \d+ de las 40 celdas destacadas/.test(e)), r.avisos.join('\n'));
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

// Ronda 3: `circulos` encimaba personas al azar (radio aleatorio sin distancia mínima)
import { repartirPersonas, SEPARACION_PERSONAS, filasEtiquetas } from '../scripts/lib/layouts-datos.mjs';
test('círculos: con los valores por omisión y con 20 personas ningún par queda a menos de 1.15 × el emoji', () => {
  for (const o of [{}, { n: 20 }, { n: 30 }]) {
    const r = repartirPersonas(o);
    let min = Infinity;
    for (let i = 0; i < r.pos.length; i++) for (let j = i + 1; j < r.pos.length; j++) min = Math.min(min, Math.hypot(r.pos[i][0] - r.pos[j][0], r.pos[i][1] - r.pos[j][1]));
    assert.ok(min >= SEPARACION_PERSONAS * r.tam, `${JSON.stringify(o)}: ${min} < ${SEPARACION_PERSONAS * r.tam}`);
    assert.equal(r.dibujadas, o.n || 12);
  }
  const lleno = repartirPersonas({ n: 60, R: 300 });
  assert.ok(lleno.dibujadas < 60 && lleno.tam === 64);
});
test('línea de tiempo: «Semana 2» pegada a «Semana 1» baja a un segundo renglón', () => {
  assert.deepEqual(filasEtiquetas([90, 282.5, 1437.5], ['Semana 1', 'Semana 2', 'Semana 8'], 56), [0, 1, 0]);
  assert.deepEqual(filasEtiquetas([90, 860, 1630], ['Día 1', 'Día 14', 'Día 30'], 56), [0, 0, 0]);
});

// ---------- ronda 4: el fondo del foco es el estado final de la lámina anterior ----------
test('foco r4: el fondo conserva los tachones de la lámina anterior (lista tachada, tachar_despues, ~~idea~~) y la calificación sin su mano', { timeout: 120_000 }, async () => {
  const items = ['Tomas de stock', 'Párrafos en pantalla', 'Música encima de tu voz'].map(texto => ({ texto, tachado: true }));
  await conDeck(base([
    { tipo: 'lista', items },
    { tipo: 'foco', texto: 'Tus tomas, una frase y música bajita.' },
    { tipo: 'lista', items, tachar_despues: true },
    { tipo: 'foco', texto: 'Tus tomas, una frase y música bajita.' },
    { tipo: 'idea', emoji: '⏰', texto: '~~Más horas = más dinero~~', tachar_paso: 1 },
    { tipo: 'foco', texto: 'Más alcance = más dinero' },
    { tipo: 'calificacion', filas: [{ texto: 'A', emoji: '🅰️', estrellas: 2 }, { texto: 'B', emoji: '🅱️', estrellas: 4 }, { texto: 'C', emoji: '🌊', estrellas: 3 }] },
    { tipo: 'foco', texto: 'La C gana' },
  ]), async (page, p) => {
    assert.ok(!/data-tachar-p="[1-9]/.test(p.html.split('class="escena clon"').slice(1).map(x => x.split('</section>')[0]).join('')), 'el clon no trae pasos de tachón');
    const r = await page.evaluate(() => [1, 3, 5, 7].map(i => {
      const lam = window.PZ.lams[i];
      window.PZ.mostrar(lam, 0, Infinity);
      const clon = lam.querySelector('.escena.clon');
      const visibles = [...clon.querySelectorAll(':scope > .capa-mano path[data-clase="tachon"]')].filter(q => !q.classList.contains('oculto')).length;
      const manos = [...clon.querySelectorAll('.cal-cursor')].filter(e => getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none' && !e.classList.contains('pasado') && !e.classList.contains('oculto')).length;
      return { visibles, manos };
    }));
    assert.ok(r[0].visibles >= 3, `lista tachada: ${JSON.stringify(r[0])}`);
    assert.ok(r[1].visibles >= 3, `tachar_despues: ${JSON.stringify(r[1])}`);
    assert.ok(r[2].visibles >= 1, `~~idea~~: ${JSON.stringify(r[2])}`);
    assert.equal(r[3].manos, 1, `calificación: solo la mano de la última fila (${JSON.stringify(r[3])})`);
  });
});

test('foco r4: detrás de una lista centrada de 3 renglones la frase queda centrada (≤ 120 px) y, si pisa un renglón, el fondo va a ≤ 0.12', { timeout: 120_000 }, async () => {
  const items = ['Tomas de stock', 'Párrafos en pantalla', 'Música encima de tu voz'].map(texto => ({ texto, tachado: true }));
  await conDeck(base([{ tipo: 'lista', items }, { tipo: 'foco', texto: 'Tus tomas, una frase y música bajita.' }]), async page => {
    const m = await page.evaluate(() => {
      const lam = window.PZ.lams[1], L = lam.getBoundingClientRect(), f = lam.querySelector('.foco-frase .nota').getBoundingClientRect();
      const fondo = [...lam.querySelectorAll('.escena.clon .item span')].map(e => e.getBoundingClientRect());
      return { centro: (f.top + f.bottom) / 2 - L.top, choca: fondo.some(q => q.top < f.bottom && q.bottom > f.top), op: +getComputedStyle(lam.querySelector('.escena.clon')).opacity };
    });
    assert.ok(Math.abs(m.centro - 540) <= 120, JSON.stringify(m));
    if (m.choca) assert.ok(m.op <= 0.12, JSON.stringify(m));
  });
});

// ---------- ronda 4: el sello esquiva el contenido ----------
test('sello r4: sin posición no cae sobre el texto; con sello_pos se corre dentro de su lado; lejos del subrayado; sobre su emoji es a propósito', { timeout: 180_000 }, () => {
  const texto = 'Dices a qué hora cierras\ny ahí se acaba la plática';
  const r = qa(base([
    { id: 'sin-pos', tipo: 'idea', emoji: '📅', texto, sello: 'Cerrado' },
    { id: 'derecha', tipo: 'idea', emoji: '📅', texto, sello: 'Cerrado', sello_pos: 'derecha' },
    { id: 'cifra', tipo: 'cifra', lineas: ['2 videos × 4 semanas', '=', '__8 videos al mes__'], sello: 'Sin cara' },
    { id: 'cifra-ab', tipo: 'cifra', lineas: ['2 videos × 4 semanas', '=', '__8 videos al mes__'], sello: 'Sin cara', sello_pos: 'abajo-derecha' },
    { id: 'sobre-emoji', tipo: 'idea', emoji: '📅', texto: 'Tu agenda', sello: 'Lleno', sello_sobre: 'emoji' },
  ]));
  const deSello = r.errores.filter(e => /sello/.test(e));
  assert.deepEqual(deSello, [], deSello.join('\n'));
  assert.ok(!r.avisos.some(a => /queda pegado a un subrayado/.test(a)), r.avisos.join('\n'));
});

test('sello r4: QA marca el sello que corta un subrayado (sello_sobre el texto subrayado)', { timeout: 120_000 }, () => {
  const r = qa(base([{ id: 'corta', tipo: 'idea', emoji: '💰', texto: 'Esto es __lo importante__ hoy', sello: 'Ojo', sello_sobre: 'texto' }]));
  assert.ok(r.errores.some(e => /corta .*subrayado/.test(e)), r.errores.join('\n'));
  assert.ok(r.errores.some(e => /el sello va sobre «texto»: cambia el ancla/.test(e)), r.errores.join('\n'));
});

// ---------- ronda 4: flujo «A + B = C», tarjeta y retornos [28:40, 35:10, 12:45] ----------
test('flujo r4: los signos quedan a la mitad entre emojis (±4 px) y a su altura; el arco de retorno y su etiqueta no pisan etiquetas', { timeout: 120_000 }, async () => {
  await conDeck(base([
    { tipo: 'flujo', flechas: [{ signo: '+' }, { signo: '=' }], nodos: [{ emoji: '👊', etiqueta: 'Tú' }, { emoji: '🤖', etiqueta: 'IA especializada' }, { emoji: '📦', etiqueta: 'Producto', tarjeta: true }] },
    { tipo: 'flujo', nodos: [{ emoji: '🤳', etiqueta: 'Creador' }, { emoji: '📦', etiqueta: 'Producto' }, { emoji: '👥', etiqueta: 'Su audiencia' }, { emoji: '💰', etiqueta: 'Dinero' }],
      aparte: { emoji: '🙋', etiqueta: 'Tú' }, retornos: [{ desde: 3, hasta: 0, tono: 'n', etiqueta: '70%', emoji: '💵' }, { desde: 3, hasta: 'aparte', tono: 'v', etiqueta: '30%', emoji: '💵' }] },
  ]), async (page, p) => {
    const m = await page.evaluate(() => {
      const [a, b] = window.PZ.lams, c = e => { const r = e.getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, r }; };
      const emo = [0, 1, 2].map(i => c(a.querySelector(`[data-a="n${i}"] .emo`)));
      const sg = [...a.querySelectorAll('.signo')].map(c);
      const sinFlechas = a.querySelectorAll('.capa-mano path[data-clase="flecha"]').length;
      const etq = [...b.querySelectorAll('.etiqueta')].map(e => e.getBoundingClientRect());
      const rets = [...b.querySelectorAll('.retorno-et')].map(e => e.getBoundingClientRect());
      const cruza = (u, v) => u.left < v.right && u.right > v.left && u.top < v.bottom && u.bottom > v.top;
      const arcos = [...b.querySelectorAll('.capa-mano path[data-estilo="retorno"]')];
      const L = b.getBoundingClientRect();
      const golpes = arcos.some(pth => { const t = pth.getTotalLength(); for (let s = 0; s <= t; s += 8) { const q = pth.getPointAtLength(s); if (etq.some(r => q.x + L.left > r.left && q.x + L.left < r.right && q.y + L.top > r.top && q.y + L.top < r.bottom)) return true; } return false; });
      return { dx: sg.map((s, i) => Math.abs(s.x - (emo[i].x + emo[i + 1].x) / 2)), dy: sg.map((s, i) => Math.abs(s.y - (emo[i].y + emo[i + 1].y) / 2)), sinFlechas, arcos: arcos.length,
        etRet: rets.some(r => etq.some(e => cruza(r, e))), golpes, tarjeta: !!a.querySelector('.nodo-tarjeta') };
    });
    assert.ok(m.dx.every(d => d <= 4) && m.dy.every(d => d <= 4), JSON.stringify(m));
    assert.equal(m.sinFlechas, 0, 'con signo no hay flecha');
    assert.equal(m.arcos, 2);
    assert.equal(m.etRet, false, JSON.stringify(m));
    assert.equal(m.golpes, false, JSON.stringify(m));
    assert.ok(m.tarjeta);
  });
});

// ---------- ronda 4: anotaciones comunes con flecha, flecha que entra desde fuera y flechas convergentes ----------
test('anotaciones r4: nota con gancho hacia la captura (cap0-circulo), flecha que entra desde el borde, converger en la tabla; un ancla que no existe avisa', { timeout: 120_000 }, async () => {
  const dir = tmp();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(path.join(dir, 'cap.png'), png);
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(base([
    { tipo: 'prueba', capturas: [{ src: 'cap.png', alto: 500, circulo: [10, 10, 40, 20] }], anotaciones: [{ texto: '41 millones', a: 'cap0-circulo' }, { a: 'cap0', entra: 'derecha' }] },
    { tipo: 'tabla', revelar: 'todo', columnas: ['A', 'B'], filas: [{ etiqueta: 'x', celdas: ['1', '2'] }, { etiqueta: 'y', celdas: ['3', '4'] }], converger: { columna: 1, texto: '¿Ves por qué?' } },
    { tipo: 'idea', emoji: '🚀', texto: 'Hola', anotaciones: [{ texto: 'Nota', a: 'noexiste' }] },
  ])));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  const { browser, page, avisos } = await abrir(p.htmlPath, p.W, p.H);
  try {
    const m = await page.evaluate(() => window.PZ.lams.map(l => ({
      ganchos: [...l.querySelectorAll(':scope > .capa-mano path[data-estilo="curva-roja"]')].map(q => q.dataset.de),
      entradas: l.querySelectorAll(':scope > .capa-mano path[data-estilo="entrada"]').length,
      converge: l.querySelectorAll(':scope > .capa-mano path[data-estilo="converge"]').length,
      nota: (() => { const n = l.querySelector(':scope > .anotacion'); if (!n) return null; const r = n.getBoundingClientRect(), L = l.getBoundingClientRect(); return [r.left - L.left, r.top - L.top, r.right - L.left, r.bottom - L.top]; })(),
    })));
    assert.deepEqual(m[0].ganchos, ['anota0']);
    assert.equal(m[0].entradas, 1);
    assert.ok(m[0].nota && m[0].nota[0] >= 0 && m[0].nota[2] <= 1920, JSON.stringify(m[0]));
    assert.equal(m[1].converge, 2);
    assert.ok(avisos.some(a => /lámina 3: falta el ancla «noexiste» \(anclas de esta lámina: .*emoji/.test(a)), avisos.join('\n'));
  } finally { await browser.close(); }
  // el contrato limpia un ancla con caracteres raros y una posición que no es px ni %
  const { sanearDeck } = await import('../scripts/lib/contrato.mjs');
  const r = sanearDeck({ laminas: [{ tipo: 'idea', texto: 'x', anotaciones: [{ texto: 'n', a: 'x"><b', x: 'calc(1px)' }] }] });
  assert.equal(r.deck.laminas[0].anotaciones[0].a, undefined);
  assert.equal(r.deck.laminas[0].anotaciones[0].x, undefined);
});

// ---------- ronda 4: el demo en 9:16 (beta) sin texto encimado en la tabla ni gráficas en una franja chica ----------
test('9:16 r4: el demo en vertical: la tabla-marcador sin celdas desbordadas ni encimadas; escala, renuncia, elige, barras y botón sin «< 35%» ni reducción', { timeout: 300_000 }, () => {
  const demo = JSON.parse(fs.readFileSync(path.join(DIR_SKILL, 'ejemplos', 'demo', 'deck.json'), 'utf8'));
  const ids = ['marcador', 'escala', 'renuncia', 'elige', 'barras', 'boton'];
  const r = qa({ ...demo, formato: '9:16', laminas: demo.laminas.filter(l => ids.includes(l.id)) });
  const de = id => [...r.errores, ...r.avisos].filter(m => m.includes(`(${id})`));
  assert.deepEqual(de('marcador').filter(m => /celda|se enciman/.test(m)), []);
  for (const id of ids) assert.deepEqual(de(id).filter(m => /del alto|se redujo/.test(m)), [], id);
});

test('tabla r4: QA da error si el texto de una celda sale de su caja (una palabra larga en una columna angosta)', { timeout: 120_000 }, () => {
  const cols = Array.from({ length: 8 }, (_, i) => `Col${i}`);
  const r = qa(base([{ tipo: 'tabla', revelar: 'todo', columnas: cols, filas: [{ etiqueta: 'x', celdas: cols.map(() => 'Anticonstitucionalmente') }] }]));
  assert.ok(r.errores.some(e => /se sale de su celda/.test(e)), r.errores.join('\n'));
});
