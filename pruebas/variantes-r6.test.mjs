import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { reglasVariantes } from '../scripts/lib/variantes.mjs';
import { construirHTML } from '../scripts/lib/construir.mjs';
import { rejilla, chat } from '../scripts/lib/layouts-datos.mjs';
import { pasos, lista } from '../scripts/lib/layouts-texto.mjs';
import { resolverComo } from '../scripts/lib/contrato.mjs';
import { sustituirDatos } from '../scripts/lib/datos.mjs';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const demo = JSON.parse(fs.readFileSync(path.join(RAIZ, 'ejemplos/demo/deck.json'), 'utf8'));
const bandas = demo.laminas.find(l => l.id === 'bandas-r6');
const letras = demo.laminas.find(l => l.id === 'letras-r6');
const prompt = demo.laminas.find(l => l.id === 'prompt-r6');
const regla = l => reglasVariantes({ laminas: [l] });
const ctx = (vertical = false) => ({ vertical, util: vertical ? 920 : 1720, max: 0,
  P(k) { this.max = Math.max(this.max, k); return ` data-p="${k}"`; }, A: id => ` data-a="${id}"`,
  paso: n => n, con: () => {}, emoji: (s, n) => `<span data-emoji="${s}" data-tam="${n}"></span>`, em: { html: s => `<span data-emoji="${s}"></span>` } });

test('bandas: contiguas desde abajo a la derecha, leyenda sincronizada y círculo con paso propio', () => {
  const c = ctx(), h = rejilla(bandas, c);
  assert.equal((h.match(/class="banda-celda"/g) || []).length, 100);
  const celdas = [...h.matchAll(/<div class="banda-celda"[^>]*>(.*?)<\/div>/g)].map(m => m[1]);
  assert.match(celdas[0], /data-p="3"/);   // arriba a la izquierda: la última banda (naranja)
  assert.match(celdas.at(-1), /data-p="1"/);
  assert.match(h, /banda-circulo.*data-circulo data-p="4"/);
  assert.equal(c.max, 4);
  assert.deepEqual(regla(bandas), { errores: [], avisos: [] });
});

test('bandas: total, contigüidad, tono, fuente y porcentaje se validan', () => {
  assert.ok(regla({ ...bandas, bandas: [{ desde: 0, hasta: 110, tono: 'v' }] }).errores.some(e => /total/.test(e)));
  assert.ok(regla({ ...bandas, bandas: [{ desde: 1, hasta: 30, tono: 'v' }] }).errores.some(e => /contiguas/.test(e)));
  assert.ok(regla({ ...bandas, leyenda: [{ tono: 'r', cifra: '30%' }] }).errores.some(e => /no tiene una banda/.test(e)));
  assert.ok(regla({ ...bandas, fuente: undefined }).errores.some(e => /necesita fuente/.test(e)));
  const crudo = { laminas: [{ ...bandas, fuente: undefined, leyenda: bandas.leyenda.map(x => ({ ...x, cifra: '{{DATO}}' })) }] };
  assert.deepEqual(reglasVariantes({ laminas: [{ ...bandas, fuente: undefined }] }, { crudo }).errores, []);
  assert.ok(regla({ ...bandas, leyenda: [{ tono: 'v', cifra: '50%' }] }).avisos.some(e => /máximo una celda/.test(e)));
});

test('letras: riel, activo con círculo, pendientes apagadas, 9:16 y cierre con letras', () => {
  const h = pasos(letras, ctx(true));
  assert.match(h, /riel-letras/);
  assert.match(h, /riel-letra activa[^>]*data-circulo/);
  assert.match(h, /riel-letra pendiente/);
  assert.match(h, /width:920px/);
  const cierre = { tipo: 'lista', vineta: 'letras', letras: ['R', 'E', 'C'], items: ['Rol', 'Encargo', 'Contexto'] };
  const hl = lista(cierre, ctx());
  assert.equal((hl.match(/class="vineta-letra"/g) || []).length, 3);
  assert.doesNotMatch(hl, /data-emoji="letras"/);
  assert.deepEqual(regla(letras).errores, []);
  assert.deepEqual(regla(cierre).errores, []);
  assert.ok(regla({ ...letras, letras: ['R'] }).errores.some(e => /misma longitud/.test(e)));
  assert.ok(regla({ ...letras, iconos: ['📋', '📋', '🧭'] }).errores.some(e => /no repitas/.test(e)));
  assert.ok(regla({ ...cierre, letras: undefined }).errores.some(e => /una letra por ítem/.test(e)));
});

test('prompt/respuesta: tarjetas sin avatar, remitente, ejemplo o fuente con fecha', () => {
  const h = chat(prompt, ctx(true));
  assert.match(h, /chat-tarjeta prompt/);
  assert.match(h, /chat-tarjeta respuesta/);
  assert.match(h, /chat-remitente/);
  assert.match(h, /chat-ejemplo">EJEMPLO/);
  assert.doesNotMatch(h, /yo-av|otro-av/);
  assert.deepEqual(regla(prompt).errores, []);
  const respuesta = fuente => ({ tipo: 'chat', mensajes: [{ de: 'respuesta', texto: 'Listo', ...(fuente ? { fuente } : {}) }] });
  assert.ok(regla(respuesta()).errores.some(e => /sin fuente/.test(e)));
  assert.ok(regla(respuesta('Archivo autorizado')).errores.some(e => /necesita fecha/.test(e)));
  assert.deepEqual(regla(respuesta('Registro autorizado, 2026-09-24')).errores, []);
});

test('variantes: demo y todos los ejemplos sin hallazgos propios; voces alineadas', () => {
  const carpetas = fs.readdirSync(path.join(RAIZ, 'ejemplos')).map(n => path.join('ejemplos', n));
  for (const carpeta of [...carpetas, 'pruebas/replica']) {
    const archivo = path.join(RAIZ, carpeta, 'deck.json');
    if (!fs.existsSync(archivo)) continue;
    const crudo = resolverComo(JSON.parse(fs.readFileSync(archivo, 'utf8'))).deck;
    const { deck } = sustituirDatos(crudo);
    assert.deepEqual(reglasVariantes(deck, { crudo }), { errores: [], avisos: [] }, carpeta);
  }
  const d = { emoji: 'apple', marca: false, laminas: [bandas, letras, prompt] };
  const armado = construirHTML({ deck: d, dirDeck: RAIZ, dirSalida: fs.mkdtempSync(path.join(os.tmpdir(), 'pz-variantes-')), dirSkill: RAIZ });
  assert.deepEqual(armado.pasos, [5, 1, 3]);
  assert.ok(armado.deck.laminas.every((l, i) => l.voz.length === armado.pasos[i]));
});
