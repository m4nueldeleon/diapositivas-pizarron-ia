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
| un cálculo | la ecuación línea por línea, con el total subrayado | `cifra` |
| un número que impresiona | el número solo, enorme | `cifra` con una línea |
| «tendrías que vender 500» | 500 emojis en rejilla + nota «Son 500» + sello | `rejilla` |
| un porcentaje | 100 puntos, unos de otro color | `rejilla` + `punto` |
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
| lo que incluye la oferta | bento que se llena pieza por pieza [42:30] | `stack` |
| el precio | ancla real chica y gris → precio grande (una línea por paso) | `cifra` con líneas-objeto |
| cupos o lista de espera | rejilla con el color de los ocupados en un paso posterior + la fuente | `rejilla` + `destacado_paso` |
| antes / después | en UNA lámina: bloques rojo y verde, o el par de emojis | `cuadrantes` o `idea` con par |
| una fila de conceptos sin causa→efecto | nodos numerados sin flechas [19:15] | `flujo` + `flecha: "ninguna"` |
| una frase textual de alguien | letra manuscrita + flecha | `cita` |
| una idea que resume la anterior | atenuar la anterior + nota encima | `foco` |
| la revelación del producto o la marca | lámina oscura (nombre, logo, una frase) | `oscura` |
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

## 4. Cómo elegir el emoji

- **Literal antes que ingenioso**: dinero es 💰, tiempo es ⏳, no un emoji «creativo».
- **Uno protagonista por lámina de idea**, o un par antes/después (`["no:📚", "si:🤖"]`, con el
  negado atenuado) [10:55]. Si hacen falta dos juntos, es un emoji compuesto (`"🧑‍⚕️+💰"`); para
  una fila de conceptos, un `flujo` (con `flecha: "ninguna"` si no hay causa→efecto). Las láminas de
  datos (cifra, tabla, línea de tiempo, calendario, gráfica) no llevan emoji protagonista.
- **Revisa el contraste del emoji** (EMOJIS.md, «Bajo contraste»): en Fluent 💬 y ✉️ casi
  desaparecen sobre blanco; en Apple 🏷️ se pierde. QA lo avisa y propone el sustituto.
- **La negación se dibuja**: `"no:🎥"` en lugar de escribir «sin video».
- **Mismo concepto, mismo emoji** en todo el deck: si «producto» fue 📦, lo sigue siendo.
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

## 6. Arco narrativo que usa la referencia

Estos son los grandes bloques del video de referencia, con su minuto aproximado:

1. **Gancho** (0:00-2:30): promesa, «sin…» y prueba rápida con capturas. Presenta el sistema
   1-2-3.
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
9. **Oferta** (36:00-44:50): revelaciones oscuras (36:15, 37:40, 37:50, 43:00) y todo lo demás en
   blanco (38:10, 38:15, 38:25, 39:30, 40:15-40:45, 42:15-42:25):
   - **Lo que incluye**: `stack`, pieza por pieza, con logos reales si los hay.
   - **Precio**: el ancla es algo real que el público ya vio: la columna cara de la tabla-marcador,
     un sueldo, el costo de no hacer nada o tu nivel superior real (36:30-36:40: primero el nivel
     caro con su «desde $X», luego el producto). Nunca un «Valor» inventado; el precio tachado es
     opcional y la referencia no lo usa.
   - **Escasez**: solo si es real, con su fuente (43:15-43:20).
   - **Garantía**: plazo + condición medible + cómo se reclama, en una `idea`.
   - **Llamado**: una serie de láminas de UNA idea (43:30-44:10): ⏳ espera → `prueba` con flecha al
     link → ⏱️ cuánto tarda → 🔍 qué pasa después → 🤝 «si no es para ti, te orientamos».

Úsalo como plantilla para clases, VSL o webinars.
