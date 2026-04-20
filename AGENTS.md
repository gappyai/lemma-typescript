# AGENTS.md

Guide for AI agents building desks and features with the Lemma SDK.

## Project structure

- `src/` — SDK source (TypeScript, ESM)
  - `src/index.ts` — Core client + types barrel export
  - `src/react/index.ts` — React hooks barrel export
  - `src/react/use*.ts` — Individual hook implementations
  - `src/datastore-query.ts` — SQL join query builder
  - `src/record-form.ts` — Schema-driven form field resolution
  - `src/client.ts` — LemmaClient class
  - `src/react/components/` — React components used by registry blocks (AssistantExperienceView, etc.)
- `dist/` — Built output (generated, do not edit)
- `docs/hooks-guide.md` — Business-facing hook recipes and decision guide
- `examples/` — Working example apps (inbox-crm)
- `registry/` — Shadcn registry component source
- `registry.json` — Registry manifest (19 canonical blocks)

## Registry blocks

The shadcn registry ships **19 canonical blocks**. All surviving blocks accept `appearance`, `density`, and `radius` props where applicable for cross-cutting visual control.

### Core operator blocks
- **lemma-records-view** — Canonical records workspace with grid, list, grouped, kanban, and linear views, `triage`/`issues`/`crm`/`docs` presets, inline editing, detail routing/sheets, and schema-aware create flows.
- **lemma-detail-panel** — Standalone wrapper around the same canonical record-detail renderer used by `lemma-records-view`.
- **lemma-record-form** — Canonical schema-aware create/edit form with shared field controls, grouped sections, FK search, and direct/function submit modes.
- **lemma-status-flow** — Linear/Jira-style status and transition primitive for headers, rows, and detail pages.

### Search, files, and pages
- **lemma-global-search** — Command-bar style record and file search surface.
- **lemma-breadcrumbs** — Route, record, and file-path breadcrumbs with helper builders.
- **lemma-file-browser** — Pod-level file workspace for folders, search, upload, and delete.
- **lemma-markdown-editor** — Write/preview/split markdown editor.
- **lemma-page-tree** — Hierarchical page navigation for Notion-style workspaces.
- **lemma-document-workspace** — Canonical pod-file workspace for create/read/edit/preview flows over structured documents, text files, images, PDFs, converted HTML, and download fallbacks.

### Collaboration and analytics
- **lemma-comments** — Record-scoped thread surface with direct/function-backed submission.
- **lemma-activity-feed** — Unified event/history feed across one or more tables.
- **lemma-insights** — Stats and chart cards for count/sum/avg/funnel-style reporting.
- **lemma-action-surface** — Long-running action launcher with button, line, and panel variants for direct actions, functions, workflows, and agents, plus inspectable progress surfaces.
- **lemma-workflow-runner** — Workflow run history and step-progress viewer.

### Assistant and shell
- **lemma-assistant-experience** — Full assistant surface with conversation list, model picker, tool cards, and file presentation.
- **lemma-members** — Member primitives plus a stock members admin workspace for role changes, removal, and add-from-organization flows.
- **lemma-notification-bell** — Notification popover shell primitive.
- **lemma-user-menu** — User/auth shell primitive.

## Build

```bash
npm run build
```

This runs `tsc` then bundles the browser client. There are no tests currently.

## Import conventions

```ts
// Core client and types
import { LemmaClient, type RecordResponse } from "lemma-sdk";

// React hooks
import { useRecords, useRecordForm, useReferencingRecords, useAssistantController } from "lemma-sdk/react";
```

Never import from individual hook files directly. Always use the barrel exports.

## Hook selection guide

When building a desk, choose hooks based on what the UI needs:

**Fetching data:**
- List of records → `useRecords`
- Single record → `useRecord`
- Table schema → `useTable`, `useTables`
- Record schema fields → `useRecordSchema`
- Records from a referencing table → `useReferencingRecords({ table, foreignKey, recordId })`
- Records with FK-related data joined → `useRelatedRecords`
- Cross-table join → `useJoinedRecords({ baseTable, joins })`
- Discover reverse relations → `useReverseRelatedRecords`
- FK dropdown options → `useForeignKeyOptions`

