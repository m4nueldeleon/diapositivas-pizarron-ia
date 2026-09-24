#!/usr/bin/env bash
# setup.sh — prepara Diapositivas Pizarrón IA: verifica Node, Playwright (Chromium) y ffmpeg, y baja
# las tipografías libres si faltan. No instala nada global sin decirlo.
#
#   bash scripts/setup.sh
set -euo pipefail
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FUENTES="$AQUI/assets/fonts"
mkdir -p "$FUENTES"
ok() { echo "  ✓ $*"; }; mal() { echo "  ✗ $*"; }

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

echo "▶ Ficha de marca global (firma y palabras vetadas para todos tus decks)"
FICHA="$HOME/.config/diapositivas-pizarron-ia/MI-MARCA.md"
CARRUSEL="${PIZARRON_IMPORTAR:-}"
if [ -f "$FICHA" ]; then ok "$FICHA"
elif [ ! -t 0 ]; then echo "  · sin terminal interactiva: crea $FICHA con el formato de templates/MI-MARCA.md (o corre este script en una terminal)"
else
  printf "  ¿La creo ahora? Tres preguntas (s/N): "; read -r R
  if [ "${R:-n}" = "s" ] || [ "${R:-n}" = "S" ]; then
    printf "  ¿Importar de la ficha de carruseles-virales-ia? Ruta de su MI-MARCA.md (vacío = no): "; read -r CARRUSEL
    mkdir -p "$(dirname "$FICHA")"
    if [ -n "$CARRUSEL" ] && [ -f "$CARRUSEL" ]; then
      # Se CONVIERTE: solo la cuenta como firma y las palabras vetadas en una línea; nada de reglas de carrusel
      node --input-type=module -e "import fs from 'node:fs'; import { convertirFichaCarrusel } from '$AQUI/scripts/lib/marca.mjs'; fs.writeFileSync(process.argv[1], convertirFichaCarrusel(fs.readFileSync(process.argv[2], 'utf8')));" "$FICHA" "$CARRUSEL"
    else
      printf "  1/3 Tu @ o tu dominio (la firma; vacío = sin firma): "; read -r T
      printf "  2/3 Logo (ruta a un PNG sin fondo; vacío = sin logo): "; read -r LOGO
      printf "  3/3 Palabras que nunca usas (separadas por comas): "; read -r V
      node --input-type=module -e "import fs from 'node:fs'; import { fichaNueva } from '$AQUI/scripts/lib/marca.mjs'; fs.writeFileSync(process.argv[1], fichaNueva({ texto: process.argv[2], logo: process.argv[3], vetadas: process.argv[4].split(',').map(x => x.trim()).filter(Boolean) }));" "$FICHA" "$T" "$LOGO" "$V"
    fi
    chmod 600 "$FICHA"; ok "creada: $FICHA"; echo "  · revísala:"; sed 's/^/      /' "$FICHA"
  else echo "  · omitida: las láminas salen sin firma hasta que exista $FICHA"; fi
fi

echo "▶ Prueba de humo"
if node "$AQUI/scripts/render.mjs" "$AQUI/ejemplos/demo" --finales --sin-hoja --salida "${TMPDIR:-/tmp}/pizarron-prueba" >/dev/null 2>&1; then ok "el demo se renderiza"; else mal "el demo no se renderizó: corre node scripts/render.mjs ejemplos/demo para ver el error"; fi
echo "Listo."
