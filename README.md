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
| Tables | `useTables`, `useTable`, `useRecords`, `useRecord`, `useJoinedRecords`, `useRelatedRecords`, `useReverseRelatedRecords` | Stable | Build custom table browsers, details views, related-record views, and relational reads. |
| Record mutations | `useCreateRecord`, `useUpdateRecord`, `useDeleteRecord`, `useBulkRecords` | Stable | Create, update, delete, or bulk-delete rows from headless UI. |
| Record forms | `useRecordSchema`, `useRecordForm`, `useForeignKeyOptions`, `useSchemaForm` | Stable | Render schema-driven forms, enum fields, and foreign-key selectors. |
| Assistant | `useConversations`, `useConversation`, `useConversationMessages`, `useAssistantRun`, `useAssistantSession`, `useAssistantRuntime`, `useAssistantController` | Stable except controller/runtime | Build custom chat, conversation lists, streaming output, and final-output views. |
| Agents | `useAgentRun`, `useAgentRuns`, `useAgentInputSchema`, `useTaskSession` | Stable except raw session | Start agent tasks, submit follow-up input, read task history, and inspect input/output schemas. |
| Workflows | `useWorkflowStart`, `useWorkflowRun`, `useWorkflowRuns`, `useWorkflowResume` | Stable | Start, poll, resume, cancel, retry, and inspect workflow runs. |
| Workflow compatibility | `useFlowSession`, `useFlowRunHistory` | Deprecated naming | Kept for existing callers; prefer workflow-named hooks for new code. |
| Functions | `useFunctionRun`, `useFunctionRuns`, `useFunctionSession` | Stable except raw session | Run functions, poll function runs, and list function history. |
| Members and org | `useMembers`, `useOrganizationMembers` | Stable | Read pod and organization member lists. `useMembers` is intentionally read-only. |

### Common Hook Shapes

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
npx shadcn@latest add @lemma/lemma-records-page
npx shadcn@latest add @lemma/lemma-agent-runner-page
npx shadcn@latest add @lemma/lemma-workflow-launcher-page
npx shadcn@latest add @lemma/lemma-function-runner-page
```

Current registry items:

| Area | Items |
| --- | --- |
| Assistant | `lemma-assistant-experience`, `lemma-assistant-embedded` |
| Schema | `lemma-schema-form` |
| Tables | `lemma-table-picker`, `lemma-record-picker`, `lemma-record-filters-bar`, `lemma-records-table`, `lemma-record-details-card`, `lemma-record-form`, `lemma-related-records-table`, `lemma-reverse-related-records-table`, `lemma-bulk-actions-bar`, `lemma-records-page` |
| Agents | `lemma-agent-run-panel`, `lemma-agent-output-card`, `lemma-agent-messages`, `lemma-agent-runner-page` |
| Workflows | `lemma-workflow-start-form`, `lemma-workflow-history`, `lemma-workflow-run-status`, `lemma-workflow-run-details`, `lemma-workflow-launcher-page` |
| Members and access | `lemma-members-table`, `lemma-member-picker`, `lemma-org-member-picker`, `lemma-pod-access-card` |
| Functions | `lemma-function-run-panel`, `lemma-function-run-history`, `lemma-function-runner-page` |

The registry is currently served from jsDelivr against this public repo:

- registry root: `https://cdn.jsdelivr.net/gh/gappyai/lemma-typescript@main/public/r/registry.json`
- item shape: `https://cdn.jsdelivr.net/gh/gappyai/lemma-typescript@main/public/r/{name}.json`

For more stable installs, pin the registry URL to a tag or commit SHA instead of `@main`.

### Records Workspace Customization

The records blocks are meant to be configured with props before you reach for a fork.

`lemma-records-page` supports:

- capability toggles such as `allowCreate`, `allowEdit`, `allowSelection`, `allowBulkDelete`, `allowSearch`, `allowFilters`, `allowSorting`, `allowPageSizeSelect`, and `allowColumnVisibility`
- layout toggles such as `showTablePicker`, `showRecordPicker`, and `showRecordDetails`
- column control through `columns`, `hiddenColumnNames`, `defaultHiddenColumnNames`, and `onHiddenColumnNamesChange`
- non-`id` primary keys through `recordIdField` or `getRecordId`
- record-form overrides through `recordFormHiddenFields`, `recordFormFieldOrder`, `recordFormFieldLabels`, `recordFormFieldDescriptions`, `createFormTitle`, `editFormTitle`, `createSubmitLabel`, and `editSubmitLabel`

`lemma-records-table` supports richer column definitions:

- `label`, `description`, `type`, `width`, `minWidth`, `align`
- `searchable`, `hideable`, `hidden`
- `renderCell(...)` for custom cell output
- per-row buttons through `rowActions`

```tsx
import { LemmaRecordsPage } from "@/components/lemma/lemma-records-page";
import type { LemmaRecordsTableColumn } from "@/components/lemma/lemma-records-table";

const columns: LemmaRecordsTableColumn[] = [
  { name: "item_id", label: "Item ID", hideable: false, width: 180 },
  { name: "group_id", label: "Group", width: 160 },
  { name: "name", label: "Name", minWidth: 320, searchable: true },
  {
    name: "sellable",
    label: "Sellable",
    type: "boolean",
    width: 120,
    align: "center",
    renderCell: ({ value }) => (value ? "Yes" : "No"),
  },
];

<LemmaRecordsPage
  allowColumnVisibility
  allowCreate
  allowEdit
  columns={columns}
  createButtonLabel="New SKU"
  defaultHiddenColumnNames={["group_id"]}
  editSubmitLabel="Save SKU"
  recordFormFieldLabels={{ item_id: "Item ID" }}
  recordIdField="item_id"
  tableName="catalog_items"
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
