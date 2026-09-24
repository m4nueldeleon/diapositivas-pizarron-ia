// Ronda 6: contratos portables, sala explícita, procedencia y métricas del motor.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { argumentos, abrir, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { construirHTML } from '../scripts/lib/construir.mjs';
import { sanearDeck, validarDeck } from '../scripts/lib/contrato.mjs';
import { exportarPdfPasos, notasPorPaso } from '../scripts/lib/pdf.mjs';
import { palabras, contarPalabras } from '../scripts/lib/markup.mjs';
import { fuente } from '../scripts/lib/comun.mjs';
import { origenPrueba, reglasPresentacion, reglasDescargo, reglasRitmo, hayCifraCredibilidad, reglasApertura } from '../scripts/lib/reglas-deck.mjs';
import { prometeComo, ensenaComo } from '../scripts/lib/reglas-arco.mjs';
const TMP = path.join(os.tmpdir(), 'pz-motor-r6');
const idea = (texto, extra = {}) => ({ tipo: 'idea', texto, ...extra });
const construir = deck => {
  fs.mkdirSync(TMP, { recursive: true });
  const dir = fs.mkdtempSync(path.join(TMP, 'prueba-'));
  return { ...construirHTML({ deck: { marca: false, emoji: 'apple', ...deck }, dirDeck: dir, dirSalida: dir, dirSkill: DIR_SKILL }), dir };
};
test('A1: bandera booleana, notas alineadas y Markdown escapado', () => {
  assert.deepEqual(argumentos(['node', 'render', '--pdf-pasos', 'deck']).pos, ['deck']);
  const md = notasPorPaso([{ id: 'uno|dos', paso: 1, pasos: 3, voz: '<script>', accion: 'haz\nesto', si_falla: 'respaldo' }]);
  assert.match(md, /uno&#124;dos/); assert.match(md, /2\/3/); assert.match(md, /&lt;script&gt;/); assert.match(md, /haz<br>esto/);
  assert.throws(() => execFileSync(process.execPath, ['scripts/render.mjs', '--pdf-pasos', '--finales'], { stdio: 'pipe' }), /incompatible con --finales/);
});
test('A1: apoyo solo en guion JSON y campos alineados a pasos', () => {
  const r = construir({ laminas: [idea('Hola', { accion: ['ACCIÓN PRIVADA'], si_falla: 'RESPALDO PRIVADO' })] });
  assert.ok(r.html.includes('ACCIÓN PRIVADA'));
  const sinGuion = r.html.replace(/<script[\s\S]*?<\/script>/g, '');
  assert.ok(!sinGuion.includes('ACCIÓN PRIVADA')); assert.ok(!sinGuion.includes('RESPALDO PRIVADO'));
  assert.equal(reglasPresentacion({ laminas: [idea('Hola', { accion: ['una'] })] }, [2]).errores.length, 1);
  assert.ok(reglasPresentacion({ en_vivo: true, sala: false, laminas: [idea('Hola', { voz: ['uno', ''] })] }, [2]).avisos.some(a => /sin voz/.test(a)));
});
test('A2: sala explícita, validación y vertical sin perfil', () => {
  assert.match(construir({ sala: true, laminas: [idea('Hola')] }).html, /body class="f-horizontal sala"/);
  assert.match(construir({ en_vivo: true, laminas: [idea('Hola')] }).html, /body class="f-horizontal"/);
  assert.match(construir({ sala: true, formato: '9:16', laminas: [idea('Hola')] }).html, /body class="f-vertical"/);
  assert.ok(validarDeck({ sala: { distancia_m: -1 }, laminas: [idea('Hola')] }, ['idea']).some(e => /sala/.test(e)));
  assert.equal(reglasPresentacion({ en_vivo: true, laminas: [idea('Hola', { voz: 'Hola' })] }, [1]).avisos.filter(a => /declara `sala`/.test(a)).length, 1);
  assert.ok(reglasPresentacion({ sala: true, formato: '9:16', laminas: [] }).avisos.some(a => /ignora en vertical/.test(a)));
});
test('A5: procedencia decide la prueba; ejemplo tiene descargo opt-in', () => {
  const objeto = { tipo: 'objeto', imagen: 'foto.png' };
  assert.equal(origenPrueba(objeto), null);
  assert.equal(origenPrueba({ ...objeto, procedencia: 'ia' }), null);
  assert.equal(origenPrueba({ ...objeto, procedencia: 'ia', fuente: 'Archivo' }), null);
  assert.equal(origenPrueba({ ...objeto, procedencia: 'real' }), 'propia');
  assert.equal(origenPrueba({ ...objeto, fuente: 'Archivo' }), 'propia');
  assert.ok(reglasPresentacion({ pieza: 'vsl', laminas: [objeto] }).avisos.some(a => /foto real o generada/.test(a)));
  assert.equal(origenPrueba({ tipo: 'prueba', capturas: [{ src: 'foto.png', procedencia: 'ia' }] }), null);
  const cifra = { tipo: 'cifra', lineas: ['100'], procedencia: 'ejemplo', arriba: 'Ejemplo ilustrativo' };
  assert.deepEqual(reglasDescargo({ laminas: [cifra] }).avisos, []);
  assert.match(construir({ laminas: [cifra] }).html, /class="procedencia">Ejemplo ficticio/);
  assert.equal(sanearDeck({ laminas: [{ ...objeto, procedencia: 'inventada' }] }).deck.laminas[0].procedencia, undefined);
});
test('B2: lista cerrada de credibilidad y huecos', () => {
  for (const texto of ['Más de 300 consultores', '+5,000 emprendedores', '2,000 miembros', '1,200 dueños de negocio', 'Trabajé con 40 marcas', 'Más de {{CLIENTES}} clientes']) assert.ok(hayCifraCredibilidad({ laminas: [idea(texto)] }), texto);
  for (const texto of ['Más de 5 minutos', 'con 3 pasos', '10 horas', '45 días']) assert.equal(hayCifraCredibilidad({ laminas: [idea(texto)] }), false, texto);
  assert.ok(hayCifraCredibilidad({ laminas: [idea('Trayectoria', { credibilidad: true })] }));
});
test('B3: cómo acentuado, guion literal y gancho concreto', () => {
  assert.equal(prometeComo({ laminas: [idea('Cobra como experto')] }), false);
  assert.ok(prometeComo({ laminas: [idea('Aprende cómo cobrar')] }));
  const chat = { tipo: 'chat', mensajes: [{ de: 'yo', texto: 'Hola, aquí va la cotización.' }] };
  assert.ok(ensenaComo({ ...chat, encabezado: 'Puedes responder así:' }));
  assert.equal(ensenaComo({ ...chat, encabezado: 'Un servicio de fotografía' }), false);
  assert.ok(ensenaComo({ ...chat, guion: true }));
  assert.ok(reglasApertura({ pieza: 'reel', laminas: [idea('Mejora tu trabajo'), { tipo: 'cifra', lineas: ['100'] }] }, [1, 1]).avisos.some(a => /escena de la lámina 2/.test(a)));
  assert.deepEqual(reglasApertura({ pieza: 'tutorial', laminas: [idea('Mejora tu trabajo')] }, [1]).avisos, []);
});
test('B4: cifras cuentan una palabra y dur participa del ritmo', () => {
  for (const texto of ['$40,000-⁠60,000', '1.5', '10-⁠15%', '$79-⁠99']) { assert.equal(contarPalabras(texto), 1); assert.equal(palabras(texto), 1); }
  assert.equal(palabras('10 - 15%'), 2);
  const r = reglasRitmo({ laminas: [idea('x', { dur: [2, 3] })] }, [2]);
  assert.equal(r.ritmo.mediana, 2.5); assert.equal(r.ritmo.origen, 'dur');
  assert.equal(reglasRitmo({ laminas: [idea('x')] }, [1]).ritmo.mediana, null);
  const lento = reglasRitmo({ laminas: [idea('x', { dur: 9 })] }, [1]);
  assert.deepEqual(lento.errores, []); assert.ok(lento.avisos.some(a => /9.0 s/.test(a)));
  assert.match(fuente({ P: () => '' }, '[FUENTE_PENDIENTE]'), /class="hueco pendiente"/);
});
test('B4: estrellas y clic tienen etiqueta en el mapa del demo', () => {
  const deck = JSON.parse(fs.readFileSync('ejemplos/demo/deck.json', 'utf8'));
  const r = construir(deck), i = deck.laminas.findIndex(l => l.id === 'calificar');
  for (const k of [1, 2]) { assert.ok(r.revela[i][k].some(t => /^★ /.test(t))); assert.ok(r.revela[i][k].includes('clic')); }
});
test('A1/A2 navegador: PDF páginas por paso sin cursor y apagado 35/20', async t => {
  const deck = { sala: true, laminas: [{ tipo: 'pasos', iconos: ['🤖', '💡'], activo: 1, voz: ['Uno'] }, { tipo: 'camara', voz: 'Fuera' }, { tipo: 'camara', vivo: true, texto: 'Participa', dur: 10, voz: 'Ahora' }] };
  const r = construir(deck), hp = path.join(r.dir, 'index.html'); fs.writeFileSync(hp, r.html);
  let abierto;
  try { abierto = await abrir(hp, r.W, r.H); }
  catch (e) {
    if (/Permission denied|Executable doesn't exist|Playwright|browserType.launch/i.test(e.message)) return t.skip('Chromium no disponible en este entorno');
    throw e;
  }
  const { browser, page } = abierto;
  try {
    const op = await page.evaluate(() => getComputedStyle(document.querySelector('[style*="opacity:var(--apagado)"]')).opacity);
    assert.equal(Number(op), .35);
    await page.evaluate(() => document.body.classList.remove('sala'));
    assert.equal(Number(await page.evaluate(() => getComputedStyle(document.querySelector('[style*="opacity:var(--apagado)"]')).opacity)), .2);
    const pdf = await exportarPdfPasos({ browser, page, deck, dirSalida: r.dir, W: r.W, H: r.H });
    assert.equal(pdf.paginas_pasos, r.pasos[0] + 1); assert.equal(pdf.cursores_visibles, 0);
    assert.ok(fs.statSync(path.join(r.dir, 'laminas-pasos.pdf')).size > 100);
  } finally { await browser.close(); }
});

test('B9: chat vertical corto crece, encabezado frase y elección explícita respetada', () => {
  const l = { tipo: 'chat', encabezado: 'Lo que te escribió', mensajes: [{ de: 'otro', texto: '¿Puedes ayudarme?' }, { de: 'yo', texto: 'Claro, aquí está.' }] };
  const r = construir({ formato: '9:16', laminas: [l] });
  assert.match(r.html, /--tb:76px;--av:99px/);
  const seccion = r.html.match(/<section[\s\S]*?<\/section>/)[0];
  assert.ok(!seccion.includes('class="encabezado"'));
  const explicito = construir({ formato: '9:16', laminas: [{ ...l, tam_texto: '64px', encabezado_estilo: 'rotulo' }] });
  assert.match(explicito.html, /--tb:64px;--av:83px/); assert.match(explicito.html, /class="encabezado"/);
});

test('B10: color semántico y frase en mayúsculas, solo avisos', async () => {
  const { reglasEstilo } = await import('../scripts/lib/reglas-estilo.mjs');
  for (const t of ['{v:gratis}', '{r:SIN PERMISO}', 'ESTO FUNCIONA MUCHO MEJOR', 'ESTO ES UNA PRUEBA', 'HOY TODO SALE MEJOR']) {
    const r = reglasEstilo({ laminas: [idea(t)] }); assert.equal(r.errores.length, 0); assert.ok(r.avisos.length > 0, t);
  }
  for (const t of ['{r:-$5,000}', 'IA', '__NO__', '{v:Ganaste clientes}', '{r:__Atención__}']) assert.deepEqual(reglasEstilo({ laminas: [idea(t)] }).avisos, [], t);
  for (const carpeta of ['demo', 'reel', 'vsl-corto', 'propuesta', 'clase-express']) {
    const deck = JSON.parse(fs.readFileSync(`ejemplos/${carpeta}/deck.json`, 'utf8'));
    assert.deepEqual(reglasEstilo(deck).avisos, [], carpeta);
  }
  assert.deepEqual(reglasEstilo(JSON.parse(fs.readFileSync('pruebas/replica/deck.json', 'utf8'))).avisos, []);
});

test('B8: logo pendiente en layouts y fuente de lista', async () => {
  const { sustituirDatos } = await import('../scripts/lib/datos.mjs');
  const { reglasLogos } = await import('../scripts/lib/reglas-estilo.mjs');
  const original = { laminas: [{ tipo: 'flujo', nodos: [{ emoji: '🌐', etiqueta: 'Seller Center' }] }] };
  assert.ok(reglasLogos(original).avisos.some(a => /LOGO_TIKTOK/.test(a)));
  assert.deepEqual(reglasLogos({ laminas: [{ tipo: 'lista', items: [{ texto: 'Publica tu oferta en Instagram', emoji: '📱' }, { texto: 'Agenda por WhatsApp', emoji: '📅' }] }] }).avisos, []);
  assert.deepEqual(reglasLogos({ laminas: [idea('Uso TikTok para mostrar un proceso completo', { emoji: '🌐' })] }).avisos, []);
  const r = sustituirDatos({ laminas: [{ tipo: 'objeto', imagen: '{{LOGO_X}}' }, { tipo: 'objeto', imagen: '{{OTRA}}' }] });
  assert.equal(r.deck.laminas[0].imagen, '[LOGO_X]'); assert.equal(r.deck.laminas[1].imagen, '{{OTRA}}');
  assert.deepEqual(r.declarados.LOGO_X.laminas, [1]);
  assert.equal(sustituirDatos({ datos: { LOGO_X: 'assets/x.png' }, laminas: [{ tipo: 'objeto', imagen: '{{LOGO_X}}' }] }).deck.laminas[0].imagen, 'assets/x.png');
  const tipos = [
    { tipo: 'objeto', imagen: '{{LOGO_X}}' }, { tipo: 'oscura', imagen: '{{LOGO_X}}' },
    { tipo: 'flujo', nodos: [{ imagen: '{{LOGO_X}}', etiqueta: 'Marca' }] },
    { tipo: 'pasos', iconos: [{ imagen: '{{LOGO_X}}' }], etiquetas: ['Marca'] },
    { tipo: 'stack', items: [{ imagen: '{{LOGO_X}}', texto: 'Marca' }] },
  ];
  for (const l of tipos) { const c = construir({ laminas: [l] }); assert.match(c.html, /class="logo-pendiente"/); assert.ok(c.declarados.LOGO_X); }
  assert.match(construir({ laminas: [{ tipo: 'lista', items: ['Uno', 'Dos'], fuente: 'Autor' }] }).html, /class="fuente" data-p="1">Autor/);
});

test('B4d: el nombre de un hueco no cuenta como varias palabras', async () => {
  const { textoConMuestras } = await import('../scripts/lib/medidas-dom.mjs');
  const texto = 'Una idea que el alumno puede poner en práctica cada día para ver mejor sus datos y después comparar los [CLIENTES_CON_SUSCRIPCION_ACTIVA]';
  const datos = { CLIENTES_CON_SUSCRIPCION_ACTIVA: { pendiente: true, motivo: 'Confirmar', muestra: '25' } };
  assert.equal(contarPalabras(textoConMuestras(texto, datos)), contarPalabras(texto.replace('[CLIENTES_CON_SUSCRIPCION_ACTIVA]', '25')));
  assert.equal(textoConMuestras('[SIN_MUESTRA]'), '0000');
});
