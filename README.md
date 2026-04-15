# Lemma TypeScript SDK

`lemma-sdk` is the headless TypeScript SDK for Lemma. Use `lemma-sdk` for the core client, `lemma-sdk/react` for hooks and auth primitives, and the Lemma shadcn registry for stock UI blocks.

`AuthGuard` intentionally stays in `lemma-sdk/react`. Stock assistant, table, workflow, agent, member, and function UI lives in the registry.

## Install

```bash
npm install lemma-sdk
```

If your app uses shadcn/ui, configure the Lemma registry with:

```bash
npx lemma-sdk init-shadcn
```

That adds this namespace to your app's `components.json`:

```json
{
  "registries": {
    "@lemma": "https://cdn.jsdelivr.net/gh/gappyai/lemma-typescript@main/public/r/{name}.json"
  }
}
```

If your app does not have `components.json` yet, run `npx shadcn@latest init` first or after the command above.

## Core Client

```ts
import { LemmaClient } from "lemma-sdk";

const client = new LemmaClient({
  podId: "<pod-id>",
});

await client.initialize();

const tables = await client.tables.list();
const records = await client.records.list("tickets");
```

Pod-scoped namespaces include `tables`, `records`, `assistants`, `agents`, `tasks`, `workflows`, `functions`, `files`, `desks`, `integrations`, `resources`, and `datastore`.

Org and user surfaces include `users`, `organizations`, `pods`, `podMembers`, `podJoinRequests`, and `podSurfaces`.

## React Package

Install React if your app needs hooks:

```bash
npm install react react-dom
```

`lemma-sdk/react` is headless-first. It exports hooks plus `AuthGuard`; it does not export stock UI components or CSS.

```tsx
import {
  AuthGuard,
  useAgentRun,
  useConversationMessages,
  useConversations,
  useRecords,
  useSchemaForm,
  useWorkflowStart,
} from "lemma-sdk/react";
```

### Hook Matrix

| Area | Hooks | Stability | Use when |
| --- | --- | --- | --- |
| Auth | `AuthGuard`, `useAuth`, `useCurrentUser`, `usePodAccess` | Stable | Gate an app, read signed-in user state, or request pod access. |
| Tables | `useTables`, `useTable`, `useRecords`, `useRecord`, `useJoinedRecords`, `useRelatedRecords`, `useReverseRelatedRecords`, `useReferencingRecords` | Stable | Build custom table browsers, details views, related-record views, and relational reads. |
| Record mutations | `useCreateRecord`, `useUpdateRecord`, `useDeleteRecord`, `useBulkRecords` | Stable | Create, update, delete, or bulk-delete rows from headless UI. Function-backed mutations via `createVia`/`updateVia` options. |
| Record forms | `useRecordSchema`, `useRecordForm`, `useForeignKeyOptions`, `useSchemaForm` | Stable | Render schema-driven forms, enum fields, and foreign-key selectors. `useRecordForm` supports `submitVia: "function"`, `visibleFields`, `hiddenFields`. |
| Assistant | `useConversations`, `useConversation`, `useConversationMessages`, `useAssistantRun`, `useAssistantSession`, `useAssistantRuntime`, `useAssistantController` | Stable except controller/runtime | Build custom chat, conversation lists, streaming output, and final-output views. |
| Agents | `useAgentRun`, `useAgentRuns`, `useAgentInputSchema`, `useTaskSession` | Stable except raw session | Start agent tasks, submit follow-up input, read task history, and inspect input/output schemas. |
| Workflows | `useWorkflowStart`, `useWorkflowRun`, `useWorkflowRuns`, `useWorkflowResume` | Stable | Start, poll, resume, cancel, retry, and inspect workflow runs. |
| Workflow compatibility | `useFlowSession`, `useFlowRunHistory` | Deprecated naming | Kept for existing callers; prefer workflow-named hooks for new code. |
| Functions | `useFunctionRun`, `useFunctionRuns`, `useFunctionSession` | Stable except raw session | Run functions, poll function runs, and list function history. |
| Members and org | `useMembers`, `useOrganizationMembers` | Stable | Read pod and organization member lists. `useMembers` is intentionally read-only. |

### Common Hook Shapes

For business-facing examples and a decision guide mapping "I want to..." to the right hook, see [docs/hooks-guide.md](docs/hooks-guide.md).

List hooks generally expose:

