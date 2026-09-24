// Regresiones visuales: se renderiza en Chromium y se mide el DOM (capa a mano, sello, cursor) y el QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararSalida, abrir, DIR_SKILL } from '../scripts/lib/pipeline.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pz-qa-'));
function qa(deckDir) {
  const r = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts', 'qa.mjs'), deckDir, '--salida', tmp(), '--json'], { encoding: 'utf8' });
  const i = r.stdout.indexOf('{');
  return JSON.parse(r.stdout.slice(i));
}
async function conDeck(deck, fn) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  const { browser, page } = await abrir(p.htmlPath, p.W, p.H);
  try { return await fn(page, p); } finally { await browser.close(); }
}
const fx = n => path.join(DIR_SKILL, 'pruebas', 'fixtures', n);

test('QA: las reglas nuevas disparan en el fixture de defectos', { timeout: 120_000 }, () => {
  const r = qa(fx('qa-reglas'));
  const hay = (lista, re) => lista.some(e => re.test(e));
  assert.ok(hay(r.errores, /cursor-tapa.*el cursor tapa/), 'cursor');
  assert.ok(hay(r.errores, /flecha-tacha.*flecha atraviesa/), 'flecha');
  assert.ok(hay(r.errores, /marca-abierta.*marca sin cerrar/), 'marca literal');
  assert.ok(hay(r.errores, /sello-largo.*el sello tapa/), 'sello');
  assert.ok(hay(r.avisos, /sello-largo.*se redujo/), 'sello largo');
  assert.ok(hay(r.errores, /voz-corta.*1 textos y la lámina 2 pasos/), 'voz');
  assert.ok(hay(r.avisos, /azul.*contraste bajo \(2\.\d:1/), 'contraste');
  assert.ok(hay(r.avisos, /emoji-bajo.*bajo contraste.*🏷 → 💵/), 'emoji de bajo contraste');
  assert.ok(hay(r.avisos, /oscura-lista.*solo oscurece la revelación/), 'oscura fuera de una revelación');
  assert.ok(hay(r.avisos, /objecion-lista.*la objeción va dentro/), 'objeción metida en una lista');
  // un error por DATO pendiente, no por aparición; «[nombre]» en minúsculas es plantilla y no cuenta
  assert.deepEqual(Object.keys(r.pendientes).sort(), ['[DÍAS]', '[PRECIO]']);
  assert.equal(r.errores.filter(e => /dato pendiente/.test(e)).length, 2);
});

test('QA: sello sobre el texto y firma sobre una celda de la tabla (deck de defectos de la ronda 1)', { timeout: 120_000 }, () => {
  const r = qa(fx('defectos-visuales'));
  assert.ok(r.errores.some(e => /sello-texto.*el sello tapa/.test(e)));
  assert.ok(r.avisos.some(e => /tabla-firma.*la firma cae dentro de la celda/.test(e)));
  assert.ok(r.errores.some(e => /voz-de-mas.*3 textos y la lámina 1 pasos/.test(e)));
  // lo que arregló el motor ya no aparece: marcas partidas, cursor sobre «mensaje», codo que tacha
  assert.ok(!r.errores.some(e => /marca sin cerrar|cursor tapa|flecha atraviesa/.test(e)), r.errores.join('\n'));
});

test('QA 9:16: un texto centrado arriba de la franja de Reels no se marca por la caja de ancho completo (ronda 1)', { timeout: 120_000 }, () => {
  // «40 fotos… y no elige ninguna» y «y mándaselo a quien vende contigo»: la tinta queda lejos de los
  // botones, pero la caja del bloque llegaba al borde derecho y disparaba el aviso
  const r = qa(fx('zona-reels'));
  assert.ok(!r.avisos.some(e => /zona que tapan/.test(e)), r.avisos.join('\n'));
});

test('QA: el demo no dispara ninguna regla de sello, cursor, flecha, marcas ni contraste', { timeout: 180_000 }, () => {
  const r = qa(path.join(DIR_SKILL, 'ejemplos', 'demo'));
  assert.deepEqual(r.errores, []);
  assert.ok(!r.avisos.some(e => /sello|cursor|flecha|contraste|firma cae/.test(e)), r.avisos.join('\n'));
});

test('capa a mano: un renglón = un trazo; puntas en V gruesas; codo que no tacha el origen', { timeout: 120_000 }, async () => {
  await conDeck({ emoji: 'apple', marca: false, laminas: [
    { tipo: 'lista', vineta: 'x', items: [{ texto: 'Mandar el catálogo completo de cuarenta fotos con precios y medidas a cada persona que te escribe', tachado: true }] },
    { tipo: 'lista', vineta: 'x', items: [{ texto: 'Corto', tachado: true }] },
    { tipo: 'idea', texto: 'Un subrayado con __{v:color verde}__ adentro' },
    { tipo: 'idea', texto: 'Un ~~tachón **con negrita** dentro~~ aquí' },
    { tipo: 'bifurcacion', origen: { texto: 'Tu cliente potencial de hoy' }, ramas: [{ valor: 'Jueves' }, { valor: 'Viernes' }], separacion: 260 },
  ] }, async page => {
    const cuenta = await page.evaluate(() => window.PZ.lams.map(l => ({
      tach: l.querySelectorAll('.capa-mano path[data-dur="240"]:not([data-pase])').length,
      sub: l.querySelectorAll('.capa-mano path[data-dur="280"]').length,
    })));
    assert.equal(cuenta[0].tach, 2);
    assert.equal(cuenta[1].tach, 1);
    assert.equal(cuenta[2].sub, 1);
    assert.equal(cuenta[3].tach, 1);
    const codo = await page.evaluate(() => {
      const lam = window.PZ.lams[4], L = lam.getBoundingClientRect();
      const t = lam.querySelector('[data-a="o"]').getBoundingClientRect();
      const A = { x: t.left - L.left, y: t.top - L.top, w: t.width, h: t.height };
      const puntas = [...lam.querySelectorAll('path[data-clase="punta"]')].map(p => ({ fill: getComputedStyle(p).fill, ancho: +p.getAttribute('stroke-width') }));
      const dentro = [...lam.querySelectorAll('path[data-clase="flecha"]')].some(p => {
        const n = p.getTotalLength();
        for (let s = 0; s <= n; s += 4) { const q = p.getPointAtLength(s); if (q.x > A.x && q.x < A.x + A.w && q.y > A.y && q.y < A.y + A.h) return true; }
        return false;
      });
      return { puntas, dentro };
    });
    assert.equal(codo.puntas.length, 2);
    // la punta es una V abierta del mismo grosor que el trazo (~10 px, c_0635), no un triángulo hueco de 1 px
    assert.ok(codo.puntas.every(q => q.fill === 'none' && q.ancho >= 9), JSON.stringify(codo.puntas));
    assert.equal(codo.dentro, false, 'el codo atraviesa el texto de origen');
  });
});

test('sello: cabe en 9:16, se centra en su ancla; clic_pos mueve el cursor', { timeout: 120_000 }, async () => {
  await conDeck({ formato: '9:16', emoji: 'apple', marca: false, laminas: [
    { tipo: 'rejilla', emoji: '📦', total: 30, columnas: 5, sello: 'Ventas perdidas' },
    { tipo: 'idea', emoji: '💰', texto: 'Frase', sello: 'Ojo', sello_sobre: 'emoji' },
    { tipo: 'boton', boton: 'Enviar mensaje', clic_pos: [0.1, 0.1] },
  ] }, async page => {
    const r = await page.evaluate(() => {
      const [a, b, c] = window.PZ.lams, W = a.offsetWidth;
      const s = a.querySelector('.sello').getBoundingClientRect(), La = a.getBoundingClientRect();
      const sb = b.querySelector('.sello').getBoundingClientRect(), e = b.querySelector('[data-a="emoji"]').getBoundingClientRect();
      const bt = c.querySelector('.boton-ui').getBoundingClientRect(), on = c.querySelector('.onda');
      return { dentro: s.left - La.left >= 0 && s.right - La.left <= W, dx: Math.abs((sb.left + sb.right) / 2 - (e.left + e.right) / 2),
        clicX: parseFloat(on.style.left) - (bt.left - c.getBoundingClientRect().left), ancho: bt.width };
    });
    assert.ok(r.dentro, 'el sello se sale del lienzo de 1080');
    assert.ok(r.dx < 2, 'el sello no se centró en su ancla');
    assert.ok(Math.abs(r.clicX - r.ancho * 0.1) < 2, 'clic_pos no movió el cursor');
  });
});

test('pasos: texto_paso, nota_paso, clic_paso y revelar:"pasos" se respetan', { timeout: 120_000 }, async () => {
  await conDeck({ emoji: 'apple', marca: false, laminas: [
    { tipo: 'pasos', n: 3, texto: 'El sistema', nota: 'nota', texto_paso: 2, nota_paso: 3, clic: 1, clic_paso: 2 },
    { tipo: 'pasos', n: 3, revelar: 'pasos', texto: 'El sistema' },
    { tipo: 'idea', emoji: '💰', texto: 'x', texto_paso: 1 },
    { tipo: 'opciones', items: ['Sí', 'No'], texto: 'x', clic_paso: 2 },
  ] }, async (page, p) => {
    const r = await page.evaluate(() => window.PZ.lams.map(l => ({
      t: l.querySelector('.t') && l.querySelector('.t').dataset.p, n: l.querySelector('.nota') && l.querySelector('.nota').dataset.p,
      cur: l.querySelector('.cursor') && l.querySelector('.cursor').dataset.p,
      cols: [...l.querySelectorAll('.fila > .pila[data-p], .fila-pasos > .pila[data-p]')].map(e => e.dataset.p),
    })));
    assert.deepEqual([r[0].t, r[0].n, r[0].cur], ['2', '3', '2']);
    assert.equal(p.pasos[0], 4);
    assert.deepEqual(r[1].cols, ['0', '1', '2']);
    assert.equal(r[1].t, '3');
    assert.equal(r[2].t, '1');
    assert.equal(r[3].cur, '2');
  });
});

test('tarjetas: 4 en 16:9 y en 9:16 caben sin reducir la letra', { timeout: 120_000 }, async () => {
  for (const formato of ['16:9', '9:16']) {
    await conDeck({ formato, emoji: 'apple', marca: false, laminas: [{ tipo: 'tarjetas', items: [
      { emoji: '⚡', texto: 'Velocidad de respuesta' }, { emoji: '🌙', texto: 'Horario completo' }, { emoji: '👥', texto: 'Chats a la vez' }, { emoji: '💵', texto: 'Costo al mes' }] }] },
    async page => { assert.equal(await page.evaluate(() => window.PZ.lams[0].dataset.encaje || '1'), '1', formato); });
  }
});

// ---------- ronda 3 ----------
test('QA r3: tecla tapada, emojis encimados, flecha sobre emoji, texto cortado, foco sobre texto, sello sobre avatar, SVG encimados y emoji sobre pieza de color', { timeout: 180_000 }, () => {
  const r = qa(fx('defectos-r3'));
  const hay = (lista, re) => lista.some(e => re.test(e));
  assert.ok(hay(r.errores, /corte-borde.*se corta en el borde del lienzo/), 'texto cortado');
  assert.ok(hay(r.errores, /tecla-tapada.*el cursor tapa el número de la tecla/), 'tecla');
  assert.ok(hay(r.errores, /emojis-encimados.*emojis se enciman/), 'emojis encimados');
  assert.ok(hay(r.avisos, /flecha-emoji.*una flecha atraviesa un emoji/), 'flecha sobre emoji');
  assert.ok(hay(r.errores, /foco-encima.*se escribe sobre/), 'foco sobre texto');
  assert.ok(hay(r.errores, /sello-avatar.*tapa un emoji o un avatar/), 'sello sobre avatar');
  assert.ok(hay(r.errores, /svg-encimados.*se enciman «\$1,000,000» y «\$2,000,000»/), 'SVG encimados');
  assert.ok(hay(r.avisos, /stack-oscuro.*casi no se ve.*🎓.*🕶/), 'emoji sobre pieza de color');
});

test('QA r3: los mismos casos escritos como dice LAYOUTS (chat con sello_sobre, teclas con etiquetas, foco, 20 personas, semanas juntas, stack) salen limpios', { timeout: 180_000 }, () => {
  const r = qa(fx('limpio-r3'));
  assert.deepEqual(r.errores, []);
  assert.deepEqual(r.avisos, []);
  assert.equal(r.nota, 100);
});

test('QA r3: el sello de un chat se pega a la burbuja sin tapar su texto ni el avatar', { timeout: 120_000 }, async () => {
  const deck = JSON.parse(fs.readFileSync(path.join(fx('limpio-r3'), 'deck.json'), 'utf8'));
  await conDeck({ ...deck, laminas: deck.laminas.slice(0, 1) }, async page => {
    const m = await page.evaluate(() => {
      const lam = window.PZ.lams[0]; window.PZ.mostrar(lam, 99, Infinity);
      const s = lam.querySelector('.sello').getBoundingClientRect(), b = lam.querySelector('[data-a="m1"]').getBoundingClientRect();
      const av = [...lam.querySelectorAll('.yo-av, .otro-av')].map(e => e.getBoundingClientRect());
      const cruza = (a, c) => a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top;
      return { anchoSello: s.width, anchoBurbuja: b.width, pegado: s.top < b.bottom + 40 && s.bottom > b.bottom, tocaAvatar: av.some(a => cruza(a, s)) };
    });
    assert.ok(m.anchoSello < m.anchoBurbuja * 0.8, JSON.stringify(m));
    assert.ok(m.pegado, 'el sello queda pegado al borde de la burbuja');
    assert.equal(m.tocaAvatar, false);
  });
});

test('QA r3: estado del informe: un vsl sin errores pero sin prueba ni objeción no es «listo»; --estricto sale con 3', { timeout: 120_000 }, () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ emoji: 'apple', marca: false, pieza: 'libre', laminas: [
    { tipo: 'idea', emoji: '💡', texto: 'Una idea', voz: 'Una idea corta.' }, { tipo: 'boton', boton: 'Aplica aquí', voz: 'Aplica.' }] }));
  const r = qa(dir);
  assert.equal(r.estado, 'listo', JSON.stringify(r));
  assert.deepEqual(r.falta_para_final, []);
  const deck = JSON.parse(fs.readFileSync(path.join(dir, 'deck.json'), 'utf8'));
  // en_vivo baja a aviso la duración corta: aquí solo interesa lo que falta para vender
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ ...deck, pieza: 'vsl', en_vivo: true }));
  const v = qa(dir);
  assert.equal(v.errores.length, 0, v.errores.join('\n'));
  assert.ok(['bajo-90', 'falta-venta'].includes(v.estado), v.estado);
  assert.ok(v.falta_para_final.includes('prueba real'));
  const e = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts', 'qa.mjs'), dir, '--salida', tmp(), '--estricto'], { encoding: 'utf8' });
  assert.equal(e.status, 3, e.stdout);
});

