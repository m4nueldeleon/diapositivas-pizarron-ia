// Reglas de acceso en vivo; la lectura del QR depende del tamaño pintado, medido por qa.mjs.
import { plano } from './markup.mjs';
import { validarQr } from './qr.mjs';
const normal = t => plano(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const EXCLUIDOS = new Set(['id', 'tipo', 'qr', 'accion', 'si_falla', 'imagen', 'src', 'fuente', 'emoji', 'iconos', 'como']);
function textos(o) {
  if (typeof o === 'string') return [o];
  if (!o || typeof o !== 'object') return [];
  return Object.entries(o).filter(([k]) => !EXCLUIDOS.has(k)).flatMap(([, v]) => textos(v));
}
export function reglasQr(deck) {
  const errores = [], avisos = [];
  deck.laminas.forEach((l, i) => {
    const n = `lámina ${i + 1} (${l.id || l.tipo})`, t = normal(textos(l).join(' '));
    const escanea = /\b(?:escanea(?:lo|la)?|escaneen(?:lo|la)?|qr|tomenle foto)\b/.test(t);
    if (escanea && !l.qr) errores.push(`${n}: pides escanear o tomar foto del QR pero no hay qr; agrega qr: { url: "https://…" } en idea, lista o boton`);
    if (l.qr) {
      const error = validarQr(l.qr);
      if (error) { errores.push(`${n}: ${error}`); return; }
      if (!deck.en_vivo) avisos.push(`${n}: en video no se escanea; muestra la URL corta junto al QR`);
      if (l.qr.url.length > 30) avisos.push(`${n}: la URL del QR tiene ${l.qr.url.length} caracteres y sube la versión; usa una URL corta y estable (unos 30 caracteres)`);
      if (deck.en_vivo && /(?:tudominio|ejemplo|example|dominio-real)/i.test(new URL(l.qr.url).hostname)) errores.push(`${n}: el QR apunta a un dominio de relleno; reemplázalo por la URL real y pruébala antes de proyectar`);
      return;
    }
    if (!deck.en_vivo) return;
    const visible = normal(textos({ ...l, voz: undefined }).join(' '));
    // «Próxima clase: {{FECHA}}» es una fecha, no un destino: no pide QR. Solo el llamado que lleva a un sitio.
    const puente = (l.llamado && ['idea', 'lista', 'boton'].includes(l.tipo)) || /\b(?:comunidad|registrate|inscribete|unete)\b/.test(visible);
    const botonConLink = l.tipo === 'boton' && /https?:|\blink\b|\bliga\b|\.com|\.org|\.mx/.test(visible);
    const palabra = /\b(?:palabra|escribe|manda|envia|comenta|di)\s+(?:la\s+)?["«']?[a-z]{2,}/.test(visible);
    const urlGrande = /(?:https:\/\/|\b[\w-]+\.(?:com|org|mx|io|app)\b)/.test(visible) && (l.tam_texto == null || ['compacto', 'chico', 'medio', 'grande', 'enorme'].includes(l.tam_texto) || parseFloat(l.tam_texto) >= 64);
    if ((puente || botonConLink) && !palabra && !urlGrande) avisos.push(`${n}: llamado/puente en vivo sin cómo entrar; agrega QR, URL visible de al menos 64 px o palabra clave (ARCOS.md)`);
  });
  return { errores, avisos };
}
export function medidasQr({ ancho, modulos, zona_quieta, ancho_lienzo = 1920 }) {
  const modulo_px = ancho / (modulos + 2 * zona_quieta), minimo = 10 * ancho_lienzo / 1920;
  return { modulo_px, minimo, valido: zona_quieta >= 4 && modulo_px >= minimo };
}
