// Cada modelo se copia fuera del repositorio: QA nunca deja artefactos dentro de ejemplos/.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DIR_SKILL, lanzarChromium } from '../scripts/lib/pipeline.mjs';
const ejemplos=path.join(DIR_SKILL,'ejemplos');
for(const nombre of fs.readdirSync(ejemplos).filter(n => fs.existsSync(path.join(ejemplos,n,'deck.json')))) {
  test(`O/Q: modelo ${nombre}, sin avisos y nota sin tope 100`,{timeout:240000},async t => {
    try { const browser=await lanzarChromium(); await browser.close(); }
    catch(e) { if(e.code!=='SIN_NAVEGADOR') throw e; t.skip(`SIN RENDER: ${e.motivo}`); return; }
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pz-modelo-r7-'));
    t.after(() => fs.rmSync(dir,{recursive:true,force:true}));
    fs.cpSync(path.join(ejemplos,nombre),dir,{recursive:true,filter:ruta => path.basename(ruta)!=='salida'});
    const salida=path.join(dir,'salida');
    const proceso=spawnSync(process.execPath,[path.join(DIR_SKILL,'scripts/qa.mjs'),dir,'--salida',salida],{encoding:'utf8',env:{...process.env,PIZARRON_MARCA:'no'}});
    const archivo=path.join(salida,'qa.json'); assert.ok(fs.existsSync(archivo),proceso.stderr);
    const qa=JSON.parse(fs.readFileSync(archivo));
    assert.deepEqual(qa.errores,[]); assert.deepEqual(qa.avisos,[]);
    assert.equal(qa.nota_sin_tope ?? qa.nota,100);
  });
}
