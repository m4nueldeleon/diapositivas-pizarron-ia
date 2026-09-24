# Del guion a las láminas: cómo piensa el diseñador

El secreto del estilo no está en el CSS, sino en la **traducción**. Cada frase del guion se
convierte en UN cambio visual que la vuelve obvia. Este documento es el método.

## 1. Partir el guion en «beats»

Un beat es una unidad de sentido, normalmente una oración o una cláusula. Cada beat es un paso:
la lámina nueva o un elemento más sobre la actual.

```
«Hay gente usando la IA para ganar lo mismo que un médico     → beat 1: lámina idea (🧑‍⚕️+💰)
 sin experiencia previa en negocios.                           → beat 2: + nota manuscrita
 Sin pasar años trabajando doce horas al día,                  → beat 3: lámina lista «Sin:» + ❌ ítem 1
 sin construir una audiencia,                                  → beat 4: + ❌ ítem 2
 y sin mostrar tu cara.»                                       → beat 5: + ❌ ítem 3
```

- **Un beat dura 2 a 3 s**: la mediana medida es 2.9 s. Si un beat dura más de 5 s, pártelo o
  corta a cámara.
- **Nueva lámina o paso extra**:
  - Si el beat **sigue la misma idea**, es un paso más en la misma lámina: acumula.
  - Si **cambia de idea**, es lámina nueva.
  - Si **contradice** la anterior, usa `foco`, un tachón o una lámina con ✕.

## 2. Tabla de traducción: qué dice el guion y qué se dibuja

| Si el guion dice… | Dibuja… | Diseño |
|---|---|---|
| una afirmación fuerte | emoji literal + frase con la clave en negrita | `idea` |
| una promesa o tesis | la frase con `__subrayado__` rojo | `idea` |
| «sin X, sin Y, sin Z» | «Sin:» + ❌ por renglón | `lista` |
| «lo que necesitas: A, B, C» | ✅ por renglón | `lista` |
| «X, Y y Z no sirven» | lista con tachones | `lista` con `tachado` |
| «A lleva a B» | A → B con flecha roja | `flujo` |
| «A NO lleva a B» | arco negro con ✕ | `flujo` + `tachada` |
| un proceso de N pasos | teclas 1-2-3 + ruta punteada | `pasos` |
| «estás en el paso 2» | la misma lámina con `activo: 2` y `hechos: [1]` | `pasos` |
| «lo mismo, dos resultados» | origen → dos ramas + llave «mismo trabajo» | `bifurcacion` |
| un cálculo | la ecuación línea por línea, con el total subrayado (si es una proyección al espectador: condición arriba y rangos, ver §3.8) | `cifra` |
| un número que impresiona | el número solo, enorme | `cifra` con una línea |
| «tendrías que vender 500» | 500 emojis en rejilla + nota «Son 500» + sello | `rejilla` |
| un porcentaje | 100 puntos, unos de otro color (agrupa los destacados, los llenos primero y en orden: «41 de 100» se lee de un vistazo; el sello nunca los tapa) | `rejilla` + `punto` |
| «tú, entre todos ellos» | multitud con uno encendido | `rejilla` + `destacar` |
| comparar opciones con criterios | tabla-marcador | `tarjetas` y luego `tabla` |
| crece, escala, se dispara | curva | `grafica` |
| «en 14 días», «en 12 meses» | línea de tiempo con tramo verde | `linea-tiempo` |
| «es muy difícil» | medidor con el pin en rojo | `medidor` u `opciones` |
| «solo das clic» | botón + cursor | `boton` |
| un mensaje o conversación | burbujas | `chat` |
| «tú te quedas con el 30%» | pastilla que se parte | `reparto` |
| un testimonio o prueba | captura con el dato encerrado | `prueba` |
| lo que NO necesitas / lo que SÍ | bloques rojo y verde | `cuadrantes` |
| una pregunta retórica | 🤔 + la pregunta | `idea` |
| una objeción del cliente | emoji negado + «Objeción #N» entre el emoji y la frase + la objeción en negrita y entre comillas; la respuesta en la lámina SIGUIENTE | `idea` con `encabezado_pos: "entre"` |
| por qué falla la mayoría | la misma forma con «Razón #N» [34:25, 35:15] | `idea` |
| credibilidad (años, clientes) [36:10] | la cifra real sobre una foto o captura real | `prueba` u `objeto` |
| componente numerado «#N» de la oferta [41:10, 41:40] | «#4» + el componente, en blanco | `idea` |
| pregunta de sí después de un componente [41:00, 41:35] | 🤔 + «¿Ves cómo…?» | `idea` |
| lo que incluye la oferta, el stack que crece [42:30] | bento que se llena pieza por pieza | `stack`, `tarjetas` o `rejilla` |
| qué pasa después del clic [43:35-43:50] | flecha roja al link, «2 minutos», la invitación del calendario | `boton` o `calendario` |
| el precio | ancla real chica y gris → precio grande (una línea por paso) | `cifra` con líneas-objeto |
| cupos o lista de espera (solo si son reales) [43:15-43:30] | rejilla con el color de los ocupados en un paso posterior + la fuente | `rejilla` + `destacado_paso` |
| antes / después | en UNA lámina: bloques rojo y verde, o el par de emojis | `cuadrantes` o `idea` con par |
| una fila de conceptos sin causa→efecto | nodos numerados sin flechas [19:15] | `flujo` + `flecha: "ninguna"` |
| una frase textual de alguien | letra manuscrita + flecha | `cita` |
| una idea que resume la anterior | atenuar la anterior + nota encima | `foco` |
| la revelación del producto o la marca (SOLO eso: el resto de la oferta va en blanco, §7) | lámina oscura (nombre, logo, una frase) | `oscura` |
| historia personal, confesión o llamado | nada: cámara | `camara` |

