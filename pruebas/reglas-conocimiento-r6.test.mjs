import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reglasNotasPonente, reglasAnclaPrecio, reglasConceptosIconos, reglasClaves, textosVisibles, revisarDeck } from '../scripts/lib/reglas-deck.mjs';
import { resolverComo } from '../scripts/lib/contrato.mjs';
import { sustituirDatos } from '../scripts/lib/datos.mjs';

const idea = (texto, otros = {}) => ({ id: 'idea', tipo: 'idea', texto, ...otros });

test('notas: si_falla requiere accion en el mismo paso, aunque otro paso sí la tenga', () => {
  const deck = { en_vivo: true, laminas: [idea('Abre el documento', { accion: ['Abre el archivo', ''], si_falla: ['', 'Muestra la captura'] })] };
  const r = reglasNotasPonente(deck);
  assert.deepEqual(r.errores, []);
  assert.equal(r.avisos.length, 1);
  assert.match(r.avisos[0], /paso 2: si_falla sin accion.*PROTOCOLO/);
  assert.deepEqual(reglasNotasPonente({ ...deck, laminas: [idea('Abre', { accion: 'Abre el archivo', si_falla: 'Muestra la captura' })] }).avisos, []);
});

test('notas: fuera de en_vivo avisa que el apoyo no aparece en video', () => {
  const r = reglasNotasPonente({ laminas: [idea('Abre', { accion: 'Abre el archivo' })] });
  assert.deepEqual(r.errores, []);
  assert.equal(r.avisos.length, 1);
  assert.match(r.avisos[0], /en video no se ven.*PROTOCOLO/);
});

test('notas: los textos comunes se repiten y los arreglos se leen por paso', () => {
  const revisar = (notas, pasos) => reglasNotasPonente({ en_vivo: true, laminas: [idea('Abre', notas)] }, pasos).avisos;
  assert.deepEqual(revisar({ accion: 'Abre archivo', si_falla: ['', 'Usa copia'] }), []);
  assert.deepEqual(revisar({ accion: ['Abre', 'Comprueba'], si_falla: 'Usa copia' }), []);
  const conHueco = revisar({ accion: ['Abre', ''], si_falla: 'Usa copia' });
  assert.equal(conHueco.length, 1);
  assert.match(conHueco[0], /paso 2: si_falla sin accion/);
  const porVoz = revisar({ accion: ['Abre'], si_falla: 'Usa copia', voz: ['Uno', 'Dos', 'Tres'] });
  assert.equal(porVoz.length, 2);
  assert.match(porVoz[1], /paso 3: si_falla sin accion/);
  const porMapa = revisar({ accion: ['Abre'], si_falla: 'Usa copia' }, [3]);
  assert.deepEqual(porMapa, porVoz);
  assert.deepEqual(revisar({ accion: 'Abre', si_falla: 'Usa copia', voz: ['Uno', 'Dos', 'Tres'] }, [4]), []);
});

test('notas: camara/vivo requiere plan B cuando el deck es en vivo', () => {
  const tramo = { id: 'practica', tipo: 'camara', vivo: true, texto: 'Abre la página' };
  const r = reglasNotasPonente({ en_vivo: true, laminas: [tramo] });
  assert.deepEqual(r.errores, []);
  assert.equal(r.avisos.length, 1);
  assert.match(r.avisos[0], /no tiene si_falla.*LAYOUTS/);
  assert.deepEqual(reglasNotasPonente({ en_vivo: false, laminas: [tramo] }).avisos, []);
  assert.deepEqual(reglasNotasPonente({ en_vivo: true, laminas: [{ ...tramo, accion: 'Abre', si_falla: 'Usa el respaldo' }] }).avisos, []);
});

test('precio: el saldo que llegará da aviso, con precio marcado o línea grande y también en voz', () => {
  for (const pieza of ['vsl', 'vsl-corto', 'webinar']) {
    for (const deuda of ['En la calle', 'Por cobrar', 'Te deben', 'Cuentas por cobrar']) {
      const l = { id: 'precio', tipo: 'cifra', lineas: [`${deuda}: $60–90 mil`, '{{PRECIO}}'] };
      const r = reglasAnclaPrecio({ pieza, laminas: [l] });
      assert.deepEqual(r.errores, []);
      assert.equal(r.avisos.length, 1);
      assert.match(r.avisos[0], /dinero que sí llegará.*LAYOUTS, Precio con ancla/);
    }
  }
  const l = { tipo: 'cifra', lineas: [{ texto: 'Programa: $800', tam: '120px' }], voz: 'Tienes cuentas por cobrar.' };
  assert.equal(reglasAnclaPrecio({ pieza: 'vsl', laminas: [l] }).avisos.length, 1);
  assert.deepEqual(reglasAnclaPrecio({ pieza: 'clase', laminas: [l] }).avisos, []);
});

