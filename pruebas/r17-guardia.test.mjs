// R17 (juez r16): la guardia de aprobados compara avisos, geometría y hash perceptual; la llave de dos renglones no se
// desarma ni queda corrida; el celular asienta la conversación abajo, sobre su barra de escribir.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { inyectable } from '../scripts/lib/medidas-dom.mjs';
import { medidasR11 } from '../scripts/lib/medidas-r11.mjs';
import { normalizarAviso, avisosNuevos, fotoGeometrica, diferenciasGeometria, hamming, diferenciasHash } from '../scripts/lib/guardia.mjs';

test('r17 guardia: un aviso sin cifras es el mismo aviso; uno distinto es nuevo', () => {
  assert.equal(normalizarAviso('lámina 7: burbuja de 5 renglones'), normalizarAviso('lámina 9: burbuja de 6  renglones'));
  assert.deepEqual(avisosNuevos(['lámina 3: chat a 60 px'], ['lámina 4: chat a 58 px']), []);
  assert.deepEqual(avisosNuevos(['lámina 3: chat a 60 px'], ['lámina 4: lista corta']), ['lámina #: lista corta']);
  assert.deepEqual(avisosNuevos(undefined, ['algo']), ['algo'], 'sin foto de avisos, cualquier aviso es nuevo');
});

test('r17 guardia: la foto geométrica tolera 5 puntos en % y 10% (o 4 px) en px, y nota lo que desaparece', () => {
  const antes = fotoGeometrica([{ lamina: 1, tipo: 'lista', lista_letra_px1920: 84, lista_alto_util_pct: 50, chat_letras: [72, 80] }]);
  assert.deepEqual(antes, { 1: { lista_letra_px1920: 84, lista_alto_util_pct: 50, chat_letras_min: 72, chat_letras_max: 80 } });
  const igual = fotoGeometrica([{ lamina: 1, lista_letra_px1920: 86, lista_alto_util_pct: 54, chat_letras: [70, 82] }]);
  assert.deepEqual(diferenciasGeometria(antes, igual), []);
  const peor = fotoGeometrica([{ lamina: 1, lista_letra_px1920: 72, lista_alto_util_pct: 40 }]);
  const d = diferenciasGeometria(antes, peor);
  assert.ok(d.some(x => /lista_letra_px1920 84 → 72/.test(x)) && d.some(x => /lista_alto_util_pct/.test(x)) && d.some(x => /chat_letras_min ya no se mide/.test(x)), d.join('\n'));
});

test('r17 guardia: hash perceptual con tope de 8 bits; PNG nuevo o faltante cuenta', () => {
  const a = '0'.repeat(64), b = 'f' + '0'.repeat(63), c = 'fff' + '0'.repeat(61);
  assert.equal(hamming(a, b), 4); assert.equal(hamming(a, c), 12);
  assert.deepEqual(diferenciasHash({ '01.png': a }, { '01.png': b }), []);
  assert.deepEqual(diferenciasHash({ '01.png': a }, { '01.png': c }), ['01.png: 12 bits distintos']);
  assert.deepEqual(diferenciasHash({ '01.png': a }, { '02.png': a }), ['01.png: ya no se genera', '02.png: PNG nuevo']);
});

async function pagina(t, laminas) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r17-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca: false, emoji: 'apple', formato: '16:9', laminas }));
  const prep = prepararSalida(dir); let b;
  try { b = await abrir(prep.htmlPath, prep.W, prep.H); } catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(e.motivo); return null; }
  t.after(() => b.browser.close());
  await b.page.addScriptTag({ content: inyectable() + `;window.medidasR11=${medidasR11.toString()};` });
  return b.page;
}

