# Protocolo de producción

Este es el camino completo de un guion, tema o grabación hasta las láminas terminadas. Se sigue
en orden y cada paso tiene su criterio de salida.

## 0. Entrada: qué te pueden dar

| Entrada | Qué haces primero |
|---|---|
| Un **tema** («una clase sobre X») | Escribes un guion corto en beats, siguiendo el arco de GUION-A-LAMINAS §6, y lo muestras. |
| Un **guion** en texto | Lo partes en beats (§2 de este protocolo). |
| Una **grabación** a cámara | La transcribes con marcas por palabra (§6) y trabajas sobre la transcripción. |
| Una **presentación vieja** | Extraes su texto y la rehaces con este estilo, un beat por idea. |
| Un **link** de YouTube | Bajas los subtítulos o transcribes el audio. |

## 1. Ficha de marca

Lee `MI-MARCA.md` en la carpeta de trabajo. Si no existe, cópialo de `templates/MI-MARCA.md`. De
ahí salen la firma o logo, el formato por omisión, la paleta de emojis y el idioma. Sin ficha, la
firma queda vacía y no pasa nada.

## 2. Beats

1. Divide el guion en oraciones o cláusulas de 2 a 3 s cuando se dicen, unas 6 a 9 palabras.
2. Etiqueta cada beat con un **diseño** usando la tabla de GUION-A-LAMINAS §2.
3. Agrupa los beats que siguen la misma idea como **pasos** de una lámina.
4. Marca los tramos a **cámara**: historias, confesiones y el llamado final.

Criterio de salida: una lista de láminas con su diseño y la voz de cada paso.

## 3. `deck.json`

- Una carpeta por proyecto: `mi-video/deck.json` más `mi-video/assets/` si hay fotos o logos.
- Llena `voz` en cada lámina, como texto o como lista por paso. Da tiempos sin transcripción y
  anclas con ella.
- Revisa estas reglas antes de renderizar:
  - [ ] Cada lámina tiene como máximo 22 palabras visibles.
  - [ ] Hay una sola frase en negrita y un solo énfasis (`__`, `==` o círculo).
  - [ ] El mismo concepto usa el mismo emoji en todo el deck.
  - [ ] Ningún diseño aparece 4 veces seguidas.
  - [ ] Hay capa a mano cada 3 o 4 láminas: subrayado, flecha, nota, tabla o sello.
  - [ ] Las láminas oscuras son solo para la oferta.

## 4. Render y revisión visual

```bash
node scripts/render.mjs mi-video          # PNG por paso + presentador + hoja de contacto
node scripts/qa.mjs mi-video              # nota 0-100; errores = hay que corregir
```

- **Mira `salida/hoja.jpg`**, y cuando algo dude, el PNG individual. La revisión visual no se
  delega al QA: el QA cuenta, tus ojos juzgan.
- Compara contra ESTILO.md:
  - ¿Se entiende la lámina en 1 segundo sin audio?
  - ¿Hay un solo punto focal?
  - ¿El emoji dice el concepto?
- Corrige y vuelve a renderizar hasta que el QA dé **90 o más, sin errores**.

## 5. Entrega

| El usuario quiere… | Comando | Sale |
|---|---|---|
| Presentar en vivo | abrir `salida/index.html` | presentador con → ← y F |
| Insertar en su editor | `render.mjs` | `salida/laminas/NN-id-P.png`, un PNG por paso |
| Las láminas como video | `node scripts/video.mjs mi-video` | `salida/laminas.mp4` con micro-animaciones |
| Video montado sobre su grabación | ver §6 | `salida/montaje.mp4` + `cortes.csv` |

## 6. Montaje sobre una grabación a cámara

1. **Transcribe con marcas por palabra.** En Mac con Apple Silicon:
   ```bash
   uvx --python 3.12 --from mlx-whisper mlx_whisper crudo.mp4 --language es \
       --word-timestamps True --output-format json --output-dir .
   ```
   En otros equipos, `faster-whisper` o cualquier Whisper que exporte `words`. Usa un modelo
   mediano o grande: el `tiny` se equivoca mucho, aunque el alineador lo tolera.
2. **Escribe `voz` en el deck** con lo que se dice en cada paso. No tiene que ser idéntico: el
   alineador empata guion y transcripción palabra por palabra por similitud, y aguanta palabras
   mal reconocidas y muletillas.
3. **Monta**:
   ```bash
   node scripts/video.mjs mi-video --sobre crudo.mp4 --transcripcion crudo.json
   ```
4. **Revisa `cortes.csv`** y dale una pasada al video. Si un corte cae tarde, ajusta esa `voz` o
   pon `anclas` explícitas en la lámina.

Las láminas `camara` dejan ver la grabación. Todo lo demás cubre la cámara a pantalla completa,
como en la referencia.

- **Si grabaste vertical** (celular, reels), usa `"formato": "9:16"` en el deck. Se respeta la
  rotación del archivo. Una lámina 16:9 sobre un video vertical queda centrada con franjas
  blancas.
- `--salida` en `video.mjs` es el **archivo** de video (por omisión `salida/laminas.mp4` o
  `salida/montaje.mp4`). En `render.mjs` y `qa.mjs` es la **carpeta** de salida.

## 7. Fotos reales recortadas

Para el diseño `objeto` o para nodos con `imagen`, recorta el fondo con rembg:

```bash
uvx --python 3.12 --from "rembg[cpu,cli]" rembg i -m birefnet-general foto.jpg assets/objeto.png
```

Usa fotos propias o con licencia. Para una marca real usa **su logo real**, nunca un emoji ni uno
dibujado por IA.

## 8. Aprender de cada corrección

Cuando el usuario corrija algo, sea el tamaño, un emoji, el ritmo o un diseño que no le gustó,
escríbelo en `LECCIONES.md` de la skill **antes de cerrar el turno**: la regla, el porqué y un
ejemplo. La siguiente vez se aplica sin que lo pida.
