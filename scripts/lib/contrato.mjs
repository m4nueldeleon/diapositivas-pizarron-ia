// contrato.mjs — valida y sanea deck.json antes de construir.
//
// validarDeck: errores que impiden construir (mensajes accionables).
// sanearDeck:  copia del deck donde cada campo numérico, de tono, de tamaño o de forma queda dentro de
//              una lista cerrada. Así ningún valor del deck llega crudo a un atributo HTML o a CSS, y un
//              valor raro se descarta con aviso en lugar de romper el render.
const REQUERIDOS = {
  idea: ['texto|emoji'], lista: ['items'], flujo: ['nodos'], pasos: [], bifurcacion: ['origen', 'ramas'],
  cifra: ['lineas|valor'], cita: ['texto'], objeto: ['imagen|emoji'], tarjetas: ['items'], oscura: ['titulo|texto|imagen|emoji'],
  cuadrantes: ['items'], tabla: ['columnas', 'filas'], grafica: [], 'linea-tiempo': ['marcas'], medidor: [], opciones: [], rejilla: ['total'],
  prueba: ['capturas'], chat: ['mensajes'], reparto: ['total'], calendario: [], boton: [], circulos: [], camara: [], foco: ['texto|nota'],
};
const LISTAS = ['items', 'nodos', 'ramas', 'columnas', 'filas', 'series', 'barras', 'marcas', 'tramos', 'partes', 'dias', 'fases',
  'anotaciones', 'capturas', 'mensajes', 'lineas', 'iconos', 'etiquetas', 'destacar', 'hechos', 'anclas', 'flechas', 'celdas'];

export function validarDeck(deck, tipos) {
  const e = [];
  if (!deck || typeof deck !== 'object') return ['deck.json no es un objeto'];
  if (!Array.isArray(deck.laminas) || !deck.laminas.length) return ['falta «laminas» (una lista con al menos una lámina)'];
  if (deck.formato && !['16:9', '9:16', '1:1', '4:5'].includes(deck.formato)) e.push(`formato «${deck.formato}» no existe (usa 16:9, 9:16, 1:1 o 4:5)`);
  if (deck.emoji && !['auto', 'apple', 'fluent'].includes(deck.emoji)) e.push(`emoji «${deck.emoji}» no existe (usa auto, apple o fluent)`);
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
  });
  return e;
}

// ---------- saneamiento ----------
const TONOS = new Set(['v', 'r', 'n', 'g', 'a', 'k', 'b', 'verde', 'gris', 'rojo', 'azul', 'naranja']);
const COLORES = new Set(['amarillo', 'azul', 'verde', 'rojo']);
const ENUMS = {
  cursor: ['mano', 'flecha'], flecha: ['recta', 'arco', 'arco-negro'], estilo: ['recta', 'arco', 'arco-negro'],
  lado: ['izquierda', 'derecha'], grafica: ['lineas', 'barras', 'crecimiento'], de: ['yo', 'otro'],
  revelar: ['todo', 'columnas', 'celdas', 'filas', 'ramas', 'series', 'barras'],
  forma: ['recta', 'exponencial', 'curva', 'plana', 's', 'baja'],
};
const TAM_TEXTO = new Set(['chico', 'medio', 'grande', 'enorme']);
// Campos numéricos con su rango [mín, máx, entero]
const NUMEROS = {
  separacion: [0, 1200], alto: [20, 1800], ancho: [100, 1900], aspecto: [0.2, 5], columnas: [1, 40, 1], vacias: [0, 8, 1],
  total: [1, 1200, 1], radio: [60, 520], radio_interior: [0, 480], personas: [0, 60, 1],
  opacidad: [0, 1], ancho_etiqueta: [0.05, 0.5], elegida: [0, 20, 1], activo: [0, 20, 1], clic: [0, 20, 1], n: [1, 12, 1],
  fase_activa: [0, 20, 1], desde: [0, 1e9], hasta: [0, 1e9], dia: [1, 400, 1], pos: [0, 1], emoji_tam: [16, 700],
};
const num = (v, [a, b, ent]) => {
  const x = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof x !== 'number' || !Number.isFinite(x)) return undefined;
  const y = Math.min(b, Math.max(a, x));
  return ent ? Math.round(y) : y;
};
const px = v => {
  const m = typeof v === 'number' ? v : typeof v === 'string' && /^\s*\d{1,3}(\.\d+)?\s*(px)?\s*$/.test(v) ? parseFloat(v) : NaN;
  return Number.isFinite(m) && m >= 12 && m <= 400 ? `${m}px` : undefined;
};
const cuadro = v => (Array.isArray(v) && v.length >= 4 && v.slice(0, 4).every(x => Number.isFinite(Number(x))) ? v.slice(0, 4).map(Number) : undefined);