test('precio: un costo calculado con Si, Pongamos o Con y ventas/facturación no dispara el aviso', () => {
  for (const inicio of ['Si', 'Pongamos', 'Con']) {
    const l = { tipo: 'cifra', arriba: `${inicio} dedicas 10 horas a cobranza`, lineas: ['10 × $200 = $2,000 al mes', '{{PRECIO}}'], voz: 'Tu costo de financiar ventas o facturación es este.' };
    assert.deepEqual(reglasAnclaPrecio({ pieza: 'vsl', laminas: [l] }).avisos, []);
  }
  const diagnostico = idea('Tienes cuentas por cobrar');
  assert.deepEqual(reglasAnclaPrecio({ pieza: 'vsl', laminas: [diagnostico] }).avisos, []);
});

test('precio: la línea grande usa el tamaño efectivo de cifra, heredado o predeterminado', () => {
  const revisar = campos => reglasAnclaPrecio({ pieza: 'vsl', laminas: [{ tipo: 'cifra', voz: 'Tienes cuentas por cobrar', ...campos }] }).avisos;
  assert.equal(revisar({ lineas: [{ texto: 'Programa $800' }] }).length, 1);
  assert.equal(revisar({ lineas: [{ texto: 'Costo' }, { texto: 'Programa $800' }] }).length, 1);
  assert.equal(revisar({ lineas: [{ texto: 'Programa $800' }], tam: '120px' }).length, 1);
  assert.deepEqual(revisar({ lineas: [{ texto: 'Programa $800' }], tam: '84px' }), []);
  assert.deepEqual(revisar({ lineas: ['Programa $800'], tam: '84px' }), []);
  assert.deepEqual(revisar({ lineas: [{ texto: 'Programa $800', tam: '64px' }], tam: '120px' }), []);
  assert.deepEqual(revisar({ lineas: [{ texto: 'Programa $800' }, { texto: 'Otra explicación' }] }), []);
});

test('iconos: avisa por dos conceptos y por no:X frente a X en otro concepto', () => {
  for (const emoji of ['💰', 'no:💰']) {
    const r = reglasConceptosIconos({ laminas: [idea('Dinero', { emoji }), idea('Tiempo', { id: 'tiempo', emoji: '💰' })] });
    assert.deepEqual(r.errores, []);
    assert.equal(r.avisos.length, 1);
    assert.match(r.avisos[0], /coherencia emoji↔concepto.*EMOJIS/);
    if (emoji.startsWith('no:')) assert.match(r.avisos[0], /negado con no:/);
  }
  assert.equal(reglasConceptosIconos({ laminas: [idea('Felicidad', { emoji: '😄' }), idea('Clientes', { emoji: '😄' })] }).avisos.length, 1);
});

test('iconos: ignora mapa, retornos como/paga y el mismo concepto resuelto', () => {
  const primero = idea('Dinero', { emoji: 'no:💰' });
  for (const segundo of [
    idea('Dinero', { emoji: '💰' }),
    idea('Tiempo', { emoji: '💰', como: 'idea' }),
    idea('Tiempo', { emoji: '💰', paga: 'idea' }),
    { tipo: 'pasos', etiquetas: ['Tiempo'], iconos: ['💰'] },
    { tipo: 'mapa', texto: 'Tiempo', emoji: '💰' },
  ]) assert.deepEqual(reglasConceptosIconos({ laminas: [primero, segundo] }).avisos, []);
});

test('iconos: cero avisos de conceptos en TODOS los ejemplos crudos y resueltos', () => {
  const carpeta = new URL('../ejemplos/', import.meta.url);
  for (const ejemplo of fs.readdirSync(carpeta)) {
    const archivo = new URL(`${ejemplo}/deck.json`, carpeta);
    if (!fs.existsSync(archivo)) continue;
    const crudo = JSON.parse(fs.readFileSync(archivo, 'utf8'));
    const resuelto = sustituirDatos(resolverComo(crudo).deck).deck;
    for (const deck of [crudo, resuelto]) assert.deepEqual(reglasConceptosIconos(deck).avisos, [], ejemplo);
  }
});

test('las reglas nuevas forman parte de revisarDeck y los vínculos no se leen en pantalla', () => {
  const deck = { pieza: 'vsl', persona_excepciones: ['Frase fija'], laminas: [{ tipo: 'cifra', id: 'precio', lineas: ['En la calle: $80 mil', '{{PRECIO}}'], accion: 'Abre el precio' }] };
  const r = revisarDeck(deck, [2], { crudo: deck });
  assert.ok(r.avisos.some(a => /dinero que sí llegará/.test(a)));
  assert.ok(r.avisos.some(a => /en video no se ven/.test(a)));
  assert.deepEqual(reglasClaves(deck).avisos, []);
  assert.deepEqual(textosVisibles(idea('Cierre', { como: 'gancho', paga: 'gancho' })), ['Cierre']);
});
