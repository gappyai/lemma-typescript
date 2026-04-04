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

### React assistant UI

`lemma-sdk/react` ships the assistant controller, the default assistant experience, and the lower-level UI primitives used to build custom shells.

Import the bundled stylesheet once anywhere in your app:

```tsx
import "lemma-sdk/react/styles.css";
```

The stylesheet includes the SDK theme tokens and semantic assistant classes. You do not need the Lemma app's internal Tailwind setup just to render the assistant correctly.

#### Important for Tailwind apps

If your app uses Tailwind and installs `lemma-sdk` from npm, Tailwind must scan the SDK package too. Otherwise the assistant can look half-styled: native file inputs may appear, layouts can collapse, spacing disappears, and buttons/header chrome look wrong.

For Tailwind v3, add the SDK package to `content`:

```js
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/lemma-sdk/dist/react/**/*.{js,mjs}",
  ],
}
```

If you are developing against a local checkout of the SDK source instead of the published npm package, scan the source files too:

```js
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../lemma-typescript/src/react/**/*.{ts,tsx}",
  ],
}
```

If you alias the package to local SDK source in Vite, make sure the alias points at the React source and stylesheet:

```ts
// vite.config.ts
import path from "node:path";

export default {
  resolve: {
    alias: {
      "lemma-sdk/react/styles.css": path.resolve(__dirname, "../lemma-typescript/src/react/styles.css"),
      "lemma-sdk/react": path.resolve(__dirname, "../lemma-typescript/src/react/index.ts"),
      "lemma-sdk": path.resolve(__dirname, "../lemma-typescript/src/index.ts"),
    },
  },
};
```

Quick checklist for developers:

- import `lemma-sdk/react/styles.css` once
- give the assistant container a real height
- if the assistant is inside flex/grid, add `min-height: 0` on the relevant parent
- if you use Tailwind, scan the SDK package or SDK source
- if you use `AssistantEmbedded`, pass `theme` directly there
- if you use `AssistantExperienceView`, wrap it in `AssistantThemeScope`

The assistant UI renders markdown by default:

- GitHub-flavored markdown is enabled for assistant and user messages
- raw HTML is not rendered
- links open safely in a new tab by default
- lists, tables, blockquotes, inline code, and fenced code blocks are styled out of the box

#### Choose an integration level

##### 1. `AssistantEmbedded` for the fastest setup

Use `AssistantEmbedded` when you want a ready-made assistant surface with the SDK defaults.

```tsx
import "lemma-sdk/react/styles.css";
import { AssistantEmbedded } from "lemma-sdk/react";

function SupportAssistant() {
  return (
    <div style={{ height: 720, minHeight: 0 }}>
      <AssistantEmbedded
        client={client}
        podId="pod_123"
        assistantId="uuid"
        title="Support Assistant"
        subtitle="Ask questions about this pod."
        placeholder="Message Support Assistant"
        showConversationList
        showModelPicker={false}
        radius="lg"
        theme="auto"
      />
    </div>
  );
}
```

Important notes:

- `theme` accepts `"auto" | "light" | "dark"`
- `radius` lets you pick the built-in rounding scale from `"none"` through `"xl"`
- `showModelPicker={false}` hides the built-in model chooser when you do not want model controls visible
- `theme="auto"` follows the host app when it uses common selectors like `.dark`, `[data-theme="dark"]`, `[data-mode="dark"]`, and also falls back to `prefers-color-scheme`
- the parent container must have a real height; if it lives inside flex/grid, `min-height: 0` is usually needed too
- attachments are queued into the composer and sent with the next message by default

##### 2. `AssistantExperienceView` for the default UI with your own controller

Use `AssistantExperienceView` when you want the built-in assistant layout, but you need to own the controller lifecycle yourself.

```tsx
import "lemma-sdk/react/styles.css";
import {
  AssistantExperienceView,
  AssistantThemeScope,
  useAssistantController,
} from "lemma-sdk/react";

function ControlledAssistant() {
  const assistant = useAssistantController({
    client,
    podId: "pod_123",
    assistantId: "uuid",
  });

  return (
    <AssistantThemeScope theme="dark" style={{ height: 720 }}>
      <AssistantExperienceView
        controller={assistant}
        title="Support Assistant"
        subtitle="Direct use of the default assistant experience."
        placeholder="Message Support Assistant"
        showConversationList
        chromeStyle="subtle"
        statusPlacement="inline"
      />
    </AssistantThemeScope>
  );
}
```

