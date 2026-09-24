// Se inserta dentro de runtime.js. Solo mide glifos ausentes de la tabla, sin filtros ni halo.
async function prepararHalos() {
  const elementos = [...document.querySelectorAll('.lamina.oscura .emo[data-halo-medir]')];
  if (!elementos.length) return;
  const tam = 128, canvas = document.createElement('canvas');
  canvas.width = tam; canvas.height = tam;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const lineal = v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  const luminancia = (r, g, b) => .2126 * lineal(r) + .7152 * lineal(g) + .0722 * lineal(b);
  const fondo = luminancia(11, 11, 14);
  for (const e of elementos) {
    try {
      ctx.clearRect(0, 0, tam, tam);
      if (e.dataset.haloSrc) {
        const imagen = new Image(); imagen.src = e.dataset.haloSrc;
        await imagen.decode(); ctx.drawImage(imagen, 0, 0, tam, tam);
      } else {
        const texto = e.querySelector(':scope > .emo-txt');
        if (!texto) throw new Error('no se encontró el glifo para medir');
        ctx.font = `${tam * .8}px ${getComputedStyle(texto).fontFamily}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(texto.textContent, tam / 2, tam / 2);
      }
      const datos = ctx.getImageData(0, 0, tam, tam).data;
      let opacos = 0, visibles = 0;
      for (let i = 0; i < datos.length; i += 4) {
        if (datos[i + 3] < 128) continue;
        opacos++;
        const lum = luminancia(datos[i], datos[i + 1], datos[i + 2]);
        if ((Math.max(lum, fondo) + .05) / (Math.min(lum, fondo) + .05) >= 3) visibles++;
      }
      if (!opacos) throw new Error('el glifo no produjo píxeles opacos');
      const contraste = Math.round(100 * visibles / opacos);
      e.dataset.haloContraste = contraste;
      e.classList.toggle('hundido', contraste < Number(e.dataset.haloMedir));
    } catch (error) {
      avisos.push(`No se pudo medir el emoji de la lámina oscura: ${error.message}; fija un emoji medido de EMOJIS.md`);
    }
  }
}
