#!/usr/bin/env bash
# setup.sh — prepara Diapositivas Pizarrón IA: verifica Node, Playwright (Chromium) y ffmpeg, y baja
# las tipografías libres si faltan. No instala nada global sin decirlo.
#
#   bash scripts/setup.sh
#   bash scripts/setup.sh --solo-ficha --firma "@tu_arroba" [--sufijo ".com"] [--logo assets/logo.png]
#        [--vetadas "gurú, fácil"] [--comunidad "Club X, palabra CLUB"] [--proxima-clase "cada lunes 8 pm"]
#        [--importar-carrusel ruta/MI-MARCA.md] [--forzar]
#
# Con cualquier flag de ficha escribe ~/.config/diapositivas-pizarron-ia/MI-MARCA.md SIN terminal interactiva (el Bash
# de Claude no lo es): así la firma y el puente de clases ({{COMUNIDAD}}, {{PROXIMA_CLASE}}) se llenan desde Claude Code.
# Una ficha que ya existe no se sobrescribe sin --forzar. --solo-ficha se salta Node, Playwright y la prueba de humo.
set -euo pipefail
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FUENTES="$AQUI/assets/fonts"
ok() { echo "  ✓ $*"; }; mal() { echo "  ✗ $*"; }

FIRMA="${PIZARRON_FIRMA:-}"; SUFIJO="${PIZARRON_SUFIJO:-}"; LOGO="${PIZARRON_LOGO:-}"
VETADAS="${PIZARRON_VETADAS:-}"; COMUNIDAD="${PIZARRON_COMUNIDAD:-}"; PROXIMA="${PIZARRON_PROXIMA_CLASE:-}"
IMPORTAR=""; SOLO_FICHA=0; FORZAR=0; CON_FICHA=0
if [ -n "$FIRMA$SUFIJO$LOGO$VETADAS$COMUNIDAD$PROXIMA" ]; then CON_FICHA=1; fi
TTY=""; if [ -t 0 ]; then TTY=/dev/stdin; elif (exec </dev/tty) 2>/dev/null; then TTY=/dev/tty; fi
valor() { if [ $# -lt 2 ] || [ "${2#--}" != "$2" ]; then echo "✗ $1 necesita un valor" >&2; exit 2; fi; }
while [ $# -gt 0 ]; do
  case "$1" in
    --firma) valor "$@"; FIRMA="$2"; CON_FICHA=1; shift 2 ;;
    --sufijo) valor "$@"; SUFIJO="$2"; CON_FICHA=1; shift 2 ;;
    --logo) valor "$@"; LOGO="$2"; CON_FICHA=1; shift 2 ;;
    --vetadas) valor "$@"; VETADAS="$2"; CON_FICHA=1; shift 2 ;;
    --comunidad) valor "$@"; COMUNIDAD="$2"; CON_FICHA=1; shift 2 ;;
    --proxima-clase) valor "$@"; PROXIMA="$2"; CON_FICHA=1; shift 2 ;;
    --importar-carrusel) valor "$@"; IMPORTAR="$2"; CON_FICHA=1; shift 2 ;;
    --solo-ficha) SOLO_FICHA=1; shift ;;
    --forzar) FORZAR=1; shift ;;
    -h|--help) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "✗ opción desconocida: $1 (bash scripts/setup.sh --help)" >&2; exit 2 ;;
  esac
done

if [ "$SOLO_FICHA" = 0 ]; then
mkdir -p "$FUENTES"

echo "▶ Node"
if command -v node >/dev/null 2>&1; then ok "$(node -v)"; else mal "Falta Node.js 18+ → https://nodejs.org (Mac: brew install node)"; exit 1; fi

echo "▶ Playwright + Chromium (renderiza las láminas)"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.playwright-browsers}"
if ! (cd "$AQUI" && node -e "require('playwright')") >/dev/null 2>&1 && ! NODE_PATH="$(npm root -g 2>/dev/null)" node -e "require('playwright')" >/dev/null 2>&1; then
  echo "  · instalando playwright en la carpeta de la skill…"
  (cd "$AQUI" && npm install --silent --no-audit --no-fund playwright@1) && ok "playwright instalado"
else ok "playwright encontrado"; fi
CLI="$AQUI/node_modules/playwright/cli.js"; [ -f "$CLI" ] || CLI="$(npm root -g 2>/dev/null)/playwright/cli.js"
if ! (cd "$AQUI" && NODE_PATH="$(npm root -g 2>/dev/null)" node -e "const p=require('playwright');process.exit(require('fs').existsSync(p.chromium.executablePath())?0:1)") >/dev/null 2>&1; then
  echo "  · bajando Chromium a $PLAYWRIGHT_BROWSERS_PATH …"; node "$CLI" install chromium && ok "Chromium listo"
else ok "Chromium listo"; fi
grep -q PLAYWRIGHT_BROWSERS_PATH "$HOME/.zshrc" 2>/dev/null || echo "  · consejo: agrega 'export PLAYWRIGHT_BROWSERS_PATH=$PLAYWRIGHT_BROWSERS_PATH' a tu ~/.zshrc"

echo "▶ Fuente de emoji (para emojis dentro del texto fuera de Mac)"
if [ "$(uname)" = "Darwin" ]; then ok "Apple Color Emoji"
elif command -v fc-list >/dev/null 2>&1 && fc-list | grep -qi emoji; then ok "$(fc-list | grep -i emoji | head -1 | cut -d: -f2)"
else mal "No hay fuente de emoji: instala fonts-noto-color-emoji (apt install fonts-noto-color-emoji). Con \"emoji\": \"fluent\" los íconos salen igual, pero un emoji en SVG podría salir como cuadro vacío."; fi

echo "▶ ffmpeg (solo para video y montaje)"
if command -v ffmpeg >/dev/null 2>&1; then ok "$(ffmpeg -version | head -1 | cut -d' ' -f1-3)"; else mal "Falta ffmpeg (Mac: brew install ffmpeg · Linux: apt install ffmpeg). Las láminas y el presentador funcionan sin él."; fi

echo "▶ Tipografías (licencia OFL, de google/fonts)"
B=https://raw.githubusercontent.com/google/fonts/main/ofl
for par in "Figtree.ttf|figtree/Figtree%5Bwght%5D.ttf" "Figtree-Italic.ttf|figtree/Figtree-Italic%5Bwght%5D.ttf" "Caveat.ttf|caveat/Caveat%5Bwght%5D.ttf" "ZillaSlab-Bold.ttf|zillaslab/ZillaSlab-Bold.ttf"; do
  n="${par%%|*}"; r="${par#*|}"
  if [ -s "$FUENTES/$n" ]; then ok "$n"; elif curl -fsSL "$B/$r" -o "$FUENTES/$n"; then ok "$n (descargada)"; else mal "no pude bajar $n"; fi
done

fi   # fin de lo que --solo-ficha se salta

echo "▶ Ficha de marca global (firma, palabras vetadas y puente de clases para todos tus decks)"
FICHA="$HOME/.config/diapositivas-pizarron-ia/MI-MARCA.md"
CARRUSEL="${PIZARRON_IMPORTAR:-}"
if [ "$CON_FICHA" = 1 ]; then
  if [ -f "$FICHA" ] && [ "$FORZAR" = 0 ]; then
    echo "  · ya existe $FICHA: no la sobrescribo (usa --forzar). Esto tiene:"; sed 's/^/      /' "$FICHA"
  else
    if [ -n "$IMPORTAR" ] && [ ! -f "$IMPORTAR" ]; then mal "no existe $IMPORTAR"; exit 2; fi
    mkdir -p "$(dirname "$FICHA")"
    # fichaDesdeOpciones rechaza una firma de ejemplo («tumarca.com»): nunca queda un relleno como firma
    if ! node --input-type=module -e "import fs from 'node:fs'; import { fichaDesdeOpciones } from '$AQUI/scripts/lib/marca.mjs';
      const [ruta, firma, sufijo, logo, vetadas, comunidad, proximaClase, imp] = process.argv.slice(1);
      try { fs.writeFileSync(ruta, fichaDesdeOpciones({ firma, sufijo, logo, vetadas, comunidad, proximaClase, carrusel: imp ? fs.readFileSync(imp, 'utf8') : '' })); }
      catch (e) { console.error('  ✗ ' + e.message); process.exit(3); }" "$FICHA" "$FIRMA" "$SUFIJO" "$LOGO" "$VETADAS" "$COMUNIDAD" "$PROXIMA" "$IMPORTAR"; then exit 3; fi
    chmod 600 "$FICHA"; ok "creada: $FICHA"; sed 's/^/      /' "$FICHA"
  fi
elif [ -f "$FICHA" ]; then ok "$FICHA"
elif [ -z "$TTY" ]; then echo "  · sin terminal interactiva: créala con bash scripts/setup.sh --solo-ficha --firma \"@tu_arroba\" [--proxima-clase \"cada lunes 8 pm\"] [--comunidad \"…\"]"
else
  printf "  ¿La creo ahora? Cinco preguntas (s/N): "; read -r R <"$TTY" || R=""
  if [ "${R:-n}" = "s" ] || [ "${R:-n}" = "S" ]; then
    printf "  ¿Importar de la ficha de carruseles-virales-ia? Ruta de su MI-MARCA.md (vacío = no): "; read -r CARRUSEL <"$TTY" || CARRUSEL=""
    mkdir -p "$(dirname "$FICHA")"
    if [ -n "$CARRUSEL" ] && [ -f "$CARRUSEL" ]; then
      # Se CONVIERTE: solo la cuenta como firma y las palabras vetadas en una línea; nada de reglas de carrusel
      node --input-type=module -e "import fs from 'node:fs'; import { convertirFichaCarrusel } from '$AQUI/scripts/lib/marca.mjs'; fs.writeFileSync(process.argv[1], convertirFichaCarrusel(fs.readFileSync(process.argv[2], 'utf8')));" "$FICHA" "$CARRUSEL"
    else
      printf "  1/5 Tu @ o tu dominio (la firma; vacío = sin firma): "; read -r T <"$TTY" || T=""
      printf "  2/5 Logo (ruta a un PNG sin fondo; vacío = sin logo): "; read -r LOGO <"$TTY" || LOGO=""
      printf "  3/5 Palabras que nunca usas (separadas por comas): "; read -r V <"$TTY" || V=""
      printf "  4/5 Comunidad (nombre, palabra clave o link; vacío = después): "; read -r COMUNIDAD <"$TTY" || COMUNIDAD=""
      printf "  5/5 Próxima clase (día y hora; vacío = después): "; read -r PROXIMA <"$TTY" || PROXIMA=""
      node --input-type=module -e "import fs from 'node:fs'; import { fichaNueva } from '$AQUI/scripts/lib/marca.mjs'; fs.writeFileSync(process.argv[1], fichaNueva({ texto: process.argv[2], logo: process.argv[3], vetadas: process.argv[4].split(',').map(x => x.trim()).filter(Boolean), comunidad: process.argv[5], proximaClase: process.argv[6] }));" "$FICHA" "$T" "$LOGO" "$V" "$COMUNIDAD" "$PROXIMA"
    fi
    chmod 600 "$FICHA"; ok "creada: $FICHA"; echo "  · revísala:"; sed 's/^/      /' "$FICHA"
  else echo "  · omitida: las láminas salen sin firma hasta que exista $FICHA"; fi
fi

[ "$SOLO_FICHA" = 1 ] && { echo "Listo."; exit 0; }
echo "▶ Prueba de humo"
if node "$AQUI/scripts/render.mjs" "$AQUI/ejemplos/demo" --finales --sin-hoja --salida "${TMPDIR:-/tmp}/pizarron-prueba" >/dev/null 2>&1; then ok "el demo se renderiza"; else mal "el demo no se renderizó: corre node scripts/render.mjs ejemplos/demo para ver el error"; fi
echo "Listo."
