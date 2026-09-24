import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reglasAritmetica } from '../scripts/lib/aritmetica.mjs';
import { sustituirDatos } from '../scripts/lib/datos.mjs';
import { resolverComo } from '../scripts/lib/contrato.mjs';
import { plano } from '../scripts/lib/markup.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cuenta = (...lineas) => reglasAritmetica({ laminas: [{ id: 'cuenta', tipo: 'cifra', lineas }] });
const CORRECTAS = [
  ['1 millón × 0.1-0.3% = 1-3 mil'],
  ['1-3 mil × $25,000 = $25-75 millones'],
  ['$3,000 ÷ 30 días', '= $100 al día'],
  ['100 × 10-20% = 10-20', '× 30-50% = 3-10 clientes'],
  ['40 × 1-2 h', '× 20 días', '= 800-1,600 horas'],
  ['$179 − $80-100 = $79-99'],
  ['$299 × 10-15% = $30-45'],
  ['$6,997 ÷ 4 = $1,749'],
  ['Cobras a 45 días = 1.5 meses'],
  ['~~3 × $25,000 = $80,000~~'],
  ['100 × {{TASA}} = 20'],
  ['100 × [TASA] = 20'],
  ['**3** × {v:$25,000} = __$75,000__ = ==$75k=='],
  ['2 × 3 + 4 = 10'],
  ['10 - 2 = 8'],
  ['10-20 × 2 a 3 = 20-60'],
  ['2M ÷ 2 = 1 millón'],
];
for (const lineas of CORRECTAS) test(`aritmética correcta o ambigua: ${lineas.join(' / ')}`, () => assert.deepEqual(cuenta(...lineas).errores, []));

for (const lineas of [
  ['3 × $25,000 = $80,000'],
  ['1,000 × 0.1% = 10'],
  ['$299 − $120 = $199'],
  ['$299 − $100 = $199', '$179 × 2 = $358'],
  ['$299 − $100 = $199', '$179'],
]) test(`aritmética incorrecta: ${lineas.join(' / ')}`, () => assert.match(cuenta(...lineas).errores[0], /lámina 1 \(cuenta\): la cuenta no da:.*no /));

test('aritmética: una aproximación mayor debe estar marcada; cada forma legible detecta un resultado falso', () => {
  assert.deepEqual(cuenta('3 × $25,000 = ~$80,000').errores, []);
  for (const lineas of CORRECTAS.filter(ls => !ls.some(s => /~~|\[|\{\{|Cobras/.test(s)))) {
    const ultima = plano(lineas.at(-1)), i = ultima.lastIndexOf('=');
    if (i < 0) continue;
    const falsa = [...lineas.slice(0, -1), `${ultima.slice(0, i + 1)} 987654321`];
    assert.ok(cuenta(...falsa).errores.length, lineas.join(' / '));
  }
});

test('aritmética: no interpreta voz, ecuaciones ambiguas, división entre cero ni paréntesis', () => {
  for (const texto of ['Precio pendiente', '100 × clientes = 20', '20 (1 + 2) = 60', '100 ÷ 0 = 100', '45 días = 1.5 meses']) assert.deepEqual(cuenta(texto).errores, [], texto);
  assert.deepEqual(reglasAritmetica({ laminas: [{ tipo: 'cifra', lineas: ['Sin cuenta'], voz: '3 por 25 mil son 80 mil' }] }), { errores: [], avisos: [] });
});

test('datos repetidos: 24/25 años avisa; {{DATO}}, rangos y cantidades con periodos distintos no', () => {
  const deck = { laminas: [{ tipo: 'idea', texto: '24 años de experiencia' }, { tipo: 'idea', texto: '25 años de experiencia' }] };
  assert.match(reglasAritmetica(deck).avisos[0], /cifras contradictorias.*24 años.*25 años.*\{\{AÑOS\}\}/);
  const crudo = { laminas: [{ tipo: 'idea', texto: '{{AÑOS}} años de experiencia' }, deck.laminas[1]] };
  assert.deepEqual(reglasAritmetica(deck, { crudo }).avisos, []);
  assert.deepEqual(reglasAritmetica({ laminas: [{ tipo: 'idea', texto: '10 clientes al día' }, { tipo: 'idea', texto: '100 clientes al mes' }] }).avisos, []);
  assert.deepEqual(reglasAritmetica({ laminas: [{ tipo: 'idea', texto: '10-20 clientes' }, { tipo: 'idea', texto: '20-30 clientes' }] }).avisos, []);
});

test('aritmética: IVA en palabras es ambiguo; [[USD]] es estilo y no un dato pendiente', () => {
  assert.deepEqual(cuenta('10 + IVA del 16% = 11.6').errores, []);
  assert.match(cuenta('[[USD]] 3 × 25 = 80').errores[0], /la cuenta no da/);
  assert.match(cuenta('3 × $25,000 = $80,000 del total').errores[0], /la cuenta no da/);
  assert.match(cuenta('100 × 10% = 90 clientes del programa').errores[0], /la cuenta no da/);
});

test('datos repetidos: rangos escritos con a no avisan, resaltados sí conservan la cifra', () => {
  const deck = textos => ({ laminas: textos.map(texto => ({ tipo: 'idea', texto })) });
  assert.deepEqual(reglasAritmetica(deck(['24 a 25 años', '26 a 27 años'])).avisos, []);
  assert.match(reglasAritmetica(deck(['==24 años==', '==25 años=='])).avisos[0], /cifras contradictorias/);
});

test('rejillas: 99/100=99% pasa; 3/100=10% y 3/100=1 de cada10 avisan', () => {
  const rejilla = (n, texto) => reglasAritmetica({ laminas: [{ tipo: 'rejilla', total: 100, destacar: Array.from({ length: n }, (_, i) => i), texto }] });
  assert.deepEqual(rejilla(99, '99%').avisos, []);
  assert.deepEqual(rejilla(98, '99%').avisos, []);
  assert.equal(rejilla(3, '10%').avisos.length, 1);
  assert.equal(rejilla(3, '1 de cada 10').avisos.length, 1);
});

test('aritmética y datos: todos los ejemplos y réplica sin nuevos hallazgos', () => {
  const carpetas = fs.readdirSync(path.join(RAIZ, 'ejemplos')).map(n => path.join('ejemplos', n));
  for (const carpeta of [...carpetas, 'pruebas/replica']) {
    const archivo = path.join(RAIZ, carpeta, 'deck.json');
    if (!fs.existsSync(archivo)) continue;
    const crudo = resolverComo(JSON.parse(fs.readFileSync(archivo, 'utf8'))).deck;
    const { deck } = sustituirDatos(crudo);
    assert.deepEqual(reglasAritmetica(deck, { crudo }), { errores: [], avisos: [] }, carpeta);
  }
});

test('cifras repetidas también en nombres de stack y etiquetas de pasos', () => {
  for (const laminas of [
    [24, 25].map(n => ({ tipo: 'stack', items: [{ nombre: `${n} años de experiencia` }] })),
    [24, 25].map(n => ({ tipo: 'pasos', etiquetas: [`${n} años de experiencia`] })),
  ]) assert.ok(reglasAritmetica({ laminas }).avisos.some(a => /contradictorias/.test(a)));
});
