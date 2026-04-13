# Lemma TypeScript SDK

`lemma-sdk` is the standalone TypeScript SDK for Lemma.

It includes:

- a typed `LemmaClient`
- generated OpenAPI bindings in `src/openapi_client`
- auth helpers and SSE utilities
- headless React hooks and auth primitives under `lemma-sdk/react`
- shadcn-style registry sources in `registry/*`
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
npm run registry:build
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

`lemma-sdk/react` is intentionally headless-first. It ships hooks plus auth primitives like `AuthGuard`, but not stock assistant UI components.

Use the registry blocks in this repo for prebuilt UI, or compose your own interface with hooks like these:

```tsx
import {
  AuthGuard,
  useAssistantController,
  useConversation,
  useConversationMessages,
  useConversations,
  useAgentRun,
  useForeignKeyOptions,
  useJoinedRecords,
  useMembers,
  useRecordForm,
  useRecordSchema,
  useWorkflowStart,
} from "lemma-sdk/react";

const conversations = useConversations({
  client,
  podId: "<pod-id>",
  assistantName: "support_assistant",
});
const thread = useConversationMessages({
  client,
  podId: "<pod-id>",
  conversationId: conversations.effectiveSelectedConversationId,
});
const controller = useAssistantController({
  client,
  podId: "<pod-id>",
  assistantName: "support_assistant",
});
const { members } = useMembers({ client, podId: "<pod-id>" });
const { finalOutput, start: runAgent } = useAgentRun({
  client,
  podId: "<pod-id>",
  agentName: "support_agent",
});
const { start: startWorkflow, inputSchema } = useWorkflowStart({
  client,
  podId: "<pod-id>",
  workflowName: "intake_flow",
});
const { records } = useJoinedRecords({
  client,
  podId: "<pod-id>",
  query: {
    from: { table: "tickets", alias: "t" },
    select: ["t.id", "t.title", { expression: "u.email", as: "assignee_email" }],
    joins: [{ table: "users", alias: "u", type: "left", on: { left: "t.assignee_id", right: "u.id" } }],
    orderBy: [{ field: "t.created_at", direction: "desc" }],
    limit: 20,
  },
});
const { options: assigneeOptions } = useForeignKeyOptions({
  client,
  podId: "<pod-id>",
  tableName: "tickets",
  columnName: "assignee_id",
});
const { editableFields } = useRecordSchema({
  client,
  podId: "<pod-id>",
  tableName: "tickets",
});
const ticketForm = useRecordForm({
  client,
  podId: "<pod-id>",
  tableName: "tickets",
  initialValues: { status: "open" },
});
```

`AuthGuard` stays in `lemma-sdk/react`:

```tsx
import { AuthGuard } from "lemma-sdk/react";

<AuthGuard client={client}>
  <App />
</AuthGuard>;
```

When `client.podId` is set and the signed-in user is not a pod member, `AuthGuard` automatically renders a request-access state and can create/view pod join requests.

For cross-table reads outside React, the core client now exposes a datastore query helper:

```ts
const result = await client.datastore.query(
  "SELECT t.id, t.title, u.email AS assignee_email FROM tickets t LEFT JOIN users u ON t.assignee_id = u.id LIMIT 20",
);
```

## Shadcn Registry

This repo includes a shadcn registry source at `registry.json` and generated flat registry output under `public/r`.

Build the hosted registry payload with:

```bash
npm run registry:build
```

That produces:

- `public/r/registry.json`
- `public/r/<item-name>.json`

Registry source files live under `registry/default/*` and are designed to stay close to stock shadcn/ui primitives while consuming `lemma-sdk/react`.

Example direct install from a hosted registry:

```bash
npx shadcn@latest add https://your-domain.example/r/lemma-records-page.json
```

Example namespace configuration in `components.json`:

```json
{
  "registries": {
    "@lemma": "https://cdn.jsdelivr.net/gh/gappyai/lemma-typescript@main/public/r/{name}.json"
  }
}
```

For short-term testing, jsDelivr works well against the public GitHub repo. Its GitHub-backed URL shape is:

```json
{
  "registries": {
    "@lemma": "https://cdn.jsdelivr.net/gh/<owner>/<repo>@<ref>/public/r/{name}.json"
  }
}
```

Because jsDelivr serves files from the repository itself, the generated `public/r` files need to be committed on the branch, tag, or commit you reference.

Then consumers can install blocks with:

```bash
npx shadcn@latest add @lemma/lemma-records-page
```

Current Lemma registry items include assistant and records building blocks such as:

- `lemma-assistant-experience`
- `lemma-assistant-embedded`
- `lemma-records-page`
- `lemma-record-form`
- `lemma-records-table`
- `lemma-workflow-start-form`

For a stable test registry, prefer pinning jsDelivr to a tag or commit SHA instead of `@main`.

If you later want a first-party hosted endpoint, GitHub Pages also works. A project-site URL usually looks like:

```json
{
  "registries": {
    "@lemma": "https://<owner>.github.io/<repo>/r/{name}.json"
  }
}
```

To get into the official shadcn open-source registry index, first deploy this flat `/r` output on a public HTTPS endpoint, then submit the registry to the shadcn index repo. Per the current shadcn docs, the hosted registry must stay flat at the root of the endpoint, with `registry.json` and item JSON files like `/<name>.json`.

This repo also includes a GitHub Pages workflow at `.github/workflows/deploy-registry-pages.yml` that publishes the generated `public/r` output on pushes to `main` or `master`.
If Pages has not been enabled for the repository yet, either enable GitHub Pages manually in the repo settings and choose GitHub Actions as the source, or add a `PAGES_ENABLEMENT_TOKEN` secret with the required Pages/admin permissions so the workflow can enable it automatically.

For npm releases, `.github/workflows/publish-npm.yml` is set up for trusted publishing from GitHub Actions. You still need to configure the matching trusted publisher for this repository on npm before automated publishes will succeed, and the workflow filename must match exactly.

## Browser Bundle

The package also ships a browser bundle:

- export path: `lemma-sdk/browser-bundle`
- bundled file: `dist/browser/lemma-client.js`
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

`["expenses"]` is not valid.
