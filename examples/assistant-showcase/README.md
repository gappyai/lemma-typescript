# Assistant Showcase Example

Test app for comparing the SDK assistant surfaces and exercising the new hook/registry playground without adding app-specific CSS.

## What it shows

- local registry-style assistant components copied from `registry/default/lemma-assistant-embedded`
- headless assistant hooks from `lemma-sdk/react`
- A custom shell composed from the exported chrome primitives
- A resource playground for tables, agents, workflows, record forms, and joined-record previews

## Run it

```bash
cd examples/assistant-showcase
cp .env.example .env
```

Fill in:

- `VITE_LEMMA_POD_ID`
- `VITE_LEMMA_ASSISTANT_NAME`

Optional:

- `VITE_LEMMA_API_URL`
- `VITE_LEMMA_AUTH_URL`
- `VITE_LEMMA_ORGANIZATION_ID`

Then start it:

```bash
npm install
npm run dev
```

Open the printed local URL and sign in normally, or set a testing token in the browser:

```js
localStorage.setItem("lemma_token", "<access-token>");
window.location.reload();
```

Use the top navigation in the app to switch between:

- `Assistant UI`
- `Resources`

## npm safety

This example is intentionally outside the SDK publish artifact. The root package only publishes `dist`, so `examples/assistant-showcase` will not be included in the npm package.
