import test from 'node:test';
import assert from 'node:assert/strict';
import { codificarQr, svgQr, validarQr } from '../scripts/lib/qr.mjs';
import { reglasQr, medidasQr } from '../scripts/lib/reglas-qr.mjs';
import { sanearDeck, validarDeck } from '../scripts/lib/contrato.mjs';
// Vector independiente: python-qrcode, modo byte, versión 1, ECC M, máscara 0, sin borde.
const REFERENCIA = `111111100110101111111
100000101100101000001
101110100000101011101
101110100011001011101
101110101100101011101
100000100100101000001
111111101010101111111
000000000011100000000
101010100101000010010
101001000110001100010
100010111110110111111
101100011110000010010
101100111000111110100
000000001111010000110
111111100011000110111
100000100111100100001
101110101111001010100
101110100001001110110
101110101010101010101
100000100011000010010
111111101101101100111`;
test('B7: matriz conocida versión 1-M, máscara 0 y SVG plano con zona quieta', () => {
  const qr = codificarQr('HELLO WORLD', { mascara: 0 });
  assert.equal(qr.version, 1);
  assert.equal(qr.matriz.map(f => f.map(Number).join('')).join('\n'), REFERENCIA);
  const svg = svgQr('HELLO WORLD');
  assert.equal(svg.lado, 29); assert.equal(svg.zona_quieta, 4);
  assert.match(svg.svg, /viewBox="0 0 29 29"/);
  assert.doesNotMatch(svg.svg, /filter|shadow|<text/);
  assert.ok(codificarQr('https://es.wikipedia.org/wiki/C%C3%B3digo_QR').version > 1);
});
test('B7: diez píxeles por módulo y cuatro módulos de borde', () => {
  assert.equal(medidasQr({ ancho: 290, modulos: 21, zona_quieta: 4 }).valido, true);
  assert.equal(medidasQr({ ancho: 289, modulos: 21, zona_quieta: 4 }).valido, false);
  assert.equal(medidasQr({ ancho: 400, modulos: 21, zona_quieta: 3 }).valido, false);
});
test('B7: URL HTTPS cerrada y saneamiento sin campos extra', () => {
  for (const url of ['http://example.org', 'javascript:alert(1)', 'https://usuario:clave@example.org', 'https://']) assert.ok(validarQr({ url }), url);
  assert.ok(validarQr({ url: 'https://wikipedia.org', ancho: 1 }));
  assert.equal(validarQr({ url: 'https://wikipedia.org' }), null);
  const deck = { laminas: [{ tipo: 'idea', texto: 'Escanéalo', qr: { url: 'https://wikipedia.org' } }] };
  assert.deepEqual(validarDeck(deck, ['idea']), []);
  assert.equal(sanearDeck(deck).deck.laminas[0].qr.url, 'https://wikipedia.org/');
  assert.equal(deck.laminas[0].qr.url, 'https://wikipedia.org');
});
test('B7: instrucciones sin QR, dominio de relleno, video y puente en vivo', () => {
  const base = { tipo: 'idea', texto: 'Escanéalo' }, qr = { url: 'https://wikipedia.org' };
  assert.equal(reglasQr({ laminas: [base] }).errores.length, 1);
  assert.equal(reglasQr({ en_vivo: true, laminas: [{ ...base, qr }] }).errores.length, 0);
  assert.match(reglasQr({ laminas: [{ ...base, qr }] }).avisos[0], /en video no se escanea/);
  assert.match(reglasQr({ en_vivo: true, laminas: [{ ...base, qr: { url: 'https://tudominio.com' } }] }).errores[0], /relleno/);
  assert.match(reglasQr({ en_vivo: true, laminas: [{ ...base, qr: { url: 'https://wikipedia.org/ruta/demasiado-larga' } }] }).avisos[0], /caracteres/);
  const aviso = l => reglasQr({ en_vivo: true, laminas: [l] }).avisos;
  assert.equal(aviso({ tipo: 'boton', boton: 'Entra en el link' }).length, 1);
  assert.equal(aviso({ tipo: 'idea', texto: 'Próxima clase', nota: 'Escribe CLASE' }).length, 0);
  for (const tam_texto of ['compacto', 'chico', '72px']) assert.equal(aviso({ tipo: 'idea', llamado: true, texto: 'https://wikipedia.org', tam_texto }).length, 0, tam_texto);
});