- `items` named for the resource, such as `records`, `runs`, or `members`
- `isLoading`
- `error`
- `nextPageToken`
- `refresh(...)`
- `loadMore(...)` where pagination is useful

Run hooks generally expose:

- `run` or `task`
- `status`
- `isPolling`, `isStreaming`, or `isRunning`
- `output`
- `finalOutput`
- `start(...)`
- `refresh(...)`
- follow-up helpers such as `resume(...)`, `submitInput(...)`, `cancel(...)`, or `retry(...)`

### Headless Examples

Records:

```tsx
import { LemmaClient } from "lemma-sdk";
import { useRecords } from "lemma-sdk/react";

const client = new LemmaClient({ podId: "<pod-id>" });

function TicketList() {
  const tickets = useRecords({
    client,
    tableName: "tickets",
    limit: 25,
    sortBy: "created_at",
    order: "desc",
  });

  if (tickets.error) return <p>{tickets.error.message}</p>;

  return (
    <ul>
      {tickets.records.map((ticket) => (
        <li key={String(ticket.id)}>{String(ticket.title ?? ticket.id)}</li>
      ))}
    </ul>
  );
}
```

Assistant final output:

```tsx
import { useConversationMessages, useConversations } from "lemma-sdk/react";

function SupportThread({ client }: { client: LemmaClient }) {
  const conversations = useConversations({
    client,
    assistantName: "support_assistant",
  });

  const messages = useConversationMessages({
    client,
    conversationId: conversations.effectiveSelectedConversationId,
    autoResume: true,
  });

  return <pre>{messages.finalOutputText || messages.outputText || "No output yet."}</pre>;
}
```

Agent run:

```tsx
import { useAgentRun } from "lemma-sdk/react";

function AgentButton({ client }: { client: LemmaClient }) {
  const agent = useAgentRun({
    client,
    agentName: "triage_agent",
  });

  return (
    <button
      disabled={agent.isStreaming}
      onClick={() => {
        void agent.start({ ticket_id: "ticket_123" });
      }}
    >
      {agent.status ?? "Run agent"}
    </button>
  );
}
```

Workflow run:

```tsx
import { useWorkflowRun } from "lemma-sdk/react";

function WorkflowButton({ client }: { client: LemmaClient }) {
  const workflow = useWorkflowRun({
    client,
    workflowName: "approve_ticket",
  });

  return (
    <button
      disabled={workflow.isPolling}
      onClick={() => {
        void workflow.start({ ticket_id: "ticket_123" });
      }}
    >
      {workflow.status ?? "Start workflow"}
    </button>
  );
}
```

## Shadcn Registry

Lemma UI lives in the registry, not in `lemma-sdk/react`.

After running `npx lemma-sdk init-shadcn`, install blocks like:

```bash
npx shadcn@latest add @lemma/lemma-records-view
npx shadcn@latest add @lemma/lemma-record-form
npx shadcn@latest add @lemma/lemma-global-search
npx shadcn@latest add @lemma/lemma-insights
npx shadcn@latest add @lemma/lemma-assistant-embedded
```

Current registry items:

| Area | Items |
| --- | --- |
| Assistant | `lemma-assistant-experience`, `lemma-assistant-embedded` |
| App shell | `lemma-dashboard` |
| Navigation | `lemma-global-search` |
| Records | `lemma-records-view`, `lemma-record-form` |
| Analytics | `lemma-insights` |

The registry is currently served from jsDelivr against this public repo:

- registry root: `https://cdn.jsdelivr.net/gh/gappyai/lemma-typescript@main/public/r/registry.json`
- item shape: `https://cdn.jsdelivr.net/gh/gappyai/lemma-typescript@main/public/r/{name}.json`

For more stable installs, pin the registry URL to a tag or commit SHA instead of `@main`.

Blocks that install a CSS file, such as the assistant blocks and records view, should be imported by your app's global stylesheet:

```css
@import "@/styles/lemma-assistant.css";
@import "@/styles/lemma-records-view.css";
```

### Records Workspace Customization

The records blocks are meant to be configured with props before you reach for a fork.

`lemma-records-view` supports:

