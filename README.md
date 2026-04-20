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
  useRecordForm,
  useRecords,
  useWorkflowRun,
} from "lemma-sdk/react";
```

### Hook Matrix

| Area | Hooks | Stability | Use when |
| --- | --- | --- | --- |
| Auth | `AuthGuard`, `useAuth`, `useCurrentUser`, `usePodAccess` | Stable | Gate an app, read signed-in user state, or request pod access. |
| Tables | `useTables`, `useTable`, `useRecords`, `useRecord`, `useJoinedRecords`, `useRelatedRecords`, `useReverseRelatedRecords`, `useReferencingRecords` | Stable | Build custom table browsers, details views, related-record views, and relational reads. |
| Record mutations | `useCreateRecord`, `useUpdateRecord`, `useDeleteRecord`, `useBulkRecords` | Stable | Create, update, delete, or bulk-delete rows from headless UI. Function-backed mutations via `createVia`/`updateVia` options. |
| Record forms | `useRecordSchema`, `useRecordForm`, `useForeignKeyOptions`, `useSchemaForm` | Stable | Render schema-driven record forms, enum fields, and foreign-key selectors. `useRecordForm` is the canonical table-bound form hook; `useSchemaForm` remains available for raw JSON-schema flows. |
| Files | `useFiles`, `useFile`, `useFileSearch`, `useFileTree`, `useFilePreview` | Stable | Browse datastore folders, resolve file metadata, search indexed files, load directory trees, and preview converted or raw file content. |
| Assistant | `useConversations`, `useConversation`, `useConversationMessages`, `useAssistantRun`, `useAssistantSession`, `useAssistantRuntime`, `useAssistantController` | Stable except controller/runtime | Build custom chat, conversation lists, streaming output, and final-output views. |
| Agents | `useAgentRun`, `useAgentRuns`, `useAgentInputSchema`, `useTaskSession` | Stable except raw session | Start agent tasks, submit follow-up input, read task history, and inspect input/output schemas. |
| Workflows | `useWorkflowStart`, `useWorkflowRun`, `useWorkflowRuns`, `useWorkflowResume` | Stable | Start, poll, resume, cancel, retry, and inspect workflow runs. |
| Workflow compatibility | `useFlowSession`, `useFlowRunHistory` | Deprecated naming | Kept for existing callers; prefer workflow-named hooks for new code. |
| Functions | `useFunctionRun`, `useFunctionRuns`, `useFunctionSession` | Stable except raw session | Run functions, poll function runs, and list function history. |
| Members and org | `useMembers`, `useAddPodMember`, `useUpdatePodMemberRole`, `useRemovePodMember`, `useOrganizationMembers` | Stable | Read pod and organization members, add existing org members into a pod, update pod roles, and remove pod access. The current checked-in client does not yet expose direct email-to-pod invites. |

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
npx shadcn@latest add @lemma/lemma-detail-panel
npx shadcn@latest add @lemma/lemma-record-form
npx shadcn@latest add @lemma/lemma-global-search
npx shadcn@latest add @lemma/lemma-file-browser
npx shadcn@latest add @lemma/lemma-document-workspace
npx shadcn@latest add @lemma/lemma-members
npx shadcn@latest add @lemma/lemma-comments
npx shadcn@latest add @lemma/lemma-insights
npx shadcn@latest add @lemma/lemma-assistant-experience
```

Those commands are representative. The registry currently ships 19 canonical blocks.

Current registry items:

| Area | Items |
| --- | --- |
| Assistant | `lemma-assistant-experience` |
| Navigation | `lemma-breadcrumbs`, `lemma-global-search`, `lemma-page-tree` |
| Records | `lemma-records-view`, `lemma-detail-panel`, `lemma-record-form`, `lemma-status-flow` |
| Files | `lemma-file-browser`, `lemma-document-workspace` |
| Documents | `lemma-document-workspace`, `lemma-markdown-editor` |
| People | `lemma-members`, `lemma-notification-bell`, `lemma-user-menu` |
| Analytics | `lemma-insights` |
| Collaboration | `lemma-activity-feed`, `lemma-comments` |
| Automation | `lemma-workflow-runner` |

The registry is currently served from jsDelivr against this public repo:

- registry root: `https://cdn.jsdelivr.net/gh/gappyai/lemma-typescript@main/public/r/registry.json`
- item shape: `https://cdn.jsdelivr.net/gh/gappyai/lemma-typescript@main/public/r/{name}.json`

For more stable installs, pin the registry URL to a tag or commit SHA instead of `@main`.

Blocks that install a CSS file, such as records view, should be imported by your app's global stylesheet:

```css
@import "@/styles/lemma-records-view.css";
```

### Records Workspace Customization

The records blocks are meant to be configured with props before you reach for a fork.

`lemma-records-view` supports:

