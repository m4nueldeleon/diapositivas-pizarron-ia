// datos.mjs — datos del deck que se llenan UNA vez y se repiten en varias láminas.
//
//   "datos": { "PRECIO": "$4,997", "WHATSAPP": "33 1234 5678" }
//   "texto": "Hoy: __{{PRECIO}}__"            → «Hoy: __$4,997__»
//
// Un {{CLAVE}} sin valor se vuelve «[CLAVE]»: marcar() lo pinta como hueco amarillo y qa.mjs lo cuenta
// como dato pendiente (un error por dato, con sus láminas). Así nunca se inventa una cifra para rellenar.
//
// Sin nadie a quien preguntar (agente de fondo, el mini, un loop), un dato que no es sensible se PROPONE:
//   "datos": { "TIEMPO_LLAMADA": { "valor": "30 minutos", "propuesto": true } }
// Se pinta igual, pero sustituirDatos lo devuelve en `propuestos` y QA lo lista en qa.json → por_confirmar
// (el deck no es final hasta confirmarlo). Precio, garantía, cupos, fechas límite, descuentos, bonos,
// testimonios y resultados NUNCA se proponen: van como hueco {{CLAVE}}.
// Un hueco que se deja A PROPÓSITO (el precio lo pone quien vende, después) se DECLARA:
//   "datos": { "PRECIO": { "pendiente": true, "motivo": "lo define dirección el lunes" } }
// Se pinta igual, [PRECIO], pero sustituirDatos lo devuelve en `declarados` (no en `faltan`): QA lo cuenta como aviso y
// deja el deck en BORRADOR (tope de nota), no como error. Vale también para las claves que no se proponen.
// No muta el deck original: devuelve una copia.

export const RE_CLAVE = /\{\{\s*([A-ZÁÉÍÓÚÑÜ0-9_][A-ZÁÉÍÓÚÑÜ0-9 _-]{0,30}?)\s*\}\}/g;
const CLAVE_VALIDA = /^[A-ZÁÉÍÓÚÑÜ0-9_][A-ZÁÉÍÓÚÑÜ0-9 _-]{0,30}$/;
// Campos que no son texto visible ni voz: ahí nunca se sustituye
const INTACTOS = new Set(['tipo', 'id', 'src', 'imagen', 'logo']);
// Datos que nunca se proponen: se confirman con quien vende o quedan como hueco
export const NO_PROPONIBLE = /PRECIO|GARANT|CUPO|FECHA|L[IÍ]MITE|DESCUENTO|BONO|TESTIMONI|RESULTAD|CASO|ENTREGABLE/;
const esValor = v => (typeof v === 'string' && v.trim() !== '') || (typeof v === 'number' && Number.isFinite(v));
const esPropuesta = v => v && typeof v === 'object' && !Array.isArray(v) && v.pendiente !== true;
const esPendiente = v => v && typeof v === 'object' && !Array.isArray(v) && v.pendiente === true;

