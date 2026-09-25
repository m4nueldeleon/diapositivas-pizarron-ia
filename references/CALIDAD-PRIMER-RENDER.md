# Calidad antes del primer render

El preflight geométrico incluye la composición de ronda 11 en cada paso: chat vertical de hasta
ocho palabras en dos renglones, ancho de chat ≥70% útil, centro de listas cortas entre 40–58%,
filas pequeñas ≥50% del ancho útil y rótulos ≥60 px a 1920, anotaciones ≥46 px, texto visible
≥30 px (salvo firma y sufijos) e inicio de flechas a ≤24 px del contorno. Son controles previos
al PNG; no registran una captura ni sustituyen la revisión de todas las hojas.

La entrada de producción es `armar.mjs`. `render.mjs` sigue disponible para calibrar el motor y
revisar borradores deliberadamente; no ejecuta el ciclo completo y sí bloquea datos pendientes salvo `--borrador`. Un borrador puede contener huecos:
no se distribuye como presentación final. No se ocultan láminas ni se eliminan beats para aprobar.

```bash
node scripts/armar.mjs mi-deck --corregir --sin-navegador
# Con los datos confirmados y el guion corregido, también dentro del sandbox:
node scripts/armar.mjs mi-deck --corregir
```

`--corregir` autoriza editar ese `deck.json`. Antes de hacerlo guarda
`salida/deck-antes-<sha>.json`. Sin esa bandera solo diagnostica. No completa cifras, firmas,
fechas, personas, sala, pruebas ni respaldos. No agrega aceptaciones de avisos.

## Ciclo del agente

1. Ejecuta el comando sin navegador antes de cualquier PNG. Lee `armado.json → cola` completo.
2. Corrige todos los hallazgos resolubles desde el encargo; vuelve a ejecutar el mismo comando.
   Un aviso conocido sigue siendo trabajo pendiente aunque la nota sea mayor de 90.
3. `tipo_arreglo` indica quién puede resolverlo: `json` (autor), `guion` (autor con el encargo),
   `asset` (archivo real), `motor` (mantenimiento) o `decision_cliente` (dato del cliente).
   `entorno` corresponde al navegador. El diagnóstico es una ayuda de enrutamiento, no cambia
   severidades ni notas. No conviertas una decisión del cliente en una suposición silenciosa.
4. Para pago del gancho, retoma el objeto inicial en el cierre; `paga` no vuelve coherente un cierre
   ajeno. Para persona, alinea pantalla y voz con el trato del encargo. Para sala, usa la modalidad
   real. Para `si_falla`, escribe una acción alternativa ejecutable con lo disponible. Para exceso
   de `idea` (>45%), convierte relaciones en flujo, cantidades en cifra/rejilla e instrucciones en
   lista: no alternes diseños al azar. Vuelve a comprobar el mapa de pasos y la voz.
5. Si solo faltan datos, `espera_datos`; entrega el JSON y los pendientes. Si se repite la cola,
   `estancado`; si persiste después de tres corridas, `limite_de_rondas`. Detén la automatización
   y expón los hallazgos: ninguno de estos estados aprueba la pieza. El agente no debe seguir
   invocando el comando sin una corrección justificada. Las rondas quedan en `armado.json`.
6. Con cero errores, avisos, datos pendientes y requisitos de cierre, se permite renderizar.
   `armar` abre primero el HTML con las fuentes reales y ejecuta `qa --preflight-geometria`:
   mide todos los pasos, listas, énfasis multilínea, rótulos y sellos, sin capturar PNG ni registrar
   una primera nota. Con errores o avisos geométricos se detiene en `encaje-pendiente`.
   Después ejecuta `render --qa`. Lee la cola **medida**, corrige y repite. El filtro de texto
   y el encaje no certifican calidad editorial ni visual.
7. Solo `qa.json → estado: listo` del mismo deck permite pasar a revisar **todas** las hojas,
   incluidos los pasos intermedios. `revisar_hoja` todavía no es entrega; `puede_entregar` permanece
   falso porque el programa no puede certificar la observación humana.

Las únicas correcciones automáticas son conservadoras:

- `idea` con titular literal «Menos ganancia» y un ícono de ganancia: cambia al ícono de pérdida
  del diccionario. No modifica negaciones, frases ambiguas, compuestos ni conceptos propios.
- `fuente_paso` cuando QA detecta retraso y la cita completa ya aparece en una entrada de voz.
  Solo aplica si conserva el número de pasos, no crea errores ni avisos nuevos y reduce avisos.
  Si la fuente era el único elemento del último paso, se deja al autor: no se borra su voz.

Cada cambio se vuelve a construir y revisar. `armado.json` registra diagnóstico inicial, final,
cambios aplicados, candidatos rechazados y huella del archivo corregido. Código de salida:
`0` = QA medido listo, hoja todavía por revisar; `3` = pendientes o sin render; `4` = navegador
bloqueado; `2` = entrada inválida. Un fallo inesperado de un subproceso conserva su código.

## Evidencia y primera nota

