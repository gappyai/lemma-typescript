# Lemma TypeScript SDK

Official TypeScript SDK for Lemma pod-scoped APIs.

- High-level `LemmaClient` namespaces for common workflows
- React helpers (`lemma-sdk/react`) for auth-gated apps
- Re-exported generated OpenAPI services and model types
- Browser standalone bundle (`dist/browser/lemma-client.js`)

## Install

```bash
npm i lemma-sdk
```

If you want to import as `lemma`, use npm aliasing:

```bash
npm i lemma@npm:lemma-sdk
```

## Quick usage

```ts
import { LemmaClient } from "lemma-sdk";

const client = new LemmaClient({
  apiUrl: "/api",
  authUrl: "http://localhost:4173",
  podId: "<pod-id>",
});

await client.initialize();
const todos = await client.records.list("default", "todos", { limit: 20 });
```

## Development

### Regenerate OpenAPI client

```bash
bash scripts/generate_openapi_client.sh
```

### Build SDK

```bash
npm run build
```

Output:

- `dist/` npm package artifacts
- `dist/browser/lemma-client.js` standalone browser bundle
- `public/lemma-client.js` committed copy for static serving

## Publishing

As of March 26, 2026, npm package name `lemma` is already taken. This repo is configured to publish as `lemma-sdk`.

Release check:

```bash
npm run release:check
```

Publish:

```bash
npm publish
```

`lemma-sdk` is unscoped, so npm publishes it as public by default.
