#!/usr/bin/env bash
# Installs Freecode for Linux: a `freecode` command, a konsole profile,
# and a desktop launcher with a GitHub sign-in action.
set -euo pipefail

APP_NAME="Freecode"
APP_ID="freecode"
BASE_URL="${FREECODE_BASE_URL:-https://freecode.sh}"
BROWSER="${FREECODE_BROWSER:-}"
PREFIX="${HOME}/.local"
SUDO=""

usage() {
  cat <<EOF
Usage: ./install.sh [options]

  --prefix DIR   Install under DIR (default: ~/.local)
  --browser PATH Use a specific Chromium-family browser
  --system       Install into /usr/local for all users (uses sudo)
  -h, --help     Show this help
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --prefix)  PREFIX="${2:?--prefix needs a value}"; shift 2 ;;
    --browser) BROWSER="${2:?--browser needs a value}"; shift 2 ;;
    --system)  PREFIX="/usr/local"; SUDO="sudo"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

say() { printf '%s\n' "$*"; }
die() { printf 'Error: %s\n' "$*" >&2; exit 1; }

# --- 1. Find a Chromium-family browser (for the app window) -----------------
find_browser() {
  if [ -n "$BROWSER" ]; then
    command -v "$BROWSER" 2>/dev/null || { [ -x "$BROWSER" ] && printf '%s' "$BROWSER" && return 0; }
    die "Browser not found: $BROWSER"
  fi
  local c
  for c in google-chrome google-chrome-stable chromium chromium-browser \
           brave-browser microsoft-edge microsoft-edge-stable vivaldi-stable \
           /snap/bin/chromium; do
    if command -v "$c" >/dev/null 2>&1; then command -v "$c"; return 0; fi
  done
  return 1
}

BROWSER_BIN="$(find_browser)" || die "No Chromium-based browser found.
Freecode needs one to show its interface on Linux.
  Ubuntu/Debian:  sudo apt install chromium
  Fedora:         sudo dnf install chromium
  Arch:           sudo pacman -S chromium
Then run this installer again."

# --- 2. Layout --------------------------------------------------------------
BIN_DIR="${PREFIX}/bin"
APPS_DIR="${PREFIX}/share/applications"
ICON_DIR="${PREFIX}/share/icons/hicolor/scalable/apps"
DATA_DIR="${PREFIX}/share/${APP_ID}"
KONSOLE_DIR="${PREFIX}/share/konsole"
CONFIG_FILE="${DATA_DIR}/config"

say "Installing ${APP_NAME} to ${PREFIX}"
say "Browser: ${BROWSER_BIN}"

${SUDO} mkdir -p "$BIN_DIR" "$APPS_DIR" "$ICON_DIR" "$DATA_DIR" "$KONSOLE_DIR"

# --- 3. Config --------------------------------------------------------------
tmp="$(mktemp)"
{
  printf 'BROWSER=%q\n' "$BROWSER_BIN"
  printf 'BASE_URL=%q\n' "$BASE_URL"
  printf 'APP_ID=%q\n' "$APP_ID"
} > "$tmp"
${SUDO} install -m 0644 "$tmp" "$CONFIG_FILE"
rm -f "$tmp"

# --- 4. The freecode command ------------------------------------------------
tmp="$(mktemp)"
cat > "$tmp" <<EOF
#!/usr/bin/env bash
# Installed by the Freecode installer. Run: freecode help
set -euo pipefail
CONFIG="${CONFIG_FILE}"
[ -r "\$CONFIG" ] || { echo "Missing install config: \$CONFIG" >&2; exit 1; }
. "\$CONFIG"

PROFILE_DIR="\${XDG_DATA_HOME:-\$HOME/.local/share}/\${APP_ID}"

open_app() {
  local url="\$1"
  shift
  exec "\$BROWSER" \\
    --app="\$url" \\
    --class="\$APP_ID" \\
    --name="Freecode" \\
    --user-data-dir="\$PROFILE_DIR/profile" \\
    "\$@"
}

COMMAND="\${1:-open}"
[ \$# -gt 0 ] && shift

case "\$COMMAND" in
  open|workspace|app)
    open_app "\$BASE_URL/app" "\$@" ;;
  login|signin|sign-in|github)
    echo "Opening GitHub sign-in. Choose \\"Connect GitHub\\" in the window."
    open_app "\$BASE_URL/sign-in" "\$@" ;;
  account)
    open_app "\$BASE_URL/account" "\$@" ;;
  status)
    printf 'service: '
    if curl -fsS --max-time 10 -o /dev/null "\$BASE_URL" 2>/dev/null; then echo up; else echo unreachable; fi
    printf 'auth:    '
    if curl -fsS --max-time 10 -o /dev/null "https://auth.freecode.sh/health" 2>/dev/null; then echo up; else echo unreachable; fi
    printf 'browser: %s\n' "\$BROWSER" ;;
  help|-h|--help)
    cat <<'USAGE'
