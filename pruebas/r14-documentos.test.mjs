// R14 (juez r12, punto 9): una sola regla de revelación por pieza. SKILL, ARCOS, GUION y LAYOUTS se leen línea por
// línea y cada rango de revelación que citan se compara contra RANGO_REVELACION, la misma constante que usa QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RANGO_REVELACION, reglasRevelacion } from '../scripts/lib/reglas-arco.mjs';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = ['SKILL.md', 'references/ARCOS.md', 'references/GUION-A-LAMINAS.md', 'references/LAYOUTS.md'];
const pct = ([a, b]) => `${Math.round(a * 100)}-${Math.round(b * 100)}`;
const PERMITIDOS = new Map(Object.entries(RANGO_REVELACION).map(([pieza, r]) => [pct(r), pieza]));

// Rangos «55-60 %», «55–60%», «entre el 75 y el 82%», «≈ 0.55-0.60 × N»
function rangos(linea) {
  const out = [];
  for (const m of linea.matchAll(/(\d{2})\s*%?\s*(?:-|–|y el|y)\s*(?:el\s*)?(\d{2})\s*%/g)) out.push(`${m[1]}-${m[2]}`);
  for (const m of linea.matchAll(/0\.(\d{2})\s*[-–]\s*0\.(\d{2})\s*×/g)) out.push(`${m[1]}-${m[2]}`);
  return out;
}
function pieza(texto) {
  const corto = /vsl-corto|VSL corto/i.test(texto), largo = /`vsl`(?! o `vsl-corto`)|vsl` largo|VSL largo/.test(texto);
  return corto && !largo ? 'vsl-corto' : largo && !corto ? 'vsl' : null;
}

test('r14: cada rango de revelación citado en la documentación coincide con RANGO_REVELACION de su pieza', () => {
  const problemas = [];
  for (const doc of DOCS) {
    let seccion = '';
    fs.readFileSync(path.join(RAIZ, doc), 'utf8').split('\n').forEach((linea, i) => {
      if (/^#{2,4} /.test(linea)) seccion = linea;
      if (!/revel/i.test(linea)) return;
      for (const r of rangos(linea)) {
        const esperado = pieza(linea) || pieza(seccion);
        if (!PERMITIDOS.has(r)) problemas.push(`${doc}:${i + 1} cita la revelación al ${r}%, que no es una regla vigente (${[...PERMITIDOS.keys()].join(', ')})`);
        else if (esperado && PERMITIDOS.get(r) !== esperado) problemas.push(`${doc}:${i + 1} atribuye ${r}% a ${esperado}; su regla es ${pct(RANGO_REVELACION[esperado])}%`);
      }
      if (/tanto a `vsl` como a `vsl-corto`|ambos VSL/.test(linea)) problemas.push(`${doc}:${i + 1} vuelve a unificar los dos VSL en un solo rango`);
    });
  }
  assert.deepEqual(problemas, []);
});

test('r14: la documentación cita las dos reglas y QA usa exactamente esos límites', () => {
  const todo = DOCS.map(d => fs.readFileSync(path.join(RAIZ, d), 'utf8')).join('\n');
  for (const r of PERMITIDOS.keys()) assert.ok(rangos(todo.split('\n').filter(l => /revel/i.test(l)).join('\n')).includes(r), `nadie documenta ${r}%`);
  const deck = (p, antes) => ({ pieza: p, laminas: [{ tipo: 'idea', texto: 'Antes', dur: antes }, { tipo: 'oscura', texto: 'Oferta', dur: 100 - antes }] });
  for (const [p, [a, b]] of Object.entries(RANGO_REVELACION)) {
    assert.equal(reglasRevelacion(deck(p, a * 100), [1, 1]).avisos.length, 0, `${p} en ${a}`);
    assert.equal(reglasRevelacion(deck(p, b * 100), [1, 1]).avisos.length, 0, `${p} en ${b}`);
    assert.equal(reglasRevelacion(deck(p, a * 100 - 1), [1, 1]).avisos.length, 1, `${p} bajo ${a}`);
  }
});