function sanearObjeto(o, ruta, avisos) {
  if (Array.isArray(o)) return o.map((x, i) => sanearObjeto(x, `${ruta}[${i}]`, avisos));
  if (!o || typeof o !== 'object') return o;
  const r = {};
  for (const [k, v] of Object.entries(o)) {
    const aviso = () => avisos.push(`${ruta}.${k}: valor «${String(JSON.stringify(v)).slice(0, 40)}» no válido, se ignoró`);
    if (k.endsWith('_paso') || k === 'paso') { const x = num(v, [0, 200, 1]); if (x === undefined) aviso(); else r[k] = x; continue; }
    if (k === 'tono') {
      if (typeof v === 'string' && (TONOS.has(v) || (ruta.endsWith('medidor') && /^#[0-9a-f]{3,8}$/i.test(v)))) r[k] = v; else aviso();
      continue;
    }
    if (k === 'tono_interior' || k === 'tono_destacado') { if (TONOS.has(v)) r[k] = v; else aviso(); continue; }
    if (k === 'color') { if (COLORES.has(v)) r[k] = v; else aviso(); continue; }
    if (ENUMS[k] && typeof v === 'string') { if (ENUMS[k].includes(v)) r[k] = v; else aviso(); continue; }
    if (k === 'tam_texto') { if (TAM_TEXTO.has(v)) r[k] = v; else if (px(v)) r[k] = px(v); else aviso(); continue; }
    if (k === 'tam') { const p = px(v); if (p) r[k] = p; else aviso(); continue; }
    if (k === 'emoji_tam' && typeof v === 'string') { if (['chico', 'medio', 'grande', 'heroe'].includes(v)) r[k] = v; else aviso(); continue; }
    if (NUMEROS[k] && !(k === 'hasta' && v === 'fin') && (v === null || typeof v !== 'object')) { const x = num(v, NUMEROS[k]); if (x === undefined) aviso(); else r[k] = x; continue; }
    if (k === 'circulo' && !(typeof v === 'boolean')) { const c = cuadro(v); if (c) r[k] = c; else aviso(); continue; }
    if (k === 'tachar' && Array.isArray(v)) {
      const lista = v.length && !Array.isArray(v[0]) ? [v] : v;           // [x,y,w,h] plano → [[x,y,w,h]]
      const ok = lista.map(q => { const c = cuadro(q); return c ? (typeof q[4] === 'string' && /^#[0-9a-f]{3,8}$/i.test(q[4]) ? [...c, q[4]] : c) : null; });
      if (ok.every(Boolean)) r[k] = ok; else aviso();
      continue;
    }
    if (['destacar', 'hechos'].includes(k) && Array.isArray(v)) { r[k] = v.map(x => num(x, [0, 5000, 1])).filter(x => x !== undefined); continue; }
    if (k === 'id' && v != null) { r[k] = String(v).replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 60) || 'lamina'; continue; }
    r[k] = typeof v === 'object' ? sanearObjeto(v, `${ruta}.${k}`, avisos) : v;
  }
  return r;
}

export function sanearDeck(deck) {
  const avisos = [];
  const laminas = deck.laminas.map((l, i) => sanearObjeto(l, `lámina ${i + 1}${l.tipo === 'medidor' ? ' medidor' : ''}`, avisos));
  return { deck: { ...deck, laminas }, avisos };
}
