// Ronda 5, grupo conocimiento: el mapa que vuelve (tope de retornos), la respuesta a una objeción que demuestra, el
// «cómo» de un reel, la prueba propia contra la de mercado, las métricas del arco (contrato de tiempo, revelación y
// llamados en %), la ficha de marca sin terminal (setup.sh con flags) y el puente de clases, y el 9:16 de pasos y tarjetas.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { revisarDeck, pruebaDelDeck, faltaParaFinal, reglasCredibilidad, infoFirma, mensajeSinFirma, origenFuente } from '../scripts/lib/reglas-deck.mjs';
import { reglasRetornoMapa, reglasRespuestaObjecion, reglasReel, reglasContrato, arcoDeck, contratoDeTiempo, lineaArco } from '../scripts/lib/reglas-arco.mjs';
import { leerFicha, datosParaDeck, fichaDesdeOpciones } from '../scripts/lib/marca.mjs';
import { crearCtx } from '../scripts/lib/comun.mjs';
import { Emojis } from '../scripts/lib/emoji.mjs';
import { LAYOUTS, FORMATOS } from '../scripts/lib/construir.mjs';
import { DIR_SKILL } from '../scripts/lib/pipeline.mjs';

const idea = (texto, extra = {}) => ({ tipo: 'idea', emoji: '💡', texto, voz: 'una frase corta de seis palabras', ...extra });
const unos = L => L.map(l => Math.max(1, Array.isArray(l.voz) ? l.voz.length : 1));
const MAPA = { id: 'mapa', tipo: 'pasos', iconos: ['📅', '🎯', '🏅'], etiquetas: ['Cita fija', 'Reto', 'Logro'], activo: 1, voz: 'Tres pasos para que se queden' };
const vuelve = (id, activo, extra = {}) => ({ id, tipo: 'pasos', como: 'mapa', activo, hechos: Array.from({ length: activo - 1 }, (_, i) => i + 1), voz: 'Paso siguiente del ciclo', ...extra });

// ---------- el mapa que vuelve ----------
test('mapa r5: el vaivén del webinar (mapa → cita → mapa → reto → mapa, sin texto) avisa una vez con las dos láminas', () => {
  const L = [idea('Gancho'), MAPA, idea('Mismo día, misma hora'), vuelve('mapa-2', 2), idea('Un reto con fecha'), vuelve('mapa-3', 3), idea('Muro')];
  const r = reglasRetornoMapa({ laminas: L }, unos(L));
  assert.equal(r.avisos.length, 1, r.avisos.join('\n'));
  assert.match(r.avisos[0], /vuelve sin nada nuevo.*lámina 4 \(mapa-2\).*lámina 6 \(mapa-3\)/);
  assert.match(r.avisos[0], /titular del bloque/);
});

test('mapa r5: los regresos con el titular del bloque (el reel) no avisan; el mismo mapa dos veces seguidas sí', () => {
  const reel = [idea('Gancho'), { ...MAPA, texto: '3 tareas' }, vuelve('t1', 1, { texto: 'La IA te hace **la minuta**' }), idea('Grabas'),
    vuelve('t2', 2, { texto: 'La IA ordena **tu correo**' }), idea('Separa'), idea('Enviar'), vuelve('t3', 3, { texto: 'El reporte' }), idea('Chat')];
  const r = reglasRetornoMapa({ laminas: reel }, unos(reel));
  assert.deepEqual(r.avisos, []);
  // sin `como`: las mismas teclas e íconos repetidos a mano también son el mismo mapa
  const aMano = [MAPA, { ...MAPA, id: 'otra', activo: 2 }];
  assert.match(reglasRetornoMapa({ laminas: aMano }, unos(aMano)).avisos[0], /paso 2 no tiene contenido/);
});

