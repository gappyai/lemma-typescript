# Lemma TypeScript SDK (`lemma-sdk`)

Official TypeScript SDK for Lemma APIs with:

- Pod-scoped namespaces (`tables`, `records`, `files`, `assistants`,`agents` , `workflows`, `tasks`, .)
- Built-in auth/session handling
- SSE streaming helpers
- React hooks and assistant UI components

## Install

```bash
npm i lemma-sdk
```

## Quick Start

```ts
import { LemmaClient } from "lemma-sdk";

const client = new LemmaClient({
  apiUrl: "https://api.lemma.work",
  authUrl: "https://auth.lemma.work/auth",
  podId: "<pod-id>",
});

await client.initialize();

const tables = await client.tables.list();
const assistants = await client.assistants.list({ limit: 20 });
const supportAssistant = await client.assistants.get("support_assistant");
```

## Configuration

`LemmaClient` config resolution order:

1. Constructor overrides
2. `window.__LEMMA_CONFIG__`
3. Environment variables
4. Defaults

Supported env keys:

- `VITE_LEMMA_API_URL`, `REACT_APP_LEMMA_API_URL`, `LEMMA_API_URL`
- `VITE_LEMMA_AUTH_URL`, `REACT_APP_LEMMA_AUTH_URL`, `LEMMA_AUTH_URL`
- `VITE_LEMMA_POD_ID`, `REACT_APP_LEMMA_POD_ID`, `LEMMA_POD_ID`

Defaults when unset:

- `apiUrl`: `http://localhost:8000`
- `authUrl`: `http://localhost:3000`

## Pod Scoping

Most namespaces are pod-scoped. You can set pod scope in three ways:

```ts
client.setPodId("pod_a");

const podBClient = client.withPod("pod_b");

const conversations = await client.conversations.list({ pod_id: "pod_c" });
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

## CRUD Examples

### Tables + Records

```ts
await client.tables.create({ name: "todos" });

await client.records.create("todos", {
  title: "Ship docs rewrite",
  status: "todo",
});

const page = await client.records.list("todos", {
  limit: 20,
  sort: [{ field: "created_at", direction: "desc" }],
});
```

### Files (Datastore)

```ts
await client.files.folder.create("reports", { directoryPath: "/" });
await client.files.upload(fileBlob, { directoryPath: "/reports", name: "q1.pdf" });

const listing = await client.files.list({ directoryPath: "/reports" });
const downloaded = await client.files.download("/reports/q1.pdf");
```

### Assistants + Conversations

```ts
await client.assistants.create({
  name: "support_assistant",
  instruction: "Help with support triage.",
});

const conversation = await client.conversations.createForAssistant("support_assistant", {
  title: "Ticket review",
});

await client.conversations.messages.send(conversation.id, {
  content: "Summarize unresolved issues from today.",
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

## Streaming (SSE)

Use `readSSE` + `parseSSEJson` for incremental events.

```ts
import { readSSE, parseSSEJson } from "lemma-sdk";

const stream = await client.conversations.sendMessageStream(conversationId, {
  content: "Analyze recent incidents",
});

for await (const event of readSSE(stream)) {
  const payload = parseSSEJson(event);
  if (!payload) continue;
  console.log(event.event, payload);
}
```

Task stream example:

```ts
const task = await client.tasks.create({
  agent_name: "triage_agent",
  input_data: { ticketId: "TCK-1042" },
});

const taskStream = await client.tasks.stream(task.id);
```

## Access Grants (`accessible_tables`)

When creating agents/functions/assistants, `accessible_tables` must use object entries:

```ts
import { TableAccessMode } from "lemma-sdk";

accessible_tables: [
  { table_name: "expenses", mode: TableAccessMode.READ },
  { table_name: "expense_notes", mode: TableAccessMode.WRITE },
];
```

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
