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
- `registry.json` — Registry manifest (22 blocks)

## Registry blocks

The shadcn registry ships **22 blocks**. All blocks accept `appearance`, `density`, and `radius` props for cross-cutting visual control.

### Shell blocks
- **lemma-dashboard** — App shell with sidebar, header, KPI cards, nav groups, breadcrumbs, header actions
- **lemma-breadcrumbs** — Workspace breadcrumb navigation with `filePathToBreadcrumbItems()` and `recordBreadcrumbItems()` helpers

### Data blocks (for operators, not admins)
- **lemma-records-view** — Business-grade records workspace with:
  - Grid, list, grouped, kanban, and linear view modes
  - Inline editable cells, enum pill badges, FK labels
  - Filter builder dialog (field/operator/value AND logic)
  - Detail sheet with field view, FK resolution, reverse lookup sections, prev/next nav
  - Create form sheet (schema-aware, hides system fields, supports `submitVia: "function"`)
  - Props: `tableName`, `visibleColumns`, `hiddenFields`, `columnLabels`, `renderCell`, `renderCard`, `groupBy`, `defaultView`, `paginationMode`, `createMode`, `detailMode`, `detailVariant`, `detailTabs`, `detailRelatedRecords`, `foreignKeyLabels`, `onCreateOptions`, `onUpdateOptions`, `searchFields`, `enumColorMap`

- **lemma-record-form** — Standalone schema-aware form:
  - Hides id, created_at, updated_at, system/auto/computed fields
  - FK fields → searchable select; Enum → colored pills; JSON → monospace textarea
  - Modes: `inline` | `modal` | `sheet`
  - Supports `submitVia: "function"`, `fieldGroups`, `fieldOrder`, `foreignKeyLabels`
  - Props: `tableName`, `recordId?`, `mode?`, `submitVia?`, `submitFunctionName?`, `submitFunctionInput?`, `fieldGroups?`, `fieldOrder?`, `hiddenFields?`, `visibleFields?`, `foreignKeyLabels?`, `initialValues?`

- **lemma-insights** — Dashboard-style stats and charts:
  - Stat cards: count/sum/avg from table queries, or function outputs
  - Chart cards: bar/line/area/pie from table aggregation or function outputs
  - Props: `stats[]`, `charts[]`, `columns`, `aggregationMode`
  - Dependency: `recharts`

### Assistant blocks
- **lemma-assistant-experience** — Full assistant UI with message bubbles, tool invocation cards, file attachments, model picker, empty state suggestions
- **lemma-assistant-embedded** — Embedded assistant variant wrapping the experience view with `useAssistantController`

### Workflow and approval blocks
- **lemma-approval-queue** — Split-panel approval workflow with function-backed approve/reject/request-changes actions
- **lemma-email-workbench** — Three-panel AI-draft email review workbench (drafts, thread context, compose/preview)
- **lemma-workflow-runner** — Visual workflow run viewer with step-by-step progress timeline

### Date and schedule blocks
- **lemma-calendar** — Month/week calendar mapping records onto dates via `dateField`/`endDateField`
- **lemma-timeline** — Gantt-style timeline view with horizontal bars, color coding, progress, assignees

### Activity and communication blocks
- **lemma-activity-feed** — Unified audit feed aggregating events from multiple tables with type badges and date grouping
- **lemma-comments** — Record-scoped comment thread with function-backed submission

### File blocks
- **lemma-file-browser** — Datastore file browser with directory navigation, search, upload, delete
- **lemma-file-viewer** — Inline file preview (image, PDF, markdown, text, HTML)
- **lemma-attachment-viewer** — File attachments linked to a record with upload support
- **lemma-markdown-editor** — Markdown write/preview/split editor

### Search and navigation blocks
- **lemma-global-search** — Command-bar global search across record tables and files with assistant handoff

### User and notification blocks
- **lemma-members** — Member chips, avatar groups, searchable member select, user field resolver
  - Exports: `LemmaMemberChip`, `LemmaAvatarGroup`, `LemmaMemberSelect`, `LemmaUserField`
- **lemma-notification-bell** — Bell icon with unread count badge and notification popover
- **lemma-user-menu** — User avatar with dropdown menu and sign-out

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
