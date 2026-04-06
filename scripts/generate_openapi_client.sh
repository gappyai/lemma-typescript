#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_DIR="$SCRIPT_DIR/.."
BACKEND_ROOT="${LEMMA_BACKEND_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
SPEC_TMP="$SDK_DIR/.generated/openapi.json"
OUT_DIR="$SDK_DIR/src/openapi_client"

normalize_json_file() {
  local json_path="$1"
  local python_bin="python"
  if ! command -v "$python_bin" >/dev/null 2>&1; then
    python_bin="python3"
  fi
  "$python_bin" - "$json_path" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
data = json.loads(path.read_text(encoding="utf-8"))
path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")
PY
}

# Derive the OpenAPI URL from LEMMA_API_URL if set (recommended pattern):
#   LEMMA_API_URL=https://api.lemma.work OPENAPI_SOURCE=url bash generate_openapi_client.sh
# Or explicitly:
#   OPENAPI_URL=https://api.lemma.work/openapi.json OPENAPI_SOURCE=url bash generate_openapi_client.sh
if [[ -n "${LEMMA_API_URL:-}" ]]; then
  OPENAPI_URL="${OPENAPI_URL:-${LEMMA_API_URL%/}/openapi.json}"
  OPENAPI_SOURCE="${OPENAPI_SOURCE:-url}"
fi
OPENAPI_URL="${OPENAPI_URL:-http://127.0.0.1:8000/openapi.json}"

CURL_ARGS=()
if [[ "${OPENAPI_INSECURE:-0}" == "1" || "${LEMMA_SSL_NO_VERIFY:-0}" == "1" ]]; then
  CURL_ARGS+=("-k")
fi

mkdir -p "$SDK_DIR/.generated"

if [[ "${OPENAPI_SOURCE:-app}" == "url" ]]; then
  if [[ ${#CURL_ARGS[@]} -gt 0 ]]; then
    curl "${CURL_ARGS[@]}" -fsS "$OPENAPI_URL" -o "$SPEC_TMP"
  else
    curl -fsS "$OPENAPI_URL" -o "$SPEC_TMP"
  fi
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

normalize_json_file "$SPEC_TMP"

cd "$SDK_DIR"
npx --yes openapi-typescript-codegen \
  --input "$SPEC_TMP" \
  --output "$OUT_DIR" \
  --client fetch

node "$SDK_DIR/scripts/patch_generated_imports.mjs" "$OUT_DIR"

echo "Generated typed TypeScript client in src/openapi_client"
