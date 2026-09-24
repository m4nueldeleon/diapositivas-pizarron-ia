// contrato.mjs — valida y sanea deck.json antes de construir.
//
// validarDeck: errores que impiden construir (mensajes accionables).
// sanearDeck:  copia del deck donde cada campo numérico, de tono, de tamaño o de forma queda dentro de
//              una lista cerrada. Así ningún valor del deck llega crudo a un atributo HTML o a CSS, y un
//              valor raro se descarta con aviso en lugar de romper el render. Además normaliza los ítems
//              escritos como texto suelto (tarjetas, chat, cuadrantes, nodos…) y devuelve `sugerencias`:
//              avisos suaves (campo que ese diseño no usa, emoji dudoso) que QA cuenta como aviso, no error.
import { analizarCompuesto, esEmojiTexto } from './emoji.mjs';
import { palabras } from './markup.mjs';
import { validarDatos } from './datos.mjs';
import { PIEZAS, minutosObjetivo } from './tiempos.mjs';

const REQUERIDOS = {
  idea: ['texto|emoji'], lista: ['items'], flujo: ['nodos'], pasos: [], bifurcacion: ['origen', 'ramas'],
  cifra: ['lineas|valor'], cita: ['texto'], objeto: ['imagen|emoji'], tarjetas: ['items'], oscura: ['titulo|texto|imagen|emoji'],
  cuadrantes: ['items'], tabla: ['columnas', 'filas'], grafica: [], 'linea-tiempo': ['marcas'], medidor: [], opciones: [], rejilla: ['total'],
  prueba: ['capturas'], chat: ['mensajes'], reparto: ['total'], calendario: [], boton: [], circulos: [], camara: [], foco: ['texto|nota'],
  stack: ['items'], calificacion: ['filas'],
};
const LISTAS = ['items', 'nodos', 'ramas', 'columnas', 'filas', 'series', 'barras', 'marcas', 'tramos', 'partes', 'dias', 'fases',
  'anotaciones', 'capturas', 'mensajes', 'lineas', 'iconos', 'etiquetas', 'destacar', 'hechos', 'anclas', 'flechas', 'celdas'];


// Campos que lee cada diseño (además de los COMUNES). Si agregas un campo a un layout, agrégalo aquí:
// pruebas/contrato.test.mjs revisa que todo «l.campo» de layouts-*.mjs esté en esta tabla.
export const COMUNES = ['id', 'tipo', 'voz', 'dur', 'ancla', 'anclas', 'revelar', 'sello', 'sello_paso', 'sello_pos', 'sello_sobre',
  'clic', 'clic_paso', 'clic_pos', 'cursor', 'firma', 'oscura', 'fondo', 'anclar',
  // `llamado: true` marca una lámina como llamado visible (reglas-deck.mjs); `paso_ref` elige el paso que
  // comparar.mjs mide contra el cuadro del video (réplica)
  'llamado', 'paso_ref'];
