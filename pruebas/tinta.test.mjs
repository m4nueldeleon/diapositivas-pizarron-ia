import test from 'node:test';
import assert from 'node:assert/strict';
import { cajaTinta, compararCajas, emparejar } from '../scripts/lib/tinta.mjs';

// Imagen sintética de 100×50 blanca con un rectángulo pintado
function lienzo(w, h, pintar) {
  const d = new Uint8ClampedArray(w * h * 4).fill(255);
  pintar((x, y, [r, g, b]) => { const i = (y * w + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; });
  return d;
}
const rect = (x0, y0, x1, y1, c) => set => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, c); };

test('la caja de tinta encierra lo oscuro y lo rojo, e ignora fondos pálidos y la marca de agua', () => {
  const img = lienzo(100, 50, set => {
    rect(0, 0, 100, 50, [247, 195, 195])(set);   // fondo rosa pálido de cuadrante: no es tinta
    rect(20, 10, 40, 20, [17, 17, 17])(set);     // texto negro
    rect(50, 30, 60, 35, [200, 16, 30])(set);    // trazo rojo
    rect(90, 46, 99, 49, [0, 0, 0])(set);        // marca de agua en la esquina: se ignora
  });
  assert.deepEqual(cajaTinta(img, 100, 50), { x: 20, y: 20, w: 40, h: 50 });
  assert.equal(cajaTinta(lienzo(10, 10, () => {}), 10, 10), null);
});

test('comparar cajas: falla si algo pasa del umbral', () => {
  assert.equal(compararCajas({ x: 10, y: 10, w: 50, h: 50 }, { x: 12, y: 9, w: 55, h: 50 }).falla, false);
  assert.equal(compararCajas({ x: 10, y: 10, w: 50, h: 50 }, { x: 20, y: 9, w: 55, h: 50 }).falla, true);
  assert.equal(compararCajas(null, { x: 0, y: 0, w: 1, h: 1 }).falla, true);
});

test('emparejar: r<seg> con ref_<seg>, y avisa lo que sobra de cada lado', () => {
  const r = emparejar(['r90', 'r255', 'intro', 'r999'], ['ref_255.jpg', 'ref_90.jpg', 'ref_460.jpg', 'notas.txt']);
  assert.deepEqual(r.pares.map(p => p.id), ['r90', 'r255']);
  assert.deepEqual(r.sinRef, ['r999']);
  assert.deepEqual(r.sinLamina, ['ref_460.jpg']);
});

import { densidadTinta, correlacionMiniaturas } from '../scripts/lib/tinta.mjs';

test('tinta: el dorado saturado (🏆) cuenta igual en PNG que en JPG; el pastel no', () => {
  const oro = lienzo(100, 50, set => rect(40, 10, 60, 30, [230, 170, 30])(set));
  assert.deepEqual(cajaTinta(oro, 100, 50), { x: 40, y: 20, w: 20, h: 40 });
  assert.equal(cajaTinta(lienzo(100, 50, set => rect(0, 0, 100, 50, [255, 235, 200])(set)), 100, 50), null);
  assert.ok(cajaTinta(lienzo(100, 50, set => rect(10, 10, 20, 20, [200, 150, 30])(set)), 100, 50));
});

test('parecido de composición: la misma lámina ≈ 1; otra composición < 0.3; toda blanca da 0, no NaN', () => {
  const arriba = lienzo(160, 90, set => rect(40, 10, 120, 25, [17, 17, 17])(set));
  const tabla = lienzo(160, 90, set => { for (let x = 10; x < 150; x += 30) rect(x, 30, x + 4, 85, [17, 17, 17])(set); });
  const d = x => densidadTinta(x, 160, 90);
  assert.ok(correlacionMiniaturas(d(arriba), d(arriba)) > 0.99);
  assert.ok(correlacionMiniaturas(d(arriba), d(tabla)) < 0.3);
  assert.equal(correlacionMiniaturas(d(lienzo(160, 90, () => {})), d(arriba)), 0);
});

