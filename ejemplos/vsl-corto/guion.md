# Agenda Llena — VSL corto de ejemplo (3-6 min)

Modelo que se copia para un VSL, un webinar o cualquier oferta (`deck.json` en esta carpeta). El demo
(`ejemplos/demo/`) es el catálogo de diseños; este es el **guion**. Copia el arco y la forma de cada beat, no las
cifras: los datos que nadie ha confirmado van como huecos declarados en `"datos"`
(`{ "pendiente": true, "motivo": "…" }`), así QA lo deja en BORRADOR y los lista al entregar.

- Pieza: `vsl-corto` (ARCOS.md): oferta desde el 55-60%, 1 objeción antes del último llamado, el llamado 2 veces.
- Set de emojis fijado: `"emoji": "apple"` (se exporta en Mac). Animación `seco`, como la referencia.
- Sin firma (`marca`): la toma de tu ficha MI-MARCA.md si existe (SKILL §0.4).

| # | Beat (GUION §6.1 y §7) | Láminas | Qué enseña |
|---|---|---|---|
| 1 | **Gancho con conflicto antes del segundo 10** | 1 `chat` | la hora de los dos extremos y el sello pegado a la burbuja culpable: se entiende sin sonido |
| 2 | Problema y costo de no hacer nada | 2-5 | `idea` negada, `cifra` con la condición en `arriba` y rangos (GUION §3.8), `lista` «Lo que ya intentaste:» y el dolor 😩 |
| 3 | **Credibilidad antes de la revelación** | 6-7 | «Más de {{CLIENTES}} negocios»: el lugar de la cifra real, pendiente hasta que la dé quien vende; y el filtro «Es para ti si:» |
| 4 | Mecanismo con nombre | 8-17 | el término entre comillas y subrayado, el mapa 1-2-3 que vuelve con ✅, y cada paso demostrado (`chat`, `idea`, `flujo`) |
| 5 | **Prueba**: sustituto b) de GUION §7 | 18 `cifra` | un caso con números y `fuente` ({{CASO_…}}, {{FUENTE_CASO}}); nunca una maqueta `ejemplo: true` |
| 6 | Llamado 1 (después de la prueba) | 19 | verbo + palabra clave marcada («Escríbeme **CITA** por WhatsApp») y `"llamado": true` |
| 7 | **Objeción #1 y su respuesta en la lámina siguiente** | 20-21 | `idea` con el emoji de lo que dice que le falta, negado (`no:⌨️`), «Objeción #1» entre el emoji y la frase; la respuesta da un paso concreto |
| 8 | Revelación | 22 `oscura` | la ÚNICA oscura: nombre y una frase |
| 9 | Stack + bono | 23 `stack` | sustantivos de 2-4 palabras, el bono al final con `sub: "Bono #1"` y `{{BONO_1}}`, el «Hecho contigo» en su propio corte |
| 10 | Pregunta de sí | 24 | 🤔 «¿Ves cómo…?» |
| 11 | Precio anclado | 25 `cifra` | el ancla es algo real que el público ya paga ({{PRECIO_ANCLA}}), chica y gris; el precio grande |
| 12 | **Garantía con plazo y condición** | 26-27 | 🛡️ «{{GARANTIA_DIAS}} días» + «Si {{GARANTIA_CONDICION}}…», y `pasos` con cómo se reclama |
| 13 | Llamado 2 con qué pasa después del clic | 28-29 | `boton` + `flujo` Aplicas → Llamada → Arrancas |
| 14 | Por qué ahora y llamado final | 30-31 | la consecuencia concreta de esperar y la palabra clave otra vez |

Sin escasez: solo va si es real, desde `{{CUPOS}}` o `{{FECHA_LIMITE}}` (GUION §7, beat 8). «Solo hoy» o «Quedan
solo 3 lugares» escritos a mano son error de QA.

Antes de entregar: llena los datos en `"datos"`, quita `"propuesto"` al nombre del producto y corre
`node scripts/qa.mjs ejemplos/vsl-corto --estricto`.
