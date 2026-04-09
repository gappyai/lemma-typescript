# Lemma TypeScript SDK

`lemma-sdk` is the standalone TypeScript SDK for Lemma.

It includes:

- a typed `LemmaClient`
- generated OpenAPI bindings in `src/openapi_client`
- auth helpers and SSE utilities
- React hooks and assistant UI components under `lemma-sdk/react`
- a browser bundle export at `lemma-sdk/browser-bundle`

## Defaults

By default, the SDK targets the hosted services:

- API base URL: `https://api.asur.work`
- Auth URL: `https://auth.asur.work`

You can override them with constructor config, `window.__LEMMA_CONFIG__`, or environment variables.

## Install

```bash
npm install lemma-sdk
```

## Local Development

From the root of this repository:

```bash
npm install
npm run build
```

To test the package from a local checkout in another project:

```bash
npm install /absolute/path/to/lemma-typescript
```

To install directly from the repo:

```bash
npm install github:gappyai/lemma-typescript
```

## Quick Start

```ts
import { LemmaClient } from "lemma-sdk";

const client = new LemmaClient({
  podId: "<pod-id>",
});

await client.initialize();

const tables = await client.tables.list();
const assistants = await client.assistants.list({ limit: 20 });
```

You only need to pass `apiUrl` or `authUrl` when you want to override the hosted defaults.

## Configuration

Resolution order:

1. Constructor overrides
2. `window.__LEMMA_CONFIG__`
3. Environment variables
4. Hosted defaults

Supported env keys:

- `VITE_LEMMA_API_URL`
- `REACT_APP_LEMMA_API_URL`
- `LEMMA_API_URL`
- `VITE_LEMMA_AUTH_URL`
- `REACT_APP_LEMMA_AUTH_URL`
- `LEMMA_AUTH_URL`
- `VITE_LEMMA_POD_ID`
- `REACT_APP_LEMMA_POD_ID`
- `LEMMA_POD_ID`

Hosted defaults:

- `apiUrl`: `https://api.asur.work`
- `authUrl`: `https://auth.asur.work`

Local override example:

```ts
const client = new LemmaClient({
  apiUrl: "http://127.0.0.1:8000",
  authUrl: "http://localhost:4173",
  podId: "<pod-id>",
});
```

## Common Usage

```ts
client.setPodId("pod_a");

const podBClient = client.withPod("pod_b");

const tables = await client.tables.list();
const records = await client.records.list("todos");
const files = await client.files.list({ directoryPath: "/" });
```

## Namespace Overview

Common pod-scoped namespaces:

- `client.tables`
- `client.records`
- `client.files`
- `client.functions`
- `client.agents`
- `client.tasks`
- `client.assistants`
- `client.workflows`
- `client.desks`
- `client.integrations`
- `client.resources`

Org/user-level namespaces:

- `client.users`
- `client.icons`
- `client.pods`
- `client.podMembers`
- `client.podJoinRequests`
- `client.organizations`
- `client.podSurfaces`

Escape hatch for unmapped endpoints:

```ts
const result = await client.request("GET", "/models");
```

Example assistant flow:

```ts
const conversation = await client.conversations.createForAssistant("support_assistant", {
  title: "Support thread",
});

await client.conversations.messages.send(conversation.id, {
  content: "Summarize unresolved issues.",
});
```

### Pod Join Requests

```ts
// Current user requests access to a pod
await client.podJoinRequests.create("pod_123");

// Current user's pending request (or null)
const mine = await client.podJoinRequests.me("pod_123");

// Admin view of requests for a pod
const requests = await client.podJoinRequests.list("pod_123", {
  status: "PENDING",
  limit: 50,
});

// Admin approval (defaults: ORG_MEMBER + POD_USER)
await client.podJoinRequests.approve("pod_123", "join_req_abc", {
  org_role: "ORG_MEMBER",
  pod_role: "POD_USER",
});
```

## Streaming

```ts
import { parseSSEJson, readSSE } from "lemma-sdk";

const stream = await client.conversations.sendMessageStream(conversationId, {
  content: "Analyze recent incidents",
});

for await (const event of readSSE(stream)) {
  const payload = parseSSEJson(event);
  if (!payload) continue;
  console.log(event.event, payload);
}
```

## Auth

The SDK uses session/cookie auth by default.

For local browser testing, token injection helpers are available:

```ts
import { clearTestingToken, setTestingToken } from "lemma-sdk";

setTestingToken("<access-token>");
clearTestingToken();
```

