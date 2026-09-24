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
  if (firma.texto && (RELLENO.test(firma.texto) || RELLENO.test(`${firma.texto}${firma.sufijo}`.replace(/\s+/g, '')))) firma.texto = '';
  if (!firma.texto && !firma.logo) return null;
  return Object.fromEntries(Object.entries(firma).filter(([, v]) => v));
}

export function leerFicha(texto) {
  return { firma: leerFirma(texto), vetadas: leerVetadas(texto) };
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
export function firmaParaDeck(deck, dirDeck, opciones = {}) {
  if (!deck || deck.marca !== undefined) return { marca: undefined, ruta: null, aviso: null };
  const f = buscarMarca(dirDeck, opciones);
  if (!f || !f.firma) return { marca: undefined, ruta: f ? f.ruta : null, aviso: null };
  const { texto, sufijo, logo } = f.firma;
  const conLogo = logo && f.local;
  const marca = conLogo ? { logo } : texto ? { texto, ...(sufijo ? { sufijo } : {}) } : undefined;
  const aviso = logo && !f.local ? `el logo de ${f.ruta} no se copia (solo se copian imágenes de la carpeta del deck): pon el PNG en assets/ del deck y "marca": { "logo": "assets/…" }` : null;
  return { marca, ruta: marca ? f.ruta : null, aviso };
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
export function fichaNueva({ texto = '', sufijo = '', logo = '', vetadas = [] } = {}) {
  return `# MI-MARCA — ficha global de Diapositivas Pizarrón IA

La skill la usa cuando la carpeta del deck no trae su propio MI-MARCA.md (SKILL §0.4).

## Firma (abajo a la derecha, en cada lámina)
- Texto (tu @ o tu dominio): ${texto}
- Sufijo chico (opcional): ${sufijo}
- Logo (opcional; solo se usa si esta ficha está en la carpeta del deck): ${logo}

## Tu voz en las láminas
- Palabras que nunca usas (en UNA línea, separadas por comas; QA las busca en cada lámina): ${vetadas.join(', ')}
`;
}