freecode on Linux

  freecode           Open the Freecode workspace
  freecode login     Open GitHub sign-in
  freecode account   Open your account page
  freecode status    Check that Freecode is reachable
  freecode help      Show this message

Terminal theme: konsole --profile Freecode
USAGE
    ;;
  *) echo "Unknown command: \$COMMAND (try: freecode help)" >&2; exit 2 ;;
esac
EOF
${SUDO} install -m 0755 "$tmp" "${BIN_DIR}/${APP_ID}"
rm -f "$tmp"

# --- 5. Konsole colour scheme + profile -------------------------------------
tmp="$(mktemp)"
cat > "$tmp" <<'EOF'
[Background]
Color=24,24,32

[BackgroundIntense]
Color=32,32,44

[Foreground]
Color=226,232,240

[ForegroundIntense]
Color=255,255,255
Bold=true

[General]
Description=Freecode
Opacity=1

[Color0]
Color=24,24,32

[Color1]
Color=248,113,113

[Color2]
Color=134,239,172

[Color3]
Color=253,224,71

[Color4]
Color=129,161,255

[Color5]
Color=196,181,253

[Color6]
Color=125,211,252

[Color7]
Color=226,232,240

[Color0Intense]
Color=71,85,105

[Color1Intense]
Color=252,165,165

[Color2Intense]
Color=187,247,208

[Color3Intense]
Color=254,240,138

[Color4Intense]
Color=165,180,252

[Color5Intense]
Color=221,214,254

[Color6Intense]
Color=186,230,253

[Color7Intense]
Color=248,250,252
EOF
${SUDO} install -m 0644 "$tmp" "${KONSOLE_DIR}/${APP_ID}.colorscheme"
rm -f "$tmp"

tmp="$(mktemp)"
cat > "$tmp" <<EOF
[Appearance]
ColorScheme=${APP_ID}
Font=Hack,10,-1,5,50,0,0,0,0,0

[General]
Name=Freecode
Parent=FALLBACK/
TerminalCenter=true
TerminalMargin=12
EOF
${SUDO} install -m 0644 "$tmp" "${KONSOLE_DIR}/${APP_ID}.profile"
rm -f "$tmp"

# --- 6. Icon ---------------------------------------------------------------
tmp="$(mktemp --suffix=.svg)"
cat > "$tmp" <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4f46e5"/>
      <stop offset="1" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="240" height="240" rx="56" fill="url(#g)"/>
  <text x="128" y="176" text-anchor="middle" font-family="Helvetica,Arial,sans-serif"
        font-size="140" font-weight="700" fill="#ffffff">F</text>
</svg>
EOF
${SUDO} install -m 0644 "$tmp" "${ICON_DIR}/${APP_ID}.svg"
rm -f "$tmp"

# --- 7. Desktop entry with a GitHub sign-in action --------------------------
tmp="$(mktemp)"
cat > "$tmp" <<EOF
[Desktop Entry]
Type=Application
Version=1.0
Name=${APP_NAME}
GenericName=AI coding agent
Comment=Open the Freecode workspace
Exec="${BIN_DIR}/${APP_ID}" open
Icon=${ICON_DIR}/${APP_ID}.svg
Terminal=false
Categories=Development;Network;
StartupWMClass=${APP_ID}
StartupNotify=true
Actions=signin;account;terminal;

[Desktop Action signin]
Name=Sign in with GitHub
Exec="${BIN_DIR}/${APP_ID}" login

[Desktop Action account]
Name=Account
Exec="${BIN_DIR}/${APP_ID}" account

[Desktop Action terminal]
Name=Open in konsole
Exec=konsole --profile Freecode
EOF
${SUDO} install -m 0644 "$tmp" "${APPS_DIR}/${APP_ID}.desktop"
rm -f "$tmp"

# --- 8. Refresh caches ------------------------------------------------------
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$APPS_DIR" >/dev/null 2>&1 || true
command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -f -t "${PREFIX}/share/icons/hicolor" >/dev/null 2>&1 || true

say ""
say "Done. ${APP_NAME} is installed."
say "  App menu:   Freecode  (right-click for \"Sign in with GitHub\")"
say "  Terminal:   ${BIN_DIR}/${APP_ID} login"
say "  Konsole:    konsole --profile Freecode"
say "  Remove:     ./uninstall.sh"