// ---------- ronda 3: umbral de «otra escena» y guardas del comparador ----------
import { esOtraEscena, MIN_PARECIDO } from '../scripts/lib/tinta.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import path from 'node:path';

test('otra escena: 0.605 (r255 del deck viejo contra otra escena) es distinta; 0.856 (el par correcto más bajo) no', () => {
  assert.equal(MIN_PARECIDO, 0.7);
  assert.equal(esOtraEscena(0.605), true);
  assert.equal(esOtraEscena(0.856), false);
  assert.equal(esOtraEscena(NaN), true);
  assert.equal(esOtraEscena(0.5, 0.3), false);
});

test('comparar r4: un deck.json ajeno junto a los cuadros se ignora con aviso (no sale con 2); un solo argumento compara pruebas/replica con su sha; un deck sin _cuadro sale con 1', { timeout: 180_000 }, () => {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const ref = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-ref-'));
  // un cuadro blanco por cada lámina de la réplica: basta para correr el comando (los pares no se parecen: código 1)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
  const replica = JSON.parse(fs.readFileSync(path.join(raiz, 'pruebas', 'replica', 'deck.json'), 'utf8'));
  replica.laminas.filter(l => /^r\d+$/.test(l.id)).forEach(l => fs.writeFileSync(path.join(ref, `ref_${l.id.slice(1)}.png`), png));
  fs.writeFileSync(path.join(ref, 'deck.json'), JSON.stringify({ laminas: [{ tipo: 'idea', id: 'r10', texto: 'viejo' }] }));
  const sal = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-comp-'));
  const r = spawnSync(process.execPath, [path.join(raiz, 'scripts', 'comparar.mjs'), ref, '--salida', sal], { encoding: 'utf8' });
  assert.notEqual(r.status, 2, r.stderr);
  assert.match(r.stderr, /ignoro .*deck\.json/);
  const inf = JSON.parse(fs.readFileSync(path.join(sal, 'comparar.json'), 'utf8'));
  const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(raiz, 'pruebas', 'replica', 'deck.json'))).digest('hex').slice(0, 12);
  assert.equal(inf.deck_sha, sha);
  assert.equal(inf.deck, path.join('pruebas', 'replica', 'deck.json'));
  // un deck sin `_cuadro`: no es la réplica versionada
  fs.rmSync(path.join(ref, 'deck.json'));
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-deck-'));
  fs.writeFileSync(path.join(d, 'deck.json'), JSON.stringify({ emoji: 'apple', laminas: [{ tipo: 'idea', id: 'r10', texto: 'Hola' }] }));
  const r2 = spawnSync(process.execPath, [path.join(raiz, 'scripts', 'comparar.mjs'), d, ref, '--salida', path.join(d, 'c')], { encoding: 'utf8' });
  assert.equal(r2.status, 1, r2.stderr);
  assert.match(r2.stderr, /_cuadro/);
});

// ---------- ronda 3: la tinta a mano entra completa en el corte (modo seco) ----------
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';
import { subrayadosCruzan } from '../scripts/lib/medidas-subrayados.mjs';
async function conDeckT(deck, fn, css = '') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-tinta-'));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  if (css) fs.writeFileSync(p.htmlPath, fs.readFileSync(p.htmlPath, 'utf8').replace('</head>', `<style>${css}</style></head>`));
  const { browser, page } = await abrir(p.htmlPath, p.W, p.H);
  try { return await fn(page); } finally { await browser.close(); }
}
const deckTinta = animacion => ({ emoji: 'apple', marca: false, ...(animacion ? { animacion } : {}), laminas: [
  { tipo: 'idea', texto: 'Cobras __el doble__ con la regla del 1%' },
  { tipo: 'flujo', revelar: 'todo', nodos: [{ emoji: '🐷', etiqueta: 'Ahorro' }, { emoji: '🎰', etiqueta: 'Apuesta' }] },
  { tipo: 'pasos', n: 3, clic: 1 },
] });

