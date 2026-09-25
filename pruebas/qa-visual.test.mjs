// Regresiones visuales: se renderiza en Chromium y se mide el DOM (capa a mano, sello, cursor) y el QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararSalida, abrir, DIR_SKILL } from '../scripts/lib/pipeline.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pz-qa-'));

test('QA r8: marcador de una letra en el stack intermedio e historial del primer render real', { timeout: 120_000 }, t => {
  const dir = tmp(); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca: false, emoji: 'apple', laminas: [
    { tipo: 'stack', id: 'oferta', items: [{ emoji: '🎁', texto: '[X]' }, { emoji: '📋', texto: 'Plan' }], remate: 'Todo junto' },
  ] }));
  const r = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts/render.mjs'), dir, '--borrador', '--qa'], { encoding: 'utf8' });
  assert.ok(fs.existsSync(path.join(dir, 'salida/qa.json')), r.stderr || r.stdout);
  const q = JSON.parse(fs.readFileSync(path.join(dir, 'salida/qa.json')));
  assert.ok(q.errores.some(e => /\[X\]/.test(e)), 'el remate no esconde el dato del paso anterior');
  assert.ok(q.pendientes_por_paso.some(p => p.datos['[X]']?.length));
  const h = JSON.parse(fs.readFileSync(path.join(dir, 'salida/calidad-historial.json')));
  assert.equal(h.qa_primer_render.nota, q.nota);
  assert.equal(h.qa_primer_render.deck_sha, q.deck_sha);
  assert.equal(h.renders[0].html_sha, q.html_sha);
});

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
  // r5: la firma de texto mide ~260 px y la tabla le deja 70 px abajo: ya no cae en la última fila (el error de QA se
  // prueba con una firma de logo en estilo-iconos-r5.test.mjs)
  assert.ok(!r.errores.concat(r.avisos).some(e => /tabla-firma.*firma/.test(e)), r.errores.join('\n'));
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
  assert.equal(v.estado, 'borrador');
  assert.ok(v.por_confirmar.FICHA_OFERTA, 'sin ficha comercial no se aprueba para vender');
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
  assert.equal(r.datos_por_confirmar.PRECIO.motivo, 'lo define dirección');
  assert.equal(r.estado, 'borrador');
  assert.ok(r.por_confirmar.PRECIO && r.nota <= 90);
});

test('foco: con anclar:"arriba" la frase queda en la mitad superior; sin anclar se queda centrada y, si pisa el fondo, lo baja a 0.1 [15:22]', { timeout: 120_000 }, async () => {
  const fondo = { tipo: 'idea', texto: 'Tres renglones de texto grande\nque llenan el centro\nde la lámina de arriba abajo', tam_texto: 'grande' };
  await conDeck({ emoji: 'apple', marca: false, laminas: [fondo, { tipo: 'foco', anclar: 'arriba', texto: 'Arriba' }, fondo, { tipo: 'foco', texto: 'La frase del foco' }] }, async page => {
    const m = await page.evaluate(() => [1, 3].map(i => {
      const lam = window.PZ.lams[i], f = lam.querySelector('.foco-frase .nota').getBoundingClientRect(), L = lam.getBoundingClientRect();
      const fondo = [...lam.querySelectorAll('.escena.clon .t')].map(e => e.getBoundingClientRect());
      return { centro: (f.top + f.bottom) / 2 - L.top, choca: fondo.some(r => r.top < f.bottom && r.bottom > f.top), op: +getComputedStyle(lam.querySelector('.escena.clon')).opacity };
    }));
    assert.ok(m[0].centro < 540, JSON.stringify(m));
    // sin un hueco a ≤ 120 px del centro, la frase no se va al pie: se queda centrada sobre el fondo a 0.1
    assert.ok(Math.abs(m[1].centro - 540) <= 120, JSON.stringify(m));
    assert.ok(!m[1].choca || m[1].op <= 0.12, JSON.stringify(m));
  });
});

test('foco: el hueco que busca la frase respeta la «fuente» del fondo (neuroventas r3, lámina 6)', { timeout: 120_000 }, async () => {
  const fondo = { tipo: 'cifra', arriba: 'Un paciente sin señales de emoción:', lineas: [{ texto: 'Elegir entre 2 fechas le tomó…', tam: '76px', peso: 500 }, { texto: 'Casi __30 minutos__', tam: '140px', peso: 800 }], fuente: 'Antonio Damasio, «El error de Descartes» (1994)' };
  await conDeck({ emoji: 'apple', marca: false, laminas: [fondo, { tipo: 'foco', texto: 'Sin emoción, tu cliente compara y compara… y no decide.', opacidad: 0.1 }] }, async page => {
    const m = await page.evaluate(() => {
      const lam = window.PZ.lams[1], fr = [...lam.querySelectorAll('.foco-frase .nota, .foco-frase .t')].map(e => e.getBoundingClientRect());
      const fu = lam.querySelector('.escena.clon .fuente').getBoundingClientRect();
      return { choca: fr.some(f => f.top < fu.bottom && f.bottom > fu.top), fr: fr.map(f => [f.top, f.bottom]), fu: [fu.top, fu.bottom] };
    });
    assert.equal(m.choca, false, JSON.stringify(m));
  });
});

