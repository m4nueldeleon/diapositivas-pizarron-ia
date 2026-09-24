// Estilo e íconos (ronda 1): sello opaco y anclado, puntas en V, mapa con ✅ a color, tarjetas alineadas,
// nota al margen corta, anotación de rejilla con gancho, oscura en blanco, par de emojis, flujo sin flechas.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';
import { marcar, plano, tamTexto } from '../scripts/lib/markup.mjs';
import { Emojis, bajoContraste } from '../scripts/lib/emoji.mjs';
import { validarDeck, sanearDeck } from '../scripts/lib/contrato.mjs';
import { LAYOUTS } from '../scripts/lib/construir.mjs';

async function conDeck(deck, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-estilo-'));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  const { browser, page, avisos } = await abrir(p.htmlPath, p.W, p.H);
  try { return await fn(page, p, avisos); } finally { await browser.close(); }
}

test('marcar: rango de cifras sin corte, cursiva, remate; plano y tamTexto los entienden', () => {
  assert.ok(marcar('$10k–50k').includes('10k–\u2060' + '50k'), 'word joiner tras el guion del rango');
  assert.ok(marcar('de 2-6 meses').includes('2-\u2060' + '6'));
  assert.ok(!marcar('1,000 - 500').includes('\u2060'), 'una resta con espacios no es un rango');
  assert.equal(marcar('Una *objeción* aquí'), 'Una <i>objeción</i> aquí');
  assert.ok(!marcar('5 * 3 * 2').includes('<i>'));
  assert.ok(marcar('Eso es un ^^plan **fuerte**^^').includes('<span class="remate">plan <b>fuerte</b></span>'));
  assert.equal(plano('*hola* ^^mundo^^ {o:$25,000}'), 'hola mundo $25,000');
  assert.ok(marcar('{o:$25,000}').includes('tono-o'));
  // el remate no cuenta para el tamaño de la entrada; más de 25 palabras baja a «compacto»
  assert.equal(tamTexto('Eso es lo que yo llamo un ^^plan de monetización que funciona siempre y en todos lados^^'), 'grande');
  assert.equal(tamTexto(Array(27).fill('palabra').join(' ')), 'compacto');
});

test('emoji: ✅ dibujada igual en Apple y Fluent; tabla de bajo contraste', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-emo-'));
  const f = new Emojis({ modo: 'fluent', dirSalida: dir });
  assert.ok(f.glifo('✅').startsWith('<svg'));
  assert.ok(f.glifo('✅️').startsWith('<svg'));
  assert.ok(new Emojis({ modo: 'apple' }).html('no:🎥').includes('insignia izq no'));
  assert.equal(bajoContraste('🏷️', 'apple', 'claro'), '💵');
  assert.equal(bajoContraste('💬', 'fluent', 'claro'), '📲');
  assert.equal(bajoContraste('🗨️', 'apple', 'oscura'), '💬');
  assert.equal(bajoContraste('☎️', 'apple', 'oscura'), '');
});

test('contrato: el par de emojis solo en idea; flecha «ninguna»; campos nuevos con listas cerradas', () => {
  const tipos = Object.keys(LAYOUTS);
  assert.deepEqual(validarDeck({ laminas: [{ tipo: 'idea', emoji: ['no:📚', 'si:🤖'], texto: 'x' }] }, tipos), []);
  assert.ok(validarDeck({ laminas: [{ tipo: 'objeto', emoji: ['📚', '🤖'] }] }, tipos).some(e => /solo existe en idea/.test(e)));
  const { deck, avisos } = sanearDeck({ laminas: [{ tipo: 'flujo', flecha: 'ninguna', nodos: ['a'], anclar: 'lado', fondo: 'rosa', apagar_emoji: 7 }] });
  assert.equal(deck.laminas[0].flecha, 'ninguna');
  assert.equal(deck.laminas[0].apagar_emoji, 1);
  assert.equal(avisos.length, 2, avisos.join('\n'));   // anclar y fondo fuera de su lista
});

