# Catálogo de diseños (`tipo`)

Cada lámina de `deck.json` es un objeto con `tipo` más sus campos. Todo texto acepta las marcas de
[markup](#marcas-de-texto). Entre corchetes va el momento del video de referencia donde aparece
ese diseño.

**Campos del deck** (arriba de `laminas`)

- `titulo`, `formato` (`16:9`, `9:16`, `1:1`, `4:5`), `emoji` (`apple` o `fluent`; `auto` solo como respaldo
  heredado: cambia de set según la máquina y QA revisa los dos; ver EMOJIS.md, «Qué set usar»), `animacion`
  (`seco`, `suave`), `idioma`, `piel` (🏻…🏿 o `ninguno`: el tono de piel de las personas; EMOJIS.md, «Personas»).
- `marca`: `{ "texto": "<tu @ o dominio>", "sufijo": "<opcional>" }` o `{ "logo": "assets/logo.png" }`.
  **Omítela si no hay marca real**: las láminas salen sin firma. Un valor de relleno («tumarca.com»,
  «@tuusuario», «<…>») es error de QA.
- `pieza`: `reel`, `tutorial` (2-8 min), `vsl-corto` (3-6 min), `clase-corta` (15-30 min), `video`, `vsl`,
  `clase`, `webinar`, `propuesta` o `libre`; `duracion_objetivo`: minutos (`45`) o `"mm:ss"`; `en_vivo: true`
  si se presenta en vivo. QA mide la voz contra eso ([ARCOS.md](ARCOS.md)): un objetivo fuera del rango de su
  pieza avisa (usa la pieza corta que le toca), «menos de la mitad» se mide con el tiempo de LÁMINAS (la
  cámara no rellena), más de 40% a cámara avisa y más de 60% con las láminas bajo la mitad es error aunque
  sea en vivo. `qa.json → duracion` separa `laminas` y `camara`.
- Cualquier otra clave de primer nivel se ignora y QA la avisa, también las que empiezan con `_` (`_marca`,
  `_datos`): un aviso de entrega escondido en el deck no lo lee nadie. Solo `_comentario` queda libre.
- `datos`: ver [Datos que se llenan una vez](#datos-que-se-llenan-una-vez).

**Campos que acepta cualquier lámina**

- `id`: nombre corto para los archivos y los cortes.
- `voz`: lo que se dice. Puede ser un texto o una lista con un texto por paso; sirve para
  tiempos, anclas y QA.
- `dur`: segundos por paso, como número o como lista.
- `revelar`: `"todo"` enseña todo de un golpe; por omisión se revela un elemento por paso.
- `sello`: texto de sello de goma que cae en un paso extra. Es una etiqueta blanca OPACA con doble
  borde rojo: tapa lo que queda debajo, como en [6:45]. **Sin posición se acomoda solo en un hueco libre**: prueba
  el centro, debajo del contenido (a la derecha y centrado), a su derecha, arriba y las 9 zonas, y se queda en el
  primero que no pisa renglones, emojis ni la tinta a mano (subrayados, llaves, tachones, flechas, con 24 px de aire);
  cada lugar se prueba a su tamaño, a 0.85 y a 0.7 (en
  `rejilla`, centrado sobre las cajas, como en [6:45]; si la rejilla tiene celdas en `destacar`, esas celdas
  son el dato que se cuenta: el sello se acomoda solo en la banda entre renglones que menos destacadas tapa
  o, si todas tapan más del 25%, en una franja libre junto a la rejilla. El sello es el remate y la cifra ya se
  dijo: tapar parte de la rejilla es fiel a [6:45]; QA solo avisa si tapa más del 25% de las destacadas). Se
  mueve con:
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
- `emoji_lado: true` pone el emoji a la izquierda en la misma línea [10:15], a ≈1.15× la letra de la frase (≈97 px
  con la frase `medio` de 84): en el video el 👥 mide ~66 px junto a una frase de ~60, no el doble. `emoji_tam` lo fija.
- **Par antes/después** [10:55]: `"emoji": ["no:📚", "si:🤖"]` pone dos emojis en fila;
  `apagar_emoji: 0` atenúa el primero (el negado) y `emoji_paso: 1` revela el segundo después.
  Solo en `idea`.
- `encabezado`: rótulo gris chico arriba. Con `encabezado_pos: "entre"` va ENTRE el emoji y la
  frase [34:25 «Reason #1»].
- **Objeción o «Razón #N»** [34:25, 35:15] — una forma para todas las del deck:
  ```json
  { "tipo": "idea", "emoji": "no:⌨️", "encabezado": "Objeción #1", "encabezado_pos": "entre",
    "texto": "**«No sé nada de tecnología»**" }
  ```
  El emoji es lo que dice que le falta, negado (EMOJIS.md, «Compuestos útiles»: suelto, `no:X` es la objeción).
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
  los tachones llegan después de que aparece todo [4:05], **cada uno en su paso**: 3 ítems tachados dan 6 pasos
  (3 ítems + 3 tachones), y la `voz` lleva 6 textos.
- Arranca arriba y crece hacia abajo (`anclar`); con `revelar: "todo"` se centra.
- **Descartes** [m_256 4:16, 4:05]: si TODOS los ítems van tachados, cada renglón va centrado, en
  seminegrita, y la lista se queda centrada en la lámina con su hueco reservado (el primer renglón aparece
  ya en su lugar final). El tachón es un plumón grueso (~10 px) que arranca antes de la viñeta y sale por
  la derecha. `alinear: "centro"` lo fuerza en cualquier lista; `alinear: "izquierda"` lo quita. Las listas
  con encabezado («Sin:», razones) siguen a la izquierda y arriba [1:35, 3:30].

### Fuente de un dato o un estudio (`idea`, `flujo`, `grafica`, `cifra`, `cita`)
`"fuente": "Antonio Damasio, «El error de Descartes» (1994)"` pinta al pie de la lámina una línea en sans gris de
40 px (36 en 9:16), sin cursiva: **un solo estilo** para citar, «Autor, obra (año)». Aparece con el dato (el paso
del texto, del último nodo o de la última línea de la cifra); `fuente_paso` la mueve. No cites con `nota`: la nota
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
  la cuenta del aviso de proyección. Es la misma `fuente` de `idea`, `flujo`, `grafica` y `cita` (ver «Fuente de
  un dato o un estudio»).
- `[[palabra]]` pone una palabra en letra de mano dentro de la ecuación: `100-250 [[ventas]] × $100`.
- Cada línea puede ser un objeto `{ "texto", "tam", "peso", "tono" }` para jerarquizar. **Precio con
  ancla** — el ancla es algo real que el público ya vio (la columna cara de la tabla, un sueldo, tu
  nivel superior), chica y gris; el precio, grande y abajo. Nunca un «Valor» inventado:
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
  `ancho_etiqueta`, `vacias`. Nunca `id`, `voz`, `revelar`, `activo`, `hechos`, `fase_activa`, `texto`, notas ni sello.
- Lo que trae la lámina gana (`{ "tipo": "calendario", "como": "plan", "fase_activa": 2 }`). La madre va antes; se
  permiten cadenas. Es error un `como` a un id que no existe, que va después, a sí misma o de otro diseño; `como` solo
  existe en `pasos`, `calendario` y `tabla`. QA avisa cuando una lámina repite a mano el objeto de otra.

### `tabla` — la tabla-marcador escrita a mano  ·  [5:25 → 10:05]
El recurso estrella: se llena columna por columna a lo largo de varias láminas. `converger: { "columna", "texto",
"emoji", "paso" }` [7:30]: la pregunta manuscrita va a la derecha de la tabla (que se angosta) y una flecha roja fina
sale de cada celda de esa columna y converge en ella, todas en el mismo paso. Usa la última columna con datos (la que
queda junto a la pregunta): desde otra, las flechas cruzan las celdas y QA lo marca. En 9:16 las columnas vacías quedan
angostas (80 px), el ancho se reparte según la palabra más larga de cada columna y la letra baja por tabla hasta 34 px
(td) / 38 (th); si una tabla de más de 3 columnas de datos ni así cabe, avisa: pártela con `fijas`. QA da error si el
texto de una celda sale de su caja (se monta en la vecina).
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
- **Muchas cajas**:
  ```json
  { "tipo": "rejilla", "encabezado": "Tendrías que vender…", "emoji": "📦", "total": 300, "anotacion": "Son 300", "sello": "Mucha habilidad" }
  ```
- **Porcentaje**:
  ```json
  { "tipo": "rejilla", "punto": true, "total": 100, "columnas": 20, "destacar": [99], "texto": "¿El **99%**?" }
  ```
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
  con 10 px de separación. Con notas al margen, en 9:16 o con más días, el calendario normal de 1400.
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
  QA avisa si un chat lleva `sello` sin `sello_sobre`. En un chat el sello **no mide el ancho de la burbuja** (como en
  la rejilla): va con tinta fija y se pega JUNTO a la burbuja culpable —montado sobre su borde de abajo, del lado
  contrario al avatar, o a un lado—, sin tapar su texto, las horas, las otras burbujas ni el avatar. No uses
  `sello_pos` en un chat: el sello cae sobre lo que haya en esa zona (un avatar tapado es error de QA).

### `prueba` — capturas reales, con el dato encerrado  ·  [0:35, 15:45, 19:30]
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

### `boton` — botón de interfaz y cursor que lo aprieta  ·  [23:15, 38:15]
```json
{ "tipo": "boton", "boton": "Generar", "emoji": "🤖", "texto": "Solo das clic en el **agente correcto**…" }
```
`boton` (el texto del botón) es obligatorio. `cursor` acepta `mano` (por omisión) o `flecha`.
- **Pasos: 1.** El botón, su `texto` y el cursor que llega y aprieta entran en el paso 0 (`clic_paso` y `texto_paso`
  valen 0 por omisión): la `voz` lleva UN texto. `clic_paso: 1` separa el clic en un segundo paso.
- Con `cursor: "mano"` (por omisión) el `emoji` del botón no puede ser una mano (👆 👉 ✍️): el cursor ya señala y se
  verían dos manos [23:15, 38:15]. Va un objeto (📝 🤖 🚀 📞); QA lo avisa. Si tiene que ser una mano, `"cursor": "flecha"`.

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
            { "emoji": "📞", "texto": "4 llamadas en vivo" }, { "imagen": "assets/logo.png", "texto": "Grupo privado" }],
  "remate": "Hecho **contigo**" }
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
- `sangre: false` (y el 9:16) usa la pila de casillas grises con el rótulo, el remate y el `total` debajo.
- `remate_paso` y `nota_paso` mueven el cierre.
- **Bonos** (solo si la oferta los tiene, GUION §7 beat 7b): van AL FINAL del stack, después de las piezas base, cada
  uno con `sub: "Bono #N"` (la píldora) y su nombre desde `datos`:
  `{ "emoji": "🎁", "texto": "{{BONO_1}}", "sub": "Bono #1" }`. QA avisa un bono sin `{{BONO_N}}` o antes de una pieza
  base. No hay diseño ni cinta de bono aparte: la referencia no los tiene.
- Como el remate tapa las piezas, la hoja y `--finales` sacan DOS cuadros de esta lámina: el stack
  lleno («N · id · paso K») y el remate («N · id»). Revisa los dos. El PDF (`--pdf`) da UNA página: el stack lleno
  y el remate en una banda debajo.

## Especiales

### `foco` — atenúa la lámina anterior y escribe encima  ·  [15:20]
```json
{ "tipo": "foco", "texto": "Sigues cobrando mientras el creador siga promoviendo el producto." }
```
- La frase de foco es la PROTAGONISTA, no una nota al margen: Caveat a 88 px en 16:9 (84 si pasa de 14
  palabras; 96 / 88 en 9:16) y hasta ~1560 px de ancho, como en el cuadro 15:20. `tam` la cambia.
- `opacidad`: por omisión 0.2.
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
- El fondo atenuado repite el contenido y las flechas de la lámina anterior, pero no su sello ni
  su cursor.
- Acepta su propio `sello`.

### `camara` — tramo a cámara (en el montaje se ve tu grabación)
```json
{ "tipo": "camara", "voz": "Déjame contarte cómo empecé", "dur": 4 }
```
- En el presentador se proyecta en **negro limpio**; la `nota` («🎥 A cámara») solo sale en los PNG, la
  hoja y la vista de ensayo. En el montaje (`video.mjs --sobre`) ahí se ve tu grabación.
- **Tramo en vivo de una clase** (actividad, demostración, preguntas): una `camara` con `"vivo": true`.
  ```json
  { "tipo": "camara", "id": "actividad", "vivo": true, "dur": 300,
    "texto": "Ahora tú: **tu reparto** con lo que entró el mes pasado",
    "items": ["Anota lo que entró", "Sepáralo en 4 cuentas", "Mándame tu porcentaje por el chat"],
    "voz": "Tienes cinco minutos. Te leo." }
  ```
  - `texto`: la consigna para el público, a tamaño de frase (si falta, se usa `nota`). Acepta las marcas de
    texto.
  - `items`: hasta 5 pasos de la consigna, en lista numerada.
  - `emoji`: por omisión ⏱️, y 🙋 si la consigna habla de preguntas.
  - `dur`: los segundos del tramo; de ahí sale la cuenta regresiva, que se reinicia al entrar a la lámina, pasa
    a rojo en los últimos 30 s y parpadea en 0:00. Sin `dur`, o con menos de 30 s, QA avisa.
  - En el presentador el público ve la consigna en **blanco** con su emoji y la cuenta regresiva; la vista de
    ensayo muestra la misma cuenta y la consigna. Los PNG, la hoja y el video no cambian: sigue siendo un
    tramo a cámara.
  - Cuenta en la duración de la pieza, pero **no sustituye beats** (ARCOS.md).
- `camara` sin `vivo` queda para los tramos del montaje y los respiros a cámara (~4 s).

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
| `anotaciones` | cualquiera | Notas a mano con gancho hacia un ancla, o una flecha que entra desde el borde (ver «Anotaciones con flecha»). |
| `como` | pasos, calendario, tabla | Reusa el objeto de otra lámina (ver «El objeto que vuelve»). |

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
| `tabla` con 3 columnas (`revelar: "columnas"`) | 4 | paso 1: el marco y los rótulos de fila; luego una columna por paso (N + 1) |
| `lista` de 3 ítems con `tachar_despues` | 6 | los 3 ítems, uno por paso, y después los 3 tachones, uno por paso (2 × N) |
| `idea` con `sello` | 2 | el texto (aunque sean 2 renglones) en el paso 1; el sello, un paso extra |
| `flujo` de 3 nodos con `texto` | 3 | un nodo por paso; el `texto` entra con el ÚLTIMO (`texto_paso: 0` lo sube) |
| `lista` de 3 ítems | 3 | el encabezado con el primer ítem; un ítem por paso |

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