export const CAMPOS = {
  idea: ['texto', 'texto_paso', 'tam_texto', 'emoji', 'emoji_tam', 'emoji_lado', 'emoji_paso', 'apagar_emoji', 'estrellas', 'encabezado', 'encabezado_pos',
    'nota', 'nota_paso', 'tachar_paso'],
  lista: ['items', 'tam_texto', 'separacion', 'vineta', 'tachar_despues', 'alinear', 'encabezado', 'nota', 'nota_paso'],
  flujo: ['nodos', 'emoji_tam', 'separacion', 'flecha', 'flechas', 'encabezado', 'texto', 'texto_paso', 'tam_texto', 'nota', 'nota_paso'],
  pasos: ['n', 'iconos', 'etiquetas', 'activo', 'hechos', 'sobre', 'prefijo', 'ruta', 'arrastre', 'separacion', 'tam_etiqueta', 'texto', 'texto_paso',
    'tam_texto', 'nota', 'nota_paso'],
  bifurcacion: ['origen', 'ramas', 'llave', 'separacion', 'tam_texto', 'emoji_tam'],
  cifra: ['lineas', 'valor', 'tam', 'arriba', 'abajo', 'fuente', 'texto', 'texto_paso', 'nota', 'nota_paso', 'tachar_paso'],
  cita: ['texto', 'tam_texto', 'emoji', 'emoji_tam', 'nota', 'nota_paso', 'tachar_paso'],
  objeto: ['imagen', 'alto', 'emoji', 'emoji_tam', 'texto', 'texto_paso', 'tam_texto', 'nota', 'nota_paso'],
  tarjetas: ['items', 'columnas', 'ancho', 'tam_texto', 'encabezado', 'nota', 'nota_paso'],
  oscura: ['imagen', 'alto', 'emoji', 'emoji_tam', 'titulo', 'texto', 'texto_paso', 'nota', 'nota_paso'],
  cuadrantes: ['items', 'columnas'],
  tabla: ['columnas', 'filas', 'vacias', 'fijas', 'esquina', 'ancho_etiqueta'],
  grafica: ['grafica', 'series', 'barras', 'banda', 'banda_paso', 'eje_x', 'eje_y', 'titulo', 'subtitulo', 'texto', 'texto_paso', 'nota', 'nota_paso'],
  'linea-tiempo': ['marcas', 'tramos', 'texto', 'texto_paso', 'nota', 'nota_paso'],
  medidor: ['valor', 'tono', 'texto', 'texto_paso', 'tam_texto', 'nota', 'nota_paso'],
  opciones: ['items', 'elegida', 'texto', 'texto_paso'],
  rejilla: ['total', 'aspecto', 'columnas', 'ancho', 'alto', 'destacar', 'emoji', 'punto', 'emoji_destacado', 'apagar_resto', 'tono',
    'tono_destacado', 'anotacion', 'anotacion_paso', 'etiqueta_destacado', 'destacado_paso', 'emoji_etiqueta', 'encabezado', 'encabezado_estilo',
    'texto', 'texto_paso'],
  prueba: ['capturas', 'encabezado', 'encabezado_estilo', 'texto', 'texto_paso'],
  chat: ['mensajes', 'encabezado', 'encabezado_estilo', 'tam_texto', 'avatar_yo', 'avatar_otro'],
  reparto: ['total', 'partes', 'separacion', 'titulo'],
  calendario: ['fases', 'fase_activa', 'color', 'dias', 'n', 'columnas', 'palabra_dia', 'anotaciones', 'titulo', 'rango'],
  boton: ['boton', 'emoji', 'texto', 'texto_paso', 'tam_texto', 'nota', 'nota_paso'],
  circulos: ['radio', 'radio_interior', 'tono', 'tono_interior', 'personas', 'emoji', 'centro', 'centro_paso', 'interior_paso', 'texto',
    'texto_paso', 'nota', 'nota_paso'],
  // `vivo: true`: tramo en vivo de una clase (actividad, demostración, preguntas) con su consigna para el público
  camara: ['nota', 'vivo', 'texto', 'items', 'emoji'],
  foco: ['texto', 'nota', 'nota_paso', 'tam', 'opacidad'],
  calificacion: ['filas', 'max', 'emoji', 'acumular', 'encabezado', 'nota', 'nota_paso'],
  stack: ['items', 'columnas', 'sangre', 'encabezado', 'remate', 'remate_paso', 'total', 'nota', 'nota_paso'],
};

// Distancia de edición (para sugerir el campo que se quiso escribir)
function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

// Campos del deck que ese diseño no usa: un error de dedo («sello_pso») o un campo de otro diseño.
export function camposDesconocidos(l, i) {
  if (!l || typeof l !== 'object' || !CAMPOS[l.tipo]) return [];
  const validos = [...COMUNES, ...CAMPOS[l.tipo]];
  return Object.keys(l).filter(k => !k.startsWith('_') && !validos.includes(k)).map(k => {
    const cerca = validos.map(v => [v, distancia(k, v)]).filter(([, d]) => d <= 3).sort((a, b) => a[1] - b[1])[0];
    return `lámina ${i + 1} (${l.id || l.tipo}): «${k}» no aplica a «${l.tipo}» y se ignora${cerca ? `; ¿quisiste decir «${cerca[0]}»?` : ''}`;
  });
}

