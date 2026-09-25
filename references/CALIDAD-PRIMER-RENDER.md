# Calidad antes del primer render

La entrada de producción es `armar.mjs`. `render.mjs` sigue disponible para calibrar el motor y
revisar borradores deliberadamente; no pasa por este filtro. Un borrador puede contener huecos:
no se distribuye como presentación final. No se ocultan láminas ni se eliminan beats para aprobar.

```bash
node scripts/armar.mjs mi-deck --corregir --sin-navegador
# Fuera del sandbox, con los datos confirmados y las correcciones de guion resueltas:
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
   `armar` ejecuta `render --qa`. Lee ahora la cola **medida**, corrige y repite. El filtro de texto
   no garantiza 85 puntos visuales: geometría, contraste y encaje se miden después.
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

`qa_primer_render.nota` es la primera medición asociada al render número 1; nunca se reemplaza
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

## Auditoría de cierre

Se revisaron las cuatro hojas del demo y PNG individuales del ícono propio, el óvalo y el stack;
las cinco hojas de los tres decks de evaluación y cuadros originales de referencia. El ícono
propio y el antes/después ya existen: se conservan. El problema principal es que un deck puede
llegar a render con avisos conocidos y datos pendientes.

Los QA aportados registran 82 (propuesta), 90 (clase express) y 90 (venta). Solo certifican sus
versiones y sus reglas de entonces. En el preflight actual de esos archivos, sin completarlos,
se detectan respectivamente **6 errores/33 avisos/14 datos**, **0/3/1** y **0/13/14**. Son conteos
de texto, no nuevas notas de render. Los tres se detienen antes de generar PNG; ninguno se
declara listo. La autocorrección editorial completa de esos tres decks sigue pendiente.

No se cambia la composición 9:16 sin una medición nueva, no se agregan emojis sin medir y no
se afirma haber completado exportación editable ni paquete de show. PDF por paso sigue siendo
un respaldo rasterizado. El adaptador a la capa de escenario no está probado aquí.
