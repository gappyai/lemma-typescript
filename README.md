# Lemma TypeScript SDK

`lemma-sdk` is the headless TypeScript SDK for Lemma. Use `lemma-sdk` for the core client and shared helpers, and use `lemma-sdk/react` as the main app-building surface for hooks and auth primitives.

`AuthGuard` intentionally stays in `lemma-sdk/react`. The product direction is hooks-first and shell-agnostic. The registry remains available, but it is intentionally small and no longer the center of the recommended development model. See [docs/headless-first-direction.md](docs/headless-first-direction.md).

## Install

```bash
npm install lemma-sdk
```

If your app wants stock Lemma UI installs, configure the registry with:

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
  useRecordForm,
  useRecords,
  useWorkflowRun,
} from "lemma-sdk/react";
```

### Hook Matrix

| Area | Hooks | Stability | Use when |
| --- | --- | --- | --- |
| Auth | `AuthGuard`, `useAuth`, `useCurrentUser`, `usePodAccess` | Stable | Gate an app, read signed-in user state, or request pod access. |
| Tables | `useTables`, `useTable`, `useRecords`, `useRecord`, `useJoinedRecords`, `useRelatedRecords`, `useReverseRelatedRecords`, `useReferencingRecords`, `useDatastoreQuery`, `useRecordAggregates` | Stable | Build custom table browsers, details views, related-record views, raw SQL-backed reads, and chart/KPI queries. |
| Record mutations | `useCreateRecord`, `useUpdateRecord`, `useDeleteRecord`, `useBulkRecords` | Stable | Create, update, delete, or bulk-delete rows from headless UI. Function-backed mutations via `createVia`/`updateVia` options. |
| Record forms | `useRecordSchema`, `useRecordForm`, `useForeignKeyOptions`, `useSchemaForm` | Stable | Render schema-driven record forms, enum fields, and foreign-key selectors. `useRecordForm` is the canonical table-bound form hook; `useSchemaForm` remains available for raw JSON-schema flows. |
| Files | `useFiles`, `useFile`, `useUploadFile`, `useUpdateFile`, `useDeleteFile`, `useCreateFolder`, `useFileSearch`, `useFileTree`, `useFilePreview`, `useGlobalSearch` | Stable | Browse datastore folders, mutate file state, search indexed files, load directory trees, preview content, and compose multi-source desk search. |
| Assistant | `useConversations`, `useConversation`, `useConversationMessages`, `useAssistantRun`, `useAssistantSession`, `useAssistantRuntime`, `useAssistantController` | Stable except controller/runtime | Build custom chat, conversation lists, streaming output, and final-output views. |
| Agents | `useAgentRun`, `useAgentRuns`, `useAgentInputSchema`, `useTaskSession` | Stable except raw session | Start agent tasks, submit follow-up input, read task history, and inspect input/output schemas. |
| Workflows | `useWorkflowStart`, `useWorkflowRun`, `useWorkflowRuns`, `useWorkflowResume` | Stable | Start, poll, resume, cancel, retry, and inspect workflow runs. |
| Workflow compatibility | `useFlowSession`, `useFlowRunHistory` | Deprecated naming | Kept for existing callers; prefer workflow-named hooks for new code. |
| Functions | `useFunctionRun`, `useFunctionRuns`, `useFunctionSession` | Stable except raw session | Run functions, poll function runs, and list function history. |
| Members and org | `useMembers`, `useAddPodMember`, `useUpdatePodMemberRole`, `useRemovePodMember`, `useOrganizationMembers` | Stable | Read pod and organization members, add existing org members into a pod, update pod roles, and remove pod access. The current checked-in client does not yet expose direct email-to-pod invites. |

### Headless Helpers

Alongside hooks, `lemma-sdk` exports shared headless helpers for common desk logic:

- record display helpers: `formatRecordDisplayValue`, `humanizeRecordFieldName`, `detectRecordStatusColumn`
- form/schema helpers: `buildRecordSchemaFields`, `buildSchemaFormFields`

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

## Registry

The registry is optional UI scaffolding, not the default product story. Most desks should be built from hooks and app-local UI.

If you still want registry installs, they remain available:

After running `npx lemma-sdk init-shadcn`, install blocks like:

```bash
npx shadcn@latest add @lemma/lemma-assistant-experience
npx shadcn@latest add @lemma/lemma-document-workspace
npx shadcn@latest add @lemma/lemma-global-search
npx shadcn@latest add @lemma/lemma-members
npx shadcn@latest add @lemma/lemma-action-surface
```

The registry is intentionally small now. It currently ships 5 published blocks.

Current registry items:

| Area | Items |
| --- | --- |
| Assistant | `lemma-assistant-experience` |
| Documents | `lemma-document-workspace` |
| Search | `lemma-global-search` |
| People | `lemma-members` |
| Automation | `lemma-action-surface` |

The registry is currently served from jsDelivr against this public repo:

- registry root: `https://cdn.jsdelivr.net/gh/gappyai/lemma-typescript@main/public/r/registry.json`
- item shape: `https://cdn.jsdelivr.net/gh/gappyai/lemma-typescript@main/public/r/{name}.json`

