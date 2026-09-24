/* presentador.js — presentar en vivo y ensayar. Corre después de runtime.js, sobre window.PZ.
   Ventana del público (por omisión):
     → ↓ espacio Intro   avanza          ← ↑ Retroceso   regresa        Inicio / Fin
     F  pantalla completa                N  notas del orador (banda abajo, para una sola pantalla)
     O  abre la vista de ensayo (?modo=orador) en otra ventana; las dos se siguen por postMessage entre la ventana
        y su opener (funciona en Safari y en file://, donde cada documento tiene origen opaco) y, de respaldo, por
        BroadcastChannel (cuando el ensayo se abrió a mano)
     B o .  pantalla en negro            W  pantalla en blanco (cualquier avance las quita)
     5 G  (o 5 Intro)  salta a la lámina 5            G  índice de láminas          ?  ayuda
   La lámina `camara` se proyecta en negro limpio: el público no ve el letrero «A cámara». Con `vivo: true` (una
   actividad, una demostración, preguntas) el público ve la consigna en blanco y una cuenta regresiva desde `dur`.
   Vista de ensayo: el paso actual, el siguiente en miniatura, la voz grande, la siguiente atenuada,
   el cronómetro total y el de la lámina contra lo planeado (dur de cada paso, a 2.7 palabras por segundo). */
