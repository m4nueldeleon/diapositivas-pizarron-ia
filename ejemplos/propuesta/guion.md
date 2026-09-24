# Propuesta de capacitación — ejemplo (propuesta corta, en vivo)

Modelo que se copia para una `propuesta` (`deck.json` en esta carpeta). Sigue los **9 bloques** de ARCOS.md
(«Propuesta»). Copia el arco y la forma de cada bloque, no las cifras: los números del cliente salen de la llamada de
diagnóstico y, mientras no estén, van como huecos declarados en `"datos"` (`{ "pendiente": true, "motivo": "…" }`).
QA deja el deck en BORRADOR y los lista al entregar. **Nunca «Pongamos que cada vendedor pierde…»**: esa excepción
(GUION §3.8 d) es para clases y VSL.

- Trato: `persona: "ustedes"` en pantalla y voz; el chat de vendedor a cliente conserva `excepcion_persona: "uno-a-uno"`.
- Pieza: `propuesta` con `"en_vivo": true` (se presenta en la junta y se conversa). Sin regla de 2 llamados ni de
  objeciones: las objeciones se conversan en vivo.
- Se reenvía a quien no estuvo en la junta: `render.mjs --finales --pdf` da `laminas-notas.pdf` con la voz.
- Si la propuesta va con la marca del cliente, `"marca": false`.

| # | Bloque (ARCOS.md) | Láminas | Qué enseña |
|---|---|---|---|
| — | Portada y temario | 1-2 | el nombre del cliente desde `{{CLIENTE}}` y los tres temas de la junta |
| 1 | **Diagnóstico con sus números** | 3-5 | `cifra` con `fuente: "Llamada de diagnóstico"` y los números como `{{…}}`; el dolor con sus palabras |
| 2 | **Costo de no hacer nada** | 6-7 | `{{HORAS_MES}} h × {{COSTO_HORA}}`: el ancla de la inversión, en la misma unidad y periodo |
| 3 | Solución y cómo funciona | 8-14 | el mapa 1-2-3 que vuelve con `como` y el titular de su bloque en `texto` (un regreso vacío tras una o dos láminas es un vaivén: ARCOS «Las plantillas»), la demostración en `chat`, el `flujo` y lo que se mide (`tarjetas`) |
| 4 | **Quién la imparte y un caso** | 15-16 | «Más de {{EMPRESAS}} empresas desde {{DESDE}}» y un caso parecido con `fuente` ({{FUENTE_CASO}}) |
| 5 | Metas medibles | 17-18 | de {{HOY}} a {{META}}, medido en la semana 4, y la `linea-tiempo` de 8 semanas |
| 6 | **Alcance** | 19-20 | `lista` «Incluye:» y `lista` «No incluye:» (evita el malentendido al firmar) |
| 7 | **Inversión anclada** | 21 | `cifra`: el costo de no hacer nada arriba, chico y gris; `{{PRECIO}}` grande |
| 8 | Condición de salida | 22 | 🛡️ con la semana y la condición medible («si no hay avance, cancelan») |
| 9 | **Siguiente paso con fecha y vigencia** | 23-25 | la pregunta 🤔 para conversar, el `flujo` Firman → Agendamos → Arrancamos con `"llamado": true` y la fecha con «Vigente hasta {{VIGENCIA}}» |

Antes de mandarla: llena los datos en `"datos"` y corre `node scripts/qa.mjs ejemplos/propuesta --estricto`.