**Mutating data:**
- Schema-driven create/edit form → `useRecordForm`
- One-shot create → `useCreateRecord`
- One-shot update → `useUpdateRecord`
- One-shot delete → `useDeleteRecord`
- Bulk operations → `useBulkRecords`
- Add existing org member to pod → `useAddPodMember`
- Update pod member role → `useUpdatePodMemberRole`
- Remove pod member from pod → `useRemovePodMember`

**Running functions/workflows:**
- Run a function → `useFunctionRun`
- Function run history → `useFunctionRuns`
- Function session (streaming) → `useFunctionSession`
- Run a workflow → `useWorkflowStart`
- Workflow run detail → `useWorkflowRun`
- Workflow run history → `useWorkflowRuns`
- Resume a workflow → `useWorkflowResume`
- Flow session → `useFlowSession`
- Flow run history → `useFlowRunHistory`

**Assistant/agent:**
- Assistant controller → `useAssistantController`
- Assistant session → `useAssistantSession`
- Assistant runtime → `useAssistantRuntime`
- Single assistant run → `useAssistantRun`
- Conversations → `useConversations`, `useConversation`, `useConversationMessages`
- Agent run → `useAgentRun`
- Agent run history → `useAgentRuns`
- Agent input schema → `useAgentInputSchema`

**Files:**
- List files → `useFiles`
- Single file → `useFile`
- File search → `useFileSearch`
- File tree → `useFileTree`
- File preview → `useFilePreview`

**Members and auth:**
- Pod members → `useMembers`
- Add existing org member into pod → `useAddPodMember`
- Change pod member role → `useUpdatePodMemberRole`
- Remove pod member → `useRemovePodMember`
- Organization members → `useOrganizationMembers`
- Current user → `useCurrentUser`
- Pod access → `usePodAccess`
- Gate the app → `AuthGuard`
- Read auth state → `useAuth`

**Task/session:**
- Task session (streaming) → `useTaskSession`

## Function-aware mutations

Most pods have business logic in functions. When a function wraps a create or update (e.g. auto-generates identifiers, logs history), use the `*Via: "function"` option so the hook goes through the function layer:

```tsx
// Form that creates via a function
useRecordForm({
  client, tableName: "issues",
  submitVia: "function",
  submitFunctionName: "create-issue",
  hiddenFields: ["identifier", "created_at"],
  submitFunctionInput: (payload) => ({
    title: payload.title,
    team_id: payload.team_id,
  }),
});

// Update that goes through a function (e.g. for status transitions with history)
useUpdateRecord({
  client, tableName: "issues", recordId: id,
  updateVia: "function",
  updateFunctionName: "update-issue-status",
});

// Create that goes through a function (e.g. add comment)
useCreateRecord({
  client, tableName: "comments",
  createVia: "function",
  createFunctionName: "add-comment",
});
```

## Relationship hooks

The three relationship hooks cover different FK directions:

- `useRelatedRecords` — Forward FK: "I have issues, show me each issue's team"
- `useReferencingRecords` — Reverse FK (simple): "Show me all comments where issue_id = X"
- `useReverseRelatedRecords` — Reverse FK (discovery): "What tables have FKs pointing to this table?"

`useReferencingRecords` is the most common for detail panels — it takes a table name, FK column, and record ID directly.

## Joined records

`useJoinedRecords` has two modes:

```tsx
// Shorthand — auto-resolves join conditions from FK metadata
useJoinedRecords({
  client,
  baseTable: "issues",
  joins: [{ table: "teams", on: "team_id" }],
});

// Full query — for complex joins, filters, custom select
useJoinedRecords({
  client,
  query: {
    from: "issues",
    joins: [{ table: "teams", on: { left: "issues.team_id", right: "teams.id" } }],
    filters: [{ field: "status", operator: "=", value: "open" }],
  },
});
```

## Code style

- No comments unless explicitly asked
- Follow existing hook patterns: `UseXxxOptions` + `UseXxxResult` interfaces, `useMemo` return, `stringifyComparable` for stabilizing complex option objects, `resolvePodClient` for pod scoping, ref-stable callbacks for `onSuccess`/`onError`
- All hooks accept `client`, `podId?`, `enabled?`, `autoLoad?`
- New types go in the hook file, exported from `src/react/index.ts`