// Qué debe llevar cada elemento de las listas. Texto suelto = se normaliza en sanearDeck.
const ELEMENTOS = {
  'lista.items': { claves: ['texto', 'emoji'], texto: true },
  'tarjetas.items': { claves: ['texto', 'emoji'], texto: true },
  'chat.mensajes': { claves: ['texto'], texto: true },   // + hora, de, avatar
  'cuadrantes.items': { claves: ['texto', 'emoji'], texto: true },
  'flujo.nodos': { claves: ['emoji', 'imagen', 'etiqueta', 'sub'], texto: true },
  'bifurcacion.ramas': { claves: ['emoji', 'valor', 'texto'], texto: true },
  'linea-tiempo.marcas': { claves: ['texto', 'arriba', 'pos', 'tono'], texto: true },
  'tabla.filas': { claves: ['etiqueta', 'celdas'], lista: true },
  'opciones.items': { claves: ['texto'], texto: true },
  'prueba.capturas': { claves: ['src', 'post', 'hueco'] },
  'calificacion.filas': { claves: ['texto', 'emoji'], texto: true },   // + estrellas
  'stack.items': { claves: ['texto', 'emoji', 'imagen'], texto: true },   // + sub, color, tono, doble, alto
};
const vacio = v => v == null || (typeof v === 'string' && !v.trim());

// Emojis: [no:|si:]base[+insignia]. Recorre la lámina entera (items, nodos, ramas, barras…).
const CLAVE_EMOJI = k => ['emoji', 'sobre', 'centro', 'avatar', 'avatar_yo', 'avatar_otro'].includes(k)
  || (k.startsWith('emoji_') && !['emoji_tam', 'emoji_lado', 'emoji_paso'].includes(k));