## 3. Cómo escribir el texto de la lámina

1. **No transcribas: comprime.** La lámina lleva las palabras clave que se dicen, no la oración
   entera. Por ejemplo, se dice «hay un grupo de personas que lo está aprovechando para ganar
   tanto como un doctor» y la lámina pone «La gente lo usa para **ganar como un médico**».
2. **Máximo 22 palabras visibles.** Lo ideal son entre 6 y 14.
3. **Una frase clave en negrita.** El resto va en regular. La negrita es lo que el ojo lee si
   solo tiene medio segundo.
4. **Un énfasis por lámina**: subrayado, resaltador o círculo. Si todo es importante, nada lo es.
5. **Usa las mismas palabras que se dicen.** Si la voz dice «alianza», la lámina no pone
   «partnership».
6. **Los términos propios van entre comillas** («Marketing de crecimiento») y la primera vez se
   subrayan.
7. **Las cifras siempre con número** y en la unidad que se dice: «$10k al mes», no «diez mil
   mensuales».
8. **Proyecciones al espectador.** Cuando la cuenta promete lo que ganará o conseguirá quien mira
   (dinero, clientes, ventas). No aplica al tamaño de un mercado ni a un dato publicado: ahí va `fuente`.
   - a) La condición concreta va en `arriba`, con número: «Si te escriben 20 personas al día:» o «Con 10
     mensajes diarios:». Nunca un «Supuesto:» vacío.
   - b) Las tasas y los resultados van en rango y en la unidad que se dice, como en la referencia
     [33:45-33:55]: arriba «For a creator with 50K-100K followers», abajo «100-250 sales × $100-200 =
     $10,000-$50,000». Si hay que dar un solo número, sale de la tasa baja.
   - c) Si el total subrayado sostiene la promesa del título, la voz dice el descargo en esa lámina o en el
     gancho, como la referencia [0:38]: «que yo tenga estos resultados no quiere decir que tú los tengas».
   QA avisa cuando una `cifra` subraya un total de dinero, % o clientes y `arriba` no trae número, y
   también cuando la cuenta no trae NINGÚN rango (§3.8 b).
9. **La nota de remate y el `foco` llevan un dato, una consecuencia concreta o una acción con objeto**
   (qué mandar, a quién, cuándo). Máximo una antítesis «No X, Y» por deck, y nada de cierre motivacional
   genérico («Todo empieza con…», «Mándalo hoy», «Esperar no es una estrategia»). Si la frase viene del
   guion hablado, corrígela en el guion y no solo en la lámina, para no romper la regla 5. Lista completa
   y pares antes/después en [VOZ-HUMANA.md](VOZ-HUMANA.md); QA avisa las fórmulas y las palabras de
   «Palabras que nunca usas» de MI-MARCA.

## 4. Cómo elegir el emoji

- **Literal antes que ingenioso**: dinero es 💰, tiempo es ⏳, no un emoji «creativo».
- **Uno protagonista por lámina de idea**, o un par antes/después (`["no:📚", "si:🤖"]`, con el
  negado atenuado) [10:55]. Si hacen falta dos juntos, es un emoji compuesto (`"🧑‍⚕️+💰"`); para
  una fila de conceptos, un `flujo` (con `flecha: "ninguna"` si no hay causa→efecto). Las láminas de
  datos (cifra, tabla, línea de tiempo, calendario, gráfica) no llevan emoji protagonista.
