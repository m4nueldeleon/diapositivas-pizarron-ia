/* runtime.js — corre dentro del HTML de las láminas.
   1) Mide el DOM ya maquetado y dibuja la capa a mano (flechas, subrayados, llaves, círculos, rutas).
   2) Controla el revelado por pasos y las micro-animaciones con una sola función determinista:
        PZ.mostrar(lamina, paso, t)   t = ms desde que empezó el paso (Infinity = estado final)
      La usan igual el presentador en vivo, el render de PNG y el render de video cuadro a cuadro. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const C = { rojo: '#c8101e', negro: '#161616', gris: '#7d7d7d', grisClaro: '#9a9a9a' };
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
  function rectsTexto(el, lam) {
    const rg = document.createRange(); rg.selectNodeContents(el);
    const L = lam.getBoundingClientRect(), s = escala(lam);
    return [...rg.getClientRects()].filter(r => r.width > 4).map(r => ({ x: (r.left - L.left) / s, y: (r.top - L.top) / s, w: r.width / s, h: r.height / s }));
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
  function cabezaLlena(Q, ang, len) {
    const a1 = ang + Math.PI - 0.42, a2 = ang + Math.PI + 0.42, b = [Q[0] + Math.cos(ang + Math.PI) * len * 0.72, Q[1] + Math.sin(ang + Math.PI) * len * 0.72];
    return `M${Q[0]} ${Q[1]} L${Q[0] + Math.cos(a1) * len} ${Q[1] + Math.sin(a1) * len} Q${b[0]} ${b[1]} ${Q[0] + Math.cos(a2) * len} ${Q[1] + Math.sin(a2) * len} Z`;
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
  function trazo(svg, d, o) {
    const e = document.createElementNS(NS, 'path');
    e.setAttribute('d', d);
    e.setAttribute('stroke', o.color || C.rojo);
    e.setAttribute('stroke-width', o.ancho || 6);
    e.setAttribute('fill', o.relleno || 'none');
    if (o.textura !== false && !o.relleno) e.setAttribute('filter', `url(#${svg.dataset.filtro})`);
    e.dataset.p = o.p || 0;
    if (o.cabeza) { e.dataset.cabeza = '1'; }
    else if (o.dash) {
      e.setAttribute('stroke-dasharray', o.dash);
      // una ruta punteada se «dibuja» con una máscara que avanza sobre ella
      const mid = 'm' + Math.random().toString(36).slice(2, 9);
      const m = document.createElementNS(NS, 'mask'); m.setAttribute('id', mid); m.setAttribute('maskUnits', 'userSpaceOnUse');
      const mp = document.createElementNS(NS, 'path');
      mp.setAttribute('d', d); mp.setAttribute('stroke', '#fff'); mp.setAttribute('stroke-width', (o.ancho || 4) + 10); mp.setAttribute('fill', 'none');
      mp.setAttribute('pathLength', '1'); mp.setAttribute('stroke-dasharray', '1 1'); mp.dataset.trazo = '1'; mp.dataset.p = o.p || 0; mp.dataset.dur = o.dur || 700;
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
    t.setAttribute('fill', o.color || C.rojo); t.dataset.p = o.p || 0; t.textContent = s; svg.appendChild(t);
  }
  function equis(svg, M, r, p, tam = 22) {
    const j = () => (r() - 0.5) * 4;
    trazo(svg, `M${M[0] - tam + j()} ${M[1] - tam + j()} L${M[0] + tam + j()} ${M[1] + tam + j()}`, { color: C.rojo, ancho: 8, p, dur: 120 });
    trazo(svg, `M${M[0] + tam + j()} ${M[1] - tam + j()} L${M[0] - tam + j()} ${M[1] + tam + j()}`, { color: C.rojo, ancho: 8, p, dur: 120 });
  }

  // ---------- conexiones entre anclas ----------
  function dentro(esc, sel) { return [...esc.querySelectorAll(sel)].filter(e => e.closest('.escena') === esc); }
  function ancla(esc, id) { return dentro(esc, `[data-a="${CSS.escape(id)}"]`)[0]; }

  function conexion(c, esc, lam, svg, r) {
    const ea = ancla(esc, c.de), eb = ancla(esc, c.a);
    if (!ea || !eb) { avisos.push(`lámina ${+lam.dataset.i + 1}: falta el ancla «${!ea ? c.de : c.a}»`); return; }
    const A = caja(ea, lam), B = caja(eb, lam), p = c.p || 0;
    let pts, cab = 'v', color = C.rojo, ancho = 7, len = 30;
    switch (c.estilo) {
      case 'arco': case 'arco-negro': {
        const P = [A.cx + A.w * 0.22, A.y - 16], Q = [B.cx - B.w * 0.22, B.y - 16];
        const d = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
        pts = cuadratica(P, Q, [(P[0] + Q[0]) / 2, Math.min(P[1], Q[1]) - d * 0.36]);
        if (c.estilo === 'arco-negro') { color = C.negro; ancho = 6; cab = 'llena'; len = 26; }
        break;
      }
      case 'codo': {
        const izq = B.cx < A.cx;
        const P = [izq ? A.x - 34 : A.x + A.w + 34, A.cy + 6], Q = [B.cx + (izq ? 20 : -20), B.y - 30];
        pts = cuadratica(P, Q, [Q[0], P[1]]); color = C.negro; ancho = 8; cab = 'llena'; len = 34; break;
      }
      case 'fina': {
        const P = borde(A, [B.cx, B.cy], 20), Q = borde(B, [A.cx, A.cy], 18);
        const dx = Q[0] - P[0], dy = Q[1] - P[1];
        pts = cuadratica(P, Q, [(P[0] + Q[0]) / 2 - dy * 0.3, (P[1] + Q[1]) / 2 + dx * 0.3]);
        color = C.gris; ancho = 3.6; len = 20; break;
      }
      case 'fina-abajo': {
        const P = [A.cx, A.y + A.h + 8], Q = [B.cx, B.y - 6];
        pts = linea(P, Q, r, 1.5, 4); color = C.gris; ancho = 3.6; len = 18; break;
      }
      case 'curva-roja': {
        const P = borde(A, [B.cx, B.cy], 16), Q = c.a && c.a.startsWith('cita') ? [B.x + 30, B.y - 14] : borde(B, [A.cx, A.cy], 12);
        const dx = Q[0] - P[0], dy = Q[1] - P[1], s = c.curva || (Q[0] < P[0] ? 1 : -1);
        const K = c.a && c.a.startsWith('cita') ? [Math.min(P[0], Q[0]) - 120, P[1] + (Q[1] - P[1]) * 0.25] : [(P[0] + Q[0]) / 2 + dy * 0.35 * s, (P[1] + Q[1]) / 2 - dx * 0.35 * s];
        pts = cuadratica(c.a && c.a.startsWith('cita') ? [A.x - 18, A.cy] : P, Q, K); ancho = 5; len = 24; break;
      }
      case 'punteada': {
        const o = c.onda || 1, arriba = o < 0;
        const P = [A.x + A.w + 14, A.cy + (arriba ? -A.h * 0.22 : A.h * 0.22)], Q = [B.x - 14, B.cy + (arriba ? -B.h * 0.22 : B.h * 0.22)];
        const d = Q[0] - P[0], alto = (arriba ? -1 : 1) * Math.max(90, d * 0.42);
        pts = cubica(P, [P[0] + d * 0.12, P[1] + alto], [Q[0] - d * 0.2, Q[1] + alto * 0.9], Q);
        trazo(svg, suave(pts), { color: C.grisClaro, ancho: 4, dash: '7 11', p, textura: false, dur: 650 });
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
    trazo(svg, suave(pts), { color, ancho, p, dur: 300 });
    const Q = pts[pts.length - 1], ang = angulo(pts);
    if (cab === 'llena') trazo(svg, cabezaLlena(Q, ang, len), { relleno: color, color, ancho: 1, p, cabeza: true });
    else trazo(svg, cabezaV(Q, ang, len, 0.5, r), { color, ancho, p, cabeza: true });
    const M = pts[Math.floor(pts.length / 2)];
    if (c.tachada) equis(svg, M, r, p);
    if (c.etiqueta) texto(svg, M[0], M[1] - (c.tachada ? 44 : 26), c.etiqueta, { p });
  }

  // ---------- marcas sobre texto e imágenes ----------
  const pasoDe = e => +((e.closest('[data-p]') || {}).dataset || {}).p || 0;
  function subrayados(esc, lam, svg, r) {
    dentro(esc, '[data-sub]').forEach(el => rectsTexto(el, lam).forEach(b => {
      const y = b.y + b.h * 0.93;
      trazo(svg, suave(linea([b.x + 2, y + 1], [b.x + b.w - 2, y - 2 + (r() - 0.5) * 3], r, 1.6, 5)), { color: C.rojo, ancho: 4.4, p: pasoDe(el), dur: 280 });
    }));
    dentro(esc, '[data-tachar]').forEach(el => {
      const p = el.dataset.tacharP != null ? +el.dataset.tacharP : pasoDe(el);
      let rs = rectsTexto(el, lam);
      if (el.dataset.tachar === 'caja' && rs.length) {          // ítem de lista: cada renglón, y el primero desde la viñeta
        const B = caja(el, lam); rs = rs.map((b, i) => (i ? b : { ...b, w: b.w + (b.x - B.x), x: B.x }));
      }
      rs.forEach(b => {
        const y = b.y + b.h * 0.54;
        trazo(svg, suave(linea([b.x - 10, y + 4], [b.x + b.w + 10, y - 4], r, 2, 4)), { color: C.rojo, ancho: 7, p, dur: 240 });
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
    const b = caja(el, lam), cur = esc.querySelector(':scope > .cursor'), onda = esc.querySelector(':scope > .onda');
    const mano = cur.dataset.tipo !== 'flecha', W = mano ? 104 : 72, H = mano ? 119 : 106;
    const tx = b.x + b.w * (mano ? (b.w > 300 ? 0.84 : 0.6) : 0.74), ty = b.y + b.h * (mano ? 0.56 : 0.62);
    const px = tx - W * (mano ? 0.41 : 0.08), py = ty - H * (mano ? 0.03 : 0.05);
    Object.assign(cur.style, { width: W + 'px', height: H + 'px', left: px + 'px', top: py + 'px' });
    Object.assign(onda.style, { left: tx + 'px', top: ty + 'px' });
  }

  // Si el contenido no cabe en el lienzo (formatos verticales, textos largos), se reduce con zoom
  // real para que la capa a mano se dibuje sobre las posiciones finales. QA avisa si baja de 80%.
  function encajar(lam) {
    [lam, ...lam.querySelectorAll('.escena')].forEach(esc => esc.querySelectorAll(':scope > .lienzo').forEach(lz => {
      const h = lz.firstElementChild; if (!h || h.classList.contains('cuadrantes')) return;
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
  function mostrar(lam, paso, t) {
    const fin = !isFinite(t), suave = document.body.dataset.anim === 'suave';
    lam.querySelectorAll('[data-p]').forEach(e => {
      if (e.closest('defs')) return;
      e.classList.toggle('oculto', +e.dataset.p > paso);
    });
    lam.querySelectorAll('[data-atenuar]').forEach(e => e.classList.toggle('atenuado-paso', paso >= +e.dataset.atenuar));
    lam.querySelectorAll('[data-trazo]').forEach(e => {
      const p = +e.dataset.p, dur = +e.dataset.dur || 300, ret = +e.dataset.retraso || 0;
      const k = fin || p < paso || e.dataset.fijo ? 1 : p > paso ? 0 : easeOut(clamp((t - ret) / dur));
      e.style.strokeDashoffset = String(1 - k);
    });
    lam.querySelectorAll('[data-cabeza]').forEach(e => {
      const p = +e.dataset.p; e.style.opacity = fin || p < paso || e.dataset.fijo ? 1 : p > paso ? 0 : (t >= 280 ? 1 : 0);
    });
    const s = lam.querySelector('.sello[data-p]');
    if (s) {
      const p = +s.dataset.p; let sc = 1, o = 1, ox = 0;
      if (!fin && p === paso) {
        const k = clamp(t / 150);
        if (k < 1) { sc = 1.9 - 0.9 * k * k; o = clamp(k * 2.5); }
        else { const d = t - 150; ox = d < 180 ? Math.sin(d / 14) * (1 - d / 180) * 7 : 0; }
      }
      s.style.opacity = o; s.style.transform = `translate(-50%,-50%) translate(${ox}px,0) rotate(-5deg) scale(${sc})`;
    }
    lam.querySelectorAll('.cursor[data-p]').forEach(cur => {
      const p = +cur.dataset.p, onda = cur.parentElement.querySelector(':scope > .onda');
      let dx = 0, dy = 0, sc = 1, oo = 0, os = 20;
      if (!fin && p === paso) {
        const k = easeInOut(clamp(t / 560)); dx = (1 - k) * 280; dy = (1 - k) * 210;
        if (t > 600 && t < 740) sc = 0.86;
        if (t > 600 && t < 1050) { const q = (t - 600) / 450; oo = 0.9 * (1 - q); os = 20 + q * 110; }
      }
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
  const pasos = lam => Math.max(1, Math.floor(+lam.dataset.pasos) || 1);
  const animaDur = (lam, paso) => {
    if (lam.querySelector(`.cursor[data-p="${paso}"]`)) return 1100;
    if (lam.querySelector(`.sello[data-p="${paso}"]`)) return 400;
    let m = 0;
    lam.querySelectorAll(`[data-trazo][data-p="${paso}"]`).forEach(e => (m = Math.max(m, (+e.dataset.dur || 300) + (+e.dataset.retraso || 0))));
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
    lams.forEach(l => { try { dibujar(l); } catch (e) { avisos.push(`lámina ${+l.dataset.i + 1}: capa a mano (${e.message})`); } });
    lams.forEach(l => mostrar(l, pasos(l) - 1, Infinity));
    return lams;
  }

  function presentador(lams) {
    document.body.classList.add('presentador');
    const barra = document.createElement('div'); barra.className = 'barra-pres'; barra.innerHTML = '<i></i>'; document.body.appendChild(barra);
    const seq = []; lams.forEach((l, i) => { if (l.dataset.tipo === 'camara') seq.push({ i, p: 0 }); else for (let p = 0; p < pasos(l); p++) seq.push({ i, p }); });
    let pos = Math.min(seq.length - 1, Math.max(0, parseInt((location.hash || '').slice(1), 10) || 0)), raf = 0;
    function ajustar(l) {
      const s = Math.min(innerWidth / l.offsetWidth, innerHeight / l.offsetHeight);
      l.style.left = '0'; l.style.top = '0';
      l.style.transform = `translate(${(innerWidth - l.offsetWidth * s) / 2}px, ${(innerHeight - l.offsetHeight * s) / 2}px) scale(${s})`;
    }
    function ir(n, animar) {
      pos = Math.max(0, Math.min(seq.length - 1, n)); cancelAnimationFrame(raf);
      const { i, p } = seq[pos], l = lams[i];
      lams.forEach(x => x.classList.toggle('activa', x === l)); ajustar(l);
      barra.firstChild.style.width = ((pos + 1) / seq.length * 100) + '%';
      history.replaceState(null, '', '#' + pos);
      if (!animar) { mostrar(l, p, Infinity); return; }
      const t0 = performance.now(), dur = animaDur(l, p) + 80;
      const tick = () => { const t = performance.now() - t0; mostrar(l, p, t); if (t < dur) raf = requestAnimationFrame(tick); else mostrar(l, p, Infinity); };
      tick();
    }
    addEventListener('keydown', e => {
      if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); ir(pos + 1, true); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); ir(pos - 1, false); }
      else if (e.key === 'Home') ir(0, false); else if (e.key === 'End') ir(seq.length - 1, false);
      else if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
    });
    addEventListener('click', e => ir(pos + (e.clientX < innerWidth * 0.25 ? -1 : 1), e.clientX >= innerWidth * 0.25));
    addEventListener('resize', () => ajustar(lams[seq[pos].i]));
    ir(pos, false);
  }

  const modo = new URLSearchParams(location.search).get('modo') || 'presentador';
  document.body.classList.add(modo === 'presentador' ? 'preparando' : modo);
  window.PZ = { mostrar, pasos, animaDur, avisos, listo: null };
  window.PZ.listo = preparar().then(lams => { window.PZ.lams = lams; if (modo === 'presentador') presentador(lams); return lams.length; });
})();
