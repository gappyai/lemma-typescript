# Hook Recipes

Business-facing guide for building Lemma desks. Each recipe shows the hooks to use for a common UI pattern, with full working code.

## Decision Guide

### "I need to..."

| Goal | Hook | Why this one |
|------|------|-------------|
| Show a list of records | `useRecords` | Paginated list with filters, sort, search |
| Show one record's details | `useRecord` | Fetches by ID, unwraps `.data` automatically |
| Build a create/edit form | `useRecordForm` | Schema-driven fields, validation, dirty tracking |
| Show FK dropdown options | `useForeignKeyOptions` | Reads FK metadata, auto-detects label field |
| Create a record from a button | `useCreateRecord` | One-shot create with loading/error state |
| Update a record from a button | `useUpdateRecord` | One-shot update with loading/error state |
| Delete a record from a button | `useDeleteRecord` | One-shot delete with loading/error state |
| Bulk create/update/delete | `useBulkRecords` | Shared loading state across batch operations |
| Upload a pod file | `useUploadFile` | Headless file upload with loading/error state |
| Rename or move a file | `useUpdateFile` | One-shot file update covering rename, move, and metadata changes |
| Delete a file | `useDeleteFile` | Headless file delete for custom file browsers |
| Create a folder | `useCreateFolder` | Headless folder creation for file workspaces |
| Run a custom read-only SQL query | `useDatastoreQuery` | Headless access to joins, aggregates, and custom SQL-backed reads |
| Build KPI cards or chart rows | `useRecordAggregates` | High-level aggregate query hook for count/sum/avg/grouped reporting |
| Search across tables and files | `useGlobalSearch` | Multi-source search hook for custom command bars and omniboxes |
| Add an org member into a pod | `useAddPodMember` | Canonical pod membership add flow for stock members/admin UI |
| Change a pod member's role | `useUpdatePodMemberRole` | One-shot role transition with loading/error state |
| Remove a pod member | `useRemovePodMember` | Canonical pod membership removal flow |
| Create/update through a function | `useRecordForm({ submitVia: "function" })` | Routes payload through business logic |
| Run a function on click | `useFunctionRun` | Tracks loading, output, polling |
| Show all comments for an issue | `useReferencingRecords` | "Give me rows in table X where FK = Y" |
| Show related data in one query | `useRelatedRecords` | Auto-joins FK columns, returns nested objects |
| Join tables for a list view | `useJoinedRecords({ baseTable, joins })` | Shorthand cross-table joins |
| Discover what references a record | `useReverseRelatedRecords` | Auto-discovers reverse FK relationships |
| Run a workflow with its input schema | `useWorkflowStart` | Start, poll, resume, and inspect the workflow definition's input schema |
| Start or poll a known workflow run | `useWorkflowRun` | Lighter-weight run surface when you already know the workflow name |
| Gate the app with auth | `AuthGuard` + `useAuth` | Cookie/session auth, pod membership, access requests |

### When to use function-aware hooks

Most pods have business logic in functions (auto-generated identifiers, status transition guards, history logging). When a function wraps a create or update, use the `*Via: "function"` option so the hook goes through the function layer instead of bypassing it.

| Scenario | Hook | Option |
|----------|------|--------|
| Create form that auto-generates an identifier | `useRecordForm` | `submitVia: "function", submitFunctionName: "create-issue"` |
| Status transition that logs history | `useUpdateRecord` | `updateVia: "function", updateFunctionName: "update-issue-status"` |
| Add comment through a function | `useCreateRecord` | `createVia: "function", createFunctionName: "add-comment"` |
| Any mutation where the pod has a backing function | same hook | `*Via: "function", *FunctionName: "..."` |

---

## Recipes

### 1. Issue Detail Panel

Show one issue with its comments and status transition button.

```tsx
import { useRecord, useReferencingRecords, useUpdateRecord } from "lemma-sdk/react";

function IssueDetail({ client, issueId }: { client: LemmaClient; issueId: string }) {
  const { record: issue, isLoading } = useRecord({
    client,
    tableName: "issues",
    recordId: issueId,
  });

  const { records: comments, isLoading: isLoadingComments } = useReferencingRecords({
    client,
    table: "comments",
    foreignKey: "issue_id",
    recordId: issueId,
    sortBy: "created_at",
    order: "asc",
  });

  const { update: transitionStatus, isSubmitting } = useUpdateRecord({
    client,
    tableName: "issues",
    recordId: issueId,
    updateVia: "function",
    updateFunctionName: "update-issue-status",
  });

  if (isLoading) return <div>Loading issue...</div>;
  if (!issue) return <div>Issue not found</div>;

  return (
    <div>
      <h1>{String(issue.title)}</h1>
      <span>{String(issue.status)}</span>

      <button
        disabled={isSubmitting}
        onClick={() => transitionStatus({ status: "in_progress" })}
      >
        Start Progress
      </button>

      <h2>Comments</h2>
      {isLoadingComments ? (
        <div>Loading comments...</div>
      ) : (
        comments.map((c) => (
          <div key={String(c.id)}>
            <p>{String(c.body)}</p>
            <small>{String(c.created_at)}</small>
          </div>
        ))
      )}
    </div>
  );
}
```

### 2. Issue Creation Form (Function-Backed)

A form that creates issues through a `create-issue` function which auto-generates the identifier.

```tsx
import { useRecordForm, useForeignKeyOptions } from "lemma-sdk/react";

function CreateIssueDialog({ client, onClose }: { client: LemmaClient; onClose: () => void }) {
  const form = useRecordForm({
    client,
    tableName: "issues",
    mode: "create",
    submitVia: "function",
    submitFunctionName: "create-issue",
    submitFunctionInput: (payload) => ({
      title: payload.title,
      description: payload.description,
      team_id: payload.team_id,
      priority: payload.priority,
    }),
    hiddenFields: ["identifier", "created_at", "updated_at"],
    onSubmitSuccess: () => onClose(),
  });

  const teamOptions = useForeignKeyOptions({
    client,
    tableName: "issues",
    columnName: "team_id",
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); void form.submit(); }}>
      {form.editableFields.map((field) => {
        if (field.foreignKey && field.name === "team_id") {
          return (
            <select
              key={field.name}
              value={String(form.values[field.name] ?? "")}
              onChange={(e) => form.setValue(field.name, e.target.value)}
            >
              <option value="">Select team...</option>
              {teamOptions.options.map((opt) => (
                <option key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
          );
        }

        return (
          <input
            key={field.name}
            placeholder={field.label}
            value={String(form.values[field.name] ?? "")}
            onChange={(e) => form.setValue(field.name, e.target.value)}
          />
        );
      })}

      {Object.values(form.fieldErrors).map((err) => (
        <span key={err} className="error">{err}</span>
      ))}

      <button type="submit" disabled={form.isSubmitting || !form.isDirty}>
        {form.isSubmitting ? "Creating..." : "Create Issue"}
      </button>
    </form>
  );
}
```

### 3. Issues List with Team Names

A list view that shows issues joined with their assigned team.

```tsx
import { useJoinedRecords } from "lemma-sdk/react";

function IssuesList({ client }: { client: LemmaClient }) {
  const { records, isLoading } = useJoinedRecords({
    client,
    baseTable: "issues",
    joins: [{ table: "teams", on: "team_id" }],
    // The hook reads the FK metadata on issues.team_id
    // to discover it references teams.id, and builds the join automatically.
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <table>
      <thead>
        <tr><th>Title</th><th>Status</th><th>Team</th></tr>
      </thead>
      <tbody>
        {records.map((row) => (
          <tr key={String(row.id)}>
            <td>{String(row.title)}</td>
            <td>{String(row.status)}</td>
            <td>{String(row.teams?.name ?? "—")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 4. Add Comment Button

A one-shot create that routes through a function.

### 5. Headless File Actions

Build your own file workspace without depending on a stock file-browser component.

```tsx
import {
  useCreateFolder,
  useDeleteFile,
  useFiles,
  useUpdateFile,
  useUploadFile,
} from "lemma-sdk/react";

function FilesWorkspace({ client }: { client: LemmaClient }) {
  const files = useFiles({
    client,
    directoryPath: "/docs",
  });

  const upload = useUploadFile({ client });
  const createFolder = useCreateFolder({ client });
  const renameFile = useUpdateFile({ client });
  const deleteFile = useDeleteFile({ client });

  return (
    <div>
      <button
        onClick={() => {
          const blob = new Blob(["hello world"], { type: "text/plain" });
          void upload.upload(blob, {
            name: "hello.txt",
            directoryPath: "/docs",
          }).then(() => files.refresh());
        }}
      >
        Upload file
      </button>

      <button
        onClick={() => {
          void createFolder.createFolder("drafts", {
            directoryPath: "/docs",
          }).then(() => files.refresh());
        }}
      >
        New folder
      </button>

      <ul>
        {files.files.map((file) => (
          <li key={file.path}>
            <span>{file.name}</span>
            <button
              onClick={() => {
                void renameFile.update(
                  { name: `renamed-${file.name}` },
                  { path: file.path },
                ).then(() => files.refresh());
              }}
            >
              Rename
            </button>
            <button
              onClick={() => {
                void deleteFile.remove({ path: file.path }).then(() => files.refresh());
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 6. KPI And Grouped Reporting

Use `useRecordAggregates` when your app needs counts, sums, averages, or grouped chart rows without depending on a stock insights block.

```tsx
import { useRecordAggregates } from "lemma-sdk/react";

function PipelineSummary({ client }: { client: LemmaClient }) {
  const totals = useRecordAggregates({
    client,
    tableName: "deals",
    metrics: [
      { key: "open_deals", op: "count" },
      { key: "pipeline_value", op: "sum", field: "amount" },
    ],
    filters: [{ field: "status", op: "!=", value: "closed_lost" }],
  });

  const byStage = useRecordAggregates({
    client,
    tableName: "deals",
    groupBy: "stage",
    metrics: [
      { key: "deal_count", op: "count" },
      { key: "total_amount", op: "sum", field: "amount" },
    ],
    orderBy: [{ field: "total_amount", direction: "desc" }],
  });

  return (
    <div>
      <pre>{JSON.stringify(totals.row, null, 2)}</pre>
      <pre>{JSON.stringify(byStage.rows, null, 2)}</pre>
    </div>
  );
}
```

### 7. Multi-Source Search

Use `useGlobalSearch` for a custom desk command bar that searches multiple tables and files without depending on a stock search component.

```tsx
import { useMemo } from "react";
import { useGlobalSearch } from "lemma-sdk/react";

function DeskSearch({ client, query }: { client: LemmaClient; query: string }) {
  const search = useGlobalSearch({
    client,
    query,
    tables: [
      {
        tableName: "issues",
        label: "Issues",
        searchFields: ["identifier", "title", "description"],
        displayField: "title",
        subtitleField: "status",
      },
      {
        tableName: "deals",
        label: "Deals",
        searchFields: ["name", "company", "stage"],
        displayField: "name",
        subtitleField: "stage",
      },
    ],
    files: {
      enabled: true,
      label: "Docs",
      limit: 6,
    },
  });

  const groups = useMemo(() => {
    const grouped = new Map<string, { sourceLabel: string; items: typeof search.results }>();
    search.results.forEach((result) => {
      const existing = grouped.get(result.sourceKey);
      if (existing) {
        existing.items.push(result);
        return;
      }
      grouped.set(result.sourceKey, {
        sourceLabel: result.sourceLabel,
        items: [result],
      });
    });
    return Array.from(grouped.entries());
  }, [search.results]);

  return (
    <div>
      {groups.map(([sourceKey, group]) => (
        <section key={sourceKey}>
          <h3>{group.sourceLabel}</h3>
          <ul>
            {group.items.map((result) => (
              <li key={result.kind === "record" ? `${result.tableName}:${result.id}` : result.path}>
                {result.title}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

```tsx
import { useState } from "react";
import { useCreateRecord } from "lemma-sdk/react";

function AddCommentButton({ client, issueId }: { client: LemmaClient; issueId: string }) {
  const [body, setBody] = useState("");

  const { create, isSubmitting } = useCreateRecord({
    client,
    tableName: "comments",
    createVia: "function",
    createFunctionName: "add-comment",
    onSuccess: () => setBody(""),
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!body.trim()) return;
      void create({ issue_id: issueId, body });
    }}>
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment..."
      />
      <button type="submit" disabled={isSubmitting || !body.trim()}>
        {isSubmitting ? "Adding..." : "Comment"}
      </button>
    </form>
  );
}
```

### 5. Status Transition Dropdown

A dropdown that transitions an issue through a function (preserving history log).

```tsx
import { useUpdateRecord } from "lemma-sdk/react";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "closed", label: "Closed" },
] as const;

function StatusTransition({ client, issueId, currentStatus }: {
  client: LemmaClient;
  issueId: string;
  currentStatus: string;
}) {
  const { update, isSubmitting } = useUpdateRecord({
    client,
    tableName: "issues",
    recordId: issueId,
    updateVia: "function",
    updateFunctionName: "update-issue-status",
  });

  return (
    <select
      value={currentStatus}
      disabled={isSubmitting}
      onChange={(e) => update({ status: e.target.value })}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
```

### 6. History and Activity Feed

Show both comments and history entries for an issue, each from different tables.

```tsx
import { useReferencingRecords } from "lemma-sdk/react";

function IssueActivity({ client, issueId }: { client: LemmaClient; issueId: string }) {
  const comments = useReferencingRecords({
    client,
    table: "comments",
    foreignKey: "issue_id",
    recordId: issueId,
    sortBy: "created_at",
    order: "desc",
  });

  const history = useReferencingRecords({
    client,
    table: "issue_history",
    foreignKey: "issue_id",
    recordId: issueId,
    sortBy: "created_at",
    order: "desc",
  });

  return (
    <div>
      <section>
        <h3>Comments</h3>
        {comments.records.map((c) => (
          <div key={String(c.id)}>
            <p>{String(c.body)}</p>
            <time>{String(c.created_at)}</time>
          </div>
        ))}
      </section>

      <section>
        <h3>Status History</h3>
        {history.records.map((h) => (
          <div key={String(h.id)}>
            <span>{String(h.from_status)} → {String(h.to_status)}</span>
            <time>{String(h.created_at)}</time>
          </div>
        ))}
      </section>
    </div>
  );
}
```

### 7. Related Records (Forward FK)

Show issues with their assigned team and priority label joined in.

```tsx
import { useRelatedRecords } from "lemma-sdk/react";

function IssuesWithTeams({ client }: { client: LemmaClient }) {
  const { records, columns, isLoading } = useRelatedRecords({
    client,
    tableName: "issues",
    include: [
      { foreignKey: "team_id", as: "team" },
      { foreignKey: "priority_id", as: "priority" },
    ],
  });

  if (isLoading) return <div>Loading...</div>;

  // records[0] = { id, title, status, team: { id, name }, priority: { id, label } }
  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => <th key={col.key}>{col.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {records.map((row: any) => (
          <tr key={row.id}>
            <td>{row.title}</td>
            <td>{row.status}</td>
            <td>{row.team?.name}</td>
            <td>{row.priority?.label}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 8. Bulk Status Assignment

Select multiple issues and assign them to a sprint or cycle.

```tsx
import { useBulkRecords } from "lemma-sdk/react";

function BulkAssign({ client, selectedIds, sprintId }: {
  client: LemmaClient;
  selectedIds: string[];
  sprintId: string;
}) {
  const { updateMany, isSubmitting } = useBulkRecords({
    client,
    tableName: "issues",
  });

  return (
    <button
      disabled={isSubmitting || selectedIds.length === 0}
      onClick={() => {
        void updateMany(
          selectedIds.map((id) => ({ id, sprint_id: sprintId })),
        );
      }}
    >
      {isSubmitting ? "Assigning..." : `Assign ${selectedIds.length} to sprint`}
    </button>
  );
}
```

### 9. Pod Membership Admin Actions

Read pod members, add existing organization members into the pod, change roles, and remove access.

```tsx
import { PodRole, type LemmaClient } from "lemma-sdk";
import {
  useAddPodMember,
  useMembers,
  useOrganizationMembers,
  useRemovePodMember,
  useUpdatePodMemberRole,
} from "lemma-sdk/react";

function PodMembersAdmin({
  client,
  podId,
  organizationId,
}: {
  client: LemmaClient;
  podId: string;
  organizationId: string;
}) {
  const podMembers = useMembers({ client, podId });
  const organizationMembers = useOrganizationMembers({ client, organizationId });
  const addMember = useAddPodMember({ client, podId, defaultRole: PodRole.POD_USER });
  const updateRole = useUpdatePodMemberRole({ client, podId });
  const removeMember = useRemovePodMember({ client, podId });

  const addableMembers = organizationMembers.members.filter(
    (orgMember) => !podMembers.members.some((podMember) => podMember.user_id === orgMember.user_id),
  );

  return (
    <div>
      <h2>Pod Members</h2>
      {podMembers.members.map((member) => (
        <div key={member.user_id}>
          <span>{member.user_name ?? member.user_email ?? member.user_id}</span>
          <select
            value={member.role}
            onChange={(e) =>
              void updateRole.updateRole(e.target.value as PodRole, {
                memberId: member.user_id,
              })
            }
          >
            {Object.values(PodRole).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button onClick={() => void removeMember.remove({ memberId: member.user_id })}>
            Remove
          </button>
        </div>
      ))}

      <h3>Add From Organization</h3>
      {addableMembers.map((member) => (
        <button
          key={member.id}
          onClick={() =>
            void addMember.add({
              organizationMemberId: member.id,
              role: PodRole.POD_USER,
            })
          }
        >
          Add {[member.user?.first_name, member.user?.last_name].filter(Boolean).join(" ") || member.user?.email || member.user_id}
        </button>
      ))}
    </div>
  );
}
```

### 10. Function Runner Panel

Run a function from a button, show loading state and output.

```tsx
import { useFunctionRun } from "lemma-sdk/react";

function TriageButton({ client, issueId }: { client: LemmaClient; issueId: string }) {
  const { start, output, isFinished, isPolling } = useFunctionRun({
    client,
    functionName: "issue-triage",
  });

  return (
    <div>
      <button
        disabled={isPolling}
        onClick={() => start({ issue_id: issueId })}
      >
        {isPolling ? "Triaging..." : "Triage Issue"}
      </button>
      {isFinished && output && (
        <div className="output">
          <p>Priority: {String((output as any).priority)}</p>
          <p>Team: {String((output as any).team_id)}</p>
        </div>
      )}
    </div>
  );
}
```

### 11. Workflow Launcher

Start a workflow with a form for its input schema.

```tsx
import { useWorkflowStart } from "lemma-sdk/react";

function ApproveButton({ client, issueId }: { client: LemmaClient; issueId: string }) {
  const { start, isStarting, inputSchema, status } = useWorkflowStart({
    client,
    workflowName: "approve-issue",
  });

  return (
    <button
      disabled={isStarting}
      onClick={() => start({ issue_id: issueId })}
    >
      {isStarting ? "Starting..." : status ?? "Request Approval"}
    </button>
  );
}
```

---

## Hook API Reference

### Data-fetching hooks

All data-fetching hooks share these conventions:

- `enabled?: boolean` — Set to `false` to skip loading and reset state. Default `true`.
- `autoLoad?: boolean` — Set to `false` to wait for an explicit `refresh()` call. Default `true`.
- `podId?: string` — Override the client's default pod scope.
- `isLoading: boolean` — True while the request is in flight.
- `error: Error | null` — Normalized error from the last failed request.
- `refresh()` — Re-run the query. Returns the fetched data.

### Mutation hooks

All mutation hooks share these conventions:

- Call the mutation function (`create`, `update`, `remove`) from an event handler.
- `isSubmitting: boolean` — True while the mutation is in flight.
- `error: Error | null` — Normalized error from the last failed mutation.
- `reset()` — Clear the result, error, and loading state.
- `onSuccess` / `onError` callbacks (stable across re-renders).

Pod membership mutations follow the same shape:

- `useAddPodMember().add({ organizationMemberId, role })`
- `useUpdatePodMemberRole().updateRole(role, { memberId })`
- `useRemovePodMember().remove({ memberId })`

The current generated client supports adding an existing organization member into a pod. Direct email-to-pod invite is not yet exposed in this checked-in SDK surface.

### Function-aware options

Three hooks support routing mutations through pod functions:

| Hook | Direct option | Function option | Function name option |
|------|--------------|----------------|---------------------|
| `useRecordForm` | `submitVia: "direct"` | `submitVia: "function"` | `submitFunctionName` |
| `useCreateRecord` | `createVia: "direct"` | `createVia: "function"` | `createFunctionName` |
| `useUpdateRecord` | `updateVia: "direct"` | `updateVia: "function"` | `updateFunctionName` |

When `*Via: "function"` is set, the mutation calls `client.functions.runs.create(functionName, { input })` instead of `client.records.create/update`. The function name defaults to `tableName` if not provided.

For `useRecordForm`, the `submitFunctionInput` option lets you transform the form payload before passing it to the function. This is useful when the function expects a different shape than the raw record (e.g., stripping auto-generated fields).

### Field visibility in useRecordForm

`useRecordForm` returns `fields` and `editableFields` from the table schema. Control which fields appear:

- `visibleFields: string[]` — Only these fields appear. Takes precedence over `hiddenFields`.
- `hiddenFields: string[]` — These fields are excluded.

Use `hiddenFields` to hide auto-generated or system columns (e.g., `identifier`, `created_at`). Use `visibleFields` when you want a minimal form with only a few fields.

### Relationship hooks

Three hooks cover different directions of FK relationships:

| Hook | Direction | Mental model | When to use |
|------|-----------|-------------|-------------|
| `useRelatedRecords` | Forward | "I have issues, show me the team for each" | List view with joined parent data |
| `useReferencingRecords` | Reverse (simple) | "Show me all comments where issue_id = X" | Detail panel, activity feed |
| `useReverseRelatedRecords` | Reverse (discovery) | "What tables reference this issue?" | Exploratory UI, when you don't know the FK upfront |
| `useJoinedRecords` | Arbitrary | "Join issues with teams" | Custom cross-table queries, reporting |

### Joined records

`useJoinedRecords` supports two API styles:

**Full query** — for complex joins with custom select, filters, expressions:

```tsx
useJoinedRecords({
  client,
  query: {
    from: "issues",
    joins: [{
      table: "teams",
      on: { left: "issues.team_id", right: "teams.id" },
    }],
    filters: [{ field: "status", operator: "=", value: "open" }],
    limit: 50,
  },
});
```

**Shorthand** — for FK-based joins, the hook auto-resolves the join condition:

```tsx
useJoinedRecords({
  client,
  baseTable: "issues",
  joins: [
    { table: "teams", on: "team_id" },
    { table: "users", on: "assignee_id" },
  ],
});
```

The `on` field names a FK column on the base table. The hook reads the FK metadata to find the referenced table and column, then builds the join automatically.

### Foreign key options

`useForeignKeyOptions` turns any FK column into dropdown options:

```tsx
const { options, isLoading } = useForeignKeyOptions({
  client,
  tableName: "issues",
  columnName: "team_id",
  search: "eng",           // server-side search when labelField is set
  labelField: "name",      // use the "name" column as the option label
});

// options = [
//   { value: "team_1", label: "Engineering", record: { id: "team_1", name: "Engineering", ... } },
//   { value: "team_2", label: "Product", record: { ... } },
// ]
```

If `labelField` is not set, the hook auto-detects the best label column in this order: `name` > `title` > `label` > `email` > `slug` > FK column > `id`.

### Headless helpers

Reach for helper exports when the behavior is shared but the UI should stay app-local:

- `lemma-sdk`: `formatRecordDisplayValue`, `detectRecordStatusColumn`, `buildRecordSchemaFields`, `buildSchemaFormFields`

---

## Common Patterns

### List + Detail split

The most common desk pattern: a list on the left, details on the right.

```tsx
function IssuesPage({ client }: { client: LemmaClient }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useRecords({ client, tableName: "issues", limit: 50 });
  const detail = useRecord({ client, tableName: "issues", recordId: selectedId });

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "50%" }}>
        {list.records.map((issue) => (
          <div key={String(issue.id)} onClick={() => setSelectedId(String(issue.id))}>
            {String(issue.title)}
          </div>
        ))}
      </div>
      <div style={{ width: "50%" }}>
        {detail.record ? (
          <IssueDetail client={client} issueId={String(detail.record.id)} />
        ) : (
          <p>Select an issue</p>
        )}
      </div>
    </div>
  );
}
```

### Auth-gated app

Wrap your app with `AuthGuard` to handle auth + pod membership automatically.

```tsx
import { AuthGuard } from "lemma-sdk/react";

function App() {
  return (
    <AuthGuard client={client}>
      <MyDesk />
    </AuthGuard>
  );
}
```

`AuthGuard` handles three states:
1. **Loading** — shows `loadingFallback` (blank by default)
2. **Unauthenticated** — redirects to the Lemma auth page
3. **Authenticated but not a pod member** — shows the request-access flow

### Multiple actions on one page

A detail page with several action buttons, each using its own mutation hook:

```tsx
function IssueActions({ client, issueId }: { client: LemmaClient; issueId: string }) {
  const status = useUpdateRecord({
    client, tableName: "issues", recordId: issueId,
    updateVia: "function", updateFunctionName: "update-issue-status",
  });

  const assign = useUpdateRecord({
    client, tableName: "issues", recordId: issueId,
    updateVia: "function", updateFunctionName: "assign-issue",
  });

  const comment = useCreateRecord({
    client, tableName: "comments",
    createVia: "function", createFunctionName: "add-comment",
  });

  return (
    <div>
      <button onClick={() => status.update({ status: "closed" })} disabled={status.isSubmitting}>
        Close
      </button>
      <button onClick={() => assign.update({ assignee_id: "user_1" })} disabled={assign.isSubmitting}>
        Assign
      </button>
      <button onClick={() => comment.create({ issue_id: issueId, body: "Looking into this." })} disabled={comment.isSubmitting}>
        Quick comment
      </button>
    </div>
  );
}
```

Each hook manages its own loading/error state independently. This is the idiomatic React pattern — one hook per concern.
