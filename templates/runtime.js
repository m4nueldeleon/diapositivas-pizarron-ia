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
    if (o.clase) e.dataset.clase = o.clase;   // qa.mjs revisa que las flechas no crucen texto y que el sello no corte subrayados ni tachones
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

  const TONO = { r: C.rojo, v: '#22a812', n: C.negro };
  function conexion(c, esc, lam, svg, r) {
    const ea = c.de ? ancla(esc, c.de) : null, eb = ancla(esc, c.a);
    if ((!ea && c.estilo !== 'entrada') || !eb) {
      const hay = [...new Set(dentro(esc, '[data-a]').map(e => e.dataset.a))].slice(0, 14).join(', ');
      avisos.push(`lámina ${+lam.dataset.i + 1}: falta el ancla «${!eb ? c.a : c.de}» (anclas de esta lámina: ${hay})`); return;
    }
    const A = ea ? caja(ea, lam) : null, B = caja(eb, lam), p = c.p || 0;
    let pts, color = C.rojo, ancho = 7, len = 30, abre = 0.5;
    switch (c.estilo) {
      case 'converge': {
        // Flechas que salen de las celdas de una columna y convergen en la pregunta [7:30, f_flechas]: salen casi
        // horizontales por la derecha de la celda y se abren en abanico hasta el borde izquierdo de la nota.
        const P = [A.x + A.w + 18, A.cy], n = Math.max(1, c.n || 1), off = ((c.i || 0) - (n - 1) / 2) * Math.min(22, B.h / (n + 1));
        const Q = [B.x - 16, B.cy + off];
        pts = cubica(P, [P[0] + (Q[0] - P[0]) * 0.45, P[1]], [Q[0] - (Q[0] - P[0]) * 0.25, Q[1]], Q);
        ancho = 3.6; len = 18; break;
      }
      case 'entrada': {
        // Flecha larga que entra desde el borde del lienzo hasta el ancla [15:00]: plumón rojo casi recto
        const W = lam.offsetWidth, H = lam.offsetHeight, lado = c.lado || 'derecha';
        const P = lado === 'izquierda' ? [24, B.cy] : lado === 'arriba' ? [B.cx, 24] : lado === 'abajo' ? [B.cx, H - 24] : [W - 24, B.cy];
        const Q = borde(B, P, 14);
        pts = linea(P, Q, r, 2.4); color = TONO[c.tono] || C.rojo; ancho = 7; len = 30;
        break;
      }
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
        pts = cuadratica(P, Q, [(P[0] + Q[0]) / 2 + dy * 0.35 * s, (P[1] + Q[1]) / 2 - dx * 0.35 * s]); ancho = c.fina ? 3.6 : 5; len = c.fina ? 18 : 24;
        if (c.tono) color = TONO[c.tono] || C.rojo;
        break;
      }
      case 'retorno': {
        // Arco de retorno [12:45]: arriba, de la punta de un emoji a la de otro anterior, pasando por encima de la fila
        // (negro, «70% 💵»); abajo, del pie del nodo al nodo aparte bajo la primera columna (verde, «30% 💵»). La etiqueta
        // manuscrita (HTML, con su emoji) se pone en el vértice, del lado de afuera.
        const col = c.tono === 'v' ? '#22a812' : c.tono === 'r' ? C.rojo : C.negro;
        let M;
        if (c.lado === 'abajo') {
          const P = [A.cx, A.y + A.h + 14];
          const Q = c.a === 'aparte' ? [B.x + B.w + 22, B.cy] : [B.cx, B.y + B.h + 14];
          pts = c.a === 'aparte' ? cuadratica(P, Q, [P[0], Q[1]]) : cuadratica(P, Q, [(P[0] + Q[0]) / 2, Math.max(P[1], Q[1]) + Math.min(220, Math.abs(Q[0] - P[0]) * 0.3)]);
          M = pts[Math.floor(pts.length / 2)]; M = [M[0], M[1] + 46];
        } else {
          const P = [A.cx, A.y - 14], Q = [B.cx, B.y - 14];
          pts = cuadratica(P, Q, [(P[0] + Q[0]) / 2, Math.min(P[1], Q[1]) - Math.min(220, Math.abs(Q[0] - P[0]) * 0.3)]);
          M = pts[Math.floor(pts.length / 2)]; M = [M[0], M[1] - 46];
        }
        color = col; ancho = c.tono === 'n' || !c.tono ? 8 : 6; len = 30; abre = 0.55;
        const et = esc.querySelector(`.retorno-et[data-retorno="${c.ret}"]`), fila = et && et.parentElement;
        if (et && fila) {
          const F = caja(fila, lam), z = F.w / (fila.offsetWidth || 1) || 1;
          et.style.left = (M[0] - F.x) / z + 'px'; et.style.top = (M[1] - F.y) / z + 'px';
        }
        const fl = trazo(svg, suave(pts), { color, ancho, p, dur: 420, clase: 'flecha', estilo: 'retorno' });
        Object.assign(fl.dataset, { de: c.de, a: c.a });
        trazo(svg, cabezaV(pts[pts.length - 1], angulo(pts), len, abre, r), { color, ancho, p, cabeza: true, clase: 'punta' });
        return;
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
        // Llave alta [c_0635]: las puntas ~24 px bajo el centro de cada rama, los brazos bajan en curva amplia ~9% del alto
        // hasta el tramo horizontal y el pico baja otro ~5% hasta ~36 px sobre la nota. La altura sale del alto de la
        // lámina (el hueco lo reserva bifurcacion() en layouts-texto.mjs), no del hueco: antes medía ~65 px y se veía chata.
        const H = lam.offsetHeight, Wl = lam.offsetWidth;
        const P = [A.cx, A.y + A.h + 24], Q = [B.cx, B.y + B.h + 24], M = [V.cx, V.y - 36];
        const y = Math.max(Math.max(P[1], Q[1]) + 40, M[1] - 0.05 * H), ab = Math.max(40, Math.min(90, (M[1] - y) * 1.2));
        const brazo = (O, s) => cubica(O, [O[0], y - 10], [O[0] + s * 0.06 * Wl, y], [M[0] - s * ab, y], 22)
          .concat(cubica([M[0] - s * ab, y], [M[0] - s * ab * 0.35, y], [M[0] - s * 6, M[1] - (M[1] - y) * 0.3], M, 8).slice(1));
        const iz = brazo(P, 1), de = brazo(Q, -1);
        trazo(svg, suave(iz), { color: C.rojo, ancho: 5, p, dur: 420 });
        trazo(svg, suave(de), { color: C.rojo, ancho: 5, p, dur: 420 });
        trazo(svg, cabezaV(P, -Math.PI / 2, 20, 0.45, r), { color: C.rojo, ancho: 5, p, cabeza: true });
        trazo(svg, cabezaV(Q, -Math.PI / 2, 20, 0.45, r), { color: C.rojo, ancho: 5, p, cabeza: true });
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
        if (!esCaja) { trazo(svg, suave(linea([b.x - 10, y + 4], [b.x + b.w + 10, y - 4], r, 2, 4)), { color: C.rojo, ancho: 7, p, dur: 240, no: true, clase: 'tachon' }); return; }
        // Descarte de lista [m_256 4:16]: plumón grueso (~10 px de núcleo) que arranca antes de la viñeta y sale por la
        // derecha, casi horizontal, con un segundo pase más claro que le da el borde áspero
        trazo(svg, suave(linea([b.x - 20, y + 2], [b.x + b.w + 24, y - 2], r, 1.6, 4)), { color: C.rojo, ancho: 10.5, p, dur: 240, no: true, clase: 'tachon' });
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
  // ---------- fila de nodos hermanos (flujo): todas las etiquetas con el mismo número de renglones ----------
  // Con columnas iguales, una etiqueta de 4 palabras («Le dan la otra») era la única que podía partirse y la fila salía
  // 1 / 2 / 1 renglones [r3, neuroventas 07]. Se mide cada etiqueta en un renglón; si la fila no cabe en el ancho útil,
  // baja el hueco (hasta 90 px, salvo `separacion` del autor) y luego la letra de TODAS por igual (de 4 en 4 px, hasta
  // 60 px con ≤ 3 nodos o la base con más); si ni así cabe, TODAS se parten balanceadas con la misma letra.
  function igualarFilas(lam) {
    lam.querySelectorAll('.fila-igual').forEach(fila => {
      const nodos = [...fila.children].filter(c => c.classList.contains('nodo') && !c.classList.contains('nodo-aparte')), n = nodos.length; if (n < 2) return;
      const etqs = nodos.map(nd => nd.querySelector(':scope > .etiqueta')).filter(Boolean); if (!etqs.length) return;
      const lz = fila.closest('.lienzo'); if (!lz) return;
      const cs = getComputedStyle(lz), util = lz.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const base = parseFloat(getComputedStyle(etqs[0]).fontSize) || 76, piso = n <= 3 ? Math.min(base, 60) : base;
      let gap = parseFloat(getComputedStyle(fila).columnGap) || 0;
      const fijo = fila.dataset.sepFija === '1';
      etqs.forEach(e => e.classList.add('corta'));
      const ancho = () => Math.max(...nodos.map(nd => Math.max(...[...nd.children].map(c => c.scrollWidth || c.offsetWidth))));
      const cabe = () => n * ancho() + (n - 1) * gap <= util;
      if (!cabe() && !fijo) { gap = Math.max(90, Math.min(gap, (util - n * ancho()) / (n - 1))); fila.style.gap = gap + 'px'; }
      let te = base;
      while (!cabe() && te - 4 >= piso) { te -= 4; nodos.forEach(nd => nd.style.setProperty('--te', te + 'px')); }
      if (!cabe()) etqs.forEach(e => e.classList.remove('corta'));
      fila.dataset.igualada = te + '';
    });
  }

  // ---------- flujo: el signo («+», «=») a la mitad entre los dos emojis, a su altura [28:40, 35:10] ----------
  function colocarSignos(lam) {
    lam.querySelectorAll('.fila-flujo').forEach(fila => {
      const F = fila.getBoundingClientRect(), z = F.width / (fila.offsetWidth || 1) || 1;
      fila.querySelectorAll(':scope > .signo').forEach(sg => {
        const i = +sg.dataset.signo;
        const a = fila.querySelector(`[data-a="n${i - 1}"]`), b = fila.querySelector(`[data-a="n${i}"]`);
        const ea = a && (a.querySelector('.emo, img') || a), eb = b && (b.querySelector('.emo, img') || b);
        if (!ea || !eb) return;
        const A = ea.getBoundingClientRect(), B = eb.getBoundingClientRect();
        sg.style.left = (((A.left + A.right) / 2 + (B.left + B.right) / 2) / 2 - F.left) / z + 'px';
        sg.style.top = (((A.top + A.bottom) / 2 + (B.top + B.bottom) / 2) / 2 - F.top) / z + 'px';
      });
    });
  }

  // ---------- anotaciones comunes: la nota junto a su ancla, del lado pedido, con aire para el gancho ----------
  // Sin `lado`, a la derecha si cabe y si no a la izquierda. `x`/`y` del autor la fijan. Se acota al lienzo.
  function colocarAnotaciones(lam) {
    const W = lam.offsetWidth, H = lam.offsetHeight, m = 40, aire = 130;
    lam.querySelectorAll(':scope > .anotacion[data-sobre]').forEach(n => {
      if (n.dataset.fija) return;
      const el = ancla(lam, n.dataset.sobre); if (!el) return;   // la conexión avisa que falta el ancla
      // sobre una captura, la nota va FUERA de ella (al lado del ancla, a la altura de lo que señala) [28:35]
      const A0 = caja(el, lam), cap = el.closest('.captura'), R = cap && cap !== el ? caja(cap, lam) : A0;
      const B = { x: R.x, w: R.w, y: A0.y, h: A0.h, cx: A0.cx, cy: A0.cy }, w = n.offsetWidth, h = n.offsetHeight;
      const lado = n.dataset.lado || (B.x + B.w + aire + w <= W - m ? 'derecha' : 'izquierda');
      const Yv = lado === 'arriba' ? Math.min(A0.y, R.y) : Math.max(A0.y + A0.h, R.y + (cap ? R.h : 0));
      let x = lado === 'derecha' ? B.x + B.w + aire : lado === 'izquierda' ? B.x - aire - w : B.cx - w / 2;
      let y = lado === 'arriba' ? Yv - aire * 0.8 - h : lado === 'abajo' ? Yv + aire * 0.8 : B.cy - h / 2 - 60;
      x = clamp(x, m, W - m - w); y = clamp(y, m, H - m - h);
      Object.assign(n.style, { left: x + 'px', top: y + 'px' });
    });
  }

  // ---------- cuadrantes: emoji y primer renglón a la misma altura en los bloques de una fila ----------
  // Con la letra a 84 px [ref_628] un texto se parte en 3 renglones y su vecino en 2; centrado cada uno por su cuenta,
  // los emojis quedaban a ~50 px de distinta altura [r3, neuroventas 14]. El texto de cada bloque toma el alto del más
  // alto de su fila, así los dos centran el mismo bloque y el emoji cae en la misma línea.
  function igualarCuadros(lam) {
    lam.querySelectorAll('.cuadrantes').forEach(g => {
      const filas = new Map();
      [...g.children].forEach(c => { const k = Math.round(c.offsetTop); if (!filas.has(k)) filas.set(k, []); filas.get(k).push(c); });
      filas.forEach(cs => {
        const txt = cs.map(c => c.lastElementChild).filter(Boolean); if (txt.length < 2) return;
        txt.forEach(t => { t.style.minHeight = ''; });
        const alto = Math.max(...txt.map(t => t.offsetHeight));
        txt.forEach(t => { t.style.minHeight = alto + 'px'; });
      });
    });
  }

  // ---------- tabla-marcador: la letra baja (de 4 en 4, hasta 40 px) si la tabla no cabe en el lienzo o una celda
  // llega a 3 renglones. Así la letra grande de las tablas cortas nunca rompe una tabla densa [r4, c_0545].
  function ajustarTablas(lam) {
    lam.querySelectorAll('table.tabla[data-ajusta]').forEach(t => {
      const lz = t.closest('.lienzo'); if (!lz) return;
      const cs = getComputedStyle(lz), alto = lz.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const tam = sel => parseFloat(getComputedStyle(t.querySelector(sel) || t).fontSize) || 44;
      const tres = sel => [...t.querySelectorAll(sel)].some(e => rectsTexto(e, lam).length >= 3);
      // primero la columna de etiquetas sola (una etiqueta larga en una columna angosta no encoge toda la tabla)…
      let tde = tam('td.fila-et'), td = tam('td:not(.fila-et)'), guard = 0;
      while (tres('td.fila-et') && tde - 4 >= 40 && guard++ < 12) { tde -= 4; t.style.setProperty('--tde', tde + 'px'); }
      // …luego todo, si la tabla no cabe o una celda de datos llega a 3 renglones
      const sobra = () => t.offsetHeight > alto + 2 || tres('td:not(.fila-et), th');
      while (sobra() && td - 4 >= 40 && guard++ < 24) {
        td -= 4; tde = Math.min(tde, td);
        t.style.setProperty('--td', td + 'px'); t.style.setProperty('--tde', tde + 'px'); t.style.setProperty('--tt', Math.max(Math.round(td * 1.1), 44) + 'px');
      }
    });
  }

  // ---------- cifra: la ecuación va en UN renglón [3:10, 3:15] ----------
  // «2 × 4 semanas = 8 videos al mes» a 140 px bajaba «al mes» solo y el subrayado salía en dos trozos. Antes de medir y
  // dibujar la capa a mano, cada cifra se prueba sin cortes; si no cabe en el ancho útil, TODAS las líneas de la cifra
  // bajan juntas (de 4% en 4%, conservando la jerarquía) hasta 96 px la línea más grande (72 si son varias). Si ni así
  // cabe, se parte balanceada y queda marcada (data-cifra-partida) para QA.
  function ajustarCifras(lam) {
    const grupos = new Set([...lam.querySelectorAll('.cifra')].map(c => c.parentElement));
    grupos.forEach(g => {
      const cs = [...g.children].filter(c => c.classList.contains('cifra')); if (!cs.length) return;
      const lz = g.closest('.lienzo'); if (!lz) return;
      const st = getComputedStyle(lz), util = lz.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight);
      cs.forEach(c => { c.style.whiteSpace = 'nowrap'; });
      const tams = cs.map(c => parseFloat(getComputedStyle(c).fontSize) || 84);
      const piso = cs.length > 1 ? 72 : 96, mayor = Math.max(...tams);
      const cabe = () => cs.every(c => c.scrollWidth <= Math.min(util, c.clientWidth || util) + 1);
      let k = 1;
      while (!cabe() && mayor * k * 0.96 >= piso) { k *= 0.96; cs.forEach((c, i) => c.style.setProperty('--tc', (tams[i] * k).toFixed(1) + 'px')); }
      if (!cabe()) cs.forEach(c => { if (c.scrollWidth > (c.clientWidth || util) + 1) { c.style.whiteSpace = ''; c.dataset.cifraPartida = '1'; } });
    });
  }

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

  // ---------- foco: dónde va la frase sobre el fondo atenuado ----------
  // En la referencia [15:20–15:23, h_pill] la frase va CENTRADA y puede cruzar texto del fondo atenuado a ~10–15%
  // («Your bank account.» queda debajo). Solo se mueve a un hueco entre renglones si ese hueco queda cerca del centro
  // (≤ 120 px); un hueco lejano la convertía en pie de foto del último renglón [r4, sin-mostrar-cara 20]. Si no hay
  // hueco cercano, se queda centrada y el fondo baja a 0.1 (salvo que el autor fijara `opacidad`). Con `anclar` no se toca.
  const FOCO_DESVIO = 120, FOCO_AIRE = 48;
  function acomodarFoco(lam) {
    const lz = lam.querySelector(':scope > .lienzo.foco-frase'), clon = lam.querySelector(':scope > .escena.clon');
    if (!lz || !clon || lz.dataset.anclar) return;
    const pila = lz.firstElementChild; if (!pila) return;
    const H = lam.offsetHeight, P = caja(pila, lam), pad = 18;
    const TXT = '.t, .nota, .item, .etiqueta, .valor, .encabezado, .cifra, .etiqueta-chica, .tarjeta, .opcion, .burbuja, .titulo-marca, .fuente';
    const rs = [...clon.querySelectorAll(TXT)].filter(e => !e.querySelector(TXT)).flatMap(e => rectsTexto(e, lam))
      .concat([...clon.querySelectorAll('svg text')].filter(t => t.textContent.trim()).map(t => caja(t, lam)))
      .filter(r => r.h >= 30 && r.x < P.x + P.w && r.x + r.w > P.x);
    const choca = y0 => rs.some(r => r.y < y0 + P.h + pad && r.y + r.h > y0 - pad);
    if (!rs.length || !choca(P.y)) return;
    // huecos verticales libres (dentro de los márgenes) donde cabe la frase con aire arriba y abajo
    const mv = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--margen-v')) || 60;
    const ocup = rs.map(r => [r.y - FOCO_AIRE, r.y + r.h + FOCO_AIRE]).sort((a, b) => a[0] - b[0]);
    const libres = []; let y = mv * 0.6;
    ocup.forEach(([a, b]) => { if (a - y >= P.h) libres.push([y, a]); y = Math.max(y, b); });
    if (H - mv * 0.6 - y >= P.h) libres.push([y, H - mv * 0.6]);
    const centro = H / 2;
    const cands = libres.map(([a, b]) => clamp(centro, a + P.h / 2, b - P.h / 2))
      .filter(c => Math.abs(c - centro) <= FOCO_DESVIO).sort((p, q) => Math.abs(p - centro) - Math.abs(q - centro));
    if (cands.length) {
      Object.assign(pila.style, { position: 'relative', top: (cands[0] - (P.y + P.h / 2)).toFixed(1) + 'px' });
      lam.dataset.focoMovido = '1';
    } else {
      lam.dataset.focoSobreFondo = '1';
      if (!clon.dataset.opFija) clon.style.opacity = '0.1';
    }
  }

  /*@@SELLO@@*/  // templates/runtime-sello.js (construir.mjs lo inserta aquí, dentro de este mismo ámbito)

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
      // El fondo atenuado de «foco» es un estado final: sus trazos no se vuelven a animar y todos van en el paso 0 (el
      // foco solo tiene ese paso; un trazo con otro paso se ocultaba y el fondo perdía tinta)
      if (esc !== lam) svg.querySelectorAll('path, text').forEach(p => { p.dataset.fijo = '1'; if (p.dataset.p != null) p.dataset.p = '0'; });
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
    // opciones: las no elegidas se apagan en el paso del clic (antes, la encuesta ya mostraba la respuesta)
    lam.querySelectorAll('[data-apagar-p]').forEach(e => e.classList.toggle('apagada', paso >= +e.dataset.apagarP));
    lam.querySelectorAll('[data-oscuro-p]').forEach(e => e.classList.toggle('encendido', paso >= +e.dataset.oscuroP));
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
    lams.forEach(l => { try { igualarFilas(l); } catch (e) { avisos.push(`lámina ${+l.dataset.i + 1}: fila (${e.message})`); } });
    lams.forEach(l => { try { colocarSignos(l); } catch (e) { avisos.push(`lámina ${+l.dataset.i + 1}: signos (${e.message})`); } });
    lams.forEach(l => { try { igualarCuadros(l); } catch (e) { avisos.push(`lámina ${+l.dataset.i + 1}: cuadrantes (${e.message})`); } });
    lams.forEach(l => { try { ajustarCifras(l); } catch (e) { avisos.push(`lámina ${+l.dataset.i + 1}: cifra (${e.message})`); } });
    lams.forEach(l => { try { ajustarTablas(l); } catch (e) { avisos.push(`lámina ${+l.dataset.i + 1}: tabla (${e.message})`); } });
    lams.forEach(l => { try { encajar(l); } catch (e) { avisos.push(`lámina ${+l.dataset.i + 1}: encaje (${e.message})`); } });
    lams.forEach(l => { try { acomodarFoco(l); } catch (e) { avisos.push(`lámina ${+l.dataset.i + 1}: foco (${e.message})`); } });
    lams.forEach(l => { try { colocarAnotaciones(l); } catch (e) { avisos.push(`lámina ${+l.dataset.i + 1}: anotaciones (${e.message})`); } });
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
