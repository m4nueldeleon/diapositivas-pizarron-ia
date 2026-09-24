import { validarSuperficies, sanearAceptaciones } from './contrato-superficies.mjs';
import { validarQr } from './qr.mjs';
// contrato.mjs — valida y sanea deck.json antes de construir.
//
// validarDeck: errores que impiden construir (mensajes accionables).
// sanearDeck:  copia del deck donde cada campo numérico, de tono, de tamaño o de forma queda dentro de
//              una lista cerrada. Así ningún valor del deck llega crudo a un atributo HTML o a CSS, y un
//              valor raro se descarta con aviso en lugar de romper el render. Además normaliza los ítems
//              escritos como texto suelto (tarjetas, chat, cuadrantes, nodos…) y devuelve `sugerencias`:
//              avisos suaves (campo que ese diseño no usa, emoji dudoso) que QA cuenta como aviso, no error.
import { analizarCompuesto, esEmojiTexto, specsDeCampo, esMano } from './emoji.mjs';
import { palabras, plano } from './markup.mjs';
import { validarDatos } from './datos.mjs';
import { PIEZAS, minutosObjetivo } from './tiempos.mjs';
import { etiquetasBarras, tablaAislada } from './layouts-datos.mjs';

const REQUERIDOS = {
  agenda: ['dias'],
  idea: ['texto|emoji'], lista: ['items|columnas'], flujo: ['nodos'], pasos: [], bifurcacion: ['origen', 'ramas'],
  cifra: ['lineas|valor'], cita: ['texto'], objeto: ['imagen|emoji|reloj'], tarjetas: ['items'], oscura: ['titulo|texto|imagen|emoji'],
  cuadrantes: ['items'], tabla: ['columnas', 'filas'], grafica: [], 'linea-tiempo': ['marcas'], medidor: [], opciones: ['items'], rejilla: ['total'],
  prueba: ['capturas'], chat: ['mensajes'], reparto: ['total'], calendario: [], boton: ['boton'], circulos: [], camara: [], foco: ['texto|nota'],
  stack: ['items'], calificacion: ['filas'], llamada: ['otros|yo'], meses: ['celdas'], foto: ['imagen', 'texto'], anfitrion: ['imagen', 'texto'],
};
const LISTAS = ['items', 'nodos', 'ramas', 'columnas', 'filas', 'series', 'barras', 'marcas', 'tramos', 'partes', 'dias', 'fases',
  'anotaciones', 'capturas', 'mensajes', 'lineas', 'iconos', 'etiquetas', 'destacar', 'hechos', 'anclas', 'flechas', 'celdas', 'retornos', 'bandas', 'leyenda', 'letras', 'eventos'];


// Campos que lee cada diseño (además de los COMUNES). Si agregas un campo a un layout, agrégalo aquí:
// pruebas/contrato.test.mjs revisa que todo «l.campo» de layouts-*.mjs esté en esta tabla.
export const COMUNES = ['id', 'tipo', 'como', 'paga', 'voz', 'accion', 'si_falla', 'excepcion_persona', 'credibilidad', 'dur', 'ancla', 'anclas', 'revelar', 'sello', 'sello_paso', 'sello_pos', 'sello_sobre',
  'clic', 'clic_paso', 'clic_pos', 'cursor', 'firma', 'oscura', 'fondo', 'anclar',
  // `llamado: true` marca una lámina como llamado visible (reglas-deck.mjs); `paso_ref` elige el paso que
  // comparar.mjs mide contra el cuadro del video (réplica)
  'llamado', 'paso_ref', 'ms_ref',
  // `contrato: true` marca la lámina que promete el tiempo («los próximos 10 minutos»): qa.json → arco lo compara con la voz
  'contrato',
  // `anotaciones`: nota a mano con gancho (o flecha que entra desde el borde) hacia un ancla de CUALQUIER diseño
  'anotaciones', 'circulo_paso', 'flechas'];
export const CAMPOS = {
  agenda: ['dias','semanas','inicio','hoy','series','eventos'],
  idea: ['qr', 'texto', 'texto_paso', 'tam_texto', 'emoji', 'emoji_tam', 'emoji_lado', 'emoji_paso', 'apagar_emoji', 'estrellas', 'encabezado', 'encabezado_pos',
    'nota', 'nota_paso', 'tachar_paso', 'fuente', 'fuente_paso'],
  lista: ['columnas', 'apagar', 'letras', 'qr', 'fuente', 'fuente_paso', 'items', 'tam_texto', 'separacion', 'vineta', 'tachar_despues', 'alinear', 'encabezado', 'nota', 'nota_paso', 'activo', 'hechos'],
  flujo: ['nodos', 'emoji_tam', 'separacion', 'flecha', 'flechas', 'retornos', 'aparte', 'encabezado', 'texto', 'texto_paso', 'tam_texto', 'nota',
    'nota_paso', 'fuente', 'fuente_paso'],
  pasos: ['logos', 'letras', 'n', 'iconos', 'etiquetas', 'activo', 'hechos', 'sobre', 'prefijo', 'ruta', 'arrastre', 'separacion', 'tam_etiqueta', 'emoji_tam', 'texto', 'texto_paso',
    'tam_texto', 'nota', 'nota_paso',
    // internos (los pone resolverComo → marcarGrupos; empiezan con «_» y el autor no los escribe)
    '_grupo_texto', '_grupo_nota', '_grupo_hechos'],
  bifurcacion: ['origen', 'ramas', 'llave', 'separacion', 'tam_texto', 'emoji_tam'],
  cifra: ['procedencia', 'lineas', 'valor', 'tam', 'arriba', 'abajo', 'fuente', 'fuente_paso', 'texto', 'texto_paso', 'nota', 'nota_paso', 'tachar_paso'],
  cita: ['texto', 'tam_texto', 'emoji', 'emoji_tam', 'nota', 'nota_paso', 'tachar_paso', 'fuente', 'fuente_paso'],
  objeto: ['logos', 'procedencia', 'fuente', 'fuente_paso', 'imagen', 'alto', 'emoji', 'emoji_tam', 'reloj', 'texto', 'texto_paso', 'tam_texto', 'nota', 'nota_paso'],
  foto: ['mensajes','mensajes_pos','imagen', 'texto', 'texto_paso', 'velo', 'procedencia', 'fuente', 'fuente_paso'],
  anfitrion: ['imagen', 'lado', 'texto', 'texto_paso', 'procedencia'],
  tarjetas: ['variante', 'items', 'columnas', 'ancho', 'tam_texto', 'emoji_tam', 'encabezado', 'nota', 'nota_paso', 'fuente', 'fuente_paso'],
  oscura: ['imagen', 'alto', 'emoji', 'emoji_tam', 'titulo', 'texto', 'texto_paso', 'nota', 'nota_paso'],
  cuadrantes: ['items', 'columnas'],
  tabla: ['columnas', 'filas', 'vacias', 'fijas', 'esquina', 'ancho_etiqueta', 'converger', 'fuente', 'fuente_paso'],
  grafica: ['grafica', 'series', 'barras', 'banda', 'banda_paso', 'eje_x', 'eje_y', 'titulo', 'subtitulo', 'texto', 'texto_paso', 'nota', 'nota_paso',
    'fuente', 'fuente_paso'],
  'linea-tiempo': ['escala','marcas', 'tramos', 'texto', 'texto_paso', 'nota', 'nota_paso', 'fuente', 'fuente_paso'],
  medidor: ['valor', 'tono', 'texto', 'texto_paso', 'tam_texto', 'nota', 'nota_paso'],
  opciones: ['items', 'elegida', 'texto', 'texto_paso', 'texto_pos'],
  rejilla: ['bandas', 'leyenda', 'bandas_paso', 'encerrar', 'encerrar_paso', 'total', 'aspecto', 'columnas', 'ancho', 'alto', 'destacar', 'emoji', 'punto', 'emoji_destacado', 'apagar_resto', 'tono',
    'tono_destacado', 'anotacion', 'anotacion_paso', 'etiqueta_destacado', 'flecha_etiqueta', 'destacado_paso', 'emoji_etiqueta', 'encabezado', 'encabezado_estilo',
    'multitud', 'nota_destacado', 'nota_destacado_paso',
    'texto', 'texto_paso', 'fuente', 'fuente_paso'],
  prueba: ['mensajes','mensajes_pos','variante', 'procedencia', 'fuente', 'fuente_paso', 'capturas', 'encabezado', 'encabezado_estilo', 'texto', 'texto_paso'],
  chat: ['letras','procedencia','fuente','fuente_paso','variante','marco','app','grabando','texto','guion', 'mensajes', 'encabezado', 'encabezado_estilo', 'tam_texto', 'avatar_yo', 'avatar_otro', 'avatar_tam'],
  reparto: ['total', 'partes', 'separacion', 'titulo'],
  calendario: ['fases', 'fase_activa', 'color', 'dias', 'n', 'columnas', 'palabra_dia', 'anotaciones', 'titulo', 'rango'],
  boton: ['variante','hora','sub','qr', 'boton', 'emoji', 'texto', 'texto_paso', 'tam_texto', 'nota', 'nota_paso'],
  circulos: ['radio', 'radio_interior', 'tono', 'tono_interior', 'personas', 'adentro', 'tono_paso', 'emoji', 'centro', 'centro_paso', 'interior_paso', 'texto',
    'texto_paso', 'nota', 'nota_paso'],
  // `vivo: true`: tramo en vivo de una clase (actividad, demostración, preguntas) con su consigna para el público
  camara: ['nota', 'vivo', 'texto', 'items', 'emoji'],
  foco: ['texto', 'nota', 'nota_paso', 'tam', 'opacidad'],
  calificacion: ['filas', 'max', 'emoji', 'acumular', 'encabezado', 'nota', 'nota_paso'],
  stack: ['items', 'columnas', 'sangre', 'encabezado', 'remate', 'remate_paso', 'total', 'nota', 'nota_paso'],
  llamada: ['yo', 'otros', 'texto', 'texto_paso', 'tam_texto', 'nota', 'nota_paso'],
  meses: ['celdas', 'columnas', 'valores_paso'],
};

