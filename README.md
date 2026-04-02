# Lemma TypeScript SDK (`lemma-sdk`)

Official TypeScript SDK for Lemma APIs with pod-scoped namespaces, auth helpers, streaming support, and reusable React hooks.

## Install

```bash
npm i lemma-sdk
```

For local workspace development against the checked-out SDK instead of npm:

```bash
npm i file:../lemma-typescript
```

If you want to import as `lemma`, use npm aliasing:

```bash
npm i lemma@npm:lemma-sdk
```

## Quick Start

```ts
import { LemmaClient } from "lemma-sdk";

const client = new LemmaClient({
  apiUrl: "https://api-next.asur.work",
  authUrl: "https://auth.asur.work/auth",
  podId: "<pod-id>",
});

await client.initialize();

const tables = await client.tables.list();
const assistants = await client.assistants.list({ limit: 20 });
const supportAssistant = await client.assistants.get("support_assistant");
```

## Core Concepts

- `LemmaClient`: entrypoint with auth + API transport.
- Namespace APIs (`client.agents`, `client.tasks`, `client.conversations`, etc.) for typed operations.
- `client.request(method, path, options)` escape hatch for endpoints not yet modeled.
- `client.resources` for generic file resource APIs (`conversation`, `assistant`, `task`, etc.).
- Ergonomic type aliases exported at top level: `Agent`, `Assistant`, `Conversation`, `Task`, `TaskMessage`, `CreateAgentInput`, `CreateAssistantInput`, etc.
- `client.withPod(podId)` returns a pod-scoped client that shares auth state with the parent client.

## Table Access Grants (`accessible_tables`)

For function, agent, and assistant payloads, `accessible_tables` must be an array of objects:

- `table_name`: target table
- `mode`: `READ` or `WRITE`

`accessible_tables: ["table_name"]` is no longer valid.

You do not pass a datastore name in SDK calls. Table and file operations are pod-scoped (`client.tables`, `client.records`, `client.files`) and take table/file identifiers directly.

Examples:

```ts
import {
  TableAccessMode,
  type CreateFunctionRequest,
  type CreateAgentInput,
  type CreateAssistantInput,
} from "lemma-sdk";

const functionPayload: CreateFunctionRequest = {
  name: "expense_summary",
  code: "def handler(ctx):\n    return {'ok': True}",
  config: {},
  accessible_tables: [
    { table_name: "expenses", mode: TableAccessMode.READ },
    { table_name: "expense_summaries", mode: TableAccessMode.WRITE },
  ],
  accessible_folders: ["/reports"],
  accessible_applications: [],
};

const agentPayload: CreateAgentInput = {
  name: "expense-summarizer",
  instruction: "Summarize expenses without mutating data.",
  tool_sets: [],
  accessible_tables: [
    { table_name: "expenses", mode: TableAccessMode.READ },
    { table_name: "expense_notes", mode: TableAccessMode.WRITE },
  ],
  accessible_folders: [],
  accessible_applications: [],
};

const assistantPayload: CreateAssistantInput = {
  name: "expense_assistant",
  instruction: "Answer expense questions and save approved notes.",
  tool_sets: [],
  accessible_tables: [
    { table_name: "expenses", mode: TableAccessMode.READ },
    { table_name: "expense_notes", mode: TableAccessMode.WRITE },
  ],
  accessible_folders: ["/notes"],
  accessible_applications: [],
};
```

## Auth Helpers

```ts
import { LemmaClient, buildAuthUrl, resolveSafeRedirectUri } from "lemma-sdk";

const client = new LemmaClient({
  apiUrl: "https://api-next.asur.work",
  authUrl: "https://auth.asur.work/auth",
});

// Build auth URLs (server/client)
const loginUrl = buildAuthUrl(client.authUrl, { redirectUri: "https://app.asur.work/" });
const signupUrl = buildAuthUrl(client.authUrl, { mode: "signup", redirectUri: "https://app.asur.work/" });

// Redirect safety helper for auth route handlers
const safeRedirect = resolveSafeRedirectUri("/pod/123", {
  siteOrigin: "https://app.asur.work",
  fallback: "/",
});

// Browser helpers
await client.auth.checkAuth();
await client.auth.signOut();
const token = await client.auth.getAccessToken();
const refreshed = await client.auth.refreshAccessToken();
client.auth.redirectToAuth({ mode: "signup", redirectUri: safeRedirect });
```

