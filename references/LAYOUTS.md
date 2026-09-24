# Catálogo de diseños (`tipo`)

Cada lámina de `deck.json` es un objeto con `tipo` más sus campos. Todo texto acepta las marcas de
[markup](#marcas-de-texto). Entre corchetes va el momento del video de referencia donde aparece
ese diseño.

**Campos del deck** (arriba de `laminas`)

- `titulo`, `formato` (`16:9`, `9:16`, `1:1`, `4:5`), `emoji` (`apple` o `fluent`; `auto` solo como respaldo
  heredado: cambia de set según la máquina y QA revisa los dos; ver EMOJIS.md, «Qué set usar»), `animacion`
  (`seco`, `suave`), `idioma`.
- `marca`: `{ "texto": "<tu @ o dominio>", "sufijo": "<opcional>" }` o `{ "logo": "assets/logo.png" }`.
  **Omítela si no hay marca real**: las láminas salen sin firma. Un valor de relleno («tumarca.com»,
  «@tuusuario», «<…>») es error de QA.
- `pieza`: `reel`, `tutorial` (3-8 min), `vsl-corto` (3-6 min), `video`, `vsl`, `clase`, `webinar`,
  `propuesta` o `libre`; `duracion_objetivo`: minutos (`45`) o `"mm:ss"`; `en_vivo: true` si se presenta en
  vivo. QA mide la voz contra eso ([ARCOS.md](ARCOS.md)): un objetivo fuera del rango de su pieza avisa (usa
  la pieza corta que le toca), «menos de la mitad» se mide con el tiempo de LÁMINAS (la cámara no rellena) y
  en clase o webinar más de la mitad a cámara avisa. `qa.json → duracion` separa `laminas` y `camara`.
- `datos`: ver [Datos que se llenan una vez](#datos-que-se-llenan-una-vez).

**Campos que acepta cualquier lámina**

- `id`: nombre corto para los archivos y los cortes.
- `voz`: lo que se dice. Puede ser un texto o una lista con un texto por paso; sirve para
  tiempos, anclas y QA.
- `dur`: segundos por paso, como número o como lista.
- `revelar`: `"todo"` enseña todo de un golpe; por omisión se revela un elemento por paso.
- `sello`: texto de sello de goma que cae en un paso extra. Es una etiqueta blanca OPACA con doble
  borde rojo: tapa lo que queda debajo, como en [6:45]. Por omisión va al centro del lienzo (en
  `rejilla`, centrado sobre las cajas, como en [6:45]; si la rejilla tiene celdas en `destacar`, esas celdas
  son el dato que se cuenta: el sello se acomoda solo en la banda entre renglones que menos destacadas tapa
  o, si todas tapan más del 25%, en una franja libre junto a la rejilla. El sello es el remate y la cifra ya se
  dijo: tapar parte de la rejilla es fiel a [6:45]; QA solo avisa si tapa más del 25% de las destacadas). Se
  mueve con:
  - `sello_sobre: "<ancla>"`: lo centra sobre ese elemento (ver [anclas](#anclas)) y lo hace medir
    ~100% de su ancho, como en [6:45] (letra de 72 a 170 px). No lo pongas sobre notas ni flechas: QA lo avisa;
  - `sello_pos`: `centro`, `arriba`, `abajo`, `izquierda`, `derecha`, `arriba-izquierda`,
    `arriba-derecha`, `abajo-izquierda` o `abajo-derecha`.
  Siempre queda dentro del lienzo y, si es muy largo para el formato, se reduce (QA avisa bajo 70%:
  un sello lleva 1 o 2 palabras).
- `clic`: el ancla que el cursor va a presionar; `cursor` elige entre `mano` y `flecha`.
  `clic_pos: [x, y]` (de 0 a 1 dentro del ancla) mueve la punta del dedo. En un `boton` la punta cae
  por omisión a la derecha del emoji, a media altura, con el emoji entero a la vista [23:15].
- `anclar: "arriba" | "centro"`: dónde arranca el contenido. Por omisión, `lista` y `tarjetas` que
  se revelan de a uno arrancan ARRIBA y crecen hacia abajo [ref_95, 3:25, 9:25]; lo demás va
  centrado. `"centro"` lo devuelve al centro [15:35].
- `oscura: true` pone la lámina en negro, y `fondo` elige el brillo: `violeta` (por omisión),
  `azul` (arriba, [37:40]) o `negro` (plano, [36:15]). Solo para revelar la marca o el producto.
- `_comentario` (o cualquier campo que empiece con `_`): notas tuyas; el motor las ignora. Un campo
  que ese diseño no usa se ignora también, pero QA lo avisa y sugiere el nombre correcto.
- `firma: false`: oculta la firma en esa lámina.
- `llamado: true`: marca la lámina como **llamado visible** (la que muestra la palabra clave o la flecha
  al link). QA solo cuenta como llamado un `boton`, una lámina con `llamado: true` o un texto a la vista que
  ARRANCA con un imperativo con objeto («Agenda tu diagnóstico», «Escribe «CITA»», «Entra a…»); una palabra
  suelta en la voz («WhatsApp», «aparta») no cuenta. En `vsl` y `webinar` pide 2 llamados visibles (láminas
  contiguas, como el botón y su «Después del clic», cuentan como uno).
- `paso_ref`: solo para la réplica (`scripts/comparar.mjs`): el paso de la lámina que se ve en el cuadro del
  video, desde 0 (`-1` = el último).
- `anclas`: frases que disparan cada paso en el montaje.

---

## Texto e ideas

### `idea` — emoji + frase (+ nota manuscrita)  ·  [0:10, 1:30, 4:15]
El diseño más usado. Un emoji grande arriba y la frase con su parte clave en negrita.
```json
{ "tipo": "idea", "emoji": "🧑‍⚕️+💰", "emoji_tam": "grande",
  "texto": "La gente la usa para\n__ganar lo mismo que un médico__",
  "nota": "Sin experiencia previa en negocios." }
```
- `emoji_tam`: `chico` (150), `medio` (230, por omisión), `grande` (290), `heroe` (360) o un número.
  Es la caja: el glifo se ve ~85% (medio ≈ 197 visibles, como el 🏆 de ref_90).
- `emoji_lado: true` pone el emoji a la izquierda en la misma línea [10:15] (170 px por omisión).
- **Par antes/después** [10:55]: `"emoji": ["no:📚", "si:🤖"]` pone dos emojis en fila;
  `apagar_emoji: 0` atenúa el primero (el negado) y `emoji_paso: 1` revela el segundo después.
  Solo en `idea`.
- `encabezado`: rótulo gris chico arriba. Con `encabezado_pos: "entre"` va ENTRE el emoji y la
  frase [34:25 «Reason #1»].
- **Objeción o «Razón #N»** [34:25, 35:15] — una forma para todas las del deck:
  ```json
  { "tipo": "idea", "emoji": "no:💻", "encabezado": "Objeción #1", "encabezado_pos": "entre",
    "texto": "**«No sé nada de tecnología»**" }
  ```
  La respuesta va en la lámina siguiente (`idea` con `si:…` o `lista` con `vineta: "check"`); con
  contraste, pregunta → «Sí.» → «Pero…» en láminas de una frase [34:35-34:45]. Nunca dentro del
  `encabezado` de una lista ni pegada al texto de un `boton` (QA lo avisa).
- **Entrada y remate** [18:30]: `"Eso es lo que yo llamo un\n^^__plan de monetización__^^"`: el
  remate va en su renglón, en negrita y ~1.5×. El tamaño automático cuenta solo la entrada.
- `nota_paso`: por omisión la nota aparece en el paso 1.
- `tachar_paso: 1`: el `~~tachado~~` del texto cae un paso DESPUÉS del texto (ver [Marcas](#marcas-de-texto)).
- Sin emoji es una **frase sola** [3:20 «So let's get started.»].
- `estrellas: { "valor": 1, "max": 5 }` en lugar del emoji pone una fila suelta de estrellas sobre la
  frase, sin tarjeta [4:10]. Para calificar varias opciones usa [`calificacion`](#calificacion).

### `lista` — encabezado gris + viñetas, una por paso  ·  [1:35, 13:35, 40:15]
```json
{ "tipo": "lista", "encabezado": "Sin:", "vineta": "x",
  "items": ["Pasar años trabajando **12 horas al día**", "**Construir** una audiencia"] }
```
- `vineta`: `x` (❌), `check` (✅) o cualquier emoji. También puede ir un `emoji` por ítem.
- Un ítem con `"tachado": true` recibe un tachón rojo. Con `"tachar_despues": true` en la lista,
  los tachones llegan después de que aparece todo [4:05].
- Arranca arriba y crece hacia abajo (`anclar`); con `revelar: "todo"` se centra.
- **Descartes** [m_256 4:16, 4:05]: si TODOS los ítems van tachados, cada renglón va centrado, en
  seminegrita, y la lista se queda centrada en la lámina con su hueco reservado (el primer renglón aparece
  ya en su lugar final). El tachón es un plumón grueso (~10 px) que arranca antes de la viñeta y sale por
  la derecha. `alinear: "centro"` lo fuerza en cualquier lista; `alinear: "izquierda"` lo quita. Las listas
  con encabezado («Sin:», razones) siguen a la izquierda y arriba [1:35, 3:30].

### `cuadrantes` — bloques de color a sangre  ·  [10:20]
Lo que NO necesitas va en rojo pálido y lo que SÍ en verde pálido. Aparece un bloque por paso.
```json
{ "tipo": "cuadrantes", "items": [
  { "emoji": "no:🎥", "texto": "Crear contenido", "tono": "r" },
  { "emoji": "si:💸", "texto": "**$0** de capital", "tono": "v" } ] }
```
`tono`: `r`, `v`, `n`, `g`, `a` o `b` (blanco). `columnas`: por omisión 2.

### `cita` — frase manuscrita con flecha roja desde un ícono  ·  [18:25]
```json
{ "tipo": "cita", "emoji": "📝", "texto": "«Así es EXACTAMENTE como puedes ganar $10k–50k…»" }
```
El ícono va centrado y la flecha es un gancho corto (≤ 340 px) que sale a su izquierda y cae sobre
el primer cuarto del primer renglón. La cita va a 64 px en renglones parejos (`tam_texto` en px la
cambia); un rango de cifras («$10k–50k») nunca se parte en el guion.

### `cifra` — números y ecuaciones grandes, una línea por paso  ·  [3:10, 14:10]
```json
{ "tipo": "cifra", "arriba": "Si te contrata el 0.1-0.3%:",
  "lineas": ["1 millón × **0.1-0.3%** = 1-3 mil", "× $25,000 = __$25-75 millones__"] }
```
- Con una sola línea sale enorme, a 140 px.
- **Algo que se descarta** [4:05]: `{ "texto": "~~Más horas = más dinero~~", "tachar_paso": 1 }` como línea:
  se lee primero y el tachón rojo llega en el paso siguiente (`tachar_paso` en la lámina vale para todas).
- `arriba`: nota manuscrita encima. `abajo`: etiqueta chica, como «Seguidores».
- **Proyección al espectador** (lo que ganará o conseguirá quien mira): `arriba` es el lugar de la
  **condición, con número**, y las tasas van en **rango**, como la referencia [33:45-33:55]. Nunca un
  «Supuesto:» vacío; QA lo avisa, y también una cuenta que no trae NINGÚN rango (GUION §3.8 b):
  ```json
  { "tipo": "cifra", "arriba": "Si mandas 10 mensajes al día por 10 días:", "lineas": [
    "100 × 10-20% = 10-20 pláticas", "× 30-50% = __3-10 clientes__"] }
  ```
- `fuente`: de dónde sale un dato publicado (el tamaño de un mercado); sale chica y gris abajo y exime
  la cuenta del aviso de proyección.
- `[[palabra]]` pone una palabra en letra de mano dentro de la ecuación: `100-250 [[ventas]] × $100`.
- Cada línea puede ser un objeto `{ "texto", "tam", "peso", "tono" }` para jerarquizar. **Precio con
  ancla** — el ancla es algo real que el público ya vio (la columna cara de la tabla, un sueldo, tu
  nivel superior), chica y gris; el precio, grande y abajo. Nunca un «Valor» inventado:
  ```json
  { "tipo": "cifra", "lineas": [
    { "texto": "Una recepcionista: {g:$9,000 al mes}", "tam": "64px", "peso": 500 },
    { "texto": "Tu agente: __$1,500 al mes__", "tam": "120px", "peso": 800 } ] }
  ```

### `objeto` — foto real recortada o emoji gigante  ·  [1:40, 23:20]
```json
{ "tipo": "objeto", "imagen": "assets/alcancia.png", "alto": 520, "texto": "Tus ahorros" }
```
Para recortar el fondo de una foto se usa rembg (ver PROTOCOLO.md).

### `oscura` — revelación de la marca o el producto  ·  [36:15, 36:20, 37:40, 43:00]
Fondo negro con brillo violeta (`fondo`: `azul` o `negro` para las otras dos variantes). Solo para
el momento «esto es lo que vendo»: nombre, logo y una frase. El precio, lo que incluye y el llamado
van en blanco. Sobre negro el subrayado y las flechas salen en blanco, el tachón en rojo claro y
`{o:…}` pinta una cifra en dorado [36:40]. `emoji_tam` cambia el tamaño del emoji (150).
```json
{ "tipo": "oscura", "imagen": "assets/logo.png", "titulo": "Tu Programa", "texto": "Lo que hay dentro" }
```

## Procesos y relaciones

### `flujo` — A → B → C con flechas a mano  ·  [6:30, 12:35, 17:20]
```json
{ "tipo": "flujo", "nodos": [{ "emoji": "🕵️", "etiqueta": "Identificar" }, { "emoji": "🤝", "etiqueta": "Aliarte" }] }
```
- `flecha`: `recta` (plumón rojo, por omisión), `arco` (arco rojo), `arco-negro` o `ninguna`: una
  fila de conceptos numerados sin causa→efecto, con nodos más chicos y etiqueta regular, cada uno
  en su paso [19:10-19:15]. El número va en la etiqueta: `"1. Qué producto"`.
- `flechas: [{ "tachada": true, "etiqueta": "no" }]` va por flecha: el arco tachado se lee
  «esto NO lleva a aquello» [1:45].
- Un nodo acepta `imagen` (foto recortada), `sub` (texto gris) y `normal: true`, que quita la
  negrita de la etiqueta.
- Cada nodo aparece en su propio paso junto con la flecha que llega a él.
- En 16:9 las columnas son iguales (todas del ancho del nodo más ancho): los emojis quedan a la misma
  distancia y las flechas miden lo mismo aunque un nodo lleve un `sub` largo [17:00, 17:20]. El `sub` va a
  52 px y se parte en dos renglones balanceados pasando de ~9 em.

### `pasos` — el sistema de N pasos (teclas 1 2 3 + ruta punteada)  ·  [1:55, 11:00, 16:35, 28:00]
```json
{ "tipo": "pasos", "n": 3, "clic": 1, "texto": "El sistema de 3 pasos **«solo dar clic»**",
  "nota": "Lo usan principiantes para cobrar como profesionistas" }
```
- Con `iconos` y `etiquetas` sale la variante de sección [16:40]:
  ```json
  { "tipo": "pasos", "iconos": ["🔍", "🛠️", "🚀"], "etiquetas": ["Encontrar", "Construir", "Lanzar"], "activo": 1 }
  ```
- `activo`: número del paso encendido; los demás quedan al 20% [ref_1040].
- `hechos`: lista de pasos con ✅, por ejemplo `[1, 2]`. La ✅ va siempre a todo color, aunque su
  columna esté atenuada por `activo`: es la señal de avance [28:00-28:05].
- Con `iconos`, «Paso N» va gris a 62 px y la etiqueta a 86 px en negrita, y NO hay ruta punteada
  (la referencia no la dibuja en el mapa); `ruta: true` la fuerza.
- **Columnas iguales** [ref_1040]: en 16:9 cada paso ocupa una columna del mismo ancho, así los centros
  quedan a la misma distancia (Find/Build/Launch van a ~627 px uno de otro en el video). El ancho es el
  útil entre `n` (540 px con 3 pasos, 405 con 4, 324 con 5), hasta 630 con íconos y 461 con teclas.
  `separacion` fija la distancia entre centros en px (en 9:16 es el hueco entre columnas).
- **Mapa de 4 o 5 pasos**: caben hasta 5 pasos con nombre en 16:9 (3 en 9:16; con 6 o más usa `lista` o
  dos láminas de mapa). El ícono baja a 150 con 5+, la etiqueta va a 86 / 74 / 64 px (3 / 4 / 5+) y además
  se ajusta a su palabra más larga para no salirse de su columna (una palabra sola no se parte: con 5
  pasos, «Recordatorios» baja a ~44 px). «Paso N» va al 72% del tamaño base. Ni «Paso N» ni la etiqueta
  se parten. A mano: `separacion` y `tam_etiqueta` (px). QA da error si un rótulo del mapa se parte en dos
  renglones («Paso / 2») o si una etiqueta es más ancha que su columna (se encima con la vecina).
- Con teclas, la frase va ~240 px debajo [ref_115], a 84 px (`medio`): «3-step "Just-Click-The-Buttons"
  business» cabe en UN renglón, como en el video. La ruta punteada se dibuja por omisión.
- `sobre: "✋"` pone un emoji arriba de cada tecla. `clic: 2` hace que el cursor presione la
  tecla 2. `ruta: false` quita la ruta punteada.
- **Arrastre** [1:55]: con `clic` y ruta, la mano presiona la tecla y ARRASTRA la ruta punteada hasta la
  última tecla: los tramos desde la tecla del clic nacen en el paso del clic, uno tras otro (~700 ms cada
  uno, al terminar la onda), con la mano cerrada y gris en la punta del trazo; al final queda la mano de
  dedo sobre la última tecla (así sale en el PNG). Los tramos anteriores a la tecla del clic se ven desde
  el paso 0. `arrastre: false` lo apaga: ruta completa desde el paso 0 y la mano quieta en su tecla.
- Por omisión teclas, texto y nota entran en un solo corte, como en la referencia [1:55]; el cursor
  llega en el paso siguiente. Con `revelar: "pasos"` cada tecla entra en su propio paso, la ruta se
  dibuja tramo por tramo y el texto llega al final (sin `activo` ni `hechos`).
- `texto_paso`, `nota_paso` y `clic_paso` mueven el texto, la nota y el clic.

### `bifurcacion` — un origen y dos ramas, con llave  ·  [10:30]
```json
{ "tipo": "bifurcacion", "origen": { "emoji": "🤝", "texto": "**1** alianza" },
  "ramas": [{ "emoji": "💸", "valor": "$2,000" }, { "emoji": "💰", "valor": "$50,000" }],
  "llave": "Mismo trabajo" }
```
`revelar: "ramas"` hace que cada rama aparezca en su propio paso.
- Las flechas negras (~10 px, punta en V del mismo grosor) nacen justo por fuera de cada extremo de
  la frase, a la altura de la línea base, y bajan en diagonal hacia fuera hasta ~40 px sobre el
  emoji de la rama [c_0635]. Si la rama cae bajo la frase (ramas juntas, 9:16), nacen debajo del
  texto sin pasar de su extremo interior.
- `tam_texto` (px) cambia la frase del origen: 88 px en 16:9, 76 en 9:16. `emoji_tam` cambia los
  emojis (124). `separacion` sigue mandando sobre la distancia entre ramas.

### `circulos` — la audiencia: anillo de personas y círculo interior  ·  [10:45, 14:05]
```json
{ "tipo": "circulos", "texto": "Reservada para **unos pocos**", "tono": "r", "tono_interior": "v", "personas": 12, "emoji": "🧑‍💼", "centro": "⭐" }
```
- `radio` (360) y `radio_interior` (130), en px, cambian el tamaño de los dos círculos.

## Datos

### `tabla` — la tabla-marcador escrita a mano  ·  [5:25 → 10:05]
El recurso estrella: se llena columna por columna a lo largo de varias láminas.
```json
{ "tipo": "tabla", "esquina": "Métrica", "vacias": 1,
  "columnas": ["Ventas high ticket", "Dropshipping"],
  "filas": [{ "etiqueta": "Capital inicial", "celdas": [{ "texto": "$0-500", "tono": "v" }, { "texto": "$1,000-5,000", "tono": "r" }] }] }
```
- `revelar`:
  - `columnas` (por omisión): una columna por paso;
  - `celdas`: una celda por paso, como en el video;
  - `filas` o `todo`.
  En `celdas`, el encabezado de cada columna tiene su propio paso.
- `vacias`: columnas vacías a la derecha, que anuncian lo que falta.
- `fijas`: cuántas columnas ya se vieron antes. Esas salen completas desde el paso 0 y solo se
  revelan las nuevas.
- Una celda con `"circulo": true` lleva el dato encerrado.
- Tip: repite la misma tabla en varias láminas, sumando una columna cada vez con `fijas` igual a
  las columnas previas, e intercala láminas de explicación entre ellas.
- `ancho_etiqueta`: fracción del ancho para la columna de etiquetas (0.155 en 16:9, 0.24 en 9:16).

### `tarjetas` — criterios o métricas, una por paso  ·  [5:00, 9:25]
```json
{ "tipo": "tarjetas", "encabezado": "Las 6 métricas:", "items": [{ "emoji": "💵", "texto": "Ganancia por venta" }] }
```
Un ítem acepta `tono` (`v`, `r` o `n`) para pintar la tarjeta. Un texto suelto en `items` vale como
`{ "texto": … }`.
- El ancho sale del ancho útil del formato (1620 px en 16:9, 900 en vertical): hasta 4 tarjetas van
  en una fila (4 en 16:9 miden ~378 px) y en vertical, con 4 o más, van de 2 en 2.
- `columnas`, `ancho` (px por tarjeta) y `tam_texto` (px, por omisión 46) ajustan a mano.
- El emoji va arriba y a la misma altura en toda la fila; un rótulo de dos renglones crece hacia
  abajo [9:25]. Las tarjetas arrancan arriba de la lámina (`anclar`).
- La negrita a media frase («Tu oferta en **una frase**») conserva su espacio: el rótulo es un bloque de
  texto. QA da error si un contenedor flex mezcla texto suelto y negritas (se comía el espacio).

### `grafica` — líneas, barras o crecimiento  ·  [6:15, 7:25, 16:15, 38:10]
```json
{ "tipo": "grafica", "titulo": "Dropshipping", "subtitulo": "Escalabilidad",
  "series": [{ "nombre": "Escala", "forma": "recta", "tono": "a" }, { "nombre": "Costo de anuncios", "forma": "exponencial", "tono": "r" }],
  "banda": "Tu margen" }
```
- `grafica`: `lineas` (por omisión), `barras` o `crecimiento`.
- `forma` de cada serie: `recta`, `exponencial`, `curva`, `plana`, `s` o `baja`.
- Una serie con `puntos: true` lleva puntos sobre la línea.
- Las barras se definen así: `"barras": [{ "etiqueta": "Sueldo", "valor": 45, "tono": "a" }, { "etiqueta": "Producto", "valor": 100, "tono": "v", "emoji": "💰" }]`.
- `valor_texto`: la cifra sobre la barra («50%», «$9,000»), en negrita y del color de la barra. `emoji`
  va encima de la barra (140 px). Con los dos, de abajo hacia arriba: barra, cifra, emoji; la altura que
  ocupan se reserva UNA vez para toda la gráfica (~240 px con los dos, ~180 solo con emoji), así que las
  barras se acortan igual y ninguna manda el emoji al título. QA da error si un emoji tapa un texto y avisa
  si el de una gráfica queda pegado al borde de arriba.
- La etiqueta de cada serie (`nombre`) va junto a SU línea, cerca de su final, sin cruzar ninguna línea,
  sin tocar la punta de flecha ni pasar del eje (se prueban varias posiciones). QA da error si una línea o
  su punta atraviesa un texto. `plana` nace abajo (no «va ganando» al inicio).
- **Sin emojis en los textos de la gráfica** (`etiqueta`, `valor_texto`, `nombre`, `banda`, `eje_x`, `eje_y`):
  van dentro del SVG y salen con la fuente del sistema. El emoji va en `barras[].emoji`, en la `nota` o en el
  `texto`. QA lo avisa (en `fluent` y con `auto`).
- `eje_x` y `eje_y` son las etiquetas de los ejes. `revelar: "series"` o `"barras"` hace que
  aparezca una por paso.

### `linea-tiempo` — marcas, tramos de color y llaves  ·  [9:50, 11:15, 16:05]
```json
{ "tipo": "linea-tiempo", "marcas": [{ "texto": "Día 1" }, { "texto": "Día 14", "tono": "v" }, { "texto": "Día 30", "tono": "v" }],
  "tramos": [{ "desde": 1, "hasta": 2, "tono": "v", "etiqueta": "Ideal" }, { "desde": 2, "hasta": "fin", "tono": "r", "etiqueta": "Aquí renuncian" }] }
```
- Una marca acepta `pos` (de 0 a 1) y `arriba`, un texto sobre la marca como «$1B». Los textos de marcas
  y tramos van en SVG: sin emojis (ver `grafica`).
- Cada tramo aparece en su propio paso.

### `medidor` — barra verde → rojo con pin  ·  [4:20]
```json
{ "tipo": "medidor", "valor": 90, "texto": "Algunos modelos dejan ganar millones,\npero son **muy difíciles para empezar**." }
```

### `opciones` — pastillas y un cursor que elige  ·  [4:30]
```json
{ "tipo": "opciones", "items": [{ "texto": "FÁCIL", "tono": "v" }, { "texto": "MEDIO", "tono": "n" }, { "texto": "DIFÍCIL", "tono": "r" }], "elegida": 2 }
```

### `rejilla` — cantidad hecha visible  ·  [6:35, 14:45, 14:55]
- **Muchas cajas**:
  ```json
  { "tipo": "rejilla", "encabezado": "Tendrías que vender…", "emoji": "📦", "total": 300, "anotacion": "Son 300", "sello": "Mucha habilidad" }
  ```
- **Porcentaje**:
  ```json
  { "tipo": "rejilla", "punto": true, "total": 100, "columnas": 20, "destacar": [99], "texto": "¿El **99%**?" }
  ```
- **«Tú» en la multitud**:
  ```json
  { "tipo": "rejilla", "emoji": "👤", "total": 40, "columnas": 10, "destacar": [14], "emoji_destacado": "🧑‍💻", "etiqueta_destacado": "Tú" }
  ```
- Con `apagar_resto: true` todo lo que no está destacado queda gris. `tono` y `tono_destacado` (`v`, `r`,
  `g`) pintan los puntos; `emoji_etiqueta` pone un emoji sobre la `etiqueta_destacado`; `aspecto` (ancho/alto,
  1.55 por omisión) decide las columnas si no das `columnas`.
- **Sello y destacadas**: sobre cajas iguales el sello cae encima [6:45]; con `destacar`, el sello NUNCA tapa
  las destacadas (se acomoda solo, ver `sello` arriba). Agrupa las destacadas (las llenas primero, en orden)
  para que «41 de 100» se lea de un vistazo.
- `destacado_paso: N` hace que el color de las destacadas aparezca en el paso N, sobre la rejilla ya
  vista [43:15] (sin `etiqueta_destacado`).
- `encabezado` sale como rótulo gris; `encabezado_estilo: "frase"` lo pone negro a tamaño de frase,
  como la rejilla de 6:35 («To make $10k/month…»). Igual en `prueba` y `chat`.
- La `anotacion` va a la derecha, más abajo que el centro, con una flecha gris de 120-160 px que
  sale del borde de la rejilla y baja en gancho sobre la nota [6:45]. QA avisa si una flecha de
  anotación mide menos de 60 px.

### `reparto` — pastilla verde que se parte  ·  [15:25, 22:15]
```json
{ "tipo": "reparto", "titulo": "Reparto de ingresos",
  "total": { "datos": [{ "valor": "5k", "etiqueta": "Audiencia" }, { "valor": "$30,000", "etiqueta": "Ingresos" }] },
  "partes": [{ "etiqueta": "Parte del creador", "valor": "$21,000", "pct": "70%", "tono": "gris" },
             { "etiqueta": "Tu parte", "valor": "$9,000", "pct": "30%", "tono": "verde" }] }
```

### `calificacion` — opciones calificadas con estrellas y cursor  ·  [4:10, 4:45, 4:50]
Antes de la tabla-marcador, la referencia califica cada opción: un 🤔 arriba y una tarjeta gris con una
fila por opción (emoji, nombre y 5 estrellas pálidas). La mano enciende las estrellas de una fila por paso.
```json
{ "tipo": "calificacion", "emoji": "🤔", "max": 5,
  "filas": [{ "emoji": "🚚", "texto": "Dropshipping", "estrellas": 4 }, { "emoji": "💼", "texto": "Ventas high ticket" },
            { "emoji": "📈", "texto": "Trading", "estrellas": 1 }] }
```
- Paso 0: la tarjeta con todas las estrellas pálidas. Luego un paso por cada fila que trae `estrellas`,
  con la mano sobre la última estrella encendida.
- Por omisión solo se ve encendida la fila activa y las anteriores vuelven a pálido, como en 4:50;
  `acumular: true` las deja encendidas.
- `max`: cuántas estrellas por fila (5 por omisión, hasta 10). `emoji` va arriba (tamaño `chico`).
  `encabezado`, `nota` y `nota_paso` como en los demás diseños.
- Anclas `e0`, `e1`… (las estrellas de cada fila). Para una fila suelta de estrellas sobre una frase
  [4:10], usa `idea` con `estrellas`.

### `calendario` — días en tarjetas con fases de color  ·  [28:45 → 29:20]
```json
{ "tipo": "calendario", "titulo": "Calendario de 14 días", "fase_activa": 2,
  "dias": [{ "sub": "Inversión" }, { "sub": "Identificación" }],
  "fases": [{ "nombre": "Fase 1", "sub": "Calentamiento", "desde": 1, "hasta": 3, "color": "amarillo" },
            { "nombre": "Fase 2", "sub": "Entregar valor", "desde": 4, "hasta": 9, "color": "azul" }],
  "anotaciones": [{ "texto": "«Me gusta su contenido»", "dia": 1, "lado": "izquierda", "arriba": "12%" }] }
```
- `color`: `amarillo`, `azul`, `verde` o `rojo`.
- Cuántos días: `dias` (uno por día, con `sub`, `titulo` o `numero`) o `n` (14 por omisión, **hasta 42**:
  seis semanas). Con más de 20 días van de 7 en 7 (`columnas` lo cambia) y la fila se achica para caber;
  con 5-6 semanas se ocultan los `sub`. `palabra_dia` cambia «DÍA» (el rótulo de cada tarjeta y la
  pastilla); `rango` cambia la pastilla sin fase activa («DÍAS 1-14»). Una fase de un solo día dice
  «DÍA 10». Es error de contrato una fase que llega más allá de los días, `fase_activa` mayor que las
  fases, una anotación a un día que no existe o un `titulo`/`rango` que dice «N días» con otros N.
- `fase_activa` cuenta desde 1, igual que `activo` en `pasos` y `dia` en `anotaciones`. Sin
  `fase_activa` los días van en gris (la lámina que presenta el calendario, [28:45]); con ella, las
  celdas de la fase activa van en PASTEL con borde de su color y número casi negro, y las demás fases en
  un tinte plano casi blanco con el texto gris [ref_1760, 29:25]. La barra sí lleva el degradado
  saturado, con el nombre en blanco (~60 px); la pastilla del rango es blanca translúcida con la letra en
  el tono oscuro de la fase (QA avisa si baja de 3:1).
- El título de la fase va en `nombre` («Fase 2») y el subtítulo en `sub` («Entregar valor»), que se pinta
  aparte en regular. Nunca los unas con «·» dentro de `nombre`.
- El `sub` de cada día va a 32 px (28 en un calendario angosto); «DÍA» es un rótulo decorativo (~28 px,
  como en el video).
- Anotaciones: `tam` en px (56 por omisión, medido en m_1740) y `arriba` en px o en porcentaje
  (`"12%"`). Con anotaciones el calendario se angosta para que la nota quede fuera.
- Repite la lámina cambiando `fase_activa` para recorrer las fases.

## Interfaz y prueba

### `chat` — burbujas, un mensaje por paso  ·  [17:45, 19:00, 21:50]
```json
{ "tipo": "chat", "mensajes": [{ "de": "yo", "texto": "¿Quieres trabajar conmigo?" }, { "de": "otro", "texto": "¡Sí, me interesa!" }] }
```
La burbuja de «otro» es gris medio con letra blanca y las dos son pastillas redondas [19:00, 22:00].
Un texto entre corchetes dentro de una burbuja sale con resaltador amarillo, como `[nombre]`, legible
en la azul y en la gris: sirve para plantillas de mensaje (escríbelos sobre todo en los mensajes «yo»). En minúsculas es plantilla; en MAYÚSCULAS (`[PRECIO]`) es un dato pendiente y QA lo
marca como error hasta que lo llenes. Un texto suelto en `mensajes` vale como `{ "texto": … }`.
- Avatar: silueta por omisión. `avatar_yo` / `avatar_otro` (o `avatar` en un mensaje) con un emoji la
  cambian, por ejemplo `"avatar_otro": "🤖"` para la IA; `false` la quita.
- `tam_texto` (px) cambia la letra de las burbujas (54 en 16:9, 58 en 9:16).
- `hora` por mensaje: un separador gris centrado sobre la burbuja, en el mismo paso. Un gancho en chat
  tiene que entenderse sin sonido: muestra la hora de los dos extremos y pega el sello a la burbuja culpable.
  Cada burbuja es un ancla `m0`, `m1`… (se cuentan desde 0):
  ```json
  { "tipo": "chat", "sello": "Tarde", "sello_sobre": "m1",
    "mensajes": [{ "de": "otro", "hora": "11:40 pm", "texto": "¿Cuánto cuesta?" },
                 { "de": "yo", "hora": "9:05 am", "texto": "¡Buen día! Sí, cuesta…" }] }
  ```
  QA avisa si un chat lleva `sello` sin `sello_sobre`.

### `prueba` — capturas reales, con el dato encerrado  ·  [0:35, 15:45, 19:30]
```json
{ "tipo": "prueba", "capturas": [
  { "src": "assets/captura.png", "circulo": [62, 40, 30, 12], "tachar": [[5, 3, 25, 6]] } ] }
```
- `circulo` y `tachar` van en porcentaje de la imagen: x, y, ancho, alto.
- **Regla 9: nunca inventes testimonios, capturas ni cifras.** Usa solo resultados reales, con permiso,
  y tacha los datos personales. Si todavía no tienes la prueba, no la finjas:
  - `{ "hueco": "La tuya va aquí" }`: tarjeta punteada y vacía, con la frase a mano.
  - `{ "post": { "nombre", "usuario", "fecha", "texto": [...], "clave" }, "fuente": "real, con permiso" }`:
    un post que transcribes de uno real. Se pinta como post y la `fuente` va abajo, tal cual.
  - `{ "post": { "texto": [...] }, "ejemplo": true }`: una **maqueta visible**, nunca un testimonio. Sale
    sin avatar, usuario, fecha ni «···», con un sello rojo «EJEMPLO» en la tarjeta, y `clave` no encierra
    dinero, porcentajes ni números de clientes o ventas. QA avisa si una maqueta trae cifras o
    resultados («cerré», «cliente», «venta»).
  - Un `post` sin `fuente` ni `ejemplo`, o con los dos, es error de contrato.

### `boton` — botón de interfaz y cursor que lo aprieta  ·  [23:15, 38:15]
```json
{ "tipo": "boton", "boton": "Generar", "emoji": "🤖", "texto": "Solo das clic en el **agente correcto**…" }
```
`cursor` acepta `mano` (por omisión) o `flecha`.

### `stack` — lo que incluye la oferta, pieza por pieza  ·  [42:30-42:50]
En 16:9 va **a sangre**: el bento llena la lámina de borde a borde (18 px de margen), las casillas vacías
se ven en gris al cortar y cada pieza se llena en su paso como una **tarjeta de producto a color** con la
letra blanca en mayúsculas. Se lee como «mira todo lo que te llevas», no como una lista. El `remate`
(con ✅) es una lámina aparte en la referencia [42:50]: entra en su paso sobre un lienzo limpio, con
`total` y `nota` debajo. Va en blanco, no en lámina oscura.
```json
{ "tipo": "stack",
  "items": [{ "emoji": "🤖", "texto": "Tu agente de ventas", "doble": true }, { "emoji": "📚", "texto": "Las 12 clases" },
            { "emoji": "🧑‍🏫", "texto": "Un mentor", "alto": 2, "sub": "Por 6 meses" },
            { "emoji": "🗓️", "texto": "4 llamadas en vivo" }, { "imagen": "assets/logo.png", "texto": "Grupo privado" }],
  "remate": "Hecho **contigo**" }
```
- Cada pieza se nombra como producto: un sustantivo corto, **2 a 4 palabras** (QA avisa desde 6). Más de
  8 piezas ya no se leen: agrupa.
- Un ítem lleva `emoji` o `imagen` (un logo real), `texto`, `sub` (subrenglón en píldora, «Por 6 meses»),
  `doble: true` (dos columnas), `alto: 2` (dos filas) y `color`: `morado`, `marino`, `naranja`, `verde`,
  `azul` o `negro`. Sin `color`, cada pieza toma uno por turno en ese orden. `tono` (`v`, `r`, `n`) da
  la tarjeta pastel con letra negra.
- `columnas`: 3 (4 con 7 piezas o más); las filas se calculan. Sin rótulo: el `encabezado` no se dibuja a
  sangre (QA avisa); si hace falta, va en la lámina anterior.
- `sangre: false` (y el 9:16) usa la pila de casillas grises con el rótulo, el remate y el `total` debajo.
- `remate_paso` y `nota_paso` mueven el cierre.

## Especiales

### `foco` — atenúa la lámina anterior y escribe encima  ·  [15:20]
```json
{ "tipo": "foco", "texto": "Sigues cobrando mientras el creador siga promoviendo el producto." }
```
- La frase de foco es la PROTAGONISTA, no una nota al margen: Caveat a 88 px en 16:9 (84 si pasa de 14
  palabras; 96 / 88 en 9:16) y hasta ~1560 px de ancho, como en el cuadro 15:20. `tam` la cambia.
- `opacidad`: por omisión 0.2.
- `nota`: con `texto`, va debajo, más chica y a mano, en el mismo corte (`nota_paso` la mueve). Sin
  `texto`, la `nota` es la frase principal.
- No puede ir como primera lámina.
- El fondo atenuado repite el contenido y las flechas de la lámina anterior, pero no su sello ni
  su cursor.
- Acepta su propio `sello`.

### `camara` — tramo a cámara (en el montaje se ve tu grabación)
```json
{ "tipo": "camara", "voz": "Déjame contarte cómo empecé", "dur": 4 }
```
- En el presentador se proyecta en **negro limpio**; la `nota` («🎥 A cámara») solo sale en los PNG, la
  hoja y la vista de ensayo.
- Un tramo en vivo sin láminas (demostración, actividad, preguntas) es una `camara` con su `nota` y
  `dur` en segundos (`"dur": 300`): cuenta en la duración de la pieza (ARCOS.md).

---

## Campos finos (para ajustar sin tocar CSS)

| Campo | Dónde | Qué hace |
|---|---|---|
| `texto_paso` | idea, flujo, pasos, cifra, objeto, oscura, grafica, linea-tiempo, medidor, opciones, rejilla, prueba, boton, circulos | Paso en que aparece el texto. Cuenta desde 0. |
| `nota_paso` | idea, lista, flujo, pasos, cifra, cita, objeto, tarjetas, oscura, grafica, linea-tiempo, medidor, boton, circulos | Paso de la nota manuscrita. Por omisión, el paso siguiente al texto (en `pasos`, el mismo). |
| `clic_paso` | pasos, opciones, boton, y cualquier lámina con `clic` de texto | Paso en que llega el cursor. |
| `sello_paso` | cualquiera con `sello` | Paso del sello; por omisión, uno extra al final. |
| `banda_paso` · `anotacion_paso` · `destacado_paso` · `centro_paso` · `interior_paso` | grafica · rejilla · rejilla · circulos · circulos | Paso de ese elemento. |
| `paso` | ítems de `marcas`, `tramos`, `anotaciones` | Lo mismo, por ítem. |
| `tam_texto` | idea, lista, flujo, pasos, objeto, tarjetas, medidor, boton; en px: bifurcacion, cita, chat | `compacto`, `chico`, `medio`, `grande`, `enorme` o un tamaño en px (`"70px"`). |
| `encabezado_pos` | idea | `arriba` (por omisión) o `entre` (entre el emoji y la frase). |
| `encabezado_estilo` | rejilla, prueba, chat | `rotulo` (gris chico, por omisión) o `frase` (negro, a tamaño de frase). |
| `anclar` | cualquiera | `arriba` o `centro`: dónde arranca el contenido. |
| `fondo` | lámina oscura | `violeta`, `azul` o `negro`. |
| `tam` | cifra y foco | Tamaño de letra en px. |
| `separacion` | lista, flujo, pasos, bifurcacion, reparto | Espacio entre elementos, en px. |
| `tam_etiqueta` | pasos | Tamaño de la etiqueta de cada paso, en px (86 / 74 / 64 según `n`). |
| `tachar_paso` | idea, cita, cifra (lámina o línea) | Pasos DESPUÉS del texto en que cae el tachón de `~~frase~~`. |
| `arrastre` | pasos con `clic` | `false`: la mano no arrastra la ruta (ver `pasos`). |
| `alto`, `ancho` | objeto, flujo (nodo), prueba, rejilla, tarjetas (`ancho`) | Tamaño en px. |
| `prefijo` | pasos con íconos | Texto antes del número. Por omisión «Paso»; con `false` se quita. |
| `ancla` | cualquiera | Frase que dispara el paso 0 en el montaje (atajo de `anclas[0]`). |
| `oscura: true` | cualquiera | Pinta esa lámina con el fondo oscuro de la oferta. |
| `sello_sobre`, `sello_pos`, `clic_pos` | cualquiera | Mueven el sello y la punta del cursor (ver arriba). |

Un valor con tipo equivocado se descarta con aviso y uno fuera de rango se recorta con aviso (`n: 99 → 42`), y la revisión de calidad lo
cuenta como error. Un campo que el diseño no usa se ignora con aviso (−3), con sugerencia si parece
un error de dedo.

**`voz` y `anclas` como lista llevan un texto por paso, ni más ni menos.** Si no cuadran con los
pasos de la lámina, QA da error: los cortes del montaje se desalinean y las frases de más se pierden.

## Anclas

`sello_sobre`, `clic` y las flechas apuntan a anclas. Las que existen por diseño:
`texto` y `emoji` (idea), `s0`, `s1`… (stack), `m0`, `m1`… (chat), `e0`, `e1`… (calificacion), `i0`, `i1`… (lista), `n0`… (flujo), `k0`… (pasos), `o` y `r0`… (bifurcación),
`l0`… (cifra), `icono` y `cita` (cita), `objeto`, `medidor`, `op0`… (opciones), `rejilla`, `anot` y
`d<N>` (rejilla), `total` y `parte0`… (reparto), `dia0`… (calendario), `boton`.

## Datos que se llenan una vez

Un dato que falta o que se repite (precio, días, WhatsApp) se escribe como `{{CLAVE}}` en cualquier
texto y se llena UNA vez en `datos`, arriba del deck:

```json
{ "datos": { "PRECIO": "$4,997", "WHATSAPP": "33 1234 5678" },
  "laminas": [ { "tipo": "cifra", "lineas": ["Hoy: __{{PRECIO}}__"], "voz": ["Hoy cuesta {{PRECIO}}"] } ] }
```

- La clave va en MAYÚSCULAS. Se sustituye en todos los textos, también en la `voz`.
- Una `{{CLAVE}}` sin valor sale como `[CLAVE]` en un **hueco amarillo**, igual que un `[PRECIO]`
  escrito a mano. QA lo cuenta como error de dato pendiente, con sus láminas, y lo deja en `qa.json` →
  `pendientes`. Nunca se inventa una cifra para rellenar.
- **Dato propuesto** (sin nadie a quien preguntar: agente de fondo, el mini, un loop): un dato que no es
  sensible se escribe como objeto y se pinta igual, pero QA lo lista en `qa.json → por_confirmar` con sus
  láminas y avisa; el deck no es final hasta confirmarlo:
  ```json
  { "datos": { "TIEMPO_LLAMADA": { "valor": "30 minutos", "propuesto": true }, "PRECIO": "$4,997" } }
  ```
  Precio, garantía, cupos, fechas límite, descuentos, bonos, testimonios y resultados **nunca** se
  proponen (es error de contrato): van como hueco `{{CLAVE}}`. Un comentario `_datos` no cuenta.
- El `[x]` en minúsculas dentro de un `chat` es otra cosa: lo que el usuario personaliza en el mensaje
  (`[nombre]`), no un dato pendiente.

## Marcas de texto

| Marca | Resultado |
|---|---|
| `**frase**` | negrita: la frase clave |
| `__frase__` | negrita + subrayado rojo a mano |
| `==frase==` | negrita + resaltador amarillo |
| `~~frase~~` | tachón rojo a mano (solo el rojo: sin el tachón negro del navegador). Por omisión cae en el paso del texto; con `tachar_paso: 1` (idea, cita, cifra) llega un paso después, para que se lea antes [4:05]. QA avisa el tachado que aparece ya tachado |
| `*frase*` | cursiva: la voz de otro (una objeción) [17:25]. El asterisco va pegado al texto: `5 * 3` no cambia |
| `^^frase^^` | remate en su propio renglón, en negrita y ~1.5× [18:30]; puede llevar `__` o `==` dentro |
| `{v:texto}` `{r:}` `{n:}` `{g:}` `{a:}` `{o:}` | color semántico: verde, rojo, naranja, gris, azul o dorado (cifra sobre lámina oscura) |
| `[[texto]]` | letra manuscrita dentro de la línea |
| `[PRECIO]` | dato pendiente (MAYÚSCULAS): hueco amarillo; mejor `{{PRECIO}}` con `datos` |
| `\n` | salto de línea. Una marca puede abarcar el salto: `**mejor\nmodelo**` va en negrita en los dos renglones, y el subrayado o el tachón se dibujan renglón por renglón |

## Emoji compuesto

| Escritura | Resultado |
|---|---|
| `"🧑‍⚕️+💰"` | base + insignia abajo a la derecha |
| `"no:🎥"` | base + ❌ abajo a la izquierda |
| `"si:💸"` | base + ✅ abajo a la izquierda |
| `"no:🧑‍⚕️+💰"` | las dos: ❌ a la izquierda y 💰 a la derecha |
| `["no:📚", "si:🤖"]` | solo en `idea`: el par antes/después en fila [10:55] |

La ✕ de `no:` mide ~62% del emoji y le cruza la esquina inferior izquierda [ref_628]; la ✅ es verde
saturado y se dibuja igual en Apple y en Fluent.

Un solo «+». Tres partes o un prefijo que no sea `no:`/`si:` es error de contrato (ver EMOJIS.md).
