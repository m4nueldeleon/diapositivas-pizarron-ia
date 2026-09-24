// Reglas de conocimiento que corren sin navegador: la pantalla y la voz conservan el dato.
import test from 'node:test';
import assert from 'node:assert/strict';
import { reglasDatosAnunciados, reglasQuienEntrega, reglasAtribucionRevista, reglasPropuesta,
  reglasEstilo, reglasEyebrows, clasificarAvisos, fichaReglasCliente, notaQA } from '../scripts/lib/reglas-deck.mjs';
import { validarDeck, sanearDeck } from '../scripts/lib/contrato.mjs';
const idea = (texto, extra = {}) => ({ tipo: 'idea', texto, ...extra });
const deck = (...laminas) => ({ laminas });

test('dato faltante: pantalla y voz avisan en vídeo y son error en propuesta o en vivo', () => {
  const frases = ['Por confirmar', 'Faltan las cifras', 'Falta ese dato', 'Está pendiente de aprobación', 'Quedan pendientes de definir'];
  for (const texto of frases) {
    assert.equal(reglasDatosAnunciados(deck(idea(texto))).avisos.length, 1, texto);
    assert.equal(reglasDatosAnunciados({ ...deck(idea('El dato', { voz: texto })), en_vivo: true }).errores.length, 1, texto);
    assert.equal(reglasDatosAnunciados({ ...deck(idea('El dato', { nota: texto })), pieza: 'propuesta' }).errores.length, 1, texto);
  }
  assert.equal(reglasDatosAnunciados({ ...deck(idea('Por confirmar')), datos: { PRECIO: '$400' } }).avisos.length, 1, 'llenar un dato no arregla la frase');
});

test('dato faltante: notas técnicas quedan fuera y pendientes ordinarios no son huecos', () => {
  const d = { ...deck(idea('Deja de ser pendiente de todo', { nota: 'Tu lista de pendientes', procedencia: 'por confirmar', accion: 'falta ese dato', si_falla: 'por confirmar', _comentario: 'por confirmar' })), datos: { BASE: { pendiente: true, motivo: 'validar con Operaciones' } } };
  assert.deepEqual(reglasDatosAnunciados(d), { errores: [], avisos: [] });
  assert.equal(reglasDatosAnunciados(deck(idea('Te confirmaremos tu lugar por correo'))).avisos.length, 0);
  assert.equal(reglasDatosAnunciados({ ...deck(idea('Verificaremos el dato')), datos: {} }).avisos.length, 1);
  assert.equal(reglasDatosAnunciados({ ...deck(idea('Definiremos el precio')), pieza: 'propuesta' }).avisos.length, 1);
});

test('propuesta: el dolor visible llega antes de las actividades, incluso como marcador', () => {
  const plana = { pieza: 'propuesta', laminas: [idea('Programa para equipos'), idea('Diagnóstico: entrevistas y autoevaluación'), { tipo: 'cifra', valor: '{{BASE}}' }] };
  assert.ok(reglasPropuesta(plana).avisos.some(a => /abre sin el problema/.test(a)));
  for (const texto of ['El cliente sigue sin respuesta', '{{HORAS_PERDIDAS}}', '{{COSTO_CLIENTE}}']) {
    const visible = { ...plana, laminas: [plana.laminas[0], idea(texto), plana.laminas[2]] };
    assert.ok(!reglasPropuesta(visible).avisos.some(a => /abre sin el problema/.test(a)), texto);
  }
  assert.ok(reglasPropuesta({ ...plana, laminas: [idea('Programa', { voz: 'El cliente sigue sin respuesta' }), ...plana.laminas.slice(1)] }).avisos.some(a => /abre sin el problema/.test(a)));
  // El id «diagnostico» en una lista de actividades no cuenta como problema [r7, liderazgo]
  const actividades = { ...plana, laminas: [plana.laminas[0], { tipo: 'lista', id: 'diagnostico', items: ['Entrevista', 'Autoevaluación'] }, plana.laminas[2]] };
  assert.ok(reglasPropuesta(actividades).avisos.some(a => /abre sin el problema/.test(a)));
});

test('entrega: asesor y primera persona chocan; el nosotros inclusivo no', () => {
  const revelacion = { tipo: 'oscura', titulo: 'Un programa' };
  assert.equal(reglasQuienEntrega(deck(revelacion, { tipo: 'llamada', yo: 'Tú', otros: ['Tu asesor'] }, idea('Una sesión', { voz: 'La hago contigo' }))).avisos.length, 1);
  assert.equal(reglasQuienEntrega(deck(revelacion, { tipo: 'llamada', yo: 'Tú', otros: ['Yo'] }, idea('Una sesión', { voz: 'La hago contigo. Lo configuramos juntos.' }))).avisos.length, 0);
  assert.equal(reglasQuienEntrega(deck(revelacion, idea('Tu asesor', { voz: 'Lo configuramos contigo' }))).avisos.length, 0);
});

test('atribución: la revista no se convierte en la universidad', () => {
  const fuente = 'Harvard Business Review, datos de 42 empresas';
  assert.equal(reglasAtribucionRevista(deck(idea('Un dato', { fuente, voz: 'Según Harvard, esto cambia.' }))).avisos.length, 1);
  for (const voz of ['Un estudio publicado en Harvard Business Review lo midió.', 'Según Harvard, un estudio lo midió.', 'Vía Harvard llega este dato.']) assert.equal(reglasAtribucionRevista(deck(idea('Un dato', { fuente, voz }))).avisos.length, 0, voz);
  assert.equal(reglasAtribucionRevista(deck(idea('Un dato', { fuente: 'Universidad de Harvard', voz: 'Según Harvard, esto cambia.' }))).avisos.length, 0);
});

