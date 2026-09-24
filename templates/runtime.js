/* runtime.js — corre dentro del HTML de las láminas.
   1) Mide el DOM ya maquetado y dibuja la capa a mano (flechas, subrayados, llaves, círculos, rutas).
   2) Controla el revelado por pasos y las micro-animaciones con una sola función determinista:
        PZ.mostrar(lamina, paso, t)   t = ms desde que empezó el paso (Infinity = estado final)
      La usan igual el presentador en vivo, el render de PNG y el render de video cuadro a cuadro. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const C = { rojo: '#c8101e', rojoClaro: '#ff4d57', negro: '#161616', gris: '#7d7d7d', grisClaro: '#9a9a9a' };
  const avisos = (window.__avisos = []);

  // ---------- azar con semilla (mismo dibujo en cada render) ----------
  function azar(semilla) {
    let s = semilla >>> 0 || 1;
    return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const easeInOut = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  // ---------- geometría ----------
  function escala(lam) { return lam.getBoundingClientRect().width / lam.offsetWidth || 1; }
  function caja(el, lam) {
    const r = el.getBoundingClientRect(), L = lam.getBoundingClientRect(), s = escala(lam);
    const b = { x: (r.left - L.left) / s, y: (r.top - L.top) / s, w: r.width / s, h: r.height / s };
    b.cx = b.x + b.w / 2; b.cy = b.y + b.h / 2; return b;
  }
  // Un rectángulo por RENGLÓN de texto. Se miden solo los nodos de texto (no las cajas de los elementos
  // hijos: el span de un ítem de lista, el emoji o un <b> anidado daban rayas de más) y se unen por renglón.
  function rectsTexto(el, lam) {
    const L = lam.getBoundingClientRect(), s = escala(lam), rs = [];
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (/\S/.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest('.emo')) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    for (let n; (n = tw.nextNode());) {
      const rg = document.createRange(); rg.selectNodeContents(n);
      [...rg.getClientRects()].filter(r => r.width > 4).forEach(r => rs.push({ x: (r.left - L.left) / s, y: (r.top - L.top) / s, w: r.width / s, h: r.height / s }));
    }
    rs.sort((a, b) => a.y - b.y || a.x - b.x);
    const grupos = [];
    rs.forEach(r => {
      const cy = r.y + r.h / 2;
      const g = grupos.find(g => (cy >= g.y && cy <= g.y + g.h) || Math.abs(cy - (g.y + g.h / 2)) < Math.min(g.h, r.h) / 2);
      if (!g) { grupos.push({ ...r }); return; }
      const x1 = Math.max(g.x + g.w, r.x + r.w), y1 = Math.max(g.y + g.h, r.y + r.h);
      g.x = Math.min(g.x, r.x); g.y = Math.min(g.y, r.y); g.w = x1 - g.x; g.h = y1 - g.y;
    });
    return grupos;
  }
  function borde(b, hacia, gap) {
    const dx = hacia[0] - b.cx, dy = hacia[1] - b.cy;
    if (!dx && !dy) return [b.cx, b.cy];
    const hw = b.w / 2 + gap, hh = b.h / 2 + gap;
    const t = Math.min(Math.abs(hw / (dx || 1e-9)), Math.abs(hh / (dy || 1e-9)));
    return [b.cx + dx * t, b.cy + dy * t];
  }
  function suave(pts) {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }
  function linea(P, Q, r, amp = 2.4, n = 6) {
    const dx = Q[0] - P[0], dy = Q[1] - P[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const curv = (r() - 0.5) * amp * 2.2, pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, o = Math.sin(Math.PI * t) * curv + (i && i < n ? (r() - 0.5) * amp : 0);
      pts.push([P[0] + dx * t + nx * o, P[1] + dy * t + ny * o]);
    }
    return pts;
  }
  function cuadratica(P, Q, K, n = 18) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; pts.push([u * u * P[0] + 2 * u * t * K[0] + t * t * Q[0], u * u * P[1] + 2 * u * t * K[1] + t * t * Q[1]]); }
    return pts;
  }
  function cubica(P, K1, K2, Q, n = 24) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      pts.push([u * u * u * P[0] + 3 * u * u * t * K1[0] + 3 * u * t * t * K2[0] + t * t * t * Q[0], u * u * u * P[1] + 3 * u * u * t * K1[1] + 3 * u * t * t * K2[1] + t * t * t * Q[1]]);
    }
    return pts;
  }
  const angulo = pts => { const a = pts[pts.length - 1], b = pts[Math.max(0, pts.length - 4)]; return Math.atan2(a[1] - b[1], a[0] - b[0]); };
  function cabezaV(Q, ang, len, abre = 0.52, r) {
    const j = r ? (r() - 0.5) * 0.12 : 0;
    const a1 = ang + Math.PI - abre + j, a2 = ang + Math.PI + abre + j;
    return `M${(Q[0] + Math.cos(a1) * len).toFixed(1)} ${(Q[1] + Math.sin(a1) * len).toFixed(1)} L${Q[0].toFixed(1)} ${Q[1].toFixed(1)} L${(Q[0] + Math.cos(a2) * len * 0.92).toFixed(1)} ${(Q[1] + Math.sin(a2) * len * 0.92).toFixed(1)}`;
  }

  // ---------- pintar trazos ----------
  function defs(svg, lam) {
    if (svg.querySelector('defs')) return;
    const W = lam.offsetWidth, H = lam.offsetHeight, id = `rug-${lam.dataset.i}-${svg.dataset.k || 0}`;
    svg.dataset.filtro = id;
    svg.insertAdjacentHTML('afterbegin', `<defs><filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="${3 + (+lam.dataset.i || 0)}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter></defs>`);
  }
  // Sobre una lámina oscura el rojo #c8101e queda en 3.4:1 y la referencia nunca subraya en rojo sobre
  // negro: el subrayado, la flecha y el círculo van en BLANCO; la negación (tachón, ✕) en rojo claro [36:40, 39:40].
  function tinta(svg, color, no) {
    if ((color || C.rojo) !== C.rojo || !svg.closest('.lamina.oscura')) return color || C.rojo;
    return no ? C.rojoClaro : '#ffffff';
  }
  function trazo(svg, d, o) {
    const e = document.createElementNS(NS, 'path');
    e.setAttribute('d', d);
    e.setAttribute('stroke', tinta(svg, o.color, o.no));
    e.setAttribute('stroke-width', o.ancho || 6);
    e.setAttribute('fill', o.relleno || 'none');
    // La punta «llena» es maciza: el estilo en línea le gana a la regla de CSS que deja los trazos sin relleno
    if (o.relleno) { e.style.fill = o.relleno; e.dataset.relleno = '1'; }
    if (o.textura !== false && !o.relleno) e.setAttribute('filter', `url(#${svg.dataset.filtro})`);
    e.dataset.p = o.p || 0;
    if (o.clase) e.dataset.clase = o.clase;   // qa.mjs revisa que las flechas no crucen texto
    if (o.estilo) e.dataset.estilo = o.estilo; // y que las anotaciones no se reduzcan a un garabato
    if (o.cabeza) { e.dataset.cabeza = '1'; }
    else if (o.dash) {
      e.setAttribute('stroke-dasharray', o.dash);
      // una ruta punteada se «dibuja» con una máscara que avanza sobre ella
      const mid = 'm' + Math.random().toString(36).slice(2, 9);
      const m = document.createElementNS(NS, 'mask'); m.setAttribute('id', mid); m.setAttribute('maskUnits', 'userSpaceOnUse');
      const mp = document.createElementNS(NS, 'path');
      mp.setAttribute('d', d); mp.setAttribute('stroke', '#fff'); mp.setAttribute('stroke-width', (o.ancho || 4) + 10); mp.setAttribute('fill', 'none');
      mp.setAttribute('pathLength', '1'); mp.setAttribute('stroke-dasharray', '1 1'); mp.dataset.trazo = '1'; mp.dataset.p = o.p || 0; mp.dataset.dur = o.dur || 700;
      if (o.retraso) mp.dataset.retraso = o.retraso;
      // tramo que arrastra la mano [1:55]: el cursor sigue la punta de esta máscara (ver mostrar)
      if (o.arrastre != null) Object.assign(e.dataset, { arrastre: o.arrastre, retraso: o.retraso || 0, dur: o.dur || 700 });
      m.appendChild(mp); svg.querySelector('defs').appendChild(m); e.setAttribute('mask', `url(#${mid})`);
    } else if (!o.relleno) {
      e.setAttribute('pathLength', '1'); e.setAttribute('stroke-dasharray', '1 1'); e.dataset.trazo = '1'; e.dataset.dur = o.dur || 300;
    }
    svg.appendChild(e); return e;
  }
  function texto(svg, x, y, s, o) {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-family', 'Caveat'); t.setAttribute('font-weight', '600'); t.setAttribute('font-size', o.tam || 46);
    t.setAttribute('fill', tinta(svg, o.color)); t.dataset.p = o.p || 0; t.textContent = s; svg.appendChild(t);
  }
  function equis(svg, M, r, p, tam = 22) {
    const j = () => (r() - 0.5) * 4;
    trazo(svg, `M${M[0] - tam + j()} ${M[1] - tam + j()} L${M[0] + tam + j()} ${M[1] + tam + j()}`, { color: C.rojo, ancho: 8, p, dur: 120, no: true });
    trazo(svg, `M${M[0] + tam + j()} ${M[1] - tam + j()} L${M[0] - tam + j()} ${M[1] + tam + j()}`, { color: C.rojo, ancho: 8, p, dur: 120, no: true });
  }

  // ---------- conexiones entre anclas ----------
  function dentro(esc, sel) { return [...esc.querySelectorAll(sel)].filter(e => e.closest('.escena') === esc); }
  function ancla(esc, id) { return dentro(esc, `[data-a="${CSS.escape(id)}"]`)[0]; }

  function conexion(c, esc, lam, svg, r) {
    const ea = ancla(esc, c.de), eb = ancla(esc, c.a);
    if (!ea || !eb) { avisos.push(`lámina ${+lam.dataset.i + 1}: falta el ancla «${!ea ? c.de : c.a}»`); return; }
    const A = caja(ea, lam), B = caja(eb, lam), p = c.p || 0;
    let pts, color = C.rojo, ancho = 7, len = 30, abre = 0.5;
    switch (c.estilo) {
      case 'arco': case 'arco-negro': {
        const P = [A.cx + A.w * 0.22, A.y - 16], Q = [B.cx - B.w * 0.22, B.y - 16];
        const d = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
        pts = cuadratica(P, Q, [(P[0] + Q[0]) / 2, Math.min(P[1], Q[1]) - d * 0.36]);
        // flecha negra: trazo grueso (~10 px, medido en c_0635) y punta en V abierta del mismo grosor
        if (c.estilo === 'arco-negro') { color = C.negro; ancho = 10; len = 40; abre = 0.6; }
        break;
      }
      case 'codo': {
        // Bifurcación [c_0635 «1 Partnership»]: nace justo por fuera del extremo de la frase, a la altura de
        // la línea base, y baja en diagonal hacia fuera con un arco que sale casi horizontal y llega casi
        // vertical, ~40 px sobre el emoji de la rama. Si la rama cae BAJO la frase (ramas juntas, 9:16), el
        // arco nace debajo del texto, sin pasar del extremo interior, para no tachar las letras.
        const sg = B.cx < A.cx ? -1 : 1;
        const Q = [B.cx - sg * Math.min(20, B.w * 0.1), B.y - 40];
        let P = [sg < 0 ? A.x - 26 : A.x + A.w + 26, A.y + A.h * 0.8];
        if ((Q[0] - P[0]) * sg < 70) {
          const x = Q[0] - sg * 70;
          P = [sg < 0 ? Math.max(x, A.x + A.w * 0.12) : Math.min(x, A.x + A.w * 0.88), A.y + A.h + 14];
        }
        pts = cuadratica(P, Q, [P[0] + (Q[0] - P[0]) * 0.75, P[1] + (Q[1] - P[1]) * 0.2]);
        color = C.negro; ancho = 10; len = 40; abre = 0.6; break;
      }
      case 'fina': {
        // Anotación de la rejilla [6:45 «That's 500»]: sale del borde derecho a media altura, se arquea y
        // baja en gancho con la punta SOBRE la nota. Por debajo de 80 px sería un garabato: se estira y se avisa.
        const P = [A.x + A.w + 10, A.y + A.h * 0.42];
        let Q = [B.x + Math.min(B.w * 0.25, 60), B.y - 14];
        const d = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
        if (d < 80) {
          avisos.push(`lámina ${+lam.dataset.i + 1}: la flecha de la anotación mide ${Math.round(d)} px (< 80); separa la nota`);
          const k = 80 / (d || 1); Q = [P[0] + (Q[0] - P[0]) * k, P[1] + Math.max(20, (Q[1] - P[1]) * k)];
        }
        pts = cubica(P, [P[0] + (Q[0] - P[0]) * 0.55, P[1] - 28], [Q[0] + 10, P[1] + (Q[1] - P[1]) * 0.2], Q);
        color = C.gris; ancho = 3.6; len = 20; break;
      }
      case 'fina-abajo': {
        const P = [A.cx, A.y + A.h + 8], Q = [B.cx, B.y - 6];
        pts = linea(P, Q, r, 1.5, 4); color = C.gris; ancho = 3.6; len = 18; break;
      }
      case 'curva-roja': {
        if (c.a && c.a.startsWith('cita')) {
          // Nota al margen [18:25]: un gancho corto que sale a la izquierda del ícono y CAE sobre el primer
          // cuarto del primer renglón (la letra, no la caja). Nunca más de 340 px.
          const r0 = rectsTexto(eb, lam)[0] || B;
          const Q = [r0.x + r0.w * 0.22, r0.y - 16];
          let P = [A.x - 14, A.cy];
          const d = Math.hypot(P[0] - Q[0], P[1] - Q[1]);
          if (d > 340) P = [Q[0] + (P[0] - Q[0]) * 340 / d, Q[1] + (P[1] - Q[1]) * 340 / d];
          pts = cuadratica(P, Q, [Q[0] + (P[0] - Q[0]) * 0.2, P[1] - 8]); ancho = 5; len = 24; break;
        }
        const P = borde(A, [B.cx, B.cy], 16), Q = borde(B, [A.cx, A.cy], 12);
        const dx = Q[0] - P[0], dy = Q[1] - P[1], s = c.curva || (Q[0] < P[0] ? 1 : -1);
        pts = cuadratica(P, Q, [(P[0] + Q[0]) / 2 + dy * 0.35 * s, (P[1] + Q[1]) / 2 - dx * 0.35 * s]); ancho = 5; len = 24; break;
      }
      case 'punteada': {
        const o = c.onda || 1, arriba = o < 0;
        const P = [A.x + A.w + 14, A.cy + (arriba ? -A.h * 0.22 : A.h * 0.22)], Q = [B.x - 14, B.cy + (arriba ? -B.h * 0.22 : B.h * 0.22)];
        const d = Q[0] - P[0], alto = (arriba ? -1 : 1) * Math.max(90, d * 0.42);
        pts = cubica(P, [P[0] + d * 0.12, P[1] + alto], [Q[0] - d * 0.2, Q[1] + alto * 0.9], Q);
        trazo(svg, suave(pts), { color: C.grisClaro, ancho: 4, dash: '7 11', p, textura: false, dur: 650, retraso: c.retraso, arrastre: c.arrastre });
        return;
      }
      case 'linea': {
        const P = [A.cx, A.y + A.h + 14], Q = [B.cx, B.y - 14];
        trazo(svg, suave(linea(P, Q, r, 1, 3)), { color: '#bdbdbd', ancho: 3.5, p, textura: false, dur: 250 });
        return;
      }
      case 'llave': {
        const eV = c.via && ancla(esc, c.via); if (!eV) return;
        const V = caja(eV, lam);
        const P = [A.cx, A.y + A.h + 30], Q = [B.cx, B.y + B.h + 30], M = [V.cx, V.y - 26], y = M[1] - 38;
        const iz = cubica(P, [P[0], y + 10], [P[0] + 70, y], [M[0] - 40, y], 20).concat(cubica([M[0] - 40, y], [M[0] - 12, y], [M[0] - 4, y + 10], M, 6).slice(1));
        const de = cubica(Q, [Q[0], y + 10], [Q[0] - 70, y], [M[0] + 40, y], 20).concat(cubica([M[0] + 40, y], [M[0] + 12, y], [M[0] + 4, y + 10], M, 6).slice(1));
        trazo(svg, suave(iz), { color: C.rojo, ancho: 5, p, dur: 420 });
        trazo(svg, suave(de), { color: C.rojo, ancho: 5, p, dur: 420 });
        trazo(svg, cabezaV(P, -Math.PI / 2, 22, 0.55, r), { color: C.rojo, ancho: 5, p, cabeza: true });
        trazo(svg, cabezaV(Q, -Math.PI / 2, 22, 0.55, r), { color: C.rojo, ancho: 5, p, cabeza: true });
        return;
      }
      default: { // recta: plumón rojo
        const P = borde(A, [B.cx, B.cy], 30), Q = borde(B, [A.cx, A.cy], 30);
        pts = linea(P, Q, r, 2.6); ancho = 7; len = 30;
      }
    }
    const fl = trazo(svg, suave(pts), { color, ancho, p, dur: 300, clase: 'flecha', estilo: c.estilo || 'recta' });
    Object.assign(fl.dataset, { de: c.de, a: c.a });   // qa.mjs no cuenta como choque el origen ni el destino
    const Q = pts[pts.length - 1], ang = angulo(pts);
    // La punta es siempre una V abierta con el mismo trazo (grosor, extremos redondos y textura) [c_0635]
    trazo(svg, cabezaV(Q, ang, len, abre, r), { color, ancho, p, cabeza: true, clase: 'punta' });
    const M = pts[Math.floor(pts.length / 2)];
    if (c.tachada) equis(svg, M, r, p);
    if (c.etiqueta) texto(svg, M[0], M[1] - (c.tachada ? 44 : 26), c.etiqueta, { p });
  }

  // ---------- marcas sobre texto e imágenes ----------
  const pasoDe = e => +((e.closest('[data-p]') || {}).dataset || {}).p || 0;
  function subrayados(esc, lam, svg, r) {
    // Subrayado [ref_10]: plumón de ~5.5 px en un arco suave (flecha de 0.8-1.2% del ancho), que arranca un poco a la
    // derecha del inicio (1-2%) y remata ANTES de la última letra (3-5%); arranque y remate varían ±2% por renglón
    dentro(esc, '[data-sub]').forEach(el => rectsTexto(el, lam).forEach(b => {
      const y = b.y + b.h * 0.93, w = b.w;
      const x0 = b.x + w * (0.01 + r() * 0.01), x1 = b.x + w * (1 - 0.03 - r() * 0.02);
      const sag = w * (0.008 + r() * 0.004), y1 = y - 2 + (r() - 0.5) * 3;
      const pts = cuadratica([x0, y + 1], [x1, y1], [(x0 + x1) / 2, (y + 1 + y1) / 2 - 2 * sag], 12);
      trazo(svg, suave(pts), { color: C.rojo, ancho: 5.5, p: pasoDe(el), dur: 280, clase: 'subrayado' });
    }));
    dentro(esc, '[data-tachar]').forEach(el => {
      const p = el.dataset.tacharP != null ? +el.dataset.tacharP : pasoDe(el);
      let rs = rectsTexto(el, lam);
      if (el.dataset.tachar === 'caja' && rs.length) {          // ítem de lista: cada renglón, y el primero desde la viñeta
        const B = caja(el, lam); rs = rs.map((b, i) => (i ? b : { ...b, w: b.w + (b.x - B.x), x: B.x }));
      }
      const esCaja = el.dataset.tachar === 'caja';
      rs.forEach(b => {
        const y = b.y + b.h * 0.54;
        if (!esCaja) { trazo(svg, suave(linea([b.x - 10, y + 4], [b.x + b.w + 10, y - 4], r, 2, 4)), { color: C.rojo, ancho: 7, p, dur: 240, no: true }); return; }
        // Descarte de lista [m_256 4:16]: plumón grueso (~10 px de núcleo) que arranca antes de la viñeta y sale por la
        // derecha, casi horizontal, con un segundo pase más claro que le da el borde áspero
        trazo(svg, suave(linea([b.x - 20, y + 2], [b.x + b.w + 24, y - 2], r, 1.6, 4)), { color: C.rojo, ancho: 10.5, p, dur: 240, no: true });
        const e2 = trazo(svg, suave(linea([b.x - 16, y + 4], [b.x + b.w + 20, y], r, 1.6, 4)), { color: C.rojo, ancho: 6, p, dur: 240, no: true });
        e2.setAttribute('stroke-opacity', '.6'); e2.dataset.pase = '2';   // pase de textura: no cuenta como otro trazo
      });
    });
  }
  function elipse(svg, b, r, p, ancho = 4.8) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, rx = b.w / 2 + Math.max(18, b.w * 0.07), ry = b.h / 2 + Math.max(14, b.h * 0.3);
    const a0 = -2.4 + r() * 0.4, pts = [];
    for (let i = 0; i <= 44; i++) { const a = a0 + (i / 44) * Math.PI * 2.12, k = 1 + (r() - 0.5) * 0.035 + (i / 44) * 0.05; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    trazo(svg, suave(pts), { color: C.rojo, ancho, p, dur: 520 });
  }
  function cajaRoja(svg, b, p) {
    const x = b.x - 8, y = b.y - 5, w = b.w + 16, h = b.h + 10, k = 14;
    trazo(svg, `M${x + k} ${y} H${x + w - k} Q${x + w} ${y} ${x + w} ${y + k} V${y + h - k} Q${x + w} ${y + h} ${x + w - k} ${y + h} H${x + k} Q${x} ${y + h} ${x} ${y + h - k} V${y + k} Q${x} ${y} ${x + k} ${y}`, { color: C.rojo, ancho: 3.4, p, textura: false, dur: 420 });
  }
  function circulos(esc, lam, svg, r) {
    dentro(esc, '[data-circulo]').forEach(el => {
      const b = caja(el, lam), p = pasoDe(el);
      if (el.dataset.circulo === 'caja') cajaRoja(svg, b, p); else elipse(svg, b, r, p);
    });
    dentro(esc, '[data-circulo-img]').forEach(el => {
      const B = caja(el, lam), [x, y, w, h] = el.dataset.circuloImg.split(',').map(Number);
      elipse(svg, { x: B.x + B.w * x / 100, y: B.y + B.h * y / 100, w: B.w * w / 100, h: B.h * h / 100 }, r, pasoDe(el), 5.2);
    });
    dentro(esc, '[data-tachon-img]').forEach(el => {
      const B = caja(el, lam), p = pasoDe(el);
      JSON.parse(el.dataset.tachonImg).forEach(([x, y, w, h, col]) => {
        const X = B.x + B.w * x / 100, Y = B.y + B.h * y / 100, Wd = B.w * w / 100, Hd = B.h * h / 100, pts = [];
        const n = Math.max(4, Math.round(Wd / 11));
        for (let i = 0; i <= n; i++) pts.push([X + (i / n) * Wd + (r() - 0.5) * 3, i % 2 ? Y + 3 : Y + Hd - 3]);
        trazo(svg, 'M' + pts.map(q => q.map(v => v.toFixed(1)).join(' ')).join(' L'), { color: col || C.rojo, ancho: Math.max(10, Hd * 0.42), p, textura: false, dur: 250 });
      });
    });
  }

  // ---------- cursor y onda ----------
  function cursor(esc, lam, r) {
    const spec = esc.dataset.clic ? JSON.parse(esc.dataset.clic) : null; if (!spec) return;
    const el = ancla(esc, spec.a); if (!el) { avisos.push(`lámina ${+lam.dataset.i + 1}: el clic apunta a «${spec.a}», que no existe`); return; }
    const cur = esc.querySelector(':scope > .cursor'), onda = esc.querySelector(':scope > .onda');
    // Sobre una tecla la mano es más chica (~0.55 del ancho de la tecla, como en ref_115)
    const enTecla = el.classList.contains('tecla');
    const mano = cur.dataset.tipo !== 'flecha', W = mano ? (enTecla ? 92 : 104) : 72, H = mano ? (enTecla ? 105 : 119) : 106;
    // Punta del dedo (o de la flecha) sobre un ancla
    const punta = e => {
      const b = caja(e, lam);
      let tx = b.x + b.w * (mano ? (b.w > 300 ? 0.84 : 0.6) : 0.74), ty = b.y + b.h * (mano ? 0.56 : 0.62);
      if (Array.isArray(spec.pos)) { tx = b.x + b.w * spec.pos[0]; ty = b.y + b.h * spec.pos[1]; }   // clic_pos manda
      else if (mano && e.classList.contains('tecla')) {
        // tecla [ref_115]: la cifra ocupa de y≈0.28 a y≈0.72; la punta toca el PIE del número y el número se lee entero
        tx = b.x + b.w * 0.64; ty = b.y + b.h * 0.74;
      } else if (mano && e.closest('.fila-pasos, .fila') && e.querySelector(':scope > .emo')) {
        // mapa con íconos: la punta en el cuarto inferior derecho del emoji (se toca, no se tapa)
        const q = caja(e.querySelector(':scope > .emo'), lam);
        tx = q.x + q.w * 0.72; ty = q.y + q.h * 0.78;
      } else if (mano && e.classList.contains('boton-ui')) {
        // botón [23:15]: la punta del dedo a la derecha del emoji (~0.45 de su ancho), a media altura; el emoji
        // se ve entero. Sin emoji, en el relleno de la derecha sin tapar el texto.
        const emo = e.querySelector('.emo');
        tx = b.x + b.w - Math.max(40, b.h * 0.35); ty = b.y + b.h * 0.6;
        if (emo) {
          const q = caja(emo, lam);
          tx = Math.min(Math.max(tx, q.x + q.w * 1.45), b.x + b.w * 0.95);
          if (tx < q.x + q.w * 1.1) { tx = q.x + q.w * 1.1; ty = q.y + q.h * 0.95; }
        }
      }
      return [tx, ty];
    };
    const [tx, ty] = punta(el);
    const px = tx - W * (mano ? 0.41 : 0.08), py = ty - H * (mano ? 0.03 : 0.05);
    Object.assign(cur.style, { width: W + 'px', height: H + 'px', left: px + 'px', top: py + 'px' });
    Object.assign(onda.style, { left: tx + 'px', top: ty + 'px' });
    // Arrastre: al terminar, la mano queda sobre la última tecla (mismo punto relativo que la del clic)
    const elFin = spec.fin && ancla(esc, spec.fin);
    if (elFin) { const [fx, fy] = punta(elFin); Object.assign(cur.dataset, { tx, ty, fx: fx - tx, fy: fy - ty }); }
  }

  // Si el contenido no cabe en el lienzo (formatos verticales, textos largos), se reduce con zoom
  // real para que la capa a mano se dibuje sobre las posiciones finales. QA avisa desde 85% y da error bajo 70%.
  function encajar(lam) {
    [lam, ...lam.querySelectorAll('.escena')].forEach(esc => esc.querySelectorAll(':scope > .lienzo').forEach(lz => {
      const h = lz.firstElementChild; if (!h || h.classList.contains('cuadrantes') || h.classList.contains('sangre')) return;
      const cs = getComputedStyle(lz), s = escala(lam);
      const aw = lz.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const ah = lz.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      [h, ...h.querySelectorAll('*')].forEach(e => {
        if (e.closest('svg') && e.tagName !== 'svg') return;
        const r = e.getBoundingClientRect(); if (!r.width && !r.height) return;
        x0 = Math.min(x0, r.left); x1 = Math.max(x1, r.right); y0 = Math.min(y0, r.top); y1 = Math.max(y1, r.bottom);
      });
      const w = (x1 - x0) / s, hh = (y1 - y0) / s;
      const k = Math.min(1, aw / w, (ah + 40) / hh);
      if (k < 0.995) { h.style.zoom = k.toFixed(3); if (esc === lam) lam.dataset.encaje = k.toFixed(2); }
    }));
  }

  // ---------- foco: la frase no se escribe sobre el texto del fondo ----------
  // En la referencia [15:20] la frase va centrada sobre el fondo atenuado y puede pasar sobre ÍCONOS (las bolsas), pero
  // nunca sobre renglones de texto. Si la frase choca con un renglón del fondo, se busca el hueco entre renglones que la
  // alcance MÁS CERCA DEL CENTRO vertical y se mueve ahí. Si no hay hueco, se queda centrada y el fondo baja a 0.1
  // (salvo que el autor fijara `opacidad`). Con `anclar` no se toca.
  function acomodarFoco(lam) {
    const lz = lam.querySelector(':scope > .lienzo.foco-frase'), clon = lam.querySelector(':scope > .escena.clon');
    if (!lz || !clon || lz.dataset.anclar) return;
    const pila = lz.firstElementChild; if (!pila) return;
    const H = lam.offsetHeight, P = caja(pila, lam), pad = 18;
    const TXT = '.t, .nota, .item, .etiqueta, .valor, .encabezado, .cifra, .etiqueta-chica, .tarjeta, .opcion, .burbuja, .titulo-marca';
    const rs = [...clon.querySelectorAll(TXT)].filter(e => !e.querySelector(TXT)).flatMap(e => rectsTexto(e, lam))
      .concat([...clon.querySelectorAll('svg text')].filter(t => t.textContent.trim()).map(t => caja(t, lam)))
      .filter(r => r.h >= 30 && r.x < P.x + P.w && r.x + r.w > P.x);
    const choca = y0 => rs.some(r => r.y < y0 + P.h + pad && r.y + r.h > y0 - pad);
    if (!rs.length || !choca(P.y)) return;
    // huecos verticales libres (dentro de los márgenes) donde cabe la frase
    const mv = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--margen-v')) || 60;
    const ocup = rs.map(r => [r.y - pad, r.y + r.h + pad]).sort((a, b) => a[0] - b[0]);
    const libres = []; let y = mv * 0.6;
    ocup.forEach(([a, b]) => { if (a - y >= P.h) libres.push([y, a]); y = Math.max(y, b); });
    if (H - mv * 0.6 - y >= P.h) libres.push([y, H - mv * 0.6]);
    const centro = H / 2;
    const cands = libres.map(([a, b]) => clamp(centro, a + P.h / 2, b - P.h / 2)).sort((p, q) => Math.abs(p - centro) - Math.abs(q - centro));
    if (cands.length) {
      Object.assign(pila.style, { position: 'relative', top: (cands[0] - (P.y + P.h / 2)).toFixed(1) + 'px' });
      lam.dataset.focoMovido = '1';
    } else if (!clon.dataset.opFija) clon.style.opacity = '0.1';
  }

  // ---------- sello: tamaño y posición ----------
  // Se mide sin escala; k lo reduce si, girado −5°, no cabe en el lienzo (sellos largos, 9:16). Se centra
  // en un ancla (sello_sobre), en una zona (sello_pos) o en el lienzo, y se acota a los bordes.
  const ZONAS = { centro: [0.5, 0.5], arriba: [0.5, 0.27], abajo: [0.5, 0.73], izquierda: [0.28, 0.5], derecha: [0.72, 0.5],
    'arriba-izquierda': [0.28, 0.27], 'arriba-derecha': [0.72, 0.27], 'abajo-izquierda': [0.28, 0.73], 'abajo-derecha': [0.72, 0.73] };
  // Sobre un ancla, el sello mide ~100% de su ancho [6:45: «A LOT OF SKILL» mide 1210 px sobre una rejilla de 1210,
  // con letras de ~100 px]: el cuerpo de la tinta se ajusta en dos pasadas (el relleno y el borde no escalan
  // lineal) entre 72 y 170 px; si girado no cabe en el lienzo, k lo reduce.
  function colocarSello(lam) {
    const s = lam.querySelector(':scope > .sello'); if (!s) return;
    const W = lam.offsetWidth, H = lam.offsetHeight, m = 40, a = 5 * Math.PI / 180;
    let [cx, cy] = (ZONAS[s.dataset.pos] || ZONAS.centro).map((f, i) => f * (i ? H : W));
    let rejilla = null, burbuja = null;
    if (s.dataset.sobre) {
      const el = ancla(lam, s.dataset.sobre);
      if (el && (el.classList.contains('burbuja') || el.closest('.chat'))) {
        // Chat: el sello NO mide el ancho de la burbuja (la tapaba entera): tinta fija y se pega junto a ella
        burbuja = el;
        const tinta = s.querySelector('.sello-tinta');
        if (tinta) tinta.style.fontSize = (H > W ? 72 : 84) + 'px';
      } else if (el) {
        const b = caja(el, lam), tinta = s.querySelector('.sello-tinta');
        cx = b.cx; cy = b.cy;
        if (tinta) for (let i = 0; i < 2; i++) {
          const fs = parseFloat(getComputedStyle(tinta).fontSize) || 104;
          tinta.style.fontSize = clamp(fs * (b.w * 0.97) / (s.offsetWidth || 1), 72, 170).toFixed(1) + 'px';
        }
        if (s.dataset.auto && el.classList.contains('rejilla')) rejilla = el;
      } else avisos.push(`lámina ${+lam.dataset.i + 1}: el sello va sobre «${s.dataset.sobre}», que no existe`);
    }
    const w = s.offsetWidth, h = s.offsetHeight;
    let k = Math.min(1, (W - 2 * m) / (w * Math.cos(a) + h * Math.sin(a)), (H - 2 * m) / (w * Math.sin(a) + h * Math.cos(a)));
    let bw = (w * Math.cos(a) + h * Math.sin(a)) * k / 2, bh = (w * Math.sin(a) + h * Math.cos(a)) * k / 2;
    if (rejilla) [cx, cy] = selloEnRejilla(lam, rejilla, [cx, cy], w * k, h * k, a, bw, bh, m);
    if (burbuja) {
      const r = selloEnChat(lam, burbuja, w, h, a, k, m);
      [cx, cy] = r.p; k = r.k; bw = (w * Math.cos(a) + h * Math.sin(a)) * k / 2; bh = (w * Math.sin(a) + h * Math.cos(a)) * k / 2;
    }
    cx = clamp(cx, m + bw, W - m - bw); cy = clamp(cy, m + bh, H - m - bh);
    Object.assign(s.style, { left: cx + 'px', top: cy + 'px' });
    s.dataset.k = k.toFixed(3);
  }

  // Sello sobre una rejilla con celdas DESTACADAS: esas celdas son el dato que se cuenta. Se prueba
  // el centro de cada banda entre renglones (y el centro) y gana la que tapa menos destacadas; si aun la mejor
  // tapa más del 25% (y más de 2), el sello sale a una franja libre (abajo, arriba, derecha o izquierda de la rejilla) que no
  // pise texto. Sin destacadas se queda centrado sobre las cajas, como en la referencia [6:45].
  function selloEnRejilla(lam, rej, centro, w, h, a, bw, bh, m) {
    const dest = [...rej.querySelectorAll('[data-a^="d"]')].map(e => caja(e, lam));
    if (!dest.length) return centro;
    const W = lam.offsetWidth, H = lam.offsetHeight, c = Math.cos(-a), sn = Math.sin(-a);
    const tapa = ([cx, cy]) => dest.filter(d => {
      const x = d.cx - cx, y = d.cy - cy, u = x * c - y * sn, v = x * sn + y * c;   // al marco del sello (girado −5°)
      return Math.abs(u) <= w / 2 && Math.abs(v) <= h / 2;
    }).length;
    const R = caja(rej, lam);
    const filas = [...new Set([...rej.children].map(e => Math.round(caja(e, lam).cy)))].sort((p, q) => p - q);
    const cands = [centro, ...filas.slice(1).map((y, i) => [R.cx, (y + filas[i]) / 2])]
      .map(p => [p[0], clamp(p[1], m + bh, H - m - bh)])
      .map(p => ({ p, n: tapa(p), d: Math.abs(p[1] - centro[1]) }))
      .sort((p, q) => p.n - q.n || p.d - q.d);
    // el sello es el remate y la cifra ya se dijo: puede tapar hasta ~25% de las destacadas (a todo el ancho cubre
    // 2-3 renglones, así que un tope de 2 lo sacaba de la rejilla casi siempre)
    if (cands[0].n <= Math.max(2, Math.floor(dest.length * 0.25))) return cands[0].p;
    const textos = [...lam.querySelectorAll('.t, .nota, .encabezado, .etiqueta')].filter(e => e.getClientRects().length).map(e => caja(e, lam));
    // pegado al borde de la rejilla y acotado al lienzo: puede pisar celdas NO destacadas, nunca una destacada
    const acota = ([cx, cy]) => [clamp(cx, m + bw, W - m - bw), clamp(cy, m + bh, H - m - bh)];
    const libre = ([cx, cy]) => !textos.some(t => t.x < cx + bw && t.x + t.w > cx - bw && t.y < cy + bh && t.y + t.h > cy - bh) && !tapa([cx, cy]);
    const fuera = [[R.cx, R.y + R.h + bh + 16], [R.cx, R.y - bh - 16], [R.x + R.w + bw + 16, R.cy], [R.x - bw - 16, R.cy]].map(acota).find(libre);
    return fuera || cands[0].p;
  }

  // Sello en un chat [gancho sin sonido]: califica la burbuja culpable SIN taparla. Se prueban, en orden: montado sobre el
  // borde de abajo de la burbuja (del lado contrario al avatar, pisando el relleno y no las letras), a la derecha, a la
  // izquierda y debajo del mensaje. Cada posición se mide con el sello girado −5° contra los renglones (burbujas, horas,
  // textos), los avatares y emojis y el lienzo: gana la que no toca nada (QA tolera hasta 12% de un renglón). Gana la primera limpia; si ninguna, la que menos tapa, con el sello reducido
  // hasta 0.7 (dataset.k: QA avisa si se redujo de más).
  function selloEnChat(lam, burbuja, w, h, a, k0, m) {
    // del lienzo al marco del sello: el sello va girado −a, así que se deshace con +a
    const W = lam.offsetWidth, H = lam.offsetHeight, c = Math.cos(a), sn = Math.sin(a);
    const b = caja(burbuja, lam), yo = !!burbuja.closest('.msj.yo');
    const renglones = [...lam.querySelectorAll('.burbuja, .chat-hora, .t, .nota, .encabezado')].filter(e => e.getClientRects().length && !e.closest('.escena.clon'))
      .flatMap(e => rectsTexto(e, lam));
    const iconos = [...lam.querySelectorAll('.yo-av, .otro-av, .emo')].filter(e => e.getClientRects().length && !e.closest('.escena.clon') && (e.matches('.yo-av, .otro-av') || !e.closest('.yo-av, .otro-av'))).map(e => caja(e, lam));
    // fracción de una caja bajo el sello (muestreo 10×5, más fino que el de QA: aquí se busca NO tocar las letras)
    const frac = (r, cx, cy, sw, sh) => {
      let n = 0;
      for (let i = 0; i <= 9; i++) for (let j = 0; j <= 4; j++) {
        const x = r.x + (i / 9) * r.w - cx, y = r.y + (j / 4) * r.h - cy, u = x * c - y * sn, v = x * sn + y * c;
        if (Math.abs(u) <= sw / 2 && Math.abs(v) <= sh / 2) n++;
      }
      return n / 50;
    };
    const costo = (cx, cy, kk) => {
      const sw = w * kk, sh = h * kk, bw = (sw * Math.cos(a) + sh * Math.sin(a)) / 2, bh = (sw * Math.sin(a) + sh * Math.cos(a)) / 2;
      let t = 0;
      if (cx - bw < m || cx + bw > W - m || cy - bh < m || cy + bh > H - m) t += 100;
      renglones.forEach(r => { t += frac(r, cx, cy, sw, sh); });
      iconos.forEach(r => { t += 4 * frac(r, cx, cy, sw, sh); });
      return t;
    };
    for (const kk of [k0, k0 * 0.85, Math.max(0.7, k0 * 0.7)]) {
      const sw = w * kk, sh = h * kk, bw = (sw * Math.cos(a) + sh * Math.sin(a)) / 2, bh = (sw * Math.sin(a) + sh * Math.cos(a)) / 2;
      const lado = yo ? b.x + bw * 0.9 : b.x + b.w - bw * 0.9;   // del lado contrario al avatar
      // montado sobre el borde de abajo: pisa el relleno de la burbuja, nunca sus letras
      const pie = Math.max(b.y + b.h + bh * 0.35, Math.max(b.y, ...rectsTexto(burbuja, lam).map(r => r.y + r.h)) + 8 + bh);
      const cands = [[lado, pie], [b.cx, pie], [b.x + b.w + bw + 16, b.cy], [b.x - bw - 16, b.cy], [b.cx, b.y + b.h + bh + 12]]
        .map(([x, y]) => [clamp(x, m + bw, W - m - bw), clamp(y, m + bh, H - m - bh)]);
      const medidos = cands.map(p => ({ p, t: costo(p[0], p[1], kk) }));
      const limpio = medidos.find(q => q.t === 0);
      if (limpio) return { p: limpio.p, k: kk };
      if (kk === Math.max(0.7, k0 * 0.7)) return { p: medidos.sort((p, q) => p.t - q.t)[0].p, k: kk };
    }
    return { p: [b.cx, b.y + b.h], k: k0 };
  }

  function dibujar(lam) {
    const escenas = [lam, ...lam.querySelectorAll('.escena')].filter((e, i, a) => a.indexOf(e) === i);
    escenas.forEach((esc, k) => {
      const svg = esc.querySelector(':scope > .capa-mano'); if (!svg) return;
      svg.dataset.k = k; defs(svg, lam);
      const r = azar(97 * (+lam.dataset.i + 1) + k * 13);
      const cons = esc.querySelector(':scope > script.con');
      let lista = [];
      try { lista = cons ? JSON.parse(cons.textContent) : []; } catch (e) { avisos.push(`lámina ${+lam.dataset.i + 1}: conexiones ilegibles (${e.message})`); }
      lista.forEach(c => { try { conexion(c, esc, lam, svg, r); } catch (e) { avisos.push(`lámina ${+lam.dataset.i + 1}: flecha ${c.de}→${c.a} no se dibujó (${e.message})`); } });
      [subrayados, circulos].forEach(f => { try { f(esc, lam, svg, r); } catch (e) { avisos.push(`lámina ${+lam.dataset.i + 1}: ${e.message}`); } });
      try { cursor(esc, lam, r); } catch (e) { avisos.push(`lámina ${+lam.dataset.i + 1}: cursor (${e.message})`); }
      // El fondo atenuado de «foco» es un estado final: sus trazos no se vuelven a animar
      if (esc !== lam) svg.querySelectorAll('path').forEach(p => (p.dataset.fijo = '1'));
    });
  }

  // ---------- revelado y animación ----------
  // Paso de un trazo: el suyo o el del grupo que lo contiene (las series de una gráfica lo llevan en su <g>)
  const pasoTrazo = e => (e.dataset.p != null ? +e.dataset.p : pasoDe(e));
  function mostrar(lam, paso, t) {
    const fin = !isFinite(t), suave = document.body.dataset.anim === 'suave';
    lam.querySelectorAll('[data-p]').forEach(e => {
      if (e.closest('defs')) return;
      e.classList.toggle('oculto', +e.dataset.p > paso);
    });
    // data-hasta: el elemento se va DESPUÉS de su paso (la mano y las estrellas de una calificación que no acumula)
    lam.querySelectorAll('[data-hasta]').forEach(e => e.classList.toggle('pasado', paso > +e.dataset.hasta));
    lam.querySelectorAll('[data-atenuar]').forEach(e => e.classList.toggle('atenuado-paso', paso >= +e.dataset.atenuar));
    // En modo seco (el del video) la tinta a mano ENTRA COMPLETA con su elemento, en el mismo cuadro del corte
    // [ráfagas k_underline 0:41.2, c_alcancia 1:44.5, f_flechas 7:30.1]. Solo crece la ruta punteada que arrastra la
    // mano (su máscara) [d_123 1:55.6-1:55.9]. El dibujado progresivo queda para `animacion: "suave"`.
    lam.querySelectorAll('[data-trazo]').forEach(e => {
      const p = pasoTrazo(e), dur = +e.dataset.dur || 300, ret = +e.dataset.retraso || 0;
      const crece = suave || e.closest('mask');
      const k = fin || p < paso || e.dataset.fijo ? 1 : p > paso ? 0 : crece ? easeOut(clamp((t - ret) / dur)) : 1;
      e.style.strokeDashoffset = String(1 - k);
    });
    lam.querySelectorAll('[data-cabeza]').forEach(e => {
      const p = pasoTrazo(e); e.style.opacity = fin || p < paso || e.dataset.fijo ? 1 : p > paso ? 0 : !suave || t >= 280 ? 1 : 0;
    });
    const s = lam.querySelector('.sello[data-p]');
    if (s) {
      const p = +s.dataset.p; let sc = 1, o = 1, ox = 0;
      if (!fin && p === paso) {
        const k = clamp(t / 150);
        if (k < 1) { sc = 1.9 - 0.9 * k * k; o = clamp(k * 2.5); }
        else { const d = t - 150; ox = d < 180 ? Math.sin(d / 14) * (1 - d / 180) * 7 : 0; }
      }
      s.style.opacity = o; s.style.transform = `translate(-50%,-50%) translate(${ox}px,0) rotate(-5deg) scale(${sc * (+s.dataset.k || 1)})`;
    }
    lam.querySelectorAll('.cursor[data-p]').forEach(cur => {
      const p = +cur.dataset.p, onda = cur.parentElement.querySelector(':scope > .onda');
      const arrastra = cur.dataset.fx != null;
      let dx = 0, dy = 0, sc = 1, oo = 0, os = 20, cerrada = false;
      if (!fin && p === paso) {
        const k = easeInOut(clamp(t / 560)); dx = (1 - k) * 280; dy = (1 - k) * 210;
        if (t > 600 && t < 740) sc = 0.86;
        if (t > 600 && t < 1050) { const q = (t - 600) / 450; oo = 0.9 * (1 - q); os = 20 + q * 110; }
        if (arrastra && t > 740) { const q = arrastre(cur, t); dx = q[0]; dy = q[1]; cerrada = q[2]; if (cerrada) sc = 0.85; }
      } else if (arrastra && (fin || p < paso)) { dx = +cur.dataset.fx; dy = +cur.dataset.fy; }
      cur.classList.toggle('cerrada', cerrada);
      cur.style.transform = `translate(${dx}px,${dy}px) scale(${sc})`; cur.style.transformOrigin = '40% 5%';
      if (onda) Object.assign(onda.style, { opacity: oo, width: os + 'px', height: os + 'px' });
    });
    if (suave) {
      lam.querySelectorAll('.nota[data-p]').forEach(n => {
        const p = +n.dataset.p, k = fin || p < paso ? 1 : p > paso ? 0 : easeOut(clamp(t / 750));
        n.style.clipPath = k >= 1 ? '' : `inset(-20% ${(100 - k * 100).toFixed(1)}% -20% -5%)`;
      });
      lam.querySelectorAll('[data-p] > .emo, [data-p] > div > .emo').forEach(e => {
        const p = +e.closest('[data-p]').dataset.p;
        const k = fin || p !== paso ? 1 : clamp(t / 220), sc = k >= 1 ? 1 : 0.7 + 0.3 * easeOut(k) + Math.sin(k * Math.PI) * 0.08;
        e.style.transform = sc === 1 ? '' : `scale(${sc})`;
      });
    }
  }
  // Arrastre [1:55]: la mano cerrada sigue la punta de cada tramo de la ruta punteada (el mismo avance que su
  // máscara) y, al terminar, vuelve a la mano de dedo sobre la última tecla. Devuelve [dx, dy, cerrada].
  function arrastre(cur, t) {
    const lam = cur.closest('.lamina');
    const tramos = [...lam.querySelectorAll('.capa-mano path[data-arrastre]')].sort((p, q) => p.dataset.arrastre - q.dataset.arrastre);
    const tx = +cur.dataset.tx, ty = +cur.dataset.ty, fx = +cur.dataset.fx, fy = +cur.dataset.fy;
    if (!tramos.length) return [fx, fy, false];
    const ini = e => +e.dataset.retraso || 0, dur = e => +e.dataset.dur || 700;
    const ult = tramos[tramos.length - 1], tFin = ini(ult) + dur(ult);
    const puntaDe = (e, k) => { const L = e.getTotalLength(), q = e.getPointAtLength(clamp(k) * L); return [q.x - tx, q.y - ty]; };
    if (t >= tFin + 250) return [fx, fy, false];
    if (t >= tFin) { const [ex, ey] = puntaDe(ult, 1), k = easeOut((t - tFin) / 250); return [ex + (fx - ex) * k, ey + (fy - ey) * k, k < 1]; }
    if (t < ini(tramos[0])) return [0, 0, false];
    const e = tramos.find(x => t < ini(x) + dur(x)) || ult;
    const k = easeOut(clamp((t - ini(e)) / dur(e)));
    const [ex, ey] = puntaDe(e, k);
    // al salir de la tecla del clic la mano se desliza hasta la punta del trazo (sin salto de un cuadro)
    const b = e === tramos[0] ? clamp(k * 3) : 1;
    return [ex * b, ey * b, true];
  }
  const pasos = lam => Math.max(1, Math.floor(+lam.dataset.pasos) || 1);
  const animaDur = (lam, paso) => {
    if (lam.querySelector(`.cursor[data-p="${paso}"]`)) {
      // con arrastre, hasta que la mano llega a la última tecla
      let fin = 1100;
      lam.querySelectorAll('.capa-mano path[data-arrastre]').forEach(e => { if (+e.dataset.p === paso) fin = Math.max(fin, (+e.dataset.retraso || 0) + (+e.dataset.dur || 700) + 300); });
      return fin;
    }
    if (lam.querySelector(`.sello[data-p="${paso}"]`)) return 400;
    let m = 0;
    // en seco solo cuenta lo que crece (la máscara de la ruta punteada); la tinta a mano entra completa y no suma
    const suave = document.body.dataset.anim === 'suave';
    lam.querySelectorAll('[data-trazo]').forEach(e => {
      if (pasoTrazo(e) !== paso || (!suave && !e.closest('mask'))) return;
      m = Math.max(m, (+e.dataset.dur || 300) + (+e.dataset.retraso || 0));
    });
    if (document.body.dataset.anim === 'suave' && lam.querySelector(`.nota[data-p="${paso}"]`)) m = Math.max(m, 750);
    return m;
  };

  // ---------- arranque ----------
  async function preparar() {
    try { await document.fonts.ready; } catch (e) {}
    await Promise.all([...document.images].map(i => (i.complete ? null : new Promise(res => { i.onload = i.onerror = res; }))));
    const lams = [...document.querySelectorAll('.lamina')];
    lams.forEach(l => mostrar(l, pasos(l) - 1, Infinity));
    // Una lámina con un error no tumba al resto: se avisa y se sigue
    lams.forEach(l => { try { encajar(l); } catch (e) { avisos.push(`lámina ${+l.dataset.i + 1}: encaje (${e.message})`); } });
    lams.forEach(l => { try { acomodarFoco(l); } catch (e) { avisos.push(`lámina ${+l.dataset.i + 1}: foco (${e.message})`); } });
    lams.forEach(l => { try { dibujar(l); } catch (e) { avisos.push(`lámina ${+l.dataset.i + 1}: capa a mano (${e.message})`); } });
    lams.forEach(l => { try { colocarSello(l); } catch (e) { avisos.push(`lámina ${+l.dataset.i + 1}: sello (${e.message})`); } });
    lams.forEach(l => mostrar(l, pasos(l) - 1, Infinity));
    return lams;
  }

  const modo = new URLSearchParams(location.search).get('modo') || 'presentador';
  document.body.classList.add(modo === 'presentador' ? 'preparando' : modo);
  // El presentador y la vista de ensayo viven en templates/presentador.js y arrancan sobre PZ.listo
  window.PZ = { mostrar, pasos, animaDur, avisos, modo, listo: null };
  window.PZ.listo = preparar().then(lams => { window.PZ.lams = lams; return lams.length; });
})();
