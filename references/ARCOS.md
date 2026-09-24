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
lámina `camara` con su `nota` y `dur` en segundos (`"dur": 300` = 5 minutos). Así cuentan en la
duración sin inventar beats.

## Tabla por pieza

| Pieza (`"pieza"`) | Duración | Voz escrita | Beats | Láminas | Oferta | Llamado |
|---|---|---|---|---|---|---|
| `reel` | 30-60 s | 80-160 palabras | 12-20 | 8-12 | ninguna, sin oscuras | 1: guardar o comentar una palabra |
| `video` (YouTube) | 8-20 min | 1,300-3,200 | 170-410 | 75-190 | puente suave o ninguna | 1-2 |
| `vsl` | 8-20 min | 1,300-3,200 | 170-410 | 75-190 | el 25-30% final (GUION §7) | 2 o más |
| `clase` (en vivo) | 40-60 min | el guion completo en beats, más tramos en vivo con `dur` | 500-900 + tramos | 220-400 | sin oscuras; puente al siguiente paso | al final: comunidad, próxima clase o invitación suave |
| `webinar` | 60-90 min | el arco completo de la referencia, estirado | 1,000-1,600 + tramos | 450-700 | ~20% final, oscura solo la revelación | 3 o más |
| `propuesta` | 5-20 min | 800-3,200 | 100-400 | 45-180 | inversión + siguiente paso | 1 |

`"duracion_objetivo"` (minutos o `"mm:ss"`) manda sobre el rango de la tabla. QA estima la duración con
la voz (y los `dur`) y:

- da **error** si el deck dura menos de la mitad de su objetivo o del mínimo de su pieza (con
  `"en_vivo": true` baja a aviso);
- da **aviso** si se aleja más de 30% del objetivo, o si un reel pasa de 60 s;
- avisa si una clase, VSL o webinar termina sin llamado o siguiente paso, si una clase o un reel llevan
  láminas oscuras, o si un VSL o webinar tiene menos de 2 llamados.

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
1. Gancho (≤ 1 min) y credibilidad (≤ 1 min).
2. Problema y costo de no hacer nada (2-3 min).
3. Mecanismo con nombre (2-4 min).
4. Prueba real (1-2 min).
5. Oferta en el 25-30% final, beat por beat (GUION §7), con el llamado 2 veces o más.

### Clase en vivo (40-60 min)
1. Gancho (≤ 2 min, GUION §6.1) y **contrato de tiempo**: qué se van a llevar en esta hora.
2. Mapa 1-2-3 de la clase.
3. **Tres bloques** de 10-15 min. Cada uno abre con el mapa, explica en beats, hace una demostración
   en vivo (`camara` con `dur`) y regresa al mapa.
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

### Propuesta
1. Diagnóstico: dónde está hoy, con sus números.
2. Costo de no hacer nada.
3. La solución y cómo funciona.
4. Alcance: qué incluye y qué no.
5. Inversión (con `{{PRECIO}}` si aún no está cerrada).
6. Siguiente paso con fecha.
