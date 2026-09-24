import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { construirHTML, LAYOUTS } from '../scripts/lib/construir.mjs';
import { validarDeck, sanearDeck, resolverComo } from '../scripts/lib/contrato.mjs';
import { avisosProcedencia, revisarRecortes } from '../scripts/lib/imagenes.mjs';

const RAIZ = path.resolve(import.meta.dirname, '..');
const DEMO = path.join(RAIZ, 'pruebas/fixtures/imagenes-r6');
const opaca = 'escritorio-ejemplo.png', recortada = 'silueta-ejemplo.png';
function construir(laminas, extra = {}) {
  const salida = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-imagenes-r6-'));
  return construirHTML({ deck: { marca: false, emoji: 'apple', ...extra, laminas }, dirDeck: DEMO, dirSalida: salida, dirSkill: RAIZ });
}

test('foto y anfitrion: contrato, listas cerradas, fuente existente y texto escapado', () => {
  const foto = { tipo: 'foto', imagen: opaca, texto: '<script> & __pensar__', procedencia: 'ejemplo', fuente: '<crédito>', fuente_paso: 1 };
  const retrato = { tipo: 'anfitrion', imagen: recortada, texto: 'Una explicación', lado: 'izq', procedencia: 'ejemplo', texto_paso: 1 };
  assert.deepEqual(validarDeck({ laminas: [foto, retrato] }, Object.keys(LAYOUTS)), []);
  const { html, pasos } = construir([foto, retrato]);
  assert.match(html, /foto-completa velo-blanco/);
  assert.match(html, /class="fuente" data-p="1">&lt;crédito&gt;/);
  assert.match(html, /anfitrion lado-izq/);
  assert.match(html, /data-recorte="anfitrion" src="data:image\/png;base64,/);
  assert.match(html, /&lt;script&gt; &amp;/);
  const s = sanearDeck({ laminas: [{ ...foto, velo: '"><script>' }, { ...retrato, lado: 'centro', imagen: 3 }] });
  assert.equal(s.deck.laminas[0].velo, undefined); assert.equal(s.deck.laminas[1].lado, undefined);
  assert.equal(s.avisos.length, 3);
  assert.ok(validarDeck({ laminas: [{ ...retrato, procedencia: 'ia' }] }, Object.keys(LAYOUTS)).some(e => /persona generada/.test(e)));
  assert.ok(validarDeck({ laminas: [{ tipo: 'foto' }, { tipo: 'anfitrion' }] }, Object.keys(LAYOUTS)).length >= 4);
  JSON.parse(fs.readFileSync(path.join(RAIZ, 'templates/deck.schema.json')));
});

test('marcoMano cierra exactamente en el arranque, horizontal y vertical', () => {
  for (const formato of ['16:9', '9:16']) {
    const { html } = construir([{ tipo: 'prueba', capturas: [{ hueco: 'Pon tu captura', plantilla: true }] }], { formato });
    const d = html.match(/class="marco-mano"[^>]*><path d="([^"]+)"/)[1];
    const puntos = d.slice(1).split(' L'); assert.equal(puntos.at(-1), puntos[0]);
  }
});

test('fuentes y pantallas se revelan con su captura; logos usan imágenes sin caja', () => {
  const { html } = construir([{ tipo: 'prueba', variante: 'pantallas', fuente: 'Crédito general', fuente_paso: 1,
    capturas: [{ src: opaca, fuente: 'Dibujo propio' }, { src: opaca, procedencia: 'ejemplo' }] },
  { tipo: 'tarjetas', variante: 'logos', items: Array.from({ length: 3 }, () => ({ imagen: recortada })) },
  { tipo: 'objeto', imagen: recortada, texto: 'Mi objeto', texto_paso: 1, logos: [recortada] }]);
  assert.equal((html.match(/class="barra-ventana"/g) || []).length, 2);
  assert.match(html, /class="fuente" data-p="1">Crédito general/);
  assert.match(html, /class="fuente">Dibujo propio/);
  assert.match(html, /class="tarjetas-logos"/);
  assert.match(html, /class="objeto-logos" data-p="1"/);
  assert.equal(avisosProcedencia({ tipo: 'foto', imagen: opaca }).length, 1);
  assert.equal(avisosProcedencia({ tipo: 'prueba', capturas: [{ src: opaca }] }).length, 1);
  assert.deepEqual(avisosProcedencia({ tipo: 'prueba', fuente: 'Autor', capturas: [{ src: opaca }] }), []);
});