test('render: sello opaco y centrado en la rejilla; mapa con ✅ a color y sin ruta; tarjetas alineadas', { timeout: 120_000 }, async () => {
  await conDeck({ emoji: 'apple', marca: false, laminas: [
    { tipo: 'rejilla', emoji: '📦', total: 300, anotacion: 'Son 300', sello: 'Mucha habilidad', encabezado: 'Para ganar **$10k**…', encabezado_estilo: 'frase' },
    { tipo: 'pasos', iconos: ['🔍', '🛠️', '🚀'], etiquetas: ['Encontrar', 'Construir', 'Lanzar'], activo: 3, hechos: [1, 2] },
    { tipo: 'tarjetas', items: [{ emoji: '⚡', texto: 'Velocidad de respuesta al cliente' }, { emoji: '💵', texto: 'Costo' }, { emoji: '🌙', texto: 'Horario completo del día' }] },
  ] }, async page => {
    const r = await page.evaluate(() => {
      const [a, b, c] = window.PZ.lams;
      const s = a.querySelector('.sello'), t = a.querySelector('.sello-tinta'), rj = a.querySelector('[data-a="rejilla"]');
      const cs = getComputedStyle(s), ct = getComputedStyle(t);
      const sb = s.getBoundingClientRect(), rb = rj.getBoundingClientRect();
      const fina = a.querySelector('path[data-estilo="fina"]');
      const opac = e => { let o = 1; for (let x = e; x && x.nodeType === 1; x = x.parentElement) o *= +getComputedStyle(x).opacity; return o; };
      const oks = [...b.querySelectorAll('.emo')].filter(e => e.innerHTML.includes('pz-ok'));
      const tops = [...c.querySelectorAll('.tarjeta .emo')].map(e => e.getBoundingClientRect().top);
      return {
        maskSello: cs.maskImage || cs.webkitMaskImage, maskTinta: ct.maskImage || ct.webkitMaskImage, fondo: cs.backgroundColor,
        dx: Math.abs((sb.left + sb.right) / 2 - (rb.left + rb.right) / 2), dy: Math.abs((sb.top + sb.bottom) / 2 - (rb.top + rb.bottom) / 2),
        prop: sb.width / rb.width, fina: fina ? fina.getTotalLength() : 0,
        oks: oks.map(opac), ruta: b.querySelectorAll('.capa-mano path').length, tops,
      };
    });
    assert.equal(r.maskSello, 'none', 'la etiqueta del sello no lleva máscara (se veía el contenido a través)');
    assert.notEqual(r.maskTinta, 'none', 'la tinta sí lleva grano');
    assert.equal(r.fondo, 'rgb(255, 255, 255)');
    assert.ok(r.dx <= 10 && r.dy <= 10, `sello descentrado ${r.dx},${r.dy}`);
    assert.ok(r.prop > 0.45 && r.prop < 0.8, `el sello mide ${r.prop.toFixed(2)} de la rejilla (≈0.6)`);
    assert.ok(r.fina >= 100, `la flecha de la anotación mide ${r.fina} px`);
    assert.equal(r.oks.length, 2);
    assert.ok(r.oks.every(o => o === 1), `la ✅ de los hechos hereda la opacidad: ${r.oks}`);
    assert.equal(r.ruta, 0, 'el mapa con íconos no lleva ruta punteada por omisión');
    assert.ok(Math.max(...r.tops) - Math.min(...r.tops) <= 2, `íconos desalineados: ${r.tops}`);
  });
});

