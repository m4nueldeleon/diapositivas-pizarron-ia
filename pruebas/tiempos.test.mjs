import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { tiemposAlineados, tiemposSecuenciales, cargarTranscripcion, normalizar, duracionPaso } from '../scripts/lib/tiempos.mjs';

const deck = { laminas: [
  { tipo: 'idea', voz: ['hay gente usando la ia para ganar lo mismo que un medico', 'sin experiencia previa en negocios'] },
  { tipo: 'camara', voz: 'dejame contarte como empece yo' },
  { tipo: 'pasos', voz: ['te voy a ensenar el sistema de tres pasos', 'que empieza con un clic'] },
] };
const pasos = [2, 1, 2];

// Transcripción ruidosa real (whisper tiny sobre voz sintética)
const ruidosa = 'El Pajente de San Dola Raya va para regano lo mismo que es un médico Sin experencho reviva en negocios Dejo en contra coma en Paju Tivó y ha enseñado el sistema de tres pesos KMP es a con un clic'
  .split(' ').map((w, i) => ({ word: w, start: i * 0.4, end: i * 0.4 + 0.35 }));

test('normaliza acentos y signos', () => {
  assert.deepEqual(normalizar('¡Déjame, CONTARTE!'), ['dejame', 'contarte']);
});

test('carga formatos de transcripción (whisper con segmentos y lista plana)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-'));
  const a = path.join(dir, 'a.json'), b = path.join(dir, 'b.json');
  fs.writeFileSync(a, JSON.stringify({ segments: [{ words: [{ word: ' Hola', start: 1, end: 1.3 }] }] }));
  fs.writeFileSync(b, JSON.stringify([{ palabra: 'Hola', inicio: 2, fin: 2.2 }]));
  assert.equal(cargarTranscripcion(a)[0].s, 1);
  assert.equal(cargarTranscripcion(b)[0].w, 'hola');
});

test('alinea con transcripción ruidosa: todas las anclas y en orden', () => {
  const { segs, reporte } = tiemposAlineados(deck, pasos, cargarDesde(ruidosa));
  assert.equal(reporte.filter(r => r.t == null).length, 0);
  for (let i = 1; i < segs.length; i++) assert.ok(segs[i].inicio > segs[i - 1].inicio);
  const idx = w => ruidosa.findIndex(x => x.word === w) * 0.4;
  assert.ok(Math.abs(segs[1].inicio - idx('Sin')) < 0.5, 'paso 2 arranca en «Sin»');
  assert.ok(Math.abs(segs[2].inicio - idx('Dejo')) < 0.5, 'cámara arranca en «Dejo»');
  assert.ok(Math.abs(segs[3].inicio - idx('Tivó')) < 0.5, 'pasos arranca en «Tivó»');
});

test('tiempos secuenciales: ritmo por voz y por omisión', () => {
  const segs = tiemposSecuenciales(deck, pasos);
  assert.equal(segs.length, 5);
  assert.equal(segs[0].inicio, 0);
  assert.ok(segs[4].fin > 8);
  assert.equal(duracionPaso({ tipo: 'idea' }, 0), 2.6);
  assert.equal(duracionPaso({ tipo: 'idea', dur: [1.5, 3] }, 1), 3);
});

function cargarDesde(lista) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-'));
  const f = path.join(dir, 't.json');
  fs.writeFileSync(f, JSON.stringify(lista));
  return cargarTranscripcion(f);
}