test('QA r3: un hueco declarado a propósito es aviso y borrador, no error', { timeout: 120_000 }, () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ emoji: 'apple', marca: false, datos: { PRECIO: { pendiente: true, motivo: 'lo define dirección' } },
    laminas: [{ tipo: 'cifra', valor: 'Inversión: {{PRECIO}}' }, { tipo: 'idea', emoji: '💡', texto: 'Otra' }] }));
  const r = qa(dir);
  assert.ok(!r.errores.some(e => /dato pendiente/.test(e)), r.errores.join('\n'));
  assert.ok(r.avisos.some(a => /pendiente a propósito \[PRECIO\] \(lo define dirección\)/.test(a)));
  assert.equal(r.estado, 'borrador');
  assert.ok(r.por_confirmar.PRECIO && r.nota <= 90);
});

test('foco: con anclar:"arriba" la frase queda en la mitad superior; sin anclar busca el hueco del fondo', { timeout: 120_000 }, async () => {
  const fondo = { tipo: 'idea', texto: 'Tres renglones de texto grande\nque llenan el centro\nde la lámina de arriba abajo', tam_texto: 'grande' };
  await conDeck({ emoji: 'apple', marca: false, laminas: [fondo, { tipo: 'foco', anclar: 'arriba', texto: 'Arriba' }, fondo, { tipo: 'foco', texto: 'La frase del foco' }] }, async page => {
    const m = await page.evaluate(() => [1, 3].map(i => {
      const lam = window.PZ.lams[i], f = lam.querySelector('.foco-frase .nota').getBoundingClientRect(), L = lam.getBoundingClientRect();
      const fondo = [...lam.querySelectorAll('.escena.clon .t')].map(e => e.getBoundingClientRect());
      return { centro: (f.top + f.bottom) / 2 - L.top, choca: fondo.some(r => r.top < f.bottom && r.bottom > f.top) };
    }));
    assert.ok(m[0].centro < 540, JSON.stringify(m));
    assert.equal(m[1].choca, false, JSON.stringify(m));
  });
});
