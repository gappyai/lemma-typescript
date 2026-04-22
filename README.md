# Lemma TypeScript SDK

`lemma-sdk` is the headless TypeScript SDK for Lemma. Use `lemma-sdk` for the core client and shared helpers, and use `lemma-sdk/react` as the main app-building surface for hooks and auth primitives.

`AuthGuard` intentionally stays in `lemma-sdk/react`. The product direction remains hooks-first and shell-agnostic, and the registry ships stock Lemma UI blocks when you want installable assistant, records, file, workflow, collaboration, or shell surfaces.

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

The registry is optional UI scaffolding for teams that want stock Lemma blocks on top of the headless SDK.

After running `npx lemma-sdk init-shadcn`, install blocks like:

```bash
npx shadcn@latest add @lemma/lemma-records-view
npx shadcn@latest add @lemma/lemma-detail-panel
npx shadcn@latest add @lemma/lemma-record-form
npx shadcn@latest add @lemma/lemma-global-search
npx shadcn@latest add @lemma/lemma-file-browser
npx shadcn@latest add @lemma/lemma-document-workspace
npx shadcn@latest add @lemma/lemma-comments
npx shadcn@latest add @lemma/lemma-assistant-experience
```

The registry currently ships 19 canonical blocks:

| Area | Items |
| --- | --- |
| Core operator blocks | `lemma-records-view`, `lemma-detail-panel`, `lemma-record-form`, `lemma-status-flow` |
| Search, files, and pages | `lemma-global-search`, `lemma-breadcrumbs`, `lemma-file-browser`, `lemma-markdown-editor`, `lemma-page-tree`, `lemma-document-workspace` |
| Collaboration and analytics | `lemma-comments`, `lemma-activity-feed`, `lemma-insights`, `lemma-action-surface`, `lemma-workflow-runner` |
| Assistant and shell | `lemma-assistant-experience`, `lemma-members`, `lemma-notification-bell`, `lemma-user-menu` |

Registry blocks now install against a shared `lemma-ui` primitive layer that ships with this registry. Consumers no longer need a pre-existing app-local `@/components/ui/*` shadcn tree just to use Lemma blocks.

The registry is currently served from jsDelivr against this public repo:

- registry root: `https://cdn.jsdelivr.net/gh/gappyai/lemma-typescript@main/public/r/registry.json`
- item shape: `https://cdn.jsdelivr.net/gh/gappyai/lemma-typescript@main/public/r/{name}.json`

For more stable installs, pin the registry URL to a tag or commit SHA instead of `@main`.

Blocks that install a CSS file, such as records view, should be imported by your app's global stylesheet:

```css
@import "@/styles/lemma-records-view.css";
```

Core registry blocks:

- `lemma-records-view` for a lean records browser by default, with explicit workspace presets for grid, list, grouped, kanban, and linear operator flows
- `lemma-detail-panel` for standalone record detail rendering with shared records-detail internals
- `lemma-record-form` for schema-aware create and edit flows with searchable foreign-key controls
- `lemma-status-flow` for interactive status transitions and lifecycle display
- `lemma-global-search` for a stock command-bar style omnibox
- `lemma-file-browser` and `lemma-document-workspace` for file browsing, editing, preview, and document-native workflows
- `lemma-comments`, `lemma-activity-feed`, and `lemma-insights` for collaboration and reporting
- `lemma-action-surface` and `lemma-workflow-runner` for long-running actions and workflow history
- `lemma-assistant-experience`, `lemma-members`, `lemma-notification-bell`, and `lemma-user-menu` for assistant and shell surfaces

### Block Defaults

The registry now treats generic blocks as read-first and low-chrome by default.

- base blocks should render useful data without assuming a full workspace shell
- presets are the place for opinionated operator UX such as inline detail, multi-view boards, and heavier toolbars
- `appearance`, `density`, and `radius` remain available as local override props on major blocks, but they are optional; prefer setting visual defaults in your app shell or wrapper components instead of passing them everywhere

`lemma-records-view` now defaults to:

- one explicit view instead of an inferred multi-view workspace
- no search bar unless you opt in through `chrome.search` or pass search config
- no filter launcher unless you opt in through `chrome.filters` or provide default filters
- no create button unless you opt in through `chrome.create` or pass create config
- no row-selection chrome unless you opt in through `chrome.selection` or provide bulk actions
- `detailMode="sheet"` for the base block, with inline detail reserved for explicit presets or explicit props
- no schema-name heuristics that silently promote a table into `kanban` or `linear`

For records workspaces, the split is:

- use the base block for simple table/list browsing
- pass `availableViews` only when you want a view switcher
- pass `chrome={{ search: true, filters: true, create: true, viewSwitcher: true, selection: true }}` when you want workspace controls on the base block
- use `preset="triage" | "issues" | "crm" | "docs"` when you want a stock operator workspace

`lemma-members` now defaults to a read-only membership list. Add management behavior explicitly with `allowAdd`, `allowRoleEdit`, and `allowRemove`.

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
- a stock `LemmaMembers` surface that is read-only by default, and upgrades into a membership admin workspace only when `allowAdd`, `allowRoleEdit`, or `allowRemove` are enabled
- pod member labels for owner, creator, assignee, participant, and author fields
- searchable member picking backed by `useMembers`

Workflow primitives support:

- lifecycle/status rendering and transitions through `lemma-status-flow`
- direct, function-backed, workflow-backed, and agent-backed launches through `lemma-action-surface`
- inline, row, and panel presentation modes for long-running actions with inspectable progress
- native workflow run inspection through `lemma-workflow-runner`

Navigation and file blocks support:

- route, record, and file-path breadcrumb builders through `lemma-breadcrumbs`
- native pod-file hierarchy navigation through `lemma-page-tree`
- datastore folder navigation, upload, rename, move, folder creation, picker mode, and delete handling through `lemma-file-browser`
- write, preview, and split modes through `lemma-markdown-editor`

Collaboration and analytics blocks support:

- record-scoped discussion through `lemma-comments`
- unified audit and history timelines through `lemma-activity-feed`
- dashboard-style stat cards and charts through `lemma-insights`

Assistant blocks support:

- assistant-name-first configuration through `assistantName`
- shared `appearance` and `density` controls on the assistant experience surface
- `chromeStyle`, `statusPlacement`, `radius`, model picker, conversation list, and render overrides for deeper customization
- bounded default heights for `page` and `side-panel` modes so the message viewport scrolls instead of stretching with content; pass `className="h-full min-h-0"` inside an explicit-height parent when you want a fill-layout assistant like inbox CRM

```tsx
import { LemmaRecordsView } from "@/components/lemma/lemma-records-view";
import { LemmaAssistantExperience } from "@/components/lemma/assistant/assistant-experience";
import { LemmaActionSurface } from "@/components/lemma/lemma-action-surface";
import { LemmaGlobalSearch } from "@/components/lemma/lemma-global-search";

<LemmaRecordsView
  client={client}
  podId={podId}
  tableName="tickets"
/>;

<LemmaRecordsView
  client={client}
  podId={podId}
  tableName="deals"
  defaultView="list"
  availableViews={["list", "grid"]}
  chrome={{ search: true, filters: true, create: true, viewSwitcher: true, selection: true }}
  hiddenFields={["id", "created_at", "updated_at"]}
  foreignKeyLabels={{ company_id: "name" }}
  onCreateOptions={{
    submitVia: "function",
    submitFunctionName: "create-deal",
  }}
/>;

<LemmaRecordsView
  client={client}
  podId={podId}
  tableName="deals"
  preset="crm"
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
