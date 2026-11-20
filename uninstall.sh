#!/usr/bin/env bash
# Removes the Freecode desktop launcher.
set -euo pipefail

APP_ID="freecode"
PREFIX="${HOME}/.local"
SUDO=""
PURGE=0

while [ $# -gt 0 ]; do
  case "$1" in
    --prefix) PREFIX="${2:?--prefix needs a value}"; shift 2 ;;
    --system) PREFIX="/usr/local"; SUDO="sudo"; shift ;;
    --purge)  PURGE=1; shift ;;
    -h|--help)
      cat <<EOF
Usage: ./uninstall.sh [--prefix DIR] [--system] [--purge]
  --purge  Also delete the saved browser profile
EOF
      exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

BIN="${PREFIX}/bin/${APP_ID}"
DESKTOP="${PREFIX}/share/applications/${APP_ID}.desktop"
ICON="${PREFIX}/share/icons/hicolor/scalable/apps/${APP_ID}.svg"
SHARE="${PREFIX}/share/${APP_ID}"
KONSOLE="${PREFIX}/share/konsole"

for f in "$BIN" "$DESKTOP" "$ICON" \
         "${KONSOLE}/${APP_ID}.profile" "${KONSOLE}/${APP_ID}.colorscheme"; do
  if [ -e "$f" ]; then ${SUDO} rm -f "$f"; echo "removed $f"; fi
done

if [ -d "$SHARE" ]; then
  if [ "$PURGE" -eq 1 ]; then
    ${SUDO} rm -rf "$SHARE"; echo "removed $SHARE"
  else
    ${SUDO} rm -f "${SHARE}/config"
    ${SUDO} rmdir "$SHARE" 2>/dev/null || true
    echo "kept saved browser profile in ${SHARE}/profile (use --purge to delete)"
  fi
fi

command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "${PREFIX}/share/applications" >/dev/null 2>&1 || true
echo "Uninstalled ${APP_ID}."