test('cuadrantes: en una fila los emojis quedan a la misma altura aunque un texto tenga más renglones (neuroventas r3, lámina 14)', { timeout: 120_000 }, async () => {
  const lam = { tipo: 'cuadrantes', items: [{ emoji: '😩', emoji_tam: 200, texto: 'Hoy: publicas diario y **nadie compra**', tono: 'r' }, { emoji: '😌', emoji_tam: 200, texto: 'Después: tus posts traen **mensajes de compra**', tono: 'v' }] };
  await conDeck({ emoji: 'apple', marca: false, laminas: [lam] }, async page => {
    const m = await page.evaluate(() => [...window.PZ.lams[0].querySelectorAll('.cuadro')].map(c => {
      const e = c.firstElementChild.getBoundingClientRect(), t = c.lastElementChild;
      return { emoji: Math.round(e.top), renglones: Math.round(t.scrollHeight / parseFloat(getComputedStyle(t).lineHeight)) };
    }));
    assert.ok(Math.abs(m[0].emoji - m[1].emoji) <= 2, JSON.stringify(m));
  });
});

test('QA r4: el remate del stack tapa el bento: los emojis que quedan debajo no cuentan como «un emoji tapa…»; el error «un emoji tapa» se sigue probando en el fixture defectos-r3', { timeout: 120_000 }, () => {
  const dir = tmp();
  const items = [{ emoji: '📖', texto: 'Los 3 módulos', doble: true }, { emoji: '🔴', texto: '12 sesiones' }, { emoji: '📄', texto: 'Plantillas' }, { emoji: '📊', texto: 'Tu tablero' }, { emoji: '👥', texto: 'Grupo' }, { emoji: '🧑‍🏫', texto: 'Revisión' }];
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ emoji: 'apple', marca: false, pieza: 'libre', laminas: [{ id: 'stack6', tipo: 'stack', items, remate: 'Hecho **contigo**' }] }));
  const r = qa(dir);
  assert.ok(!r.errores.some(e => /un emoji tapa/.test(e)), r.errores.join('\n'));
  // los emojis del bento siguen midiéndose en los pasos anteriores: las piezas no se enciman entre sí
  assert.ok(!r.errores.some(e => /emojis se enciman/.test(e)), r.errores.join('\n'));
});

test('rejilla r4: «Tú» va sin flecha [14:55]; con flecha_etiqueta la flecha mide ≥ 60 px', { timeout: 120_000 }, async () => {
  const rj = extra => ({ tipo: 'rejilla', emoji: '👤', total: 40, columnas: 10, destacar: [14], emoji_destacado: '🧑‍💻', etiqueta_destacado: 'Tú', ...extra });
  await conDeck({ emoji: 'apple', marca: false, laminas: [rj({}), rj({ flecha_etiqueta: true })] }, async page => {
    const m = await page.evaluate(() => window.PZ.lams.map(l => [...l.querySelectorAll('.capa-mano path[data-estilo="fina-abajo"]')].map(p => p.getTotalLength())));
    assert.deepEqual(m[0], [], JSON.stringify(m));
    assert.ok(m[1].length === 1 && m[1][0] >= 60, JSON.stringify(m));
  });
});

test('QA r4: un emoji fuera de la tabla medida sobre fondo neutro se mide en vivo (🔈 💿 en tarjetas, fluent) y avisa', { timeout: 120_000 }, () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ emoji: 'fluent', marca: false, laminas: [
    { tipo: 'tarjetas', encabezado: 'Tu estudio en casa:', items: [{ emoji: '🔈', texto: 'Bocina' }, { emoji: '💿', texto: 'Tu música' }, { emoji: '🗑️', texto: 'Lo que borras' }] }] }));
  const r = qa(dir);
  assert.ok(r.avisos.some(a => /fuera de la tabla medida que casi no se ve en fluent sobre la tarjeta: .*🔈/.test(a)), r.avisos.join('\n'));
  assert.ok(r.nota < 100);
  assert.ok(r.info.some(i => /medido en vivo .*🔈/.test(i)), r.info.join('\n'));
});

test('QA r4: el modelo vsl-corto (huecos declarados) da 90, borrador, sin errores ni falta_para_final; los huecos no restan; uno sin declarar sigue siendo error', { timeout: 180_000 }, () => {
  const r = qa(path.join(DIR_SKILL, 'ejemplos', 'vsl-corto'));
  assert.equal(r.nota, 90, JSON.stringify(r.avisos));
  assert.equal(r.estado, 'borrador');
  assert.deepEqual(r.errores, []);
  assert.deepEqual(r.falta_para_final, []);
  assert.ok(!r.avisos.some(a => /^dato pendiente a propósito|^dato propuesto/.test(a)), r.avisos.join('\n'));
  assert.ok(Object.keys(r.datos_por_confirmar).length >= 10);
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ emoji: 'apple', marca: false, laminas: [{ tipo: 'cifra', valor: 'Inversión: {{PRECIO}}' }] }));
  assert.equal(qa(dir).estado, 'con errores');
});