- `tableName`, `visibleColumns`, and `hiddenFields` for schema-aware display
- `defaultView="grid" | "list" | "kanban" | "linear"` and `groupBy` for table, card, horizontal board, or Linear-style grouped layouts
- `renderCell` and `renderCard` for custom record rendering
- `foreignKeyLabels` for human-readable FK values in cards, detail views, and create/edit forms
- `onCreateOptions` and `onUpdateOptions` for function-backed mutations
- `createMode="sheet" | "modal" | "page"` and `detailMode="sheet" | "page"` for app-specific interaction patterns
- `headerActions`, `emptyState`, and `onRecordClick` for app-specific extensions
- `appearance="default" | "minimal" | "borderless" | "contained"` and `density="compact" | "comfortable" | "spacious"` for host-level block chrome; `minimal` is the cardless mode

`lemma-record-form` supports:

- `mode="inline" | "modal" | "sheet"`
- `submitVia="direct" | "function"` and `submitFunctionName`
- `hiddenFields`, `visibleFields`, `fieldOrder`, and `fieldGroups`
- `foreignKeyLabels` for FK select labels
- `initialValues`, `onSuccess`, and `onClose`
- `appearance` and `density` using the same values as `lemma-records-view`

`lemma-insights` supports:

- table-backed count, sum, average, and grouped chart cards
- function-backed stats and charts
- shared `appearance` and `density` block chrome controls

`lemma-global-search` supports:

- configured `tables[]` with `searchFields`, `displayField`, `subtitleField`, `href`, `onSelect`, and `openMode`
- optional file search with `searchMethod`, `href`, `onSelect`, and `openMode`
- progressive table/file result groups, smooth loading/error source states, hidden empty sources, keyboard navigation, and built-in `cmd/ctrl+k` handling
- `minQueryLength`, `debounceMs`, `appearance`, `density`, trigger label, and placeholder customization
- assistant handoff by `assistantName`, with optional query/results message shaping and conversation routing

Assistant blocks support:

- assistant-name-first configuration through `assistantName`
- shared `appearance` and `density` controls on the assistant experience surface
- `chromeStyle`, `statusPlacement`, `radius`, model picker, conversation list, and render overrides for deeper customization

```tsx
import { LemmaRecordsView } from "@/components/lemma/lemma-records-view";
import { LemmaGlobalSearch } from "@/components/lemma/lemma-global-search";

<LemmaRecordsView
  client={client}
  podId={podId}
  tableName="deals"
  defaultView="kanban"
  groupBy="status"
  hiddenFields={["id", "created_at", "updated_at"]}
  foreignKeyLabels={{ company_id: "name" }}
  appearance="minimal"
  density="compact"
  createMode="sheet"
  onCreateOptions={{
    submitVia: "function",
    submitFunctionName: "create-deal",
  }}
/>;

<LemmaGlobalSearch
  client={client}
  podId={podId}
  tables={[
    {
      tableName: "deals",
      label: "Deals",
      searchFields: ["name", "status", "source"],
      displayField: "name",
      subtitleField: "status",
      href: (record) => `/deals?record=${record.id}`,
    },
  ]}
  files={{ enabled: true, openMode: "new-tab" }}
  assistant={{
    assistantName: "sales-copilot",
    label: "Ask CRM",
    resultLimit: 8,
  }}
  minQueryLength={3}
  debounceMs={450}
  appearance="minimal"
  density="compact"
/>;
```

## Auth

The SDK uses cookie or session auth by default.

Useful helpers:

- `buildAuthUrl(...)`
- `buildFederatedLogoutUrl(...)`
- `resolveSafeRedirectUri(...)`
- `setTestingToken(...)`
- `clearTestingToken()`

When `client.podId` is set and the signed-in user is not a pod member, `AuthGuard` can render the request-access flow and create or show pod join requests.

`usePodAccess` exposes the same membership/request-access state as a hook for custom UI.

## Migration Notes

From `0.2.30` onward:

- `lemma-sdk/react` should be treated as hooks plus auth primitives.
- `AuthGuard` remains in `lemma-sdk/react`.
- Stock UI should be installed from the shadcn registry.
- Assistant UI source and CSS are no longer part of the React SDK internals.
- `react-markdown` and `remark-gfm` are registry-block dependencies for assistant UI, not core SDK dependencies.
- New workflow code should prefer `useWorkflowRun`, `useWorkflowRuns`, and `useWorkflowResume` over the older `flow`-named hooks.

## Local Development

From the root of this repository:

```bash
npm install
npm run build
npm run registry:build
```

This repo includes:

- `registry.json` for registry source definitions
- `public/r` for the generated flat registry output
- `.github/workflows/deploy-registry-pages.yml` for GitHub Pages deployment
- `.github/workflows/publish-npm.yml` for npm publishing
