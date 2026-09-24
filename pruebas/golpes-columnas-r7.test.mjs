// Conteos reproducibles desde JSON y contrato de las columnas; no requieren Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { golpesDeck, tiposGolpe, reglasGolpes } from '../scripts/lib/reglas-arco.mjs';
import { tiposRojos, reglasCapaExpresiva } from '../scripts/lib/reglas-marcas.mjs';
import { reglasDeckCompleto } from '../scripts/lib/reglas-deck.mjs';
import { construirHTML } from '../scripts/lib/construir.mjs';
import { validarDeck, resolverComo } from '../scripts/lib/contrato.mjs';
import { evidenciaReplica, DIR_SKILL } from '../scripts/lib/pipeline.mjs';

const raiz = path.join(os.tmpdir(), 'pz-pruebas-golpes');
const idea = texto => ({ tipo:'idea', texto });
const plano = n => ({ laminas:Array.from({length:n},(_,i) => i%2 ? idea('El equipo aprende') : {tipo:'lista',vineta:'check',items:['Practicar'],nota:'Un comentario gris'}) });
const temporal = t => {
  fs.mkdirSync(raiz,{recursive:true});
  const dir = fs.mkdtempSync(path.join(raiz,'caso-'));
  t.after(() => fs.rmSync(dir,{recursive:true,force:true})); return dir;
};

test('golpes: lista cerrada; subrayado, nota gris y viñeta no son golpe', () => {
  const casos = [
    {...idea('Texto'),sello:'Listo'}, idea('~~Descarta~~'), {tipo:'lista',items:[{texto:'Descarta',tachado:true}],tachar_despues:true},
    {tipo:'rejilla',total:20}, {tipo:'rejilla',multitud:true}, {tipo:'circulos'}, {tipo:'cifra',valor:'4'},
    {...idea('Alto'),tam_texto:'160px'}, {tipo:'bifurcacion',llave:'Mismo costo'},
    {tipo:'lista',items:['Uno','Dos'],anotaciones:[{llave:['i0','i1'],texto:'Una decisión'}]},
    {tipo:'chat',mensajes:[],anotaciones:[{a:'m0',texto:'Costo'}]}, {tipo:'objeto',emoji:'📦'},
    {tipo:'tarjetas',items:[{texto:'Tarea'}]}, {tipo:'boton',boton:'Entrar'}, idea('((4))'),
    {tipo:'tabla',filas:[{celdas:[{texto:'4',circulo:true}]}]}, {tipo:'prueba',capturas:[{circulo:[1,2,3,4]}]},
    {tipo:'rejilla',total:10,encerrar:0,bandas:[{desde:0,hasta:1}]},
  ];
  for (const c of casos) assert.ok(tiposGolpe(c).length,JSON.stringify(c));
  for (const c of [idea('__Texto__'),{...idea('Texto'),nota:'Nota'}, {tipo:'lista',vineta:'check',items:['Uno']}, {tipo:'oscura',titulo:'Marca',sello:'Hola'}]) assert.deepEqual(tiposGolpe(c),[]);
});

test('golpes: cámara y oscura no cortan ni suman la racha; plano avisa y cifras monótonas también', () => {
  const d = plano(12);
  d.laminas = [...d.laminas.slice(0,6),{tipo:'camara'},{tipo:'oscura',titulo:'Marca'},...d.laminas.slice(6)];
  assert.deepEqual(golpesDeck(d),{total:0,laminas:[],mayorTramoSin:12});
  assert.match(reglasGolpes(d).avisos.join(' '),/12 láminas seguidas/);
  const cifras = {laminas:Array.from({length:20},()=>({tipo:'cifra',valor:'3'}))};
  assert.match(reglasGolpes(cifras).avisos.join(' '),/60 %/);
  assert.equal(reglasGolpes(plano(11)).avisos.length,0);
});

test('capa roja: ✅ con nota y tabla no cumplen; tres tipos distribuidos sí', () => {
  const d = plano(12), r = reglasCapaExpresiva(d);
  assert.ok(r.avisos.some(a=>/menos de 3/.test(a)));
  assert.ok(r.avisos.some(a=>/4 láminas/.test(a)));
  assert.deepEqual(tiposRojos({tipo:'tabla',filas:[{celdas:['Dato']}],nota:'Comentario'}),[]);
  assert.deepEqual(tiposRojos({...idea('Texto'),voz:'__No visible__',fuente:'((No visible))'}),[]);
  assert.deepEqual(tiposRojos({...idea('Texto'),procedencia:'__No visible__',anotaciones:[{a:'texto'}]}),[]);
  for (const flecha of ['ninguna','arco-negro']) assert.deepEqual(tiposRojos({tipo:'flujo',flecha,nodos:[{},{}],flechas:[{}],retornos:[{desde:1,hasta:0}]}),[]);
  assert.ok(tiposRojos({tipo:'chat',letras:['A'],mensajes:[{de:'prompt',texto:'Una regla'}]}).includes('círculo'));
  assert.deepEqual(tiposGolpe({...idea('Decide'),tam_texto:'enorme'}),['palabra']);
  const bien = {laminas:d.laminas.map((l,i)=> i%3 ? l : {...idea(i===0 ? '__Prioridad__' : i===3 ? '((Valor))' : '~~Descarta~~')})};
  assert.deepEqual(reglasCapaExpresiva(bien).avisos,[]);
  assert.ok(reglasDeckCompleto(d).avisos.some(a=>/25 %/.test(a)));
});