- `preset="triage" | "issues" | "crm" | "docs"` for opinionated defaults without installing duplicate workflow blocks
- `defaultView` and `availableViews` across `grid`, `list`, `grouped`, `kanban`, `linear`, `calendar`, `timeline`, and `matrix`
- `tableName`, `visibleColumns`, and `hiddenFields` for schema-aware display
- `pinnedColumns`, `columnWidths`, `columnLabels`, `primaryField`, `defaultSort`, and `paginationMode` for stronger operator-table defaults
- `groupBy`, `calendarField`, `timelineField`, `matrixRowsBy`, and `matrixColumnsBy` for consolidated view configuration
- `renderCell` and `renderCard` for custom record rendering
- `foreignKeyLabels` for human-readable FK values in cards, detail views, and create/edit forms
- `detailTabs`, `detailFieldGroups`, `detailRelatedRecords`, `detailSectionLabels`, and `detailSectionVisibility` for canonical detail composition
- `quickActions`, `bulkActions`, `detailActions`, `quickActionMode`, and `onQuickActionSuccess` for direct, function, or workflow-backed actions
- `onCreateOptions` and `onUpdateOptions` for function-backed mutations, including conditional field and section visibility in the create sheet
- `createMode="sheet" | "modal" | "page"` and `detailMode="sheet" | "modal" | "page" | "inline"` for app-specific interaction patterns
- `headerActions`, `emptyState`, `onRecordClick`, `renderFilesTab`, `renderCommentsTab`, and `renderActivityTab` for app-specific extensions
- `appearance="default" | "minimal" | "borderless" | "contained"` and `density="compact" | "comfortable" | "spacious"` for host-level block chrome; `minimal` is the cardless mode

`lemma-detail-panel` supports:

- standalone record detail rendering outside the full records workspace, using the same canonical detail internals as `lemma-records-view`
- `mode`, `variant`, and `layout` controls for embedded, sheet, modal, or full-page use
- built-in detail tabs plus custom `tabs`, `relatedRecords`, and `renderFiles` / `renderComments` / `renderActivity` sections
- direct, function-backed, and workflow-aware `actions`, plus `updateVia` / `updateFunctionName` for inline edits
- shared `appearance`, `density`, and `radius` controls for use in inline, sheet, modal, or page layouts

`lemma-record-form` supports:

- `mode="inline" | "modal" | "sheet"`
- `submitVia="direct" | "function"` and `submitFunctionName`
- `submitFunctionInput` when the backing function expects a different payload shape
- `hiddenFields`, `visibleFields`, `fieldOrder`, and `fieldGroups`
- searchable FK inputs through the shared `record-form-fields` control layer
- `fieldVisibility` and `sectionVisibility` for conditional forms
- `foreignKeyLabels` for FK select labels
- `initialValues`, `onSuccess`, and `onClose`
- `appearance`, `density`, and `radius` using the same values as `lemma-records-view`

`lemma-insights` supports:

- table-backed count, sum, average, and grouped chart cards
- bar, line, area, pie, and funnel charts with count/sum/avg aggregation
- `aggregationMode="client" | "function"` with optional `aggregateFunctionName` for shared server-side aggregation
- chart descriptions, value/category formatters, limits, sorting, empty states, and optional footers
- function-backed stats and charts
- shared `appearance`, `density`, `radius`, and card-column controls

`lemma-global-search` supports:

- configured `tables[]` with `searchFields`, `displayField`, `subtitleField`, `href`, `onSelect`, and `openMode`
- optional file search with `searchMethod`, `href`, `onSelect`, and `openMode`
- progressive table/file result groups, smooth loading/error source states, hidden empty sources, keyboard navigation, and built-in `cmd/ctrl+k` handling
- `minQueryLength`, `debounceMs`, `appearance`, `density`, trigger label, and placeholder customization
- assistant handoff by `assistantName`, with optional query/results message shaping and conversation routing

Navigation blocks support:

- route, record, and file-path breadcrumb builders through `lemma-breadcrumbs`
- self-referential page hierarchies through `lemma-page-tree`, with selection, expansion, and create/reorder hooks

File blocks support:

- datastore folder navigation and path breadcrumbs through `lemma-file-browser`
- pod-level file browsing and search, not only record-linked attachments
- upload, download, search, rename, move, folder creation, picker mode, and composition-friendly link actions
- selection-aware file browsing so `lemma-file-browser` can drive a paired workspace preview
- image, PDF, text, markdown, converted HTML, metadata, and download fallbacks through `lemma-document-workspace` with pod-file params

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

- lifecycle/status rendering and transitions through `lemma-status-flow`
- read-only tracker layouts and compact step progress through `lemma-status-flow`
- workflow run inspection through `lemma-workflow-runner`
- reusable history and collaboration surfaces through `lemma-activity-feed` and `lemma-comments`
- table-backed defaults with escape hatches for custom action payloads and render slots

`lemma-markdown-editor` supports:

- write, preview, and split modes
- controlled and uncontrolled values
- GitHub-flavored markdown preview via `react-markdown` and `remark-gfm`
- a lightweight interim editing lane for plain markdown notes beside the richer block-native `lemma-document-workspace`

Assistant blocks support:

- assistant-name-first configuration through `assistantName`
- shared `appearance` and `density` controls on the assistant experience surface
- `chromeStyle`, `statusPlacement`, `radius`, model picker, conversation list, and render overrides for deeper customization

Shell blocks support:

- `lemma-notification-bell` for unread counts, popover inboxes, and mark-as-read flows
- `lemma-user-menu` for current-user presentation, custom menu actions, and sign-out affordances

```tsx
import { LemmaRecordsView } from "@/components/lemma/lemma-records-view";
import { LemmaGlobalSearch } from "@/components/lemma/lemma-global-search";

<LemmaRecordsView
  client={client}
  podId={podId}
  tableName="deals"
  preset="crm"
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

To build the canonical example desk:

```bash
cd examples/inbox-crm
npm run build
```

`examples/inbox-crm` now mirrors the kept registry surface only. Its local `src/components/lemma` folder is a copied install target of the current canonical registry blocks, and `src/main.tsx` demonstrates those blocks in one routed operator desk.

This repo includes:

- `registry.json` for registry source definitions
- `public/r` for the generated flat registry output
- `.github/workflows/deploy-registry-pages.yml` for GitHub Pages deployment
- `.github/workflows/publish-npm.yml` for npm publishing