// ---------- objetos que vuelven (SKILL, regla 7): `"como": "<id>"` ----------
// El mapa 1-2-3 abre cada sección y el calendario vuelve con otra fase activa [16:40, 28:00, 29:25]: el objeto se
// declara UNA vez y las láminas siguientes lo reusan con `como`. Se heredan SOLO los campos del objeto (lista blanca);
// nunca id, voz, revelar, activo, hechos, fase_activa, texto, notas ni marcas. Lo que trae la hija gana. La madre va
// ANTES; se permiten cadenas (A ← B ← C). Devuelve una copia: el deck original no se toca.
export const CAMPOS_OBJETO = {
  pasos: ['logos', 'letras', 'n', 'iconos', 'etiquetas', 'prefijo', 'sobre', 'ruta', 'separacion', 'tam_etiqueta', 'emoji_tam'],
  calendario: ['titulo', 'dias', 'fases', 'n', 'columnas', 'palabra_dia', 'color', 'rango'],
  tabla: ['esquina', 'columnas', 'filas', 'ancho_etiqueta', 'vacias'],
  // los pilares del producto que vuelven con uno activo [37:40 → 39:45]
  lista: ['columnas', 'apagar', 'letras', 'items', 'encabezado', 'tam_texto', 'separacion', 'vineta'],
  // la rejilla de meses que cambia sus emojis por valores [16:45 → 16:50]
  meses: ['celdas', 'columnas'],
  chat: ['procedencia','fuente','fuente_paso','variante','marco','app','grabando','encabezado', 'encabezado_estilo', 'avatar_yo', 'avatar_otro', 'avatar_tam', 'sello', 'sello_sobre', 'sello_pos', 'sello_paso'],
  idea: ['emoji', 'emoji_tam'],
  prueba: ['capturas'],
  objeto: ['imagen', 'alto', 'emoji', 'emoji_tam', 'reloj', 'logos'],
};
const firmaObjeto = l => JSON.stringify((CAMPOS_OBJETO[l.tipo] || []).map(k => l[k] ?? null));
// El «mismo objeto»: el mapa por sus etiquetas (o íconos), el calendario por sus fases y la tabla-marcador (que crece
// columna por columna) por su esquina y las etiquetas de sus filas
const textoItem = x => (x && typeof x === 'object' ? x.texto : x);
const claveObjeto = l => JSON.stringify(l.tipo === 'pasos' ? l.etiquetas || l.iconos || null : l.tipo === 'calendario' ? l.fases || null
  : l.tipo === 'lista' ? (Array.isArray(l.items) && l.items.length ? l.items.map(textoItem) : null)
  : l.tipo === 'meses' ? (Array.isArray(l.celdas) && l.celdas.length ? l.celdas.map(c => (c && typeof c === 'object' ? c.mes : c)) : null)
  : Array.isArray(l.filas) && l.filas.length ? [l.esquina ?? '', l.filas.map(f => (f && typeof f === 'object' && !Array.isArray(f) ? f.etiqueta : Array.isArray(f) ? f[0] : f))] : null);
export function resolverComo(deck) {
  const errores = [], avisos = [];
  if (!deck || !Array.isArray(deck.laminas)) return { deck, errores, avisos };
  const L = deck.laminas, resueltas = [];
  L.forEach((l, i) => {
    if (!l || typeof l !== 'object' || l.como == null) { resueltas.push(l); return; }
    const n = `lámina ${i + 1}${l.id ? ` (${l.id})` : ''}`;
    const j = typeof l.como === 'string' ? L.findIndex(x => x && x.id === l.como) : -1;
    const tipo = l.tipo || (j >= 0 ? L[j].tipo : undefined);
    if (typeof l.como !== 'string' || j < 0) errores.push(`${n}: «como» apunta a «${l.como}», que no es el id de ninguna lámina`);
    else if (j === i) errores.push(`${n}: «como» apunta a sí misma`);
    else if (j > i) errores.push(`${n}: «como» apunta a «${l.como}», que va DESPUÉS: el objeto se declara antes de reusarlo`);
    else if (!l.tipo) errores.push(`${n}: con «como» también va el «tipo» (${L[j].tipo})`);
    else if (!CAMPOS_OBJETO[tipo]) errores.push(`${n}: «como» solo existe en ${Object.keys(CAMPOS_OBJETO).join(', ')} (el objeto que vuelve)`);
    else if (L[j].tipo !== tipo) errores.push(`${n}: «como» apunta a una lámina ${L[j].tipo} y esta es ${tipo}: el objeto que vuelve es del mismo diseño`);
    else {
      const madre = resueltas[j];
      const heredado = Object.fromEntries(CAMPOS_OBJETO[tipo].filter(k => madre[k] !== undefined && l[k] === undefined).map(k => [k, structuredClone(madre[k])]));
      resueltas.push({ ...heredado, ...l });
      return;
    }
    resueltas.push(l);
  });
  marcarGrupos(L, resueltas);
  // Copias a mano del mismo objeto sin `como`: se desalinean al editar
  resueltas.forEach((l, i) => {
    if (!l || !CAMPOS_OBJETO[l.tipo] || L[i].como != null) return;
    const j = resueltas.findIndex((x, k) => k < i && x && x.tipo === l.tipo && claveObjeto(x) !== 'null' && (claveObjeto(x) === claveObjeto(l) || firmaObjeto(x) === firmaObjeto(l)));
    if (j < 0) return;
    const madre = resueltas[j];
    avisos.push(`lámina ${i + 1}${l.id ? ` (${l.id})` : ''}: repite a mano el ${l.tipo} de la lámina ${j + 1}: decláralo una vez y reúsalo con "como": "${madre.id || `<pon un id a la lámina ${j + 1}>`}" (solo cambian activo, hechos, fase_activa, voz…); las copias se desalinean al editar`);
  });
  return { deck: { ...deck, laminas: resueltas }, errores, avisos };
}