test('seco: en t=0 del paso, subrayado y flechas están completos (con punta) y animaDur da 0; la ruta del arrastre sí crece', { timeout: 120_000 }, async () => {
  await conDeckT(deckTinta(), async page => {
    const r = await page.evaluate(() => {
      const [a, b, c] = window.PZ.lams;
      window.PZ.mostrar(a, 0, 0); window.PZ.mostrar(b, 0, 0);
      const trazos = l => [...l.querySelectorAll(':scope > .capa-mano path[data-trazo]')].filter(e => !e.closest('mask')).map(e => +e.style.strokeDashoffset);
      const cabezas = l => [...l.querySelectorAll(':scope > .capa-mano path[data-cabeza]')].map(e => +e.style.opacity);
      const kClic = +c.querySelector('.cursor').dataset.p;
      window.PZ.mostrar(c, kClic, 900);
      const mascara = [...c.querySelectorAll('mask path[data-trazo]')].filter(e => +e.dataset.p === kClic).map(e => +e.style.strokeDashoffset);
      return { sub: trazos(a), flechas: trazos(b), puntas: cabezas(b), dur: [window.PZ.animaDur(a, 0), window.PZ.animaDur(b, 0)], mascara };
    });
    assert.ok(r.sub.length && r.sub.every(x => x === 0), JSON.stringify(r.sub));
    assert.ok(r.flechas.length && r.flechas.every(x => x === 0));
    assert.ok(r.puntas.length && r.puntas.every(x => x === 1));
    assert.deepEqual(r.dur, [0, 0]);
    assert.ok(r.mascara.some(x => x > 0), 'la máscara de la ruta punteada todavía está creciendo');
  });
});

test('suave: el subrayado sigue dibujándose (t=0 → oculto)', { timeout: 120_000 }, async () => {
  await conDeckT(deckTinta('suave'), async page => {
    const r = await page.evaluate(() => { const a = window.PZ.lams[0]; window.PZ.mostrar(a, 0, 0); return [...a.querySelectorAll(':scope > .capa-mano path[data-trazo]')].map(e => +e.style.strokeDashoffset); });
    assert.ok(r.every(x => x === 1), JSON.stringify(r));
  });
});

test('subrayado: plumón de 4–6 px bajo los descendentes, arco ascendente limitado a 0.06 em', { timeout: 120_000 }, async () => {
  await conDeckT(deckTinta(), async page => {
    const g = await page.evaluate(() => {
      const a = window.PZ.lams[0], pth = a.querySelector(':scope > .capa-mano path[data-clase="subrayado"]');
      const txt = a.querySelector('[data-sub]'), rg = document.createRange(); rg.selectNodeContents(txt);
      const R = rg.getClientRects()[0], L = a.getBoundingClientRect();
      const n = 40, pts = Array.from({ length: n + 1 }, (_, i) => pth.getPointAtLength((i / n) * pth.getTotalLength()));
      const p0 = pts[0], p1 = pts[n], ancho = p1.x - p0.x;
      // flecha: distancia máxima de la curva a la cuerda
      const flecha = Math.max(...pts.map(p => Math.abs((p1.y - p0.y) * p.x - (p1.x - p0.x) * p.y + p1.x * p0.y - p1.y * p0.x) / Math.hypot(p1.y - p0.y, p1.x - p0.x)));
      return { grosor: +pth.getAttribute('stroke-width'), x0: p0.x, x1: p1.x, izq: R.left - L.left, der: R.right - L.left, w: R.width, flecha, ancho, em: +pth.dataset.em };
    });
    assert.ok(g.grosor >= 4 && g.grosor <= 6, JSON.stringify(g));
    assert.ok(g.x0 > g.izq && g.x1 < g.der - g.w * 0.025, JSON.stringify(g));
    assert.ok(g.flecha > 0 && g.flecha <= Math.min(g.w * 0.005, g.em * 0.06) + 0.02, JSON.stringify(g));
  });
});

const fixtureSubrayados = JSON.parse(fs.readFileSync(new URL('./fixtures/subrayados/deck.json', import.meta.url), 'utf8'));

