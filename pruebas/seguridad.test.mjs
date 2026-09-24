// Regresiones de la revisión adversarial: nada del deck llega crudo al HTML ni se copia fuera de su carpeta.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { construirHTML } from '../scripts/lib/construir.mjs';
import { sanearDeck } from '../scripts/lib/contrato.mjs';
import { tiemposAlineados, duracionPaso } from '../scripts/lib/tiempos.mjs';
import { DIR_SKILL } from '../scripts/lib/pipeline.mjs';

const ATAQUE = '"><img src=x onerror=alert(1)>';
function armar(laminas, preparar) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-seg-'));
  if (preparar) preparar(dir);
  const r = construirHTML({ deck: { emoji: 'apple', laminas }, dirDeck: dir, dirSalida: path.join(dir, 'salida'), dirSkill: DIR_SKILL });
  return { ...r, dir };
}
const sinEtiquetaViva = html => !/<img src=x onerror/i.test(html) && !/<\/script><img/i.test(html);

test('emoji, cursor, pasos, tonos y tamaños maliciosos no inyectan HTML', () => {
  const { html } = armar([
    { tipo: 'idea', emoji: ATAQUE, texto: 'x', nota: 'n', nota_paso: ATAQUE, tam_texto: ATAQUE },
    { tipo: 'tarjetas', items: [{ emoji: '💰', texto: 'a', tono: ATAQUE }] },
    { tipo: 'medidor', valor: 50, tono: ATAQUE },
    { tipo: 'cifra', lineas: ['1'], tam: ATAQUE },
    { tipo: 'boton', boton: ATAQUE, cursor: ATAQUE, clic_paso: ATAQUE, sello: 'ok', sello_paso: ATAQUE },
    { tipo: 'objeto', imagen: 'https://x.com/a.png' + ATAQUE },
  ]);
  assert.ok(sinEtiquetaViva(html));
});

test('una etiqueta de flecha con </script> antes de un «foco» no rompe el documento', () => {
  const { html } = armar([
    { tipo: 'flujo', nodos: [{ emoji: '🐷' }, { emoji: '🎰' }], flechas: [{ etiqueta: '</script><img src=x onerror=alert(1)>' }] },
    { tipo: 'foco', texto: 'resumen' },
  ]);
  assert.ok(sinEtiquetaViva(html));
  assert.equal((html.match(/<\/script>/g) || []).length, (html.match(/<script/g) || []).length);
});

test('imagen: solo archivos de imagen dentro de la carpeta del deck', () => {
  const r = armar([
    { tipo: 'objeto', imagen: '../../etc/hosts' },
    { tipo: 'objeto', imagen: '/etc/hosts' },
    { tipo: 'objeto', imagen: 'secreto.env' },
    { tipo: 'objeto', imagen: 'javascript:alert(1)' },
  ], dir => fs.writeFileSync(path.join(dir, 'secreto.env'), 'CLAVE=1'));
  const copiadas = fs.existsSync(path.join(r.dir, 'salida', 'img')) ? fs.readdirSync(path.join(r.dir, 'salida', 'img')) : [];
  assert.deepEqual(copiadas, []);
  assert.ok(r.avisos.filter(a => /rechazada|No es una imagen/.test(a)).length >= 4);
});

test('dos imágenes con el mismo nombre en carpetas distintas no se pisan', () => {
  const r = armar([{ tipo: 'objeto', imagen: 'a/logo.png' }, { tipo: 'objeto', imagen: 'b/logo.png' }], dir => {
    for (const d of ['a', 'b']) { fs.mkdirSync(path.join(dir, d)); fs.writeFileSync(path.join(dir, d, 'logo.png'), d); }
  });
  assert.equal(fs.readdirSync(path.join(r.dir, 'salida', 'img')).length, 2);
});

test('saneo: tachar plano se envuelve, valores raros se descartan con aviso', () => {
  const { deck, avisos } = sanearDeck({ laminas: [
    { tipo: 'prueba', capturas: [{ src: 'a.png', tachar: [5, 3, 25, 6], circulo: 'x' }] },
    { tipo: 'calendario', color: 'morado', fase_activa: 'dos' },
  ] });
  assert.deepEqual(deck.laminas[0].capturas[0].tachar, [[5, 3, 25, 6]]);
  assert.equal(deck.laminas[0].capturas[0].circulo, undefined);
  assert.equal(deck.laminas[1].color, undefined);
  assert.ok(avisos.length >= 3);
});

test('los degradados de las siluetas viven fuera de las láminas (no desaparecen en el presentador)', () => {
  const { html } = armar([{ tipo: 'rejilla', emoji: '👤', total: 4 }, { tipo: 'rejilla', emoji: '👤', total: 4 }]);
  assert.equal((html.match(/id="pz-sil"/g) || []).length, 1);
  assert.ok(html.indexOf('id="pz-sil"') < html.indexOf('<section'));
});

test('anclas explícitas mandan sobre la voz; la cámara respeta su voz', () => {
  const deck = { laminas: [{ tipo: 'idea', voz: 'una voz bastante larga que se dice primero', anclas: ['bastante larga'] }] };
  const pal = 'relleno relleno relleno una voz bastante larga'.split(' ').map((w, i) => ({ w, s: i, e: i + 0.8 }));
  const { segs } = tiemposAlineados(deck, [1], pal);
  assert.equal(segs[0].inicio, 5);
  assert.ok(duracionPaso({ tipo: 'camara', voz: 'palabra '.repeat(40) }, 0) > 10);
});
