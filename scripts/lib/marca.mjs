// marca.mjs — la ficha MI-MARCA.md del creador: su firma y sus palabras vetadas.
//
// Se busca en este orden y gana la PRIMERA que exista (SKILL §0.4):
//   1. la carpeta del deck            <deck>/MI-MARCA.md
//   2. la carpeta de arriba           <deck>/../MI-MARCA.md
//   3. $PIZARRON_MARCA                (ruta al archivo o a su carpeta; «no» apaga 3 y 4)
//   4. la ficha global                ~/.config/diapositivas-pizarron-ia/MI-MARCA.md  (bash scripts/setup.sh la crea)
// Así un deck nuevo sale con la firma del creador sin copiarla a mano, y QA revisa sus palabras vetadas.
//
// El formato es el de templates/MI-MARCA.md, pero el lector acepta variantes: viñeta «-» o «*», negritas
// («- **Palabras que NUNCA usas:** …»), mayúsculas y separadores «,», «·», «/» o «;». Lo que va entre paréntesis
// es una aclaración y no una palabra.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Valores de ejemplo que nunca son una firma real
export const RELLENO = /^(tu ?marca(\.com)?|@?tu_?usuario|@?tu ?arroba|tu ?dominio(\.com)?|<.*>|ejemplo|marca|nombre)$/i;

export function esFirmaRelleno(m) {
  if (!m || typeof m !== 'object' || Array.isArray(m) || m.logo) return false;
  const texto = String(m.texto || '').trim();
  return Boolean(texto && (RELLENO.test(texto) || RELLENO.test(`${texto}${m.sufijo || ''}`.replace(/\s+/g, ''))));
}

export const rutaGlobal = (env = process.env) => path.join(env.HOME || os.homedir(), '.config', 'diapositivas-pizarron-ia', 'MI-MARCA.md');

// Rutas candidatas, en orden
export function rutasMarca(dirDeck, env = process.env) {
  const out = [];
  if (dirDeck) out.push(path.join(dirDeck, 'MI-MARCA.md'), path.join(path.dirname(dirDeck), 'MI-MARCA.md'));
  const apagada = String(env.PIZARRON_MARCA || '').trim().toLowerCase() === 'no';
  if (!apagada && env.PIZARRON_MARCA) {
    const p = path.resolve(env.PIZARRON_MARCA);
    out.push(fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'MI-MARCA.md') : p);
  }
  if (!apagada) out.push(rutaGlobal(env));
  return [...new Set(out)];
}

