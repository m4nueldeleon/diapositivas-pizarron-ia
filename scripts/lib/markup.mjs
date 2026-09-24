// markup.mjs — convierte el texto de una lámina en HTML con las marcas del estilo.
//
//   **negrita**        la frase clave (el resto va en regular)
//   __subrayado__      negrita + subrayado rojo a mano
//   ==resaltado==      negrita + resaltador amarillo
//   ~~tachado~~        tachón rojo a mano
//   *cursiva*          la voz de otro: una objeción, lo que piensa el cliente [17:25]
//   ^^remate^^         el remate en su propio renglón, en negrita y ~1.5× la entrada [18:30]
//   {v:texto}          color semántico: v verde · r rojo · n naranja · g gris · a azul · k negro · o dorado
//                      (el dorado es para cifras sobre lámina oscura [36:40])
//   [[nota]]           la misma frase en letra manuscrita (Caveat) dentro de la línea
//   [PRECIO]           dato pendiente (MAYÚSCULAS entre corchetes): contorno punteado del color de su renglón (conserva
//                      el tono, el peso y el tamaño de la marca que lo envuelve); qa.mjs lo cuenta como error hasta
//                      que se llene (mejor con "datos" y {{PRECIO}}: datos.mjs)
//   {s:/año}           sufijo chico: ~55% del tamaño, en peso regular y del mismo color («$50k{s:/año}») [17:00]
//   \n                 salto de línea forzado. Una marca puede abarcar el salto: «**mejor\nmodelo**»
//                      sale en negrita en los dos renglones (el subrayado y el tachón se dibujan
//                      renglón por renglón).
//
// Todo se escapa primero: el texto del usuario nunca entra como HTML.

export function escapar(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Dato pendiente a la vista: [PRECIO], [WHATSAPP], [DÍAS] (solo MAYÚSCULAS; «[nombre]» es plantilla de chat)
export const RE_HUECO = /\[([A-ZÁÉÍÓÚÑÜ0-9][A-ZÁÉÍÓÚÑÜ0-9 _\-]{1,30})\]/g;

const TONOS = new Set(['v', 'r', 'n', 'g', 'a', 'k', 'o']);

export function marcar(texto) {
  let h = escapar(texto);
  // Un rango de cifras no se parte en el guion: «$10k–50k» queda en un renglón (word joiner tras el guion)
  h = h.replace(/(\d[kKmM%]?)([–-])(?=\$?\d)/g, '$1$2\u2060');
  // el sufijo va antes que el tono: «{v:$50k{s:/año}}» deja el sufijo dentro del verde
  h = h.replace(/\{s:([^{}]+?)\}/g, '<span class="sufijo">$1</span>');
  h = h.replace(/\{([vrngako]):([^{}]+?)\}/g, (m, t, x) => (TONOS.has(t) ? `<span class="tono-${t}">${x}</span>` : m));
  // [\s\S] y no «.»: una marca puede cruzar un salto de línea real (el \n de un deck.json). El salto
  // se vuelve <br> al final, así queda DENTRO de <b>, <s> o <mark>.
  h = h.replace(/\[\[([\s\S]+?)\]\]/g, '<span class="mano">$1</span>');
  // `.hueco.pendiente`: el dato por llenar. La plantilla del chat ([nombre]) es otra cosa: `.var-plantilla` (layouts-datos)
  h = h.replace(RE_HUECO, '<span class="hueco pendiente">[$1]</span>');
  h = h.replace(/__([\s\S]+?)__/g, '<b class="sub" data-sub>$1</b>');
  h = h.replace(/==([\s\S]+?)==/g, '<mark>$1</mark>');
  h = h.replace(/~~([\s\S]+?)~~/g, '<s class="tachon" data-tachar>$1</s>');
  h = h.replace(/\*\*([\s\S]+?)\*\*/g, '<b>$1</b>');
  h = h.replace(/\^\^([\s\S]+?)\^\^/g, '<span class="remate">$1</span>');
  // cursiva: un asterisco pegado al texto en los dos lados («5 * 3» no es cursiva)
  h = h.replace(/(^|[^*\w])\*(?=\S)([^*\n]+?)(?<=\S)\*(?![*\w])/g, '$1<i>$2</i>');
  h = h.replace(/\\n|\n/g, '<br>');
  return unirGuiones(h);
}

// Una palabra compuesta no se corta en su guion: «Just-Click- / The-Buttons» partía el nombre del método. Se mete un
// word joiner (U+2060, el mismo mecanismo de los rangos de cifras) antes y después de cada guion ENTRE LETRAS, solo
// en el texto (nunca en etiquetas ni atributos: «tono-v») y nunca dentro de un [DATO-PENDIENTE], que QA cuenta.
export function unirGuiones(html) {
  return String(html).split(/(<span class="hueco[^"]*">[^<]*<\/span>|<[^>]+>)/).map((t, i) => (i % 2 ? t
    : t.replace(/(\p{L})-(?=\p{L})/gu, '$1\u2060-\u2060'))).join('');
}

// Texto plano (para contar palabras y para QA)
export function plano(texto) {
  return String(texto ?? '')
    .replace(/\{s:([^{}]+?)\}/g, '$1')   // el sufijo puede ir dentro de un tono: primero el de adentro
    .replace(/\{[vrngakos]:([^{}]+?)\}/g, '$1')
    .replace(/\[\[|\]\]|__|==|~~|\*\*|\^\^/g, '')
    .replace(/(^|[^*\w])\*(?=\S)([^*\n]+?)(?<=\S)\*(?![*\w])/g, '$1$2')
    .replace(/\\n|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const RE_PALABRA = /[\p{L}\p{N}]+(?:[.,:⁠\-–—\/×%]+[\p{L}\p{N}]+)*/gu;
export const contarPalabras = s => (String(s ?? '').match(RE_PALABRA) || []).length;
export const palabras = texto => contarPalabras(plano(texto));

// Tamaño automático del texto principal según su largo, medido contra la referencia a 1920:
// hasta 7 palabras 90 px, de 8 a 15 → 84 (c_0250), de 16 a 25 → 76 (c_0115, c_0205) y solo por encima
// de 25 → 68, nunca menos. Cuenta solo la ENTRADA: el ^^remate^^ va aparte y más grande.
export function tamTexto(texto, forzado) {
  if (forzado) return forzado;
  const n = palabras(String(texto ?? '').replace(/\^\^[\s\S]+?\^\^/g, ' '));
  if (n <= 7) return 'grande';
  if (n <= 15) return 'medio';
  if (n <= 25) return 'chico';
  return 'compacto';
}

// Cuántas marcas de énfasis tiene (la regla es una por lámina, dos como máximo)
export function enfasis(texto) {
  const s = String(texto ?? '');
  return {
    subrayados: (s.match(/__([\s\S]+?)__/g) || []).length,
    resaltados: (s.match(/==([\s\S]+?)==/g) || []).length,
    negritas: (s.match(/\*\*([\s\S]+?)\*\*/g) || []).length,
  };
}

// Marcas que quedaron sin convertir en el texto que se VE (una marca sin cerrar, o partida). La usa qa.mjs
// dentro del navegador: por eso es una cadena de regex y no una RegExp compartida.
export const MARCA_LITERAL = String.raw`\*\*|~~|__|\^\^|\[\[|\]\]|==\S[\s\S]*?==|\{[vrngakos]:`;
