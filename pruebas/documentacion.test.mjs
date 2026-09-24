// Toda receta JSON de la documentación tiene que pasar el contrato: un ejemplo de LAYOUTS.md que tumba el render
// (el calendario de «14 días» con 2 días) enseña a escribir decks rotos.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validarDeck } from '../scripts/lib/contrato.mjs';
import { LAYOUTS } from '../scripts/lib/construir.mjs';

const DOCS = ['references/LAYOUTS.md', 'SKILL.md', 'references/GUION-A-LAMINAS.md', 'references/ARCOS.md', 'references/PROTOCOLO.md'];
// Un bloque que es fragmento A PROPÓSITO lleva la marca <!-- fragmento --> en la línea anterior
export function recetas(md) {
  const out = [];
  const lineas = md.split('\n');
  for (let i = 0; i < lineas.length; i++) {
    if (!/^\s*```json\s*$/.test(lineas[i])) continue;
    const j = lineas.findIndex((l, k) => k > i && /^\s*```\s*$/.test(l));
    const cuerpo = lineas.slice(i + 1, j).join('\n');
    const fragmento = /<!--\s*fragmento/.test(lineas[i - 1] || '');
    if (/"tipo"|"laminas"/.test(cuerpo) && !fragmento) out.push({ linea: i + 1, cuerpo });
    i = j;
  }
  return out;
}

test('las recetas JSON de LAYOUTS, SKILL, GUION, ARCOS y PROTOCOLO pasan el contrato', () => {
  let n = 0;
  for (const f of DOCS) {
    const md = fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
    for (const { linea, cuerpo } of recetas(md)) {
      let j;
      assert.doesNotThrow(() => { j = JSON.parse(cuerpo); }, `${f}:${linea} no es JSON válido`);
      let laminas = j.laminas || (Array.isArray(j) ? j : [j]);
      // `foco` atenúa la lámina anterior: su receta se prueba con una lámina antes
      if (laminas[0] && laminas[0].tipo === 'foco') laminas = [{ tipo: 'idea', emoji: '💡', texto: 'Antes' }, ...laminas];
      assert.deepEqual(validarDeck({ ...(j.laminas ? j : {}), laminas }, Object.keys(LAYOUTS)), [], `${f}:${linea}`);
      n++;
    }
  }
  assert.ok(n >= 30, `solo ${n} recetas`);
});
