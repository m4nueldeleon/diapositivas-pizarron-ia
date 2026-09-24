# Protocolo de producción

Este es el camino completo de un guion, tema o grabación hasta las láminas terminadas. Se sigue
en orden y cada paso tiene su criterio de salida.

## 0. Entrada: qué te pueden dar

| Entrada | Qué haces primero |
|---|---|
| Un **tema** («una clase sobre X») | Escribes el guion con el arco y la duración de su pieza (ARCOS.md), en beats, y lo muestras. |
| Un **guion** en texto | Lo partes en beats (§2 de este protocolo). |
| Una **grabación** a cámara | La transcribes con marcas por palabra (§6) y trabajas sobre la transcripción. |
| Una **presentación vieja** | Extraes su texto y la rehaces con este estilo, un beat por idea. |
| Un **link** de YouTube | Bajas los subtítulos o transcribes el audio. |

**Antes de escribir, fija la pieza y su duración** ([ARCOS.md](ARCOS.md)): reel, tutorial, VSL corto,
video, VSL, clase corta, clase, webinar o propuesta. Se deducen del pedido («la clase del lunes» = clase en vivo de 40-60 min); si no se
pueden deducir, es la única pregunta. Van en el deck como `"pieza"`, `"duracion_objetivo"` y, si se
presenta en vivo, `"en_vivo": true`. Un deck para presentar en vivo lleva en `voz` el guion completo en
beats (cada paso sigue siendo un beat de 2-3 s); los tramos en vivo sin láminas (demostración,
actividad, preguntas) van como `camara` con `"vivo": true`, la consigna en `texto` y `dur` en segundos. No
sustituyen beats.

## 1. Ficha de marca

Lee `MI-MARCA.md`: la primera que exista entre la carpeta del deck, la de arriba, `$PIZARRON_MARCA` y la
ficha global `~/.config/diapositivas-pizarron-ia/MI-MARCA.md` (`bash scripts/setup.sh` la crea; render y QA usan la
misma cadena, `scripts/lib/marca.mjs`, y un deck sin `marca` toma la firma de ahí). De
ahí salen la firma o logo, el formato por omisión, la paleta de emojis, el idioma y las «Palabras que
nunca usas» (QA las lee). **Sin ficha, o con la firma vacía, omite `marca` en el deck**: las láminas
salen sin firma. Nunca copies un valor de ejemplo («tumarca.com»): QA lo marca como error. Al entregar,
avisa en una línea: «Va sin firma: dame tu @, tu dominio o tu logo (PNG sin fondo) y la agrego».

**Si no puedes preguntar** (agente de fondo, el mini, un loop, «hazlo»): los nombres y los tiempos del proceso
(el nombre del programa, cuánto tarda la llamada) se proponen como `{ "valor": …, "propuesto": true }` en
`"datos"` y se listan al entregar; QA los deja en `qa.json → por_confirmar`, marca el deck como BORRADOR y
topa la nota en 90. Precio, garantía, cupos, fechas límite, descuentos, bonos, testimonios y cifras de
resultado o de credibilidad **nunca** se proponen: van como hueco `{{CLAVE}}`. Un comentario `_datos` en el
deck no cuenta (QA lo avisa). Un relleno del pedido («tumarca.com») ya está cubierto arriba: se omite `marca`.

