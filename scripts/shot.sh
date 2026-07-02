#!/bin/bash
# Screenshot the live Quarto preview (localhost:4321) for design review.
# Usage: scripts/shot.sh <url-path> <outname> [pixel-height]
#   scripts/shot.sh /posts/ essays 2400
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
path="${1:-/}"
name="${2:-page}"
height="${3:-2600}"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-color-profile=srgb \
  --window-size=1440,"${height}" --virtual-time-budget=6000 \
  --screenshot="/tmp/shot-${name}.png" "http://localhost:4321${path}" 2>/dev/null
echo "/tmp/shot-${name}.png"