// El mapa que vuelve con `como` es la MISMA imagen [ESTILO §4]: la fila de ✅ y un texto o una nota que cambian de largo
// no pueden moverlo. Cada miembro del grupo (la madre y las que la reúsan, en cadena) lleva `_grupo_texto` y `_grupo_nota`
// (el más largo del grupo) y `_grupo_hechos` (alguno lleva ✅): pasos() reserva ese alto en todos [r5, el mapa saltaba
// 58 px al aparecer la ✅]. Se marca sobre las copias ya resueltas (el deck original no se toca).
function marcarGrupos(L, resueltas) {
  const raizDe = i => { let j = i; for (let g = 0; g < 50 && L[j] && L[j].como != null; g++) { const k = L.findIndex(x => x && x.id === L[j].como); if (k < 0 || k >= j) break; j = k; } return j; };
  const grupos = new Map();
  resueltas.forEach((l, i) => { if (l && l.tipo === 'pasos') { const r = raizDe(i); if (resueltas[r] && resueltas[r].tipo === 'pasos') grupos.set(r, [...(grupos.get(r) || []), i]); } });
  const masLargo = (ms, k) => ms.map(i => resueltas[i][k]).filter(v => typeof v === 'string' && v.trim()).sort((a, b) => plano(b).length - plano(a).length)[0];
  grupos.forEach(ms => {
    if (ms.length < 2) return;
    const texto = masLargo(ms, 'texto'), nota = masLargo(ms, 'nota');
    const hechos = ms.some(i => Array.isArray(resueltas[i].hechos) && resueltas[i].hechos.length);
    ms.forEach(i => { resueltas[i] = { ...resueltas[i], ...(texto ? { _grupo_texto: texto } : {}), ...(nota ? { _grupo_nota: nota } : {}), ...(hechos ? { _grupo_hechos: true } : {}) }; });
  });
}

// Distancia de edición (para sugerir el campo que se quiso escribir)
function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

// Confusiones frecuentes: el campo que se escribe por intuición → el que lee el diseño (no se aceptan como alias:
// una sola forma de escribir cada cosa)
const CONFUSIONES = {
  opciones: { opciones: 'items', pastillas: 'items' }, lista: { lista: 'items', elementos: 'items' }, tarjetas: { tarjetas: 'items' },
  boton: { texto_boton: 'boton', etiqueta: 'boton' }, chat: { mensaje: 'mensajes', burbujas: 'mensajes' }, flujo: { pasos: 'nodos', items: 'nodos' },
  stack: { piezas: 'items', incluye: 'items' }, cifra: { numero: 'valor', cifra: 'valor' }, 'linea-tiempo': { hitos: 'marcas' },
  llamada: { persona: 'otros', personas: 'otros', mentor: 'otros', tu: 'yo' }, meses: { meses: 'celdas', items: 'celdas' },
};
// Campos del deck que ese diseño no usa: un error de dedo («sello_pso») o un campo de otro diseño.
export function camposDesconocidos(l, i) {
  if (!l || typeof l !== 'object' || !CAMPOS[l.tipo]) return [];
  const validos = [...COMUNES, ...CAMPOS[l.tipo]];
  return Object.keys(l).filter(k => !k.startsWith('_') && !validos.includes(k)).map(k => {
    const conf = (CONFUSIONES[l.tipo] || {})[k];
    if (conf) return `lámina ${i + 1} (${l.id || l.tipo}): «${k}» no existe en \`${l.tipo}\`: va en «${conf}»`;
    const cerca = validos.map(v => [v, distancia(k, v)]).filter(([, d]) => d <= 3).sort((a, b) => a[1] - b[1])[0];
    return `lámina ${i + 1} (${l.id || l.tipo}): «${k}» no aplica a «${l.tipo}» y se ignora${cerca ? `; ¿quisiste decir «${cerca[0]}»?` : ''}`;
  });
}

// Qué debe llevar cada elemento de las listas. Texto suelto = se normaliza en sanearDeck.
const ELEMENTOS = {
  'lista.items': { claves: ['texto', 'emoji'], texto: true },
  'tarjetas.items': { claves: ['texto', 'emoji', 'imagen'], texto: true },
  'chat.mensajes': { claves: ['texto'], texto: true },   // + hora, de, avatar
  'cuadrantes.items': { claves: ['texto', 'emoji'], texto: true },
  'flujo.nodos': { claves: ['emoji', 'imagen', 'etiqueta', 'sub'], texto: true },   // + cantidad (1-20), tarjeta, normal
  'bifurcacion.ramas': { claves: ['emoji', 'valor', 'texto'], texto: true },
  'linea-tiempo.marcas': { claves: ['texto', 'arriba', 'pos', 'tono'], texto: true },
  'tabla.filas': { claves: ['etiqueta', 'celdas'], lista: true },
  'opciones.items': { claves: ['texto'], texto: true },
  'prueba.capturas': { claves: ['src', 'post', 'hueco'] },
  'calificacion.filas': { claves: ['texto', 'emoji'], texto: true },   // + estrellas
  'stack.items': { claves: ['texto', 'emoji', 'imagen'], texto: true },   // + sub, color, tono, doble, alto
  'meses.celdas': { claves: ['mes', 'emoji', 'valor'], texto: true },    // + n (1-3)
};
const vacio = v => v == null || (typeof v === 'string' && !v.trim());

// Emojis: [no:|si:]base[+insignia]. Recorre la lámina entera (items, nodos, ramas, barras…). Los campos de emoji son
// los de emoji.mjs (esCampoEmoji): también la viñeta, los avatares del chat, `sobre` y `centro`.
const PICTO = /\p{Extended_Pictographic}|\p{Emoji_Presentation}|\u20e3/u;
function revisarEmojis(o, ruta, errores, avisos) {
  if (Array.isArray(o)) return o.forEach((x, i) => revisarEmojis(x, `${ruta}[${i}]`, errores, avisos));
  if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o)) {
    // `emoji` como lista solo existe en idea (par antes/después); `iconos` siempre es lista; el resto, un texto
    const specs = Array.isArray(v) && !['emoji', 'iconos'].includes(k) ? [] : specsDeCampo(k, v);
    for (const sp of specs) {
      const c = analizarCompuesto(sp);
      if (c.error) errores.push(`${ruta}.${k}: emoji «${sp}» ${c.error}`);
      else for (const parte of [c.base, c.insignia].filter(Boolean)) if (!parte.startsWith('trazo:') && !PICTO.test(parte)) avisos.push(`${ruta}.${k}: «${parte}» no parece un emoji`);
    }
    if (typeof v === 'object' && k !== 'voz') revisarEmojis(v, `${ruta}.${k}`, errores, avisos);
  }
}

// Textos que se dibujan DENTRO de un <svg> (gráfica, línea de tiempo): ahí el emoji no se cambia por la imagen
// de Fluent y sale con la fuente del sistema (Apple en Mac, Noto o un cuadro vacío en Linux).
function textosSvg(l) {
  const out = [];
  const de = (lista, campos, nom) => (Array.isArray(lista) ? lista : []).forEach((x, j) => x && typeof x === 'object' && campos.forEach(c => out.push([`${nom}[${j}].${c}`, x[c]])));
  if (l.tipo === 'grafica') {
    de(l.barras, ['etiqueta', 'valor_texto'], 'barras'); de(l.series, ['nombre'], 'series');
    ['banda', 'eje_x', 'eje_y'].forEach(c => out.push([c, l[c]]));
  } else if (l.tipo === 'linea-tiempo') { de(l.tramos, ['etiqueta'], 'tramos'); de(l.marcas, ['texto', 'arriba'], 'marcas'); }
  return out.filter(([, v]) => typeof v === 'string');
}
const segG = new Intl.Segmenter('es', { granularity: 'grapheme' });
export function emojisEnSvg(l) {
  return textosSvg(l).flatMap(([campo, v]) => [...segG.segment(v)].map(x => x.segment).filter(esEmojiTexto).map(e => [campo, e]));
}

// Calendario: fases, anotaciones y título que no cuadran con los días que se dibujan
function revisarCalendario(l, n, e) {
  const dias = Array.isArray(l.dias) && l.dias.length ? l.dias.length : Math.min(Number(l.n) || 14, NUMEROS_TIPO.calendario.n[1]);
  const fases = Array.isArray(l.fases) ? l.fases : [];
  fases.forEach((f, j) => {
    if (!f || typeof f !== 'object') return;
    if (Number(f.hasta) > dias) e.push(`${n} (calendario): fases[${j}] llega al día ${f.hasta} y el calendario tiene ${dias} días: sube «n» o agrega días`);
    if (Number(f.desde) > Number(f.hasta)) e.push(`${n} (calendario): fases[${j}] empieza (${f.desde}) después de terminar (${f.hasta})`);
    // «PHASE 2 · Value Delivery» en `nombre` sale todo en negrita en la barra; en ref_1760 el título, el subtítulo en
    // regular y la pastilla van separados (LAYOUTS.md, calendario)
    if (typeof f.nombre === 'string' && /\s[·•|–—-]\s\S/.test(f.nombre)) e.push(`${n} (calendario): fases[${j}].nombre une título y subtítulo con «${f.nombre.match(/\s([·•|–—-])\s/)[1]}»: pon el título en "nombre" y el resto en "sub"`);
  });
  if (Number(l.fase_activa) > fases.length) e.push(`${n} (calendario): fase_activa ${l.fase_activa} y hay ${fases.length} fases`);
  (Array.isArray(l.anotaciones) ? l.anotaciones : []).forEach((a, j) => {
    if (a && Number(a.dia) > dias) e.push(`${n} (calendario): anotaciones[${j}] apunta al día ${a.dia} y el calendario tiene ${dias} días`);
  });
  for (const c of ['titulo', 'rango']) {
    const m = typeof l[c] === 'string' && l[c].match(/(\d+)\s*d[ií]as\b/i);
    if (m && +m[1] !== dias) e.push(`${n} (calendario): «${c}» dice ${m[1]} días y se dibujan ${dias}: pon "n": ${m[1]} (hasta ${NUMEROS_TIPO.calendario.n[1]}) o corrige el texto`);
  }
}

