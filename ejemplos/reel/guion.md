# 3 tareas que ya puedes delegar a la IA — reel de ejemplo (9:16, ~55 s)

Modelo que se copia para un **reel de «cómo»** (`deck.json` en esta carpeta). El demo es el catálogo de diseños; este
es el guion. Un reel que promete tareas, pasos o un «puedes…» enseña algo que se puede hacer **a la vista**: si no, «Guarda
este reel» no guarda nada (ARCOS §Reel; QA lo avisa y el deck no sale `listo`).

- Pieza `reel`, `"formato": "9:16"`, 11 láminas, ~130 palabras de voz: 30-60 s (ARCOS.md).
- Sin oscuras, sin oferta y un solo llamado al final.
- Sin firma (`marca`): la toma de tu ficha MI-MARCA.md si existe (SKILL §0.4).

| # | Beat | Láminas | Qué enseña |
|---|---|---|---|
| 1 | **Gancho con hora y conflicto** | 1 `idea` | «11 pm y sigues en el correo» + la nota que aprieta («Y mañana, junta a las 8»): se entiende sin sonido |
| 2 | **El mapa entra UNA vez, ya en la tarea 1** | 2 `pasos` | `activo: 1` desde el principio y la promesa en su `texto`. Nunca el mapa completo y luego el mismo con `activo: 1`: es la misma lámina dos veces (QA lo avisa) |
| 3 | Tarea 1: qué se hace | 3 `flujo` | 🎤+🔴 → 🤖 → 📝, con la condición legal EN PANTALLA («con permiso de todos», `sub` del nodo), no solo en la voz |
| 4 | Tarea 1: **el prompt literal** | 4 `chat` | el mensaje `de: "yo"` es la instrucción corta que se copia («Resume esta junta en una tabla…»): esto es lo que se guarda |
| 5 | Tarea 2 | 5-7 | el mapa vuelve con el titular del bloque en `texto` («La IA ordena tu bandeja»), `tarjetas` en una columna (9:16) con 🚨 urgente, 🧑‍🤝‍🧑 equipo y 🗄️ archivo (🗑️ sería «a la basura») y su prompt |
| 6 | Tarea 3 | 8-9 | el mapa con ✅ en las dos anteriores y el prompt del reporte |
| 7 | Remate con acción | 10 `foco` | «Esta semana delega solo una: la minuta» |
| 8 | **Pago del gancho y un solo llamado** | 11 `idea`, `como` + `paga` | Vuelve la bandeja 📥 del gancho, ahora con la palomita (`si:📥`): «11 pm y ya cerraste el correo». La nota pide guardar los tres prompts; `llamado: true` conserva un solo llamado. |

Si nombras una herramienta (ChatGPT, Claude, Gmail), va su logo real como `imagen` o un hueco declarado: nunca un emoji
en lugar de la marca (SKILL, regla 10). Aquí se dice «tu IA» a propósito.

Antes de entregar: `node scripts/render.mjs ejemplos/reel --qa`.