const PICTO = /\p{Extended_Pictographic}|\p{Emoji_Presentation}|\u20e3/u;
function revisarEmojis(o, ruta, errores, avisos) {
  if (Array.isArray(o)) return o.forEach((x, i) => revisarEmojis(x, `${ruta}[${i}]`, errores, avisos));
  if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o)) {
    const specs = CLAVE_EMOJI(k) && typeof v === 'string' ? [v] : (k === 'iconos' || (k === 'emoji' && CLAVE_EMOJI(k))) && Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
    for (const sp of specs) {
      const c = analizarCompuesto(sp);
      if (c.error) errores.push(`${ruta}.${k}: emoji «${sp}» ${c.error}`);
      else for (const parte of [c.base, c.insignia].filter(Boolean)) if (!PICTO.test(parte)) avisos.push(`${ruta}.${k}: «${parte}» no parece un emoji`);
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

export function validarDeck(deck, tipos) {
  const e = [];
  if (!deck || typeof deck !== 'object') return ['deck.json no es un objeto'];
  if (!Array.isArray(deck.laminas) || !deck.laminas.length) return ['falta «laminas» (una lista con al menos una lámina)'];
  if (deck.formato && !['16:9', '9:16', '1:1', '4:5'].includes(deck.formato)) e.push(`formato «${deck.formato}» no existe (usa 16:9, 9:16, 1:1 o 4:5)`);
  if (deck.emoji && !['auto', 'apple', 'fluent'].includes(deck.emoji)) e.push(`emoji «${deck.emoji}» no existe (usa auto, apple o fluent)`);
  e.push(...validarDatos(deck.datos));
  if (deck.pieza != null && !PIEZAS[deck.pieza]) e.push(`pieza «${deck.pieza}» no existe (usa ${Object.keys(PIEZAS).join(', ')})`);
  if (deck.duracion_objetivo != null && minutosObjetivo(deck.duracion_objetivo) == null) e.push(`duracion_objetivo «${deck.duracion_objetivo}» no se entiende: minutos (45) o "mm:ss" ("0:45")`);
  if (deck.en_vivo != null && typeof deck.en_vivo !== 'boolean') e.push('«en_vivo» es true o false');
  deck.laminas.forEach((l, i) => {
    const n = `lámina ${i + 1}${l && l.id ? ` (${l.id})` : ''}`;
    if (!l || typeof l !== 'object' || Array.isArray(l)) { e.push(`${n}: no es un objeto`); return; }
    if (!tipos.includes(l.tipo)) { e.push(`${n}: tipo «${l.tipo}» no existe. Tipos: ${tipos.join(', ')}`); return; }
    for (const req of REQUERIDOS[l.tipo] || []) {
      const alt = req.split('|');
      if (!alt.some(k => l[k] != null && !(Array.isArray(l[k]) && !l[k].length))) e.push(`${n} [${l.tipo}]: falta ${alt.join(' o ')}`);
    }
    for (const k of LISTAS) if (l[k] != null && !Array.isArray(l[k]) && !(k === 'columnas' && typeof l[k] === 'number')) e.push(`${n}: «${k}» debe ser una lista […]`);
    if (l.tipo === 'reparto' && l.total != null && typeof l.total !== 'object') e.push(`${n}: «total» debe ser un objeto { "datos": [...] }`);
    if (l.tipo === 'foco' && i === 0) e.push(`${n}: «foco» atenúa la lámina anterior, no puede ir primero`);
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
    if (l.tipo === 'bifurcacion' && l.origen != null && (typeof l.origen !== 'object' || Array.isArray(l.origen))) e.push(`${n}: «origen» debe ser un objeto { emoji, texto }`);
    if (l.tipo === 'calendario') revisarCalendario(l, n, e);
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
  cursor: ['mano', 'flecha'], flecha: ['recta', 'arco', 'arco-negro', 'ninguna'], estilo: ['recta', 'arco', 'arco-negro'],
  encabezado_pos: ['arriba', 'entre'], encabezado_estilo: ['rotulo', 'frase'], anclar: ['arriba', 'centro'], fondo: ['violeta', 'azul', 'negro'],
  lado: ['izquierda', 'derecha'], grafica: ['lineas', 'barras', 'crecimiento'], de: ['yo', 'otro'],
  revelar: ['todo', 'columnas', 'celdas', 'filas', 'ramas', 'series', 'barras', 'pasos'],
  sello_pos: ['centro', 'arriba', 'abajo', 'izquierda', 'derecha', 'arriba-izquierda', 'arriba-derecha', 'abajo-izquierda', 'abajo-derecha'],
  posicion: ['arriba', 'abajo'], alinear: ['izquierda', 'centro'],
  forma: ['recta', 'exponencial', 'curva', 'plana', 's', 'baja'],
};
const TAM_TEXTO = new Set(['compacto', 'chico', 'medio', 'grande', 'enorme']);
// Campos numéricos con su rango [mín, máx, entero]
const NUMEROS = {
  separacion: [0, 1200], alto: [20, 1800], ancho: [100, 1900], aspecto: [0.2, 5], columnas: [1, 40, 1], vacias: [0, 8, 1],
  total: [1, 1200, 1], radio: [60, 520], radio_interior: [0, 480], personas: [0, 60, 1],
  opacidad: [0, 1], ancho_etiqueta: [0.05, 0.5], elegida: [0, 20, 1], activo: [0, 20, 1], clic: [0, 20, 1], n: [1, 12, 1],
  fase_activa: [0, 20, 1], desde: [0, 1e9], hasta: [0, 1e9], dia: [1, 400, 1], pos: [0, 1], emoji_tam: [16, 700],
  apagar_emoji: [0, 1, 1], peso: [300, 900, 1], paso_ref: [-1, 200, 1], max: [1, 10, 1], estrellas: [0, 10, 1],
};
// Rangos que dependen del diseño: `n` son pasos (≤ 12) en `pasos` y días (≤ 42, seis semanas) en `calendario`
const NUMEROS_TIPO = { calendario: { n: [1, 42, 1] }, stack: { alto: [1, 2, 1] } };
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
  if (!o || typeof o !== 'object') return o;
  const r = {};
  for (const [k, v] of Object.entries(o)) {
    const aviso = () => avisos.push(`${ruta}.${k}: valor «${String(JSON.stringify(v)).slice(0, 40)}» no válido, se ignoró`);
    // un número fuera de rango se recorta, pero nunca en silencio (un calendario de 28 días salía con 12)
    const recorte = rango => y => avisos.push(`${ruta}.${k}: ${v} → ${ent(rango, y)}, fuera de rango (${rango[0]}-${rango[1]})`);
    const ent = (rango, y) => (rango[2] ? Math.round(y) : y);
    if (k.endsWith('_paso') || k === 'paso') { const x = num(v, [0, 200, 1], recorte([0, 200, 1])); if (x === undefined) aviso(); else r[k] = x; continue; }
    if (k === 'tam_etiqueta') { const p = px(v); if (p) r[k] = parseFloat(p); else aviso(); continue; }
    if (k === 'tono') {
      if (typeof v === 'string' && (TONOS.has(v) || (ruta.endsWith('medidor') && /^#[0-9a-f]{3,8}$/i.test(v)))) r[k] = v; else aviso();
      continue;
    }
    if (k === 'tono_interior' || k === 'tono_destacado') { if (TONOS.has(v)) r[k] = v; else aviso(); continue; }
    if (k === 'color') { if ((tipo === 'stack' ? COLORES_STACK : COLORES).has(v)) r[k] = v; else aviso(); continue; }
    if (ENUMS[k] && typeof v === 'string') { if (ENUMS[k].includes(v)) r[k] = v; else aviso(); continue; }
    if (k === 'tam_texto') { if (TAM_TEXTO.has(v)) r[k] = v; else if (px(v)) r[k] = px(v); else aviso(); continue; }
    if (k === 'tam') { const p = px(v); if (p) r[k] = p; else aviso(); continue; }
    if (k === 'emoji_tam' && typeof v === 'string') { if (['chico', 'medio', 'grande', 'heroe'].includes(v)) r[k] = v; else aviso(); continue; }
    const rango = (NUMEROS_TIPO[tipo] || {})[k] || NUMEROS[k];
    if (rango && !(k === 'hasta' && v === 'fin') && (v === null || typeof v !== 'object')) { const x = num(v, rango, recorte(rango)); if (x === undefined) aviso(); else r[k] = x; continue; }
    if (k === 'clic_pos') { const c = Array.isArray(v) && v.length === 2 && v.every(x => Number.isFinite(Number(x))) ? v.map(x => Math.min(1, Math.max(0, Number(x)))) : null; if (c) r[k] = c; else aviso(); continue; }
    // hora de un mensaje de chat: texto corto (se escapa al pintarlo)
    if (k === 'vivo') { if (typeof v === 'boolean') r[k] = v; else aviso(); continue; }
    if (k === 'hora') { if (typeof v === 'string' && v.trim() && v.length <= 24) r[k] = v; else aviso(); continue; }
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
};
function normalizar(l) {
  const reglas = NORMALIZAR[l && l.tipo];
  if (!reglas) return l;
  const r = { ...l };
  for (const [k, f] of Object.entries(reglas)) if (Array.isArray(r[k])) r[k] = r[k].map(x => (typeof x === 'string' || typeof x === 'number' || (k === 'filas' && Array.isArray(x)) ? f(typeof x === 'number' ? String(x) : x) : x));
  return r;
}

// Avisos de uso de un diseño que no rompen el render (QA los cuenta como aviso)
export function sugerenciasDiseno(l, i, formato = '16:9') {
  const out = [], n = `lámina ${i + 1} (${l.id || l.tipo})`;
  if (l.tipo === 'stack' && Array.isArray(l.items)) {
    const sangre = formato === '16:9' && l.sangre !== false;
    if (sangre && l.encabezado) out.push(`${n}: el stack va a sangre y no dibuja «encabezado»; ponlo en la lámina anterior o usa "sangre": false`);
    l.items.forEach((it, j) => { const t = typeof it === 'string' ? it : it && it.texto; if (palabras(t) > 5) out.push(`${n}: items[${j}] «${String(t).slice(0, 30)}» tiene ${palabras(t)} palabras: es una tarjeta de producto, no un renglón (≤ 5, un sustantivo corto)`); });
    if (l.items.length > 8) out.push(`${n}: ${l.items.length} piezas en el stack; más de 8 ya no se leen como «mira todo lo que te llevas»: agrupa`);
  }
  if (l.tipo === 'camara' && l.vivo === true) {
    const d = Array.isArray(l.dur) ? l.dur.reduce((a, b) => a + (Number(b) || 0), 0) : Number(l.dur) || 0;
    if (d < 30) out.push(`${n}: tramo en vivo sin "dur" o de menos de 30 s: pon los segundos de la actividad ("dur": 300 = 5 min); la cuenta regresiva sale de ahí`);
    if (!(typeof l.texto === 'string' && l.texto.trim()) && !(typeof l.nota === 'string' && l.nota.trim())) out.push(`${n}: tramo en vivo sin consigna: pon en "texto" qué hace el público («Ahora tú: tu reparto con lo que entró el mes pasado»)`);
    if (Array.isArray(l.items) && l.items.length > 5) out.push(`${n}: ${l.items.length} pasos en la consigna; se muestran 5 como máximo`);
  }
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
    return sanearObjeto(normalizar(l), `lámina ${i + 1}${l.tipo === 'medidor' ? ' medidor' : ''}`, avisos, l.tipo);
  });
  const marca = deck.marca && typeof deck.marca === 'object' ? sanearObjeto(deck.marca, 'marca', avisos) : deck.marca;
  return { deck: { ...deck, marca, laminas }, avisos, sugerencias };
}
