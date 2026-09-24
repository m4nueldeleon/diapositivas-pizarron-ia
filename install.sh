#!/usr/bin/env bash
# Instalador de Diapositivas Pizarrón IA para Claude Code.
#   curl -fsSL https://raw.githubusercontent.com/m4nueldeleon/diapositivas-pizarron-ia/main/install.sh | bash
set -euo pipefail
DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}/diapositivas-pizarron-ia"
CODEX=0
while [ $# -gt 0 ]; do
  case "$1" in
    --codex) CODEX=1; shift ;;
    *) echo "✗ opción desconocida: $1 (usa --codex)" >&2; exit 2 ;;
  esac
done
REPO="https://github.com/m4nueldeleon/diapositivas-pizarron-ia.git"
command -v git >/dev/null || { echo "Falta git"; exit 1; }
if [ -d "$DEST/.git" ]; then echo "▶ Actualizando $DEST"; git -C "$DEST" pull --ff-only
elif [ -e "$DEST" ]; then echo "Ya existe $DEST y no es un clon de git. Muévelo y vuelve a correr."; exit 1
else echo "▶ Clonando en $DEST"; mkdir -p "$(dirname "$DEST")"; git clone --depth 1 "$REPO" "$DEST"; fi
bash "$DEST/scripts/setup.sh"
echo
echo "✓ Instalada. En Claude Code pide: «hazme las láminas estilo pizarrón de este guion»."

FICHA="$HOME/.config/diapositivas-pizarron-ia/MI-MARCA.md"
if [ -f "$FICHA" ]; then echo "✓ Ficha: $FICHA"
else echo "⚠ Sin firma: bash \"$DEST/scripts/setup.sh\" --solo-ficha --firma @tu_arroba (o reinstala con PIZARRON_FIRMA=@tu_arroba … | bash)"; fi
if [ -d "$HOME/.codex" ] || [ "$CODEX" = 1 ] || [ -n "${CODEX_SKILLS_DIR:-}" ]; then
  CODEX_DIR="${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"
  mkdir -p "$CODEX_DIR"
  ln -sfn "$DEST" "$CODEX_DIR/diapositivas-pizarron-ia"
  echo "✓ Codex: $CODEX_DIR/diapositivas-pizarron-ia"
fi
