#!/usr/bin/env bash
# ==============================================================================
# AnyRealm OS - Ubuntu Server 22.04 LTS Kiosk & VS Code Extension Setup Script
# ==============================================================================
# This script configures a fresh Ubuntu Server 22.04 LTS installation into a
# fully locked-down, high-flexibility kiosk workstation running the AnyRealm OS
# architecture, web dashboard, and VS Code extension integration.
# ==============================================================================

set -euo pipefail

echo "=================================================="
echo " Starting AnyRealm Ubuntu Server 22.04 LTS Setup "
echo "=================================================="

# 1. System Update & Dependencies
echo "[+] Updating system packages and installing prerequisites..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y \
    curl \
    git \
    build-essential \
    ca-certificates \
    gnupg \
    lsb-release \
    unzip \
    nginx \
    xserver-xorg \
    xinit \
    openbox \
    chromium-browser \
    nodejs \
    npm

# 2. Node.js 24 LTS Installation Check
echo "[+] Ensuring Node.js version 24+ is active..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "Current Node version: $NODE_VERSION"
fi

if ! node -e 'const [major] = process.versions.node.slice(1).split(".").map(Number); process.exit((major >= 24) ? 0 : 1);' 2>/dev/null; then
    echo "[-] Installing Node.js 24 from NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. VS Code & Extension Setup
echo "[+] Installing Visual Studio Code CLI and setting up AnyRealm extension..."
if ! command -v code &> /dev/null; then
    wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list
    sudo apt-get update
    sudo apt-get install -y code
fi

# 4. Kiosk Mode & Auto-start Configuration
echo "[+] Configuring Openbox and Chromium Kiosk Mode for Ubuntu Server 22.04 LTS..."
mkdir -p ~/.config/openbox

cat << 'EOF' > ~/.config/openbox/autostart
# Disable screen blanking and power management
xset s noblank
xset s off
xset -dpms

# Start AnyRealm Local Node Server in background if not running
cd /home/$USER/AnyRealm-builder || cd $(pwd)
if [ -f "server.ts" ]; then
    npm run dev &
elif [ -f "dist/server.cjs" ]; then
    node dist/server.cjs &
fi

# Launch Chromium in Kiosk Mode pointing to AnyRealm Web App
sleep 3
chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-translate --start-maximized http://localhost:3000 &
EOF

chmod +x ~/.config/openbox/autostart

# 5. Configure .bash_profile to auto-start X on login for server console
if ! grep -q "startx" ~/.bash_profile 2>/dev/null; then
    cat << 'EOF' >> ~/.bash_profile

# Auto-start X server into Kiosk Openbox on tty1
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/tost/tty1" -o "$(tty)" = "/dev/tty1" ]; then
    exec startx
fi
EOF
fi

echo "=================================================="
echo " AnyRealm Ubuntu Server 22.04 LTS Setup Complete! "
echo " Reboot your server or run 'startx' to launch kiosk."
echo "=================================================="