test('encabezados: metadatos, estados y frases cortadas avisan; mapas y objeciones entre no', () => {
  for (const encabezado of ['Módulo 1 · semana 2', 'Caso · ficticio', 'Pendiente:', '{{FECHA}}:', 'Una sección']) assert.ok(reglasEstilo(deck(idea('Texto', { encabezado }))).avisos.length, encabezado);
  for (const encabezado of ['Sin:', 'No incluye:', '¿Qué cambia?']) assert.deepEqual(reglasEstilo(deck(idea('Texto', { encabezado }))).avisos, []);
  assert.deepEqual(reglasEstilo(deck(idea('Texto', { encabezado: 'Objeción #1', encabezado_pos: 'entre' }))).avisos, []);
  assert.deepEqual(reglasEstilo(deck({ tipo: 'lista', encabezado: 'Tu Programa', oscura: true, activo: 0, items: ['Una cosa'] })).avisos, []);
  // La proporción cuenta desde 12 láminas: 4 de 12 con encabezado avisa; un reel de 11 con 3 «Le escribes:» no
  const doce = [...Array(4)].map(() => idea('Texto', { encabezado: 'Sin:' })).concat([...Array(8)].map(() => idea('Texto')));
  assert.ok(reglasEyebrows(deck(...doce)).avisos.some(a => /25 %/.test(a)));
  const once = [...Array(3)].map(() => idea('Texto', { encabezado: 'Le escribes:' })).concat([...Array(8)].map(() => idea('Texto')));
  assert.ok(!reglasEyebrows(deck(...once)).avisos.some(a => /25 %/.test(a)));
});

test('ficha del cliente: aceptación negociable no descuenta y la rechazada se conserva', () => {
  const ficha = [{ regla: 'duracion', pedido: 'Quiero la versión de dos minutos', decision: 'aceptada', motivo: 'Se usa como resumen' }, { regla: 'firma_relleno', pedido: 'Usa cualquier firma', decision: 'rechazada', motivo: 'Se necesita la firma real' }];
  const d = { ...deck(idea('Texto')), avisos_aceptados: ficha };
  assert.deepEqual(validarDeck(d, ['idea']), []);
  assert.deepEqual(sanearDeck(d).deck.avisos_aceptados, ficha);
  const avisos = ['las láminas cubren ~2:00 y el objetivo es 4:00'];
  const clasificacion = clasificarAvisos(avisos, ficha);
  assert.equal(clasificacion.pendientes.length, 0);
  assert.equal(notaQA({ errores: [], avisos: clasificacion.pendientes }), 100);
  const resumen = fichaReglasCliente(d, avisos);
  assert.ok(resumen.some(a => a.decision === 'rechazada'));
  assert.ok(resumen.some(a => a.estado === 'excepción pedida por el cliente'));
  for (const regla of ['firma_relleno', 'prueba_inventada', 'cifra_inventada', 'oscura_regla_8']) assert.ok(validarDeck({ ...d, avisos_aceptados: [{ ...ficha[0], regla }] }, ['idea']).some(e => /no se exceptúa/.test(e)));
  assert.ok(validarDeck({ ...d, avisos_aceptados: [{ ...ficha[0], regla: 'cualquier_regla' }] }, ['idea']).length);
  assert.equal(clasificarAvisos(['oscura: el precio va en blanco'], [{texto: 'precio', motivo: 'Cliente'}]).aceptados.length, 0);
  const excepcionRevelacion = [{ ...ficha[0], regla: 'revelacion' }];
  assert.equal(clasificarAvisos(['la oferta del VSL corto empieza en 80%'], excepcionRevelacion).aceptados.length, 1);
  assert.equal(clasificarAvisos(['el llamado va después de la revelación'], excepcionRevelacion).aceptados.length, 0, 'la excepción de porcentaje no acepta un llamado prematuro');
});

test('QA textual publica fuentes y decisiones del cliente sin descontar la excepción', async () => {
  const { revisarTexto } = await import('../scripts/lib/qa-texto.mjs');
  const { sustituirDatos } = await import('../scripts/lib/datos.mjs');
  const crudo = { marca:false, pieza:'libre', emoji:'apple',
    datos:{ CLIENTES:{valor:18,tipo:'credibilidad',fuente:'Registro interno'}, PRECIO:{pendiente:true,tipo:'precio',motivo:'Revisar tarifa',fuente:'Cotización'} },
    avisos_aceptados:[{regla:'duracion',pedido:'Resumen corto',decision:'aceptada',motivo:'Pedido explícito'},
      {regla:'firma_relleno',pedido:'Firma ficticia',decision:'rechazada',motivo:'Se requiere firma real'}],
    laminas:[{tipo:'idea',texto:'{{CLIENTES}} clientes; {{PRECIO}}'}] };
  const sustitucion = sustituirDatos(crudo);
  const preparar = sugerencias => ({...sustitucion,crudo,pasos:[1],revela:[[]],avisos:[],sugerencias,html:'',evidencia:{}});
  const r = revisarTexto(preparar(['la duración queda fuera del rango']));
  assert.equal(r.datos_fuentes.CLIENTES,'Registro interno');
  assert.equal(r.datos_por_confirmar.PRECIO.fuente,'Cotización');
  assert.equal(r.reglas_cliente.length,2);
  assert.ok(r.info.some(t=>/excepción pedida por el cliente/.test(t)));
  assert.ok(!r.avisos.some(t=>/duración/.test(t)));
  assert.equal(r.nota_provisional,revisarTexto(preparar([])).nota_provisional);
});
