# Catálogo de diseños (`tipo`)

Cada lámina de `deck.json` es un objeto con `tipo` más sus campos. Todo texto acepta las marcas de
[markup](#marcas-de-texto). Entre corchetes va el momento del video de referencia donde aparece
ese diseño.

**Campos que acepta cualquier lámina**

- `id`: nombre corto para los archivos y los cortes.
- `voz`: lo que se dice. Puede ser un texto o una lista con un texto por paso; sirve para
  tiempos, anclas y QA.
- `dur`: segundos por paso, como número o como lista.
- `revelar`: `"todo"` enseña todo de un golpe; por omisión se revela un elemento por paso.
- `sello`: texto de sello de goma que cae en un paso extra.
- `clic`: el ancla que el cursor va a presionar; `cursor` elige entre `mano` y `flecha`.
- `firma: false`: oculta la firma en esa lámina.
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
- `emoji_tam`: `chico` (110), `medio` (170, por omisión), `grande` (240), `heroe` (300) o un número.
- `emoji_lado: true` pone el emoji a la izquierda en la misma línea [10:15].
- `encabezado`: texto gris chico arriba.
- `nota_paso`: por omisión la nota aparece en el paso 1.
- Sin emoji es una **frase sola** [3:20 «So let's get started.»].

### `lista` — encabezado gris + viñetas, una por paso  ·  [1:35, 13:35, 40:15]
```json
{ "tipo": "lista", "encabezado": "Sin:", "vineta": "x",
  "items": ["Pasar años trabajando **12 horas al día**", "**Construir** una audiencia"] }
```
- `vineta`: `x` (❌), `check` (✅) o cualquier emoji. También puede ir un `emoji` por ítem.
- Un ítem con `"tachado": true` recibe un tachón rojo. Con `"tachar_despues": true` en la lista,
  los tachones llegan después de que aparece todo [4:05].

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

### `cifra` — números y ecuaciones grandes, una línea por paso  ·  [3:10, 14:10]
```json
{ "tipo": "cifra", "lineas": ["1,000,000 × **0.1%** = 1,000", "1,000 × $25,000 = __$25,000,000__"] }
```
- Con una sola línea sale enorme, a 140 px.
- `arriba`: nota manuscrita encima. `abajo`: etiqueta chica, como «Seguidores».
- `[[palabra]]` pone una palabra en letra de mano dentro de la ecuación: `100-250 [[ventas]] × $100`.

### `objeto` — foto real recortada o emoji gigante  ·  [1:40, 23:20]
```json
{ "tipo": "objeto", "imagen": "assets/alcancia.png", "alto": 520, "texto": "Tus ahorros" }
```
Para recortar el fondo de una foto se usa rembg (ver PROTOCOLO.md).

### `oscura` — revelación de producto u oferta  ·  [36:20, 37:40]
Fondo negro con brillo violeta. Solo para el momento «esto es lo que vendo».
```json
{ "tipo": "oscura", "imagen": "assets/logo.png", "titulo": "Tu Programa", "texto": "Lo que hay dentro" }
```

## Procesos y relaciones

### `flujo` — A → B → C con flechas a mano  ·  [6:30, 12:35, 17:20]
```json
{ "tipo": "flujo", "nodos": [{ "emoji": "🕵️", "etiqueta": "Identificar" }, { "emoji": "🤝", "etiqueta": "Aliarte" }] }
```
- `flecha`: `recta` (plumón rojo, por omisión), `arco` (arco rojo) o `arco-negro`.
- `flechas: [{ "tachada": true, "etiqueta": "no" }]` va por flecha: el arco tachado se lee
  «esto NO lleva a aquello» [1:45].
- Un nodo acepta `imagen` (foto recortada), `sub` (texto gris) y `normal: true`, que quita la
  negrita de la etiqueta.
- Cada nodo aparece en su propio paso junto con la flecha que llega a él.

### `pasos` — el sistema de N pasos (teclas 1 2 3 + ruta punteada)  ·  [1:55, 11:00, 16:35, 28:00]
```json
{ "tipo": "pasos", "n": 3, "clic": 1, "texto": "El sistema de 3 pasos **«solo dar clic»**",
  "nota": "Lo usan principiantes para cobrar como profesionistas" }
```
- Con `iconos` y `etiquetas` sale la variante de sección [16:40]:
  ```json
  { "tipo": "pasos", "iconos": ["🔍", "🛠️", "🚀"], "etiquetas": ["Encontrar", "Construir", "Lanzar"], "activo": 1 }
  ```
- `activo`: número del paso encendido; los demás quedan al 28%.
- `hechos`: lista de pasos con ✅, por ejemplo `[1, 2]`.
- `sobre: "✋"` pone un emoji arriba de cada tecla. `clic: 2` hace que el cursor presione la
  tecla 2. `ruta: false` quita la ruta punteada.

### `bifurcacion` — un origen y dos ramas, con llave  ·  [10:30]
```json
{ "tipo": "bifurcacion", "origen": { "emoji": "🤝", "texto": "**1** alianza" },
  "ramas": [{ "emoji": "💸", "valor": "$2,000" }, { "emoji": "💰", "valor": "$50,000" }],
  "llave": "Mismo trabajo" }
```
`revelar: "ramas"` hace que cada rama aparezca en su propio paso.

### `circulos` — la audiencia: anillo de personas y círculo interior  ·  [10:45, 14:05]
```json
{ "tipo": "circulos", "texto": "Reservada para **unos pocos**", "tono": "r", "tono_interior": "v", "personas": 12, "emoji": "🧑‍💼", "centro": "⭐" }
```

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

### `tarjetas` — criterios o métricas, una por paso  ·  [5:00, 9:25]
```json
{ "tipo": "tarjetas", "encabezado": "Las 6 métricas:", "items": [{ "emoji": "💵", "texto": "Ganancia por venta" }] }
```
Un ítem acepta `tono` (`v`, `r` o `n`) para pintar la tarjeta.

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
- `eje_x` y `eje_y` son las etiquetas de los ejes. `revelar: "series"` o `"barras"` hace que
  aparezca una por paso.

### `linea-tiempo` — marcas, tramos de color y llaves  ·  [9:50, 11:15, 16:05]
```json
{ "tipo": "linea-tiempo", "marcas": [{ "texto": "Día 1" }, { "texto": "Día 14", "tono": "v" }, { "texto": "Día 30", "tono": "v" }],
  "tramos": [{ "desde": 1, "hasta": 2, "tono": "v", "etiqueta": "Ideal" }, { "desde": 2, "hasta": "fin", "tono": "r", "etiqueta": "Aquí renuncian" }] }
```
- Una marca acepta `pos` (de 0 a 1) y `arriba`, un texto sobre la marca como «$1B».
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
- Con `apagar_resto: true` todo lo que no está destacado queda gris.

### `reparto` — pastilla verde que se parte  ·  [15:25, 22:15]
```json
{ "tipo": "reparto", "titulo": "Reparto de ingresos",
  "total": { "datos": [{ "valor": "5k", "etiqueta": "Audiencia" }, { "valor": "$30,000", "etiqueta": "Ingresos" }] },
  "partes": [{ "etiqueta": "Parte del creador", "valor": "$21,000", "pct": "70%", "tono": "gris" },
             { "etiqueta": "Tu parte", "valor": "$9,000", "pct": "30%", "tono": "verde" }] }
```

### `calendario` — días en tarjetas con fases de color  ·  [28:45 → 29:20]
```json
{ "tipo": "calendario", "titulo": "Calendario de 14 días", "fase_activa": 2,
  "dias": [{ "sub": "Inversión" }, { "sub": "Identificación" }],
  "fases": [{ "nombre": "Fase 1 · Calentamiento", "desde": 1, "hasta": 3, "color": "amarillo" },
            { "nombre": "Fase 2 · Valor", "desde": 4, "hasta": 9, "color": "azul" }],
  "anotaciones": [{ "texto": "«Me gusta su contenido»", "dia": 1, "lado": "izquierda", "arriba": 260 }] }
```
- `color`: `amarillo`, `azul`, `verde` o `rojo`.
- `fase_activa` cuenta desde 1, igual que `activo` en `pasos` y `dia` en `anotaciones`. Sin ella,
  todos los días se ven iguales.
- Repite la lámina cambiando `fase_activa` para recorrer las fases.

## Interfaz y prueba

### `chat` — burbujas, un mensaje por paso  ·  [17:45, 19:00, 21:50]
```json
{ "tipo": "chat", "mensajes": [{ "de": "yo", "texto": "¿Quieres trabajar conmigo?" }, { "de": "otro", "texto": "¡Sí, me interesa!" }] }
```
Un texto entre corchetes dentro de una burbuja sale en amarillo, como `[nombre]`: sirve para
plantillas de mensaje.

### `prueba` — capturas reales o un post armado, con el dato encerrado  ·  [0:35, 15:45, 19:30]
```json
{ "tipo": "prueba", "capturas": [
  { "src": "assets/captura.png", "circulo": [62, 40, 30, 12], "tachar": [[5, 3, 25, 6]] },
  { "post": { "nombre": "Ana", "usuario": "@ana", "texto": ["Hoy cerré mi primera alianza.", "$3,000 por adelantado."], "clave": "$3,000 por adelantado." } } ] }
```
- `circulo` y `tachar` van en porcentaje de la imagen: x, y, ancho, alto.
- Usa **solo testimonios y resultados reales, con permiso**. Tacha los datos personales.

### `boton` — botón de interfaz y cursor que lo aprieta  ·  [23:15, 38:15]
```json
{ "tipo": "boton", "boton": "Generar", "emoji": "🤖", "texto": "Solo das clic en el **agente correcto**…" }
```
`cursor` acepta `mano` (por omisión) o `flecha`.

## Especiales

### `foco` — atenúa la lámina anterior y escribe encima  ·  [15:20]
```json
{ "tipo": "foco", "texto": "Sigues cobrando mientras el creador siga promoviendo el producto." }
```
- `opacidad`: por omisión 0.2.
- No puede ir como primera lámina.
- El fondo atenuado repite el contenido y las flechas de la lámina anterior, pero no su sello ni
  su cursor.
- Acepta su propio `sello`.

### `camara` — tramo a cámara (en el montaje se ve tu grabación)
```json
{ "tipo": "camara", "voz": "Déjame contarte cómo empecé", "dur": 4 }
```

---

## Campos finos (para ajustar sin tocar CSS)

| Campo | Dónde | Qué hace |
|---|---|---|
| `nota_paso`, `texto_paso`, `banda_paso`, `anotacion_paso`, `destacado_paso`, `centro_paso`, `interior_paso`, `sello_paso`, `clic_paso` | varios diseños | En qué paso aparece ese elemento. Cuenta desde 0. |
| `paso` | ítems de `marcas`, `tramos`, `anotaciones` | Lo mismo, por ítem. |
| `tam_texto` | idea, lista, flujo, pasos, medidor, boton | `chico`, `medio`, `grande`, `enorme` o un tamaño en px (`"70px"`). |
| `tam` | cifra y foco | Tamaño de letra en px. |
| `separacion` | lista, flujo, bifurcacion, reparto | Espacio entre elementos, en px. |
| `alto`, `ancho` | objeto, flujo (nodo), prueba, rejilla | Tamaño en px. |
| `prefijo` | pasos con íconos | Texto antes del número. Por omisión «Paso»; con `false` se quita. |
| `ancla` | cualquiera | Frase que dispara el paso 0 en el montaje (atajo de `anclas[0]`). |
| `oscura: true` | cualquiera | Pinta esa lámina con el fondo oscuro de la oferta. |

Un valor fuera de rango o con tipo equivocado se descarta con aviso, y la revisión de calidad lo
cuenta como error.

## Marcas de texto

| Marca | Resultado |
|---|---|
| `**frase**` | negrita: la frase clave |
| `__frase__` | negrita + subrayado rojo a mano |
| `==frase==` | negrita + resaltador amarillo |
| `~~frase~~` | tachón rojo |
| `{v:texto}` `{r:}` `{n:}` `{g:}` `{a:}` | color semántico: verde, rojo, naranja, gris o azul |
| `[[texto]]` | letra manuscrita dentro de la línea |
| `\n` | salto de línea |

## Emoji compuesto

| Escritura | Resultado |
|---|---|
| `"🧑‍⚕️+💰"` | base + insignia abajo a la derecha |
| `"no:🎥"` | base + ❌ abajo a la izquierda |
| `"si:💸"` | base + ✅ abajo a la izquierda |
