// Medida autocontenida para Chromium: qa.mjs y las pruebas la inyectan con .toString().
// Devuelve un aviso por texto aunque haya varios renglones o más de un motivo de cruce.
export function subrayadosCruzan(lam) {
  const L = lam.getBoundingClientRect(), escala = L.width / lam.offsetWidth || 1;
  const visible = e => !e.closest('.oculto, .escena.clon') && getComputedStyle(e).visibility !== 'hidden' && e.getClientRects().length;
  const relativo = r => ({ x: (r.left - L.left) / escala, y: (r.top - L.top) / escala, w: r.width / escala, h: r.height / escala });
  const cruza = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const textos = [], avisos = new Set(), ctx = document.createElement('canvas').getContext('2d');
  const tw = document.createTreeWalker(lam, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) {
    const e = n.parentElement;
    if (!e || !/\S/.test(n.nodeValue) || e.closest('svg, script, style, .emo') || !visible(e)) continue;
    const cs = getComputedStyle(e); ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; // cs.font sale vacío en Chromium con ciertas propiedades tipográficas
    const m = ctx.measureText('Hg'); let zoom = 1;
    for (let p = e; p && p !== lam; p = p.parentElement) zoom *= parseFloat(getComputedStyle(p).zoom) || 1;
    const em = parseFloat(cs.fontSize) * zoom;
    const asc = (m.fontBoundingBoxAscent ?? parseFloat(cs.fontSize) * 0.8) * zoom;
    const desc = (m.fontBoundingBoxDescent ?? parseFloat(cs.fontSize) * 0.2) * zoom;
    const rango = document.createRange(); rango.selectNodeContents(n);
    for (const r of rango.getClientRects()) {
      const b = relativo(r);
      if (b.w > 1) textos.push({ ...b, base: b.y + (b.h - asc - desc) / 2 + asc, em });
    }
  }
  const huecos = [...lam.querySelectorAll('.hueco')].filter(visible).map(e => relativo(e.getBoundingClientRect()));
  lam.querySelectorAll(':scope > .capa-mano path[data-clase="subrayado"]').forEach(p => {
    if (!visible(p) || Number(getComputedStyle(p).opacity) === 0) return;
    const base = Number(p.dataset.base), em = Number(p.dataset.em);
    if (!Number.isFinite(base) || !(em > 0)) return;
    const x0 = Number(p.dataset.x0), x1 = Number(p.dataset.x1), largo = p.getTotalLength();
    const n = Math.max(1, Math.ceil(largo / 6));
    const invade = Array.from({ length: n + 1 }, (_, i) => p.getPointAtLength(largo * i / n))
      .some(q => q.x >= x0 && q.x <= x1 && q.y < base + 0.12 * em);
    const b = p.getBBox(), mitad = Number(p.getAttribute('stroke-width')) / 2;
    const tinta = { x: b.x - mitad, y: b.y - mitad, w: b.width + mitad * 2, h: b.height + mitad * 2 };
    const otroRenglon = textos.some(t => Math.abs(t.base - base) > Math.min(t.em, em) * 0.5 && cruza(tinta, t));
    if (invade || otroRenglon || huecos.some(h => cruza(tinta, h))) {
      const texto = String(p.dataset.texto || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      avisos.add(`el subrayado cruza las letras de “${texto}”: sepáralo bajo los descendentes o da más espacio entre renglones y huecos`);
    }
  });
  return [...avisos];
}
