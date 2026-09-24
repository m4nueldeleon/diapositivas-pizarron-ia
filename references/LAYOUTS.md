# Catálogo de diseños (`tipo`)

Cada lámina de `deck.json` es un objeto con `tipo` más sus campos. Todo texto acepta las marcas de
[markup](#marcas-de-texto). Entre corchetes va el momento del video de referencia donde aparece
ese diseño.

Son **32 diseños**: 30 de lámina (texto e ideas, procesos y relaciones, datos, interfaz y prueba) y 2 especiales,
`foco` y `camara`. `ejemplos/demo/deck.json` los usa todos.

**Campos del deck** (arriba de `laminas`)

- `titulo`, `formato` (`16:9`, `9:16`, `1:1`, `4:5`), `emoji` (`apple` o `fluent`; `auto` solo como respaldo
  heredado: cambia de set según la máquina y QA revisa los dos; ver EMOJIS.md, «Qué set usar»), `animacion`
  (`seco`, `suave`), `idioma`, `piel` (🏻…🏿 o `ninguno`: el tono de piel de las personas; EMOJIS.md, «Personas»).
- `marca`: `{ "texto": "<tu @ o dominio>", "sufijo": "<opcional>" }` o `{ "logo": "assets/logo.png" }`.
  `marca.posicion: "arriba" | "abajo"` coloca la firma; `firma: false` la oculta por lámina.
  **Omítela si no hay marca real**: las láminas salen sin firma. Un valor de relleno («tumarca.com»,
  «@tuusuario», «<…>») se omite del render y deja FIRMA por confirmar (borrador).
- `pieza`: `reel`, `tutorial` (2-8 min), `vsl-corto` (3-6 min), `clase-corta` (15-30 min), `video`, `vsl`,
  `clase`, `webinar`, `propuesta` o `libre`; `duracion_objetivo`: minutos (`45`) o `"mm:ss"`; `en_vivo: true`
  si se presenta en vivo. QA mide la voz contra eso ([ARCOS.md](ARCOS.md)): un objetivo fuera del rango de su
  pieza avisa (usa la pieza corta que le toca), «menos de la mitad» se mide con el tiempo de LÁMINAS (la
  cámara no rellena), más de 40% a cámara avisa y más de 60% con las láminas bajo la mitad es error aunque
  sea en vivo. `qa.json → duracion` separa `laminas` y `camara`.
- Cualquier otra clave de primer nivel se ignora y QA la avisa, también las que empiezan con `_` (`_marca`,
  `_datos`): un aviso de entrega escondido en el deck no lo lee nadie. Solo `_comentario` queda libre.
- `persona: "tu" | "ustedes"`: trato de pantalla y voz. `persona_excepciones: ["frase que se conserva"]` excluye esas frases del QA de persona, sin distinguir mayúsculas ni acentos.
- `datos`: ver [Datos que se llenan una vez](#datos-que-se-llenan-una-vez).

**Campos que acepta cualquier lámina**

- `id`: nombre corto para los archivos y los cortes.
- `voz`: lo que se dice. Puede ser un texto o una lista con un texto por paso; sirve para
  tiempos, anclas y QA.
- `paga: "<id>"`: retoma el gancho al cerrar; el id debe existir (si falta, QA avisa). Ver GUION §6.
- `dur`: segundos por paso, como número o como lista.
- `revelar`: `"todo"` enseña todo de un golpe; por omisión se revela un elemento por paso.
- `sello`: texto de sello de goma que cae en un paso extra. Es una etiqueta blanca OPACA con doble
  borde rojo: tapa lo que queda debajo, como en [6:45]. **Sin posición se acomoda solo en un hueco libre**: prueba
  el centro limpio, centrado BAJO el bloque, centrado SOBRE él, a su derecha, debajo a la derecha y las 9 zonas, y se queda en el
  primero que no pisa renglones, emojis ni la tinta a mano (subrayados, llaves, tachones, flechas, con 24 px de aire);
  cada lugar se prueba a su tamaño, a 0.85 y a 0.7 (en
  `rejilla`, centrado sobre las cajas, como en [6:45]; si la rejilla tiene celdas en `destacar`, esas celdas
  son el dato que se cuenta: el sello se acomoda solo en la banda entre renglones que menos destacadas tapa
  o, si todas tapan más del 25%, en una franja libre junto a la rejilla. El sello es el remate y la cifra ya se
  dijo: tapar parte de la rejilla es fiel a [6:45]; QA solo avisa si tapa más del 25% de las destacadas). Se
  El sello libre respeta `--margen-v` arriba y abajo (100 px en 16:9; abajo 140 px con firma inferior), deja 24 px al bloque y nunca se monta sobre el último renglón. La firma cuenta como obstáculo. Su ancho girado no supera `max(0.8 × ancho del bloque, 420 px)` y su letra no supera 96 px. QA avisa si invade la franja inferior o la firma, o queda corrido en horizontal más del 15 % del ancho del lienzo respecto al centro del bloque. Se mueve con:
  - `sello_sobre: "<ancla>"`: lo centra sobre ese elemento (ver [anclas](#anclas)) y lo hace medir
    ~100% de su ancho, como en [6:45] (letra de 72 a 170 px). Eso vale para rejillas y cajas, y también sobre el
    `emoji` de una `idea`: tapa el ícono a propósito y QA no lo cuenta como error (sí cuenta cualquier otro emoji
    y todo renglón que quede debajo). Sobre una
  burbuja de `chat` el sello va con tinta fija y se pega junto a ella sin taparla (ver `chat`). No lo pongas
  sobre notas ni flechas: QA lo avisa;
  - `sello_pos`: `centro`, `arriba`, `abajo`, `izquierda`, `derecha`, `arriba-izquierda`,
    `arriba-derecha`, `abajo-izquierda` o `abajo-derecha`. Es un punto de partida: si esa zona pisa texto, un
    emoji o la tinta a mano, el motor lo corre lo mínimo **sin salir de ese lado del lienzo** (y lo reduce hasta
    0.7 si hace falta); si ni así queda limpio, se queda en la zona y QA lo marca.
  QA da error si el sello tapa un renglón o un emoji, o si **corta un subrayado o un tachón**; avisa si queda a
  menos de 20 px de uno, o si tapa una flecha, una llave o un círculo a mano.
  Siempre queda dentro del lienzo y, si es muy largo para el formato, se reduce (QA avisa bajo 70%:
  un sello lleva 1 o 2 palabras).
- `clic`: el ancla que el cursor va a presionar; `cursor` elige entre `mano` y `flecha`.
  `clic_pos: [x, y]` (de 0 a 1 dentro del ancla) mueve la punta del dedo. En un `boton` la punta cae
  por omisión a la derecha del emoji, a media altura, con el emoji entero a la vista [23:15]. En una tecla de
  `pasos` la punta toca el PIE del número (0.64, 0.74) con una mano más chica, y el número se lee entero [ref_115]:
  las etiquetas bajan solas para que la mano no las toque. En un mapa con `iconos`, la punta cae en el cuarto
  inferior derecho del emoji. QA da error si la mano tapa más del 40% del número de la tecla.
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
  contiguas, como el botón y su «Después del clic», cuentan como uno). La frase entera marcada también cuenta
  («__Guarda este reel__», «**Comenta MINUTA**»).
- `llamado: false`: la lámina NO es un llamado aunque sea un `boton` o empiece con un verbo: es para el botón de una
  demostración («Enviar», «Generar»; ver `boton`).
- `paso_ref`: solo para la réplica (`scripts/comparar.mjs`): el paso de la lámina que se ve en el cuadro del
  video, desde 0 (`-1` = el último). `ms_ref` (ms) captura ese paso en ese instante de su animación, no en su estado
  final (la mano ya en la tecla 1, antes de arrastrar [ref_115]: `"paso_ref": 0, "ms_ref": 900`).
- `anclas`: frases que disparan cada paso en el montaje.
- `contrato: true`: marca la lámina del **contrato de tiempo** («Te pido los próximos 10 minutos» [2:03]). QA saca de ahí
  los minutos (del `reloj` o de «los próximos N minutos») y los compara con la voz: más de 30% de diferencia avisa
  (`qa.json → arco`). Sin la marca, QA lo busca en el primer 25% del deck, en un `objeto` con `reloj` o en una
  `idea`/`objeto`/`cifra` con «los próximos N minutos»; «en 5 minutos lo configuras» dentro de un paso no es contrato.

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
- `emoji_lado: true` pone el emoji a la izquierda en la misma línea [10:15], a ≈1.15× la letra de la frase (≈97 px
  con la frase `medio` de 84): en el video el 👥 mide ~66 px junto a una frase de ~60, no el doble. `emoji_tam` lo fija.
- **Par antes/después** [10:55]: `"emoji": ["no:📚", "si:🤖"]` pone dos emojis en fila;
  `apagar_emoji: 0` atenúa el primero (el negado) y `emoji_paso: 1` revela el segundo después.
  Solo en `idea`.
- `encabezado`: presenta lo que sigue con “:” o “…”, o numera («Paso 1», «Objeción #2»). Nunca lleva módulo, semana o «ejemplo» separados por “·” o “|”: eso es un eyebrow. Esos datos van al texto, a una línea de tiempo o una sola vez a la voz. Contraejemplo: «Módulo 2 · semana 3 · delegación». Rótulo gris arriba. Con `encabezado_pos: "entre"` va ENTRE el emoji y la
  frase [34:25 «Reason #1»].
- **Objeción o «Razón #N»** [34:25, 35:15] — una forma para todas las del deck:
  ```json
  { "tipo": "idea", "emoji": "no:⌨️", "encabezado": "Objeción #1", "encabezado_pos": "entre",
    "texto": "**«No sé nada de tecnología»**" }
  ```
  El emoji es lo que dice que le falta, negado (EMOJIS.md, «Compuestos útiles»: suelto, `no:X` es la objeción). Si la
  objeción es una pregunta («¿Por qué subiste?»), 🤔 sin prefijo; nunca niegues el ícono de un paso del mapa (QA avisa).
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

Para cerrar un mapa de letras, usa `vineta: "letras"` y una letra por ítem. Las letras se dibujan
en negrita, después del emoji explícito de cada ítem: emoji → letra → texto. Sin emoji conserva el cierre anterior. `como` solo hereda del mismo tipo; no convierte un `pasos` en `lista`.

```json
{"tipo":"lista","vineta":"letras","letras":["R","E","C"],"items":[{"emoji":"🎭","texto":"Rol"},{"emoji":"📋","texto":"Encargo"},{"emoji":"🧭","texto":"Contexto"}]}
```
```json
{ "tipo": "lista", "encabezado": "Sin:", "vineta": "x",
  "items": ["Pasar años trabajando **12 horas al día**", "**Construir** una audiencia"] }
```
- `vineta`: `x` (❌), `check` (✅), `numero` (teclas 1️⃣–9️⃣ y desde 10 número en tinta y negrita), `letras` o cualquier emoji. Omitirla da una lista neutra. También puede ir un `emoji` por ítem.
  ✅ solo para «Incluye», «Es para ti si», «Te llevas», «Sales con / Hoy hiciste» y el mapa `hechos`. Temario, agenda, actividades, módulos, evaluación y pasos llevan `numero` o un emoji por ítem; objetivos, 🎯. Una lista con `{{HUECO}}` nunca lleva ✅.
- Un ítem con `"tachado": true` recibe un tachón rojo. Con `"tachar_despues": true` en la lista,
  los tachones llegan después de que aparece todo [4:05], **cada uno en su paso**: 3 ítems tachados dan 6 pasos
  (3 ítems + 3 tachones), y la `voz` lleva 6 textos.
- Arranca arriba y crece hacia abajo (`anclar`); con `revelar: "todo"` se centra.
- **Descartes** [m_256 4:16, 4:05]: si TODOS los ítems van tachados, cada renglón va centrado, en
  seminegrita, y la lista se queda centrada en la lámina con su hueco reservado (el primer renglón aparece
  ya en su lugar final). El tachón es un plumón grueso (~10 px) que arranca antes de la viñeta y sale por
  la derecha. `alinear: "centro"` lo fuerza en cualquier lista; `alinear: "izquierda"` lo quita. Las listas
  con encabezado («Sin:», razones) siguen a la izquierda y arriba [1:35, 3:30].
- **Pilares que vuelven** [37:40 → 39:45]: `activo` (desde 1) muestra la lista entera y apaga los demás ítems al 25%;
  `hechos: [1, 2]` los deja encendidos con su ✅ al final. La lista se declara una vez y vuelve con
  `"como": "<id>"` (hereda `items`, `encabezado`, `tam_texto`, `separacion` y `vineta`). Una lista con `activo`,
  `hechos`, `como` u `oscura` va centrada. Ejemplo en `oscura`.

#### Lista a dos columnas: contraste

Para Sí/No o antes/después usa `lista.columnas`, con dos objetos. Cada columna lleva `titulo`,
`tono` (`v`, `r`, `n`), `vineta` (`check`, `cruz`), `items` y opcional `sello`/`sello_paso`.
Primero se revela la ganadora completa, un ítem por paso, luego la perdedora.
`revelar: "columna"` muestra una columna por paso; `apagar: 1` atenúa la segunda (índice desde 0).
Anclas `c0`/`c1` para sellos y `i0`… para ítems; `nota` añade el remate manuscrito.
Un par de conceptos cabe en `idea` con dos emojis no:/si:; `cuadrantes` compara bloques de igual peso.
El `encabezado` presenta o numera, igual que en `idea`; no es un eyebrow.

```json
{"tipo":"lista","columnas":[{"titulo":"SÍ","tono":"v","vineta":"check","items":["Una tarea concreta","Una fecha"]},{"titulo":"NO","tono":"r","vineta":"cruz","items":["Pedir todo junto","Dejarlo abierto"]}],"nota":"Empieza por una tarea"}
```

### Fuente de un dato o un estudio (`idea`, `lista`, `objeto`, `flujo`, `grafica`, `cifra`, `cita`, `rejilla`, `tabla`, `tarjetas`, `linea-tiempo`)
`"fuente": "Antonio Damasio, «El error de Descartes» (1994)"` pinta al pie de la lámina una línea en sans gris de
40 px (36 en 9:16), sin cursiva: **un solo estilo** para citar, «Autor, «obra», medio (año)» («Reich y Ruipérez-Valiente,
«The MOOC pivot», Science (2019)»). Si solo abriste una fuente secundaria (la primaria dio 403), agrega «vía <medio>»; si
no abriste ninguna, el dato no entra (GUION §7 c). QA la clasifica: con «caso real» o «con permiso» es prueba propia; con
año, estudio, medio o «vía», de mercado (`qa.json → prueba`). Aparece con el dato (el paso
del texto, del último nodo o de la última línea de la cifra; en `rejilla`, con el destacado; en `tabla`, `tarjetas` y
`linea-tiempo`, con su último paso); `fuente_paso` la mueve. Un gancho con un dato publicado lleva su `fuente` en la
MISMA lámina (la primera vista es muda): QA avisa una `rejilla` que afirma una proporción («54 de 100», puntos
destacados) sin `fuente` ni `{{…}}`; una pregunta o un ejemplo dicho como tal («Imagina 100…») no cuentan. No cites con `nota`: la nota
es Caveat de 60 px y la misma función sale con otra jerarquía; QA avisa cuando una nota tiene forma de cita
(Autor … (año)). La atribución a mano de una `cita` («Antonio Damasio, neurocientífico») sí va en `nota`.

### `cuadrantes` — bloques de color a sangre  ·  [10:20]
Lo que NO necesitas va en rojo pálido y lo que SÍ en verde pálido. Aparece un bloque por paso.
```json
{ "tipo": "cuadrantes", "items": [
  { "emoji": "no:🎥", "texto": "Crear contenido", "tono": "r" },
  { "emoji": "si:💸", "texto": "**$0** de capital", "tono": "v" } ] }
```
`tono`: `r`, `v`, `n`, `g`, `a` o `b` (blanco). `columnas`: por omisión 2. `revelar: "todo"` muestra los bloques
juntos en el paso 0. El emoji mide ~24% del lado menor de su bloque (130 px con 4 bloques, como ref_628; 220 con 2
a lo alto); `items[].emoji_tam` (px) lo fija a mano. Los bloques van saturados donde cae el texto, con un brillo
blanco en la esquina inferior izquierda, y la letra a 84 px en peso medio con el emoji pegado a ella.

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
  "lineas": ["1 millón × **0.1-0.3%** = 1-3 mil", "1-3 mil × $25,000 = __$25-75 millones__"] }
```
- Con una sola línea sale enorme, a 140 px. Con dos o más, la última (el resultado) va a ~1.2× (100 px) [3:15] y lo
  que se destaca va con `**negrita**` o `__subrayado__`.
- **Cada línea es una cuenta completa** («1,000 × $25,000 = __$25M__»), centrada por su cuenta: una línea que empieza
  con «=», «×» o «+» cuelga de la anterior y QA la avisa. Una ecuación de una línea **se encoge** (hasta 96 px; 72 si
  son varias) antes de partirse; si ni así cabe, se parte balanceada y QA lo avisa: escríbela en dos líneas del deck.
- El sello de una cifra se acomoda solo debajo de la cuenta (no la tapa); `sello_pos` lo fija.
- **Algo que se descarta** [4:05]: `{ "texto": "~~Más horas = más dinero~~", "tachar_paso": 1 }` como línea:
  se lee primero y el tachón rojo llega en el paso siguiente (`tachar_paso` en la lámina vale para todas).
- `arriba`: nota manuscrita encima. `abajo`: etiqueta chica, como «Seguidores».
- **Proyección al espectador** (lo que ganará o conseguirá quien mira): `arriba` es el lugar de la
  **condición, con número**, y las tasas van en **rango**, como la referencia [33:45-33:55]. Nunca un
  «Supuesto:» vacío; QA lo avisa, y también una cuenta que no trae NINGÚN rango (GUION §3.8 b):
  ```json
  { "tipo": "cifra", "arriba": "Si mandas 10 mensajes al día por 10 días:", "lineas": [
    "100 × {{TASA_RESPUESTA}} = {{PLATICAS}} pláticas", "{{PLATICAS}} × {{TASA_CIERRE}} = __{{CLIENTES}} clientes__"] }
  ```
  Las tasas NO se inventan: salen de `datos` con su origen real (`"TASA_RESPUESTA": "10-20%"` medido en tus
  últimos 100 mensajes) o se declaran pendientes; con eso, el total sale en rango. Una tasa escrita a mano en la
  cuenta, sin `fuente` ni `{{TASA_…}}`, es «tasa sin origen» (aviso y borrador).
- `fuente`: de dónde sale un dato publicado (el tamaño de un mercado); sale en sans gris de 40 px al pie y exime
  la cuenta del aviso de proyección. Es la misma `fuente` de `idea`, `lista`, `objeto`, `flujo`, `grafica` y `cita` (ver «Fuente de
  un dato o un estudio»).
- `[[palabra]]` pone una palabra en letra de mano dentro de la ecuación: `100-250 [[ventas]] × $100`.
- Cada línea puede ser un objeto `{ "texto", "tam", "peso", "tono" }` para jerarquizar. **Precio con ancla** — El ancla es dinero que el espectador PAGA o PIERDE, en la misma unidad y periodo que el precio: alternativa cara, sueldo, nivel superior, costo de financiarse o lo que nunca cobra, con fuente. Nunca un saldo que sí llegará (cuentas por cobrar, «en la calle», facturación o ventas brutas). Si el dinero llega tarde, ancla con su costo: {{TASA_…}} en `datos` con fuente, u horas de cobranza × {{COSTO_HORA}}. Un total calculado en una `cifra` «Si…» sigue permitido si es un costo. Contraejemplo inválido: «En la calle hoy: $60-90 mil» → «[producto]: [precio]».
  El ancla va chica y gris; el precio, grande y abajo:
  ```json
  { "tipo": "cifra", "lineas": [
    { "texto": "Una recepcionista: {g:$9,000 al mes}", "tam": "64px", "peso": 500 },
    { "texto": "Tu agente: __$1,500 al mes__", "tam": "120px", "peso": 800 } ] }
  ```
- **Inversión anclada** (propuesta, ARCOS.md bloque 7): tres líneas-objeto. Arriba, en gris, el costo de no hacer
  nada en la MISMA unidad y periodo que la inversión, con los números del cliente (de la llamada de diagnóstico,
  como `{{…}}` en `datos`); en medio, la inversión grande; abajo, el desglose por persona, por día o en quincenas
  (MI-MARCA, «Formato de los pagos»). QA avisa si la inversión de una propuesta no trae ese costo en la misma
  lámina o en la anterior:
  ```json
  { "tipo": "cifra", "lineas": [
    { "texto": "Hoy: {g:{{HORAS_PERDIDAS}} h × {{COSTO_HORA}} = {{COSTO_MES}} al mes}", "tam": "60px", "peso": 500 },
    { "texto": "Inversión: __{{PRECIO}}__", "tam": "120px", "peso": 800 },
    { "texto": "{{PRECIO}} ÷ 40 vendedores = __{{PRECIO_POR_PERSONA}} por vendedor__", "tam": "60px", "peso": 500 } ],
    "voz": ["Hoy se les van {{HORAS_PERDIDAS}} horas al mes: {{COSTO_MES}}.", "La inversión es {{PRECIO}}.", "Por vendedor, {{PRECIO_POR_PERSONA}}."] }
  ```
  Con `"datos": { "HORAS_PERDIDAS": { "pendiente": true, "motivo": "sale de la llamada de diagnóstico" }, … }` si
  aún no hay llamada. **Desglose de un precio** («$3,000 ÷ 30 días = __$100 al día__») no es una proyección: una
  línea que divide un monto o el precio y un total que termina en «por/al/cada + unidad» no pide condición ni rango.
  «= __$500 al día en ventas__» sí es promesa y sigue las reglas de arriba.

### `objeto` — foto real recortada o emoji gigante  ·  [1:40, 23:20]

- `logos: ["assets/logo-propio.png"]` añade una fila bajo el texto, en su mismo paso: 40 px de alto en video,
  52 px en sala. No añade precio ni una tarjeta. La sombra solo se aplica al comprobar transparencia:
  una imagen con cuatro esquinas opacas genera aviso («quítale el fondo o usa `foto`»).
```json
{ "tipo": "objeto", "imagen": "assets/alcancia.png", "alto": 520, "texto": "Tus ahorros" }
```
Para recortar el fondo de una foto se usa rembg (ver PROTOCOLO.md).
- `reloj: "33:00"` (MM:SS o H:MM) dibuja en lugar de la foto un reloj digital de 7 segmentos (cuerpo negro, dígitos
  verdes con brillo, los apagados al 8%; ~600 px de ancho, 460 en 9:16) para el **contrato de tiempo** [2:00]:
  ```json
  { "tipo": "objeto", "reloj": "10:00", "texto": "Te pido solo los **próximos 10 minutos.**" }
  ```
  `cifra` sigue siendo para cuentas y precios, no para el contrato de tiempo.

### `oscura` — revelación de la marca o el producto  ·  [36:15, 36:20, 37:40, 39:45, 43:00]
Fondo negro con brillo violeta (`fondo`: `azul` o `negro` para las otras dos variantes). Solo para
el momento «esto es lo que vendo»: nombre, logo y una frase. Sobre negro el subrayado y las flechas salen en
blanco, el tachón en rojo claro y `{o:…}` pinta una cifra en dorado [36:40]. `emoji_tam` cambia el tamaño del
emoji (150). El nombre va balanceado (15 em como máximo): QA avisa si deja 1-2 palabras solas en el último renglón.
```json
{ "tipo": "oscura", "imagen": "assets/logo.png", "titulo": "Tu Programa", "texto": "Lo que hay dentro" }
```
La revelación sigue en oscura con los diseños de siempre y `oscura: true` (no hay otra lista ni otra cifra):
```json
{ "tipo": "lista", "id": "pilares", "oscura": true, "fondo": "azul", "encabezado": "Tu Programa",
  "items": [{ "emoji": "⚙️", "texto": "El sistema" }, { "emoji": "🤝", "texto": "El acompañamiento" }, { "emoji": "🧭", "texto": "La estrategia" }] }
```
<!-- fragmento: vuelve con como -->
```json
{ "tipo": "lista", "como": "pilares", "oscura": true, "fondo": "azul", "activo": 2 }
```
```json
{ "tipo": "cifra", "oscura": true, "fondo": "negro", "lineas": ["Para quien factura **$50k al mes**", "El paquete base empieza en {o:$25,000}"] }
```
Los pilares [37:40] vuelven con uno encendido al abrir cada sección [39:45]; para quién es y el ancla, justo después
de la revelación [36:30-36:40]. El precio final, lo que incluye en detalle, la garantía y el llamado van en blanco
[38:10-42:25]: QA avisa una lista con ✅, una tabla, tarjetas o un stack en oscura.

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
- La flecha **recta** [c_1045, 12:35, 13:20] mide ~250 px (el 55% del hueco entre los emojis, de 140 a 260 px) y va
  centrada en el hueco; asta de ~9 px con textura de plumón y punta en V con brazos de ~60 px, abierta ~33°, de alto
  ≈ 25-30% del largo. De borde a borde, con punta de 30 px, se leía como un palito.
- **Cantidad que crece** [15:15, 17:00, 17:05]: `nodos[i].cantidad` (1-20) repite el emoji en una pila de filas
  equilibradas (5 → 3+2, 6 → 3+3, 10 → 5+5, 20 → 5×4) que no pasa de 1.6× el emoji; la flecha sale del borde de la
  pila. Con `{s:…}` el sufijo va chico y regular:
  ```json
  { "tipo": "flujo", "nodos": [{ "emoji": "💰", "cantidad": 5, "etiqueta": "**$50k**{s:/año}" },
    { "emoji": "💰", "cantidad": 10, "etiqueta": "**$100k**{s:/año}" }] }
  ```
  Con `imagen` la cantidad se ignora (QA avisa).
- Un nodo acepta `imagen` (foto recortada), `sub` (texto gris) y `normal: true`, que quita la
  negrita de la etiqueta.
- Cada nodo aparece en su propio paso junto con la flecha que llega a él. El `texto` del flujo entra en el ÚLTIMO
  paso (con el último nodo), aunque sea la frase que abre la lámina: `texto_paso: 0` lo sube al primero.
- En 16:9 las columnas son iguales (todas del ancho del nodo más ancho): los emojis quedan a la misma
  distancia y las flechas miden lo mismo aunque un nodo lleve un `sub` largo [17:00, 17:20]. El `sub` va a
  52 px y se parte en dos renglones balanceados pasando de ~9 em.
- **Suma de conceptos** [28:40, 35:10]: `flechas: [{ "signo": "+" }, { "signo": "=" }]` pone un signo gris claro y
  delgado (`+`, `=`, `−` o `×`) en vez de la flecha, a la altura del emoji y a la mitad entre los dos íconos; entra
  con el nodo que le sigue. Si todas las flechas son signos, las etiquetas van en regular.
  ```json
  { "tipo": "flujo", "flechas": [{ "signo": "+" }, { "signo": "=" }], "nodos": [{ "emoji": "👊", "etiqueta": "Tú" },
    { "emoji": "🤖", "etiqueta": "IA especializada" }, { "emoji": "📦+💰", "etiqueta": "Producto rentable" }] }
  ```
- `"tarjeta": true` en un nodo mete el emoji y la etiqueta en una tarjeta gris con degradado [28:40 «Stories» +
  «Digital product»].
- **Retornos** [12:45]: `retornos: [{ "desde", "hasta", "lado", "tono", "etiqueta", "emoji", "paso" }]` dibuja un arco
  que regresa: `lado: "arriba"` (por omisión) va de la punta del emoji `desde` a la del nodo `hasta`, por encima de
  la fila; `hasta: "aparte"` baja del pie del nodo al nodo `aparte` (`{ "emoji", "etiqueta" }`), que va bajo la
  primera columna. `tono`: `n` negro (por omisión), `v` verde, `r` rojo; la `etiqueta` va manuscrita con su `emoji`
  en el vértice, del lado de afuera. Cada retorno entra en su propio paso después del último nodo. En 9:16 se
  ignoran (aviso).
  ```json
  { "tipo": "flujo", "nodos": [{ "emoji": "🧑+🎥", "etiqueta": "Creador" }, { "emoji": "📦", "etiqueta": "Producto" },
    { "emoji": "👥", "etiqueta": "Su audiencia" }, { "emoji": "💰", "etiqueta": "Dinero" }],
    "aparte": { "emoji": "🙋", "etiqueta": "Tú" },
    "retornos": [{ "desde": 3, "hasta": 0, "tono": "n", "etiqueta": "70%", "emoji": "💵" },
                 { "desde": 3, "hasta": "aparte", "tono": "v", "etiqueta": "30%", "emoji": "💵" }] }
  ```

#### Nodos de solo texto

Sin `emoji`, `imagen` ni `cantidad`, el ancla rodea el texto en línea; no una columna vacía.
El motor conserva al menos 188 px de hueco y separa el encabezado 48 px de la fila.
En nodos mixtos las flechas conectan las etiquetas a su misma altura. El encabezado presenta
lo que sigue con “:” o numera; módulo y semana no van como eyebrow.

```json
{"tipo":"flujo","encabezado":"Define:","nodos":[{"etiqueta":"Resultado"},{"etiqueta":"Responsable"},{"etiqueta":"Revisión"}]}
```

Contraste: `{ "etiqueta": "❌ Prompt **malo**" }` → `{ "etiqueta": "resultado **malo**" }`.
Si no caben columnas iguales, antes de reducir letra se prueban columnas propias centradas
(`data-columnas="propias"`). Reduce `separacion` solo si la fijaste por encima del piso.

### `pasos` — el sistema de N pasos (teclas 1 2 3 + ruta punteada)  ·  [1:55, 11:00, 16:35, 28:00]

La variante `letras` dibuja un riel ancho arriba. `activo` cuenta desde 1: la letra actual lleva
círculo rojo; las anteriores quedan negras y las pendientes se apagan. Debe haber el mismo número
de `letras`, `iconos` y `etiquetas`, sin repetir emojis. En 9:16 las columnas, los iconos y sus
etiquetas reducen su tamaño para caber. Un regreso con `como` conserva las tres listas.

```json
{"tipo":"pasos","id":"rec","letras":["R","E","C"],"iconos":["🎭","📋","🧭"],"etiquetas":["R · Rol","E · Encargo","C · Contexto"],"activo":2}
```
```json
{ "tipo": "pasos", "n": 3, "clic": 1, "texto": "El sistema de 3 pasos **«solo dar clic»**",
  "nota": "Lo usan principiantes para cobrar como profesionistas" }
```
- Con `iconos` y `etiquetas` sale la variante de sección [16:40]:
  ```json
  { "tipo": "pasos", "iconos": ["🔍", "🛠️", "🚀"], "etiquetas": ["Encontrar", "Construir", "Lanzar"], "activo": 1 }
  ```
- `activo`: número del paso encendido; los demás quedan al 20 % en video [ref_1040], 35 % en sala. El mapa entra una vez con `activo: 1` y
  vuelve con el titular de su bloque en `texto`; un regreso sin texto tras una o dos láminas es un vaivén (QA lo avisa;
  ARCOS «Las plantillas»).
- `emoji_tam` (px) fija el tamaño de los íconos. En 9:16 van a 200 por omisión y la etiqueta y el «Paso N» se ajustan a
  su columna (con 3 pasos, ~62 px) para que la fila quepa en los 900 px útiles sin encaje (Recetas 9:16).
- `hechos`: lista de pasos con ✅, por ejemplo `[1, 2]`. La ✅ va siempre a todo color, aunque su
  columna esté atenuada por `activo`: es la señal de avance [28:00-28:05]. La ✅ CUELGA bajo la etiqueta sin alargar
  el mapa: los íconos no se mueven cuando aparece [28:00].
- **El mapa que vuelve es la misma imagen** [ESTILO §4]: en un grupo de `como` (la madre y las que la reúsan), el
  motor marca cada lámina con `_grupo_texto` y `_grupo_nota` (el texto y la nota más largos del grupo) y
  `_grupo_hechos` (alguna lleva ✅). Así todas reservan el mismo alto y los íconos quedan a la misma altura en cada
  regreso, aunque cambien el texto, la nota o los ✅. Son campos internos: no se escriben en el deck.
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
- **Arrastre** [1:55, ráfaga d_123]: con `clic` y ruta, la mano entra en el MISMO corte que las teclas (~100 ms
  después, ya junto a la tecla), aprieta la tecla, se queda ~1.4 s sobre ella y luego ARRASTRA la ruta punteada hasta
  la última tecla: los tramos desde la tecla del clic nacen en el paso del clic, uno tras otro (~700 ms cada uno,
  desde los 1500 ms), con la mano cerrada y gris en la punta del trazo; al final queda la mano de
  dedo sobre la última tecla (así sale en el PNG). Los tramos anteriores a la tecla del clic se ven desde
  el paso 0. `arrastre: false` lo apaga: ruta completa desde el paso 0 y la mano quieta en su tecla.
- Por omisión teclas, texto, nota y la mano entran en un solo corte, como en la referencia [1:55]: la `voz` lleva UN
  texto. `clic_paso: 1` separa la mano en un segundo paso. Con `revelar: "pasos"` cada tecla entra en su propio paso, la ruta se
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
- La **llave** roja es alta [c_0635]: las puntas ~24 px bajo el centro de cada rama, los brazos bajan en curva
  (~9% del alto) hasta el tramo horizontal y el pico baja otro ~5%; mide ~14% del alto de la lámina. La nota va
  debajo, chica (54 px; 60 en 9:16), roja y **subrayada**, como «Same Work».

### `circulos` — la audiencia: anillo de personas y círculo interior  ·  [10:45, 14:05]
```json
{ "tipo": "circulos", "texto": "Reservada para **unos pocos**", "tono": "r", "tono_interior": "v", "personas": 12, "emoji": "🧑‍💼", "centro": "⭐" }
```
- `radio` (360) y `radio_interior` (130), en px, cambian el tamaño de los dos círculos.
- Las personas van **dispersas** por la corona, sin tocarse (≥ 1.15 × su tamaño) y sin formar un anillo de reloj
  [10:45] (semilla fija: el mismo dibujo en cada render). Si no caben, el emoji se achica (86 → 64 px); si ni así, van
  en anillos parejos y, si tampoco, se dibujan las que caben y la construcción avisa: sube `radio` o baja `personas`.
  QA da error si dos emojis de una lámina se enciman.
- `adentro: N` (0-5) pone N personas del mismo emoji y tamaño **dentro** del círculo interior (salen con
  `interior_paso`). `tono_paso: k`: en el paso k la corona toma el tono del interior y el borde interior desaparece,
  sin mover a nadie [10:50].
- **Reservada para unos pocos → ahora cambió** [10:45, 10:50]:
  ```json
  { "tipo": "circulos", "texto": "Reservada para **unos pocos**", "tono": "r", "tono_interior": "v", "personas": 12, "adentro": 2, "tono_paso": 1 }
  ```

## Datos

#### El objeto que vuelve: `como`  ·  [16:40, 28:00, 29:25]
El mapa 1-2-3, el calendario y la tabla vuelven varias veces con otro paso activo. Se declaran UNA vez (con `id`) y las
láminas siguientes los reusan con `"como": "<id>"`: heredan solo los campos del objeto y cambian lo suyo.
```json
[ { "id": "mapa", "tipo": "pasos", "iconos": ["🔍", "🛠️", "🚀"], "etiquetas": ["Encontrar", "Construir", "Lanzar"], "activo": 1 },
  { "tipo": "pasos", "como": "mapa", "activo": 2, "hechos": [1], "voz": "Formato dos: tu pantalla." } ]
```
- Se heredan: `pasos` → `n`, `iconos`, `etiquetas`, `prefijo`, `sobre`, `ruta`, `separacion`, `tam_etiqueta`; `calendario` →
  `titulo`, `dias`, `fases`, `n`, `columnas`, `palabra_dia`, `color`, `rango`; `tabla` → `esquina`, `columnas`, `filas`,
  `ancho_etiqueta`, `vacias`; `lista` → su mapa y letras; `meses` → su rejilla;
  `chat` → `encabezado`, `encabezado_estilo`, `avatar_yo`, `avatar_otro`, `avatar_tam`, `sello`, `sello_sobre`, `sello_pos`, `sello_paso` (los mensajes los trae la hija);
  `idea` → `emoji`, `emoji_tam`; `prueba` → `capturas`; `objeto` → `imagen`, `alto`, `emoji`, `emoji_tam`, `reloj`, `logos`. Nunca `id`, `voz`, `revelar`, `activo`, `hechos`, `fase_activa`, `texto` ni notas; el sello solo se hereda en `chat`.
- Lo que trae la lámina gana (`{ "tipo": "calendario", "como": "plan", "fase_activa": 2 }`). La madre va antes; se
  permiten cadenas. Es error un `como` a un id que no existe, que va después, a sí misma o de otro diseño; `como` solo
  existe en `pasos`, `calendario`, `tabla`, `lista`, `meses`, `chat`, `idea`, `prueba` y `objeto`. QA avisa cuando una lámina repite a mano el objeto de otra.

### `tabla` — la tabla-marcador escrita a mano  ·  [5:25 → 10:05]
El recurso estrella: se llena columna por columna a lo largo de varias láminas. `converger: { "columna", "texto",
"emoji", "paso", "aislar" }` [7:30]: una flecha roja fina sale de cada celda de esa columna y todas se juntan en UNA
punta a ~20 px del primer renglón de la pregunta (Caveat 700), en el mismo paso.
- **A la Iman, en una lámina aparte** tras la tabla completa [7:30, f_flechas 7:30.1]: quedan solo la columna de
  etiquetas y la columna juzgada (~700 px) y la pregunta ocupa el resto, a 76 px, con su emoji de 130 encima (la
  referencia lleva 🤔; QA lo sugiere). Es lo que pasa por omisión cuando la lámina ya no revela columnas:
  <!-- fragmento: vuelve con como -->
  ```json
  { "tipo": "tabla", "como": "comparar", "revelar": "todo", "converger": { "columna": 1, "texto": "¿Por qué se quedan?", "emoji": "🤔" } }
  ```
- En la misma lámina que se revela (`revelar: "celdas"`), la tabla se angosta 620 px y la pregunta va a la derecha a
  max(68, letra de celda + 8) px. Usa la última columna con datos (la que queda junto a la pregunta): desde otra, las
  flechas cruzan las celdas y QA lo marca. Si la pregunta queda bajo 64 px, QA pide la lámina aparte; si la tabla se
  encoge bajo 90%, es error. `aislar: true | false` fuerza cualquiera de los dos.
- **9:16**: filas de 220 px como máximo, letra hasta 56 px (th hasta 62) según el ancho de su columna y el alto de la
  fila (0.3 ×), con piso de 34 / 38. Con `converger`, la pregunta va DEBAJO de la tabla, centrada y a ≥ 80 px, y las
  flechas bajan por el borde de la columna hasta la punta junto a la pregunta (la franja derecha es de los botones de
  Reels: QA da error si la pregunta entra ahí). Las columnas vacías quedan angostas (80 px) y el ancho se reparte según
  la palabra más larga de cada columna; si una tabla de más de 3 columnas de datos no cabe, avisa: pártela con `fijas`.
- Con firma abajo (16:9), la última columna vacía mide al menos la firma + 80 px; sin columna vacía, la tabla deja 70 px
  libres abajo. QA da ERROR si la firma toca una línea de la tabla, un texto, un emoji o un trazo [c_0545].
QA da error si el texto de una celda sale de su caja (se monta en la vecina).
La letra es plumón grueso (Caveat 700) [c_0545]. Con 3 filas o menos la fila se topa en 190 px y la letra crece con
ella (0.34 × el alto de la fila, de 44 a 64 px): una tabla corta ya no flota en celdas vacías. Si la tabla no cabe o
una celda llega a 3 renglones, el motor baja la letra de 4 en 4 hasta 40 (primero la columna de etiquetas).
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

La variante `variante: "logos"` usa `items: [{ "imagen": "assets/logo-propio.png", "texto": "Proyecto" }]`:
fila de 3-5 imágenes, sin caja ni emoji; `columnas: 2` exige exactamente cuatro para una rejilla 2×2.
Cada logo se revela en su paso. Usa únicamente los logos aportados por el usuario; en ejemplos, dibujos propios.
```json
{ "tipo": "tarjetas", "encabezado": "Las 6 métricas:", "items": [{ "emoji": "💵", "texto": "Ganancia por venta" }] }
```
Un ítem acepta `tono` (`v`, `r` o `n`) para pintar la tarjeta. Un texto suelto en `items` vale como
`{ "texto": … }`.
- El ancho sale del ancho útil del formato (1620 px en 16:9, 900 en vertical): hasta 4 tarjetas van
  en una fila (4 en 16:9 miden ~378 px). En 9:16, hasta 3 van en UNA columna de 860 px con el rótulo a 64 px (en 3
  columnas de ~280 el rótulo se partía en 3 renglones); con 4 o más, de 2 en 2.
- `columnas`, `ancho` (px por tarjeta) y `tam_texto` (px, por omisión 46) ajustan a mano.
- El emoji va arriba y a la misma altura en toda la fila; un rótulo de dos renglones crece hacia
  abajo [9:25]. Las tarjetas arrancan arriba de la lámina (`anclar`).
- El emoji crece con la tarjeta: 150 px con hasta 3 tarjetas, 130 con 4 y 104 con 5 o más (en [9:25] es más grande
  que el rótulo). `emoji_tam` (en la lámina) o `items[].emoji_tam` (en una tarjeta) lo fijan a mano, igual que en
  `cuadrantes`. La tarjeta es gris #e4e4e4 (medido en ref_0925).
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
- La `etiqueta` ideal de una barra es de 1 a 3 palabras. Si no cabe en su columna, el motor la parte en **2 renglones
  como máximo** (a 50 px, o a 44), con la misma letra en todas las etiquetas y el eje un renglón más arriba; si ni así
  cabe, QA avisa que se acorte. Dos etiquetas a menos de 32 px en la misma banda se leen como una sola frase (aviso).
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
- `desde` y `hasta` de un tramo son el número de la marca **contado desde 0** (en el ejemplo, `1` es «Día 14»), y
  `"fin"` es el final de la línea.
- Una marca acepta `pos` (de 0 a 1) y `arriba`, un texto sobre la marca como «$1B». Los textos de marcas
  y tramos van en SVG: sin emojis (ver `grafica`).
- Marcas muy juntas («Semana 1» en 0 y «Semana 2» en 0.125) bajan solas a un segundo renglón, con una guía
  punteada hasta su marca; las etiquetas de tramo que se cruzan suben. QA marca los textos SVG encimados o
  fuera del lienzo.
- Cada tramo aparece en su propio paso.

Las marcas de `linea-tiempo` son **FRONTERAS (instantes)**, no rótulos de periodo.
Un periodo de una unidad va de su marca a la siguiente o a `"fin"`: «Semana 6» usa marcas 6 y 7,
o `hasta: "fin"`. Si los números importan, usa `pos` o `escala: "proporcional"`; un `pos` escrito manda.
Si solo narra hitos (Día 1/14/30), déjalas equidistantes como en [9:50].
Marcas neutras = paso 1; N tramos = N+1 pasos → N+1 voces.

### `medidor` — barra verde → rojo con pin  ·  [4:20]
```json
{ "tipo": "medidor", "valor": 90, "texto": "Algunos modelos dejan ganar millones,\npero son **muy difíciles para empezar**." }
```

### `opciones` — pastillas y un cursor que elige  ·  [4:30]
```json
{ "tipo": "opciones", "items": [{ "texto": "FÁCIL", "tono": "v" }, { "texto": "MEDIO", "tono": "n" }, { "texto": "DIFÍCIL", "tono": "r" }], "elegida": 2 }
```
- `items` es obligatorio (la lista de pastillas va en `items`, no en `opciones`).
- Las no elegidas se atenúan **en el paso del clic** (`clic_paso`, 0 por omisión, como en [4:30]): con el clic en un
  paso posterior, primero se ven todas a color y el clic revela la respuesta.
- `texto_pos: "arriba"` pone el `texto` antes de las pastillas (por omisión va debajo).
- **Encuesta** (pregunta → opciones → el clic elige):
  ```json
  { "tipo": "opciones", "texto": "¿Te pasa esto?", "texto_pos": "arriba", "clic_paso": 1, "cursor": "mano",
    "items": [{ "texto": "SÍ, ME PASA", "tono": "v" }, { "texto": "NO", "tono": "r" }], "elegida": 0 }
  ```

### `rejilla` — cantidad hecha visible  ·  [6:35, 14:45, 14:55]

La variante `bandas` agrupa puntos contiguos desde abajo a la derecha. `desde` y `hasta` son
índices inclusivos desde 0; la primera banda empieza en 0 y cada siguiente continúa a la anterior.
`bandas_paso` es el primer paso de color, desde 0; después entra una banda por paso. La leyenda
va a la izquierda con punto de color, cifra en negrita y nota manuscrita gris. La rejilla cabe por ancho y por alto (620 px en 16:9, 900 en 9:16; `alto` lo cambia). Encierra la banda chica, no la grande, y deja la conclusión (`texto_paso`) para el paso del círculo. Cada tono de leyenda
debe existir en una banda; toda cifra necesita `fuente` o un `{{DATO}}` declarado. El porcentaje
puede diferir como máximo en una celda respecto de la banda.

`encerrar` señala el índice de la banda que se encierra en rojo. `encerrar_paso` es su paso propio;
por omisión va después de la última banda. La suma de bandas no puede superar `total`.

```json
{"tipo":"rejilla","total":100,"columnas":10,"bandas":[{"desde":0,"hasta":59,"tono":"g"},{"desde":60,"hasta":89,"tono":"v"},{"desde":90,"hasta":99,"tono":"n"}],"leyenda":[{"tono":"g","cifra":"60%","nota":"no lo intenta"},{"tono":"v","cifra":"30%","nota":"lo intenta"},{"tono":"n","cifra":"10%","nota":"lo termina"}],"bandas_paso":1,"encerrar":2,"encerrar_paso":4,"texto":"De cada 100, **10** lo terminan","texto_paso":4,"fuente":"Ejemplo ilustrativo"}
```
- **Muchas cajas**:
  ```json
  { "tipo": "rejilla", "encabezado": "Tendrías que vender…", "emoji": "📦", "total": 300, "anotacion": "Son 300", "sello": "Mucha habilidad" }
  ```
- **Porcentaje**:
  ```json
  { "tipo": "rejilla", "punto": true, "total": 100, "columnas": 20, "destacar": [99], "texto": "¿El **99%**?" }
  ```
  Con un dato publicado, `"fuente": "Autor, obra (año)"` sale al pie con el destacado (no en `multitud`).
- **«Tú» en la multitud** (`multitud: true`), dos láminas [14:55, 15:05]. El protagonista **nunca** va dentro de
  la multitud: rótulo en negrita arriba y su emoji (~170 px) debajo, aparte y sin flecha. La multitud es enorme:
  siluetas de ~190 px (150 en 9:16) en filas escalonadas medio paso que arrancan a ~44% del alto y se salen por los
  lados y por abajo (`total` es solo el tope; QA no cuenta ese recorte como desborde).
  ```json
  { "tipo": "rejilla", "multitud": true, "emoji": "👤", "total": 60, "etiqueta_destacado": "Tú", "emoji_etiqueta": "🧑‍💻" }
  ```
  La segunda [15:05]: la misma multitud; en `destacado_paso` se apaga a gris muy claro y UNA silueta (`destacar`,
  por omisión la del centro de la primera fila) queda oscura, con `nota_destacado` manuscrita en verde encima (en
  `nota_destacado_paso`, por omisión el mismo). La multitud NO se apaga por omisión: en [14:55] va a color.
  ```json
  { "tipo": "rejilla", "multitud": true, "emoji": "👤", "total": 60, "etiqueta_destacado": "Tú", "emoji_etiqueta": "🧑‍💻",
    "destacar": [4], "apagar_resto": true, "destacado_paso": 1, "nota_destacado": "«Sí»" }
  ```
- Sin `multitud`, una rejilla contable (40 personas, «1 de cada 10») con `destacar` + `emoji_destacado` pone a la
  destacada dentro de la rejilla.
- Con `apagar_resto: true` todo lo que no está destacado queda gris. `tono` y `tono_destacado` (`v`, `r`,
  `g`) pintan los puntos; `emoji_etiqueta` pone un emoji sobre la `etiqueta_destacado`; `aspecto` (ancho/alto,
  1.55 por omisión) decide las columnas si no das `columnas`.
- La `etiqueta_destacado` («Tú») es un rótulo directo sobre la rejilla, **sin flecha**: el original no la lleva
  [14:55, 15:05]. `flecha_etiqueta: true` agrega una flecha gris fina de ≥ 90 px hasta el destacado; QA avisa si
  una flecha de etiqueta o de anotación mide menos de 60 px.
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
En sala: máximo 14 días (2 semanas), sin reducción automática; divide los calendarios largos. QA da error si excede ese límite.
```json
{ "tipo": "calendario", "titulo": "Calendario de 14 días", "fase_activa": 2, "n": 14,
  "fases": [{ "nombre": "Fase 1", "sub": "Calentamiento", "desde": 1, "hasta": 3, "color": "amarillo" },
            { "nombre": "Fase 2", "sub": "Entregar valor", "desde": 4, "hasta": 9, "color": "azul" }],
  "anotaciones": [{ "texto": "«Me gusta su contenido»", "dia": 1, "lado": "izquierda", "arriba": "12%" }] }
```
- `color`: `amarillo`, `azul`, `verde` o `rojo`.
- Cuántos días: `dias` (uno por día, con `sub`, `titulo` o `numero`; **sustituye a `n`**: con `dias` se dibujan
  tantos días como elementos tenga, así que para 14 días con subtítulo van 14 entradas) o `n` (14 por omisión, **hasta 42**:
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
  aparte en regular. Nunca los unas con «·» (ni «|», «-», «—») dentro de `nombre`: es error de contrato.
- **Grande** [ref_1760]: en 16:9, sin anotaciones y con ≤ 15 días (3 filas de 5), la tarjeta usa casi todo el alto
  (margen de 40 px), mide ~1250 de ancho, la barra ~160 con el nombre a ~64 px y las celdas son cuadradas (~228)
  con 10 px de separación. Con notas al margen o con más días, el calendario normal de 1400.
- **9:16**: la tarjeta usa casi todo el ancho (1000; 960 con nota) y los días van en **3-4 columnas**, no en 5: 4 (celdas
  casi cuadradas, ≥ 210 px) si el `sub` más largo cabe a 30 px; si no, 3. El `sub` no baja de 30 px (28 reales tras la
  escala) y nunca se parte ni invade la celda vecina (si no cabe, QA lo marca recortado). La nota va ENCIMA de la
  tarjeta, 30 px sobre ella y de su lado (el `arriba` de 16:9 no aplica), y su flecha baja por el margen de fuera y
  entra a la celda por el COSTADO: nunca cruza la barra de la fase.
- El `sub` de cada día va a 32 px (28 en un calendario angosto); «DÍA» es un rótulo decorativo (~28 px,
  como en el video).
- Anotaciones: `tam` en px (56 por omisión, medido en m_1740) y `arriba` en px o en porcentaje
  (`"12%"`). Con anotaciones el calendario se angosta para que la nota quede fuera.
- Repite la lámina cambiando `fase_activa` para recorrer las fases.

### `agenda` — semanas × días, a sangre  ·  [41:25–41:30]

Una agenda mensual sin eje de horas: líneas finas grises, números de día arriba a la derecha y
punto rojo en `hoy`. A diferencia de `calendario` (fases de un proceso), muestra citas recurrentes.
`dias` es obligatorio (1–7; en 9:16 se ven los primeros 3, y una serie/evento fuera de ellos exige dividir la agenda); `semanas` va de 1 a 6; `inicio` (1–31) fija el primer día.
`hoy` contiene `semana` y `dia`, desde 1. `series` repite un bloque en sus `semanas` (todas por omisión),
y cada serie entra completa en su `paso`; `eventos` permite citas sueltas con `semana`, `dia` y `paso`.
Cada bloque lleva `texto`, `sub` opcional y `tono`: `azul`, `verde` o `morado`. No admite referencias fuera de la rejilla.

```json
{"tipo":"agenda","dias":["Mar","Mié","Jue","Vie"],"semanas":4,"inicio":24,"hoy":{"semana":2,"dia":2},"series":[{"dia":1,"texto":"Revisión de equipo","sub":"10:00","tono":"azul","semanas":[1,2,3,4],"paso":1},{"dia":2,"texto":"Sesión 1:1","sub":"Mentor","tono":"verde","paso":2}]}
```

## Interfaz y prueba

### `chat` — burbujas, un mensaje por paso  ·  [17:45, 19:00, 21:50]

`de: "prompt"` dibuja una tarjeta blanca con sombra suave, sin borde ni avatar; los prompts seguidos forman una sola tarjeta que crece renglón por renglón. `de: "respuesta"` conserva fondo verde claro sin borde, con `remitente` manuscrito a la izquierda. Cada renglón conserva su paso y ancla `m0`… para flechas, anotaciones y `sello_sobre`; `revelar: "todo"` los reúne en 0.
`letras: ["R", "E", "A"]` añade una letra por mensaje en círculo rojo (una letra o sigla alfanumérica de 1–3 caracteres por posición). Una instrucción de 2–4 reglas se lee mejor como `lista` con `vineta: "letras"` o emoji; chat/prompt queda para el texto literal que se copia.
Una respuesta real exige `fuente` con fecha, por ejemplo «Registro autorizado, 2026-09-24».
Si el contenido es ilustrativo, usa `ejemplo: true`: lleva el sello visible EJEMPLO. Una respuesta
sin esa marca y sin fuente fechada es error de QA.

```json
{"tipo":"chat","mensajes":[{"de":"prompt","texto":"Resume el texto en tres tareas."},{"de":"prompt","texto":"Indica responsable y fecha."},{"de":"respuesta","remitente":"IA","texto":"Revisar, confirmar y enviar.","ejemplo":true}]}
```
```json
{ "tipo": "chat", "mensajes": [{ "de": "yo", "texto": "¿Quieres trabajar conmigo?" }, { "de": "otro", "texto": "¡Sí, me interesa!" }] }
```
La burbuja de «otro» es gris medio con letra blanca y las dos son pastillas redondas [19:00, 22:00].
Un texto en minúsculas entre corchetes dentro de una burbuja (`[nombre]`, `[1 de marzo]`) es una **variable de
plantilla**: en la burbuja azul sale en letra amarilla sin caja y con el peso del mensaje, como «[Name]» y «[topic]»
[21:55, c_1315]; en la gris, blanca con subrayado punteado amarillo. Sirve para plantillas de mensaje (escríbelas sobre
todo en los mensajes «yo»). En MAYÚSCULAS (`[PRECIO]`) es un dato pendiente: contorno punteado, y QA lo marca como error
hasta que lo llenes; así una variable de la lección nunca se confunde con un dato por llenar. Un texto suelto en `mensajes` vale como `{ "texto": … }`.
- Avatar: silueta por omisión. `avatar_yo` / `avatar_otro` (o `avatar` en un mensaje) con un emoji la
  cambian, por ejemplo `"avatar_otro": "🤖"` para la IA; `false` la quita. El emoji llena ~85% de su círculo
  gris, como la silueta del original [17:45, 19:00].
- `avatar_tam` (80-160): diámetro en px de los DOS avatares a la vez (por omisión 126 en 16:9 y 96 en 9:16; el emoji
  llena ~85%). No pases del alto de una burbuja de una línea (≤ ~130 px en 9:16) ni agrandes solo el de la IA: los dos
  avatares quedarían desparejos y las burbujas perderían ancho.
- `tam_texto` (px) cambia la letra de las burbujas (54 en 16:9, 58 en 9:16).
- `hora` por mensaje: un separador gris centrado sobre la burbuja, en el mismo paso. Un gancho en chat
  tiene que entenderse sin sonido: muestra la hora de los dos extremos y pega el sello a la burbuja culpable.
  Cada burbuja es un ancla `m0`, `m1`… (se cuentan desde 0):
  ```json
  { "tipo": "chat", "sello": "Tarde", "sello_sobre": "m1",
    "mensajes": [{ "de": "otro", "hora": "11:40 pm", "texto": "¿Cuánto cuesta?" },
                 { "de": "yo", "hora": "9:05 am", "texto": "¡Buen día! Sí, cuesta…" }] }
  ```
  QA avisa si un chat lleva `sello` sin `sello_sobre`. En un chat el sello **no mide el ancho de la burbuja** (como en
  la rejilla): va con tinta fija y se pega JUNTO a la burbuja culpable —montado sobre su borde de abajo, del lado
  contrario al avatar, o a un lado—, sin tapar su texto, las horas, las otras burbujas ni el avatar. No uses
  `sello_pos` en un chat: el sello cae sobre lo que haya en esa zona (un avatar tapado es error de QA).

#### Muro, celular y procedencia del chat

`variante: "muro"` muestra 6–12 mensajes de `otro` en dos columnas, por filas de izquierda a derecha
[19:00]. En 9:16 usa una columna; más de 8 pide partir. Una fila por paso; `revelar: "rafaga"`
los escalona en un mismo paso cada 0.25 s; `"todo"` los muestra juntos. Conserva `m0`…

```json
{"tipo":"chat","variante":"muro","mensajes":[{"de":"otro","texto":"Ya quedó"},{"de":"otro","texto":"Lo probé"},{"de":"otro","texto":"Entendido"},{"de":"otro","texto":"Voy a empezar"},{"de":"otro","texto":"Tengo mi tarea"},{"de":"otro","texto":"Nos vemos"}]}
```

`marco: "celular"` encierra de 1 a 3 mensajes en una pantalla con marco negro y muesca.
`app` es el archivo del logo real o `{{LOGO_X}}` declarado; nunca un logo inventado.
`grabando: true` añade una insignia roja. `texto` o `encabezado` quedan junto al celular.

```json
{"tipo":"chat","marco":"celular","encabezado":"Conversación:","mensajes":[{"de":"otro","texto":"¿Lo revisaste?"},{"de":"yo","texto":"Sí, falta la fecha."},{"de":"otro","texto":"Lo ajusto hoy."}]}
```

`procedencia: "real" | "ia" | "ejemplo"`, `fuente` y `fuente_paso` usan el mismo pie gris que `prueba`.
Una conversación `real` exige fuente con fecha; `ejemplo` pone «Ejemplo ficticio» UNA vez en el pie de la lámina (un sello en cada burbuja tapaba el texto; la tarjeta `respuesta` conserva su sello EJEMPLO).
En VSL/webinar declara la procedencia de la lámina o ejemplo/fuente de sus mensajes.

### `prueba` — capturas reales, con el dato encerrado  ·  [0:35, 15:45, 19:30]

- `fuente` y `fuente_paso` en la lámina imprimen el crédito con la clase `.fuente` existente; cada captura con `src`
  puede llevar su propia `fuente`. `procedencia` en la lámina sirve para todas sus capturas. Si no hay ninguna
  procedencia ni fuente para una captura con `src`, QA avisa: declara si es real, IA o ejemplo.
- `variante: "pantallas"`: entre 1 y 3 capturas con `src`, cada una con barra de ventana de tres puntos,
  escalonadas sobre el fondo blanco o con `oscura: true`. No cambia sus pasos ni sus créditos.
- Un antes/después en `prueba` compara **capturas**. Para comparar conceptos usa `idea` con
  `emoji: ["no:…", "si:…"]` y `apagar_emoji`.
```json
{ "tipo": "prueba", "capturas": [
  { "src": "assets/captura.png", "circulo": [62, 40, 30, 12], "tachar": [[5, 3, 25, 6]] } ] }
```
- `circulo` y `tachar` van en porcentaje de la imagen: x, y, ancho, alto.
- **Regla 9: nunca inventes testimonios, capturas ni cifras.** Usa solo resultados reales, con permiso,
  y tacha los datos personales. Si todavía no tienes la prueba, no la finjas:
  - `{ "hueco": "Tu captura va aquí" }`: recuadro punteado en tinta con la frase en el resaltador amarillo de
    los huecos = una captura **por conseguir** (un pendiente a la vista, no una ilustración). QA la pone en
    `por_confirmar` como `CAPTURA_N` y el deck queda en borrador hasta cambiarla por la real: nunca va en un
    entregable.
  - `{ "hueco": "La tuya va aquí", "plantilla": true }`: el lugar para la captura **del espectador** (un tutorial
    que le dice «así se ve la tuya»). Sale con un marco trazado a mano en tinta, sin punteado, y el deck puede
    ser final. `plantilla` sin `hueco` es error de contrato. Para ENSEÑAR un formato con contenido, usa la maqueta
    `post` con `ejemplo: true`.
  - `{ "post": { "nombre", "usuario", "fecha", "texto": [...], "clave" }, "fuente": "real, con permiso" }`:
    un post que transcribes de uno real. Se pinta como post y la `fuente` va abajo, tal cual.
  - `{ "post": { "texto": [...] }, "ejemplo": true }`: una **maqueta visible**, nunca un testimonio. Sale
    sin avatar, usuario, fecha ni «···», con un sello rojo «EJEMPLO» en la tarjeta, y `clave` no encierra
    dinero, porcentajes ni números de clientes o ventas. QA avisa si una maqueta trae cifras o
    resultados («cerré», «cliente», «venta»).
  - Un `post` sin `fuente` ni `ejemplo`, o con los dos, es error de contrato.
- **En un vsl o webinar, la maqueta no es prueba**: enseña un formato («así se ve el mensaje») dentro del
  contenido, pero no ocupa el tramo de prueba de la oferta. Cuenta como prueba real una captura con `src` o
  `fuente`, un `objeto` con `imagen` o una `cifra` con `fuente`; sin ninguna, QA avisa y GUION §7 da los
  sustitutos en orden.

#### Burbuja sobre captura o foto  ·  [19:25]

`foto` y `prueba` admiten `mensajes: [{ "de": "yo", "texto": "Revisa esta parte" }]` (máximo dos,
`yo`/`otro`). Entran después de la imagen, una por paso, por encima del velo y con sombra suave.
`mensajes_pos: "izq" | "centro" | "der"` mueve el bloque del tercio inferior.
QA exige letra de 48 px en 16:9 y detecta si tapa el texto de la foto o el círculo/tachón de la captura.

```json
{"tipo":"prueba","capturas":[{"src":"assets/documento.png","circulo":[60,15,20,12]}],"mensajes":[{"de":"yo","texto":"Esa es la fecha"}],"mensajes_pos":"izq"}
```

### `boton` — botón de interfaz y cursor que lo aprieta  ·  [23:15, 38:15]
```json
{ "tipo": "boton", "boton": "Generar", "emoji": "🤖", "texto": "Solo das clic en el **agente correcto**…", "llamado": false }
```
- **Llamado o demostración.** Un `boton` cuenta como llamado visible por omisión. Si solo demuestra un clic de la
  herramienta («Enviar», «Generar», el «solo das clic» del mecanismo), ponle `"llamado": false`: QA no lo cuenta como
  llamado ni avisa «pide actuar antes de decir qué se vende» [23:15: demostración; 43:36: llamado].
`boton` (el texto del botón) es obligatorio. `cursor` acepta `mano` (por omisión) o `flecha`.
- **Pasos: 1.** El botón, su `texto` y el cursor que llega y aprieta entran en el paso 0 (`clic_paso` y `texto_paso`
  valen 0 por omisión): la `voz` lleva UN texto. `clic_paso: 1` separa el clic en un segundo paso.
- El botón lleva el emoji de lo que da el clic: 📞 llamada, 🎟️ lugar, 🚀 arrancar, 🤖 la herramienta; 📝 solo si el clic es escribir (y es pálido: 30/28 %). Nunca una mano (👆 ✍️ 👉) en el botón: con el cursor de mano se ven dos manos [23:15, 38:15]; QA lo avisa. Si tiene que ser una mano, `"cursor": "flecha"`.

#### Invitación  ·  [43:50]

`boton` con `variante: "invitacion"` muestra una tarjeta azul: `texto` como título, `hora` a la derecha,
`sub` debajo y un botón blanco (`boton: "Unirme"` por omisión). No tiene cursor por omisión y
`llamado` vale `false`; `clic: "boton"` añade cursor si se necesita.

```json
{"tipo":"boton","variante":"invitacion","texto":"Revisión de proyecto","hora":"14:30","sub":"Videollamada","boton":"Unirme"}
```

### `stack` — lo que incluye la oferta, pieza por pieza  ·  [42:30-42:50]
En 16:9 va **a sangre**: el bento llena la lámina de borde a borde (18 px de margen), las casillas vacías
se ven en gris al cortar y cada pieza se llena en su paso como una **tarjeta de producto a color** con la
letra blanca en mayúsculas. Se lee como «mira todo lo que te llevas», no como una lista. El `remate` es una
lámina aparte en la referencia [42:50]: entra en su paso sobre un lienzo limpio como un **título**: palomita verde
sin caja + la frase entera en 800 a ~140 px (baja sola, hasta 110, si pasa de ~18 letras), centrada a media altura;
`total` (64 px) y `nota` (54 px) debajo. En la pila (9:16 con `sangre: false`, 1:1, 4:5) sigue chico bajo las piezas.
Va en blanco, no en lámina oscura.
```json
{ "tipo": "stack",
  "items": [{ "emoji": "🤖", "texto": "Tu agente de ventas", "doble": true }, { "emoji": "📚", "texto": "Las 12 clases" },
            { "emoji": "🧑‍🏫", "texto": "Un mentor", "alto": 2, "sub": "Por 6 meses" },
            { "emoji": "📞", "texto": "4 llamadas en vivo" }, { "imagen": "assets/logo.png", "texto": "Grupo privado" }],
  "remate": "Hecho contigo" }
```
- Cada pieza se nombra como producto: un sustantivo corto, **2 a 4 palabras** (QA avisa desde 6). Más de
  8 piezas ya no se leen: agrupa.
- Un ítem lleva `emoji` o `imagen` (un logo real), `texto`, `sub` (subrenglón en píldora, «Por 6 meses»),
  `doble: true` (dos columnas), `alto: 2` (dos filas) y `color`: `morado`, `marino`, `naranja`, `verde`,
  `azul` o `negro`. Sin `color`, cada pieza toma uno por turno en ese orden, pero un emoji oscuro (🎓 y los negros)
  salta el marino y el negro, y uno gris (👥 👤 ⚙️ 🛠️) además el verde y el azul: se fundían con la pieza. Con
  `color` explícito se respeta, y QA avisa si el emoji casi no se ve sobre él (mide el glifo contra el color
  real de la pieza). `tono` (`v`, `r`, `n`) da la tarjeta pastel con letra negra.
- `columnas`: 3 (4 con 7 piezas o más); las filas se calculan. Sin rótulo: el `encabezado` no se dibuja a
  sangre (QA avisa); si hace falta, va en la lámina anterior.
- **9:16** también va a sangre: 2 columnas (`columnas` no pasa de 2), entre la firma de arriba (y ≈ 290) y la zona de
  Reels (abajo 320), con 18 px a los lados. Con 7 piezas y una doble salen ~514 × 315 px por pieza.
- `sangre: false` (o 1:1 y 4:5) usa la pila de casillas con el rótulo, el remate y el `total` debajo. La pila también
  pinta el `sub` (píldora) y el `color` de la pieza, y el ícono va en una columna fija para que los íconos de una
  columna queden alineados. `alto: 2` solo cuenta a sangre (QA avisa en la pila).
- `remate_paso` y `nota_paso` mueven el cierre.
- **Bonos** (solo si la oferta los tiene, GUION §7 beat 7b): van AL FINAL del stack, después de las piezas base, cada
  uno con `sub: "Bono #N"` (la píldora) y su nombre desde `datos`:
  `{ "emoji": "🎁", "texto": "{{BONO_1}}", "sub": "Bono #1" }`. QA avisa un bono sin `{{BONO_N}}` o antes de una pieza
  base. No hay diseño ni cinta de bono aparte: la referencia no los tiene.
- Como el remate tapa las piezas, la hoja y `--finales` sacan DOS cuadros de esta lámina: el stack
  lleno («N · id · paso K») y el remate («N · id»). Revisa los dos. El PDF (`--pdf`) da UNA página: el stack lleno
  y el remate en una banda debajo.

### `llamada` — la videollamada del componente humano  ·  [36:45, 40:10, 41:15]
Tarjetas grises 16:10 (radio 14, sombra suave): una con «TÚ» en blanco 800 y las demás con el busto blanco de la persona
pegado abajo; la que habla lleva borde azul claro. Así presenta el video al mentor, al consultor o las llamadas en vivo
de la oferta, ANTES de su `lista` o de su pieza en el `stack` (que no reemplaza: el `stack` [42:30] sigue igual).
```json
{ "tipo": "llamada", "yo": "Tú", "otros": [{ "rotulo": "Tu mentor" }], "nota": "1 a 1", "texto": "Programa **hecho contigo**" }
```
```json
{ "tipo": "llamada", "otros": [{ "rotulo": "Experto", "rotulo_pos": "arriba" }], "texto": "**4 llamadas en vivo** por 6 meses" }
```
- `yo` (opcional): el texto de tu tarjeta («TÚ», en mayúsculas). `otros`: hasta 3 personas `{ rotulo, activo,
  rotulo_pos }` (un texto suelto vale como `{ "rotulo": … }`); la activa (borde azul) es la de la derecha si ninguna
  trae `"activo": true`. El rótulo va en Caveat abajo [40:10] o arriba (`rotulo_pos: "arriba"`) [41:15].
- Medidas: dos tarjetas de ~620×380 con 40 px entre ellas; una sola, ~780×480; en 9:16 van una sobre otra (~760 de ancho).
- `nota` va arriba con una flecha roja a la tarjeta activa (el «1-on-1» de 36:45); `texto` debajo, en la letra de
  siempre con `marcar()`.
- Pasos: tarjetas → rótulos → texto → nota (`texto_paso`, `nota_paso`). Anclas: `t0`, `t1`… (TÚ primero) y `texto`.

### `meses` — rejilla a sangre de meses, con emojis que pasan a valores  ·  [16:45 → 16:50]
La cantidad que se acumula mes a mes: 4 columnas × 3 filas a sangre (3 × 4 en 9:16, entre la firma y la zona de
Reels), líneas grises finas, el mes en mayúsculas grises arriba a la izquierda y, al centro, 1-3 emojis
(`{ "mes", "emoji", "n" }`) o un valor verde en 800 (`{ "mes", "valor" }`).
```json
{ "tipo": "meses", "valores_paso": 1,
  "celdas": [{ "mes": "Marzo", "emoji": "🤝", "n": 1, "valor": "$5,000" }, { "mes": "Abril", "emoji": "🤝", "n": 2, "valor": "$15,000" }] }
```
- `valores_paso: N`: en el paso N cada celda cambia sus emojis por su valor, sin mover la rejilla (16:45 → 16:50).
  Con `valores_paso: 0` se ven los valores desde el corte (útil en una lámina que vuelve con `"como"`).
- `revelar: "celdas"` las revela de una en una; por omisión entran todas. `columnas` cambia el ancho de la rejilla.
- En sala el máximo es 6 meses: QA da error si se excede y no se reduce el tamaño para hacerlos caber.
- Más de 16 celdas ya no se leen (QA avisa). Anclas: `m0`, `m1`…

## Especiales

### `foco` — atenúa la lámina anterior y escribe encima  ·  [15:20]
```json
{ "tipo": "foco", "texto": "Sigues cobrando mientras el creador siga promoviendo el producto." }
```
- La frase de foco es la PROTAGONISTA, no una nota al margen: Caveat a 88 px en 16:9 (84 si pasa de 14
  palabras; 96 / 88 en 9:16) y hasta ~1560 px de ancho, como en el cuadro 15:20. `tam` la cambia.
- `opacidad`: por omisión 0.2 en video y `var(--apagado)` (0.35) en sala; el valor explícito prevalece y QA comprueba el piso de sala.
- La frase va **centrada** y es la protagonista: en la referencia [15:20–15:23, h_pill] cruza el fondo atenuado a
  ~10–15%, incluso encima de texto («Your bank account.» queda debajo). Si choca con un renglón del fondo, solo se
  mueve a un hueco entre renglones que quede a **≤ 120 px del centro** (con 48 px de aire); si no lo hay, se queda
  centrada y el fondo baja a 0.1 (salvo que pongas `opacidad`). Nunca se va al pie como subtítulo del último
  renglón. `anclar` (`"arriba"` o `"centro"`) la fija y apaga ese reacomodo. Con el fondo a ≤ 0.12 QA no cuenta el
  cruce; por encima avisa si la frase pisa un renglón y da error si lo tapa casi entero. QA avisa si la frase queda
  a más de 120 px del centro sin `anclar`.
- El fondo es el **estado final** de la lámina anterior: con sus tachones, subrayados y atenuados (una lista de
  errores tachada sigue tachada detrás de la frase) y sin lo que ya se fue (la mano de una `calificacion`). QA da
  error si el fondo tiene menos tinta que la lámina anterior.
- No se permite foco tras foco (el fondo sería la frase del foco anterior): pon una lámina normal entre los dos.
- `nota`: con `texto`, va debajo, más chica y a mano, en el mismo corte (`nota_paso` la mueve). Sin
  `texto`, la `nota` es la frase principal.
- No puede ir como primera lámina.
- El fondo atenuado es el ESTADO FINAL de la lámina anterior: su contenido, sus flechas, su sello y sus anotaciones
  (con sus ganchos), en el mismo lugar; no su cursor. La frase del foco busca un hueco que tampoco pise el sello.
  QA da error si el fondo perdió tinta, el sello o una anotación.
- Acepta su propio `sello`.

### `camara` — tramo a cámara (en el montaje se ve tu grabación)

En vivo, todo tramo que dependa de una página, documento o internet lleva `si_falla`: la acción de respaldo concreta en las notas del ponente. Usa `accion` para la operación principal.
```json
{ "tipo": "camara", "voz": "Déjame contarte cómo empecé", "dur": 4 }
```
- En el presentador se proyecta en **negro limpio**; en la hoja sale como cuadro gris «🎥 cámara» y no genera PNG.
  En el montaje (`video.mjs --sobre`) ahí se ve tu grabación.
- **Tramo en vivo de una clase** (actividad, demostración, preguntas): una `camara` con `"vivo": true`.
  ```json
  { "tipo": "camara", "id": "actividad", "vivo": true, "dur": 300,
    "texto": "Ahora tú: **tu reparto** con lo que entró el mes pasado",
    "items": ["Anota lo que entró", "Sepáralo en 4 cuentas", "Mándame tu porcentaje por el chat"],
    "voz": "Tienes cinco minutos. Te leo." }
  ```
  - `texto`: la consigna para el público, a tamaño de frase (si falta, se usa `nota`). Acepta las marcas de
    texto.
  - `items`: hasta 5 pasos como texto u objeto `{ "emoji": "📝", "texto": "Anota una tarea" }`, sin herencia `como`. Cada ítem lleva su emoji o tecla numérica por índice, letra de 66 px (72 en sala), interlineado 1.18 y separación de 52 px. Con reloj, divide una consigna de más de 3 ítems en dos tramos: conservar esas métricas puede desbordar el lienzo y QA avisa sin ocultar contenido.
  - `emoji`: por omisión ⏱️, y 🙋 si la consigna habla de preguntas; el emoji grande aparece solo cuando no hay `dur`. Con reloj, la jerarquía es reloj → consigna de 84 px → ítems.
  - `dur`: los segundos del tramo; de ahí sale el reloj SVG de siete segmentos (~420 px), que se reinicia al entrar a la lámina, pasa
    a rojo en los últimos 30 s y parpadea en 0:00. Sin `dur`, o con menos de 30 s, QA avisa.
  - En el presentador el público ve la consigna en **blanco** con su emoji y la cuenta regresiva; la vista de
    ensayo muestra la misma cuenta y la consigna. Como el público la ve minutos enteros, sale igual (con el reloj
    congelado en `dur`) en su PNG (`NN-id-1.png`), en la hoja (rótulo «EN VIVO · m:ss»), en su página de `--pdf` y,
    sin `--sobre`, en el video. QA la revisa con las mismas reglas: más de 35 palabras (consigna + pasos; el reloj
    no cuenta), datos pendientes, desbordes, letra y la zona de Reels en 9:16.
  - Cuenta en la duración de la pieza, pero **no sustituye beats** (ARCOS.md).
- `camara` sin `vivo` queda para los tramos del montaje y los respiros a cámara (~4 s).

---

## Recetas 9:16 (reel)

Medidas en 1080×1920 (ancho útil 900; arriba y abajo quedan 320 px libres para la barra y el caption de Reels). El
modelo completo es `ejemplos/reel/`.

| Diseño | Receta |
|---|---|
| `pasos` con `iconos` | íconos de 200 (`emoji_tam`), etiqueta ~62 y «Paso N» ~62 con 3 pasos: el motor los ajusta a la columna. Con 4 o más pasos, parte el mapa o usa un `flujo` vertical |
| `tarjetas` | hasta 3: una columna de 860 con el rótulo a 64 y el emoji a 150 (por omisión); 4 o más: 2 columnas |
| `flujo` | se apila en vertical, cada nodo (emoji + etiqueta) centrado en el eje de la columna y las flechas rectas; con un `sub` por nodo, baja `emoji_tam` a ~140 para que el último nodo no caiga en los 320 px de abajo. QA avisa un nodo a más de 2% del eje |
| `chat` | 2-3 burbujas; la del prompt (`de: "yo"`) con la instrucción literal y corta (≤ 20 palabras) |
| `idea` | frase de 2-3 renglones: una línea que llega al borde derecho (x > 940) cae bajo los botones de Reels; parte la frase |

Evita en 9:16: `tabla` de 4+ columnas, `cuadrantes` de 4, `grafica` con muchas barras y `linea-tiempo` con más de 4
marcas: no caben a lo ancho.

## Campos finos (para ajustar sin tocar CSS)

| Campo | Dónde | Qué hace |
|---|---|---|
| `texto_paso` | idea, flujo, pasos, cifra, objeto, oscura, grafica, linea-tiempo, medidor, opciones, rejilla, prueba, boton, circulos | Paso en que aparece el texto. Cuenta desde 0. |
| `nota_paso` | idea, lista, flujo, pasos, cifra, cita, objeto, tarjetas, oscura, grafica, linea-tiempo, medidor, boton, circulos | Paso de la nota manuscrita. Por omisión, el paso siguiente al texto (en `pasos`, el mismo). |
| `clic_paso` | pasos, opciones, boton, y cualquier lámina con `clic` de texto | Paso en que llega el cursor. |
| `circulo_paso` | cualquiera con `((…))` | Paso absoluto del óvalo; por omisión entra con su texto. |
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
| `anotaciones` | cualquiera | Notas a mano con gancho hacia un ancla, o una flecha que entra desde el borde (ver «Anotaciones con flecha»). |
| `como` | pasos, calendario, tabla, lista, meses, chat, idea, prueba, objeto | Reusa el objeto de otra lámina (ver «El objeto que vuelve»). |

### Anotaciones con flecha (cualquier diseño)  ·  [15:00, 28:35, 2:40, 11:20, 36:45]
El video pone notas rojas a mano con su gancho sobre casi cualquier recurso: una captura con su dato encerrado, un
cohete, una tarjeta. `anotaciones` vale en cualquier lámina:
```json
{ "tipo": "prueba", "capturas": [{ "src": "assets/perfil.png", "circulo": [62, 40, 30, 12] }],
  "anotaciones": [{ "texto": "21.9K en 24 horas", "a": "cap0-circulo", "lado": "derecha" },
                  { "a": "cap0", "entra": "izquierda", "paso": 2 }] }
```
- Cada anotación: `texto` (Caveat de 54 px, máx. 400 px de ancho), `a` (el [ancla](#anclas)), `lado` (`derecha`,
  `izquierda`, `arriba`, `abajo`; sin él, a la derecha si cabe), `tono` (`r` rojo por omisión, `v` verde, `n`
  tinta; en lámina oscura el rojo sale claro), `paso` (por omisión, un paso extra al final), `tam` (px) y `x`/`y`
  (px o `%` del lienzo) para fijarla a mano. Sobre una captura la nota va FUERA de ella, a la altura del ancla.
- La nota va en el blanco junto a lo que señala, nunca encima del contenido. Si el lado pedido no cabe (el borde la
  empuja más de 20 px), pisa su tarjeta, otro texto o el sello, o deja menos de 80 px para el gancho, el motor prueba
  derecha, izquierda, abajo y arriba (en ese orden) y usa el primero limpio; si ninguno sirve, baja la letra hasta 44 px y,
  como último recurso, avisa. QA da error si una nota cae encima de su ancla u otra caja, o si su gancho la tacha.
- Sin `texto` y con `entra` (`derecha`, `izquierda`, `arriba`, `abajo`): una flecha roja larga que entra desde ese
  borde del lienzo hasta el ancla [15:00].
- En `calendario`, las anotaciones con `dia` siguen siendo las del calendario (nota al margen del día).
- Un ancla que no existe es error de QA y el mensaje lista las anclas de la lámina; la nota fuera del lienzo o
  encimada con otro texto también. QA avisa si el gancho mide menos de 60 px.

Un valor con tipo equivocado se descarta con aviso y uno fuera de rango se recorta con aviso (`n: 99 → 42`), y la revisión de calidad lo
cuenta como error. Un campo que el diseño no usa se ignora con aviso (−3), con sugerencia si parece
un error de dedo.

**`voz` y `anclas` como lista llevan un texto por paso, ni más ni menos.** Si no cuadran con los
pasos de la lámina, QA da error: los cortes del montaje se desalinean y las frases de más se pierden. El error dice
qué entra en cada paso («paso 1: 📅 «Dices a qué hora…» · paso 2: sello «Cerrado»»).

### Pasos que genera cada diseño
La fuente de verdad es el motor: **`node scripts/render.mjs <deck> --pasos`** imprime, sin navegador ni PNG, qué entra
en cada paso de cada lámina (numerado desde 1, como la hoja) y marca con ✗ la `voz` que no cuadra. Úsalo ANTES de
escribir la voz. `pasos.json` (cada fila con `revela`) y `qa.json → mapa_pasos` guardan lo mismo. Los casos que
confunden (una prueba construye cada uno y compara con esta tabla):

| Diseño | Pasos | Qué entra |
|---|---|---|
| `boton` | 1 | el botón, su texto y el clic, todo en el paso 1 (`clic_paso: 1` separa el clic) |
| `pasos` con `clic` | 1 | teclas, texto, nota y la mano que aprieta y arrastra, todo en el paso 1 (`clic_paso: 1` separa la mano) |
| `tabla` con 3 columnas (`revelar: "columnas"`) | 4 | paso 1: el marco y los rótulos de fila; luego una columna por paso (N + 1) |
| `lista` de 3 ítems con `tachar_despues` | 6 | los 3 ítems, uno por paso, y después los 3 tachones, uno por paso (2 × N) |
| `idea` con `sello` | 2 | el texto (aunque sean 2 renglones) en el paso 1; el sello, un paso extra |
| `linea-tiempo` con N tramos | N+1 | marcas neutras, después un tramo por paso; N+1 voces |
| `agenda` con N series | N+1 | rejilla neutra; cada serie completa en su paso |
| `flujo` de 3 nodos con `texto` | 3 | un nodo por paso; el `texto` entra con el ÚLTIMO (`texto_paso: 0` lo sube) |
| `lista` de 3 ítems | 3 | el encabezado con el primer ítem; un ítem por paso |
| `foto` | 1 por omisión | imagen, velo y frase juntos; `texto_paso` separa la frase y `fuente_paso` el crédito |
| `anfitrion` | 1 por omisión | retrato y texto juntos; `texto_paso` separa el texto |
| `prueba` con `variante: "pantallas"` | N | una captura con barra por paso; la fuente general entra con la última, salvo `fuente_paso` |
| `tarjetas` con `variante: "logos"` | N | un logo por paso, sin caja |

- Una `anotacion` sin `paso` y el `sello` sin `sello_paso` suman un paso al final.
- Los campos `*_paso` (`texto_paso`, `nota_paso`, `clic_paso`, `sello_paso`…) y los `desde`/`hasta` de una línea de
  tiempo cuentan **desde 0**; la hoja, `--pasos` y los mensajes de QA numeran desde 1.

## Anclas

`sello_sobre`, `clic`, las `anotaciones` y las flechas apuntan a anclas. Las que existen por diseño:
`texto` y `emoji` (idea), `s0`, `s1`… (stack), `m0`, `m1`… (chat), `e0`, `e1`… (calificacion), `i0`, `i1`… (lista),
`n0`… (el emoji del nodo), `nodo0`… (el nodo completo) y `aparte` (flujo), `k0`… (pasos), `o` y `r0`… (bifurcación),
`l0`… (cifra), `icono` y `cita` (cita), `objeto`, `medidor`, `op0`… (opciones), `rejilla`, `anot` y
`d<N>` (rejilla), `total` y `parte0`… (reparto), `dia0`… (calendario), `boton`, `cap0`… (la captura) y `cap0-circulo`…
(la elipse de su `circulo`) (prueba), `f0`… (la etiqueta de la fila) y `c0-1`… (la celda fila-columna, desde 0) (tabla).

Todas las marcas de palabra (`data-sub`, `data-tachar`, `((…))`) reciben `w0`, `w1`… en orden de lectura
desde 0 en toda la lámina. El óvalo conserva además `ovalo`. `sello_sobre`, `clic`, `anotaciones`
y flechas aceptan ambos. Fuera de flujo, `flechas: [{"de":"w0","a":"w1","estilo":"recta","paso":1}]`
conecta las palabras; las conexiones del flujo siguen su contrato por nodo.

Corrección: `"texto": "~~Antes~~"` y `"anotaciones": [{"a":"w0","texto":"Ahora","tono":"v","lado":"abajo"}]`.
Llave de anotación: `"anotaciones": [{"llave":["i0","i1"],"texto":"El mismo bloque"}]`.
Acepta i*, m*, l* y w*: deben estar en columna. La nota va a la derecha; QA rechaza nota fuera del lienzo.

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
- **Hueco a propósito**: `"PRECIO": { "pendiente": true, "motivo": "lo define dirección el lunes" }` se pinta como
  `[PRECIO]`, QA lo lista en `qa.json → datos_por_confirmar` y deja el deck en borrador (no como error de olvido).
  Los huecos declarados y los datos propuestos **no restan nota**: solo la topan en 90 con `estado: "borrador"`.
  Nunca quites un hueco (el caso, la prueba, el precio) para subir la nota: decláralo.
- **Tasas de resultado** (% que compra, que responde, que se va): nunca se proponen. Van como `{{TASA_…}}` en `datos`
  (real o pendiente), con `fuente`, o como hipótesis en la condición de `arriba` («Si te contrata el 0.1-0.3%:»). QA
  avisa «tasa sin origen» si una `cifra` escribe una tasa en la cuenta sin nada de eso, y deja el deck en borrador.
- **Claves de la clase** (`"clase": true`, clase corta): `PROXIMA_CLASE` (fecha y hora) y `COMUNIDAD` (nombre, palabra
  clave o link), con un dato real o pendiente, nunca inventado. Receta del cierre: una `idea` 📅 «Próxima clase:
  {{PROXIMA_CLASE}}» o un `boton` «Únete a {{COMUNIDAD}}» justo después de la lámina de la tarea.
- **Claves de la oferta** (MI-MARCA, «Oferta»): `PRECIO`, `GARANTIA_DIAS`, `GARANTIA_CONDICION`, `BONO_1`, `BONO_2`…,
  `CUPOS`, `FECHA_LIMITE`, `FECHA`, `VIGENCIA`. «Quedan {{CUPOS}} lugares» con su dato es escasez real; «Quedan solo 3
  lugares» o «solo hoy» escritos a mano son error de QA (GUION §7, beat 8).
- El `[x]` en minúsculas dentro de un `chat` es otra cosa: lo que el usuario personaliza en el mensaje
  (`[nombre]`), no un dato pendiente.

## Marcas de texto

| Marca | Resultado |
|---|---|
| `((cifra))` | óvalo a mano, un único énfasis por lámina; admite `{v:((5))}` y `^^((2032))^^`; máximo 4 palabras, sin salto de línea y sin partirse entre renglones. `circulo_paso` lo separa del paso de la frase; en oscura va blanco |
| `**frase**` | negrita: la frase clave |
| `__frase__` | negrita + subrayado rojo a mano |
| `==frase==` | negrita + resaltador amarillo |
| `~~frase~~` | tachón rojo a mano (solo el rojo: sin el tachón negro del navegador). Por omisión cae en el paso del texto; con `tachar_paso: 1` (idea, cita, cifra) llega un paso después, para que se lea antes [4:05]. QA avisa el tachado que aparece ya tachado |
| `*frase*` | cursiva: la voz de otro (una objeción) [17:25]. El asterisco va pegado al texto: `5 * 3` no cambia |
| `^^frase^^` | remate en su propio renglón, en negrita y ~1.5× [18:30]; puede llevar `__` o `==` dentro |
| `{v:texto}` `{r:}` `{n:}` `{g:}` `{a:}` `{o:}` | color semántico: verde, rojo, naranja, gris, azul o dorado (cifra sobre lámina oscura) |
| `[[texto]]` | letra manuscrita dentro de la línea |
| `[PRECIO]` | dato pendiente (MAYÚSCULAS): contorno punteado del color del renglón, sin amarillo; conserva el tono, el peso y el tamaño de la marca que lo envuelve (`{g:{{PRECIO_ANCLA}}}` sigue gris). QA lo cuenta como error hasta llenarlo; mejor `{{PRECIO}}` con `datos` |
| `[texto en minúsculas]` (en `chat`) | variable de plantilla para el espectador («Hola [nombre]»): letra amarilla sin caja en la burbuja azul [21:55, c_1315]; en la gris, blanca con subrayado punteado amarillo |
| `{s:/año}` | sufijo chico: ~55% del tamaño, en regular y del mismo color («**$50k**{s:/año}») [17:00] |
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


## Presentación, procedencia y QA de voz

Campos del deck: `sala` es `true`, `false` o `{ "distancia_m": 15 }`; nunca se deduce de `en_vivo`.
En 9:16 se ignora con aviso. `persona` acepta `"tu"` o `"ustedes"`; pantalla y voz contradictorias en el mismo paso son error incluso sin declararla. En vivo, QA pide declararla; sin `en_vivo` asume `tu` con aviso suave. Por lámina, `excepcion_persona`: `"titulo-formula"`, `"cita"`,
`"a-si-mismo"`, `"a-la-ia"` o `"uno-a-uno"` documenta el cambio intencional. `persona_excepciones` en el deck conserva frases concretas.

Campos comunes `accion` y `si_falla`: texto común o arreglo con una entrada por paso. Se muestran solamente en
`notas-por-paso.md`, PDF con notas, banda N y vista O del presentador (también junto a la consigna de `vivo`), nunca sobre la lámina, PNG, video ni montaje. QA avisa `si_falla` sin `accion` en el mismo paso, notas sin `en_vivo: true` y `camara` con `vivo` sin respaldo. `credibilidad: true` declara una
lámina de credibilidad explícita. `--pdf-pasos` recaptura todos los pasos sin cursor ni onda; cámaras sin `vivo`
no generan página, cámaras con `vivo: true` generan su consigna. El stack conserva sus pasos a sangre.

`objeto` admite `procedencia` (`"real"`, `"ia"`, `"ejemplo"`), `fuente` y `fuente_paso` (0 por omisión).
Una imagen solo cuenta como prueba propia con `procedencia: "real"` o `fuente`. IA y ejemplos nunca cuentan.
En `prueba`, cada captura admite la misma `procedencia`. Una captura de respuesta de IA real lleva
`fuente: "Respuesta real de <IA> · <fecha>"`. IA muestra «Imagen creada con IA»; ejemplo, «Ejemplo ficticio»:
rótulo gris inferior derecho, 34 px en video y 44 px en sala, sin capa roja.
En `cifra`, solo `procedencia: "ejemplo"` activa ese descargo visible cuando el usuario lo pide.

`linea-tiempo.marcas[].paso` fija el paso desde 0. Sin ese campo, una marca `tono: "r"` o `"v"` entra con el
primer tramo cuyo `hasta` apunta a ella; sin coincidencia, con el último tramo. Las marcas neutras son la escala
y permanecen en el paso 0. `fuente_paso` permite mostrar la referencia justo cuando se cita en la voz.

`--apagado` vale 0.2 en video y 0.35 en sala para mapas con `activo` y pasos atenuados. Listas, opciones y calendario
conservan sus pisos previos de video (0.25, 0.28 y 0.3) y suben a 0.35 en sala; así el demo sin sala no cambia.
El fondo clonado del `foco` conserva 0.2 como escenografía; `opacidad` explícita del autor manda y su frase no cambia.

`guion`: `true` en chat declara un guion literal para responder a un cliente. También cuenta si el encabezado
dice «Puedes responder así:», un imperativo de respuesta o termina en dos puntos, y hay al menos un mensaje
`de: "yo"` con texto. Un encabezado neutro no convierte una conversación en demostración del cómo.

Los huecos de `datos` declarados pendientes admiten `muestra` (texto, hasta 120 caracteres), por ejemplo
`{ "pendiente": true, "motivo": "por confirmar", "muestra": "$299" }`. QA remide una ecuación o resaltado
partido con esa muestra (o «0000») y restaura el DOM: si el problema desaparece informa «revísalo al llenar CLAVE»
sin restar nota. La muestra nunca sustituye el dato en la entrega. `fuente` también dibuja los huecos pendientes.

QA usa un solo contador de palabras: una cifra con comas, decimales o rango unido cuenta una; «10 - 15%», dos.
El ritmo incluye `dur`; sin voz ni duración medibles la mediana y p90 son null. Una duración explícita mayor de
8 s avisa y el exceso de voz sobre `dur` se agrupa en un aviso, con los ocho déficits mayores.

### Aritmética de `cifra`

QA revisa las líneas con `=` y una operación entre dos números del lado izquierdo: ×, x, *, ÷, /, +, −, -.
Lee dinero, miles, decimales, porcentajes, k/M y mil/millones, rangos e intervalos, continuaciones y cadenas.
Tolera como máximo una unidad o 5 %; con `~` también admite redondeo a una cifra significativa.
Salta tachados, huecos pendientes y cuentas ambiguas. «45 días = 1.5 meses» no se revisa, pues no tiene operador.
La voz no se revisa aritméticamente. Pon los números de una escena en `datos` y reutiliza `{{DATO}}`.
Si una escena vuelve con un costo nuevo, recalcula el total: la última cuenta es la que recuerda el espectador.

### Chat en 9:16

Sin `tam_texto`, 2-3 mensajes cortos (hasta 12 palabras cada uno) usan 76 px; con más mensajes cortos, 68 px;
con mensajes de hasta 24 palabras, 64 px; solo los densos usan 58 px. El avatar mide aproximadamente 1.3 veces
el texto. El encabezado usa `encabezado_estilo: "frase"` salvo elección explícita. Las frases y notas verticales
se centran en un ancho máximo de 800 px para dejar libre la franja de botones. Comprueba ocupación ≥35 % en QA.

### Logos por confirmar

`imagen: "{{LOGO_X}}"` admite sustitución desde `datos` en nodos de flujo, objeto, stack y oscura.
En pasos, `logos: ["{{LOGO_X}}", ""]` es un arreglo paralelo a `iconos`: una ruta reemplaza ese ícono y una cadena vacía conserva el emoji. Se hereda con `como`. `iconos` admite `{ "imagen": "{{LOGO_X}}" }` junto a emojis de texto. Sin valor se dibuja una caja
punteada del tamaño del ícono con el marcador resaltado, y entra en `por_confirmar`. Con valor `assets/x.png`
se copia y pinta el archivo mediante las mismas reglas de imágenes locales. Otros huecos en `imagen` no se sustituyen.
`lista` admite `fuente` y `fuente_paso`; por omisión la referencia gris entra con el último ítem (0 en un mapa activo).
Regla 10: una etiqueta de herramienta (TikTok, Seller Center, Instagram, WhatsApp, YouTube, Shopify, Mercado Libre,
ChatGPT, Canva o Stripe) debe usar su logo real o `{{LOGO_X}}`, no un emoji genérico.

Campo del deck `conceptos`: objeto de emoji → concepto corto (1-80 caracteres). Si se declara, QA avisa conceptos
normalizados duplicados y añade información sobre emojis usados sin declarar. Sin el campo no cambia el QA.

### QR en `idea`, `lista` y `boton`

`qr: { "url": "https://<tu-url-corta>", "rotulo": "escanéalo" }` añade un paso final a la derecha (debajo en 9:16). `url` empieza con HTTPS y no lleva credenciales; `rotulo` es texto corto opcional en Caveat rojo. La lámina reserva la zona del código: ninguna flecha ni sello debe cruzarla. El QR usa ECC M, la versión mínima que cabe y cuatro módulos blancos de zona quieta. El SVG es negro/blanco, sin sombra ni filtro y funciona sin red.

En vivo, cada módulo debe medir al menos 10 px en un lienzo de 1920 px; el motor propone 12 px. QA mide el tamaño pintado, rechaza dominios de relleno y avisa si la URL supera unos 30 caracteres. Usa una URL corta, estable y real; nunca proyectes un QR que no lleve a nada. En video, QA recuerda mostrar la URL corta porque el espectador suele usar el mismo teléfono.

Receta de cierre en vivo: `lista` con el resumen a la izquierda, `qr` a la derecha y rótulo «escanéalo». La voz del último paso da tiempo para entrar. Si no usas QR, muestra una URL de al menos 64 px o una palabra clave. Pedir «escanea», «QR» o «tómenle foto al QR» sin código es error; tomar foto de una fórmula no pide QR.

### `foto` — fotografía a sangre con velo blanco

```json
{ "tipo": "foto", "imagen": "assets/escena-propia.png", "velo": "blanco",
  "texto": "Un espacio para __pensar__", "procedencia": "ejemplo",
  "fuente": "Ilustración propia · ejemplo ficticio" }
```

`imagen` y `texto` son obligatorios. `velo` pertenece a una lista cerrada: `"blanco"` por omisión
(opacidad 0.72, como 36:10), o `"banda"` (franja blanca inferior, como 39:50). La imagen llena el lienzo
con `object-fit: cover`; nunca se presenta como un rectángulo suelto. La frase usa la letra y el revelado
habituales; conserva un único énfasis rojo. `texto_paso`, `fuente` y `fuente_paso` reutilizan sus contratos.
`procedencia` acepta `"real"`, `"ia"` o `"ejemplo"`; QA avisa cuando faltan tanto procedencia como fuente.

### `anfitrion` — retrato recortado junto a una frase

```json
{ "tipo": "anfitrion", "imagen": "assets/retrato.png", "lado": "der",
  "texto": "Tu explicación\n__va contigo__", "texto_paso": 1, "procedencia": "real" }
```

`imagen` (PNG con alfa) y `texto` son obligatorios. El retrato lo aporta el usuario: foto real a color,
nunca una persona generada ni gris. `lado: "izq" | "der"` lo pega al borde lateral e inferior (derecha
por omisión); no añade emoji. En 9:16 la foto queda abajo y el texto arriba. QA avisa si las cuatro esquinas
son opacas: recorta el fondo. El demo no los incluye: una foto o un retrato de relleno sería un placeholder. Las pruebas usan una silueta propia, rotulada
con `procedencia: "ejemplo"`; esa excepción didáctica no representa a una persona real.

### Cierre de QA

`garantia: false` declara que no hay garantía comercial, pero con precio visible exige una lámina
que explique qué pasa si no funciona. `avisos_aceptados` es una lista de `{ "texto": "subcadena del aviso",
"laminas": [2], "motivo": "justificación concreta" }`; también acepta `regla` en lugar de `texto`.
El motivo es obligatorio; `laminas` es opcional. Cada aviso restante se corrige o se acepta con motivo.
Un aviso sin resolver impide `estado: listo`, aunque la nota sea mayor de 90.

### Símbolo propio que vuelve

Los campos que aceptan emoji (`idea`, `pasos`, `flujo`, `stack`, `lista`) admiten `trazo:triangulo|MÉTODO`, `trazo:circulo|MÉTODO` y `trazo:marco|MÉTODO`. Solo para términos acuñados sin emoji literal, con 1–2 rótulos por deck, repetidos con figura idéntica; véase EMOJIS, «Término acuñado sin emoji literal». Para una metáfora física, usa `objeto` con `imagen: "assets/objeto.svg"`; su grupo vuelve con `como`, conservando imagen y medidas, sin heredar texto ni voz.