test('subrayado: g/p/q/y, renglón largo a 75 px, varios renglones y hueco con borde conservan base y espacio', { timeout: 120_000 }, async () => {
  await conDeckT(fixtureSubrayados, async page => {
    await page.addScriptTag({ content: `window.subrayadosCruzan = ${subrayadosCruzan.toString()};` });
    const resultado = await page.evaluate(() => window.PZ.lams.map(lam => {
      const L = lam.getBoundingClientRect(), s = L.width / lam.offsetWidth;
      const huecos = [...lam.querySelectorAll('.hueco')].map(e => e.getBoundingClientRect());
      const trazos = [...lam.querySelectorAll('path[data-clase="subrayado"]')].map(p => {
        const largo = p.getTotalLength(), n = Math.ceil(largo / 6);
        const puntos = Array.from({ length: n + 1 }, (_, i) => p.getPointAtLength(largo * i / n));
        const inicio = puntos[0], fin = puntos[n], centro = p.getPointAtLength(largo / 2);
        return { base: +p.dataset.base, em: +p.dataset.em, ancho: fin.x - inicio.x,
          minimo: Math.min(...puntos.map(q => q.y)), arco: (inicio.y + fin.y) / 2 - centro.y,
          dentroHueco: puntos.some(q => huecos.some(h => q.x * s + L.left >= h.left && q.x * s + L.left <= h.right && q.y * s + L.top >= h.top && q.y * s + L.top <= h.bottom)) };
      });
      return { trazos, avisos: window.subrayadosCruzan(lam) };
    }));
    assert.equal(resultado[3].trazos.length, 2, 'un trazo por renglón');
    assert.ok(resultado[1].trazos[0].ancho > 1200, 'la regresión incluye un renglón largo');
    for (const fila of resultado) {
      assert.ok(fila.trazos.length, JSON.stringify(fila));
      assert.deepEqual(fila.avisos, []);
      for (const p of fila.trazos) {
        assert.ok(Math.abs(p.em - 75) < 0.1, JSON.stringify(p));
        assert.ok(p.minimo >= p.base + p.em * 0.12, JSON.stringify(p));
        assert.ok(p.arco > 0 && p.arco <= p.em * 0.06 + 0.03, JSON.stringify(p));
        assert.equal(p.dentroHueco, false, JSON.stringify(p));
      }
    }
  }, '.hueco { display:inline-block; border:3px dashed currentColor; padding:.08em .15em; } .t { max-width: 1800px; }');
});

test('QA avisa si el path vuelve al cálculo viejo y si invade otro renglón o la caja del hueco', { timeout: 120_000 }, async () => {
  await conDeckT(fixtureSubrayados, async page => {
    await page.addScriptTag({ content: `window.subrayadosCruzan = ${subrayadosCruzan.toString()};` });
    const avisos = await page.evaluate(() => {
      const salida = [];
      for (const [i, caso] of [[0, 'viejo'], [2, 'hueco'], [3, 'renglon']]) {
        const lam = window.PZ.lams[i], p = lam.querySelector('path[data-clase="subrayado"]');
        const L = lam.getBoundingClientRect(), rango = document.createRange(); rango.selectNodeContents(lam.querySelector('[data-sub]'));
        const rs = [...rango.getClientRects()].filter(r => r.width > 4), b = rs[0];
        let x0 = +p.dataset.x0, x1 = +p.dataset.x1, y = b.top - L.top + b.height * 0.93;
        if (caso === 'hueco') { const h = lam.querySelector('.hueco').getBoundingClientRect(); x0 = h.left - L.left; x1 = h.right - L.left; y = h.bottom - L.top - 2; }
        if (caso === 'renglon') y = rs[rs.length - 1].top - L.top + 8;
        // Solo se reemplaza la geometría SVG producida: el runtime permanece intacto.
        const sag = caso === 'viejo' ? (x1 - x0) * 0.01 : 0;
        p.setAttribute('d', `M${x0} ${y} Q${(x0 + x1) / 2} ${y - 2 * sag} ${x1} ${y}`);
        salida.push(window.subrayadosCruzan(lam));
      }
      return salida;
    });
    avisos.forEach(a => { assert.equal(a.length, 1); assert.match(a[0], /el subrayado cruza las letras de “.+”: sepáralo/); });
  });
});
