# Lemma TypeScript SDK

TypeScript/browser SDK for Lemma pod-scoped APIs, with a generated OpenAPI client plus a higher-level `LemmaClient` facade.

## What is in this repo

- `src/openapi_client/`: generated typed OpenAPI client
- `src/`: ergonomic SDK facade, auth helpers, React helpers
- `scripts/generate_openapi_client.sh`: regenerate `src/openapi_client`
- `examples/todo-app/`: sample React app for local verification

## Regenerate the typed client

From this directory:

```bash
bash scripts/generate_openapi_client.sh
```

To generate from the running local HTTPS API:

```bash
OPENAPI_SOURCE=url \
OPENAPI_URL=https://localhost/openapi.json \
OPENAPI_INSECURE=1 \
bash scripts/generate_openapi_client.sh
```

Useful environment variables:

- `LEMMA_BACKEND_ROOT=/abs/path/to/gappy-backend`
- `OPENAPI_SOURCE=app|url`
- `OPENAPI_URL=https://localhost/openapi.json`
- `OPENAPI_INSECURE=1` for self-signed local HTTPS

## Build the SDK

```bash
npm run build
```

This produces:

- `dist/` for package consumers
- `public/lemma-client.js` for the browser bundle

## Auth model

The SDK supports both:

- cookie/session auth via `credentials: "include"` for the normal browser flow
- Bearer token injection via `?lemma_token=...` or `sessionStorage/localStorage`

`LemmaClient` uses the generated OpenAPI services underneath, but keeps auth/session behavior aligned with the browser app flow.

## Using the SDK

```ts
import { LemmaClient } from "@lemma/client";

const client = new LemmaClient({
  apiUrl: "/api",
  authUrl: "http://localhost:4173",
  podId: "<pod-id>",
});

await client.initialize();
const todos = await client.records.list("default", "todos", { limit: 20 });
```

The package also re-exports the generated models and services from `src/openapi_client`.

## Local sample app

The sample app runs on `5173` and proxies `/api` to `https://localhost` with `secure: false`, so the browser can exercise the local cookie-auth flow without CORS trouble.

Run it from this directory:

```bash
cd examples/todo-app
npm install
npm run dev
```

Environment variables:

- `VITE_LEMMA_API_URL=/api`
- `VITE_LEMMA_AUTH_URL=http://localhost:4173`
- `VITE_LEMMA_POD_ID=<pod-id>`

## Notes

- Regenerate `src/openapi_client` whenever the backend OpenAPI changes.
- The ergonomic namespaces should stay thin and defer to generated services/models wherever possible.