const columnas = {tipo:'lista',id:'frontera',columnas:[
  {titulo:'Sí',items:['Ordena','Sugiere'],llave:'Tú eliges'},
  {titulo:'No',vineta:'cruz',items:['Firma','Paga']},
]};
test('columnas: XOR, máximo dos, llave de texto y como la conserva', () => {
  const base = {laminas:[columnas]};
  assert.deepEqual(validarDeck(base,['lista']),[]);
  assert.match(validarDeck({laminas:[{...columnas,items:['Duplicado']}]},['lista']).join(' '),/XOR/);
  assert.match(validarDeck({laminas:[{...columnas,columnas:[...columnas.columnas, columnas.columnas[0]]}]},['lista']).join(' '),/dos columnas/);
  assert.match(validarDeck({laminas:[{...columnas,columnas:[{...columnas.columnas[0],llave:4},columnas.columnas[1]]}]},['lista']).join(' '),/llave/);
  assert.deepEqual(resolverComo({laminas:[columnas,{tipo:'lista',como:'frontera'}]}).deck.laminas[1].columnas,columnas.columnas);
});

test('columnas: encabezado con primer ítem, izquierda a derecha, llave escapada y anclas únicas', t => {
  const dir = temporal(t);
  for (const formato of ['16:9','9:16']) for (const revelar of [undefined,'columna']) {
    const lamina = {...columnas,revelar,columnas:[{...columnas.columnas[0],llave:'<script>malo</script>'},columnas.columnas[1]]};
    const r = construirHTML({deck:{marca:false,emoji:'apple',formato,laminas:[lamina]},dirDeck:dir,dirSalida:path.join(dir,formato.replace(':','-')+String(revelar)),dirSkill:DIR_SKILL});
    assert.deepEqual(r.avisos,[]);
    const seccion = r.html.match(/<section\b[^]*?<\/section>/)[0];
    assert.match(seccion,/contraste-titulo tono-v[^>]*data-p="0"/);
    assert.match(seccion,/contraste-titulo tono-r[^>]*data-p="3"|contraste-titulo tono-r[^>]*data-p="2"/);
    assert.match(seccion,/&lt;script&gt;malo&lt;\/script&gt;/);
    const anclas = [...seccion.matchAll(/data-a="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(anclas).size,anclas.length);
    assert.equal(r.pasos[0],revelar ? 3 : 5);
  }
  assert.match(fs.readFileSync(path.join(DIR_SKILL,'templates/base.css'),'utf8'),/\.f-vertical \.contraste\s*\{[^}]*grid-template-columns:1fr/);
});

test('réplica: código 3 y NO-VALE con sha; forzar recupera la salida normal', t => {
  const dir = temporal(t), salida = path.join(dir,'salida');
  const deck = {marca:false,emoji:'apple',laminas:[1,2,3].map(n=>({...idea('Una idea'),id:'r'+n}))};
  fs.writeFileSync(path.join(dir,'deck.json'),JSON.stringify(deck));
  const ejecutar = args => spawnSync(process.execPath,['scripts/render.mjs',dir,'--salida',salida,'--solo-html',...args],{cwd:DIR_SKILL,encoding:'utf8'});
  const r = ejecutar([]); assert.equal(r.status,3,r.stderr);
  assert.match(r.stderr,/comparar.mjs/);
  const evidencia = evidenciaReplica(deck,path.join(dir,'deck.json'));
  assert.match(fs.readFileSync(path.join(salida,'NO-VALE.txt'),'utf8'),new RegExp(evidencia.deck_sha));
  assert.equal(ejecutar(['--forzar']).status,0);
  assert.equal(evidenciaReplica(deck,path.join(dir,'deck.json'),JSON.stringify(deck),{forzar:true}).laminas_dir,'laminas');
  assert.ok(!fs.existsSync(path.join(salida,'NO-VALE.txt')));
});

test('columnas: geometría y revelado medidos en horizontal y vertical', {timeout:120000}, async t => {
  const { abrir, lanzarChromium } = await import('../scripts/lib/pipeline.mjs');
  try { const browser = await lanzarChromium(); await browser.close(); }
  catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(`SIN RENDER: ${e.motivo}`); return; }
  const dir = temporal(t);
  for (const formato of ['16:9','9:16']) {
    const salida=path.join(dir,formato.replace(':','-'));
    const r=construirHTML({deck:{marca:false,emoji:'apple',formato,laminas:[columnas]},dirDeck:dir,dirSalida:salida,dirSkill:DIR_SKILL});
    const archivo=path.join(salida,'index.html'); fs.writeFileSync(archivo,r.html);
    const {browser,page}=await abrir(archivo,r.W,r.H);
    try {
      const m=await page.evaluate(() => {
        const l=window.PZ.lams[0], cols=[...l.querySelectorAll('.contraste-col')];
        const cajas=cols.map(c=>{const b=c.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom};});
        window.PZ.mostrar(l,0,Infinity);
        const pasos=cols.map(c=>({titulo:Number(c.querySelector('.contraste-titulo').dataset.p),items:[...c.querySelectorAll('.item')].map(e=>Number(e.dataset.p))}));
        window.PZ.mostrar(l,window.PZ.pasos(l)-1,Infinity);
        return {cajas,pasos,avisos:window.PZ.avisos,ancho:l.offsetWidth,alto:l.offsetHeight,nota:l.querySelector('.nota.roja').getBoundingClientRect().bottom};
      });
      assert.ok(!m.avisos.some(a=>/ancla.*no existe/.test(a)),m.avisos.join('\n'));
      assert.deepEqual(m.pasos,[{titulo:0,items:[0,1]},{titulo:3,items:[3,4]}]);
      if(formato==='9:16') assert.ok(m.cajas[1].y>=m.cajas[0].bottom);
      else assert.ok(m.cajas[1].x>m.cajas[0].right);
      assert.ok(m.nota<=m.alto);
    } finally { await browser.close(); }
  }
});
