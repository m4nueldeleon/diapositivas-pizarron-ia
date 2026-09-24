// Datos que se llenan una vez ({{CLAVE}}), huecos a la vista y hojas de contacto con la misma numeración.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sustituirDatos, validarDatos } from '../scripts/lib/datos.mjs';
import { marcar } from '../scripts/lib/markup.mjs';
import { validarDeck } from '../scripts/lib/contrato.mjs';
import { LAYOUTS } from '../scripts/lib/construir.mjs';
import { cuadrosHoja, htmlHoja, filasPasos, rotulo } from '../scripts/lib/hoja.mjs';

test('datos: {{CLAVE}} se llena en todos los textos sin mutar el deck; la que falta queda como [CLAVE]', () => {
  const deck = { datos: { PRECIO: '$4,997' }, laminas: [
    { tipo: 'cifra', id: 'precio', lineas: ['Hoy: __{{PRECIO}}__'], voz: ['Hoy cuesta {{PRECIO}}'] },
    { tipo: 'idea', texto: 'Escribe al {{WHATSAPP}}', emoji: '📱' },
    { tipo: 'boton', boton: 'Pagar {{ PRECIO }}', nota: 'en {{DÍAS}} días o {{WHATSAPP}}' },
  ] };
  const copia = JSON.stringify(deck);
  const { deck: d, faltan } = sustituirDatos(deck);
  assert.equal(JSON.stringify(deck), copia, 'no muta el original');
  assert.equal(d.laminas[0].lineas[0], 'Hoy: __$4,997__');
  assert.equal(d.laminas[0].voz[0], 'Hoy cuesta $4,997');
  assert.equal(d.laminas[2].boton, 'Pagar $4,997');
  assert.equal(d.laminas[1].texto, 'Escribe al [WHATSAPP]');
  assert.deepEqual(faltan, { WHATSAPP: [2, 3], 'DÍAS': [3] });
  assert.equal(d.laminas[0].id, 'precio');
});

test('datos: claves en MAYÚSCULAS y valores de texto o número', () => {
  assert.deepEqual(validarDatos({ PRECIO: '$1', DIAS: 30 }), []);
  assert.equal(validarDatos({ precio: '$1' }).length, 1);
  assert.equal(validarDatos({ PRECIO: { a: 1 } }).length, 1);
  assert.equal(validarDatos(['x']).length, 1);
  assert.ok(validarDeck({ datos: { precio: 1 }, laminas: [{ tipo: 'idea', texto: 'x' }] }, Object.keys(LAYOUTS)).some(e => /MAYÚSCULAS/.test(e)));
});

test('marcar: un [DATO] en MAYÚSCULAS sale como hueco amarillo; [[mano]] y [nombre] no', () => {
  assert.equal(marcar('Hoy: [PRECIO]'), 'Hoy: <span class="hueco">[PRECIO]</span>');
  assert.ok(marcar('[[a mano]]').includes('class="mano"'));
  assert.ok(!marcar('Hola [nombre]').includes('hueco'));
});

test('post de prueba: exige «fuente» o «ejemplo», nunca los dos; «hueco» no exige nada', () => {
  const tipos = Object.keys(LAYOUTS);
  const v = capturas => validarDeck({ laminas: [{ tipo: 'prueba', capturas }] }, tipos);
  assert.ok(v([{ post: { texto: ['hola'] } }]).some(e => /sin «fuente» ni «ejemplo»/.test(e)));
  assert.ok(v([{ post: { texto: ['hola'] }, fuente: 'real', ejemplo: true }]).some(e => /a la vez/.test(e)));
  assert.deepEqual(v([{ post: { texto: ['hola'] }, fuente: 'real, con permiso' }]), []);
  assert.deepEqual(v([{ post: { texto: ['hola'] }, ejemplo: true }]), []);
  assert.deepEqual(v([{ hueco: 'La tuya va aquí' }]), []);
});

test('post de ejemplo: sin avatar, usuario ni fecha, con sello EJEMPLO y sin círculo sobre dinero', () => {
  const ctx = { P: () => '', A: () => '', img: () => '', avisos: [] };
  const h = LAYOUTS.prueba({ capturas: [{ ejemplo: true, post: { nombre: 'Ana', usuario: '@ana', fecha: '24 ene', texto: ['$3,000 por adelantado.'], clave: '$3,000 por adelantado.' } }] }, ctx);
  assert.ok(h.includes('sello-ejemplo'));
  assert.ok(!/class="av"|@ana|24 ene|···/.test(h));
  assert.ok(!h.includes('data-circulo'));
  const real = LAYOUTS.prueba({ capturas: [{ fuente: 'Captura real, con permiso', post: { nombre: 'Ana', texto: ['Me dijeron que sí.'], clave: 'Me dijeron que sí.' } }] }, ctx);
  assert.ok(real.includes('class="av"') && real.includes('data-circulo') && real.includes('Captura real, con permiso'));
  assert.ok(LAYOUTS.prueba({ capturas: [{ hueco: 'La tuya va aquí' }] }, ctx).includes('hueco-prueba'));
});

test('hoja de contacto: el rótulo es el número del PNG y del QA (cámaras incluidas); hoja-pasos rotula N.P', () => {
  const manifiesto = [
    { lamina: 0, id: 'gancho', tipo: 'idea', paso: 0, pasos: 2, archivo: 'laminas/01-gancho-1.png' },
    { lamina: 0, id: 'gancho', tipo: 'idea', paso: 1, pasos: 2, archivo: 'laminas/01-gancho-2.png' },
    { lamina: 1, id: 'hola', tipo: 'camara', paso: 0, pasos: 1, archivo: null },
    { lamina: 2, id: 'prepara', tipo: 'lista', paso: 0, pasos: 1, archivo: 'laminas/03-prepara-1.png' },
  ];
  const c = cuadrosHoja(manifiesto);
  assert.deepEqual(c.map(rotulo), ['1 · gancho', '2 · hola', '3 · prepara']);
  c.filter(x => x.archivo).forEach(x => assert.ok(x.archivo.startsWith(`laminas/${String(x.n).padStart(2, '0')}-`), x.archivo));
  assert.equal(c[0].archivo, 'laminas/01-gancho-2.png', 'el último paso');
  const h = htmlHoja(c, { W: 1920, H: 1080 }).html;
  assert.ok(h.includes('🎥 cámara') && h.includes('3 · prepara'));
  const f = filasPasos(manifiesto);
  assert.deepEqual(f.map(x => x.pasos.map(p => p.etiqueta)), [['1.1', '1.2'], ['3.1']]);
});
