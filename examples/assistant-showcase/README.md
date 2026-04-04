# Assistant Showcase Example

Minimal test app for comparing the SDK assistant surfaces without adding app-specific CSS.

## What it shows

- `AssistantExperienceView`
- `AssistantEmbedded`
- A custom shell composed from the exported chrome primitives

## Run it

```bash
cd examples/assistant-showcase
cp .env.example .env
```

Fill in:

- `VITE_LEMMA_POD_ID`
- `VITE_LEMMA_ASSISTANT_ID`

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

## npm safety

This example is intentionally outside the SDK publish artifact. The root package only publishes `dist`, so `examples/assistant-showcase` will not be included in the npm package.