// Índices que apuntan fuera de lo que se dibuja: un `pasos` con `activo: 9` y 3 teclas salía todo gris y QA daba 100.
// `activo` y `hechos` cuentan desde 1; `destacar` (rejilla) y `elegida` (opciones) desde 0.
function revisarRangos(l, n, e) {
  if (l.tipo === 'pasos') {
    const N = l.letras?.length || Number(l.n) || Math.max(l.iconos?.length || 0, l.logos?.length || 0) || 3;
    if (Number.isFinite(Number(l.activo)) && Number(l.activo) > N) e.push(`${n} (pasos): activo ${l.activo} y hay ${N} pasos (se cuentan desde 1)`);
    (Array.isArray(l.hechos) ? l.hechos : []).forEach(h => { if (typeof h === 'number' && (h < 1 || h > N)) e.push(`${n} (pasos): hechos incluye ${h} y hay ${N} pasos (se cuentan desde 1: 1..${N})`); });
  }
  if (l.tipo === 'lista' && Array.isArray(l.items)) {
    const N = l.items.length;
    if (Number.isFinite(Number(l.activo)) && Number(l.activo) > N) e.push(`${n} (lista): activo ${l.activo} y hay ${N} ítems (se cuentan desde 1)`);
    (Array.isArray(l.hechos) ? l.hechos : []).forEach(h => { if (typeof h === 'number' && (h < 1 || h > N)) e.push(`${n} (lista): hechos incluye ${h} y hay ${N} ítems (se cuentan desde 1: 1..${N})`); });
  }
  if (l.tipo === 'rejilla' && Array.isArray(l.destacar)) {
    const multitud = l.multitud === true;
    if (!multitud || l.total != null) {
      const total = Math.min(Number(l.total) || 100, 1200);
      l.destacar.forEach(d => { if (typeof d === 'number' && d >= total) e.push(`${n} (rejilla): destacar ${d} y la rejilla tiene ${total} celdas (se cuentan desde 0: 0..${total - 1})`); });
    }
  }
  if (l.tipo === 'opciones' && Array.isArray(l.items) && typeof l.elegida === 'number' && (l.elegida >= l.items.length || l.elegida < 0)) {
    e.push(`${n} (opciones): elegida ${l.elegida} y hay ${l.items.length} opciones (se cuentan desde 0: 0..${l.items.length - 1})`);
  }
}

// Flujo: signos de la lista cerrada y retornos que apuntan a nodos que existen (o al nodo aparte, si lo hay)
function revisarFlujo(l, n, e) {
  const N = Array.isArray(l.nodos) ? l.nodos.length : 0;
  (Array.isArray(l.flechas) ? l.flechas : []).forEach((f, j) => {
    if (f && typeof f === 'object' && f.signo != null && !['+', '=', '−', '×'].includes(f.signo)) e.push(`${n} (flujo): flechas[${j}].signo «${f.signo}» no existe (usa +, =, − o ×)`);
  });
  if (l.aparte != null && (typeof l.aparte !== 'object' || Array.isArray(l.aparte))) e.push(`${n} (flujo): «aparte» es un objeto { emoji, etiqueta }`);
  (Array.isArray(l.retornos) ? l.retornos : []).forEach((r, j) => {
    if (!r || typeof r !== 'object') return;
    const enRango = x => Number.isInteger(x) && x >= 0 && x < N;
    if (!enRango(r.desde)) e.push(`${n} (flujo): retornos[${j}].desde ${r.desde} no es un nodo (0-${N - 1})`);
    if (r.hasta === 'aparte') { if (!l.aparte) e.push(`${n} (flujo): retornos[${j}] va a "aparte" y el flujo no trae «aparte»: { "emoji", "etiqueta" }`); }
    else if (!enRango(r.hasta)) e.push(`${n} (flujo): retornos[${j}].hasta ${r.hasta} no es un nodo (0-${N - 1}) ni "aparte"`);
  });
}

