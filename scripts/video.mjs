#!/usr/bin/env node
// video.mjs — las láminas como video, con sus micro-animaciones cuadro a cuadro.
//
//   Solo láminas (para insertar en tu editor):
//     node scripts/video.mjs <carpeta> [--fps 30] [--salida salida/laminas.mp4]
//
//   Montaje sobre tu grabación a cámara, cortando a la lámina cuando dices su frase:
//     node scripts/video.mjs <carpeta> --sobre crudo.mp4 --transcripcion crudo.json [--salida salida/montaje.mp4]
//
//   Sin --transcripcion, el montaje usa las duraciones del deck (dur / voz) a partir de --desde (s).
//   Las láminas «camara» dejan ver la grabación. Sale también salida/cortes.csv con cada corte.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { argumentos, prepararSalida, abrir } from './lib/pipeline.mjs';
import { tiemposSecuenciales, tiemposAlineados, cargarTranscripcion } from './lib/tiempos.mjs';

const { opt, pos } = argumentos(process.argv);
const salir = m => { console.error('✗ ' + m); process.exit(2); };
const fps = Number(opt('--fps', 30));
if (!Number.isFinite(fps) || fps < 10 || fps > 60) salir('--fps debe ser un número entre 10 y 60');
const desde = Number(opt('--desde', 0));
if (!Number.isFinite(desde) || desde < 0) salir('--desde debe ser un número de segundos ≥ 0');
const sobre = opt('--sobre');
const trans = opt('--transcripcion');
if (sobre && !fs.existsSync(path.resolve(sobre))) salir(`No existe el video ${sobre}`);
if (trans && !fs.existsSync(path.resolve(trans))) salir(`No existe la transcripción ${trans}`);

function sh(cmd, args) { return execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
function probar(archivo) {
  const j = JSON.parse(sh('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', archivo]));
  const v = j.streams.find(s => s.codec_type === 'video');
  if (!v) salir(`${archivo} no tiene pista de video`);
  // Los videos de celular traen rotación: ffmpeg rota al decodificar, así que el lienzo real es el girado
  const rot = Math.abs(Number((v.side_data_list || []).find(d => d.rotation != null)?.rotation ?? v.tags?.rotate ?? 0)) % 180;
  const [w, h] = rot === 90 ? [v.height, v.width] : [v.width, v.height];
  return { dur: Number(j.format.duration), w, h, audio: j.streams.some(s => s.codec_type === 'audio') };
}
// Escapa una ruta para la lista del demuxer concat de ffmpeg
const lineaFile = f => `file '${f.replace(/'/g, "'\\''")}'`;
try { sh('ffmpeg', ['-version']); } catch { salir('Falta ffmpeg (Mac: brew install ffmpeg)'); }

let prep;
try { prep = prepararSalida(pos[0], opt('--salida-dir')); } catch (e) { console.error('✗ ' + e.message); process.exit(2); }
const { deck, dirSalida, htmlPath, W, H, pasos } = prep;
const crudo = sobre ? probar(path.resolve(sobre)) : null;

// 1) Línea de tiempo
let segs;
let r = null;
if (trans) {
  let pal;
  try { pal = cargarTranscripcion(path.resolve(trans)); } catch (e) { salir(e.message); }
  r = tiemposAlineados(deck, pasos, pal, crudo ? crudo.dur : undefined);
  if (!r.reporte.length) { console.warn('⚠ Ninguna lámina tiene «voz» ni «anclas»: no hay nada que alinear. Uso las duraciones del deck.'); r = null; }
}
if (r) {
  segs = r.segs;
  const perdidas = r.reporte.filter(x => x.t == null);
  console.log(`Anclas encontradas: ${r.reporte.length - perdidas.length}/${r.reporte.length}`);
  perdidas.forEach(x => console.warn(`⚠ no ubiqué «${x.ancla}…» (${x.id}, paso ${x.paso + 1}); se repartió el tiempo con sus vecinos`));
  const flojas = r.reporte.filter(x => x.t != null && x.palabras >= 4 && x.empatadas / x.palabras < 0.4);
  if (flojas.length) console.warn(`⚠ ${flojas.length} paso(s) empataron menos del 40% de sus palabras: revisa cortes.csv o usa una transcripción de mejor calidad`);
} else {
  segs = tiemposSecuenciales(deck, pasos, desde);
}
const total = crudo ? crudo.dur : segs[segs.length - 1].fin;

// 2) Cuadros: animación del paso + una imagen fija el resto del tiempo
const dirCuadros = path.join(dirSalida, '.cuadros');
fs.rmSync(dirCuadros, { recursive: true, force: true });
fs.mkdirSync(dirCuadros, { recursive: true });
const { browser, page, avisos } = await abrir(htmlPath, W, H, { modo: 'video' });
avisos.forEach(a => console.warn('⚠ ' + a));
await page.addStyleTag({ content: 'body.video .lamina{display:none;position:absolute;left:0;top:0}body.video .lamina.activa{display:block}body{margin:0;overflow:hidden}' });

