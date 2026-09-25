// R19 (juez, pendiente 7 — baja): un usuario nuevo que sigue ARRANQUE al pie de la letra escribe un reel de 10+
// láminas con los 8 elementos típicos y choca con el tope de 60 s recién en el primer render (4 rondas de recorte
// de voz en la sesión del juez). ARRANQUE.md debe advertirlo antes de escribir, no dejar que el preflight lo diga.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DIR_SKILL } from '../scripts/lib/pipeline.mjs';

test('r19: ARRANQUE.md advierte que un reel largo con varios elementos suele pasar de 60 s', () => {
  const t = fs.readFileSync(path.join(DIR_SKILL, 'references/ARRANQUE.md'), 'utf8');
  assert.match(t, /pasa de 60 s/, 'ARRANQUE.md debe avisar la fricción de duración antes de escribir el deck');
});
