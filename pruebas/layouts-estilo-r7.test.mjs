// Consignas, tarjeta de prompt e íconos apagados: contratos de la ronda de estilo.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { crearCtx } from '../scripts/lib/comun.mjs';
import { Emojis } from '../scripts/lib/emoji.mjs';
import { lista, pasos } from '../scripts/lib/layouts-texto.mjs';
import { chat } from '../scripts/lib/layouts-datos.mjs';
import { construirHTML, LAYOUTS } from '../scripts/lib/construir.mjs';
import { sanearDeck, validarDeck, resolverComo } from '../scripts/lib/contrato.mjs';
import { abrir } from '../scripts/lib/pipeline.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporal = '/private/tmp/pz-loop/r7/codex-impl-estilo-iconos/layouts';
fs.mkdirSync(temporal, { recursive: true });
const contexto = () => crearCtx({ em: new Emojis({ modo: 'apple', dirSalida: temporal }) });
const construir = laminas => construirHTML({ deck: { emoji: 'apple', marca: false, laminas }, dirDeck: temporal, dirSalida: temporal, dirSkill: raiz });

test('lista numero: teclas hasta nueve y número en tinta desde diez', () => {
  const h = lista({ vineta: 'numero', items: Array.from({ length: 10 }, () => 'Una tarea') }, contexto());
  assert.match(h, />1️⃣<\/span>/);
  assert.match(h, />9️⃣<\/span>/);
  assert.match(h, /class="vineta-letra">10<\/b>/);
  assert.doesNotMatch(h, /data-e="numero"/);
});