const lista = [];
let n = 0;
const negro = path.join(dirCuadros, 'negro.jpg');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `color=c=black:s=${W}x${H}`, '-frames:v', '1', negro]);
// Cada cuadro se agenda en tiempo absoluto y su duración es la resta de tiempos ya redondeados:
// así el redondeo no se acumula a lo largo de cientos de pasos.
let reloj = 0;
const red = x => Math.round(x * 1e6) / 1e6;
const agregar = (archivo, dur) => { if (dur <= 0.0005) return; const a = red(reloj); reloj += dur; lista.push({ archivo, dur: red(reloj) - a }); };
let t = 0;
for (const s of segs) {
  if (s.inicio > t + 0.001) agregar(negro, s.inicio - t);   // hueco: se ve la cámara (montaje)
  const dur = s.fin - s.inicio;
  t = s.fin;
  // Sin --sobre, un tramo en vivo (`camara` + `vivo: true`) muestra su consigna fija (lo que ve el público) en vez del
  // negro; con --sobre, o en una `camara` normal, ahí va la grabación
  if (s.camara && !crudo && deck.laminas[s.lamina] && deck.laminas[s.lamina].vivo === true) {
    await page.evaluate(i => {
      document.body.classList.add('video');
      window.PZ.lams.forEach((l, k) => { l.classList.toggle('activa', k === i); l.classList.toggle('captura-vivo', k === i); });
    }, s.lamina);
    const archivo = path.join(dirCuadros, `${String(++n).padStart(6, '0')}.jpg`);
    await page.screenshot({ path: archivo, type: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: W, height: H } });
    await page.evaluate(i => window.PZ.lams[i].classList.remove('captura-vivo'), s.lamina);
    agregar(archivo, dur);
    continue;
  }
  if (s.camara) { agregar(negro, dur); continue; }
  const animMs = await page.evaluate(([i, p]) => {
    document.body.classList.add('video');
    window.PZ.lams.forEach((l, k) => l.classList.toggle('activa', k === i));
    return window.PZ.animaDur(window.PZ.lams[i], p);
  }, [s.lamina, s.paso]);
  const cuadrosAnim = Math.min(Math.ceil((animMs / 1000) * fps), Math.max(0, Math.floor(dur * fps) - 1));
  for (let f = 0; f <= cuadrosAnim; f++) {
    const ms = f === cuadrosAnim ? Infinity : (f * 1000) / fps;
    await page.evaluate(([i, p, m]) => window.PZ.mostrar(window.PZ.lams[i], p, m === null ? Infinity : m), [s.lamina, s.paso, isFinite(ms) ? ms : null]);
    const archivo = path.join(dirCuadros, `${String(++n).padStart(6, '0')}.jpg`);
    await page.screenshot({ path: archivo, type: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: W, height: H } });
    agregar(archivo, f === cuadrosAnim ? dur - cuadrosAnim / fps : 1 / fps);
  }
  process.stdout.write(`\r  cuadros: ${n}  ·  ${t.toFixed(1)} s de ${total.toFixed(1)} s   `);
}
if (crudo && t < total) agregar(negro, total - t);
await browser.close();
process.stdout.write('\n');

// 3) Encadenar con ffmpeg
if (!lista.length) salir('No hubo cuadros que encadenar (¿todas las láminas son «camara»?)');
const txt = lista.map(x => `${lineaFile(x.archivo)}\nduration ${x.dur.toFixed(6)}`).join('\n') + `\n${lineaFile(lista[lista.length - 1].archivo)}\n`;
const listaPath = path.join(dirCuadros, 'lista.txt');
fs.writeFileSync(listaPath, txt);
const soloLaminas = path.resolve(crudo ? path.join(dirCuadros, 'laminas.mp4') : opt('--salida', path.join(dirSalida, 'laminas.mp4')));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listaPath, '-vf', `fps=${fps},format=yuv420p`, '-t', total.toFixed(3), '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-movflags', '+faststart', soloLaminas], { stdio: 'inherit' });

// 4) Cortes y montaje
const durReal = Number(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', soloLaminas]).trim());
if (!(durReal > total - 0.5)) salir(`El video de láminas salió de ${durReal || 0}s y debía durar ${total.toFixed(1)}s: revisa ${listaPath}`);
const csvq = v => `"${String(v).replace(/"/g, '""')}"`;
const csv = ['inicio,fin,lamina,id,paso,que_se_ve'].concat(segs.map(s => `${s.inicio.toFixed(3)},${s.fin.toFixed(3)},${s.lamina + 1},${csvq(s.id)},${s.paso + 1},${s.camara ? 'camara' : 'lamina'}`));
fs.writeFileSync(path.join(dirSalida, 'cortes.csv'), csv.join('\n') + '\n');
if (!crudo) {
  console.log(`✓ Video de láminas → ${soloLaminas}  (${total.toFixed(1)} s, ${n} cuadros animados)`);
} else {
  const tramos = segs.filter(s => !s.camara).map(s => `between(t,${s.inicio.toFixed(3)},${(s.fin - 0.001).toFixed(3)})`);
  const salida = path.resolve(opt('--salida', path.join(dirSalida, 'montaje.mp4')));
  const filtro = `[1:v]scale=${crudo.w}:${crudo.h}:force_original_aspect_ratio=decrease,pad=${crudo.w}:${crudo.h}:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1[l];` +
    `[0:v][l]overlay=0:0:eof_action=pass:enable='${tramos.join('+') || '0'}',format=yuv420p[v]`;
  const filtroPath = path.join(dirCuadros, 'filtro.txt');
  fs.writeFileSync(filtroPath, filtro);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.resolve(sobre), '-i', soloLaminas, '-filter_complex_script', filtroPath,
    '-map', '[v]', ...(crudo.audio ? ['-map', '0:a', '-c:a', 'aac', '-b:a', '192k'] : []), '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', salida], { stdio: 'inherit' });
  console.log(`✓ Montaje → ${salida}  (${segs.filter(s => !s.camara).length} pasos de lámina sobre ${crudo.dur.toFixed(1)} s de cámara)`);
}
console.log(`✓ Cortes → ${path.join(dirSalida, 'cortes.csv')}`);
if (!process.argv.includes('--conservar-cuadros')) fs.rmSync(dirCuadros, { recursive: true, force: true });

