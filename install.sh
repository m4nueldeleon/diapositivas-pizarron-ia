#!/usr/bin/env bash
# Instalador de Diapositivas Pizarrón IA para Claude Code.
#   curl -fsSL https://raw.githubusercontent.com/m4nueldeleon/diapositivas-pizarron-ia/main/install.sh | bash
set -euo pipefail
DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}/diapositivas-pizarron-ia"
REPO="https://github.com/m4nueldeleon/diapositivas-pizarron-ia.git"
command -v git >/dev/null || { echo "Falta git"; exit 1; }
if [ -d "$DEST/.git" ]; then echo "▶ Actualizando $DEST"; git -C "$DEST" pull --ff-only
elif [ -e "$DEST" ]; then echo "Ya existe $DEST y no es un clon de git. Muévelo y vuelve a correr."; exit 1
else echo "▶ Clonando en $DEST"; mkdir -p "$(dirname "$DEST")"; git clone --depth 1 "$REPO" "$DEST"; fi
bash "$DEST/scripts/setup.sh"
echo
echo "✓ Instalada. En Claude Code pide: «hazme las láminas estilo pizarrón de este guion»."