- **Revisa el contraste del emoji** (EMOJIS.md, «Bajo contraste»): en Fluent 💬 y ✉️ casi
  desaparecen sobre blanco; en Apple 🏷️ se pierde. QA lo avisa y propone el sustituto.
- **La negación se dibuja**: `"no:🎥"` en lugar de escribir «sin video».
- **Mismo concepto, mismo emoji** en todo el deck: si «producto» fue 📦, lo sigue siendo. Y al revés:
  **un emoji, un concepto**. No uses dos emojis que se ven casi iguales (🧑‍💼 y 👨‍💼, 📅 y 🗓️) para
  conceptos distintos.
- Diccionario completo en [EMOJIS.md](EMOJIS.md).

## 5. Ritmo y variedad

- **No repitas el mismo diseño 4 veces seguidas.** Alterna texto, proceso y dato.
- **Cada 3 o 4 láminas debe haber algo a mano**: subrayado, flecha, nota, tabla o sello. Es la
  firma del estilo.
- **La cámara es el respiro.** Tramos de unos 4 s, cada 30 a 60 s, en los momentos personales.
- **Las láminas oscuras son solo para revelar la marca o el producto.** Si aparecen antes, o se
  usan para el precio y la lista de lo que incluye, pierden su efecto.
- **Hay objetos que regresan**: la tabla-marcador y el mapa de pasos se repiten creciendo. Esa
  repetición le da estructura al video.

## 6. Arcos: el de la referencia y los de cada pieza

**Antes de escribir, decide la pieza y su duración** (reel, video, VSL, clase, webinar, propuesta):
cada una tiene su arco, su número de beats y su peso de oferta en **[ARCOS.md](ARCOS.md)**. Ponlas en
el deck (`"pieza"`, `"duracion_objetivo"`, `"en_vivo"`) y QA mide la voz contra el objetivo. Una
«clase» de 4 minutos no es una clase: es un resumen.

Estos son los grandes bloques del video de referencia (44:55), con su minuto aproximado. Es el arco
del **webinar o video largo**:

1. **Gancho** (0:00-2:30): ver §6.1. Presenta el sistema 1-2-3.
2. **Credibilidad** (2:30-3:20): quién habla, con logos y cifras.
3. **Criterios** (4:00-5:20): por qué la mayoría falla. Presenta 6 métricas.
4. **Comparación** (5:20-10:05): la tabla-marcador se llena modelo por modelo.
5. **Revelación** (10:10-12:30): «una sola solución cumple todo». Cuadrantes verdes y rojos.
6. **Por qué ahora** (11:10-16:30): la curva de crecimiento, la industria y la prueba.
7. **El sistema paso a paso** (16:35-34:00): el mapa 1-2-3 abre cada paso, con demostraciones.
8. **Objeciones** (34:20-36:00): «Razón #1», «Razón #2». Todas con la MISMA forma: `idea` con
   emoji negado, «Objeción #N» o «Razón #N» entre el emoji y la frase, la objeción en negrita; la
   respuesta en la lámina siguiente, y si hay contraste, pregunta → «Sí.» → «Pero…» en láminas de una
   frase [34:35-34:45]. Nunca dentro del encabezado de una lista ni pegada a un botón. De 2 a 3
   objeciones antes del precio.
9. **Oferta** (36:00-44:50, el 20% final): **ver §7, beat por beat.** En resumen: puente del dolor,
   credibilidad, ancla con el nivel caro, revelación oscura, componentes «#N» con su pregunta de sí,
   prueba real, stack que se llena, escasez real, llamado con qué pasa después, resumen y llamado otra
   vez, por qué ahora. Oscura SOLO la revelación de marca; todo lo demás en blanco con emoji.

### 6.1 Los primeros 10 segundos

- **Antes del segundo ~10 el espectador ya vio el resultado o el conflicto concreto.** Nada de saludo,
  «bienvenido», presentación personal ni el título de la clase («Cómo…») como primera lámina. La
  bienvenida y el «quién soy» van después de la primera prueba: en la referencia el nombre llega en 1:26.
- Aperturas que sirven:
  - una escena concreta con hora y lugar: «11:40 pm. Alguien quiere comprarte…»;
  - el resultado más «sin…» [0:10-0:19];
  - el error en vivo: el chat que se queda en visto;
  - un dato contraintuitivo.
- Se permite una tesis breve antes, como el «We are entering a new era» de la referencia [0:00-0:10],
  siempre que el resultado llegue en 10 s o menos.
