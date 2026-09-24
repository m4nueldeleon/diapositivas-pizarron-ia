// Ronda 7: contratos y reglas puras. Las medidas de Chromium viven en qa-r7.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { marcar, plano } from '../scripts/lib/markup.mjs';
import { construirHTML, LAYOUTS } from '../scripts/lib/construir.mjs';
import { sanearDeck, validarDeck } from '../scripts/lib/contrato.mjs';
import { prepararSalida, evidenciaReplica, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { revisarTexto } from '../scripts/lib/qa-texto.mjs';
import { manoDesdeHTML, pendientesDesdeHTML } from '../scripts/lib/mano-html.mjs';
import { esFirmaRelleno, firmaParaDeck, leerCredenciales } from '../scripts/lib/marca.mjs';
import { reglasMarcasYSuperficies, reglasEscalaTiempo, posicionesTiempo, reglasIconosInversa } from '../scripts/lib/reglas-marcas.mjs';
import { reglasQr } from '../scripts/lib/reglas-qr.mjs';
import { reglasRetornoMapa } from '../scripts/lib/reglas-arco.mjs';
import { reglasFirma, reglasOrigenCredibilidad, credibilidadConfirmada, hayCifraCredibilidad, faltaParaFinal,
  tienePrecio, hayGarantiaOSalida, estadoQA, clasificarAvisos, reglasDeckCompleto, reglasApertura } from '../scripts/lib/reglas-deck.mjs';
const idea = (texto, extra = {}) => ({ tipo:'idea', texto, ...extra });
function temporal(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'pz-motor-r7-'));
  t.after(() => fs.rmSync(dir,{recursive:true,force:true}));
  return dir;
}
function construir(t, laminas, extra = {}) {
  const dir = temporal(t);
  return construirHTML({ deck:{marca:false,emoji:'apple',pieza:'libre',laminas,...extra},dirDeck:dir,dirSalida:dir,dirSkill:DIR_SKILL });
}
function preparar(t, laminas, extra = {}) {
  const dir = temporal(t);
  fs.writeFileSync(path.join(dir,'deck.json'),JSON.stringify({marca:false,emoji:'apple',pieza:'libre',laminas,...extra}));
  return prepararSalida(dir,path.join(dir,'salida'));
}
test('C: óvalo escapa, anida tonos/remate, quita vacío y deja texto plano', () => {
  for (const texto of ['((2032))','^^((2032))^^','{v:((2032))}']) {
    assert.match(marcar(texto), /class="circ" data-circulo="linea" data-a="ovalo">2032/);
    assert.equal(plano(texto),'2032');
  }
  assert.match(marcar('((<script>))'), /&lt;script&gt;/);
  assert.doesNotMatch(marcar('(( ))'), /circ/);
  assert.match(marcar('(((2032))'), />\(2032<\/b>/);
});
test('A/C/M: anclas en texto, palabra, óvalo, llave y emoji con letras llegan al HTML', t => {
  const r = construir(t,[{tipo:'flujo',nodos:[{etiqueta:'Uno'},{etiqueta:'Dos'},{etiqueta:'Tres'}]},
    idea('__Primero__ ~~Antes~~ ((2032))',{anotaciones:[{a:'ovalo',texto:'Registro'},{a:'w1',texto:'Ahora',tono:'v',lado:'abajo'}]}),
    {tipo:'lista',vineta:'letras',letras:['A','B'],items:[{texto:'Ordena',emoji:'📋'},{texto:'Revisa',emoji:'💯'}],anotaciones:[{llave:['i0','i1'],texto:'Rutina'}]}]);
  assert.match(r.html, /<span data-a="n0"/);
  assert.doesNotMatch(r.html, /<div data-a="n0"[^>]*><\/div>/);
  assert.match(r.html, /data-a="w0"/); assert.match(r.html, /data-a="w1"/);
  assert.match(r.html, /data-a="ovalo"[^>]*data-w="w2"/);
  assert.match(r.html, /"estilo":"llave"/); assert.match(r.html, /📋/);
});
test('C: dos óvalos o salto son error; longitud es error y énfasis simultáneo avisa', () => {
  const r = reglasMarcasYSuperficies({laminas:[idea('((Uno)) ((Dos))'),idea('((Una\nlínea))'),idea('((una frase de cuatro palabras)) __extra__')]});
  assert.ok(r.errores.some(x => /más de un óvalo/.test(x)));
  assert.ok(r.errores.some(x => /salto/.test(x)));
  assert.ok(r.errores.some(x => /más de 4 palabras/.test(x)));
  assert.equal(r.avisos.length,1);
});
test('E: escala numérica avisa solo cuando distorsiona; pos manda', () => {
  const linea = numeros => ({tipo:'linea-tiempo',marcas:numeros.map(n => ({texto:`Semana ${n}`}))});
  assert.deepEqual(posicionesTiempo(linea([1,2,5,6]).marcas),[0,.2,.8,1]);
  assert.match(reglasEscalaTiempo({laminas:[linea([1,2,5,6])]}).avisos[0], /\[0,0.2,0.8,1\]/);
  for (const numeros of [[1,2,3,4],[1,14,30],[1,4,8]]) assert.deepEqual(reglasEscalaTiempo({laminas:[linea(numeros)]}).avisos,[]);
  assert.deepEqual(reglasEscalaTiempo({laminas:[{...linea([1,2,5,6]),escala:'proporcional'}]}).avisos,[]);
  const l = linea([1,14,30]); l.marcas[0].pos=0;
  assert.deepEqual(reglasEscalaTiempo({laminas:[l]}).avisos,[]);
});
test('F: réplica vieja separa las láminas; la réplica oficial conserva su ruta', () => {
  const d={laminas:[1,2,3].map(n => idea('Texto',{id:`r${n}`}))};
  assert.equal(evidenciaReplica(d,'/tmp/otra/deck.json').laminas_dir,'laminas-NO-VALE');
  assert.equal(evidenciaReplica(d,path.join(DIR_SKILL,'pruebas/replica/deck.json')).laminas_dir,'laminas');
});
test('G/P: texto ve los datos debajo del remate y los marcadores escritos a mano', t => {
  const stack = texto => ({tipo:'stack',items:[{texto}],remate:'Elige un paso'});
  for (const texto of ['{{BONO_X}}','[PRECIO]']) {
    const r = revisarTexto(preparar(t,[idea('Entrada'),stack(texto)]));
    assert.ok(r.errores.some(x => /dato pendiente/.test(x)),JSON.stringify(r));
    assert.ok(Object.values(r.pendientes).some(ls => ls.includes(2)));
  }
  const p=preparar(t,[idea('Entrada'),stack('{{BONO_X}}')],{datos:{BONO_X:{pendiente:true,motivo:'Falta confirmar'}}});
  assert.ok(revisarTexto(p).por_confirmar.BONO_X.laminas.includes(2));
  assert.ok(!revisarTexto(preparar(t,[stack('{{BONO_X}}')],{datos:{BONO_X:'Guía'}})).errores.some(x => /dato pendiente/.test(x)));
  const dir=temporal(t), modelo=prepararSalida(path.join(DIR_SKILL,'ejemplos/vsl-corto'),dir);
  assert.ok(modelo.declarados.BONO_1.laminas.includes(18));
});
test('J: cada credencial requiere respaldo independiente; un marcador completo sí confirma', () => {
  const d = texto => ({pieza:'vsl-corto',laminas:[idea(texto)]});
  assert.equal(hayCifraCredibilidad(d('Desde 2031')),false);
  assert.ok(reglasOrigenCredibilidad(d('Desde 2031')).porConfirmar.CREDIBILIDAD);
  assert.ok(hayCifraCredibilidad(d('Desde 2031'),{credenciales:['2031']}));
  assert.ok(hayCifraCredibilidad({laminas:[idea('Desde 2031',{fuente:'Registro propio'})]}));
  assert.equal(hayCifraCredibilidad({laminas:[idea('Trayectoria',{credibilidad:true})]}),false);
  const pendiente={...d('{{ANOS}} años'),datos:{ANOS:{pendiente:true,motivo:'Confirmar'}}};
  assert.ok(hayCifraCredibilidad(pendiente));
  assert.ok(!faltaParaFinal(pendiente).some(x => /cifra de credibilidad/.test(x)));
  const mezclado={...d('Desde 2031, {{CLIENTES}} clientes'),datos:{CLIENTES:'8'}};
  assert.equal(hayCifraCredibilidad(mezclado),false);
  assert.ok(reglasOrigenCredibilidad(mezclado).porConfirmar.CREDIBILIDAD);
  const completo={...d('{{CREDENCIAL}}'),datos:{CREDENCIAL:'Desde 2031'}};
  assert.ok(hayCifraCredibilidad(completo));
  assert.ok(credibilidadConfirmada(completo,completo.laminas[0]));
  assert.deepEqual(leerCredenciales('- Credenciales o pruebas con permiso: Desde 2031; 1,200 clientes'),['2031','1200']);
  assert.deepEqual(leerCredenciales('- Credenciales o pruebas con permiso: 2031 (ejemplo)'),[]);
});
test('K: venta con precio exige garantía o salida, incluso con datos pendientes', () => {
  const venta=laminas => ({pieza:'vsl-corto',laminas});
  const precio=idea('Tu acceso: {{PRECIO}}');
  assert.ok(tienePrecio(venta([precio])));
  assert.ok(faltaParaFinal(venta([precio])).includes('garantía o condición de salida'));
  for (const extra of [idea('{{GARANTIA_DIAS}} días',{emoji:'🛡️'}),idea('Puedes cancelar sin penalización')]) {
    const d={...venta([precio,extra]),garantia:false};
    assert.ok(hayGarantiaOSalida(d)); assert.ok(!faltaParaFinal(d).includes('garantía o condición de salida'));
  }
  assert.ok(!faltaParaFinal(venta([idea('Aplica para participar')])).includes('garantía o condición de salida'));
  const ejemplo=JSON.parse(fs.readFileSync('ejemplos/vsl-corto/deck.json'));
  assert.ok(!faltaParaFinal(ejemplo).includes('garantía o condición de salida'));
});
test('L: búsqueda estrecha acepta alternativas y advierte un icono que celebra un fallo', () => {
  const r=(texto,emoji) => reglasIconosInversa({laminas:[{tipo:'flujo',nodos:[{etiqueta:texto,emoji}]}]}).avisos;
  assert.equal(r('Práctica','📝').length,1); assert.equal(r('Evaluación','✅').length,1);
  assert.deepEqual(r('Trading','📈'),[]); assert.deepEqual(r('Podcast','🗣'),[]);
  assert.ok(reglasMarcasYSuperficies({laminas:[idea('Ana vuelve a hacer el reporte',{emoji:'👑'})]}).avisos.some(x => /celebra/.test(x)));
  assert.deepEqual(reglasMarcasYSuperficies({laminas:[idea('Líder',{emoji:'👑'})]}).avisos,[]);
});
test('M: el cierre de letras pide sus íconos cuando ya hubo riel', () => {
  const l={tipo:'lista',vineta:'letras',letras:['A','B'],items:['Ordena','Revisa']};
  assert.match(reglasMarcasYSuperficies({laminas:[{tipo:'pasos',letras:['A','B'],iconos:['📋','💯']},l]}).avisos[0],/añade el emoji.*lámina 1/);
});
test('N: firma de relleno se omite, deja FIRMA pendiente y no tapa la ficha', t => {
  const marca={texto:'tumarca',sufijo:'.com'};
  assert.ok(esFirmaRelleno(marca));
  const r=construir(t,[idea('Texto')],{marca});
  const seccion=r.html.match(/<section\b[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(seccion,/class="firma|tumarca/);
  assert.ok(r.sugerencias.some(x => /firma de ejemplo.*omitida/.test(x)));
  const firma=reglasFirma({marca,laminas:[idea('Texto')]});
  assert.deepEqual(firma.errores,[]); assert.ok(firma.porConfirmar.FIRMA);
  assert.equal(estadoQA({borrador:true}), 'borrador');
  assert.match(construir(t,[idea('Texto')],{marca:{texto:'@alguien_real'}}).html,/class="firma/);
  const dir=temporal(t); fs.writeFileSync(path.join(dir,'MI-MARCA.md'),'- Texto: @alguien_real');
  assert.equal(firmaParaDeck({marca},dir).marca.texto,'@alguien_real');
});
test('P: HTML real cuenta tachones y conexiones; la racha sin mano se estima sin falsos positivos', t => {
  const laminas=[idea('~~Antes~~'),{tipo:'lista',items:['~~Antes~~']},{tipo:'cifra',lineas:['~~Antes~~']},{tipo:'chat',mensajes:[{de:'otro',texto:'~~Antes~~'}]}];
  const conMano=construir(t,laminas), cantidades=manoDesdeHTML(conMano.html);
  assert.ok(cantidades.every(n => n>0));
  assert.ok(!reglasDeckCompleto(conMano.deck,{manoPorLamina:cantidades}).avisos.some(a => /capa a mano/.test(a)));
  const sinMano=laminas.map(l => JSON.parse(JSON.stringify(l).replaceAll('~~','')));
  assert.ok(revisarTexto(preparar(t,sinMano)).avisos.some(a => /^estimado:.*4 láminas.*capa a mano/.test(a)));
});
test('Q: avisos pendientes bloquean listo y las aceptaciones respetan motivo y alcance', () => {
  const avisos=['lámina 1: uno','lámina 2: dos','lámina 3: tres'];
  assert.equal(estadoQA({nota:91,avisos}),'avisos-pendientes');
  const aceptados=avisos.map(texto => ({texto,motivo:'Decisión editorial revisada'}));
  assert.equal(estadoQA({nota:91,avisos,aceptados}),'listo');
  assert.equal(clasificarAvisos(['láminas 2, 7: ejemplo'],[{texto:'ejemplo',motivo:'Adrede',laminas:[2]}]).pendientes.length,1);
  assert.equal(clasificarAvisos(['láminas 2 a 4: ejemplo'],[{texto:'ejemplo',motivo:'Adrede',laminas:[2,3,4]}]).aceptados.length,1);
  assert.equal(sanearDeck({laminas:[idea('Texto')],avisos_aceptados:[{texto:'x',motivo:''}]}).deck.avisos_aceptados.length,0);
});
test('R/H/I: contratos de superficies, saneo cerrado y pasos compartidos', t => {
  const agenda={tipo:'agenda',dias:['Mar','Mié','Jue'],semanas:4,inicio:24,series:[{dia:1,texto:'Cita',semanas:[1,2,3,4],paso:1,tono:'azul'}]};
  const muro={tipo:'chat',variante:'muro',mensajes:Array.from({length:6},(_,i) => ({de:'otro',texto:`Respuesta ${i+1}`,hora:'10:00'}))};
  const contraste={tipo:'lista',columnas:[{titulo:'SÍ',tono:'v',vineta:'check',items:['Define','Revisa'],sello:'Claro'},{titulo:'NO',tono:'r',vineta:'cruz',items:['Improvisa'],sello:'Evita'}]};
  const r=construir(t,[agenda,muro,contraste,{tipo:'boton',variante:'invitacion',texto:'Sesión',hora:'10:00'}]);
  assert.deepEqual(r.pasos,[2,3,5,1]);
  assert.equal((r.html.match(/class="chat-celda"/g)||[]).length,6);
  assert.match(r.html,/invitacion-boton[^>]*>Unirme/);
  assert.equal((r.html.match(/class="sello"/g)||[]).length,2);
  for (const l of [{...agenda,semanas:7},{...agenda,series:[{dia:4,texto:'Fuera'}]},{...muro,mensajes:[{de:'yo',texto:'No'}]},{tipo:'boton',variante:'inventada'}])
    assert.ok(validarDeck({laminas:[l]},Object.keys(LAYOUTS)).length);
  const limpio=sanearDeck({laminas:[{...contraste,columnas:contraste.columnas.map(c => ({...c,vineta:'malicioso'}))},{...agenda,series:[{dia:1,texto:'Cita',tono:'otro'}]}]}).deck;
  assert.equal(limpio.laminas[0].columnas[0].vineta,undefined); assert.equal(limpio.laminas[1].series[0].tono,undefined);
  const chat={tipo:'chat',procedencia:'real',fuente:'{{FUENTE}}',mensajes:[{de:'yo',texto:'Una respuesta'}]};
  assert.deepEqual(validarDeck({laminas:[chat]},Object.keys(LAYOUTS)),[]);
  assert.match(construir(t,[chat],{datos:{FUENTE:'Registro propio · 2031'}}).html,/Registro propio/);
});
test('S: mapa repetido difiere de avance vacío, las citas y decisiones presenciales no son falsos avisos', () => {
  const mapa={tipo:'pasos',iconos:['📋','💯'],activo:1};
  assert.match(reglasRetornoMapa({laminas:[mapa,{...mapa}]},[1,1]).avisos[0],/repetido/);
  const avance=reglasRetornoMapa({laminas:[mapa,{...mapa,activo:2}]},[1,1]).avisos.join(' ');
  assert.match(avance,/paso 2 no tiene contenido/); assert.doesNotMatch(avance,/repetido/);
  const apertura=texto => reglasApertura({pieza:'vsl-corto',laminas:[idea(texto)]},[1]).avisos;
  assert.ok(!apertura('«Hola, soy Ana»').some(a => /saludo|presenta/.test(a)));
  assert.ok(apertura('Hola, soy Ana').length);
  const qr=texto => reglasQr({en_vivo:true,laminas:[idea(texto,{llamado:true})]});
  assert.deepEqual(qr('Tómenle foto a esta fórmula').errores,[]);
  assert.ok(qr('Tómenle foto al QR').errores.length);
  assert.ok(qr('Tómenle foto al código').errores.length);
  assert.deepEqual(qr('Decide qué cambiarás hoy').avisos,[]);
  assert.ok(qr('Únete a la comunidad').avisos.length);
});

test('G/Q/C: texto oculto no es pendiente, los rangos se respetan y las notas también llevan anclas', t => {
  assert.deepEqual(pendientesDesdeHTML('<section><div>[PRECIO-BASE] [PRECIO BASE] [X]</div><div class="pz-oculto">[OCULTO]</div><div class="escena clon">[CLON]</div></section>'),[['PRECIO-BASE','PRECIO BASE']]);
  assert.equal(clasificarAvisos(['láminas 2–4: ejemplo'],[{texto:'ejemplo',motivo:'Adrede',laminas:[2]}]).pendientes.length,1);
  const l=idea('((2032))',{anotaciones:[{a:'ovalo',texto:'((Otro dato))'}]});
  assert.ok(reglasMarcasYSuperficies({laminas:[l]}).errores.some(e => /más de un óvalo/.test(e)));
  assert.match(construir(t,[l]).html,/data-w="w1"/);
  const mixto=construir(t,[{tipo:'flujo',nodos:[{emoji:'📋'},{etiqueta:'Revisión'}]}]);
  assert.match(mixto.html,/"de":"n0","a":"et1"/);
});

test('H/R: procedencia de chat y capacidad de interfaces tienen avisos o errores accionables', () => {
  const mensajes=Array.from({length:9},() => ({de:'otro',texto:'Respuesta breve'}));
  const r=reglasMarcasYSuperficies({pieza:'vsl-corto',formato:'9:16',laminas:[{tipo:'chat',variante:'muro',mensajes},{tipo:'chat',marco:'celular',mensajes:mensajes.slice(0,4)},{tipo:'chat',procedencia:'real',fuente:'Registro sin fecha',mensajes:mensajes.slice(0,1)}]});
  assert.ok(r.avisos.some(a => /supera 8/.test(a))); assert.ok(r.avisos.some(a => /más de 3 mensajes/.test(a)));
  assert.ok(r.avisos.some(a => /declara procedencia/.test(a))); assert.ok(r.errores.some(e => /fuente con fecha/.test(e)));
  assert.ok(reglasMarcasYSuperficies({laminas:[{tipo:'cuadrantes',items:[{texto:'{s:Antes} Una acción'},{texto:'{s:Después} Otra acción'}]}]}).avisos.some(a => /lista con columnas/.test(a)));
});

test('O/P/Q: los cinco modelos conservan QA de texto sin errores ni avisos', t => {
  for (const nombre of ['demo','vsl-corto','propuesta','clase-express','reel']) {
    const r=revisarTexto(prepararSalida(path.join(DIR_SKILL,'ejemplos',nombre),temporal(t)));
    assert.deepEqual(r.errores,[],nombre); assert.deepEqual(r.avisos,[],nombre);
  }
});