export function validarDeck(deck, tipos) {
  const e = [];
  if (!deck || typeof deck !== 'object') return ['deck.json no es un objeto'];
  if (!Array.isArray(deck.laminas) || !deck.laminas.length) return ['falta «laminas» (una lista con al menos una lámina)'];
  if (deck.formato && !['16:9', '9:16', '1:1', '4:5'].includes(deck.formato)) e.push(`formato «${deck.formato}» no existe (usa 16:9, 9:16, 1:1 o 4:5)`);
  if (deck.emoji && !['auto', 'apple', 'fluent'].includes(deck.emoji)) e.push(`emoji «${deck.emoji}» no existe: usa "apple" (Mac, lo más fiel) o "fluent" (Linux, nube, HTML compartido); "auto" solo en decks heredados`);
  if (deck.piel != null && !['🏻', '🏼', '🏽', '🏾', '🏿', 'ninguno'].includes(deck.piel)) e.push(`piel «${deck.piel}» no existe (usa 🏻, 🏼, 🏽, 🏾, 🏿 o "ninguno")`);
  e.push(...validarDatos(deck.datos));
  // `libre` vale null (sin rango): se valida que la clave EXISTA, sin tomar claves del prototipo («toString»)
  if (deck.pieza != null && (typeof deck.pieza !== 'string' || !Object.hasOwn(PIEZAS, deck.pieza))) e.push(`pieza «${deck.pieza}» no existe (usa ${Object.keys(PIEZAS).join(', ')})`);
  if (deck.duracion_objetivo != null && minutosObjetivo(deck.duracion_objetivo) == null) e.push(`duracion_objetivo «${deck.duracion_objetivo}» no se entiende: minutos (45) o "mm:ss" ("0:45")`);
  if (deck.conceptos != null && (typeof deck.conceptos !== 'object' || Array.isArray(deck.conceptos) || Object.entries(deck.conceptos).some(([k, v]) => !k.trim() || typeof v !== 'string' || !v.trim() || v.length > 80))) e.push('«conceptos» debe ser un objeto emoji → concepto corto (1-80 caracteres)');
  if (deck.persona != null && !['tu', 'ustedes'].includes(deck.persona)) e.push('«persona» debe ser tu o ustedes');
  if (deck.persona_excepciones != null && (!Array.isArray(deck.persona_excepciones) || deck.persona_excepciones.some(t => typeof t !== 'string' || !t.trim()))) e.push('«persona_excepciones» debe ser una lista de frases no vacías (VOZ-HUMANA.md)');
  if (deck.sala != null && typeof deck.sala !== 'boolean' && !(typeof deck.sala === 'object' && !Array.isArray(deck.sala) && Object.keys(deck.sala).length === 1 && Number.isFinite(deck.sala.distancia_m) && deck.sala.distancia_m > 0)) e.push('«sala» debe ser true, false o { distancia_m: número positivo }');
  if (deck.en_vivo != null && typeof deck.en_vivo !== 'boolean') e.push('«en_vivo» es true o false');
  if (deck.garantia != null && typeof deck.garantia !== 'boolean') e.push('garantia debe ser true o false');
  if (deck.clase != null && typeof deck.clase !== 'boolean') e.push('«clase» es true o false (un tutorial que es clase express o taller)');
  deck.laminas.forEach((l, i) => {
    const n = `lámina ${i + 1}${l && l.id ? ` (${l.id})` : ''}`;
    if (!l || typeof l !== 'object' || Array.isArray(l)) { e.push(`${n}: no es un objeto`); return; }
    if (!tipos.includes(l.tipo)) { e.push(`${n}: tipo «${l.tipo}» no existe. Tipos: ${tipos.join(', ')}`); return; }
    e.push(...validarSuperficies(l,deck.formato || '16:9',n));
    for (const req of REQUERIDOS[l.tipo] || []) {
      if (l.tipo === 'boton' && l.variante === 'invitacion') continue;
      const alt = req.split('|');
      // un texto vacío o solo espacios cuenta como ausente (una `idea` con texto "" salía en blanco)
      if (!alt.some(k => l[k] != null && !(Array.isArray(l[k]) && !l[k].length) && !(typeof l[k] === 'string' && !l[k].trim()))) e.push(`${n} [${l.tipo}]: falta ${alt.join(' o ')}`);
    }
    for (const k of LISTAS) if (l[k] != null && !Array.isArray(l[k]) && !(k === 'columnas' && typeof l[k] === 'number')) e.push(`${n}: «${k}» debe ser una lista […]`);
    if (l.tipo === 'reparto' && l.total != null && typeof l.total !== 'object') e.push(`${n}: «total» debe ser un objeto { "datos": [...] }`);
    if (l.tipo === 'foco' && i === 0) e.push(`${n}: «foco» atenúa la lámina anterior, no puede ir primero`);
    if (l.tipo === 'foco' && i > 0 && deck.laminas[i - 1] && deck.laminas[i - 1].tipo === 'foco') e.push(`${n}: foco tras foco; el fondo sería la frase del foco anterior. Pon una lámina normal entre los dos`);
    for (const campo of ['accion', 'si_falla']) if (l[campo] != null && !(typeof l[campo] === 'string' || (Array.isArray(l[campo]) && l[campo].every(x => typeof x === 'string')))) e.push(`${n}: «${campo}» debe ser texto o una lista de textos alineada a los pasos`);
    if (l.letras != null && (!Array.isArray(l.letras) || !l.letras.length || l.letras.some(x => typeof x !== 'string' || !/^[\p{L}\p{N}]{1,3}$/u.test(x)))) e.push(`${n}: letras debe contener letras o siglas de 1-3 caracteres`);
    if (l.qr != null) {
      const error = validarQr(l.qr);
      if (error) e.push(`${n}: ${error}`);
      if (!['idea', 'lista', 'boton'].includes(l.tipo)) e.push(`${n}: qr solo existe en idea, lista o boton`);
    }
    if (l.dur != null && !(typeof l.dur === 'number' || Array.isArray(l.dur))) e.push(`${n}: «dur» debe ser número o lista de números`);
    // Cada elemento de cada lista: un null o un tipo raro tumbaba el render sin decir dónde
    for (const k of LISTAS) {
      if (!Array.isArray(l[k])) continue;
      const regla = ELEMENTOS[`${l.tipo}.${k}`];
      l[k].forEach((x, j) => {
        const donde = `${n} (${l.tipo}): ${k}[${j}]`;
        if (x == null) { e.push(`${donde} es null`); return; }
        if (!regla) return;
        if (typeof x === 'string' || typeof x === 'number') { if (!regla.texto) e.push(`${donde} debe ser un objeto { ${regla.claves.join(', ')} }`); else if (vacio(String(x))) e.push(`${donde} está vacío`); return; }
        if (Array.isArray(x)) { if (!regla.lista) e.push(`${donde} debe ser un objeto { ${regla.claves.join(', ')} }, no una lista`); return; }
        if (typeof x !== 'object') { e.push(`${donde} debe ser un objeto`); return; }
        if (!regla.claves.some(c => !vacio(x[c]))) e.push(`${donde} está vacío: le falta ${regla.claves.join(' o ')}`);
      });
    }
    // El par antes/después [10:55] es solo de `idea`; en los demás diseños un emoji es uno
    if (Array.isArray(l.emoji) && (l.tipo !== 'idea' || !l.emoji.length || l.emoji.some(x => typeof x !== 'string'))) {
      e.push(l.tipo !== 'idea' ? `${n} (${l.tipo}): «emoji» como lista solo existe en idea (par antes/después); aquí va un solo emoji` : `${n}: «emoji» como lista lleva 1 o 2 emojis de texto`);
    }
    // Un post escrito debe decir qué es: real con permiso (`fuente`) o maqueta (`ejemplo: true`). Nunca un
    // testimonio armado que se lea como real (regla 9)
    if (l.tipo === 'prueba' && Array.isArray(l.capturas)) l.capturas.forEach((c, j) => {
      if (!c || typeof c !== 'object' || !c.post) return;
      const conFuente = typeof c.fuente === 'string' && c.fuente.trim(), ejemplo = c.ejemplo === true;
      if (!conFuente && !ejemplo) e.push(`${n} (prueba): capturas[${j}] es un post sin «fuente» ni «ejemplo»: pon "fuente": "real, con permiso" si es real, o "ejemplo": true si es maqueta (o usa { "hueco": "La tuya va aquí" })`);
      else if (conFuente && ejemplo) e.push(`${n} (prueba): capturas[${j}] trae «fuente» y «ejemplo» a la vez: un post es real o es maqueta`);
    });
    if (l.tipo === 'prueba' && Array.isArray(l.capturas)) l.capturas.forEach((c, j) => {
      if (c && typeof c === 'object' && c.plantilla != null && (c.plantilla !== true || !c.hueco)) e.push(`${n} (prueba): capturas[${j}].plantilla es true y va con «hueco» (el lugar para la captura del espectador)`);
    });
    if (['foto', 'anfitrion'].includes(l.tipo) && l.imagen != null && typeof l.imagen !== 'string') e.push(`${n} (${l.tipo}): «imagen» debe ser una ruta PNG/JPG local`);
    if (l.tipo === 'anfitrion' && typeof l.imagen === 'string' && !/\.png(?:\?.*)?$|^data:image\/png;/i.test(l.imagen)) e.push(`${n} (anfitrion): usa un PNG recortado con transparencia, aportado por el usuario`);
    if (l.tipo === 'anfitrion' && l.procedencia === 'ia') e.push(`${n} (anfitrion): el retrato debe ser real y aportado por el usuario; no uses una persona generada con IA`);
    if (l.tipo === 'prueba' && l.variante === 'pantallas' && (!Array.isArray(l.capturas) || l.capturas.length > 3 || l.capturas.some(c => !c?.src))) e.push(`${n} (prueba): «pantallas» requiere entre 1 y 3 capturas con src`);
    if (l.tipo === 'tarjetas' && l.variante === 'logos' && (!Array.isArray(l.items) || l.items.length < 3 || l.items.length > 5 || l.items.some(it => !it?.imagen || it.emoji) || (l.columnas === 2 && l.items.length !== 4))) e.push(`${n} (tarjetas): «logos» requiere de 3 a 5 imágenes sin emoji, o 4 imágenes con columnas: 2`);
    if (l.tipo === 'objeto' && l.reloj != null && !(typeof l.reloj === 'string' && /^\d{1,2}:\d{2}$/.test(l.reloj))) e.push(`${n} (objeto): «reloj» va como "MM:SS" o "H:MM" ("10:00", "33:00")`);
    if (l.tipo === 'llamada' && l.otros != null) {
      const ok = typeof l.otros === 'string' || (Array.isArray(l.otros) && l.otros.every(o => typeof o === 'string' || (o && typeof o === 'object' && !Array.isArray(o))));
      if (!ok) e.push(`${n} (llamada): «otros» es un texto («Tu mentor») o una lista [{ "rotulo", "activo", "rotulo_pos" }]`);
      else if (Array.isArray(l.otros) && l.otros.length > 3) e.push(`${n} (llamada): ${l.otros.length} personas en la llamada; van 3 como máximo`);
    }
    if (l.tipo === 'flujo') revisarFlujo(l, n, e);
    if (l.tipo === 'bifurcacion' && l.origen != null && (typeof l.origen !== 'object' || Array.isArray(l.origen))) e.push(`${n}: «origen» debe ser un objeto { emoji, texto }`);
    if (l.tipo === 'calendario') revisarCalendario(l, n, e);
    revisarRangos(l, n, e);
    if (l.tipo === 'camara' && l.vivo != null && typeof l.vivo !== 'boolean') e.push(`${n} (camara): «vivo» es true o false`);
    if (l.tipo === 'camara' && l.items != null && !(Array.isArray(l.items) && l.items.every(x => typeof x === 'string' || (x && typeof x === 'object' && typeof x.texto === 'string')))) e.push(`${n} (camara): «items» es una lista de textos (los pasos de la consigna)`);
    revisarEmojis(l, n, e, []);
  });
  return e;
}

