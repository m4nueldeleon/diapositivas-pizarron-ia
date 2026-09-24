# MI-MARCA — ficha para Diapositivas Pizarrón IA

Copia este archivo a tu carpeta de trabajo y llénalo. Claude lo lee antes de cada deck.

## Firma (abajo a la derecha, en cada lámina)
Déjala vacía si no tienes marca: las láminas saldrán sin firma. **Nunca pongas un valor de ejemplo.**
- Texto (tu @ o tu dominio): 
- Sufijo chico (opcional): 
- Logo (opcional, reemplaza al texto; un PNG sin fondo de unos 58 px de alto, en `assets/`): 

## Valores por omisión
- Formato: `16:9`, o `9:16` para reels
- Idioma: español
- Emojis: `auto`
- Animación: `seco`

## Tu voz en las láminas
- Palabras que usas siempre (el vocabulario de tu método):
- Palabras que nunca usas (en UNA línea, separadas por comas; QA las busca en cada lámina):
- Tus 3 términos propios (van entre comillas y subrayados la primera vez):

## Emojis fijos para tus conceptos
| Concepto | Emoji |
|---|---|
| tu producto | 📦 |
| tu alumno o cliente | 🧑‍💻 |
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
- Llamado (palabra clave y canal: WhatsApp, link o DM):
- Credenciales o pruebas con permiso:

## Precios (cómo se escriben en la lámina)
- Símbolo de moneda (sí / no):
- Peso de la letra del precio (regular / negrita):
- Formato de los pagos (p. ej. «4 quincenas de …»):
- El ancla es algo que el público ya vio (la alternativa cara, un sueldo, tu nivel superior), nunca un
  «Valor» inventado. Se escribe con `cifra` y líneas-objeto (LAYOUTS.md).

## Pruebas disponibles (solo reales y con permiso)
- Carpeta de capturas: `assets/pruebas/`
- Qué dato encerrar en cada una:
