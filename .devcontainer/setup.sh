#!/usr/bin/env bash
# Prepare the Codespace. Idempotent: safe to re-run, and safe on a rebuild.
set -euo pipefail

cd "$(dirname "$0")/.."

say() { printf '\n\033[1m%s\033[0m\n' "$1"; }

say "Node"
node --version
npm --version

# There are no runtime dependencies to install: the platform is served as-is. `npm start`
# fetches http-server through npx, so warm that cache now rather than on first serve.
say "Warming the static server"
npx --yes http-server --version >/dev/null 2>&1 && echo "http-server ready"

# The workbook pipeline in docs/endpoint-estate/tools needs one library.
say "Workbook tooling"
python3 -m pip install --quiet --user --upgrade openpyxl
python3 -c "import openpyxl; print('openpyxl', openpyxl.__version__)"

# The same gate CI runs. If this fails, the Codespace is not ready — fix it before serving.
say "Verifying the platform"
npm test

say "Ready"
cat <<'EOF'
  npm start                    serve the platform on http://localhost:8080
  npm test                     the full verification gate (what CI runs)
  npm run config:local         write config/config.local.js from the example (placeholders)
  npm run estate:report        duplication + cross-source report on the workbook

  This branch carries ONE runnable platform: the internal operator platform, served
  from index.html. The public document portal is a separate application and is not
  in this branch.
EOF
