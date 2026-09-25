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
  const falta = l.tipo === 'foto' || (l.tipo === 'prueba' && l.capturas?.some(c => c.src && !c.procedencia && !c.fuente));
  return falta ? ['imagen sin procedencia ni fuente: declara procedencia (real, ia o ejemplo) o añade fuente'] : [];
}
