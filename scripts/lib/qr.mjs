// QR autocontenido: codificador MIT de Kazuhiko Arase (qr-vendor/LICENSE), ECC M.
import QRCode from './qr-vendor/index.js';
import { escapar } from './markup.mjs';
export const ZONA_QUIETA = 4;
export const MODULO_PX = 12;

export function codificarQr(texto, { mascara } = {}) {
  if (typeof texto !== 'string' || !texto || Buffer.byteLength(texto) > 2000) throw new Error('QR: usa texto de 1 a 2,000 bytes; acorta la URL');
  if (mascara != null && (!Number.isInteger(mascara) || mascara < 0 || mascara > 7)) throw new Error('QR: la máscara debe estar entre 0 y 7');
  const codigo = new QRCode(0, 0); // 0 = corrección M en el codificador MIT.
  codigo.addData(Buffer.from(texto, 'utf8').toString('latin1'));
  codigo.make();
  if (mascara != null) codigo.makeImpl(false, mascara);
  return { matriz: codigo.modules.map(f => f.map(Boolean)), version: codigo.typeNumber, modulos: codigo.moduleCount, zona_quieta: ZONA_QUIETA };
}
export function svgQr(texto) {
  const qr = codificarQr(texto), lado = qr.modulos + 2 * ZONA_QUIETA;
  const trazos = qr.matriz.flatMap((fila, y) => fila.flatMap((negro, x) => negro ? [`M${x + ZONA_QUIETA} ${y + ZONA_QUIETA}h1v1h-1z`] : [])).join('');
  return { ...qr, lado, svg: `<svg xmlns="http://www.w3.org/2000/svg" class="codigo-qr" viewBox="0 0 ${lado} ${lado}" data-modulos="${qr.modulos}" data-zona-quieta="${ZONA_QUIETA}" role="img" aria-label="Código QR" shape-rendering="crispEdges"><rect width="${lado}" height="${lado}" fill="#fff"/><path d="${trazos}" fill="#000"/></svg>` };
}
export function bloqueQr(qr, ctx, paso) {
  const codigo = svgQr(qr.url), ancho = codigo.lado * MODULO_PX;
  return `<aside class="qr"${ctx.P(paso)} style="--qr-ancho:${ancho}px">${codigo.svg}<div class="qr-rotulo">${escapar(qr.rotulo || 'escanéalo')}</div></aside>`;
}
export function validarQr(qr) {
  if (!qr || typeof qr !== 'object' || Array.isArray(qr) || Object.keys(qr).some(k => !['url', 'rotulo'].includes(k))) return 'qr debe ser { url, rotulo? }';
  try {
    const url = new URL(qr.url);
    if (typeof qr.url !== 'string' || !qr.url.startsWith('https://') || url.protocol !== 'https:' || !url.hostname || url.username || url.password || Buffer.byteLength(url.href) > 2000) return 'qr.url debe empezar con https:// y ser una URL sin credenciales de hasta 2,000 bytes';
  } catch { return 'qr.url debe ser una URL completa que empiece con https://'; }
  if (qr.rotulo != null && (typeof qr.rotulo !== 'string' || !qr.rotulo.trim() || qr.rotulo.length > 80)) return 'qr.rotulo debe ser texto de 1 a 80 caracteres';
  return null;
}
