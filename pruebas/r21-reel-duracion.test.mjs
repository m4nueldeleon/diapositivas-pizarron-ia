// Ronda 21 (juez independiente, pendiente 9): el aviso «el reel dura ~X: pasa de 60 s» no decía DÓNDE
// recortar. Un reel con 8+ elementos obligatorios necesita 5 rondas de recorte a ciegas para bajar de
// 60 s (informe juez-r21). El aviso debe nombrar la lámina con la voz más larga.
import test from 'node:test';
import assert from 'node:assert/strict';
import { reglasDuracion } from '../scripts/lib/reglas-deck.mjs';

const idea = (texto, extra = {}) => ({ tipo: 'idea', emoji: '💡', texto, ...extra });
const unos = n => Array.from({ length: n }, () => 1);

test('reel que pasa de 60s: el aviso nombra la lámina con la voz más larga', () => {
  const larga = Array.from({ length: 40 }, (_, i) => `palabra${i}`).join(' ');
  const laminas = [
    idea('uno', { voz: 'una frase corta de seis palabras nomás' }),
    // Esta lámina lleva, con mucho, la voz más larga del reel: debe ser la señalada.
    idea('dos', { voz: `${larga} ${larga} ${larga} ${larga}` }),
    idea('tres', { voz: 'otra frase corta de siete palabras acá' }),
  ];
  const r = reglasDuracion({ pieza: 'reel', laminas }, unos(3));
  const msg = r.avisos.join(' ');
  assert.match(msg, /pasa de 60 s/);
  assert.match(msg, /l[áa]mina 2/, msg);
});
