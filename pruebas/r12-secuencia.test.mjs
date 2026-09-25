import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida } from '../scripts/lib/pipeline.mjs';
import { compararCronologia, compararSecuencia, inicioMovimiento, estabilidad, medirRegion } from '../scripts/lib/secuencia-referencia.mjs';
import { glifoSVG } from '../scripts/lib/emoji.mjs';

test('r12: arrastre configurado a 1500ms produce avance observable a 1625ms (8 cps)',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pz-r12-tiempo-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  fs.writeFileSync(path.join(dir,'deck.json'),JSON.stringify({marca:false,laminas:[{tipo:'pasos',n:3,clic:1}]}));
  const p=prepararSalida(dir),retrasos=[...p.html.matchAll(/"retraso":(\d+),"arrastre"/g)].map(m=>+m[1]);
  assert.deepEqual(retrasos,[1500,2200]);
});
test('r12: comparación temporal no aprueba referencias ausentes ni retrasos de 250ms',()=>{
  assert.equal(compararCronologia(1750,1500).estado,'revisar');
  assert.equal(compararCronologia(1750,1750).estado,'coincide');
  assert.equal(compararCronologia(null,1750).estado,'sin-cobertura');
  const m=x=>({regiones:{texto:{caja:{x,y:.2,w:.4,h:.1}}}});
  assert.equal(estabilidad([m(.1),m(.101)],'texto').estado,'estable');
  assert.equal(estabilidad([m(.1),m(.15)],'texto').estado,'revisar');
  assert.equal(estabilidad([],'texto').estado,'sin-medidas');
  assert.equal(estabilidad([m(.1),{regiones:{texto:{caja:null}}},m(.1)],'texto').estado,'revisar');
  assert.equal(medirRegion(new Uint8Array(400).fill(255),10,10,[0,0,1,1]).pixeles,0);
});
test('r12: el inicio temporal se observa en píxeles, no en un retraso declarado',()=>{
  const m=(ms,x)=>({ms,dom:{rutas:[{retraso:1}]},referencia:{regiones:{movimiento:{caja:{x,y:.4,w:.05,h:.05}}}}});
  assert.equal(inicioMovimiento([m(0,.3),m(375,.3),m(1500,.3),m(1750,.33)],'referencia'),1750);
  assert.equal(inicioMovimiento([m(0,.3),m(375,.3),m(1500,.3)],'referencia'),null);
});
test('r12: sin archivos de ráfaga no se declara cobertura',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pz-r12-sin-rafaga-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const q=await compararSecuencia({dir,page:null,medir:{addScriptTag:async()=>{}},ids:[],salida:dir});
  assert.equal(q.estado,'sin-cobertura');assert.ok(Object.values(q.cobertura).every(x=>x===false));
});
test('r12: entrada individual horizontal es distinta del boleto doble y no imprime texto',()=>{
  const entrada=glifoSVG('🎫','apple'),doble=glifoSVG('🎟️','apple');
  assert.ok(entrada&&doble);assert.notEqual(entrada,doble);assert.doesNotMatch(entrada,/<text\b/);
});
