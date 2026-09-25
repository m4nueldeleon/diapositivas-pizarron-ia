/* runtime-sello.js — dónde cae el sello (colocarSello y sus búsquedas). NO es un script suelto: construir.mjs lo
   inserta dentro de la función de runtime.js (en la marca SELLO) y usa sus utilidades (caja, clamp, ancla, rectsTexto,
   avisos). */
  // ---------- sello: tamaño y posición ----------
  // Se mide sin escala; k lo reduce si, girado −5°, no cabe en el lienzo (sellos largos, 9:16). Con `sello_sobre` se
  // centra en ese ancla [6:45: sobre la rejilla]. Sin posición NO cae al centro a ciegas: se busca el primer lugar que no
  // pise renglones, emojis ni la tinta a mano (subrayados, llaves, tachones, flechas): el centro, luego debajo del bloque
  // centrado, arriba, a su derecha, debajo a la derecha y las 9 zonas; cada lugar se prueba a 0.85 y a 0.7 y
  // gana el que menos tapa. Con `sello_pos` se respeta la zona del autor y solo se corre lo mínimo DENTRO de su lado.
  const ZONAS = { centro: [0.5, 0.5], arriba: [0.5, 0.27], abajo: [0.5, 0.73], izquierda: [0.28, 0.5], derecha: [0.72, 0.5],
    'arriba-izquierda': [0.28, 0.27], 'arriba-derecha': [0.72, 0.27], 'abajo-izquierda': [0.28, 0.73], 'abajo-derecha': [0.72, 0.73] };
  // R17 [juez r17]: el rótulo «Ejemplo ficticio» (.procedencia) también es obstáculo: el sello RESUELTO lo tapaba.
  const TXT_SELLO = '.t, .nota, .encabezado, .etiqueta, .burbuja, .chat-hora, .item, .valor, .cifra, .etiqueta-chica, .tarjeta, .opcion, .sub-etiqueta, .fuente, .procedencia, .titulo-marca';
  // Lo que el sello no debe tapar, medido una vez por lámina. `excluir`: el ancla de sello_sobre (sellarlo es a propósito).
  // Rejilla, cuadrantes y capturas se toleran, igual que en QA.
  function obstaculosSello(lam, excluir) {
    const fuera = e => e.getClientRects().length && !e.closest('.escena.clon') && !e.closest('.rejilla, .cuadrantes, .captura, .pruebas') && !(excluir && excluir.contains(e));
    const hojas = [...lam.querySelectorAll(TXT_SELLO)].filter(e => fuera(e) && !e.querySelector(TXT_SELLO));
    const renglones = hojas.flatMap(e => rectsTexto(e, lam));
    const iconos = [...lam.querySelectorAll('.yo-av, .otro-av, .emo, .firma')].filter(e => fuera(e) && (e.matches('.yo-av, .otro-av') || !e.closest('.yo-av, .otro-av'))).map(e => caja(e, lam));
    const puntos = [];
    const svg = lam.querySelector(':scope > .capa-mano');
    if (svg) svg.querySelectorAll('path').forEach(p => {
      if (p.closest('defs') || p.dataset.pase === '2') return;
      let L = 0; try { L = p.getTotalLength(); } catch (e) { return; }
      for (let t = 0; t <= L; t += 12) { const q = p.getPointAtLength(t); puntos.push([q.x, q.y]); }
    });
    return { renglones, iconos, puntos };
  }
  // Costo de un sello de w×h (sin escala) con factor k centrado en (cx, cy), girado −a: 0 = no toca nada
  function costoSello(obs, W, H, cx, cy, w, h, a, k, m, arriba = m, abajo = m) {
    const c = Math.cos(a), sn = Math.sin(a), sw = w * k, sh = h * k;   // del lienzo al marco del sello: se deshace con +a
    const bw = (sw * Math.cos(a) + sh * Math.sin(a)) / 2, bh = (sw * Math.sin(a) + sh * Math.cos(a)) / 2;
    const marco = (x, y, inf = 0) => { const u = (x - cx) * c - (y - cy) * sn, v = (x - cx) * sn + (y - cy) * c; return Math.abs(u) <= sw / 2 + inf && Math.abs(v) <= sh / 2 + inf; };
    const frac = r => { let n = 0; for (let i = 0; i <= 9; i++) for (let j = 0; j <= 4; j++) if (marco(r.x + (i / 9) * r.w, r.y + (j / 4) * r.h)) n++; return n / 50; };
    let t = 0;
    if (cx - bw < m - 0.5 || cx + bw > W - m + 0.5 || cy - bh < arriba - 0.5 || cy + bh > H - abajo + 0.5) t += 100;
    obs.renglones.forEach(r => { t += frac(r); });
    obs.iconos.forEach(r => { t += 4 * frac(r); });
    obs.puntos.forEach(([x, y]) => { if (marco(x, y, 24)) t += 0.05; });
    return t;
  }
  // Sello libre (sin sello_sobre ni sello_pos) que no cabe entero bajo el bloque: antes de encogerlo a 0.85/0.7, se sube
  // el lienzo lo que falte (sin cruzar el margen de arriba), como haría quien compone la lámina dejando sitio al remate.
  // Corre antes de las anotaciones y la capa a mano, que se miden ya con el lienzo en su lugar. El centro limpio no mueve nada.
  function reservarSelloLibre(lam) {
    const s = lam.querySelector(':scope > .sello:not([data-sobre]):not([data-pos])'), lz = lam.querySelector(':scope > .lienzo');
    if (!s || !lz || lam.querySelector(':scope > .escena')) return;
    const W = lam.offsetWidth, H = lam.offsetHeight, m = Math.max(40, Math.round(W * .03)), a = 5 * Math.PI / 180;   // R15: 3% lateral, como QA
    const margen = parseFloat(getComputedStyle(lam).getPropertyValue('--margen-v')) || 100;
    const abajo = Math.max(margen, lam.querySelector('.firma:not(.arriba)') ? 140 : margen);
    const tinta = s.querySelector('.sello-tinta');
    if (tinta) tinta.style.fontSize = Math.min(96, parseFloat(getComputedStyle(tinta).fontSize) || 96) + 'px';
    const bloques = [...lz.children].filter(e => e.getClientRects().length).map(e => caja(e, lam));
    if (!bloques.length) return;
    const x0 = Math.min(...bloques.map(b => b.x)), x1 = Math.max(...bloques.map(b => b.x + b.w));
    const y0 = Math.min(...bloques.map(b => b.y)), y1 = Math.max(...bloques.map(b => b.y + b.h));
    const w = s.offsetWidth, h = s.offsetHeight, rw = w * Math.cos(a) + h * Math.sin(a), rh = w * Math.sin(a) + h * Math.cos(a);
    const k = Math.min(1, (W - 2 * m) / rw, (H - margen - abajo) / rh, Math.max(0.8 * (x1 - x0), 420) / rw);
    if (costoSello(obstaculosSello(lam, null), W, H, W / 2, H / 2, w, h, a, k, m, margen, abajo) === 0) return;
    const falta = rh * k + 24 - ((H - abajo) - y1), sube = Math.min(falta, y0 - margen);
    if (!(falta > 0) || sube < 8) return;
    lz.style.top = -sube + 'px'; lz.style.bottom = sube + 'px';
    lam.dataset.selloReserva = Math.round(sube);
  }
  function colocarSello(lam) {
    lam.querySelectorAll(':scope > .sello').forEach(s => colocarUnSello(lam,s));
  }
  function colocarUnSello(lam, s) {
    const W = lam.offsetWidth, H = lam.offsetHeight, m = Math.max(40, Math.round(W * .03)), a = 5 * Math.PI / 180;   // R15: 3% lateral, como QA
    const libre = !s.dataset.sobre && !s.dataset.pos;
    const margen = parseFloat(getComputedStyle(lam).getPropertyValue('--margen-v')) || 100;
    const arriba = libre ? margen : m, abajo = libre ? Math.max(margen, lam.querySelector('.firma:not(.arriba)') ? 140 : margen) : m;
    const tintaLibre = s.querySelector('.sello-tinta');
    if (libre && tintaLibre) tintaLibre.style.fontSize = Math.min(96, parseFloat(getComputedStyle(tintaLibre).fontSize) || 96) + 'px';
    let [cx, cy] = (ZONAS[s.dataset.pos] || ZONAS.centro).map((f, i) => f * (i ? H : W));
    let rejilla = null, burbuja = null, sobre = null, sobreEmoji = null;
    if (s.dataset.sobre) {
      const el = ancla(lam, s.dataset.sobre);
      if (el && (el.classList.contains('burbuja') || el.closest('.chat'))) {
        // Chat: el sello NO mide el ancho de la burbuja (la tapaba entera): tinta fija y se pega junto a ella
        burbuja = el;
        const tinta = s.querySelector('.sello-tinta');
        if (tinta) tinta.style.fontSize = (H > W ? 72 : 84) + 'px';
      } else if (el && (el.matches('.emo') || (el.querySelector('.emo') && el.children.length === 1))) {
        // R14 [juez r14, propuesta 20]: sobre un EMOJI el sello lo tapaba entero (se centraba y medía el 97% de su ancho).
        // Ahora va a su tamaño base, montado en la esquina inferior derecha: el ícono protagonista queda visible (≥ 50%).
        sobreEmoji = caja(el, lam); sobre = el;
        const tinta = s.querySelector('.sello-tinta'); if (tinta) tinta.style.fontSize = (H > W ? 72 : 84) + 'px';
      } else if (el) {
        const b = caja(el, lam), tinta = s.querySelector('.sello-tinta');
        cx = b.cx; cy = b.cy; sobre = el;
        if (tinta) for (let i = 0; i < 2; i++) {
          const fs = parseFloat(getComputedStyle(tinta).fontSize) || 104;
          tinta.style.fontSize = clamp(fs * (b.w * 0.97) / (s.offsetWidth || 1), 72, 170).toFixed(1) + 'px';
        }
        if (s.dataset.auto && el.classList.contains('rejilla')) rejilla = el;
      } else avisos.push(`lámina ${+lam.dataset.i + 1}: el sello va sobre «${s.dataset.sobre}», que no existe`);
    }
    const w = s.offsetWidth, h = s.offsetHeight;
    let k = Math.min(1, (W - 2 * m) / (w * Math.cos(a) + h * Math.sin(a)), (H - arriba - abajo) / (w * Math.sin(a) + h * Math.cos(a)));
    const medio = kk => [(w * Math.cos(a) + h * Math.sin(a)) * kk / 2, (w * Math.sin(a) + h * Math.cos(a)) * kk / 2];
    let [bw, bh] = medio(k);
    if (sobreEmoji) {
      const b = sobreEmoji;
      cx = clamp(b.x + b.w * 0.55 + bw, m + bw, W - m - bw); cy = clamp(b.y + b.h * 0.72, arriba + bh, H - abajo - bh);
      if (cx - bw < b.x + b.w * 0.45) cx = clamp(b.x + b.w * 0.45 - bw, m + bw, W - m - bw);   // sin sitio a la derecha: a la izquierda
    }
    if (rejilla) [cx, cy] = selloEnRejilla(lam, rejilla, [cx, cy], w * k, h * k, a, bw, bh, m);
    else if (burbuja) {
      const r = selloEnChat(lam, burbuja, w, h, a, k, m);
      [cx, cy] = r.p; k = r.k; [bw, bh] = medio(k);
    } else if (!sobre) {
      const obs = obstaculosSello(lam, null);
      const acota = ([x, y], kk) => { const [ww, hh] = medio(kk); return [clamp(x, m + ww, W - m - ww), clamp(y, arriba + hh, H - abajo - hh)]; };
      const costo = (p, kk) => costoSello(obs, W, H, p[0], p[1], w, h, a, kk, m, arriba, abajo);
      if (s.dataset.pos && ZONAS[s.dataset.pos]) {
        // Zona del autor: se queda si está limpia; si no, se corre lo mínimo sin salir de su lado del lienzo
        const pos = s.dataset.pos, z = acota([cx, cy], k);
        const lado = ([x, y]) => (!/derecha/.test(pos) || x >= W * 0.5) && (!/izquierda/.test(pos) || x <= W * 0.5)
          && (!/arriba/.test(pos) || y <= H * 0.5) && (!/abajo/.test(pos) || y >= H * 0.5)
          && (pos !== 'centro' || (Math.abs(x - W / 2) <= W * 0.2 && Math.abs(y - H / 2) <= H * 0.2));
        const afuera = [/derecha/.test(pos) ? 1 : /izquierda/.test(pos) ? -1 : 0, /abajo/.test(pos) ? 1 : /arriba/.test(pos) ? -1 : 0];
        const cands = [[cx, cy]];
        for (let d = 30; d <= 330; d += 30) {
          cands.push([cx, cy + d], [cx, cy - d], [cx + afuera[0] * d, cy], [cx + afuera[0] * d, cy + afuera[1] * d],
            [cx - afuera[0] * d * 0.5, cy + d], [cx - afuera[0] * d * 0.5, cy - d]);
        }
        // primero a su tamaño; si nada queda limpio en su lado, reducido a 0.85 y a 0.7
        let elegido = null;
        for (const kk of [k, k * 0.85, Math.max(0.7, k * 0.7)]) {
          const p = cands.map(q => acota(q, kk)).filter(lado).find(q => costo(q, kk) === 0);
          if (p) { elegido = { p, k: kk }; break; }
        }
        if (elegido) { [cx, cy] = elegido.p; k = elegido.k; [bw, bh] = medio(k); } else [cx, cy] = z;
      } else {
        const bloques = [...lam.querySelectorAll(':scope > .lienzo > *')].filter(e => e.getClientRects().length).map(e => caja(e, lam));
        const B = bloques.length ? bloques.reduce((u, b) => { const x0 = Math.min(u.x, b.x), y0 = Math.min(u.y, b.y), x1 = Math.max(u.x + u.w, b.x + b.w), y1 = Math.max(u.y + u.h, b.y + b.h); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; }) : { x: W / 2, y: H / 2, w: 0, h: 0 };
        // Candidatos: centro limpio, debajo centrado, encima centrado, derecha, debajo a la derecha y las 9 zonas
        // (de la más cercana al centro a la más lejana). Cada lugar se prueba a su tamaño, a 0.85 y a 0.7 antes de pasar
        // al siguiente: un sello algo más chico debajo del contenido lee mejor que uno enorme encima del título.
        k = Math.min(k, Math.max(0.8 * B.w, 420) / (w * Math.cos(a) + h * Math.sin(a)));
        const ks = [k, k * 0.85, k * 0.7];
        const lugares = [
          () => [W / 2, H / 2],
          (ww, hh) => [B.x + B.w / 2, B.y + B.h + 24 + hh],
          (ww, hh) => [B.x + B.w / 2, B.y - 24 - hh],
          ww => [B.x + B.w + 24 + ww, B.y + B.h / 2],
          (ww, hh) => [B.x + B.w - ww, B.y + B.h + 24 + hh],
          ...Object.values(ZONAS).sort((p, q) => Math.hypot(p[0] - 0.5, p[1] - 0.5) - Math.hypot(q[0] - 0.5, q[1] - 0.5)).map(([fx, fy]) => () => [fx * W, fy * H]),
        ];
        let elegido = null;
        for (const f of lugares) {
          for (const kk of ks) { const p = acota(f(...medio(kk)), kk); if (costo(p, kk) === 0) { elegido = { p, k: kk }; break; } }
          if (elegido) break;
        }
        if (!elegido) { const kk = ks[2]; elegido = { p: lugares.map(f => acota(f(...medio(kk)), kk)).map(p => ({ p, t: costo(p, kk) })).sort((x, y) => x.t - y.t)[0].p, k: kk }; }
        [cx, cy] = elegido.p; k = elegido.k; [bw, bh] = medio(k);
        s.dataset.acomodado = '1';
      }
    }
    cx = clamp(cx, m + bw, W - m - bw); cy = clamp(cy, arriba + bh, H - abajo - bh);
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
    // del lienzo al marco del sello: el sello va girado −a, así que se deshace con +a (igual que selloEnChat y QA)
    const W = lam.offsetWidth, H = lam.offsetHeight, c = Math.cos(a), sn = Math.sin(a);
    const tapa = ([cx, cy]) => dest.filter(d => {
      const x = d.cx - cx, y = d.cy - cy, u = x * c - y * sn, v = x * sn + y * c;   // al marco del sello
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
    const margenHorizontal = Math.max(100, m);
    const arribaSeguro = H > W ? 220 : margenHorizontal, abajoSeguro = H > W ? 322 : margenHorizontal;
    const b = caja(burbuja, lam), yo = !!burbuja.closest('.msj.yo');
    const renglones = [...lam.querySelectorAll('.burbuja, .chat-hora, .t, .nota, .encabezado, .procedencia')].filter(e => e.getClientRects().length && !e.closest('.escena.clon'))
      .flatMap(e => rectsTexto(e, lam));
    const iconos = [...lam.querySelectorAll('.yo-av, .otro-av, .emo, .firma')].filter(e => e.getClientRects().length && !e.closest('.escena.clon') && (e.matches('.yo-av, .otro-av') || !e.closest('.yo-av, .otro-av'))).map(e => caja(e, lam));
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
      if (cx - bw < m || cx + bw > W - m || cy - bh < arribaSeguro || cy + bh > H - abajoSeguro) t += 100;
      renglones.forEach(r => { t += frac(r, cx, cy, sw, sh); });
      iconos.forEach(r => { t += 4 * frac(r, cx, cy, sw, sh); });
      return t;
    };
    for (const kk of [k0, k0 * 0.85, Math.max(0.7, k0 * 0.7)]) {
      const sw = w * kk, sh = h * kk, bw = (sw * Math.cos(a) + sh * Math.sin(a)) / 2, bh = (sw * Math.sin(a) + sh * Math.cos(a)) / 2;
      const lado = yo ? b.x + bw * 0.9 : b.x + b.w - bw * 0.9;   // del lado contrario al avatar
      // montado sobre el borde de abajo: pisa el relleno de la burbuja, nunca sus letras
      const pie = Math.max(b.y + b.h + bh * 0.35, Math.max(b.y, ...rectsTexto(burbuja, lam).map(r => r.y + r.h)) + 8 + bh);
      // R17 [juez r17, 9:16]: abajo pueden estar el rótulo «Ejemplo ficticio» y la zona segura de Reels; montado sobre el
      // borde de ARRIBA (pisa el relleno, no las letras) es la salida antes de tapar algo.
      const techo = Math.min(b.y + bh * 0.35, Math.min(b.y + b.h, ...rectsTexto(burbuja, lam).map(r => r.y)) - 8 - bh);
      const cands = [[lado, pie], [b.cx, pie], [b.x + b.w + bw + 16, b.cy], [b.x - bw - 16, b.cy], [b.cx, b.y + b.h + bh + 12], [lado, techo], [b.cx, techo]]
        .map(([x, y]) => [clamp(x, m + bw, W - m - bw), clamp(y, arribaSeguro + bh, H - abajoSeguro - bh)]);
      const medidos = cands.map(p => ({ p, t: costo(p[0], p[1], kk) }));
      const limpio = medidos.find(q => q.t === 0);
      if (limpio) return { p: limpio.p, k: kk };
      if (kk === Math.max(0.7, k0 * 0.7)) return { p: medidos.sort((p, q) => p.t - q.t)[0].p, k: kk };
    }
    return { p: [b.cx, b.y + b.h], k: k0 };
  }

