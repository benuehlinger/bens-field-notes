#!/usr/bin/env bash
# Cloudflare Pages / CI build script — installs Quarto on Linux, then renders the site.
#
# Cloudflare Pages: set Build command to:
#   bash scripts/cloudflare-pages-build.sh
#
# Environment variables (optional but recommended on Pages):
#   R2_BASE_URL — passed to Quarto as param `r2-base-url` for live DuckDB charts.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

QUARTO_VERSION="${QUARTO_VERSION:-1.9.37}"
QUARTO_ARCH="${QUARTO_ARCH:-linux-amd64}"
QUARTO_TGZ="quarto-${QUARTO_VERSION}-${QUARTO_ARCH}.tar.gz"
QUARTO_URL="https://github.com/quarto-dev/quarto-cli/releases/download/v${QUARTO_VERSION}/${QUARTO_TGZ}"

echo "[build] Downloading Quarto ${QUARTO_VERSION} (${QUARTO_ARCH})..."
curl -fsSL "$QUARTO_URL" -o /tmp/quarto.tgz

echo "[build] Extracting..."
rm -rf /tmp/quarto-extract
mkdir -p /tmp/quarto-extract
tar -xzf /tmp/quarto.tgz -C /tmp/quarto-extract

QUARTO_HOME="$(find /tmp/quarto-extract -maxdepth 1 -type d -name 'quarto-*' | head -1)"
if [[ ! -d "${QUARTO_HOME}/bin" ]]; then
  echo "[build] ERROR: could not locate quarto bin inside tarball" >&2
  ls -la /tmp/quarto-extract >&2
  exit 1
fi

export PATH="${QUARTO_HOME}/bin:${PATH}"
quarto --version

RENDER_ARGS=()
if [[ -n "${R2_BASE_URL:-}" ]]; then
  echo "[build] R2_BASE_URL is set — passing to Quarto as r2-base-url"
  RENDER_ARGS+=( -P "r2-base-url:${R2_BASE_URL}" )
else
  echo "[build] WARNING: R2_BASE_URL not set — charts will show 'not configured' in the built site"
fi

echo "[build] quarto render ${RENDER_ARGS[*]:-}"
quarto render "${RENDER_ARGS[@]}"

echo "[build] Done. Output: ${ROOT}/_site"