test('r17: la llave de dos renglones no se desarma y el conjunto lista + llave + nota queda centrado', async t => {
  const p = await pagina(t, [{ tipo: 'lista', items: ['Responsable', 'Fecha'], anotaciones: [{ llave: ['i0', 'i1'], texto: 'Acuerda ambos' }] }]);
  if (!p) return;
  const r = await p.evaluate(() => {
    const l = window.PZ.lams[0];
    const k = e => { const a = e.getBoundingClientRect(), b = l.getBoundingClientRect(), s = b.width / l.offsetWidth; return { x: (a.x - b.x) / s, y: (a.y - b.y) / s, w: a.width / s, h: a.height / s }; };
    const items = [...l.querySelectorAll('.lista > *')].map(k), nota = k(l.querySelector('.anotacion'));
    return { items, nota, W: l.offsetWidth, letra: parseFloat(getComputedStyle(l.querySelector('.lista > *')).fontSize), q: window.medidasR11(l) };
  });
  const hueco = r.items[1].y - (r.items[0].y + r.items[0].h);
  assert.ok(hueco <= r.letra * 2.4 + 2, `hueco ${hueco} con letra ${r.letra}`);
  const izq = Math.min(...r.items.map(i => i.x)), der = r.nota.x + r.nota.w;
  assert.ok(Math.abs((izq + der) / 2 - r.W / 2) <= 40, `conjunto de ${izq} a ${der}`);
  assert.ok(!r.q.avisos.some(a => /lista corta/.test(a)), r.q.avisos.join('\n'));
});

test('r17: en el celular la conversación se asienta abajo, sobre la barra de escribir', async t => {
  const p = await pagina(t, [{ tipo: 'chat', marco: 'celular', encabezado: 'La conversación:', mensajes: [{ de: 'otro', texto: '¿Lo revisaste?' }, { de: 'yo', texto: 'Falta la fecha.' }] }]);
  if (!p) return;
  const r = await p.evaluate(() => {
    const l = window.PZ.lams[0], y = e => e.getBoundingClientRect();
    const pant = y(l.querySelector('.celular-pantalla')), ult = [...l.querySelectorAll('.burbuja')].pop(), barra = l.querySelector('.celular-entrada');
    return { pantalla: pant.bottom - pant.top, ultimo: y(ult).bottom, barra: y(barra).top, fondo: pant.bottom, texto: barra.textContent.trim() };
  });
  assert.ok(r.barra - r.ultimo >= 0 && r.barra - r.ultimo <= 60, JSON.stringify(r));
  assert.ok(r.fondo - r.barra <= 120, JSON.stringify(r));
  assert.equal(r.texto, '', 'la barra no lleva texto: no es contenido');
});

test('r17: la hora del chat se lee a 48 px efectivos aunque el encaje reduzca la conversación', async t => {
  for (const formato of ['16:9', '9:16']) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r17-hora-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca: false, emoji: 'apple', formato, laminas: [{ tipo: 'chat', encabezado: 'Le escribes a Marta:', mensajes: [
      { de: 'otro', hora: '14 de junio', texto: 'Me llevo dos cajas de galletas para la fiesta.' },
      { de: 'yo', hora: 'Hoy', texto: 'Hola Marta, ¿cómo salió la fiesta? Te guardé las de nuez.' },
      { de: 'otro', texto: '¡Apártame tres cajas para el sábado!' }] }] }));
    const prep = prepararSalida(dir); let b;
    try { b = await abrir(prep.htmlPath, prep.W, prep.H); } catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(e.motivo); return; }
    const r = await b.page.evaluate(() => [...document.querySelectorAll('.chat-hora')].map(e => {
      let z = 1; for (let a = e; a && a.nodeType === 1; a = a.parentElement) z *= parseFloat(getComputedStyle(a).zoom) || 1;
      return { ef: parseFloat(getComputedStyle(e).fontSize) * z, piso: 48 * e.closest('.lamina').offsetWidth / 1920 };
    }));
    await b.browser.close();
    assert.ok(r.length === 2 && r.every(h => h.ef >= h.piso - .5), `${formato}: ${JSON.stringify(r)}`);
  }
});

test('r17: REGLAS-DEL-AUTOR es la entrada corta (≤ 8 KB) y SKILL y ARRANQUE la mandan leer', () => {
  const raiz = DIR_SKILL;
  const reglas = fs.readFileSync(path.join(raiz, 'REGLAS-DEL-AUTOR.md'), 'utf8');
  assert.ok(Buffer.byteLength(reglas) <= 8192, `REGLAS-DEL-AUTOR.md pesa ${Buffer.byteLength(reglas)} bytes: condénsala, la historia va en LECCIONES`);
  for (const doc of ['SKILL.md', 'references/ARRANQUE.md']) assert.match(fs.readFileSync(path.join(raiz, doc), 'utf8'), /REGLAS-DEL-AUTOR/, doc);
});