test('render: cita con gancho corto al primer renglón, rango sin partir; oscura en blanco; par, flujo sin flechas, lista arriba', { timeout: 120_000 }, async () => {
  await conDeck({ emoji: 'apple', marca: false, laminas: [
    { tipo: 'cita', emoji: '📝', texto: '«Así es **EXACTAMENTE** como puedes ganar $10k–50k con un producto hecho para tu audiencia»' },
    { tipo: 'idea', oscura: true, texto: 'Hoy: __$1,500__ y no ~~$9,000~~' },
    { tipo: 'idea', emoji: ['no:📚', 'si:🤖'], apagar_emoji: 0, texto: 'La IA hace el trabajo pesado' },
    { tipo: 'flujo', flecha: 'ninguna', nodos: [{ emoji: '📦', etiqueta: '1. Qué' }, { emoji: '💵', etiqueta: '2. Precio' }, { emoji: '📈', etiqueta: '3. Crece' }] },
    { tipo: 'lista', encabezado: 'Sin:', vineta: 'x', items: ['uno', 'dos', 'tres'] },
    { tipo: 'chat', mensajes: [{ de: 'otro', texto: 'Hola [nombre]' }], avatar_otro: '🤖' },
    { tipo: 'boton', boton: 'Generar', emoji: '🤖' },
  ] }, async page => {
    const r = await page.evaluate(() => {
      const L = window.PZ.lams;
      const rel = (e, lam) => { const q = e.getBoundingClientRect(), b = lam.getBoundingClientRect(); return { x: q.left - b.left, y: q.top - b.top, w: q.width, h: q.height }; };
      // cita
      const cita = L[0].querySelector('[data-a="cita"]'), fl = L[0].querySelector('path[data-clase="flecha"]');
      const tw = document.createTreeWalker(cita, NodeFilter.SHOW_TEXT); const tops = {}; const rs = [];
      for (let n; (n = tw.nextNode());) {
        const rg = document.createRange(); rg.selectNodeContents(n);
        rs.push(...[...rg.getClientRects()].filter(q => q.width > 2));
        for (const k of ['10k', '50k']) { const i = n.nodeValue.indexOf(k); if (i >= 0) { const g = document.createRange(); g.setStart(n, i); g.setEnd(n, i + 3); tops[k] = g.getBoundingClientRect().top; } }
      }
      const fin = fl.getPointAtLength(fl.getTotalLength()), Lb = L[0].getBoundingClientRect();
      const top = Math.min(...rs.map(q => q.top)), primera = rs.filter(q => q.top < top + 6);
      const x0 = Math.min(...primera.map(q => q.left)), x1 = Math.max(...primera.map(q => q.right));
      const linea = { x: x0 - Lb.left, w: x1 - x0 };
      // oscura
      const trazos = [...L[1].querySelectorAll('.capa-mano path[data-trazo]')].map(p => ({ dur: p.dataset.dur, c: p.getAttribute('stroke') }));
      return {
        punta: fin.x, linea, largo: fl.getTotalLength(), mismaLinea: Math.abs(tops['10k'] - tops['50k']) < 4,
        trazos, par: L[2].querySelectorAll('.emo').length, parTxt: L[2].innerHTML.includes(',si:'),
        flechas: L[3].querySelectorAll('path[data-clase="flecha"]').length,
        arriba: L[4].querySelector(':scope > .lienzo').classList.contains('arriba'), itemY: rel(L[4].querySelector('.item'), L[4]).y,
        hueco: getComputedStyle(L[5].querySelector('.hueco')).backgroundColor, av: L[5].querySelectorAll('.av-emo .emo').length,
        emo: rel(L[6].querySelector('.boton-ui .emo'), L[6]), onda: parseFloat(L[6].querySelector('.onda').style.left),
      };
    });
    assert.ok(r.punta >= r.linea.x && r.punta <= r.linea.x + r.linea.w * 0.35, `la flecha de la cita cae en ${r.punta}, renglón ${JSON.stringify(r.linea)}`);
    assert.ok(r.largo <= 400, `la flecha de la cita barre ${Math.round(r.largo)} px`);
    assert.ok(r.mismaLinea, '«10k–50k» se partió');
    assert.ok(r.trazos.some(t => t.dur === '280' && t.c === '#ffffff'), 'sobre oscura el subrayado va en blanco');
    assert.ok(r.trazos.some(t => t.dur === '240' && t.c === '#ff4d57'), 'sobre oscura el tachón va en rojo claro');
    assert.equal(r.par, 2); assert.equal(r.parTxt, false);
    assert.equal(r.flechas, 0);
    assert.ok(r.arriba && r.itemY < 400, `la lista no arranca arriba (y=${r.itemY})`);
    assert.equal(r.hueco, 'rgb(249, 217, 50)');
    assert.equal(r.av, 1);
    assert.ok(r.onda >= r.emo.x + r.emo.w, 'el dedo cae sobre el emoji del botón');
  });
});
