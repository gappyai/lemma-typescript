#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_DIR="$SCRIPT_DIR/.."
BACKEND_ROOT="${LEMMA_BACKEND_ROOT:-$(cd "$SCRIPT_DIR/../../.." && pwd)}"
SPEC_TMP="$SDK_DIR/.generated/openapi.json"
OUT_DIR="$SDK_DIR/src/openapi_client"
OPENAPI_URL="${OPENAPI_URL:-http://127.0.0.1:8000/openapi.json}"

mkdir -p "$SDK_DIR/.generated"

if [[ "${OPENAPI_SOURCE:-app}" == "url" ]]; then
  curl -fsS "$OPENAPI_URL" -o "$SPEC_TMP"
  echo "Fetched OpenAPI spec from $OPENAPI_URL"
else
  (
    cd "$BACKEND_ROOT"
    PYTHONPATH="$BACKEND_ROOT${PYTHONPATH:+:$PYTHONPATH}" uv run python - "$SPEC_TMP" <<'PY'
import json
import sys

from app.app import create_app

target = sys.argv[1]
app = create_app()
with open(target, "w", encoding="utf-8") as f:
    json.dump(app.openapi(), f, indent=2)
PY
  )
  echo "Generated OpenAPI spec from app.app:create_app"
fi

cd "$SDK_DIR"
rm -rf "$OUT_DIR"
npx --yes openapi-typescript-codegen \
  --input "$SPEC_TMP" \
  --output "$OUT_DIR" \
  --client fetch

node "$SDK_DIR/scripts/patch_generated_imports.mjs" "$OUT_DIR"

echo "Generated typed TypeScript client in src/openapi_client"
