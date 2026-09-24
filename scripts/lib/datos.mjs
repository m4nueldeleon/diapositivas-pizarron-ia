// datos.mjs — datos del deck que se llenan UNA vez y se repiten en varias láminas.
//
//   "datos": { "PRECIO": "$4,997", "WHATSAPP": "33 1234 5678" }
//   "texto": "Hoy: __{{PRECIO}}__"            → «Hoy: __$4,997__»
//
// Un {{CLAVE}} sin valor se vuelve «[CLAVE]»: marcar() lo pinta como hueco amarillo y qa.mjs lo cuenta
// como dato pendiente (un error por dato, con sus láminas). Así nunca se inventa una cifra para rellenar.
// No muta el deck original: devuelve una copia.

export const RE_CLAVE = /\{\{\s*([A-ZÁÉÍÓÚÑÜ0-9_][A-ZÁÉÍÓÚÑÜ0-9 _-]{0,30}?)\s*\}\}/g;
const CLAVE_VALIDA = /^[A-ZÁÉÍÓÚÑÜ0-9_][A-ZÁÉÍÓÚÑÜ0-9 _-]{0,30}$/;
// Campos que no son texto visible ni voz: ahí nunca se sustituye
const INTACTOS = new Set(['tipo', 'id', 'src', 'imagen', 'logo']);

// Errores de contrato del bloque «datos» (claves en MAYÚSCULAS, valores de texto o número)
export function validarDatos(datos) {
  if (datos == null) return [];
  if (typeof datos !== 'object' || Array.isArray(datos)) return ['«datos» debe ser un objeto { "PRECIO": "$4,997", … }'];
  const e = [];
  for (const [k, v] of Object.entries(datos)) {
    if (!CLAVE_VALIDA.test(k)) e.push(`datos: la clave «${k}» va en MAYÚSCULAS (letras, números, _ o -), como {{PRECIO}}`);
    if (!(typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v)))) e.push(`datos.${k}: el valor debe ser texto o número`);
  }
  return e;
}

// Copia del deck con cada {{CLAVE}} sustituida. `faltan`: { CLAVE: [número de lámina, …] }
export function sustituirDatos(deck) {
  const datos = deck && typeof deck.datos === 'object' && deck.datos && !Array.isArray(deck.datos) ? deck.datos : {};
  const faltan = {};
  const valor = (clave, lamina) => {
    const v = datos[clave];
    if (v != null && String(v).trim() !== '') return String(v);
    if (lamina != null) (faltan[clave] = faltan[clave] || new Set()).add(lamina + 1);
    return `[${clave}]`;
  };
  const recorrer = (x, lamina, clave) => {
    if (typeof x === 'string') return INTACTOS.has(clave) ? x : x.replace(RE_CLAVE, (_, k) => valor(k, lamina));
    if (Array.isArray(x)) return x.map(y => recorrer(y, lamina, clave));
    if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, recorrer(v, lamina, k)]));
    return x;
  };
  const laminas = Array.isArray(deck.laminas) ? deck.laminas.map((l, i) => recorrer(l, i, null)) : deck.laminas;
  const titulo = typeof deck.titulo === 'string' ? recorrer(deck.titulo, null, 'titulo') : deck.titulo;
  const salida = Object.fromEntries(Object.entries(faltan).map(([k, s]) => [k, [...s]]));
  return { deck: { ...deck, titulo, laminas }, faltan: salida };
}