test('vivo: admite objetos con emoji, dibuja reloj SVG y omite el emoji grande con duración', () => {
  const l = { tipo: 'camara', vivo: true, dur: 300, texto: 'Ahora tú', items: ['Escribe', { emoji: '🎯', texto: '**Elige** <una>' }] };
  assert.deepEqual(validarDeck({ laminas: [l] }, Object.keys(LAYOUTS)), []);
  const h = construir([l]).html;
  assert.match(h, /class="reloj-7seg vol vivo-reloj"/);
  assert.match(h, /<title>5:00<\/title>/);
  assert.match(h, /<ol class="vivo-items"><li><span class="emo/);
  assert.match(h, /<b>Elige<\/b> &lt;una&gt;/);
  assert.doesNotMatch(h.match(/<div class="vivo-pres">[\s\S]*?<\/ol>/)[0], /--s:190px/);
  assert.doesNotMatch(construir([{ ...l, dur: undefined }]).html, /class="reloj-7seg vol vivo-reloj"/);
});

test('prompt: tres mensajes forman una tarjeta con tres pasos y anclas propias', () => {
  const ctx = contexto(), mensajes = ['Rol', 'Escribe [nombre]', 'Evita <inventar>'].map(texto => ({ de: 'prompt', texto }));
  const h = chat({ mensajes, letras: ['R', 'E', 'A'] }, ctx);
  assert.equal((h.match(/class="chat-tarjeta prompt"/g) || []).length, 1);
  assert.equal((h.match(/class="chat-renglon"/g) || []).length, 3);
  [0, 1, 2].forEach(i => assert.match(h, new RegExp(`class="chat-renglon" data-p="${i}" data-a="m${i}"`)));
  assert.equal(ctx.max, 2);
  assert.match(h, /data-circulo="linea">R/);
  assert.match(h, /class="var-plantilla">\[nombre\]/);
  assert.match(h, /&lt;inventar&gt;/);
  const todo = chat({ mensajes, revelar: 'todo' }, contexto());
  assert.doesNotMatch(todo, /data-p="[1-9]/);
});

test('prompt: una respuesta corta los grupos y letras pasa por el saneamiento', () => {
  const mensajes = ['prompt', 'respuesta', 'prompt'].map(de => ({ de, texto: 'Texto' }));
  const h = chat({ mensajes }, contexto());
  assert.equal((h.match(/class="chat-tarjeta prompt"/g) || []).length, 2);
  assert.match(h, /class="chat-tarjeta respuesta"/);
  const r = sanearDeck({ laminas: [{ tipo: 'chat', mensajes, letras: ['<svg>'] }] });
  assert.equal(r.deck.laminas[0].letras, undefined);
  assert.match(r.avisos.join(' '), /letras/);
});

test('apagado: el ícono y la etiqueta no comparten un padre atenuado', () => {
  const h = pasos({ iconos: ['🎯', '📅'], etiquetas: ['Hoy', 'Después'], activo: 1 }, contexto());
  assert.match(h, /class="pila paso-apagado"><div class="icono-paso"/);
  assert.doesNotMatch(h, /style="opacity:/);
  assert.match(lista({ activo: 1, items: [{ emoji: '🎯', texto: 'Hoy' }, { emoji: '📅', texto: 'Después' }] }, contexto()), /class="item item-apagado"/);
  const css = fs.readFileSync(path.join(raiz, 'templates/base.css'), 'utf8');
  assert.match(css, /--apagado-icono:\s*\.35/);
  assert.match(css, /\.paso-apagado \.icono-paso[^}]+opacity: max\(var\(--apagado\), var\(--apagado-icono\)\)/);
});

test('reloj: la misma función actualiza segmentos, título y final rojo sin destruir el SVG', () => {
  const runtime = fs.readFileSync(path.join(raiz, 'templates/runtime.js'), 'utf8');
  const codigo = runtime.slice(runtime.indexOf('const SEGMENTOS_RELOJ'), runtime.indexOf('// ---------- arranque ----------'));
  const actualizar = vm.runInNewContext(`${codigo}; actualizarReloj;`);
  const clases = new Set(), titulo = { textContent: '5:00' }, atributos = {};
  const grupos = Array.from({ length: 3 }, () => {
    const partes = [...'abcdefg'].map(segmento => ({ dataset: { segmento }, on: false, classList: { toggle(_clase, valor) { partes.find(p => p.dataset.segmento === segmento).on = valor; } } }));
    return { partes, querySelectorAll: () => partes };
  });
  const svg = { querySelectorAll: () => grupos, querySelector: () => titulo, setAttribute: (k, v) => { atributos[k] = v; }, classList: { toggle: (k, v) => v ? clases.add(k) : clases.delete(k) } };
  actualizar(svg, 29);
  assert.equal(titulo.textContent, '0:29');
  assert.equal(atributos['aria-label'], '0:29');
  assert.ok(clases.has('final'));
  assert.equal(grupos[1].partes.filter(p => p.on).map(p => p.dataset.segmento).join(''), 'abdeg');
  actualizar(svg, 0);
  assert.ok(clases.has('cero'));
  assert.equal(titulo.textContent, '0:00');
  assert.equal(grupos[0].partes.filter(p => p.on).length, 6);
});

test('óvalo de letra: la ruta conserva el ancla generada aunque no tenga data-w', () => {
  const runtime = fs.readFileSync(path.join(raiz, 'templates/runtime.js'), 'utf8');
  const codigo = runtime.slice(runtime.indexOf('function circulos('), runtime.indexOf('// ---------- cursor y onda ----------'));
  const rutas = [], elementos = [{ dataset: { circulo: 'linea', a: 'w0' } }, { dataset: { circulo: 'linea', a: 'texto', w: 'w1' } }];
  const circulos = vm.runInNewContext(`${codigo}; circulos;`, {
    dentro: (_raiz, selector) => selector === '[data-circulo]' ? elementos : [], caja: () => ({}), pasoDe: () => 0,
    elipse: () => { const ruta = { dataset: {} }; rutas.push(ruta); return ruta; },
  });
  circulos({}, {}, {}, () => .5);
  assert.deepEqual(rutas.map(r => r.dataset.a), ['w0', 'w1']);
  const armado = construir([{ tipo: 'chat', letras: ['R'], mensajes: [{ de: 'prompt', texto: 'Resume' }] }]);
  assert.match(armado.html, /class="vineta-letra" data-circulo="linea" data-a="w0"/);
});

test('objeto con como: reutiliza imagen y medidas, sin heredar voz ni texto ni marcas', () => {
  const madre = { id: 'figura', tipo: 'objeto', imagen: 'metafora.svg', alto: 430, texto: 'Antes', voz: 'Primer uso', nota: 'Una nota', sello: 'LISTO', procedencia: 'ejemplo' };
  const hija = { id: 'regreso', tipo: 'objeto', como: 'figura', texto: 'Después', voz: 'Segundo uso' };
  const crudo = { laminas: [madre, hija] }, copia = structuredClone(crudo);
  const r = resolverComo(crudo);
  assert.deepEqual(r.errores, []);
  assert.deepEqual(r.deck.laminas[1], { imagen: 'metafora.svg', alto: 430, ...hija });
  assert.deepEqual(crudo, copia);
  assert.deepEqual(validarDeck(r.deck, Object.keys(LAYOUTS)), []);
  const reloj = resolverComo({ laminas: [{ id: 'tiempo', tipo: 'objeto', reloj: '10:00' }, { tipo: 'objeto', como: 'tiempo', texto: 'Sigue' }] });
  assert.equal(reloj.deck.laminas[1].reloj, '10:00');
});

test('render: ícono apagado a 35 %, prompt estable y captura igual al reloj del presentador', async t => {
  const laminas = [
    { tipo: 'pasos', iconos: ['🎯', '📅'], etiquetas: ['Hoy', 'Después'], activo: 1 },
    { tipo: 'chat', letras: ['R', 'E', 'A'], mensajes: ['Resume', 'Usa los datos', 'No inventes'].map(texto => ({ de: 'prompt', texto })) },
    { tipo: 'camara', vivo: true, dur: 300, texto: 'Ahora tú', items: ['Anota', { emoji: '🎯', texto: 'Elige' }] },
  ];
  const p = construir(laminas), archivo = path.join(temporal, 'fixture-layouts.html');
  fs.writeFileSync(archivo, p.html);
  let sesion;
  try { sesion = await abrir(archivo, 1920, 1080); }
  catch (error) {
    if (error.code !== 'SIN_NAVEGADOR' && !/browserType\.launch|Failed to launch|Target page, context or browser has been closed/.test(error.message)) throw error;
    t.skip('Chromium no arranca en el sandbox; revisión visual pendiente'); return;
  }
  try {
    const r = await sesion.page.evaluate(() => {
      const [mapa, prompt, vivo] = document.querySelectorAll('.lamina');
      const opacidad = el => { let valor = 1; for (let n = el; n && n !== mapa; n = n.parentElement) valor *= Number(getComputedStyle(n).opacity); return valor; };
      const icono = opacidad(mapa.querySelector('.paso-apagado .emo'));
      PZ.mostrar(prompt, 0, Infinity);
      const primero = prompt.querySelector('.chat-renglon').getBoundingClientRect().top;
      const alto0 = parseFloat(prompt.querySelector('.prompt').style.getPropertyValue('--alto-prompt'));
      PZ.mostrar(prompt, 2, Infinity);
      const alto2 = parseFloat(prompt.querySelector('.prompt').style.getPropertyValue('--alto-prompt'));
      const estable = primero === prompt.querySelector('.chat-renglon').getBoundingClientRect().top;
      const reloj = vivo.querySelector('.vivo-reloj');
      const encendidos = () => [...reloj.querySelectorAll('[data-segmento]')].map(p => p.classList.contains('on') ? 1 : 0).join('');
      PZ.actualizarReloj(reloj, 300);
      const directo = encendidos();
      PZ.actualizarReloj(reloj, 12);
      vivo.classList.add('captura-vivo'); PZ.mostrar(vivo, 0, Infinity);
      return { icono, estable, alto0, alto2, igual: directo === encendidos(), viñetas: vivo.querySelectorAll('.vivo-items li .emo').length };
    });
    assert.ok(r.icono >= .35, `opacidad efectiva del ícono: ${r.icono}`);
    assert.ok(r.estable, 'los renglones ya revelados conservan su posición');
    assert.ok(r.alto2 > r.alto0, 'la tarjeta crece con el contenido visible');
    assert.ok(r.igual, 'captura y presentador activan los mismos segmentos');
    assert.equal(r.viñetas, 2);
  } finally { await sesion.browser.close(); }
});
