#!/bin/bash
# Reconstruye tailwind-build.css a partir de tailwind.config.js + tailwind-input.css
# Usa el binario standalone de Tailwind (no requiere npm, evita el 403 de registry.npmjs.org)
set -e
cd "$(dirname "$0")"

BIN="./tailwindcss"

if [ ! -f "$BIN" ]; then
  echo "Descargando Tailwind CLI standalone (macOS arm64)..."
  curl -sL -o "$BIN" "https://github.com/tailwindlabs/tailwindcss/releases/download/v3.4.17/tailwindcss-macos-arm64"
  chmod +x "$BIN"
fi

echo "Compilando tailwind-build.css..."
"$BIN" -c tailwind.config.js -i tailwind-input.css -o tailwind-build.css --minify

echo "Listo. tailwind-build.css actualizado."
