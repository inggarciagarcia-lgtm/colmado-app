import os
import subprocess

app_dir = "Gestor Negocio.app"
macos_dir = os.path.join(app_dir, "Contents", "MacOS")
resources_dir = os.path.join(app_dir, "Contents", "Resources")

os.makedirs(macos_dir, exist_ok=True)
os.makedirs(resources_dir, exist_ok=True)

# 1. Info.plist
plist_content = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.gestornegocio.app</string>
    <key>CFBundleName</key>
    <string>Gestor Negocio</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
"""

with open(os.path.join(app_dir, "Contents", "Info.plist"), "w") as f:
    f.write(plist_content.strip())

# 2. Launcher executable script
launcher_content = """#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

PROJECT_DIR="/Users/mrgarciag/.gemini/antigravity/scratch/gestor-negocio"
PORT=3001

# Check if port 3001 is running
if ! lsof -i :$PORT >/dev/null 2>&1; then
    cd "$PROJECT_DIR"
    nohup npx next start -H 0.0.0.0 -p $PORT >/dev/null 2>&1 &
    
    # Wait for server to respond
    for i in $(seq 1 30); do
        if curl -s -I http://localhost:$PORT >/dev/null 2>&1; then
            break
        fi
        sleep 0.5
    done
fi

# Open directly in standalone window mode with Chrome or default browser
TARGET_URL="http://localhost:$PORT/pos"
if [ -d "/Applications/Google Chrome.app" ]; then
    open -na "Google Chrome" --args --app="$TARGET_URL"
else
    open "$TARGET_URL"
fi
"""

launcher_path = os.path.join(macos_dir, "launcher")
with open(launcher_path, "w") as f:
    f.write(launcher_content.strip())

os.chmod(launcher_path, 0o755)

print("Gestor Negocio.app updated successfully with port 3001 support!")