// ---------- saneamiento ----------
const TONOS = new Set(['v', 'r', 'n', 'g', 'a', 'k', 'o', 'b', 'verde', 'gris', 'rojo', 'azul', 'naranja']);
const COLORES = new Set(['amarillo', 'azul', 'verde', 'rojo']);
// color de una pieza del stack a sangre (tarjeta de producto) [42:30]
const COLORES_STACK = new Set(['morado', 'marino', 'naranja', 'verde', 'azul', 'negro']);
const ENUMS = {
  velo: ['blanco', 'banda'], escala: ['proporcional'], marco: ['celular'], mensajes_pos: ['izq','centro','der'],
  procedencia: ['real', 'ia', 'ejemplo'], excepcion_persona: ['titulo-formula', 'cita', 'a-si-mismo', 'a-la-ia', 'uno-a-uno'],
  cursor: ['mano', 'flecha'], flecha: ['recta', 'arco', 'arco-negro', 'ninguna'], estilo: ['recta', 'arco', 'arco-negro'],
  encabezado_pos: ['arriba', 'entre'], encabezado_estilo: ['rotulo', 'frase'], anclar: ['arriba', 'centro'], fondo: ['violeta', 'azul', 'negro'],
  lado: ['izquierda', 'derecha', 'arriba', 'abajo'], signo: ['+', '=', '−', '×'], entra: ['izquierda', 'derecha', 'arriba', 'abajo'], grafica: ['lineas', 'barras', 'crecimiento'], de: ['yo', 'otro', 'prompt', 'respuesta'],
  revelar: ['columna','rafaga','todo', 'columnas', 'celdas', 'filas', 'ramas', 'series', 'barras', 'pasos'],
  sello_pos: ['centro', 'arriba', 'abajo', 'izquierda', 'derecha', 'arriba-izquierda', 'arriba-derecha', 'abajo-izquierda', 'abajo-derecha'],
  posicion: ['arriba', 'abajo'], alinear: ['izquierda', 'centro'], texto_pos: ['arriba', 'abajo'], rotulo_pos: ['arriba', 'abajo'],
  forma: ['recta', 'exponencial', 'curva', 'plana', 's', 'baja'],
};
const TAM_TEXTO = new Set(['compacto', 'chico', 'medio', 'grande', 'enorme']);
// Campos numéricos con su rango [mín, máx, entero]
const NUMEROS = {
  apagar: [0,1,1], semana: [1,6,1], semanas: [1,6,1], inicio: [1,31,1], separacion: [0, 1200], alto: [20, 1800], ancho: [100, 1900], aspecto: [0.2, 5], columnas: [1, 40, 1], vacias: [0, 8, 1],
  total: [1, 1200, 1], radio: [60, 520], radio_interior: [0, 480], personas: [0, 60, 1], adentro: [0, 5, 1],
  opacidad: [0, 1], ancho_etiqueta: [0.05, 0.5], elegida: [0, 20, 1], activo: [0, 20, 1], clic: [0, 20, 1], n: [1, 12, 1],
  fase_activa: [0, 20, 1], desde: [0, 1e9], hasta: [0, 1e9], dia: [1, 400, 1], pos: [0, 1], emoji_tam: [16, 700],
  apagar_emoji: [0, 1, 1], peso: [300, 900, 1], paso_ref: [-1, 200, 1], max: [1, 10, 1], estrellas: [0, 10, 1],
  avatar_tam: [80, 160, 1], ms_ref: [0, 20000, 1], cantidad: [1, 20, 1],
};
// Rangos que dependen del diseño: `n` son pasos (≤ 12) en `pasos` y días (≤ 42, seis semanas) en `calendario`
const NUMEROS_TIPO = { calendario: { n: [1, 42, 1] }, stack: { alto: [1, 2, 1] }, meses: { n: [1, 3, 1] }, rejilla: { desde: [0, 1199, 1], hasta: [0, 1199, 1], encerrar: [0, 1199, 1] } };
const num = (v, [a, b, ent], recorte) => {
  const x = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof x !== 'number' || !Number.isFinite(x)) return undefined;
  const y = Math.min(b, Math.max(a, x));
  if (y !== x && recorte) recorte(y);
  return ent ? Math.round(y) : y;
};
const px = v => {
  const m = typeof v === 'number' ? v : typeof v === 'string' && /^\s*\d{1,3}(\.\d+)?\s*(px)?\s*$/.test(v) ? parseFloat(v) : NaN;
  return Number.isFinite(m) && m >= 12 && m <= 400 ? `${m}px` : undefined;
};
const cuadro = v => (Array.isArray(v) && v.length >= 4 && v.slice(0, 4).every(x => Number.isFinite(Number(x))) ? v.slice(0, 4).map(Number) : undefined);