test('QA r5: un hueco declarado no esconde los errores: estado «con errores», por_confirmar presente y salida 1', { timeout: 120_000 }, () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ emoji: 'apple', marca: { texto: 'tumarca', sufijo: '.com' }, datos: { PRECIO: { pendiente: true, motivo: 'lo define dirección' } },
    laminas: [{ tipo: 'cifra', valor: 'Inversión: {{PRECIO}}' }, { tipo: 'idea', emoji: '💡', texto: 'Otra idea **sin cerrar' }] }));
  const r = qa(dir);
  assert.equal(r.estado, 'con errores', JSON.stringify(r.errores));
  assert.ok(r.por_confirmar.PRECIO);
  assert.equal(r.listo_salvo_datos, false);
  const e = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts', 'qa.mjs'), dir, '--salida', tmp()], { encoding: 'utf8' });
  assert.equal(e.status, 1);
});

test('QA r6: la lista oscura con 🎓 tiene halo y no duplica el aviso de contraste', { timeout: 120_000 }, () => {
  const p = prepararSalida(fx('emoji-oscura'), tmp());
  const html = fs.readFileSync(p.htmlPath, 'utf8');
  assert.match(html, /class="emo[^\"]*hundido/);
  const r = qa(fx('emoji-oscura'));
  const contraste = r.avisos.filter(a => /emoji.*(?:contraste|casi no se ve|se pierde)/.test(a));
  assert.ok(contraste.length <= 1, contraste.join('\n'));
  assert.ok(!r.avisos.some(a => /fondo de color.*🎓/.test(a)), r.avisos.join('\n'));
});

test('sala: foco, mapa, rejilla y calendario conservan el piso; video mantiene sus opacidades', async () => {
  const laminas = [
    { tipo: 'pasos', iconos: ['💡', '🤖'], activo: 1 },
    { tipo: 'foco', texto: 'Una idea', anclar: 'centro' },
    { tipo: 'rejilla', total: 4, columnas: 2, emoji: '📦', destacar: [0], apagar_resto: true },
    { tipo: 'calendario', n: 7, fases: [{ nombre: 'Ejemplo', desde: 1, hasta: 2, color: 'verde' }], fase_activa: 1 },
  ];
  for (const sala of [false, true]) await conDeck({ sala, marca: false, emoji: 'apple', laminas }, async page => {
    const r = await page.evaluate(() => {
      const op = sel => Number(getComputedStyle(document.querySelector(sel)).opacity);
      return { mapa: op('.lz-pasos .paso-apagado .rotulo-paso'), icono: op('.lz-pasos .paso-apagado .icono-paso'), foco: op('.clon'), rejilla: op('.rejilla .apagado'), calendario: op('.calendario .dia.apagado:not(.tinte)') };
    });
    assert.equal(r.mapa, sala ? .35 : .2);
    assert.equal(r.icono, .35, 'el ícono apagado del mapa no baja de 35 % ni en video');
    assert.equal(r.foco, sala ? .35 : .2);
    assert.equal(r.rejilla, sala ? .35 : .25);
    assert.equal(r.calendario, sala ? .35 : .3);
  });
});

test('QA sala: opacidad explícita baja produce error y plantilla engañosa solo aviso', () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ sala: true, marca: false, emoji: 'apple', laminas: [
    { tipo: 'idea', texto: 'Una idea' }, { tipo: 'foco', texto: 'Otra idea', opacidad: .2 },
    { tipo: 'prueba', encabezado: 'Prueba real', capturas: [{ hueco: 'Tu captura', plantilla: true }] },
  ] }));
  const r = qa(dir);
  assert.ok(r.errores.some(x => /opacidad efectiva mínima de 35/.test(x)), r.errores.join('\n'));
  assert.ok(r.avisos.some(x => /única captura.*plantilla/.test(x)), r.avisos.join('\n'));
});

test('QA r6: imagen opaca en objeto, oscura y nodo avisa una vez; foto y captura requieren procedencia o fuente', { timeout: 120_000 }, () => {
  const r = qa(fx('imagenes-r6'));
  for (const id of ['objeto-opaco', 'oscura-opaca', 'nodo-opaco']) {
    assert.equal(r.avisos.filter(a => a.includes(id) && /rectángulo de foto/.test(a)).length, 1, id);
  }
  assert.ok(r.avisos.some(a => /fuente-ausente.*procedencia.*fuente/.test(a)));
  assert.ok(r.avisos.some(a => /foto-sin-procedencia.*procedencia.*fuente/.test(a)));
});