const limpiar = v => String(v || '').replace(/[`*]/g, '').replace(/^[«"]|[»"]$/g, '').trim();
// Valor de un campo «- Etiqueta (aclaración): valor» (con o sin negritas); '' si está vacío
function campo(texto, etiqueta) {
  const re = new RegExp(`^[ \\t]*[-*]?[ \\t]*(?:\\*\\*)?[ \\t]*${etiqueta}[^:\\n]*:(?:\\*\\*)?[ \\t]*(.*)$`, 'im');
  const m = texto.match(re);
  return m ? limpiar(m[1]) : '';
}

// Palabras vetadas: una línea, con aclaraciones entre paréntesis que no cuentan
export function leerVetadas(texto) {
  const v = campo(String(texto || ''), 'Palabras que nunca usas');
  if (!v) return [];
  return v.replace(/\([^)]*\)/g, ' ').replace(/[«»"]/g, '')
    .split(/\s*[,·/;]\s*/).map(x => x.replace(/[.:;!]+\s*$/, '').replace(/\s+/g, ' ').trim())
    // una palabra o una expresión corta; una frase larga es una aclaración («anglicismos con palabra en español»)
    .filter(x => x.length > 1 && x.split(' ').length <= 3);
}

// Firma: { texto, sufijo, logo } o null si está vacía o es un valor de ejemplo
export function leerFirma(texto) {
  const t = String(texto || '');
  const firma = { texto: campo(t, 'Texto'), sufijo: campo(t, 'Sufijo'), logo: campo(t, 'Logo') };
  if (firma.logo && !/\.(png|jpe?g|webp|svg)$/i.test(firma.logo)) firma.logo = '';
  if (esFirmaRelleno(firma)) firma.texto = '';
  if (!firma.texto && !firma.logo) return null;
  return Object.fromEntries(Object.entries(firma).filter(([, v]) => v));
}

// Puente de clases: la comunidad y la próxima clase que el creador repite en cada clase. Llenan {{COMUNIDAD}} y
// {{PROXIMA_CLASE}} por omisión (datosParaDeck). Un valor de ejemplo o vacío no cuenta.
const RELLENO_DATO = /^(…|\.\.\.|-|tu comunidad|nombre|link|pendiente|por definir|cada lunes 8 pm \(ejemplo\))$/i;
export function leerPuente(texto) {
  const t = String(texto || ''), out = {};
  for (const [clave, etiqueta] of [['COMUNIDAD', 'Comunidad'], ['PROXIMA_CLASE', 'Pr[oó]xima clase']]) {
    const v = campo(t, etiqueta);
    if (v && !RELLENO_DATO.test(v)) out[clave] = v;
  }
  return out;
}

export function leerCredenciales(texto) {
  const valor = campo(String(texto || ''), 'Credenciales o pruebas con permiso');
  if (!valor || RELLENO_DATO.test(valor) || /ejemplo|<[^>]*>|\{\{|pendiente|por confirmar/i.test(valor)) return [];
  return [...new Set((valor.match(/\d[\d,.]*/g) || []).map(n => n.replace(/[,.]/g, '')))];
}

export function leerFicha(texto) {
  return { firma: leerFirma(texto), vetadas: leerVetadas(texto), datos: leerPuente(texto), credenciales: leerCredenciales(texto) };
}

// La primera ficha que exista: { ruta, local (está en la carpeta del deck), firma, vetadas } o null
export function buscarMarca(dirDeck, { env = process.env } = {}) {
  for (const ruta of rutasMarca(dirDeck, env)) {
    if (!ruta || !fs.existsSync(ruta) || !fs.statSync(ruta).isFile()) continue;
    const ficha = leerFicha(fs.readFileSync(ruta, 'utf8'));
    return { ruta, local: !!dirDeck && path.dirname(ruta) === path.resolve(dirDeck), ...ficha };
  }
  return null;
}

// La firma que se aplica a un deck que no trae «marca» (ausente, no `false`). El logo solo se copia desde la carpeta
// del deck (regla de seguridad de construir.mjs): el de una ficha global se ignora y se avisa.
// `ruta`: la ficha de la que salió la firma (solo si se aplicó); `ficha`: la ficha encontrada aunque venga sin firma (null si
// no existe ninguna), para que el aviso distinga «la ficha no existe» de «la ficha no tiene Texto».
export function firmaParaDeck(deck, dirDeck, opciones = {}) {
  const f = buscarMarca(dirDeck, opciones);
  const ficha = f ? f.ruta : null;
  if (!deck || (deck.marca !== undefined && !esFirmaRelleno(deck.marca))) return { marca: undefined, ruta: null, ficha, aviso: null };
  if (!f || !f.firma) return { marca: undefined, ruta: null, ficha, aviso: null };
  const { texto, sufijo, logo } = f.firma;
  const conLogo = logo && f.local;
  const marca = conLogo ? { logo } : texto ? { texto, ...(sufijo ? { sufijo } : {}) } : undefined;
  const aviso = logo && !f.local ? `el logo de ${f.ruta} no se copia (solo se copian imágenes de la carpeta del deck): pon el PNG en assets/ del deck y "marca": { "logo": "assets/…" }` : null;
  return { marca, ruta: marca ? f.ruta : null, ficha, aviso };
}

// {{COMUNIDAD}} y {{PROXIMA_CLASE}} desde la ficha: solo si la clave FALTA en `datos` o está declarada pendiente sin valor
// (`{ "pendiente": true }`). Un valor dado (o propuesto) no se pisa. Devuelve { deck, info } (una línea por dato tomado).
export function datosParaDeck(deck, dirDeck, opciones = {}) {
  if (!deck || typeof deck !== 'object') return { deck, info: [] };
  const f = buscarMarca(dirDeck, opciones);
  const puente = f && f.datos ? f.datos : {};
  const datos = deck.datos && typeof deck.datos === 'object' && !Array.isArray(deck.datos) ? deck.datos : {};
  const usados = JSON.stringify(deck.laminas || []);
  const llenar = Object.entries(puente).filter(([k]) => usados.includes(`{{${k}}}`) && (datos[k] === undefined
    || (datos[k] && typeof datos[k] === 'object' && datos[k].pendiente === true && (datos[k].valor == null || String(datos[k].valor).trim() === ''))));
  if (!llenar.length) return { deck, info: [] };
  const nuevos = { ...datos, ...Object.fromEntries(llenar) };
  return { deck: { ...deck, datos: nuevos }, info: llenar.map(([k, v]) => `${k} tomada de ${f.ruta} («${v}»): cópiala a "datos" si esta clase es otro día`) };
}

// Convierte la ficha de carruseles-virales-ia (otro formato) a la de esta skill: solo la cuenta y las palabras vetadas.
// No copia reglas de carrusel («Emojis: nunca en las láminas»), que chocan con este estilo.
export function convertirFichaCarrusel(texto) {
  const t = String(texto || '');
  const cuenta = (campo(t, 'Cuenta de Instagram').match(/@[\w.]+/) || [''])[0];
  const vetadas = leerVetadas(t);
  return fichaNueva({ texto: cuenta, vetadas });
}

// Texto de una ficha nueva con el formato de templates/MI-MARCA.md (lo que setup.sh escribe)
export function fichaNueva({ texto = '', sufijo = '', logo = '', vetadas = [], comunidad = '', proximaClase = '' } = {}) {
  return `# MI-MARCA — ficha global de Diapositivas Pizarrón IA

La skill la usa cuando la carpeta del deck no trae su propio MI-MARCA.md (SKILL §0.4).

## Firma (abajo a la derecha, en cada lámina)
- Texto (tu @ o tu dominio): ${texto}
- Sufijo chico (opcional): ${sufijo}
- Logo (opcional; solo se usa si esta ficha está en la carpeta del deck): ${logo}

## Puente de clases (llena {{COMUNIDAD}} y {{PROXIMA_CLASE}} por omisión en tus clases)
- Comunidad (nombre, palabra clave o link): ${comunidad}
- Próxima clase (día y hora, p. ej. cada lunes 8 pm): ${proximaClase}

## Tu voz en las láminas
- Palabras que nunca usas (en UNA línea, separadas por comas; QA las busca en cada lámina): ${vetadas.join(', ')}
`;
}

// La ficha que escribe `setup.sh --solo-ficha --firma …` (sin terminal interactiva: el Bash de Claude). Lanza un error si la
// firma es un valor de ejemplo («tumarca.com»): nunca queda un relleno como firma. `carrusel`: texto de la ficha de
// carruseles-virales-ia (solo se toman la cuenta y las vetadas; los flags mandan sobre lo importado).
export function fichaDesdeOpciones({ firma = '', sufijo = '', logo = '', vetadas = '', comunidad = '', proximaClase = '', carrusel = '' } = {}) {
  const t = String(firma).trim(), junto = `${t}${sufijo || ''}`.replace(/\s+/g, '');
  if (t && (RELLENO.test(t) || RELLENO.test(junto))) throw new Error(`«${junto}» es un valor de ejemplo: pon tu @ o tu dominio real, o deja la firma vacía`);
  const base = carrusel ? leerFicha(convertirFichaCarrusel(carrusel)) : { firma: null, vetadas: [] };
  const lista = String(vetadas || '').split(',').map(x => x.trim()).filter(Boolean);
  return fichaNueva({ texto: t || (base.firma && base.firma.texto) || '', sufijo, logo, vetadas: lista.length ? lista : base.vetadas, comunidad, proximaClase });
}
