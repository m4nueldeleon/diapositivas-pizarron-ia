import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { reglasSincronia, reglasPersona } from '../scripts/lib/sincronia.mjs';
import { construirHTML } from '../scripts/lib/construir.mjs';
import { lineaTiempo } from '../scripts/lib/layouts-datos.mjs';
import { describirPasos } from '../scripts/lib/pasos-mapa.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const revisar = (lamina, revela, extra = {}) => reglasSincronia({ laminas: [lamina], ...extra }, { pasos: [revela.length], revela: [revela] });
const persona = (lamina, texto, declarada) => reglasPersona({ laminas: [lamina], ...(declarada ? { persona: declarada } : {}) }, { pasos: [1], revela: [[[`«${texto}»`]]] });

test('sincronía: plantilla entra en paso 1 pero se dice después; claves anteriores o presentes no avisan', () => {
  const l = { tipo: 'idea', texto: '**Plantilla**', voz: ['Inicio', 'La estructura tiene dos partes', 'Ahora esta plantilla'] };
  const mapa = [[], ['📄 «Plantilla»'], []];
  assert.match(revisar(l, mapa).avisos[0], /paso 1.*adelanta.*paso 2/);
  assert.deepEqual(revisar({ ...l, voz: ['La plantilla', 'La estructura', 'Ahora esta plantilla'] }, mapa).avisos, []);
  assert.deepEqual(revisar({ ...l, voz: 'Sin arreglo alineado' }, mapa).avisos, []);
});

test('sincronía: raíces, negrita y números escritos coinciden', () => {
  const l = { tipo: 'idea', texto: '**Plantillas** de estructura', voz: ['Inicio', 'Una estructura simple', 'Ahora la plantilla'] };
  assert.equal(revisar(l, [[], ['«Plantillas de estructura»'], []]).avisos.length, 1);
  for (const [cifra, dicho] of [['100', 'cien'], ['342', 'trescientos cuarenta y dos'], ['2000', 'dos mil'], ['3000000', 'tres millones']]) {
    assert.deepEqual(revisar({ tipo: 'cifra', voz: ['Inicio', dicho, cifra] }, [[], [`«${cifra}»`], []]).avisos, [], dicho);
  }
});

test('sincronía: fuente citada en paso 0 y visible en 1 pide fuente_paso', () => {
  const l = { tipo: 'idea', fuente: 'Stanford (2024)', voz: ['Según Stanford, hay cambios', 'El dato'] };
  assert.match(revisar(l, [[], ['«Stanford (2024)»']]).avisos[0], /fuente llega tarde.*fuente_paso: 0/);
  assert.deepEqual(revisar({ ...l, fuente_paso: 0 }, [['«Stanford (2024)»'], []]).avisos, []);
});

test('sincronía: excluye encabezados, calificación, columnas, cámara, revelar todo y sellos resumen', () => {
  const voz = ['Inicio', 'Otra cosa', 'Plantilla'];
  for (const l of [{ tipo: 'lista', encabezado: 'Plantilla' }, { tipo: 'tarjetas', encabezado: 'Plantilla' },
    { tipo: 'calificacion', filas: [{ texto: 'Plantilla' }] }, { tipo: 'tabla', filas: [{ etiqueta: 'Plantilla' }] },
    { tipo: 'tabla', columnas: ['Plantilla'] }, { tipo: 'camara' }, { tipo: 'idea', revelar: 'todo' }]) {
    assert.deepEqual(revisar({ ...l, voz }, [[], ['«Plantilla»'], []]).avisos, [], l.tipo);
  }
  assert.deepEqual(revisar({ tipo: 'idea', voz }, [[], ['sello «Plantilla»'], []]).avisos, []);
});

test('sincronía: marcas de color se asignan al primer tramo coincidente, al último sin coincidencia y respetan explícitos', () => {
  const l = { tipo: 'linea-tiempo', marcas: [{ texto: 'Base' }, { texto: 'Verde', tono: 'v' }, { texto: 'Roja', tono: 'r' }, { texto: 'Explícita', tono: 'v', paso: 1 }],
    tramos: [{ desde: 0, hasta: 1, paso: 2 }, { desde: 1, hasta: 1, paso: 4 }] };
  let max = 0;
  const html = lineaTiempo(l, { vertical: false, P: k => { max = Math.max(max, k); return ` data-p="${k}"`; } });
  const mapa = describirPasos(html, max + 1);
  assert.ok(mapa[0].some(t => t.includes('Base')));
  assert.ok(mapa[1].some(t => t.includes('Explícita')));
  assert.ok(mapa[2].some(t => t.includes('Verde')));
  assert.ok(mapa[4].some(t => t.includes('Roja')));
  assert.equal(revisar(l, mapa).avisos.length, 1);
});

test('sincronía: remates explícitos en paso 0 de láminas largas avisan; revelado entero no', () => {
  for (const campos of [{ sello: 'LISTO', sello_paso: 0 }, { nota: '{r:Ya quedó}', nota_paso: 0 }, { texto: '~~Falso~~', tachar_paso: 0 }]) {
    assert.match(revisar({ tipo: 'idea', ...campos }, [[], [], []]).avisos[0], /paso 0 adelanta el remate/);
    assert.deepEqual(revisar({ tipo: 'idea', ...campos }, [[], []]).avisos, []);
  }
});