For more stable installs, pin the registry URL to a tag or commit SHA instead of `@main`.

Published blocks:

- `lemma-assistant-experience` for the hardest assistant/chat runtime surface
- `lemma-document-workspace` for rich document/file create-read-edit-preview flows
- `lemma-global-search` for a stock command-bar style omnibox
- `lemma-members` for stock pod membership management
- `lemma-action-surface` for long-running function/workflow/agent launches

`lemma-global-search` supports:

- configured `tables[]` with `searchFields`, `displayField`, `subtitleField`, `href`, `onSelect`, and `openMode`
- optional file search with `searchMethod`, `href`, `onSelect`, and `openMode`
- progressive table/file result groups, smooth loading/error source states, hidden empty sources, keyboard navigation, and built-in `cmd/ctrl+k` handling
- `minQueryLength`, `debounceMs`, `appearance`, `density`, trigger label, and placeholder customization
- assistant handoff by `assistantName`, with optional query/results message shaping and conversation routing

Document blocks support:

- Notion/Coda-style block documents through `lemma-document-workspace`, with ProseKit JSON content, page/modal modes, title and summary chrome, file/reference/assistant blocks, save state, metadata, backlinks, and assistant-context rails
- pod-file-native creation, reading, editing, and preview through one workspace, with folder targeting, title/summary setup, pod-file metadata, and `mode="page" | "modal"`
- non-document file previews through the same workspace, including image, PDF, text, markdown, converted HTML, and download fallback behavior
- records and attachments should pass pod file paths into `lemma-document-workspace`; records should not own document bodies directly

People blocks support:

- `LemmaMemberChip`, `LemmaAvatarGroup`, `LemmaMemberSelect`, and `LemmaUserField`
- a stock `LemmaMembers` admin workspace for pod membership, role changes, removal, and add-from-organization flows via `organizationId`, `allowAdd`, `allowRoleEdit`, and `allowRemove`
- pod member labels for owner, creator, assignee, participant, and author fields
- searchable member picking backed by `useMembers`

Workflow primitives support:

- direct, function-backed, workflow-backed, and agent-backed launches through `lemma-action-surface`
- inline, row, and panel presentation modes for long-running actions with inspectable progress
- native workflow/file surfaces plus app-local record UIs where tables are the actual product data model

Assistant blocks support:

- assistant-name-first configuration through `assistantName`
- shared `appearance` and `density` controls on the assistant experience surface
- `chromeStyle`, `statusPlacement`, `radius`, model picker, conversation list, and render overrides for deeper customization
- bounded default heights for `page` and `side-panel` modes so the message viewport scrolls instead of stretching with content; pass `className="h-full min-h-0"` inside an explicit-height parent when you want a fill-layout assistant like inbox CRM

```tsx
import { LemmaAssistantExperience } from "@/components/lemma/assistant/assistant-experience";
import { LemmaActionSurface } from "@/components/lemma/lemma-action-surface";
import { LemmaGlobalSearch } from "@/components/lemma/lemma-global-search";

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

<LemmaActionSurface
  client={client}
  podId={podId}
  label="Run triage"
  kind="workflow"
  workflowName="triage-lead"
/>;

<LemmaAssistantExperience
  client={client}
  assistantName="sales-copilot"
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

To build the single local sandbox app:

```bash
cd examples/inbox-crm
npm run build
```

`examples/inbox-crm` is the only kept example app in this repo. It is a local sandbox for visualizing the current direction, not a promise that every copied component inside it is a published registry block.

This repo includes:

- `registry.json` for registry source definitions
- `public/r` for the generated flat registry output
- `.github/workflows/deploy-registry-pages.yml` for GitHub Pages deployment
- `.github/workflows/publish-npm.yml` for npm publishing