### Browser Testing With Injected Token

For desk and app testing, the SDK supports a fixed bearer token injected through localStorage.
This is the only supported browser token-injection path.

```ts
import { LemmaClient, setTestingToken, clearTestingToken } from "lemma-sdk";

setTestingToken("<access-token>");

const client = new LemmaClient({
  apiUrl: "/api",
  authUrl: "http://localhost:4173",
  podId: "<pod-id>",
});

await client.initialize();

clearTestingToken();
```

Equivalent manual browser setup:

```js
localStorage.setItem("lemma_token", "<access-token>");
window.location.reload();
```

Notes:

- do not pass testing tokens in query parameters
- prefer a same-origin dev proxy such as Vite `/api` during local browser testing to avoid CORS on `/users/me`
- production auth should use the normal cookie/session flow

## Assistants + Agent Runs

### Assistant names (resource key)

Assistant CRUD is name-based:

```ts
await client.assistants.get("support_assistant");
await client.assistants.update("support_assistant", { description: "Handles support triage" });
await client.assistants.delete("old_assistant");
```

### Conversation scoping by assistant name

```ts
const conversations = await client.conversations.list({
  assistantName: "support_assistant",
  limit: 20,
});

const conversation = await client.conversations.createForAssistant("support_assistant", {
  title: "Ticket triage",
});
```

### Conversations with SSE streaming

```ts
const stream = await client.conversations.sendMessageStream(conversationId, {
  content: "Find open support tickets from yesterday",
});

for await (const event of readSSE(stream)) {
  const payload = parseSSEJson(event);
  if (!payload) continue;
  console.log(payload);
}
```

### Task runs with SSE streaming

```ts
const task = await client.tasks.create({
  agentId: "triage-agent",
  input: { ticketId: "TCK-1042" },
  runtimeAccountIds: ["acc_123"],
});

const stream = await client.tasks.stream(task.id);
for await (const event of readSSE(stream)) {
  const payload = parseSSEJson(event);
  if (!payload) continue;
  console.log(payload);
}
```

## React Helpers

Import from `lemma-sdk/react`:

- `useAuth(client)`
- `AuthGuard`
- `useAgentRunStream(...)`
- `useAssistantRun(...)`
- `useAssistantSession(...)`
- `useTaskSession(...)`
- `useFunctionSession(...)`
- `useFlowSession(...)`

Core run helpers from `lemma-sdk`:

- `normalizeRunStatus(...)`
- `isTerminalTaskStatus(...)`
- `isTerminalFunctionStatus(...)`
- `isTerminalFlowStatus(...)`
- `parseTaskStreamEvent(...)`
- `upsertTaskMessage(...)`
- `parseAssistantStreamEvent(...)`
- `upsertConversationMessage(...)`

Example:

```tsx
import { useAssistantRun } from "lemma-sdk/react";

const { sendMessage, stop, isStreaming } = useAssistantRun({
  client,
  podId,
  conversationId,
  onEvent: (event, payload) => {
    console.log(event.event, payload);
  },
});
```

For the SDK consumption UI roadmap (AssistantChat / FunctionInvokeForm / FlowRunExperience / RunPanel), see:

- `docs/sdk-consumption-ui-v2.md`

## File Resources

```ts
await client.resources.upload("conversation", conversationId, file);
const files = await client.resources.list("conversation", conversationId);
```

## Migration Tips

When migrating from direct `fetch`/custom API clients:

1. Replace auth/session bootstrapping with `LemmaClient`.
2. Move pod-scoped calls into namespaces (`tasks`, `assistants`, `conversations`, etc.).
3. Keep rare/unmodeled endpoints on `client.request(...)` temporarily.
4. Replace SSE parsing code with `readSSE` + `parseSSEJson`.
5. Gradually lift app-specific run/chat logic into reusable hooks in `lemma-sdk/react`.

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

### Release check

```bash
npm run release:check
```

### Publish

```bash
npm publish
```

As of March 26, 2026, npm package name `lemma` is already taken. This package publishes as `lemma-sdk`.