`render.mjs` registra cada captura terminada en `calidad-historial.json`, con `deck_sha` y
`html_sha` (incluye el resultado de ficha, datos, CSS y runtime). `qa.mjs` registra allí su nota
medida exacta. Solo la asocia al último render si **ambas huellas** coinciden. Un QA suelto no
prueba que existan PNG actuales. Un cambio de ficha puede cambiar el HTML sin cambiar deck.json.

`qa.json → primer_render.nota` y `calidad-historial.json → qa_primer_render.nota` contienen la misma primera medición asociada al render número 1; nunca se reemplaza
con una mejor. Si el primer render no tuvo QA, es `null`: no se reconstruye ni se inventa.
`qa_ultimo_render` contiene la última medición asociada. Cada proyecto usa su propia carpeta de
salida; no mezcles historiales ni los borres para mejorar la primera nota. La nota provisional
de `qa-texto.json` nunca entra en este historial. Las capturas previas a este mecanismo no tienen
una primera nota certificada por él.

## Datos y reglas del cliente

`datos` sigue siendo el glosario único editable. Usa el mismo `{{CLAVE}}` en pantalla, voz y notas;
no copies la cifra literal. Ambos QA publican `glosario` con estado, valor, fuente y cada uso
(`lamina`, `campo`). Las cifras literales no pueden asociarse automáticamente a una magnitud:
la aritmética existente revisa contradicciones, el autor decide qué valores comparten clave.
Un valor de `datos` no puede contener otro marcador. Un marcador inválido (`{{precio}}`, llaves
sin cerrar) falla antes de construir; `[X]` cuenta igual que `[PRECIO]` como pendiente. `[nombre]`
sigue siendo una plantilla deliberada en una instrucción.

Congela `reglas_cliente` en el deck antes del guion. Es la misma lista y el mismo contrato que
`avisos_aceptados` (alias heredado); escribir ambos da error. Se valida, se sanea y se conserva
en QA incluso cuando todavía no haya aviso coincidente. Motivo y alcance siguen obligatorios
según LAYOUTS; las reglas no negociables conservan su protección. El historial contiene la ficha
de cada corrida: cambiarla a media revisión exige justificar y revisar de nuevo.

## Traspaso de Codex a revisión visual

Con Chromium bloqueado, Codex deja `deck.json`, `qa-texto.json` y `armado.json` con la leyenda
**SIN RENDER, revisión visual pendiente**. No cambia permisos ni relanza fuera del sandbox.
Claude o el orquestador ejecuta los comandos de render, QA y comparación en su entorno habilitado.
Debe comprobar el SHA y abrir todas las hojas. `qa --sin-navegador --estricto` siempre sale con 3,
incluso sin hallazgos. La limitación del entorno no se convierte en un aprobado.

La comparación de fidelidad conserva el contrato de PROTOCOLO §4b: solo la réplica versionada,
correlación mínima 0.7 y diferencias de caja de tinta de hasta 8 puntos del lienzo. Publica la
distancia por lámina desde `comparar.json`. Sin ejecución del comparador no hay cifra nueva.
También publica anclas de bandas, distancias, escala del glifo cromático y su silueta. Un fallo
por elemento hace salir con código 1 aunque el encuadre global pase. La máscara cromática no
aísla bien glifos grises ni varios emojis juntos: sus fallos requieren inspección visual.
Sin cuadros temporales cotejados, `secuencias: sin-referencia-temporal` no es un aprobado.

## Evaluaciones independientes

`evaluaciones.geometria` contiene solo las mediciones de navegador; la integridad comercial
revisa la ficha de oferta y los pendientes. `editorial` registra indicios de repetición,
demostración ausente, capa roja redundante y gramática. Su ausencia no certifica un buen guion.
`aprobacion_visual` permanece `pendiente-humana`: solo un revisor identificado puede firmar
la presentación después de ver todas las hojas. La antigua `nota` se conserva por compatibilidad
y se identifica como cumplimiento automático, nunca como puntuación profesional.

## Contrato de producción

`render.mjs` bloquea PNG, PDF y hojas si hay datos por confirmar o marcadores sin
resolver. `--borrador` permite calibrarlos deliberadamente; conserva los huecos y
el estado de borrador, nunca convierte esa captura en entrega. `--solo-html` y
`--pasos` son herramientas de inspección, no sustituyen el armado de producción.

La falta de datos no se arregla suprimiendo la oferta o el puente. Reporta la nota
medida, los pendientes y el estado, aunque contradigan una meta numérica del loop.
Un tema de una línea no confirma precio, pruebas, fechas ni condiciones.

## Límites comprobados

El PDF por paso es un respaldo rasterizado. La exportación editable y los recortes
de show requieren la capa de escenario y un adaptador de esquemas y pasos que
aún no existe aquí. Una prueba aislada del motor externo no valida ese adaptador.
No presentes un comando de importación como probado si no produjo el archivo y
se comprobó su contenido. No ejecutes comandos que cambien preferencias del
programa de presentación bajo la suposición de que «solo-script» es lectura.