Useful helpers:

- `buildAuthUrl(...)`
- `buildFederatedLogoutUrl(...)`
- `resolveSafeRedirectUri(...)`
- `client.auth.redirectToAuth(...)`
- `client.auth.redirectToFederatedLogout(...)`

## React Package

React utilities are available from `lemma-sdk/react`.

Install React in your app if needed:

```bash
npm install react react-dom
```

Import the stylesheet once:

```tsx
import "lemma-sdk/react/styles.css";
```

Minimal assistant embed:

```tsx
import { AssistantEmbedded } from "lemma-sdk/react";

<AssistantEmbedded
  client={client}
  podId="<pod-id>"
  assistantName="support_assistant"
  title="Support Assistant"
  placeholder="Message Support Assistant"
  showConversationList
/>;
```

## Browser Bundle

The package also ships a browser bundle:

- export path: `lemma-sdk/browser-bundle`
- bundled file: `dist/browser/lemma-client.js`
- global: `window.LemmaClient.LemmaClient`

## Regenerate the OpenAPI Client

Regenerate the typed client from the hosted API:

```bash
bash scripts/generate_openapi_client.sh
```

The generator defaults to:

```text
https://api.asur.work/openapi.json
```

For local backend generation, override the URL:

```bash
LEMMA_API_URL=http://127.0.0.1:8000 bash scripts/generate_openapi_client.sh
```

Or:

```bash
OPENAPI_URL=http://127.0.0.1:8000/openapi.json OPENAPI_INSECURE=1 bash scripts/generate_openapi_client.sh
```

Supported generator env vars:

- `LEMMA_API_URL`
- `OPENAPI_URL`
- `OPENAPI_INSECURE`
- `LEMMA_SSL_NO_VERIFY`

## Build

```bash
npm run build
```

## Payload Note: `accessible_tables`

When creating agents, assistants, or functions, `accessible_tables` must contain object entries:

```ts
import { TableAccessMode } from "lemma-sdk";

accessible_tables: [
  { table_name: "expenses", mode: TableAccessMode.READ },
  { table_name: "expense_notes", mode: TableAccessMode.WRITE },
];
```

<<<<<<< HEAD
`["expenses"]` is not valid.

## Auth

Default mode is cookie/session auth (`credentials: "include"`).

For local browser testing, token injection is supported via local storage key `lemma_token`:

```ts
import { setTestingToken, clearTestingToken } from "lemma-sdk";

setTestingToken("<access-token>");
clearTestingToken();
```

Auth helpers:

- `buildAuthUrl(...)`
- `buildFederatedLogoutUrl(...)`
- `resolveSafeRedirectUri(...)`
- `client.auth.redirectToAuth(...)`
- `client.auth.redirectToFederatedLogout(...)`

## React Package (`lemma-sdk/react`)

Includes auth helpers, run hooks, and assistant UI primitives.

Install React peer dependency in your app if not already installed:

```bash
npm i react react-dom
```

Import stylesheet once:

```tsx
import "lemma-sdk/react/styles.css";
```

Fastest assistant integration:

```tsx
import { AssistantEmbedded } from "lemma-sdk/react";

<div style={{ height: 720, minHeight: 0 }}>
  <AssistantEmbedded
    client={client}
    podId="<pod-id>"
    assistantName="support_assistant"
    title="Support Assistant"
    placeholder="Message Support Assistant"
    showConversationList
  />
</div>;
```

Auth guard example:

```tsx
import { AuthGuard } from "lemma-sdk/react";

<AuthGuard client={client}>
  <App />
</AuthGuard>;
```

When `client.podId` is set and the signed-in user is not a pod member, `AuthGuard` automatically renders a request-access state and can create/view pod join requests.

## Browser Bundle

The package also ships a standalone browser bundle:

- npm artifact path: `dist/browser/lemma-client.js`
- export path: `lemma-sdk/browser-bundle`
- global: `window.LemmaClient.LemmaClient`

Example:

```html
<script src="https://unpkg.com/lemma-sdk@latest/dist/browser/lemma-client.js"></script>
<script>
  const client = new window.LemmaClient.LemmaClient({
    apiUrl: "https://api.lemma.work",
    authUrl: "https://auth.lemma.work/auth",
    podId: "<pod-id>"
  });
</script>
```
=======
Plain string arrays like `["expenses"]` are not valid.
>>>>>>> 78c8809 (update sdk)