// Errores de contrato del bloque «datos» (claves en MAYÚSCULAS, valores de texto o número)
export function validarDatos(datos) {
  if (datos == null) return [];
  if (typeof datos !== 'object' || Array.isArray(datos)) return ['«datos» debe ser un objeto { "PRECIO": "$4,997", … }'];
  const e = [];
  for (const [k, v] of Object.entries(datos)) {
    if (!CLAVE_VALIDA.test(k)) e.push(`datos: la clave «${k}» va en MAYÚSCULAS (letras, números, _ o -), como {{PRECIO}}`);
    if (esPendiente(v)) {
      if (v.muestra != null && !(typeof v.muestra === 'string' && v.muestra.length <= 120)) e.push(`datos.${k}: muestra debe ser texto de hasta 120 caracteres`);
      if (!(typeof v.motivo === 'string' && v.motivo.trim())) e.push(`datos.${k}: un hueco a propósito dice por qué: { "pendiente": true, "motivo": "lo define dirección" }`);
      if (v.valor != null) e.push(`datos.${k}: lleva "valor" y "pendiente" a la vez: o el dato ya está (quita "pendiente") o falta (quita "valor")`);
    } else if (v && typeof v === 'object' && !Array.isArray(v) && v.pendiente != null && v.pendiente !== true) {
      e.push(`datos.${k}: "pendiente" es true (o quítalo)`);
    } else if (esPropuesta(v)) {
      if (!esValor(v.valor)) e.push(`datos.${k}: el objeto lleva "valor" (texto o número): { "valor": "30 minutos", "propuesto": true }`);
      if (v.propuesto != null && typeof v.propuesto !== 'boolean') e.push(`datos.${k}: "propuesto" es true o false`);
      else if (v.propuesto === true && NO_PROPONIBLE.test(k)) e.push(`datos.${k}: precio, garantía, cupos, fechas límite, descuentos, bonos, testimonios y resultados no se proponen; déjalo como {{${k}}} (hueco) hasta confirmarlo`);
    } else if (!(typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v)))) e.push(`datos.${k}: el valor debe ser texto o número (o { "valor", "propuesto": true })`);
  }
  return e;
}

// Copia del deck con cada {{CLAVE}} sustituida. `faltan` y `propuestos`: { CLAVE: [número de lámina, …] };
// `declarados`: { CLAVE: { motivo, laminas } } (huecos a propósito)
export function sustituirDatos(deck) {
  const datos = deck && typeof deck.datos === 'object' && deck.datos && !Array.isArray(deck.datos) ? deck.datos : {};
  const faltan = {}, propuestos = {}, declarados = {};
  const valor = (clave, lamina) => {
    const d = datos[clave];
    if (esPendiente(d)) {
      if (lamina != null) (declarados[clave] = declarados[clave] || { motivo: String(d.motivo || '').trim(), laminas: new Set() }).laminas.add(lamina + 1);
      return `[${clave}]`;
    }
    const propuesto = esPropuesta(d) && d.propuesto === true;
    const v = esPropuesta(d) ? d.valor : d;
    if (propuesto && lamina != null) (propuestos[clave] = propuestos[clave] || new Set()).add(lamina + 1);
    if (v != null && typeof v !== 'object' && String(v).trim() !== '') return String(v);
    if (/^LOGO_/.test(clave)) {
      if (lamina != null) (declarados[clave] = declarados[clave] || { motivo: 'falta el logo oficial de la marca', laminas: new Set() }).laminas.add(lamina + 1);
      return `[${clave}]`;
    }
    if (lamina != null) (faltan[clave] = faltan[clave] || new Set()).add(lamina + 1);
    return `[${clave}]`;
  };
  const recorrer = (x, lamina, clave) => {
    if (typeof x === 'string') return INTACTOS.has(clave) && !(clave === 'imagen' && /^\{\{\s*LOGO_[A-ZÁÉÍÓÚÑÜ0-9_ -]+\s*\}\}$/.test(x)) ? x : x.replace(RE_CLAVE, (_, k) => valor(k, lamina));
    if (Array.isArray(x)) return x.map(y => recorrer(y, lamina, clave));
    if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, recorrer(v, lamina, k)]));
    return x;
  };
  const laminas = Array.isArray(deck.laminas) ? deck.laminas.map((l, i) => recorrer(l, i, null)) : deck.laminas;
  const titulo = typeof deck.titulo === 'string' ? recorrer(deck.titulo, null, 'titulo') : deck.titulo;
  const lista = o => Object.fromEntries(Object.entries(o).map(([k, s]) => [k, [...s]]));
  const decl = Object.fromEntries(Object.entries(declarados).map(([k, d]) => [k, { motivo: d.motivo, laminas: [...d.laminas] }]));
  return { deck: { ...deck, titulo, laminas }, faltan: lista(faltan), propuestos: lista(propuestos), declarados: decl };
}