test('mapa r5: bloques largos (3+ láminas y 20+ s, o un tramo en vivo de minutos) no avisan', () => {
  const largo = t => idea(t, { voz: 'una frase bastante más larga que se dice en voz alta durante el bloque de contenido' });
  const L = [MAPA, largo('a'), largo('b'), largo('c'), largo('d'), vuelve('mapa-2', 2), largo('e'), { tipo: 'camara', vivo: true, dur: 300, texto: 'Ahora tú' }, vuelve('mapa-3', 3)];
  assert.deepEqual(reglasRetornoMapa({ laminas: L }, unos(L)).avisos, []);
});

// ---------- la respuesta a una objeción ----------
const OBJ = n => ({ tipo: 'idea', emoji: 'no:⏳', encabezado: `Objeción #${n}`, encabezado_pos: 'entre', texto: '**«No tengo tiempo»**', voz: 'Objeción número uno' });
test('objeción r5: una respuesta en `idea` que solo afirma avisa; en `flujo`, `chat` o `idea` con fuente, no', () => {
  const afirma = { pieza: 'vsl-corto', laminas: [OBJ(1), idea('**60 minutos** a la semana'), OBJ(2), idea('Empieza con los que ya te pagaron')] };
  const r = reglasRespuestaObjecion(afirma);
  assert.equal(r.avisos.length, 2);
  assert.match(r.avisos[0], /Objeción #1 solo afirma.*flujo/);
  const demuestra = { pieza: 'vsl-corto', laminas: [OBJ(1), { tipo: 'flujo', nodos: [{ emoji: '📄', etiqueta: 'Hoja' }, { emoji: '🤖', etiqueta: 'Agente' }] }, idea('Absolutamente.'),
    OBJ(2), idea('83 de 100 llegaron', { fuente: 'Autor, «obra» (2020)' })] };
  assert.deepEqual(reglasRespuestaObjecion(demuestra).avisos, []);
  // fuera de una pieza de venta no se revisa (el demo es un catálogo)
  assert.deepEqual(reglasRespuestaObjecion({ laminas: afirma.laminas }).avisos, []);
});

// ---------- el «cómo» de un reel ----------
test('reel r5: promete «tareas que puedes delegar» sin el prompt a la vista → aviso y falta «el cómo a la vista»; con el prompt en un chat, no', () => {
  const sinComo = { pieza: 'reel', laminas: [idea('11 pm y sigues en el correo'), { ...MAPA, texto: '3 tareas que ya puedes **delegar a la IA**' },
    { tipo: 'boton', boton: 'Enviar', texto: 'Tú das enviar' }, { tipo: 'chat', mensajes: [{ de: 'otro', texto: 'Tu reporte ya está listo' }] }, idea('Guarda __este reel__')] };
  assert.match(reglasReel(sinComo).avisos[0], /promete un «cómo»/);
  assert.ok(faltaParaFinal(sinComo).includes('el cómo a la vista'));
  const conComo = { ...sinComo, laminas: [...sinComo.laminas.slice(0, 3), { tipo: 'chat', mensajes: [{ de: 'yo', texto: 'Resume esta junta en una tabla: quién hace qué.' }] }, sinComo.laminas[4]] };
  assert.deepEqual(reglasReel(conComo).avisos, []);
  assert.ok(!faltaParaFinal(conComo).includes('el cómo a la vista'));
  // un reel de opinión («3 errores») no promete un cómo
  assert.deepEqual(reglasReel({ pieza: 'reel', laminas: [idea('El error que te cuesta clientes'), idea('Guarda __este reel__')] }).avisos, []);
});

// ---------- prueba propia contra prueba de mercado ----------
test('prueba r5: un estudio de terceros es «mercado» y avisa en un vsl; un caso propio (o su hueco) es «propia»', () => {
  assert.equal(origenFuente('Reich y Ruipérez-Valiente, «The MOOC pivot», Science (2019)'), 'mercado');
  assert.equal(origenFuente('Gail Matthews, Dominican University of California (2015)'), 'mercado');
  assert.equal(origenFuente('caso real, con permiso'), 'propia');
  assert.equal(origenFuente('[FUENTE_CASO]'), 'propia');
  const estudio = { tipo: 'cifra', lineas: ['Pagaron el certificado → terminó: **46%**'], fuente: 'Reich y Ruipérez-Valiente, Science (2019)' };
  const vsl = { pieza: 'vsl-corto', laminas: [idea('Desde 2016, 200 alumnos'), estudio] };
  assert.deepEqual(pruebaDelDeck(vsl), { tipo: 'mercado', lamina: 2 });
  assert.ok(!faltaParaFinal(vsl).includes('prueba real'), 'la de mercado sigue contando para final');
  assert.match(reglasCredibilidad(vsl).avisos.join('\n'), /única prueba es de mercado \(lámina 2/);
  const caso = { tipo: 'cifra', arriba: 'Ana, nutrióloga:', lineas: ['de 12 a **31 pacientes** al mes en 8 semanas'], fuente: 'caso real, con permiso' };
  const conCaso = { ...vsl, laminas: [...vsl.laminas, caso] };
  assert.deepEqual(pruebaDelDeck(conCaso), { tipo: 'propia', lamina: 3 });
  assert.ok(!reglasCredibilidad(conCaso).avisos.some(a => /de mercado/.test(a)));
});

// ---------- métricas del arco y contrato de tiempo ----------
// ~4 min de voz: 60 láminas de 10 palabras
const voz10 = 'una frase de diez palabras que se dice en voz';
const claseCon = (min, extra = {}) => ({ pieza: 'tutorial', clase: true, laminas: [idea('Gancho'), { tipo: 'cifra', arriba: 'Te pido los próximos:', lineas: [`__${min} minutos__`], voz: voz10 },
  ...Array.from({ length: 58 }, (_, i) => idea(`L${i}`, { voz: voz10 }))], ...extra });
test('contrato r5: «12 minutos» con ~4 min de voz avisa; «4 minutos» no; qa.json → arco trae el contrato y el desvío', () => {
  const doce = claseCon(12), cuatro = claseCon(4);
  const a = reglasContrato(doce, unos(doce.laminas)).avisos;
  assert.equal(a.length, 1);
  assert.match(a[0], /lámina 2 promete 12:00 y la voz dura ~\d:\d\d \(-\d+ %\)/);
  assert.deepEqual(reglasContrato(cuatro, unos(cuatro.laminas)).avisos, []);
  const arco = arcoDeck(cuatro, unos(cuatro.laminas));
  assert.deepEqual(arco.contrato, { min: 4, lamina: 2, fuente: 'detectado' });
  assert.ok(Math.abs(arco.desvio_pct) <= 30, String(arco.desvio_pct));
  assert.match(lineaArco(arco), /^arco: contrato 4:00 \(lám 2\) · voz \d:\d\d/);
});

test('contrato r5: «en 5 minutos lo configuras» en una lista no es contrato; una clase sin contrato avisa; `"contrato": true` manda', () => {
  const L = [idea('Gancho'), { tipo: 'lista', items: ['Abre la app', 'En 5 minutos lo configuras'], voz: ['a', 'b'] }, ...Array.from({ length: 6 }, (_, i) => idea(`L${i}`))];
  assert.equal(contratoDeTiempo({ laminas: L }), null);
  assert.match(reglasContrato({ pieza: 'clase-corta', laminas: L }, unos(L)).avisos[0], /falta el contrato de tiempo/);
  assert.deepEqual(reglasContrato({ pieza: 'vsl-corto', laminas: L }, unos(L)).avisos, [], 'un VSL no promete tiempo');
  const marcado = [...L.slice(0, 7), { tipo: 'objeto', reloj: '33:00', contrato: true, texto: 'Los próximos **33 minutos**' }];
  assert.deepEqual(contratoDeTiempo({ laminas: marcado }), { min: 33, lamina: 8, fuente: 'marcado' });
});

test('arco r5: la oferta (revelación e inicio en %) y los llamados con su lámina y su %', () => {
  const L = [...Array.from({ length: 6 }, (_, i) => idea(`L${i}`)), { tipo: 'oscura', titulo: 'Producto', voz: 'uno' }, idea('Incluye'),
    { tipo: 'boton', boton: 'Aplica aquí', voz: 'dos' }, idea('Resumen'), { tipo: 'boton', boton: 'Aplica aquí', voz: 'tres' }];
  const a = arcoDeck({ pieza: 'webinar', laminas: L }, unos(L));
  assert.equal(a.oferta.revelacion_lamina, 7);
  assert.ok(a.oferta.revelacion_pct > 40 && a.oferta.revelacion_pct < 70, String(a.oferta.revelacion_pct));
  assert.deepEqual(a.llamados.map(x => x.lamina), [9, 11]);
  assert.equal(revisarDeck({ pieza: 'webinar', laminas: L }, unos(L)).arco.oferta.revelacion_lamina, 7);
});

// ---------- ficha de marca sin terminal y puente de clases ----------
test('setup r5: --solo-ficha --firma crea la ficha sin TTY, no la pisa sin --forzar y rechaza una firma de ejemplo', () => {
  const casa = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-setup-'));
  const correr = (...a) => spawnSync('bash', [path.join(DIR_SKILL, 'scripts', 'setup.sh'), ...a], { env: { ...process.env, HOME: casa }, input: '', encoding: 'utf8' });
  const r = correr('--solo-ficha', '--firma', '@ana', '--proxima-clase', 'cada lunes 8 pm', '--comunidad', 'Club Ana');
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const ficha = path.join(casa, '.config', 'diapositivas-pizarron-ia', 'MI-MARCA.md');
  const f = leerFicha(fs.readFileSync(ficha, 'utf8'));
  assert.deepEqual(f.firma, { texto: '@ana' });
  assert.deepEqual(f.datos, { COMUNIDAD: 'Club Ana', PROXIMA_CLASE: 'cada lunes 8 pm' });
  assert.equal((fs.statSync(ficha).mode & 0o777).toString(8), '600');
  const otra = correr('--solo-ficha', '--firma', '@otra');
  assert.equal(otra.status, 0);
  assert.match(otra.stdout, /no la sobrescribo/);
  assert.deepEqual(leerFicha(fs.readFileSync(ficha, 'utf8')).firma, { texto: '@ana' });
  assert.equal(correr('--solo-ficha', '--firma', '@otra', '--forzar').status, 0);
  assert.deepEqual(leerFicha(fs.readFileSync(ficha, 'utf8')).firma, { texto: '@otra' });
  assert.equal(correr('--solo-ficha', '--firma', 'tumarca.com', '--forzar').status, 3);
  assert.throws(() => fichaDesdeOpciones({ firma: '@tuusuario' }), /valor de ejemplo/);
});

test('puente r5: datosParaDeck llena {{PROXIMA_CLASE}} que falta o está pendiente sin valor, y no pisa un valor dado', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-puente-'));
  const deckDir = path.join(dir, 'clase');
  fs.mkdirSync(deckDir);
  fs.writeFileSync(path.join(deckDir, 'MI-MARCA.md'), fichaDesdeOpciones({ firma: '@ana', proximaClase: 'cada lunes 8 pm', comunidad: 'Club Ana' }));
  const env = { HOME: dir, PIZARRON_MARCA: 'no' };
  const laminas = [idea('Próxima clase: **{{PROXIMA_CLASE}}**')];
  const falta = datosParaDeck({ laminas }, deckDir, { env });
  assert.deepEqual(falta.deck.datos, { PROXIMA_CLASE: 'cada lunes 8 pm' });
  assert.match(falta.info[0], /PROXIMA_CLASE tomada de .*MI-MARCA\.md/);
  const pendiente = datosParaDeck({ laminas, datos: { PROXIMA_CLASE: { pendiente: true, motivo: 'x' } } }, deckDir, { env });
  assert.equal(pendiente.deck.datos.PROXIMA_CLASE, 'cada lunes 8 pm');
  const dado = datosParaDeck({ laminas, datos: { PROXIMA_CLASE: 'martes 7 pm' } }, deckDir, { env });
  assert.equal(dado.deck.datos.PROXIMA_CLASE, 'martes 7 pm');
  assert.deepEqual(dado.info, []);
  // COMUNIDAD no se usa en el deck: no se agrega
  assert.equal(falta.deck.datos.COMUNIDAD, undefined);
});

test('firma r5: el aviso distingue «la ficha no existe» (con el comando) de «la ficha no tiene Texto»', () => {
  assert.match(infoFirma({}, { ficha: null, rutaGlobal: '/x/MI-MARCA.md' }), /no existe; créala con bash scripts\/setup\.sh --solo-ficha --firma/);
  assert.match(infoFirma({}, { ficha: '/y/MI-MARCA.md' }), /la ficha \/y\/MI-MARCA\.md no tiene «Texto»/);
  assert.equal(infoFirma({ marca: false }, { ficha: null }), null);
  assert.equal(mensajeSinFirma({ ficha: '/y' }), infoFirma({}, { ficha: '/y' }));
});

// ---------- 9:16: pasos y tarjetas ----------
const ctx916 = () => crearCtx({ em: new Emojis({ modo: 'apple', dirSalida: fs.mkdtempSync(path.join(os.tmpdir(), 'pz-916-')) }), formato: '9:16', F: FORMATOS['9:16'] });
const tamPx = (html, re) => [...html.matchAll(re)].map(m => Number(m[1]));
test('9:16 r5: la fila del mapa cabe en el ancho útil sin encaje (íconos de 200, etiqueta ajustada) y `emoji_tam` la fija', () => {
  const ctx = ctx916();
  const html = LAYOUTS.pasos({ iconos: ['📝', '📥', '📊'], etiquetas: ['Minutas', 'Correo', 'Reporte'], prefijo: 'Tarea' }, ctx);
  const etq = tamPx(html, /font-size:(\d+)px;font-weight:700;letter-spacing/g);
  assert.ok(etq.length === 3 && etq.every(t => t >= 56 && t <= 70), etq.join(','));
  // la etiqueta más larga cabe en su columna: (900 - 2×70) / 3 = 253 px
  assert.ok(0.56 * 'Reporte'.length * etq[0] <= 253, String(etq[0]));
  assert.match(html, /width="200"|width:200px|200px/);
  const fijo = LAYOUTS.pasos({ iconos: ['📝', '📥', '📊'], etiquetas: ['a', 'b', 'c'], emoji_tam: 150 }, ctx916());
  assert.match(fijo, /150px|width="150"/);
});

test('9:16 r5: hasta 3 tarjetas van en UNA columna de ~860 px con el rótulo a 64; con 4, dos columnas; en 16:9 no cambia', () => {
  const items = n => Array.from({ length: n }, (_, i) => ({ emoji: '🚨', texto: `Cosa ${i}` }));
  assert.match(LAYOUTS.tarjetas({ items: items(3) }, ctx916()), /--cols:1;--tw:860px;[^"]*--tt:64px/);
  assert.match(LAYOUTS.tarjetas({ items: items(4) }, ctx916()), /--cols:2;/);
  const h = crearCtx({ em: new Emojis({ modo: 'apple', dirSalida: fs.mkdtempSync(path.join(os.tmpdir(), 'pz-169-')) }), formato: '16:9', F: FORMATOS['16:9'] });
  assert.match(LAYOUTS.tarjetas({ items: items(3) }, h), /--cols:3;/);
});