(function () {
  'use strict';
  const PZ = window.PZ;
  if (!PZ || !['presentador', 'orador'].includes(PZ.modo)) return;
  const canal = 'BroadcastChannel' in window ? new BroadcastChannel('pz-' + location.pathname) : null;
  let otra = null;   // la otra ventana: la que abrió O, o la que nos escribió
  function enviar(pos) {
    const msg = { pz: 1, pos };
    if (canal) canal.postMessage({ pos });
    try { if (otra && !otra.closed) otra.postMessage(msg, '*'); } catch (e) { otra = null; }
    try { if (window.opener && window.opener !== otra && !window.opener.closed) window.opener.postMessage(msg, '*'); } catch (e) { /* opener cerrado */ }
  }
  // Cuenta regresiva de un tramo en vivo: arranca al entrar a la lámina y se detiene al salir
  // (repintar la MISMA lámina, p. ej. al cambiar el tamaño de la ventana, no reinicia la cuenta)
  let vivoInt = 0, vivoLam = null, vivoT0 = 0;
  function cuentaVivo(l, pinta) {
    clearInterval(vivoInt); vivoInt = 0;
    if (!l || !l.hasAttribute('data-vivo')) { vivoLam = null; return; }
    if (l !== vivoLam) { vivoLam = l; vivoT0 = performance.now(); }
    const dur = +l.dataset.dur || 0;
    const tic = () => pinta(dur - (performance.now() - vivoT0) / 1000);
    tic(); vivoInt = setInterval(tic, 250);
  }
  const clasesCuenta = (e, r) => { e.classList.toggle('final', r <= 30 && r > 0); e.classList.toggle('cero', r <= 0); };
  const guion = l => { try { return JSON.parse((l.querySelector(':scope > script.guion') || {}).textContent || '{}'); } catch (e) { return {}; } };
  const reloj = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const el = (clase, html = '') => { const d = document.createElement('div'); d.className = clase; d.innerHTML = html; document.body.appendChild(d); return d; };
  const esc = t => String(t || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  const porPaso = (v, p) => Array.isArray(v) ? v[p] || '' : v || '';
  const apoyo = (g, p) => [['ACCIÓN', g.accion], ['SI FALLA', g.si_falla]].map(([r, v]) => porPaso(v, p) ? `${r}: ${porPaso(v, p)}` : '').filter(Boolean).join('\n');

  const notaOrador = (l, g, p) => {
    const consigna = l.hasAttribute('data-vivo') ? (l.querySelector('.vivo-consigna') || {}).textContent || '' : '';
    return [consigna, porPaso(g.voz, p), apoyo(g, p)].filter(Boolean).join('\n') || (l.dataset.tipo === 'camara' ? '🎥 a cámara' : '(sin voz)');
  };

  // Banda N: ACCIÓN en ámbar y SI FALLA en rojo, para verlas de reojo sin leer la voz entera
  const notaHtml = t => t.split('\n').map(x => /^ACCIÓN: /.test(x) ? `<b style="color:#f0b429">${esc(x)}</b>`
    : /^SI FALLA: /.test(x) ? `<b style="color:#ff6b6b">${esc(x)}</b>` : esc(x)).join('<br>');

  function secuencia(lams) {
    const seq = [];
    lams.forEach((l, i) => { if (l.dataset.tipo === 'camara') seq.push({ i, p: 0 }); else for (let p = 0; p < PZ.pasos(l); p++) seq.push({ i, p }); });
    return seq;
  }
  // Escala una lámina (o su clon) para que quepa en una caja, centrada
  function encuadrar(l, x, y, w, h) {
    const s = Math.min(w / l.offsetWidth, h / l.offsetHeight);
    l.style.left = '0'; l.style.top = '0';
    l.style.transform = `translate(${x + (w - l.offsetWidth * s) / 2}px, ${y + (h - l.offsetHeight * s) / 2}px) scale(${s})`;
  }

  // Navegación compartida por las dos ventanas: teclas, salto por número y sincronía
  function navegar(lams, seq, pintar, extra) {
    let pos = Math.min(seq.length - 1, Math.max(0, parseInt((location.hash || '').slice(1), 10) || 0)), raf = 0, digitos = '';
    function ir(n, animar, remoto) {
      pos = Math.max(0, Math.min(seq.length - 1, n)); cancelAnimationFrame(raf);
      const { i, p } = seq[pos], l = lams[i];
      pintar(pos);
      history.replaceState(null, '', location.search + '#' + pos);
      if (!remoto) enviar(pos);
      if (!animar) { PZ.mostrar(l, p, Infinity); return; }
      const t0 = performance.now(), dur = PZ.animaDur(l, p) + 80;
      const tick = () => { const t = performance.now() - t0; PZ.mostrar(l, p, t); if (t < dur) raf = requestAnimationFrame(tick); else PZ.mostrar(l, p, Infinity); };
      tick();
    }
    const saltar = () => { const k = parseInt(digitos, 10) - 1; digitos = ''; const n = seq.findIndex(s => s.i === k); if (n >= 0) ir(n, false); return n >= 0; };
    if (canal) canal.onmessage = e => { if (e.data && Number.isInteger(e.data.pos) && e.data.pos !== pos) ir(e.data.pos, true, true); };
    addEventListener('message', e => {
      const d = e.data;
      if (!d || d.pz !== 1 || !Number.isInteger(d.pos)) return;
      if (e.source && e.source !== window && (!otra || otra.closed)) otra = e.source;
      if (d.pos !== pos) ir(d.pos, true, true);
    });
    addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) { digitos = (digitos + e.key).slice(-3); return; }
      if ((e.key === 'g' || e.key === 'G') && digitos) { e.preventDefault(); saltar(); return; }
      if (e.key === 'Enter' && digitos) { e.preventDefault(); saltar(); return; }
      digitos = '';
      if (extra && extra(e.key, e) === true) return;
      if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); ir(pos + 1, true); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); ir(pos - 1, false); }
      else if (e.key === 'Home') ir(0, false); else if (e.key === 'End') ir(seq.length - 1, false);
      else if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
    });
    return { ir, pos: () => pos };
  }

  // ---------- ventana del público ----------
  function presentador(lams) {
    document.body.classList.remove('preparando'); document.body.classList.add('presentador');
    document.documentElement.classList.add('pz-oscuro');
    const seq = secuencia(lams);
    const barra = el('barra-pres', '<i></i>'), velo = el('velo-pres'), notas = el('notas-pres'), indice = el('indice-pres'), ayuda = el('ayuda-pres');
    indice.innerHTML = lams.map((l, i) => `<button data-i="${i}">${i + 1} · ${esc(l.dataset.id)}</button>`).join('');
    ayuda.innerHTML = '<b>Teclas</b><br>→ espacio Intro: avanza · ←: regresa · Inicio/Fin<br>F pantalla completa · N notas · O vista de ensayo<br>B o . negro · W blanco · 5 G salta a la lámina 5 · G índice · ? esta ayuda · Esc cierra';
    const ajustar = l => encuadrar(l, 0, 0, innerWidth, innerHeight);
    function pintar(pos) {
      const { i, p } = seq[pos], l = lams[i];
      lams.forEach(x => x.classList.toggle('activa', x === l)); ajustar(l);
      barra.firstChild.style.width = ((pos + 1) / seq.length * 100) + '%';
      const g = guion(l);
      notas.innerHTML = `<small>lámina ${i + 1}/${lams.length} · paso ${p + 1}/${l.dataset.tipo === 'camara' ? 1 : PZ.pasos(l)}${l.dataset.tipo === 'camara' ? (l.hasAttribute('data-vivo') ? ' · ⏱️ en vivo' : ' · 🎥 a cámara') : ''}</small>${notaHtml(notaOrador(l, g, p))}`;
      const rel = l.querySelector('.vivo-reloj');
      cuentaVivo(l, r => PZ.actualizarReloj(rel, r));
    }
    const alternar = (x, clase) => x.classList.toggle(clase);
    const nav = navegar(lams, seq, pintar, (k, e) => {
      if (k === 'Escape') { indice.classList.remove('abierto'); ayuda.classList.remove('abierto'); return true; }
      if (k === 'b' || k === 'B' || k === '.') { velo.className = velo.className === 'velo-pres negro' ? 'velo-pres' : 'velo-pres negro'; return true; }
      if (k === 'w' || k === 'W') { velo.className = velo.className === 'velo-pres blanco' ? 'velo-pres' : 'velo-pres blanco'; return true; }
      if (k === 'n' || k === 'N') { alternar(notas, 'abierto'); return true; }
      if (k === 'g' || k === 'G') { alternar(indice, 'abierto'); return true; }
      if (k === '?') { alternar(ayuda, 'abierto'); return true; }
      if (k === 'o' || k === 'O') { otra = window.open(location.pathname + '?modo=orador#' + nav.pos(), 'pz-orador') || otra; return true; }
      if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter', 'ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) velo.className = 'velo-pres';
      return false;
    });
    indice.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const n = seq.findIndex(s => s.i === +b.dataset.i); indice.classList.remove('abierto'); if (n >= 0) nav.ir(n, false); e.stopPropagation(); });
    addEventListener('click', e => { if (e.target.closest('.indice-pres, .ayuda-pres')) return; velo.className = 'velo-pres'; nav.ir(nav.pos() + (e.clientX < innerWidth * 0.25 ? -1 : 1), e.clientX >= innerWidth * 0.25); });
    addEventListener('resize', () => ajustar(lams[seq[nav.pos()].i]));
    nav.ir(nav.pos(), false, true);
  }

  // ---------- vista de ensayo (?modo=orador) ----------
  function orador(lams) {
    document.documentElement.classList.add('pz-oscuro');
    const seq = secuencia(lams);
    const ui = el('orador-ui', '<div class="o-actual"></div><div class="o-lado"><div class="o-sig"></div><div class="o-pos"></div><div class="o-reloj"></div></div><div class="o-voz"></div><div class="o-voz-sig"></div>');
    const [actual, sig, posEl, relojEl, voz, vozSig] = ['.o-actual', '.o-sig', '.o-pos', '.o-reloj', '.o-voz', '.o-voz-sig'].map(q => ui.querySelector(q));
    let clon = null, t0 = performance.now(), tLam = t0, lamActual = -1, plan = 0;
    function pintar(pos) {
      const { i, p } = seq[pos], l = lams[i];
      lams.forEach(x => x.classList.toggle('activa', x === l));
      const r = actual.getBoundingClientRect(); encuadrar(l, r.left, r.top, r.width, r.height);
      if (clon) clon.remove(); clon = null;
      const s = seq[pos + 1];
      if (s) {
        clon = lams[s.i].cloneNode(true); clon.classList.add('activa', 'clon-sig'); clon.removeAttribute('data-i');
        document.body.appendChild(clon); PZ.mostrar(clon, s.p, Infinity);
        const q = sig.getBoundingClientRect(); encuadrar(clon, q.left, q.top, q.width, q.height);
      }
      const g = guion(l), gs = s ? guion(lams[s.i]) : {};
      const vivo = l.hasAttribute('data-vivo');
      voz.textContent = notaOrador(l, g, p);
      if (vivo) { const c = document.createElement('span'); c.className = 'o-cuenta'; voz.prepend(c); cuentaVivo(l, r => { c.textContent = reloj(r); clasesCuenta(c, r); }); }
      else cuentaVivo(null);
      vozSig.textContent = s ? [((gs.voz || [])[s.p] || ''), apoyo(gs, s.p)].filter(Boolean).join('\n') : '— fin —';
      posEl.textContent = `lámina ${i + 1}/${lams.length} · paso ${p + 1}/${l.dataset.tipo === 'camara' ? 1 : PZ.pasos(l)}${l.dataset.tipo === 'camara' ? ' · a cámara' : ''}`;
      if (i !== lamActual) { lamActual = i; tLam = performance.now(); plan = (g.dur || []).reduce((a, b) => a + b, 0); }
    }
    function tic() {
      const ahora = performance.now(), enLam = (ahora - tLam) / 1000, dif = enLam - plan;
      relojEl.innerHTML = `total <b>${reloj((ahora - t0) / 1000)}</b> · lámina <b>${reloj(enLam)}</b> / ${reloj(plan)} <span class="${dif > 0 ? 'tarde' : ''}">${dif > 0 ? '+' : '−'}${reloj(Math.abs(dif))}</span>`;
    }
    const nav = navegar(lams, seq, pintar);
    addEventListener('resize', () => pintar(nav.pos()));
    nav.ir(nav.pos(), false, true); setInterval(tic, 500); tic();
    if (window.opener) enviar(nav.pos());   // el público recupera la referencia a esta ventana aunque se haya recargado
  }

  PZ.listo.then(() => (PZ.modo === 'orador' ? orador : presentador)(PZ.lams));
})();