function sanearObjeto(o, ruta, avisos, tipo) {
  if (Array.isArray(o)) return o.map((x, i) => sanearObjeto(x, `${ruta}[${i}]`, avisos, tipo));
  if (typeof o === 'string' && /\.(emoji|iconos)\[\d+\]$/.test(ruta) && /^(?:(?:no|si):)?trazo:/.test(o)) {
    if (!analizarCompuesto(o).error) return o;
    avisos.push(`${ruta}: trazo inválido; usa triangulo, circulo o marco con un rótulo corto`);
    return '';
  }
  if (!o || typeof o !== 'object') return o;
  const r = {};
  for (const [k, v] of Object.entries(o)) {
    const aviso = () => avisos.push(`${ruta}.${k}: valor «${String(JSON.stringify(v)).slice(0, 40)}» no válido, se ignoró`);
    if (typeof v === 'string' && specsDeCampo(k, v).some(sp => /^(?:(?:no|si):)?trazo:/.test(sp)) && analizarCompuesto(v).error) { aviso(); continue; }
    // un número fuera de rango se recorta, pero nunca en silencio (un calendario de 28 días salía con 12)
    const recorte = rango => y => avisos.push(`${ruta}.${k}: ${v} → ${ent(rango, y)}, fuera de rango (${rango[0]}-${rango[1]})`);
    const ent = (rango, y) => (rango[2] ? Math.round(y) : y);
    if (['de','a'].includes(k) && ruta.includes('flechas') && tipo !== 'flujo') { if (typeof v === 'string' && /^[\p{L}\p{N}_-]{1,40}$/u.test(v)) r[k] = v; else aviso(); continue; }
    if (k === 'variante') { if ((tipo === 'prueba' && v === 'pantallas') || (tipo === 'tarjetas' && v === 'logos') || (tipo === 'chat' && v === 'muro') || (tipo === 'boton' && v === 'invitacion')) r[k] = v; else aviso(); continue; }
    if (k === 'lado' && tipo === 'anfitrion' && !ruta.includes('anotaciones')) { if (['izq', 'der'].includes(v)) r[k] = v; else aviso(); continue; }
    if (k === 'logos') { if (Array.isArray(v) && v.every(x => typeof x === 'string' && (tipo === 'pasos' || x.trim()))) r[k] = [...v]; else aviso(); continue; }
    if (['imagen', 'src', 'fuente'].includes(k) && !ruta.includes('post')) { if (typeof v === 'string') r[k] = v; else aviso(); continue; }
    if (k === 'letras') { if (Array.isArray(v) && v.every(x => typeof x === 'string' && /^[\p{L}\p{N}]{1,3}$/u.test(x))) r[k] = [...v]; else aviso(); continue; }
    if (k === 'qr') { if (validarQr(v)) aviso(); else r[k] = { url: new URL(v.url).href, ...(v.rotulo ? { rotulo: v.rotulo } : {}) }; continue; }
    if (k.endsWith('_paso') || k === 'paso') { const x = num(v, [0, 200, 1], recorte([0, 200, 1])); if (x === undefined) aviso(); else r[k] = x; continue; }
    if (k === 'tam_etiqueta') { const p = px(v); if (p) r[k] = parseFloat(p); else aviso(); continue; }
    if ((tipo === 'agenda' && ['semana','dia','inicio','semanas'].includes(k) && !Array.isArray(v)) || k === 'apagar') { const rango = k === 'dia' ? [1,7,1] : NUMEROS[k]; const x = num(v,rango,recorte(rango)); if (x === undefined) aviso(); else r[k] = x; continue; }
    if (k === 'semanas' && Array.isArray(v)) { r[k] = v.map(n => num(n,[1,6,1])).filter(n => n != null); continue; }
    if (k === 'llave' && ruta.includes('anotaciones')) { if (Array.isArray(v) && v.length === 2 && v.every(x => typeof x === 'string' && /^(?:i|m|l|w)\d+$/.test(x))) r[k] = [...v]; else aviso(); continue; }
    if (['escala','marco','mensajes_pos'].includes(k)) { if (ENUMS[k].includes(v)) r[k] = v; else aviso(); continue; }
    if (k === 'vineta' && tipo === 'lista' && ruta.includes('.columnas')) { if (['check','cruz'].includes(v)) r[k] = v; else aviso(); continue; }
    if (k === 'tono' && tipo === 'agenda') { if (['azul','verde','morado'].includes(v)) r[k] = v; else aviso(); continue; }
    if (k === 'tono') {
      if (typeof v === 'string' && (TONOS.has(v) || (ruta.endsWith('medidor') && /^#[0-9a-f]{3,8}$/i.test(v)))) r[k] = v; else aviso();
      continue;
    }
    if (k === 'tono_interior' || k === 'tono_destacado') { if (TONOS.has(v)) r[k] = v; else aviso(); continue; }
    if (k === 'color') { if ((tipo === 'stack' ? COLORES_STACK : COLORES).has(v)) r[k] = v; else aviso(); continue; }
    if (ENUMS[k] && (typeof v === 'string' || ['procedencia', 'excepcion_persona'].includes(k))) { if (ENUMS[k].includes(v)) r[k] = v; else aviso(); continue; }
    if (k === 'tam_texto') { if (TAM_TEXTO.has(v)) r[k] = v; else if (px(v)) r[k] = px(v); else aviso(); continue; }
    if (k === 'tam') { const p = px(v); if (p) r[k] = p; else aviso(); continue; }
    if (k === 'emoji_tam' && typeof v === 'string') { if (['chico', 'medio', 'grande', 'heroe'].includes(v)) r[k] = v; else aviso(); continue; }
    // la persona que habla en una `llamada`: otros[i].activo es true o false
    if (k === 'activo' && typeof v === 'boolean' && ruta.includes('otros')) { r[k] = v; continue; }
    const rango = (NUMEROS_TIPO[tipo] || {})[k] || NUMEROS[k];
    if (rango && !(k === 'hasta' && (v === 'fin' || v === 'aparte')) && (v === null || typeof v !== 'object')) { const x = num(v, rango, recorte(rango)); if (x === undefined) aviso(); else r[k] = x; continue; }
    if (k === 'clic_pos') { const c = Array.isArray(v) && v.length === 2 && v.every(x => Number.isFinite(Number(x))) ? v.map(x => Math.min(1, Math.max(0, Number(x)))) : null; if (c) r[k] = c; else aviso(); continue; }
    // hora de un mensaje de chat: texto corto (se escapa al pintarlo)
    if (['grabando','vivo', 'guion', 'credibilidad', 'ejemplo'].includes(k)) { if (typeof v === 'boolean') r[k] = v; else aviso(); continue; }
    if (k === 'reloj') { if (typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v)) r[k] = v; else aviso(); continue; }
    if (k === 'hora') { if (typeof v === 'string' && v.trim() && v.length <= 24) r[k] = v; else aviso(); continue; }
    // ancla de una anotación y su posición fija (px o % del lienzo): llegan a un atributo y a CSS
    if (k === 'a' && ruta.includes('anotaciones')) { if (typeof v === 'string' && /^[\p{L}\p{N}_-]{1,40}$/u.test(v)) r[k] = v; else aviso(); continue; }
    if ((k === 'x' || k === 'y') && ruta.includes('anotaciones')) {
      if (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 4000) r[k] = v; else if (typeof v === 'string' && /^\d{1,3}(\.\d+)?%$/.test(v)) r[k] = v; else aviso();
      continue;
    }
    if (k === 'sello_sobre') { if (typeof v === 'string' && /^[\p{L}\p{N}_-]{1,40}$/u.test(v)) r[k] = v; else aviso(); continue; }
    if (k === 'circulo' && !(typeof v === 'boolean')) { const c = cuadro(v); if (c) r[k] = c; else aviso(); continue; }
    if (k === 'tachar' && Array.isArray(v)) {
      const lista = v.length && !Array.isArray(v[0]) ? [v] : v;           // [x,y,w,h] plano → [[x,y,w,h]]
      const ok = lista.map(q => { const c = cuadro(q); return c ? (typeof q[4] === 'string' && /^#[0-9a-f]{3,8}$/i.test(q[4]) ? [...c, q[4]] : c) : null; });
      if (ok.every(Boolean)) r[k] = ok; else aviso();
      continue;
    }
    if (['destacar', 'hechos'].includes(k) && Array.isArray(v)) { r[k] = v.map(x => num(x, [0, 5000, 1])).filter(x => x !== undefined); continue; }
    if (k === 'id' && v != null) { r[k] = String(v).replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 60) || 'lamina'; continue; }
    r[k] = typeof v === 'object' ? sanearObjeto(v, `${ruta}.${k}`, avisos, tipo) : v;
  }
  return r;
}

// Texto suelto → objeto, para los diseños que esperan objetos (así «items: ["hola"]» no sale vacío)
const NORMALIZAR = {
  tarjetas: { items: x => ({ texto: x }) }, chat: { mensajes: x => ({ texto: x }) }, cuadrantes: { items: x => ({ texto: x }) },
  flujo: { nodos: x => ({ etiqueta: x }) }, bifurcacion: { ramas: x => ({ texto: x }) }, 'linea-tiempo': { marcas: x => ({ texto: x }) },
  opciones: { items: x => ({ texto: x }) }, stack: { items: x => ({ texto: x }) }, calificacion: { filas: x => ({ texto: x }) },
  tabla: { filas: x => (Array.isArray(x) ? { etiqueta: x[0], celdas: x.slice(1) } : x) },
  llamada: { otros: x => ({ rotulo: x }) }, meses: { celdas: x => ({ mes: x }) },
};
function normalizar(l) {
  if (l?.tipo === 'boton' && l.variante === 'invitacion') return { ...l, llamado:l.llamado ?? false, boton:l.boton || 'Unirme' };
  const reglas = NORMALIZAR[l && l.tipo];
  if (!reglas) return l;
  const r = { ...l };
  if (l.tipo === 'llamada' && typeof r.otros === 'string') r.otros = [{ rotulo: r.otros }];
  for (const [k, f] of Object.entries(reglas)) if (Array.isArray(r[k])) r[k] = r[k].map(x => (typeof x === 'string' || typeof x === 'number' || (k === 'filas' && Array.isArray(x)) ? f(typeof x === 'number' ? String(x) : x) : x));
  return r;
}

// Avisos de uso de un diseño que no rompen el render (QA los cuenta como aviso)
export function sugerenciasDiseno(l, i, formato = '16:9') {
  const out = [], n = `lámina ${i + 1} (${l.id || l.tipo})`;
  if (l.tipo === 'stack' && Array.isArray(l.items)) {
    const sangre = ['16:9', '9:16'].includes(formato) && l.sangre !== false;
    if (sangre && l.encabezado) out.push(`${n}: el stack va a sangre y no dibuja «encabezado»; ponlo en la lámina anterior o usa "sangre": false`);
    if (!sangre && l.items.some(it => it && it.alto === 2)) out.push(`${n}: «alto: 2» solo cuenta en el stack a sangre (16:9 y 9:16); en la pila se ignora`);
    l.items.forEach((it, j) => { const t = typeof it === 'string' ? it : it && it.texto; if (palabras(t) > 5) out.push(`${n}: items[${j}] «${String(t).slice(0, 30)}» tiene ${palabras(t)} palabras: es una tarjeta de producto, no un renglón (≤ 5, un sustantivo corto)`); });
    if (l.items.length > 8) out.push(`${n}: ${l.items.length} piezas en el stack; más de 8 ya no se leen como «mira todo lo que te llevas»: agrupa`);
  }
  if (l.tipo === 'grafica' && l.grafica === 'barras' && Array.isArray(l.barras)) {
    const e = etiquetasBarras(l.barras.map(b => (b && typeof b === 'object' ? b.etiqueta : '') || ''), ['9:16', '4:5'].includes(formato));
    e.noCaben.forEach(t => out.push(`${n}: la etiqueta de barra «${t}» no cabe en su columna (${e.colW} px) ni en 2 renglones: acórtala a 1-3 palabras o usa menos barras`));
  }
  if (l.tipo === 'camara' && l.vivo === true) {
    const d = Array.isArray(l.dur) ? l.dur.reduce((a, b) => a + (Number(b) || 0), 0) : Number(l.dur) || 0;
    if (d < 30) out.push(`${n}: tramo en vivo sin "dur" o de menos de 30 s: pon los segundos de la actividad ("dur": 300 = 5 min); la cuenta regresiva sale de ahí`);
    if (!(typeof l.texto === 'string' && l.texto.trim()) && !(typeof l.nota === 'string' && l.nota.trim())) out.push(`${n}: tramo en vivo sin consigna: pon en "texto" qué hace el público («Ahora tú: tu reparto con lo que entró el mes pasado»)`);
    if (Array.isArray(l.items) && l.items.length > 5) out.push(`${n}: ${l.items.length} pasos en la consigna; se muestran 5 como máximo`);
  }
  // Una palabra de más de 24 letras (un link, una palabra pegada) no se parte y se sale por el borde del lienzo
  const largas = new Set();
  const ir = (x, k) => {
    if (k && /^(voz|id|tipo|imagen|src|logo|emoji|iconos|vineta|avatar|sobre|centro|fuente|_)/.test(k)) return;
    if (typeof x === 'string') plano(x).replace(/\[[A-ZÁÉÍÓÚÑÜ0-9 _-]+\]/g, '').split(/\s+/).filter(w => [...w].length > 24).forEach(w => largas.add(w));
    else if (Array.isArray(x)) x.forEach(y => ir(y, null));
    else if (x && typeof x === 'object') Object.entries(x).forEach(([kk, v]) => ir(v, kk));
  };
  ir(l, null);
  largas.forEach(w => out.push(`${n}: palabra de ${[...w].length} letras («${w.slice(0, 32)}…»): se parte a media palabra o se sale de su caja; acorta el link (sin https://, www ni utm) o pártela`));
  if (l.tipo === 'flujo' && formato === '9:16' && ((Array.isArray(l.retornos) && l.retornos.length) || l.aparte)) out.push(`${n}: «retornos» y «aparte» del flujo se ignoran en 9:16 (la fila va en columna): usa 16:9 o parte la idea en dos láminas`);
  // cifra: cada línea es una cuenta completa [3:15]; una línea que arranca con el operador cuelga de la anterior
  if (l.tipo === 'cifra' && Array.isArray(l.lineas)) l.lineas.forEach((x, j) => {
    const t = plano(typeof x === 'object' && x ? x.texto : x).trim();
    if (j > 0 && /^[=×x+−\-÷*](\s|$)/u.test(t)) out.push(`${n}: lineas[${j}] «${t.slice(0, 30)}» empieza con el operador y cuelga de la línea anterior: junta la cuenta en una línea completa («1-3 mil × $25,000 = $25-75 millones»), como la referencia [3:15]`);
  });
  if (l.tipo === 'boton' && l.cursor !== 'flecha' && esMano(l.emoji)) out.push(`${n}: el botón lleva ${l.emoji}, una mano, y el cursor ya es otra mano: usa un emoji de objeto (🤖 📝 🚀 📞) como en [23:15], o "cursor": "flecha"`);
  if (l.tipo === 'meses' && Array.isArray(l.celdas) && l.celdas.length > 16) out.push(`${n}: ${l.celdas.length} celdas en la rejilla de meses; más de 16 ya no se leen: agrupa por trimestre o usa 12`);
  if (l.tipo === 'tabla' && l.converger && typeof l.converger === 'object' && !l.converger.emoji && tablaAislada(l)) out.push(`${n}: el converger aislado de la referencia lleva un 🤔 sobre la pregunta [7:30]: pon "emoji": "🤔" en «converger»`);
  if (l.tipo === 'flujo' && Array.isArray(l.nodos)) l.nodos.forEach((nd, j) => {
    if (nd && typeof nd === 'object' && nd.cantidad != null && nd.imagen) out.push(`${n}: nodos[${j}] lleva «cantidad» e «imagen»: la cantidad repite el emoji; con imagen se ignora`);
    if (nd && typeof nd === 'object' && nd.cantidad != null && !(Number.isInteger(nd.cantidad) && nd.cantidad >= 1 && nd.cantidad <= 20)) out.push(`${n}: nodos[${j}].cantidad es un entero de 1 a 20`);
  });
  if (l.tipo === 'chat' && l.sello && !l.sello_sobre) out.push(`${n}: el sello del chat queda suelto; pégalo a la burbuja culpable con "sello_sobre": "m0"…"mN" (se cuentan desde 0)`);
  return out;
}

export function sanearDeck(deck) {
  const avisos = [], sugerencias = [];
  const laminas = deck.laminas.map((l, i) => {
    sugerencias.push(...camposDesconocidos(l, i));
    if (l && typeof l === 'object') sugerencias.push(...sugerenciasDiseno(l, i, deck.formato || '16:9'));
    revisarEmojis(l, `lámina ${i + 1}`, [], sugerencias);
    if (deck.emoji == null || deck.emoji === 'auto') emojisEnSvg(l).forEach(([campo, e]) => sugerencias.push(`lámina ${i + 1} (${l.id || l.tipo}): el emoji ${e} de «${campo}» va dentro de la gráfica (SVG) y sale con la fuente del sistema: con emoji "auto", en Linux saldrá distinto; ponlo en la nota, en el nodo o en barras[].emoji (EMOJIS.md)`));
    if (l.paga != null && (typeof l.paga !== 'string' || !deck.laminas.some(x => x.id === l.paga))) sugerencias.push(`lámina ${i + 1}: paga debe apuntar al id existente del gancho; corrige «${String(l.paga)}» (ARCOS.md, siembra y pago)`);
    const base = l.paga == null || (typeof l.paga === 'string' && deck.laminas.some(x => x.id === l.paga)) ? l : Object.fromEntries(Object.entries(l).filter(([k]) => k !== 'paga'));
    return sanearObjeto(normalizar(base), `lámina ${i + 1}${l.tipo === 'medidor' ? ' medidor' : ''}`, avisos, l.tipo);
  });
  const marca = deck.marca && typeof deck.marca === 'object' ? sanearObjeto(deck.marca, 'marca', avisos) : deck.marca;
  const sala = typeof deck.sala === 'boolean' ? deck.sala : deck.sala && Number.isFinite(deck.sala.distancia_m) && deck.sala.distancia_m > 0 ? { distancia_m: deck.sala.distancia_m } : undefined;
  const persona = ['tu', 'ustedes'].includes(deck.persona) ? deck.persona : undefined;
  const persona_excepciones = Array.isArray(deck.persona_excepciones) ? deck.persona_excepciones.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim()) : [];
  if (deck.persona_excepciones != null && (!Array.isArray(deck.persona_excepciones) || persona_excepciones.length !== deck.persona_excepciones.length)) avisos.push('persona_excepciones: conserva solo frases de texto no vacías (VOZ-HUMANA.md)');
  const conceptos = deck.conceptos && typeof deck.conceptos === 'object' && !Array.isArray(deck.conceptos) ? Object.fromEntries(Object.entries(deck.conceptos).filter(([k, v]) => k.trim() && typeof v === 'string' && v.trim() && v.length <= 80)) : undefined;
  const avisos_aceptados = deck.avisos_aceptados == null ? undefined : sanearAceptaciones(deck.avisos_aceptados,avisos);
  const garantia = typeof deck.garantia === 'boolean' ? deck.garantia : undefined;
  return { deck: { ...deck, ...(deck.avisos_aceptados != null ? {avisos_aceptados} : {}), ...(deck.garantia != null ? {garantia} : {}), ...(deck.persona_excepciones != null ? { persona_excepciones } : {}), ...(deck.conceptos != null ? { conceptos } : {}), ...(deck.sala != null ? { sala } : {}), ...(deck.persona != null ? { persona } : {}), marca, laminas }, avisos, sugerencias };
}