- En un reel (menos de 60 s) el conflicto concreto va en la lámina 1, no después del mapa.
- Los beats de retención de la referencia entre 0:00 y 2:30, con su minuto:
  | Beat | Minuto | En la lámina |
  |---|---|---|
  | resultado + «sin…» | 0:10-0:19 | `idea` + `lista` «Sin:» |
  | llamado a quién es («si hiciste clic es porque…») | 0:26 | `idea` + `clic` |
  | mecanismo con nombre («Market Gap») | 0:31 | `idea` con el término entre comillas |
  | prueba rápida y descargo de resultados | 0:35-0:40 | `prueba` + la voz: «que yo los tenga no quiere decir que tú los tengas» |
  | quién habla | 1:26 | `camara` o `idea` |
  | contrato de tiempo («los próximos 33 minutos») | 2:03 | `objeto` (reloj) o `cifra` |
  | filtro («si no tienes 33 minutos…») | 2:05 | `idea` |
  | regalo por quedarse hasta el final | 2:12 | `idea` 🎁 |
- QA avisa si hay cámara antes del segundo 10, saludo en las dos primeras láminas o una primera lámina
  que empieza con «Cómo» o «Aprende a».

## 7. La oferta, beat por beat (referencia 36:00-44:50)

La regla de fondo: **oscura SOLO en la revelación de la marca o el producto** (36:15-37:55 y 43:00).
Todo lo demás va en lámina **blanca con emoji**, con la capa a mano de siempre: la lista «They will:»,
las preguntas 🤔, los «#4» y «#5», la lista de espera y el «2 minutes» son blancos. La oferta escala con
la pieza (ARCOS.md): un reel no lleva oferta y una clase solo un puente al siguiente paso. **Todo dato es
real**: si no hay cifra de credibilidad, prueba o escasez real, el beat se omite; nunca se inventa.

| # | Beat | Minuto | Diseño |
|---|---|---|---|
| 1 | Puente del dolor a la solución («te sientes perdido») | 35:45-36:05 | `objeto` (foto real) o `idea` |
| 2 | Credibilidad con cifra y años («desde 2016, más de 23,000 clientes») | 36:10 | `prueba` u `objeto` con foto real |
| 3 | Ancla con tu nivel caro real («Quantum… desde $25,000»), opcional | 36:30-36:40 | `cifra` |
| 4 | Revelación del producto, en 1 paso | 36:15-37:55, 43:00 | `oscura` |
| 5 | Componentes numerados «#N». Cada uno se desarrolla en su lámina (`lista` que crece como «They will:», `calendario` o `boton`) y cierra con una pregunta de sí 🤔 («¿Ves cómo…?») | 40:15-41:40 | `idea` + `lista` / `calendario` / `boton` |
| 6 | Prueba real: el muro de capturas | 42:00 | `prueba` |
| 7 | El stack que se llena pieza por pieza | 42:30-42:45 | `stack`, `tarjetas` o `rejilla` |
| 8 | Escasez, solo si es real: inscritos contra lista de espera, cupos, meses de espera | 43:00-43:30 | `rejilla` + `destacado_paso` |
| 9 | Llamado con qué pasa después: flecha roja al link, cuánto tarda («2 minutos»), qué pasa luego (la invitación del calendario) y la salida honesta «si no es para ti, te orientamos» | 43:35-44:10 | `prueba` / `boton` + `idea` ⏱️ + `calendario` + `idea` 🤝 |
| 10 | Resumen del stack y el llamado otra vez | 44:20-44:30 | `lista` + `boton` o `prueba` |
| 11 | Por qué ahora y cierre de identidad, luego a cámara | 44:35-44:45 | `idea`, después `camara` |

- **El llamado aparece al menos 2 veces** (beats 9 y 10), **a la vista**: un `boton`, la palabra clave o
  la flecha al link (`llamado: true` marca esa lámina). Que la voz diga «WhatsApp» o «aparta» no es un
  llamado, y el que va solo en la voz de la cámara final tampoco cuenta. En un webinar, 3 si hay un llamado
  temprano.
- **Precio, formas de pago y garantía NO están en la referencia**: su llamado es aplicar y agendar una
  llamada, y el único precio es el ancla del nivel caro. Se agregan solo si la oferta tiene precio
  público: el precio con `cifra` (el ancla es algo real que el público ya vio, nunca un «Valor»
  inventado; el tachado es opcional) y la garantía en una `idea` 🛡️ con plazo, **condición medible** y
  cómo se reclama. Los datos que falten van con `{{PRECIO}}` en el texto y `"datos"` en el deck
  (LAYOUTS.md, «Datos que se llenan una vez»): QA los lista como pendientes.
