// R14/R15 (jueces r14 y r15): un deck que ya salió aprobado no puede empeorar en silencio. La propuesta de la ronda 11
// pasó de 100 a 49 y la clase de 60 láminas de 97 a 70 sin que ninguna prueba lo notara. Cada carpeta de
// pruebas/fixtures/aprobados trae su deck (con sus assets) y esperado.json: se renderiza con el motor actual y falla si
// aparece un error o si la nota baja más de 3 puntos. Cada pieza que un juez apruebe entra aquí.
// R17 (juez r16): también falla con un aviso nuevo, con una medida de geometria_r11 que se sale de su tolerancia o con
// un PNG cuyo hash perceptual cambió o cuya tinta roja cambió más del 30% (solo en la plataforma donde se tomó la foto). Si el cambio es
// intencional: PZ_ACTUALIZAR_APROBADOS=1 node --test pruebas/r14-aprobados.test.mjs, MIRA las láminas que cambiaron y
// revisa el diff de esperado.json antes de publicar.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DIR_SKILL, lanzarChromium, nuevaPagina } from '../scripts/lib/pipeline.mjs';
import { avisosNuevos, normalizarAviso, fotoGeometrica, diferenciasGeometria, hashesPNG, diferenciasHash, rojoPNG, diferenciasRojo, plataformaHash } from '../scripts/lib/guardia.mjs';

const APROBADOS = path.join(DIR_SKILL, 'pruebas', 'fixtures', 'aprobados');
const ACTUALIZAR = process.env.PZ_ACTUALIZAR_APROBADOS === '1';

for (const nombre of fs.readdirSync(APROBADOS).filter(n => fs.existsSync(path.join(APROBADOS, n, 'deck.json')))) {
  test(`aprobados: «${nombre}» sin errores, sin avisos nuevos y sin cambios visuales`, { timeout: 600_000 }, async t => {
    let browser;
    try { browser = await lanzarChromium(); }
    catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(`SIN RENDER: ${e.motivo}`); return; }
    t.after(() => browser.close());
    const archivoEsperado = path.join(APROBADOS, nombre, 'esperado.json');
    const esperado = JSON.parse(fs.readFileSync(archivoEsperado, 'utf8'));
    const deck = JSON.parse(fs.readFileSync(path.join(APROBADOS, nombre, 'deck.json'), 'utf8'));
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-aprobado-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.cpSync(path.join(APROBADOS, nombre), dir, { recursive: true });
    const args = [path.join(DIR_SKILL, 'scripts/render.mjs'), dir, '--sin-hoja', '--qa', ...(esperado.borrador ? ['--borrador'] : [])];
    const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
    const qa = JSON.parse(fs.readFileSync(path.join(dir, 'salida', 'qa.json'), 'utf8'));
    const page = await nuevaPagina(browser);
    const hashes = await hashesPNG(page, path.join(dir, 'salida', 'laminas'));
    const rojo = await rojoPNG(page, path.join(dir, 'salida', 'laminas'));
    await page.close();
    const foto = fotoGeometrica(qa.geometria_r11), plataforma = plataformaHash(deck.emoji);
    assert.deepEqual(qa.errores, [], r.stdout.slice(-2000));
    assert.ok(qa.nota >= esperado.nota - 3, `${nombre}: la nota bajó de ${esperado.nota} a ${qa.nota}\n${r.stdout.slice(-2000)}`);
    if (ACTUALIZAR) {
      const nuevo = { nota: Math.max(esperado.nota, qa.nota), borrador: !!esperado.borrador,
        avisos: [...new Set(qa.avisos.map(normalizarAviso))].sort(), geometria: foto, hashes: { plataforma, png: hashes, rojo } };
      // las listas de números (tinta roja por celda) van en un renglón: la foto se lee en un diff
      fs.writeFileSync(archivoEsperado, JSON.stringify(nuevo, null, 1).replace(/\[\s+([\d,\s]+?)\s+\]/g, (_, x) => `[${x.replace(/\s+/g, '')}]`) + '\n');
      t.diagnostic(`${nombre}: esperado.json actualizado (${Object.keys(hashes).length} PNG)`);
      return;
    }
    assert.deepEqual(avisosNuevos(esperado.avisos, qa.avisos), [], `${nombre}: avisos nuevos`);
    assert.deepEqual(diferenciasGeometria(esperado.geometria, foto), [], `${nombre}: la geometría cambió`);
    if (esperado.hashes?.plataforma === plataforma) {
      assert.deepEqual(diferenciasHash(esperado.hashes.png, hashes), [], `${nombre}: láminas que cambiaron a la vista`);
      assert.deepEqual(diferenciasRojo(esperado.hashes.rojo, rojo), [], `${nombre}: la capa roja cambió`);
    }
    else t.diagnostic(`${nombre}: hash perceptual tomado en ${esperado.hashes?.plataforma || '—'}; aquí es ${plataforma}, no se compara`);
  });
}
