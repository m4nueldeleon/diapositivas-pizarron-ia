# Agenda Llena — VSL corto de ejemplo (3-6 min)

Modelo que se copia para un `vsl`, un `vsl-corto` o un `webinar` (`deck.json` en esta carpeta). El demo
(`ejemplos/demo/`) es el catálogo de diseños; este es el **guion**. Copia el arco y la forma de cada beat, no las
cifras: los datos que nadie ha confirmado van como huecos declarados en `"datos"`
(`{ "pendiente": true, "motivo": "…" }`), así QA lo deja en BORRADOR y los lista al entregar.

- Pieza: `vsl-corto` (ARCOS.md): promesa y mecanismo antes del segundo 25, revelación al ~60%, 1 objeción antes de la
  revelación y el mismo llamado dos veces, los dos después de la revelación (GUION §7, «El orden en un `vsl`»).
- Set de emojis fijado: `"emoji": "apple"` (se exporta en Mac). Animación `seco`, como la referencia.
- Sin firma (`marca`): la toma de tu ficha MI-MARCA.md si existe (SKILL §0.4).
- Ficha de venta (SKILL, fase 1): dueños de negocios de citas que contestan WhatsApp de noche · citas agendadas toda
  la noche sin contestar tú · «Agenda en automático» · un caso real ({{CASO_…}}, pendiente) · «No sé nada de
  tecnología» (propuesta) · un solo llamado: el botón «Aplica aquí».

| # | Beat (GUION §6.1 y §7) | Láminas | Qué enseña |
|---|---|---|---|
| 1 | **Gancho con conflicto antes del segundo 10** | 1 `chat` | la hora de los dos extremos y el sello pegado a la burbuja culpable: se entiende sin sonido |
| 2 | **Promesa con su «sin…» (0:09-0:21)** | 2-3 | `idea` con el resultado y `lista` «Sin:» [0:10-0:19] |
| 3 | **Mecanismo con nombre, de pasada (0:21)** | 4 | el término entre «comillas» y __subrayado__: «ahorita te enseño cómo funciona» [0:23] |
| 4 | Filtro y credibilidad (0:26-0:41) | 5-6 | «Es para ti si:» y «Más de {{CLIENTES}} negocios»: el lugar de la cifra real, pendiente hasta que la dé quien vende |
| 5 | Problema y costo de no hacer nada, DESPUÉS de la promesa | 7-10 | `idea` negada, `cifra` con la condición en `arriba` y la tasa como {{TASA_…}} (GUION §3.8), «Lo que ya intentaste:» y el dolor 😩 |
| 6 | Cómo funciona: el mapa 1-2-3 | 11-16 | el mapa que vuelve con `como` y ✅, y cada paso demostrado (`chat`, `idea`) |
| 7 | **Objeción #1 y su respuesta, antes de la revelación** | 17-18 | `idea` con `no:⌨️` y «Objeción #1» entre el emoji y la frase; la objeción es `{{OBJECION_1}}` propuesta, dicha sin frecuencia («Objeción número uno: …»); la respuesta da un paso concreto |
| 8 | **Revelación al 60%** | 19 `oscura` | la ÚNICA oscura: nombre y una frase |
| 9 | Qué incluye | 20-22 | `stack` con el bono al final (`sub: "Bono #1"`, `{{BONO_1}}`), un componente desarrollado y la pregunta de sí 🤔 |
| 10 | **Prueba**: sustituto b) de GUION §7 | 23 `cifra` | un caso con números y `fuente` ({{CASO_…}}, {{FUENTE_CASO}}); nunca una maqueta `ejemplo: true` |
| 11 | Precio anclado y garantía | 24-26 | el ancla es algo real que el público ya paga; 🛡️ con plazo y condición, y `pasos` con cómo se reclama |
| 12 | **Llamado 1 con qué pasa después del clic** | 27-28 | `boton` «Aplica aquí» (📝: el cursor ya es la mano) + `flujo` ✍️ Aplicas → 📞 Llamada → 🚀 Arrancas |
| 13 | Resumen y por qué ahora | 29-30 | `lista` «Te llevas:» y la consecuencia concreta de esperar |
| 14 | **Llamado 2, el mismo botón** | 31 `boton` | una sola acción en toda la pieza: nada de mezclar el botón con «escríbeme CITA por WhatsApp» |

Sin escasez: solo va si es real, desde `{{CUPOS}}` o `{{FECHA_LIMITE}}` (GUION §7, beat 8). «Solo hoy» o «Quedan
solo 3 lugares» escritos a mano son error de QA.

Antes de entregar: llena los datos en `"datos"`, quita `"propuesto"` al nombre del producto y corre
`node scripts/qa.mjs ejemplos/vsl-corto --estricto`.
