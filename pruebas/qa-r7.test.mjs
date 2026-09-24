// Las pruebas geométricas se omiten explícitamente si Chromium no puede arrancar.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararSalida, abrir, lanzarChromium, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { medidasTrazos } from '../scripts/lib/medidas-trazos.mjs';
const fixture=path.join(DIR_SKILL,'pruebas/fixtures/motor-r7');
function temporal(t) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pz-qa-r7-'));
  t.after(() => fs.rmSync(dir,{recursive:true,force:true})); return dir;
}
async function disponible(t) {
  try { const navegador=await lanzarChromium(); await navegador.close(); return true; }
  catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(`SIN RENDER: ${e.motivo}`); return false; }
}
function ejecutarQA(dir,salida) {
  const r=spawnSync(process.execPath,[path.join(DIR_SKILL,'scripts/qa.mjs'),dir,'--salida',salida,'--json'],{encoding:'utf8',env:{...process.env,PIZARRON_MARCA:'no'}});
  const archivo=path.join(salida,'qa.json');
  assert.ok(fs.existsSync(archivo),r.stderr || r.stdout);
  return JSON.parse(fs.readFileSync(archivo));
}
test('A/B/C/H/I/O: geometría de flujos, óvalo, llave, muro, celular, captura y agenda', {timeout:180000}, async t => {
  if (!await disponible(t)) return;
  const salida=temporal(t), p=prepararSalida(fixture,salida);
  assert.deepEqual(p.avisos,[]);
  const {browser,page,errores}=await abrir(p.htmlPath,p.W,p.H); t.after(() => browser.close());
  await page.addScriptTag({content:`window.medidasR7=${medidasTrazos.toString()}`});
  const r=await page.evaluate(() => {
    const caja=e => {const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,cx:b.x+b.width/2,cy:b.y+b.height/2};};
    return window.PZ.lams.map(l => {
      window.PZ.mostrar(l,Number(l.dataset.pasos)-1,Infinity);
      const ancla=id => l.querySelector(`[data-a="${id}"]`);
      const fl=[...l.querySelectorAll('path[data-clase="flecha"]')].map(f => ({destino:f.dataset.a,f:caja(f),a:ancla(f.dataset.de) ? caja(ancla(f.dataset.de)) : null,b:ancla(f.dataset.a) ? caja(ancla(f.dataset.a)) : null}));
      return {id:l.id,flujo:fl,encabezado:l.querySelector('.encabezado') ? caja(l.querySelector('.encabezado')) : null,
        columnas:l.querySelector('.fila-igual')?.dataset.columnas,
        ovalo:l.querySelector('.circ') ? caja(l.querySelector('.circ')) : null,
        elipse:l.querySelector('path[data-clase="ovalo"]') ? caja(l.querySelector('path[data-clase="ovalo"]')) : null,
        celda:[...l.querySelectorAll('.chat-muro > .chat-celda')].map(caja),
        pantalla:l.querySelector('.celular-pantalla') ? caja(l.querySelector('.celular-pantalla')) : null,
        burbujas:[...l.querySelectorAll('.celular .burbuja')].map(caja),
        eventos:[...l.querySelectorAll('.agenda-evento')].map(e => ({paso:e.dataset.p,caja:caja(e)})),
        medida:window.medidasR7(l)};
    });
  });
  assert.deepEqual(errores,[]);
  for (const l of r.slice(0,2)) for (const f of l.flujo) {
    assert.ok(f.a && f.b); assert.ok(Math.abs(f.a.cy-f.b.cy)<2,'flecha mixta oblicua');
    assert.ok(Math.abs(f.f.cy-f.a.cy)<.25*f.a.h,'flecha fuera de la etiqueta');
    if(l.encabezado) assert.ok(f.f.y>=l.encabezado.y+l.encabezado.h+40);
  }
  assert.equal(r[2].columnas,'propias');
  assert.ok(r[3].elipse.w>r[3].ovalo.w && r[3].elipse.h>r[3].ovalo.h);
  assert.ok(r[3].flujo.some(f => f.a && f.b && f.destino==='ovalo'),'gancho hacia el óvalo');
  assert.equal(r[5].celda.length,6); assert.ok(Math.abs(r[5].celda[0].y-r[5].celda[1].y)<2);
  assert.ok(r[5].celda[2].y>r[5].celda[0].y);
  const s=r[6].pantalla;
  assert.equal(r[6].burbujas.length,3);
  assert.ok(r[6].burbujas.every(b => b.x>=s.x && b.x+b.w<=s.x+s.w+1 && b.y>=s.y && b.y+b.h<=s.y+s.h+1));
  assert.deepEqual(r[7].medida.errores,[]);
  assert.ok(!r[8].medida.avisos.some(a => /subrayado/.test(a)));
  assert.equal(r[9].eventos.length,8); assert.equal(new Set(r[9].eventos.map(e => e.paso)).size,2);
  // Defectos medidos: las reglas también deben detectar una geometría deliberadamente rota.
  const defectos=await page.evaluate(() => {
    const l=window.PZ.lams;
    l[0].querySelector('[data-a="et0"]').style.cssText='display:inline-block;height:0;overflow:hidden';
    const flecha=l[0].querySelector('path[data-clase="flecha"]'); flecha.setAttribute('transform','translate(0,-300)');
    l[4].querySelector('[data-a="i1"]').style.transform='translateX(900px)';
    l[4].querySelector('.anotacion').style.left='2200px';
    l[7].querySelector('[data-circulo-img]').dataset.circuloImg='0,0,100,100';
    l[7].querySelector('.mensajes-superpuestos .burbuja').style.fontSize='40px';
    l[8].querySelector('path[data-clase="subrayado"]').dataset.sinEspacio='1';
    return [0,4,7,8].map(i => window.medidasR7(l[i]));
  });
  assert.ok(defectos[0].avisos.some(a => /0 px/.test(a)));
  assert.ok(defectos[1].errores.some(a => /no están en columna/.test(a)));
  assert.ok(defectos[1].errores.some(a => /se sale del lienzo/.test(a)));
  assert.ok(defectos[2].errores.some(a => /tapa el círculo/.test(a)));
  assert.ok(defectos[2].errores.some(a => /menos de 48/.test(a)));
  assert.ok(defectos[3].avisos.some(a => /no tiene espacio/.test(a)));
});
test('G/C/N: QA visual acumula los pasos tapados y el origen estructural', {timeout:240000}, async t => {
  if (!await disponible(t)) return;
  const casos=[
    {texto:'{{BONO_X}}',datos:{},clave:'BONO_X',error:true},
    {texto:'{{BONO_X}}',datos:{BONO_X:{pendiente:true,motivo:'Confirmar'}},clave:'BONO_X',borrador:true},
    {texto:'[PRECIO]',datos:{},clave:'PRECIO',error:true},
    {texto:'{{BONO_X}}',datos:{BONO_X:'Guía'},error:false}
  ];
  for (const c of casos) {
    const dir=temporal(t);
    fs.writeFileSync(path.join(dir,'deck.json'),JSON.stringify({marca:false,emoji:'apple',pieza:'libre',datos:c.datos,laminas:[{tipo:'idea',texto:'Una decisión'},{tipo:'stack',items:[{texto:c.texto}],remate:'Elige una acción'}]}));
    const r=ejecutarQA(dir,path.join(dir,'salida'));
    if(c.error) { assert.notEqual(r.estado,'listo'); assert.ok(r.errores.some(e => e.includes(`dato pendiente [${c.clave}]`))); }
    else if(c.borrador) { assert.equal(r.estado,'borrador'); assert.ok(r.por_confirmar.BONO_X.laminas.includes(2)); }
    else assert.ok(!r.errores.some(e => /dato pendiente/.test(e)));
  }
  const dir=temporal(t);
  fs.writeFileSync(path.join(dir,'deck.json'),JSON.stringify({marca:{texto:'tumarca',sufijo:'.com'},emoji:'apple',pieza:'libre',laminas:[{tipo:'idea',texto:'((Uno)) ((Dos))'}]}));
  const r=ejecutarQA(dir,path.join(dir,'salida'));
  assert.ok(r.errores.some(e => /más de un óvalo/.test(e))); assert.ok(r.por_confirmar.FIRMA);
});
test('F: render deja PNG y manifiestos de réplica vieja en NO-VALE', {timeout:180000}, async t => {
  if (!await disponible(t)) return;
  const dir=temporal(t),salida=path.join(dir,'salida');
  fs.writeFileSync(path.join(dir,'deck.json'),JSON.stringify({marca:false,emoji:'apple',pieza:'libre',laminas:[1,2,3].map(n => ({id:`r${n}`,tipo:'idea',texto:`Paso ${n}`}))}));
  const r=spawnSync(process.execPath,[path.join(DIR_SKILL,'scripts/render.mjs'),dir,'--salida',salida],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr); assert.match(r.stdout+r.stderr,/láminas NO VALE/);
  assert.ok(fs.readdirSync(path.join(salida,'laminas-NO-VALE')).every(n => n.startsWith('NO-VALE-')));
  assert.ok(!fs.existsSync(path.join(salida,'laminas')));
  assert.equal(JSON.parse(fs.readFileSync(path.join(salida,'hojas.json'))).laminas_dir,'laminas-NO-VALE');
  const pasos=JSON.parse(fs.readFileSync(path.join(salida,'pasos.json')));
  assert.ok(pasos.every(p => p.laminas_dir==='laminas-NO-VALE' && p.archivo.startsWith('laminas-NO-VALE/NO-VALE-')));
});