Useful props on `AssistantExperienceView`:

- `showConversationList`: show the built-in conversation sidebar
- `chromeStyle`: `"elevated" | "subtle" | "flat"`
- `statusPlacement`: `"inline" | "composer" | "none"`
- `radius`: `"none" | "sm" | "md" | "lg" | "xl"`
- `showModelPicker`: show or hide the built-in model selector
- `showNewConversationButton`: show or hide the built-in reset/new-conversation button
- `renderMessageContent`: override markdown rendering for custom message content
- `renderToolInvocation`: replace the default tool activity renderer
- `renderPresentedFile` and `renderPendingFile`: customize attachment rendering

##### 3. `useAssistantController` + primitives for a custom shell

Use the primitives when you want full control over layout and app chrome.

```tsx
import "lemma-sdk/react/styles.css";
import {
  AssistantComposer,
  AssistantHeader,
  AssistantMessageViewport,
  AssistantShellLayout,
  AssistantThemeScope,
  MessageGroup,
  PlanSummaryStrip,
  ThinkingIndicator,
  buildDisplayMessageRows,
  getActiveToolBanner,
  latestPlanSummary,
  useAssistantController,
} from "lemma-sdk/react";

function CustomAssistantShell() {
  const assistant = useAssistantController({
    client,
    podId: "pod_123",
    assistantId: "uuid",
  });

  const rows = buildDisplayMessageRows(assistant.messages);
  const plan = latestPlanSummary(assistant.messages);
  const activeToolBanner = getActiveToolBanner(assistant.messages);

  return (
    <AssistantThemeScope theme="auto" style={{ height: 720 }}>
      <AssistantShellLayout
        main={(
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <AssistantHeader
              title="Lemma Assistant"
              subtitle="Ask anything"
            />

            {plan ? <PlanSummaryStrip plan={plan} onHide={() => {}} /> : null}
            {activeToolBanner ? <div>{activeToolBanner.summary}</div> : null}

            <AssistantMessageViewport>
              {rows.map((row, index) => (
                <MessageGroup
                  key={row.id}
                  message={row.message}
                  conversationId={assistant.activeConversationId}
                  onWidgetSendPrompt={(text) => assistant.sendMessage(text)}
                  isStreaming={assistant.isActiveConversationRunning && row.sourceIndexes.includes(assistant.messages.length - 1)}
                  showAssistantHeader={index === 0 || rows[index - 1]?.message.role !== "assistant"}
                  renderMessageContent={({ message }) => <div>{message.content}</div>}
                />
              ))}

              {assistant.isActiveConversationRunning ? <ThinkingIndicator /> : null}
            </AssistantMessageViewport>

            <AssistantComposer>
              <textarea placeholder="Message Lemma Assistant" />
            </AssistantComposer>
          </div>
        )}
      />
    </AssistantThemeScope>
  );
}
```

Useful primitives exported from `lemma-sdk/react`:

- `AssistantThemeScope`
- `AssistantHeader`
- `AssistantConversationList`
- `AssistantModelPicker`
- `AssistantShellLayout`
- `AssistantComposer`
- `AssistantMessageViewport`
- `AssistantAskOverlay`
- `AssistantPendingFileChip`
- `AssistantStatusPill`
- `MessageGroup`
- `PlanSummaryStrip`
- `ThinkingIndicator`

#### Theming

Use `AssistantThemeScope` around custom assistant layouts:

```tsx
import { AssistantThemeScope } from "lemma-sdk/react";

<AssistantThemeScope theme="light">
  <YourAssistant />
</AssistantThemeScope>
```

Theme behavior:

- `theme="auto"`: follows host dark-mode selectors and system color scheme
- `theme="light"`: forces the light SDK palette
- `theme="dark"`: forces the dark SDK palette

If you use `AssistantEmbedded`, pass `theme` directly on that component instead of wrapping it again.

#### What belongs in the SDK vs your app

The intended split is:

- SDK: `useAssistantController`, message/tool normalization, markdown rendering, plan parsing, tool rollups, and reusable assistant UI primitives
- App: modal shell, fullscreen/window controls, route navigation, workspace/file viewers, and product-specific renderers

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
