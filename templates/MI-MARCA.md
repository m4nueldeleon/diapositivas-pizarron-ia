# MI-MARCA — ficha para Diapositivas Pizarrón IA

Llénalo una vez. Claude, render y QA lo buscan en este orden y usan el primero que exista: la carpeta del deck →
la de arriba → `$PIZARRON_MARCA` → `~/.config/diapositivas-pizarron-ia/MI-MARCA.md` (la ficha global que crea
`bash scripts/setup.sh`: con ella todos tus decks salen con tu firma).

## Firma (abajo a la derecha, en cada lámina)
Déjala vacía si no tienes marca: las láminas saldrán sin firma. **Nunca pongas un valor de ejemplo.**
- Texto (tu @ o tu dominio): 
- Sufijo chico (opcional): 
- Logo (opcional, reemplaza al texto; un PNG sin fondo de unos 58 px de alto, en `assets/`): 

Desde Claude Code (sin terminal interactiva): `bash scripts/setup.sh --solo-ficha --firma "@tu_arroba"` la crea.

## Puente de clases (lo repites en cada clase: se escribe una vez)
Llena `{{COMUNIDAD}}` y `{{PROXIMA_CLASE}}` por omisión en el puente de tus clases (render y QA dicen «tomada de …»). Un
dato que el deck ya trae, o que declara pendiente con su valor, no se pisa. Si una clase es otro día, ponlo en `"datos"`.
- Comunidad (nombre, palabra clave o link): 
- Próxima clase (día y hora, p. ej. cada lunes 8 pm): 

## Valores por omisión
- Formato: `16:9`, o `9:16` para reels
- Idioma: español
- Emojis: `apple` (PNG o video exportados en Mac) o `fluent` (Linux, VPS, nube, o HTML que se abre en otros equipos)
- Animación: `seco`
- Tono de piel de las personas (`piel`): `🏻`, como el video (o el tuyo: 🏼 🏽 🏾 🏿; `ninguno` las deja amarillas)

## Trato y reglas del cliente
Congela esta ficha ANTES del guion y pásala a cada revisor desde la ronda 1.
- Persona (`tu` / `ustedes`; frente a una sala, `ustedes`):
- Grafías que se respetan:
- Títulos-fórmula que se respetan (`persona_excepciones` si cambian el trato):
- Prohibiciones:

## Tu voz en las láminas
- Palabras que usas siempre (el vocabulario de tu método):
- Palabras que nunca usas (en UNA línea, separadas por comas; QA las busca en cada lámina):
- Tus 3 términos propios (van entre comillas y subrayados la primera vez):

## Emojis fijos para tus conceptos
| Concepto | Emoji |
|---|---|
| tu producto | 📦 |
| tú, quien mira | 🧑‍💻 |
| tu cliente | 🧑‍💼 |
| tu método | 🗺️ |

## Oferta (solo si el deck vende)
Sin estos datos no hay lámina de oferta: no se inventan ni se deducen. Si falta uno, Claude lo pregunta
una sola vez; si decides dejarlo para después, va como `{{PRECIO}}` en el texto y se llena una sola vez
en `"datos"` del deck. Mientras falte, sale como hueco amarillo `[PRECIO]` y QA no deja llamar «final»
al deck.
- Producto (nombre exacto):
- Precio y moneda:
- Precio ancla real y su fuente (si no existe, no se pone ancla):
- Formas de pago o quincenas:
- Garantía (plazo y condición):
- Bonos:
- Cupos o fecha límite reales:

Cada dato de la oferta va en `"datos"` del deck con su clave, y en el texto como `{{CLAVE}}`: `PRECIO`,
`GARANTIA_DIAS` («30»), `GARANTIA_CONDICION` («si aplicas los 6 módulos y no…»), `BONO_1`, `BONO_2`…, `CUPOS`,
`FECHA_LIMITE`, y en una propuesta `FECHA` (arranque) y `VIGENCIA`. Lo que aún no está se declara
`{ "pendiente": true, "motivo": "…" }`; nunca `propuesto` (LAYOUTS.md, «Datos que se llenan una vez»).
- Llamado (palabra clave y canal: WhatsApp, link o DM):
- Credenciales o pruebas con permiso:

## Precios (cómo se escriben en la lámina)
- Símbolo de moneda (sí / no):
- Peso de la letra del precio (regular / negrita):
- Formato de los pagos (p. ej. «4 quincenas de …»):
- El ancla es dinero que el espectador PAGA o PIERDE, en la misma unidad y periodo que el precio: alternativa cara, sueldo, nivel superior, costo de financiarse o lo que nunca cobra, con fuente. Nunca un saldo que sí llegará (cuentas por cobrar, «en la calle», facturación o ventas brutas). Si el dinero llega tarde, ancla con su costo: {{TASA_…}} en `datos` con fuente, u horas de cobranza × {{COSTO_HORA}}. Un total calculado en una `cifra` «Si…» sigue permitido si es un costo. Contraejemplo inválido: «En la calle hoy: $60-90 mil» → «[producto]: [precio]». Se escribe con `cifra` y líneas-objeto (LAYOUTS.md, «Precio con ancla»).

## Pruebas disponibles (solo reales y con permiso)
- Carpeta de capturas: `assets/pruebas/`
- Qué dato encerrar en cada una:
