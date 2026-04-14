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
- `dist/` — Built output (generated, do not edit)
- `docs/hooks-guide.md` — Business-facing hook recipes and decision guide
- `examples/` — Working example apps
- `registry/` — Shadcn registry component source
- `registry.json` — Registry manifest (6 blocks)

## Registry blocks

The shadcn registry ships 6 blocks:

### Assistant blocks
- **lemma-assistant-experience** — Full assistant UI (chrome + experience)
- **lemma-assistant-embedded** — Embedded assistant variant

### Dashboard block
- **lemma-dashboard** — App shell with sidebar, header, KPI cards

### Data blocks (for operators, not admins)
- **lemma-records-view** — Business-grade records workspace with:
  - Grid view with inline editable cells, enum pill badges, FK labels
  - List view with card-based records and `renderCard` override
  - Grouped view (auto-detects status/priority columns for kanban-style grouping)
  - Filter builder dialog (field/operator/value AND logic)
  - Detail sheet with field view, FK resolution, reverse lookup sections, prev/next nav
  - Create form sheet (schema-aware, hides system fields, supports `submitVia: "function"`)
  - Props: `tableName`, `visibleColumns`, `hiddenFields`, `renderCell`, `renderCard`, `groupBy`, `foreignKeyLabels`, `onCreateOptions`, `onUpdateOptions`

- **lemma-record-form** — Standalone schema-aware form:
  - Hides id, created_at, updated_at, system/auto/computed fields
  - FK fields → searchable select; Enum → colored pills; JSON → monospace textarea
  - Modes: `inline` | `modal` | `sheet`
  - Supports `submitVia: "function"`, `fieldGroups`, `fieldOrder`
  - Props: `tableName`, `recordId?`, `mode?`, `submitVia?`, `submitFunctionName?`, `fieldGroups?`, `hiddenFields?`

- **lemma-insights** — Dashboard-style stats and charts:
  - Stat cards: count/sum/avg from table queries, or function outputs
  - Chart cards: bar/line/pie from table aggregation or function outputs
  - Props: `stats[]`, `charts[]`, `columns`
  - Dependency: `recharts`

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
import { useRecords, useRecordForm, useReferencingRecords } from "lemma-sdk/react";
```

Never import from individual hook files directly. Always use the barrel exports.

## Hook selection guide

When building a desk, choose hooks based on what the UI needs:

**Fetching data:**
- List of records → `useRecords`
- Single record → `useRecord`
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
- Run a workflow → `useWorkflowStart`

**Auth:**
- Gate the app → `AuthGuard`
- Read auth state → `useAuth`

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
