// Imágenes locales medibles sin permisos especiales del navegador: ctx.img valida primero la ruta.
import fs from 'node:fs';
import path from 'node:path';
import { imagenConHueco } from './comun.mjs';

const TIPOS = { '.png': 'png', '.jpg': 'jpeg', '.jpeg': 'jpeg', '.webp': 'webp', '.gif': 'gif', '.svg': 'svg+xml', '.avif': 'avif' };

export function imagenRecortada(ctx, src, alto, rol = 'objeto') {
  const html = imagenConHueco(ctx, src, alto);
  const ruta = html.match(/src="(img\/[^"]+)"/)?.[1];
  const medible = ruta ? html.replace(`src="${ruta}"`, `src="data:image/${TIPOS[path.extname(ruta).toLowerCase()]};base64,${fs.readFileSync(path.join(ctx.dirSalida, ruta)).toString('base64')}"`) : html;
  // El SVG sigue siendo una imagen inerte: runtime analiza una copia XML separada.
  const documento = rol === 'objeto' && ruta && path.extname(ruta).toLowerCase() === '.svg'
    && /<text\b/i.test(fs.readFileSync(path.join(ctx.dirSalida, ruta), 'utf8'));
  return medible.replace('<img ', `<img data-recorte="${rol}"${documento ? ' data-documento-svg="1"' : ''} `);
}

// R14: una captura de prueba en SVG con texto también es un documento medible (el piso de 44 px del cuerpo y los
// descargos a la vista valían solo para `objeto`; la muestra de un VSL en `prueba` salía a ~36 px [r13, VSL 8]).
// `ruta` es lo que devolvió ctx.img (ya validada dentro de la carpeta del deck).
export function capturaDocumento(ctx, ruta) {
  if (!ruta || path.extname(ruta).toLowerCase() !== '.svg') return { src: ruta, attr: '' };
  const xml = fs.readFileSync(path.join(ctx.dirSalida, ruta), 'utf8');
  if (!/<text\b/i.test(xml)) return { src: ruta, attr: '' };
  return { src: `data:image/svg+xml;base64,${Buffer.from(xml, 'utf8').toString('base64')}`, attr: ' data-documento-svg="1"' };
}

// Autocontenida para runtime y pruebas: nunca mide sombras; lee los píxeles del archivo original.
export function revisarRecortes(raiz = document) {
  return [...raiz.querySelectorAll('img[data-recorte]')].map(img => {
    const lam = img.closest('.lamina'), dato = { lamina: Number(lam?.dataset.i || 0), id: lam?.dataset.id, tipo: img.dataset.recorte };
    try {
      if (!img.complete || !img.naturalWidth) throw new Error('la imagen no terminó de cargar');
      const lienzo = document.createElement('canvas'); lienzo.width = 64; lienzo.height = 64;
      const ctx = lienzo.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, 64, 64);
      const datos = ctx.getImageData(0, 0, 64, 64).data;
      const esquinas = [[0, 0], [63, 0], [0, 63], [63, 63]];
      const opaca = esquinas.every(([x, y]) => datos[(y * 64 + x) * 4 + 3] >= 250);
      img.classList.toggle('imagen-opaca', opaca); img.classList.toggle('imagen-recortada', !opaca);
      img.dataset.recorteOpaco = String(opaca);
      return { ...dato, opaca };
    } catch (e) {
      img.dataset.recorteError = e.message;
      return { ...dato, error: `no se pudo comprobar el fondo de la imagen: ${e.message}; usa un PNG local con transparencia` };
    }
  });
}

export function avisosProcedencia(l) {
  if (l.procedencia || (typeof l.fuente === 'string' && l.fuente.trim())) return [];
  // R16 [juez r16]: un chat que muestra un RESULTADO (el cliente responde y hay sello, o paga el gancho) se lee como un caso
  // real («VOLVIÓ», «te aparta tres cajas»). En cualquier pieza declara procedencia: 'ejemplo' (pie «Ejemplo ficticio»)
  // o su fuente; nunca se presenta ficción como resultado.
  // Un sello solo («SIN RESPUESTA», «TARDE») muestra un problema, no un resultado: se exige cuando el chat PAGA el gancho
  // y el cliente responde DESPUÉS de nosotros (el final feliz presentado como hecho).
  // Criterio: el chat paga el gancho y su ÚLTIMO mensaje (de dos o más) es del cliente: esa respuesta es el resultado.
  // R17 [juez r17]: quien hable da igual. «Ya recibí tu pago. Pedido confirmado» con sello VENDIDO pasaba porque lo decía
  // «yo». Un chat que PAGA el gancho, o que lleva un sello de resultado (vendido, pagado, resuelto…), es un resultado.
  const resultado = /^(vendid|pagad|resuelt|volvi|cerrad|confirmad|listo|aprobad|agendad|reservad|cobrad|ganad|logrado|hecho)/i
    .test(String(l.sello || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
  const sinAcento = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // Una pregunta («¿Qué recibo si te contrato?») no afirma un resultado
  const dicenResultado = (l.mensajes || []).filter(m => !/\?\s*$/.test(String(m?.texto || '').trim())).some(m => /\b(pag[oaueé]\w*|confirm\w*|compr\w*|reserv\w*|apart\w*|agend\w*|recib\w*|llev[oa]\w*|listo|hecho|vendid\w*|cerrad\w*|firmad\w*|contrat\w*|inscri\w*|registrad\w*)\b/.test(sinAcento(m?.texto)));
  if (l.tipo === 'chat' && ((l.paga && dicenResultado) || (l.sello && resultado)))
    return ['chat que muestra un resultado (paga el gancho o lleva sello de resultado) sin procedencia: declara procedencia: "ejemplo" (sale «Ejemplo ficticio») o su fuente'];
  const falta = l.tipo === 'foto' || (l.tipo === 'prueba' && l.capturas?.some(c => c.src && !c.procedencia && !c.fuente));
  return falta ? ['imagen sin procedencia ni fuente: declara procedencia (real, ia o ejemplo) o añade fuente'] : [];
}
