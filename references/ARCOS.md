# Arcos por pieza: cuánto dura y cómo se reparte

El video de referencia dura 44:55. Su arco (GUION-A-LAMINAS §6) es el de un webinar o video largo, y
**no se comprime**: una «clase» de 4 minutos no es una clase, es un resumen. Antes de escribir decide la
pieza y su duración: se deducen del pedido («la clase del lunes» = clase de 40-60 min, «un reel» =
30-60 s). Si no se pueden deducir, es la única pregunta.

## La regla de cálculo (sale de la referencia, no se inventa)

| Medida | Valor | De dónde sale |
|---|---|---|
| Ritmo de voz | 2.7 palabras por segundo (~160 por minuto) | la transcripción: ~7,000 palabras en 44:55 (`RITMO` en `scripts/lib/tiempos.mjs`) |
| Un beat (un paso) | 2 a 3 s; mediana 2.9 s | ANATOMIA, cambios visuales |
| Pasos por lámina | ~2.2 en promedio | el demo y la referencia |
| Lámina antes de cortar a cámara | mediana 9 s | ANATOMIA |
| Tiempo a cámara | ~12% | ANATOMIA |

**Cada paso sigue siendo un beat de 2 a 3 s en todas las piezas.** Lo que cambia es cuántos beats
lleva. En vivo, el orador avanza a mano (→) y su `voz` es la nota de ese beat: puede ampliarla un poco,
pero no se convierte cada paso en un bloque de 150 palabras, porque la lámina se quedaría quieta
medio minuto y se perdería el revelado frase por frase.

**Tramos en vivo sin láminas** (una demostración en pantalla, una actividad, preguntas): van como una
lámina `camara` con `"vivo": true`, la consigna en `texto` (y sus pasos en `items`) y `dur` en segundos
(`"dur": 300` = 5 minutos). En el presentador el público ve la consigna en blanco con una cuenta regresiva;
en el montaje sigue siendo un tramo a cámara (LAYOUTS.md, `camara`). Así cuentan en la duración sin inventar
beats, pero **no sustituyen beats**: una clase o un taller necesita sus beats aunque sume minutos con `dur`.
Más de 40% del tiempo en tramos avisa, y más de 60% con las láminas bajo la mitad de lo que toca es error,
también en vivo.

## Tabla por pieza

| Pieza (`"pieza"`) | Duración | Voz escrita | Beats | Láminas | Oferta | Llamado |
|---|---|---|---|---|---|---|
| `reel` | 30-60 s | 80-160 palabras | 12-20 | 8-12 | ninguna, sin oscuras | 1: guardar o comentar una palabra |
| `video` (YouTube) | 8-20 min | 1,300-3,200 | 170-410 | 75-190 | puente suave o ninguna | 1-2 |
| `vsl` | 8-20 min | 1,300-3,200 | 170-410 | 75-190 | el 25-30% final (GUION §7) | 2 o más |
| `clase` (en vivo) | 40-60 min | el guion completo en beats, más tramos en vivo con `dur` | 500-900 + tramos | 220-400 | sin oscuras; puente al siguiente paso | al final: comunidad, próxima clase o invitación suave |
| `webinar` | 60-90 min | el arco completo de la referencia, estirado | 1,000-1,600 + tramos | 450-700 | ~20% final, oscura solo la revelación | 3 o más |
| `propuesta` | 5-20 min | 800-3,200 | 100-400 | 45-180 | inversión + siguiente paso | 1 |
| `tutorial` | 3-8 min | 500-1,300 | 60-160 | 25-70 | ninguna | 1 |
| `vsl-corto` | 3-6 min | 480-970 | 60-125 | 25-55 | desde el 55-60%, 1 objeción antes | 2 |
| `clase-corta` (taller) | 15-30 min | el guion en beats, más tramos en vivo con `dur` | 200-450 + tramos | 90-200 | sin oscuras; puente al siguiente paso | al final |

`tutorial`, `vsl-corto` y `clase-corta` son arcos propios de piezas cortas, no el arco largo comprimido: un VSL
de 5 min no puede dejar la oferta para el 25% final, porque no le queda espacio para gancho, problema,
mecanismo y prueba. Si el encargo fija el número de láminas («18-30 láminas»), estima la duración antes de
escribir con **~6.5-9.5 s por lámina** (2.2 pasos × 2.9 s por lo bajo; el VSL de 30 láminas midió 4:41, ~9.4 s)
y escoge la pieza cuyo rango la contiene en vez de forzar el objetivo sobre una pieza larga. La duración real
la mide QA con la voz.

`"duracion_objetivo"` (minutos o `"mm:ss"`) manda sobre el rango de la tabla. QA estima la duración con
la voz (y los `dur`) y:

- da **error** si las LÁMINAS cubren menos de la mitad de su objetivo o del mínimo de su pieza (los
  tramos `camara` no cuentan para esto; con `"en_vivo": true` baja a aviso);
- da **aviso** si la voz total se aleja más de 30% del objetivo, si el objetivo cae fuera del rango de su
  pieza (una «clase» de 3 min es un `tutorial`; una de 25, una `clase-corta`), si más de 40% es cámara o
  tramos en vivo (la referencia va ~12%), si un reel pasa de 60 s o si la oferta de un VSL corto empieza
  después del 70%;