test('A/B: mixto sin etiqueta, tarjetas con ancho propio y flujo vertical sin falso aviso', {timeout:120000}, async t => {
  if (!await disponible(t)) return;
  for (const formato of ['16:9','9:16']) {
    const dir=temporal(t);
    const laminas=[{tipo:'flujo',nodos:[{emoji:'📋'},{etiqueta:'Revisión'}]},
      {tipo:'flujo',nodos:[{emoji:'📋',etiqueta:'Tus tareas pendientes',tarjeta:true},{emoji:'💯',etiqueta:'Revisa',tarjeta:true}]}];
    fs.writeFileSync(path.join(dir,'deck.json'),JSON.stringify({marca:false,emoji:'apple',formato,laminas}));
    const p=prepararSalida(dir,path.join(dir,'salida'));
    const {browser,page,avisos}=await abrir(p.htmlPath,p.W,p.H);
    try {
      assert.ok(!avisos.some(a => /ancla.*no existe|no existe.*ancla/.test(a)),avisos.join('\n'));
      await page.addScriptTag({content:`window.medidasR7=${medidasTrazos.toString()}`});
      const r=await page.evaluate(() => window.PZ.lams.map(l => {
        window.PZ.mostrar(l,window.PZ.pasos(l)-1,Infinity);
        const fila=l.querySelector('.fila-igual');
        const nodos=fila ? [...fila.querySelectorAll(':scope > .nodo')].map(e => e.getBoundingClientRect()) : [];
        return {medida:window.medidasR7(l),propias:fila?.dataset.columnas,ancho:nodos.length ? nodos.at(-1).right-nodos[0].left : 0,util:l.offsetWidth-240};
      }));
      assert.ok(r.every(x => !x.medida.avisos.some(a => /banda vertical|0 px/.test(a))),JSON.stringify(r));
      assert.ok(r.every(x => x.propias!=='propias' || x.ancho<=x.util+1));
    } finally { await browser.close(); }
  }
});