test('siglas: seis letras, activo a 220 px, glosa en negrita y reuso con como', () => {
  const mapa = { id: 'mapa', tipo: 'pasos', letras: ['A', 'B', 'C', 'D', 'E', 'F'], iconos: Array(6).fill('💡'), etiquetas: ['Idea', 'Boceto', 'Cambio', 'Dato', 'Ensayo', 'Final'] };
  const { deck } = resolverComo({ laminas: [mapa, { tipo: 'pasos', como: 'mapa', activo: 6 }] });
  assert.deepEqual(validarDeck(deck, Object.keys(LAYOUTS)), []);
  const { html } = construir(deck.laminas);
  assert.match(html, /--letras-n:6/); assert.match(html, /concepto-activo/);
  assert.match(html, /--s:220px/); assert.match(html, /font-weight:700">F · Final/);
  const logos = resolverComo({ laminas: [{ ...mapa, logos: Array(6).fill(recortada) }, { tipo: 'pasos', como: 'mapa', activo: 6 }] });
  assert.equal(logos.deck.laminas[1].logos.length, 6);
  const conLogo = construir([{ tipo: 'pasos', logos: [recortada], etiquetas: ['Propio'] }]);
  assert.match(conLogo.html, /silueta-ejemplo\.png/);
});

test('alfa: esquinas opacas avisan y nunca aplican sombra; transparencia y errores son explícitos', () => {
  const original = globalThis.document;
  const crear = alfa => ({ complete: true, naturalWidth: 20, dataset: { recorte: 'objeto' }, classList: { toggle() {} }, closest: () => ({ dataset: { i: '0', id: 'imagen' } }), alfa });
  let imagen;
  globalThis.document = { createElement: () => ({ getContext: () => ({ drawImage: img => { imagen = img; }, getImageData: () => ({ data: Uint8ClampedArray.from({ length: 64 * 64 * 4 }, (_, i) => i % 4 === 3 ? imagen.alfa : 0) }) }) }) };
  try {
    const imgs = [crear(255), crear(0), { ...crear(0), complete: false }];
    const resultados = revisarRecortes({ querySelectorAll: () => imgs });
    assert.equal(resultados[0].opaca, true); assert.equal(imgs[0].dataset.recorteOpaco, 'true');
    assert.equal(resultados[1].opaca, false); assert.match(resultados[2].error, /PNG local con transparencia/);
  } finally { globalThis.document = original; }
});

import { reglasLogos } from '../scripts/lib/reglas-estilo.mjs';
import { reglasVariantes } from '../scripts/lib/variantes.mjs';
import { estadoQA } from '../scripts/lib/reglas-deck.mjs';
test('logo paralelo: marca en texto libre no lo pide, ícono sí; el hueco declarado conserva borrador', () => {
  const pasos = { tipo: 'pasos', iconos: ['📱'], etiquetas: ['WhatsApp'] };
  assert.deepEqual(reglasLogos({ laminas: [{ tipo: 'idea', texto: 'Escribe en WhatsApp' }] }).avisos, []);
  assert.equal(reglasLogos({ laminas: [pasos] }).avisos.length, 1);
  const conLogo = { ...pasos, logos: ['{{LOGO_WHATSAPP}}'] };
  assert.deepEqual(reglasLogos({ laminas: [conLogo] }).avisos, []);
  const r = construir([conLogo]);
  assert.match(r.html, /class="logo-pendiente"/);
  assert.ok(r.declarados.LOGO_WHATSAPP);
  assert.equal(estadoQA({ borrador: Object.keys(r.declarados).length > 0 }), 'borrador');
  assert.deepEqual(reglasVariantes({ laminas: [{ tipo: 'pasos', letras: ['A'], etiquetas: ['Herramienta'], logos: [recortada] }] }).errores, []);
});