test('persona: te frente a ustedes da error con o sin persona declarada', () => {
  const l = { tipo: 'idea', texto: 'Te sirve', voz: 'Ustedes pueden' };
  assert.equal(persona(l, l.texto).errores.length, 1);
  assert.equal(persona(l, l.texto, 'tu').errores.length, 1);
  assert.equal(persona(l, l.texto, 'ustedes').errores.length, 1);
  assert.deepEqual(persona({ ...l, voz: 'Te sirve' }, 'Te sirve', 'tu'), { errores: [], avisos: [] });
});

test('persona: citas, excepciones, posesivo su y límites de palabra no disparan', () => {
  assert.deepEqual(persona({ tipo: 'idea', voz: '«Te sirve», escribió Juan' }, 'Ustedes', 'ustedes').errores, []);
  assert.deepEqual(persona({ tipo: 'idea', texto: '«Te sirve», escribió Juan', voz: 'Ustedes' }, '«Te sirve», escribió Juan', 'ustedes').errores, []);
  assert.deepEqual(persona({ tipo: 'idea', voz: 'Su cliente tiene los datos y les habla' }, 'Su cliente', 'tu').errores, []);
  assert.deepEqual(persona({ tipo: 'idea', voz: 'El tema contiene titulares' }, 'Contiene títulos', 'ustedes').errores, []);
  for (const excepcion_persona of ['titulo-formula', 'cita', 'a-si-mismo', 'a-la-ia']) {
    assert.deepEqual(persona({ tipo: 'idea', voz: 'Ustedes', excepcion_persona }, 'Tú', 'tu').errores, []);
  }
});

test('sincronía: columnas numéricas de rejilla no se leen como títulos', () => {
  assert.deepEqual(revisar({ tipo: 'rejilla', columnas: 4, voz: ['Inicio', 'Cajas'] }, [[], ['«Cajas»']]).avisos, []);
});

test('sincronía: nota gris y etiquetas gráficas no disparan; fuente con voz string sí', () => {
  assert.deepEqual(revisar({ tipo: 'idea', nota: 'Ya quedó', nota_paso: 0 }, [[], [], []]).avisos, []);
  for (const etiqueta of ['★ 5', 'clic/cursor', 'trazo', 'cambio']) {
    assert.deepEqual(revisar({ tipo: 'idea', voz: ['Inicio', 'Otra cosa', etiqueta] }, [[], [etiqueta], []]).avisos, [], etiqueta);
  }
  assert.match(revisar({ tipo: 'idea', fuente: 'Stanford (2024)', fuente_paso: 1, voz: 'Según Stanford hay cambios' }, [[], ['«Stanford (2024)»']]).avisos[0], /fuente llega tarde/);
});

test('persona: normaliza acentos y revisa pantalla acumulada, sin metadata', () => {
  assert.equal(persona({ tipo: 'idea', voz: 'Imáginen esto' }, 'Tú puedes', 'tu').errores.length, 1);
  const l = { tipo: 'idea', texto: 'Te sirve', voz: ['Inicio', 'Ustedes pueden'] };
  const r = reglasPersona({ laminas: [l] }, { pasos: [2], revela: [[['«Te sirve»'], []]] });
  assert.match(r.errores[0], /paso 1/);
  const metadata = { accion: 'Tú explicas', si_falla: 'Tú muestras', procedencia: 'Tú', credibilidad: { texto: 'Tú' }, _comentario: 'Tú' };
  assert.deepEqual(reglasPersona({ persona: 'ustedes', laminas: [{ tipo: 'idea', texto: 'Ustedes pueden', voz: 'Ustedes', ...metadata }] }), { errores: [], avisos: [] });
});

test('sincronía y persona: ejemplos, demo y réplica no agregan avisos', () => {
  const carpetas = fs.readdirSync(path.join(RAIZ, 'ejemplos')).map(n => path.join('ejemplos', n));
  for (const carpeta of [...carpetas, 'pruebas/replica']) {
    const archivo = path.join(RAIZ, carpeta, 'deck.json');
    if (!fs.existsSync(archivo)) continue;
    const deck = JSON.parse(fs.readFileSync(archivo, 'utf8'));
    const armado = construirHTML({ deck, dirDeck: path.dirname(archivo), dirSalida: path.join(os.tmpdir(), 'pz-sincronia-r6', carpeta), dirSkill: RAIZ });
    for (const regla of [reglasSincronia, reglasPersona]) assert.deepEqual(regla(armado.deck, armado), { errores: [], avisos: [] }, `${carpeta}: ${regla.name}`);
  }
});

test('sincronía: énfasis corto y número compuesto no producen omisiones ni adelantos falsos', () => {
  const deck = { laminas: [{ tipo: 'lista', items: ['Inicio', 'Usa **IA**', 'Cierre'], voz: ['Inicio', 'La herramienta', 'IA'] }] };
  assert.ok(reglasSincronia(deck, { pasos: [3], revela: [[['«Inicio»'], ['«Usa IA»'], ['«Cierre»']]] }).avisos.some(a => /adelanta a la voz/.test(a)));
  const numero = { laminas: [{ tipo: 'cifra', lineas: ['Inicio', '2100', 'Cierre'], voz: ['Inicio', 'Dos mil cien', '2100'] }] };
  assert.deepEqual(reglasSincronia(numero, { pasos: [3], revela: [[['«Inicio»'], ['«2100»'], ['«Cierre»']]] }).avisos, []);
  const tachado = { laminas: [{ tipo: 'idea', texto: '~~Viejo~~', texto_paso: 1, tachar_paso: 0, nota: 'Cierre', nota_paso: 2 }] };
  assert.deepEqual(reglasSincronia(tachado, { pasos: [3] }).avisos, []);
});
