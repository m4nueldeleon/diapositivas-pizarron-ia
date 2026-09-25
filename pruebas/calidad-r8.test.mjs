import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { corregirSigno, candidatosFuente } from '../scripts/lib/autocorregir.mjs';
import { decisionCiclo, tipoArreglo, qaVigente } from '../scripts/lib/ciclo-calidad.mjs';
import { registrarRender, registrarQA } from '../scripts/lib/evidencia-calidad.mjs';
import { validarDatos, validarMarcadores, glosarioDatos, sustituirDatos } from '../scripts/lib/datos.mjs';
import { validarDeck, sanearDeck, CAMPOS_RAIZ } from '../scripts/lib/contrato.mjs';
import { marcar } from '../scripts/lib/markup.mjs';
import { clasificarAvisos, fichaReglasCliente, reglasPagoGancho } from '../scripts/lib/reglas-deck.mjs';
import { prepararSalida, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { revisarTexto } from '../scripts/lib/qa-texto.mjs';

const base = { marca: false, emoji: 'apple', laminas: [{ id: 'idea', tipo: 'idea', texto: 'Revisa __un acuerdo__', voz: 'Revisa un acuerdo.' }] };
function temporal(t) {
  const raiz = path.join(DIR_SKILL, 'salida', 'pruebas-r8'); fs.mkdirSync(raiz, { recursive: true });
  const dir = fs.mkdtempSync(path.join(raiz, 'caso-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir;
}
function ejecutar(t, deck, script = 'armar', flags = []) {
  const dir = temporal(t); fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const r = spawnSync(process.execPath, [`scripts/${script}.mjs`, dir, '--salida', dir, ...flags],
    { cwd: DIR_SKILL, encoding: 'utf8', env: { ...process.env, PZ_LAUNCH_FALSO: 'mach' } });
  return { ...r, dir, qa: JSON.parse(fs.readFileSync(path.join(dir, 'qa-texto.json'))) };
}
const limpio = { medido: false, estado: 'sin-medir', errores: [], avisos: [], por_confirmar: {}, falta_para_final: [] };

test('R8.1: preflight bloquea errores, avisos y huecos en ambos formatos antes del navegador', t => {
  for (const formato of ['16:9', '9:16']) {
    const d = { ...base, formato, datos: { PRECIO: { pendiente: true, motivo: 'falta confirmación' } },
      laminas: [{ tipo: 'idea', texto: '__{{PRECIO}}__', voz: '{{PRECIO}}' }] };
    const r = ejecutar(t, d);
    assert.equal(r.status, 3, r.stderr); assert.match(r.stdout, /espera_datos/);
    assert.ok(!fs.existsSync(path.join(r.dir, 'laminas'))); assert.equal(r.qa.medido, false);
    assert.ok(!fs.existsSync(path.join(r.dir, 'qa.json')));
  }
  const r = ejecutar(t, { ...base, en_vivo: true });
  assert.equal(r.status, 3); assert.match(r.stdout, /declara `sala`/);
});

test('R8.2: corrige el signo inequívoco sin mutar, no inventa ni cambia conceptos propios', () => {
  const d = { ...base, laminas: [{ tipo: 'idea', emoji: '💰', texto: '**Menos ganancia**' }] };
  const r = corregirSigno(d); assert.equal(r.deck.laminas[0].emoji, '💸'); assert.equal(d.laminas[0].emoji, '💰');
  assert.equal(corregirSigno(r.deck).cambios.length, 0);
  for (const texto of ['No pierdes dinero', 'Menos dinero, más tiempo', 'Menos gastos', 'Sin perder dinero']) {
    assert.equal(corregirSigno({ laminas: [{ tipo: 'idea', emoji: '💰', texto }] }).cambios.length, 0);
  }
  assert.equal(corregirSigno({ ...d, conceptos: { '💰': 'capital' } }).cambios.length, 0);
});

test('R8.2: armar aplica y vuelve a pasar QA; respaldo y sha coinciden con el deck corregido', t => {
  const d = { ...base, laminas: [{ id: 'perdida', tipo: 'idea', emoji: '💰', texto: 'Menos ganancia', voz: 'Menos ganancia. Revisa el margen.' }] };
  const r = ejecutar(t, d, 'armar', ['--corregir', '--sin-navegador']);
  assert.equal(r.status, 3, r.stderr);
  const guardado = JSON.parse(fs.readFileSync(path.join(r.dir, 'deck.json')));
  assert.equal(guardado.laminas[0].emoji, '💸');
  const informe = JSON.parse(fs.readFileSync(path.join(r.dir, 'armado.json')));
  assert.equal(informe.rondas[0].cambios.length, 1);
  assert.ok(informe.rondas[0].inicial.avisos.length > r.qa.avisos.length);
  assert.equal(prepararSalida(r.dir, r.dir).evidencia.deck_sha, r.qa.deck_sha);
  assert.equal(fs.readdirSync(r.dir).filter(f => f.startsWith('deck-antes-')).length, 1);
});

test('R8.3: fuente solo con cita completa, layout compatible y aviso existente', () => {
  const d = { laminas: [{ tipo: 'cifra', fuente: 'Informe anual 2032', fuente_paso: 1, voz: ['Según el Informe anual 2032.', 'Este es el total.'] }] };
  const avisos = ['lámina 1 (dato): la fuente llega tarde'];
  assert.deepEqual(candidatosFuente(d, avisos), [{ indice: 0, paso: 0 }]);
  assert.deepEqual(candidatosFuente(d, []), []);
  assert.deepEqual(candidatosFuente({ laminas: [{ ...d.laminas[0], voz: ['Según el informe.', 'Este es el total.'] }] }, avisos), []);
});

test('R8.3: mover fuente conserva pasos y voz; rechaza borrar el último beat', t => {
  for (const tam of [2, 3]) {
    const l = { tipo: 'cifra', lineas: ['Revisa el total', 'Compara el periodo'], fuente: 'Informe anual 2032', fuente_paso: tam - 1,
      voz: ['Según el Informe anual 2032.', 'Compara el periodo.', ...(tam === 3 ? ['Consulta el informe.'] : [])] };
    const r = ejecutar(t, { ...base, laminas: [l] }, 'armar', ['--corregir', '--sin-navegador']);
    const d = JSON.parse(fs.readFileSync(path.join(r.dir, 'deck.json')));
    assert.deepEqual(d.laminas[0].voz, l.voz);
    assert.equal(d.laminas[0].fuente_paso, tam === 2 ? 0 : 2, r.stdout);
  }
});

test('R8.4: cola enruta hallazgos y se detiene sin declarar aprobado', () => {
  assert.equal(tipoArreglo('falta el pago del gancho'), 'guion');
  assert.equal(tipoArreglo('¿se proyecta en una sala? declara sala'), 'decision_cliente');
  assert.equal(tipoArreglo('logo oficial faltante'), 'asset');
  assert.equal(tipoArreglo('subrayado cruza las letras'), 'motor');
  const q = { ...limpio, avisos: ['falta el pago del gancho'] };
  assert.equal(decisionCiclo(q, [q]).estado, 'estancado');
  assert.equal(decisionCiclo(q, [limpio, limpio]).estado, 'limite_de_rondas');
  assert.equal(decisionCiclo(limpio).estado, 'render_pendiente');
  assert.equal(decisionCiclo({ ...limpio, medido: true, estado: 'listo' }).puede_entregar, false);
});

test('R8.5: primera nota medida se conserva; SHA de HTML, renders sin QA y texto no se confunden', t => {
  const actual = { medido: true, deck_sha: 'a', html_sha: 'h', fecha: '2032-01-01T00:00:00Z' };
  const esperado = { deck_sha: 'a', html_sha: 'h', desde: Date.parse(actual.fecha) };
  assert.equal(qaVigente(actual, esperado), true);
  assert.equal(qaVigente(actual, { ...esperado, desde: esperado.desde + 1 }), false);
  assert.equal(qaVigente(actual, { ...esperado, html_sha: 'otro' }), false);
  const dir = temporal(t), q = { medido: true, deck_sha: 'a', nota: 82, estado: 'con errores', errores: ['x'], avisos: [] };
  assert.equal(registrarQA(dir, q, 'html-a').qa_primer_render, null);
  registrarRender(dir, { deck_sha: 'a', html_sha: 'html-a' });
  assert.equal(registrarQA(dir, q, 'html-otro').qa_primer_render, null);
  assert.equal(registrarQA(dir, q, 'html-a').qa_primer_render.nota, 82);
  registrarRender(dir, { deck_sha: 'b', html_sha: 'html-b' });
  const h = registrarQA(dir, { ...q, deck_sha: 'b', nota: 96 }, 'html-b');
  assert.equal(h.qa_primer_render.nota, 82); assert.equal(h.qa_ultimo_render.nota, 96);
  assert.throws(() => registrarQA(dir, { nota_provisional: 100 }, 'html'), /medido/);
  const otro = temporal(t);
  registrarRender(otro, { deck_sha: 'a', html_sha: 'h' });
  registrarRender(otro, { deck_sha: 'b', html_sha: 'h2' });
  assert.equal(registrarQA(otro, { ...q, deck_sha: 'b' }, 'h2').qa_primer_render, null);
});

test('R8.6: ficha única del cliente, saneada, con decisiones que aún no aplican', () => {
  assert.ok(CAMPOS_RAIZ.includes('reglas_cliente'));
  const ficha = [{ regla: 'duracion', pedido: 'Máximo noventa segundos', decision: 'aceptada', motivo: 'El canal lo exige' }];
  const d = { ...base, reglas_cliente: ficha };
  assert.deepEqual(validarDeck(d, ['idea']), []);
  const saneado = sanearDeck(d).deck;
  assert.equal(clasificarAvisos(['voz estimada fuera del rango'], saneado.avisos_aceptados).pendientes.length, 0);
  assert.equal(fichaReglasCliente(saneado, [])[0].estado, 'sin aviso coincidente');
  assert.ok(validarDeck({ ...d, avisos_aceptados: ficha }, ['idea']).some(e => /no ambos/.test(e)));
  assert.ok(validarDeck({ ...d, reglas_cliente: [{ ...ficha[0], regla: 'firma_relleno' }] }, ['idea']).some(e => /no se exceptúa/.test(e)));
  assert.equal(sanearDeck({ ...d, reglas_cliente: [{ regla: 'duracion', motivo: '' }] }).deck.reglas_cliente.length, 0);
});

test('R8.7: marcadores malformados, anidados y de una letra quedan detectados', t => {
  for (const texto of ['{{precio}}', '{{PRECIO', 'PRECIO}}']) assert.ok(validarMarcadores({ laminas: [{ texto }] }).length);
  assert.deepEqual(validarMarcadores({ laminas: [{ texto: '{{PRECIO}} y [nombre]' }] }), []);
  assert.ok(validarDatos({ PRECIO: { valor: '{{OTRO}}' } }).length);
  assert.ok(validarDatos({ PRECIO: '[X]' }).length);
  assert.match(marcar('[X]'), /pendiente/); assert.doesNotMatch(marcar('[nombre]'), /pendiente/);
  const r = ejecutar(t, { ...base, laminas: [{ tipo: 'idea', texto: '[X]', voz: 'El dato.' }] }, 'qa', ['--sin-navegador']);
  assert.ok(r.qa.errores.some(e => /\[X\]/.test(e)));
});

test('R8.8: pago no puede apuntar a sí mismo, a IDs duplicados ni cambiar todos los íconos', () => {
  const inicio = { id: 'gancho', tipo: 'idea', emoji: '📥', texto: 'El correo sin leer' };
  const d = { pieza: 'reel', laminas: [inicio, { tipo: 'idea', texto: 'Prueba' }, { ...inicio, id: 'cierre', emoji: '💰', paga: 'gancho' }] };
  assert.ok(reglasPagoGancho(d).avisos.some(e => /cambia todos/.test(e)));
  assert.ok(!reglasPagoGancho({ ...d, laminas: [inicio, d.laminas[1], { ...d.laminas[2], emoji: 'si:📥' }] }).avisos.length);
  assert.ok(reglasPagoGancho({ ...d, laminas: [{ ...inicio, paga: 'gancho' }] }).avisos.some(e => /sí misma/.test(e)));
  assert.ok(validarDeck({ laminas: [inicio, inicio] }, ['idea']).some(e => /repetido/.test(e)));
});

test('R8.9: glosario de una sola fuente rastrea pantalla y voz, incluidos pendientes', () => {
  const d = { datos: { PRECIO: { valor: '$200', fuente: 'Lista autorizada' }, FECHA: { pendiente: true, motivo: 'falta' } },
    laminas: [{ texto: '{{PRECIO}}', voz: ['Cuesta {{PRECIO}}', '{{FECHA}}'] }, { texto: '{{PRECIO}}' }] };
  const g = glosarioDatos(d);
  assert.equal(g.PRECIO.usos.length, 3); assert.equal(g.FECHA.estado, 'pendiente');
  const nuevo = { ...d, datos: { ...d.datos, PRECIO: { valor: '$250', fuente: 'Lista autorizada' } } };
  const l = sustituirDatos(nuevo).deck.laminas;
  assert.equal(l[0].texto, '$250'); assert.match(l[0].voz[0], /250/); assert.equal(l[1].texto, '$250');
  assert.equal(g.PRECIO.valor, '$200');
});

test('R8.10: estricto sin navegador nunca devuelve éxito, incluso sin hallazgos', t => {
  const r = ejecutar(t, base, 'qa', ['--sin-navegador', '--estricto']);
  assert.equal(r.status, 3); assert.deepEqual(r.qa.errores, []); assert.equal(r.qa.estado, 'sin-medir');
  const dir = temporal(t); fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(base));
  assert.ok(revisarTexto(prepararSalida(dir, dir)).glosario);
  const bloqueado = ejecutar(t, base);
  assert.equal(bloqueado.status, 4, bloqueado.stdout + bloqueado.stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(bloqueado.dir, 'armado.json'))).estado, 'render_fallido');
  assert.deepEqual(bloqueado.qa.errores, []);
});