**En un vsl, webinar o propuesta, la pregunta única incluye la prueba**: la cifra real que respalda a quien
vende (años, clientes, eventos) y 1-3 capturas o fotos con permiso. Van en «Credenciales o pruebas con
permiso» de MI-MARCA. Sin ellas, un sustituto de GUION §7; nunca una maqueta como prueba.

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
  - [ ] El mismo concepto usa el mismo emoji, y un emoji no se usa para dos conceptos distintos.
  - [ ] Ningún diseño aparece 4 veces seguidas.
  - [ ] Hay capa a mano cada 3 o 4 láminas: subrayado, flecha, nota, tabla o sello.
  - [ ] Las láminas oscuras son solo para revelar la marca o el producto; precio, lo que incluye
        y llamado van en blanco.
  - [ ] Todas las objeciones tienen la misma forma (`idea` + «Objeción #N» + respuesta aparte).
  - [ ] Los primeros 10 s muestran el resultado o el conflicto; nada de saludo ni título antes
        (GUION §6.1).
  - [ ] La voz dura lo que pide su pieza (ARCOS.md) y cierra con un llamado o siguiente paso.
  - [ ] La oferta tiene credibilidad con cifra real, 1-2 objeciones antes del llamado, componentes
        numerados con su pregunta de sí, prueba real o un sustituto de GUION §7 (nunca la maqueta), qué
        pasa después del clic y cuánto tarda; el llamado aparece al menos 2 veces; oscura solo en la
        revelación; si hay garantía, su condición es medible (GUION §7).
  - [ ] Una escena ilustrativa se dice una vez en la voz; en pantalla no va «de ejemplo» (GUION §3.8 d).
  - [ ] Un emoji por concepto en todo el deck, y ninguno con el rol contrario en otra lámina (EMOJIS.md).
  - [ ] Cada proyección de dinero o clientes lleva la condición con número en `arriba` y rangos
        (GUION §3.8).
  - [ ] Las notas de remate llevan un dato, una consecuencia o una acción con objeto; máximo una
        antítesis «No X, Y» por deck (VOZ-HUMANA.md).
  - [ ] Ningún testimonio armado: `prueba` con captura real (`src`), post con `fuente`, maqueta con
        `ejemplo: true` y sin cifras, o `hueco`.
  - [ ] Los datos que faltan van como `{{PRECIO}}` con `"datos"` en el deck, nunca inventados.

## 4. Render y revisión visual

```bash
node scripts/render.mjs mi-video          # PNG por paso + presentador + hoja de contacto
node scripts/qa.mjs mi-video              # nota 0-100; errores = hay que corregir
```

- **Mira la hoja de contacto**, y cuando algo dude, el PNG individual. La revisión visual no se
  delega al QA: el QA cuenta, tus ojos juzgan. Con más de 20 láminas la hoja se pagina en
  `hoja-01.jpg`, `hoja-02.jpg`… (con su encabezado «láminas 21-40 de 240 · hoja 2/12», listadas en
  `hojas.json`); **recórrelas TODAS**: `hoja.jpg` es solo la primera. En clases y webinars, revisa por bloque
  del mapa. Cada cuadro dice «N · id», con el mismo N del PNG
  (`NN-id-P.png`) y del QA («lámina N»); las cámaras ocupan su lugar como cuadro gris.
- **Mira la hoja de pasos** (`hoja-pasos.jpg`, o `hoja-pasos-01.jpg`… de 10 filas cada una) para el orden
  del revelado: una fila por lámina con todos sus pasos, rotulados «N.P». Un elemento que aparece antes de su
  frase se ve ahí sin abrir 80 PNG.
- Compara contra ESTILO.md:
  - ¿Se entiende la lámina en 1 segundo sin audio?
  - ¿Hay un solo punto focal?
  - ¿El emoji dice el concepto?
- Corrige y vuelve a renderizar hasta que `estado` sea **`listo`**, o `borrador` cuando lo único que queda son huecos
  declarados, datos propuestos o capturas por conseguir (entonces la nota es 90: esos datos no restan). **Nunca
  quites un beat de venta (caso o prueba, precio, garantía, llamado) ni un hueco declarado para subir la nota o
  salir de borrador**: decláralo con `pendiente: true` y lístalo. Un loop juzga por `estado` y `falta_para_final`.
- Lee `qa.json → iconos`: cada emoji trae entre paréntesis su concepto de EMOJIS.md («💬 (comentar una palabra)»).
  Confirma que cada lámina donde aparece dice ESE concepto; si no, cámbialo por el emoji del suyo (💬 «Te preguntan»
  → 📲; un brazo con celular «Su audiencia» → 👥). «(fuera del diccionario)» pide uno del diccionario o agregarlo con su concepto.
- Lo que el QA mide y tus ojos no siempre ven: marcas `**`/`~~` sin cerrar a la vista, sello o cursor
  encima del texto, flechas que tachan una frase, letra reducida por el encaje, contraste bajo,
  elementos vacíos, `voz` que no cuadra con los pasos y **datos pendientes** en MAYÚSCULAS entre
  corchetes (`[PRECIO]`, `[WHATSAPP]`), que salen como hueco amarillo. Estos últimos son un error por
  dato, con sus láminas, y quedan en `qa.json` → `pendientes`: se llenan en `"datos"` antes de entregar.
- QA también lee el deck.json: firma de relleno (error), duración contra la pieza y peso de los tramos en
  vivo, apertura, fórmulas de IA, proyecciones sin condición, posts de maqueta con cifras, el llamado final,
  prueba real y credibilidad en piezas de venta, objeciones antes del llamado, descargos «de ejemplo» en
  pantalla, emojis parecidos o con rol contrario (`qa.json → iconos`) y claves `_…` que nadie lee
  (`scripts/lib/reglas-deck.mjs`). La duración estimada sale en la primera línea y en `qa.json` →
  `duracion`.

## 4b. Calibrar contra la referencia (solo quien mantiene la skill)

```bash
node scripts/comparar.mjs <carpeta-con-ref_SEG.jpg> --salida /private/tmp/pz-loop/r<N>/comparar
# igual a: node scripts/comparar.mjs pruebas/replica <carpeta-con-ref_SEG.jpg> …  (npm run replica -- <carpeta>)
```

- La réplica vive versionada en `pruebas/replica/deck.json` (solo texto); los cuadros `ref_*.jpg` siguen
  FUERA del repo. Cada lámina lleva `_cuadro` («4:15 lista tachada») y, si el cuadro es un momento
  intermedio del revelado, `paso_ref` (desde 0; `-1` = el último).
- Empareja cada lámina `id: "r<seg>"` con `ref_<seg>.jpg`. Sin `paso_ref` compara el paso que más se
  parece al cuadro. Avisa si una lámina no tiene referencia o sobra una referencia (y sale con código 1).
- Antes de medir, revisa que sea la MISMA escena (correlación de la densidad de tinta en 8×5 celdas,
  `--min-parecido`, 0.7 por omisión: los pares correctos dan 0.86-0.99 y los cruzados llegan hasta 0.605
  —r255 del deck viejo contra otra escena—). Un par por debajo es «no parece la misma lámina» (id desfasado
  o cuadro de otro momento): no cuenta en el encuadre y hace salir con código 1. Límite: dos frases
  centradas se parecen de verdad; ahí manda el ojo.
- **La comparación del loop se hace SOLO con `node scripts/comparar.mjs <carpeta-ref> --salida …`** (con un solo
  argumento, el deck es `pruebas/replica`). La única evidencia válida de fidelidad de una ronda son los `comp_N.jpg`
  y el `comparar.json` que deja ese comando: cada hoja lleva la cabecera «comparar.mjs · pruebas/replica/deck.json ·
  sha … · umbral · pasan/total» y la métrica de cada par (r, x, y, w, h), y `comparar.json` trae `deck` y `deck_sha`.
  **Una evidencia vale solo si su `deck_sha` coincide con `shasum -a 256 pruebas/replica/deck.json` (los 12 primeros)
  en el commit de la ronda.** Una hoja sin `deck_sha`, sin métrica, armada a mano o hecha copiando el deck de
  `pizarron-ref` no es evidencia y el juez la rechaza. Prohibido armar `comp_*.jpg` a mano.
- Guardas: de la carpeta de referencias solo se leen los `ref_*.jpg`; un `deck.json` que esté ahí (el deck viejo de
  `pizarron-ref/replica`) se ignora con un aviso y nunca se compara. Si ninguna lámina `r<seg>` trae `_cuadro`, sale
  con código 1 (no es la réplica versionada).
- Deja `comp_N.jpg` (5 pares por hoja, referencia a la izquierda) y `comparar.json`.
- La métrica es la **caja de tinta** de cada lado: lo oscuro (luminancia < 150), lo saturado que no es
  pastel (el 🏆 dorado) y la tinta roja, sin fondos pálidos y sin la esquina de la marca de agua. Un par falla si x, y, ancho o alto difieren más
  de 8 puntos del lienzo.
- **Límite**: mide encuadre, no estilo. Dos láminas pueden pasar con tipografías distintas; la
  revisión a ojo de `comp_N.jpg` sigue mandando.
- Cada ronda del loop de mejora anota el número «pares que pasan / total» sobre `pruebas/replica` para ver
  si la réplica se acerca o se aleja del video. Ronda 2: **5/10** (pasan r10, r90, r95, r460, r628; fallan
  de verdad r115 —título en 2 renglones—, r255 —lista más arriba y más chica—, r260, r1040 y r1760).
  Ronda 3: **8/10** (fallan r260 —alto +8.9— y r1760 —ancho +9.4, alto −12.2—). Las hojas de la ronda 3
  que emparejaban ref_255, ref_628, ref_1040 y ref_1760 con otras escenas salieron del deck viejo de
  `pizarron-ref/replica/deck.json`: no cuentan. Ronda 4: **9/10** con el comparador (falla r260 —alto +8.9, el 💰
  1.5× más grande que en el cuadro—); las hojas de `/private/tmp/pz-loop/r4/replica` salieron otra vez del deck viejo
  y no cuentan (por eso la guarda ya no aborta: ignora ese deck y sella la hoja con el sha). Con `emoji_tam: 150` en
  r260: **10/10**.

## 5. Entrega

| El usuario quiere… | Comando | Sale |
|---|---|---|
| Presentar en vivo | abrir `salida/index.html` | presentador (teclas abajo) |
| Ensayar o presentar con notas | `salida/index.html?modo=orador`, o la tecla O desde el presentador | vista de ensayo sincronizada |
| Insertar en su editor | `render.mjs` | `salida/laminas/NN-id-P.png`, un PNG por paso |
| Las láminas como video | `node scripts/video.mjs mi-video` | `salida/laminas.mp4` con micro-animaciones |
| Mandarlo como documento (propuesta, VSL) | `render.mjs --finales --pdf --notas` (en `propuesta`, `vsl` y `vsl-corto` ya va por omisión) | `salida/laminas-notas.pdf`: una hoja por lámina con su voz como texto |
| Llevarlo a Keynote o Slides | `render.mjs --finales --pdf` (`--sin-notas` en propuesta o VSL) | `salida/laminas.pdf`: una página por lámina, sin cursor; el stack con su remate en una página |
| Video montado sobre su grabación | ver §6 | `salida/montaje.mp4` + `cortes.csv` |

Teclas del presentador:

| Tecla | Hace |
|---|---|
| → ↓ espacio Intro · clic | avanza un paso |
| ← ↑ Retroceso | regresa |
| Inicio / Fin | primera o última |
| F | pantalla completa |
| N | banda de notas del orador (la `voz` del paso), para quien presenta con una sola pantalla |
| O | abre la vista de ensayo en otra ventana: paso actual, el siguiente en miniatura, la voz grande, cronómetro total y de la lámina contra lo planeado. Las dos ventanas se siguen (también en Safari y desde `file://`) |
| B o . / W | pantalla en negro / en blanco; cualquier avance la quita |
| 5 G (o 5 Intro) | salta a la lámina 5 |
| G | índice de láminas |
| ? | ayuda |

La lámina `camara` se proyecta en negro limpio: el público no ve el letrero «A cámara», que solo sale
en los PNG y la hoja. Una `camara` con `"vivo": true` (actividad, demostración, preguntas) se proyecta en
blanco con su emoji, la consigna, sus pasos y una cuenta regresiva desde `dur` (roja en los últimos 30 s); la
vista de ensayo muestra la misma cuenta y la consigna. Fuera de un proyector 16:9 (4:3, 16:10) las bandas
salen negras. La `voz` viaja dentro del HTML y no se dibuja: los PNG y el video no cambian.

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