- da **error** si más de 60% son tramos en vivo y las láminas no cubren la mitad de lo que toca, aunque sea
  `en_vivo`: el deck es mayormente tramos sin lámina;
- avisa si una clase, VSL o webinar termina sin llamado visible o siguiente paso, si una clase o un reel
  llevan láminas oscuras, o si un VSL o webinar tiene menos de 2 llamados VISIBLES (botón, palabra clave o
  `llamado: true`; una palabra suelta en la voz no cuenta);
- en `vsl`, `vsl-corto` y `webinar`, avisa si no hay ninguna objeción («Objeción #N» o «Razón #N») antes del
  llamado de la oferta, si no hay ninguna prueba real o la única es una maqueta, y si antes de la revelación no
  aparece una cifra de credibilidad (GUION §7).
- `qa.json → duracion` trae la voz total y, aparte, `laminas` y `camara`.

## Las plantillas

Minutos por bloque. Cada bloque abre, si toca, con el mapa 1-2-3 (`pasos` con `activo`).

### Reel (30-60 s)
1. **Gancho de conflicto** (0-3 s): el conflicto concreto en la lámina 1 (el chat en visto, el número).
2. **Mapa o 3 beats** (3-45 s): los 3 errores o los 3 pasos, uno por lámina.
3. **Un solo llamado** (últimos 5 s): guardar 📌 o comentar una palabra 💬.

### Video de YouTube (8-20 min)
1. Gancho con los beats de retención de GUION §6.1 (0:00-1:30).
2. Credibilidad corta (≤ 1 min).
3. El problema y por qué falla la mayoría (2-4 min).
4. El mecanismo o el sistema 1-2-3, con demostración (4-10 min).
5. Prueba (1-2 min).
6. Cierre con un siguiente paso concreto.

### VSL (8-20 min)
1. Gancho (≤ 1 min) y credibilidad (≤ 1 min, con cifra real: años, clientes, eventos).
2. Problema y costo de no hacer nada (2-3 min).
3. Mecanismo con nombre (2-4 min).
4. Prueba real (1-2 min), o un sustituto de GUION §7 («Sin prueba real, en este orden»).
5. **Objeciones o razones antes de la oferta**: 2 si el VSL dura 8 min o más. Con la forma de GUION §2: `idea`
   con emoji negado, «Objeción #N» o «Razón #N» entre el emoji y la frase y la objeción en negrita; la
   respuesta va en la lámina siguiente, con un dato real o un paso concreto. Nunca pegada al botón. Salen del
   público real, no se inventan [34:17-36:00].
6. Oferta en el 25-30% final, beat por beat (GUION §7), con el llamado 2 veces o más.

### Clase en vivo (40-60 min)
1. Gancho (≤ 2 min, GUION §6.1) y **contrato de tiempo**: qué se van a llevar en esta hora.
2. Mapa 1-2-3 de la clase.
3. **Tres bloques** de 10-15 min. Cada uno abre con el mapa, explica en beats, hace una demostración
   en vivo (`camara` con `vivo: true` y `dur`) y regresa al mapa.
4. **Tarea**: qué hacer hoy, con objeto (qué mandar, a quién).
5. **Puente al siguiente paso**: la comunidad, la próxima clase o una invitación suave. Sin láminas oscuras.

### Webinar (60-90 min)
El arco completo de la referencia (GUION §6), estirado, con dos bloques más:
1. Gancho (≤ 2:30) y credibilidad.
2. **Para quién es y para quién no** (filtro, 1-2 min).
3. Criterios, comparación y revelación.
4. El sistema paso a paso, con demostraciones.
5. Objeciones (2-3).
6. Oferta en el ~20% final, beat por beat (GUION §7). Oscura solo la revelación; el llamado aparece 3
   veces o más.

### Tutorial (3-8 min)
1. El resultado a la vista en los primeros 10 s, o el error en vivo.
2. El mapa 1-2-3 si son 3 pasos o más.
3. Los pasos, uno por bloque, cada uno con su demostración (captura real o `camara` corta).
4. Los errores comunes (una `lista` con tachones o una `idea` por error).
5. Un siguiente paso concreto, con objeto (1 llamado).

### VSL corto (3-6 min)
1. Gancho con el resultado o el conflicto (0:00-0:20).
2. Problema y costo de no hacer nada (0:20-1:00).
3. Mecanismo con nombre (1:00-2:30): el qué, no el cómo completo.
4. Prueba real o su sustituto (2:30-3:00).
5. Oferta desde el 55-60%, beat por beat (GUION §7, comprimido): revelación, qué incluye, qué pasa después
   del clic y el llamado; **1 objeción** antes del último llamado; el llamado otra vez al final (2 llamados
   visibles). QA avisa si la oferta arranca después del 70%.

### Clase corta o taller (15-30 min)
1. Gancho (≤ 1 min), contrato de tiempo y mapa 1-2-3.
2. **Dos bloques** en vez de tres, cada uno en beats con su demostración o actividad en vivo (`camara` con
   `vivo: true`).
3. Tarea con objeto y puente al siguiente paso. Sin láminas oscuras.

### Propuesta
1. Diagnóstico: dónde está hoy, con sus números.
2. Costo de no hacer nada.
3. La solución y cómo funciona.
4. Alcance: qué incluye y qué no.
5. Inversión (con `{{PRECIO}}` si aún no está cerrada).
6. Siguiente paso con fecha.
