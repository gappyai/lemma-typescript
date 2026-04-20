# Registry Standardization Plan

Goal: reduce the registry to a small set of strong primitives for building Airtable-like, Notion-like, Linear-like, and Jira-like internal tools.

This plan assumes there are no external users and no compatibility constraints. We can delete aggressively, rename props freely, and move capabilities into canonical components without deprecation wrappers.

## Product Direction

Execution is tracked in [registry-todo.md](./registry-todo.md). Keep this plan as the rationale and component model; keep the TODO file as the active short list.

The registry should make these builds easy by default:

- Airtable-like data workspace
- Linear/Jira-like issue tracker
- Notion-like internal workspace with pages, files, notes, comments, and assistant help
- General internal operations apps with approvals, triage, and workflows composed from the same primitives

Files are first-class in this story. Lemma pods have a real unstructured datastore namespace with folders, search, previews, and converted artifacts. The file experience should not be reduced to "attachments on records," even if records can link to files.

The problem to solve is not component count. The problem is overlap, duplicate mental models, and too many workflow-specific blocks competing with the core primitives.

## Principles

- One canonical records workspace.
- One canonical record detail system.
- One canonical record form system.
- One canonical assistant system.
- One unified files story.
- One canonical document workspace story over pod-backed files.
- One canonical members and access-management story.
- Workflow-specific experiences should be built as presets, recipes, or app templates, not as first-class registry blocks.
- Shared props and behavior matter more than shipping more blocks.

## Shared API Contract For Surviving Blocks

Every surviving block should converge on the same host-app contract where it makes sense:

- `appearance`, `density`, `radius`, `chrome`
- `title`, `description`, `headerActions`, `className`
- `emptyState`, `loadingState`, `errorState`
- `onOpen`, `getHref`, `openMode`
- `onSuccess`, `onError`
- slot props for key surfaces instead of hardcoded layout branches
- a future shared action contract for direct, function, workflow, and agent-backed actions

Cross-cutting technical work:

- Centralize async states so loading, empty, error, and success states look and behave the same.
- Centralize member/user resolution so raw ids stop leaking into UI.
- Centralize record detail field rendering instead of maintaining multiple detail implementations.
- Centralize schema-driven field rendering instead of maintaining multiple form renderers.
- Stop introducing new workflow-specific blocks when the behavior can be expressed as a preset over the canonical primitives.
- Treat files as pod-scoped content first, with record-linking as a composition pattern rather than the defining model.

## Phase 2/3 Implementation Contract

These are the exact shared modules and boundaries we should converge on during the current cleanup.

- `components/lemma/record-form-fields.tsx` is the shared install target for schema-driven form controls.
- `lemma-record-form` and `lemma-records-view` form sheets should only compose layout, submit behavior, and grouping around that shared field module.
- `components/lemma/records-detail.tsx` is the shared install target for record detail rendering.
- `lemma-records-view` owns the canonical detail internals; `lemma-detail-panel` should only own record loading, empty/error states, and action orchestration around it.
- `lemma-detail-panel` must install the shared records-detail dependencies directly in `registry.json` so it remains standalone when added without `lemma-records-view`.
- Shared convergence work in phase 2/3 is not optional polish. If a new detail or form branch appears outside these shared targets, treat that as regression.

Current phase 2/3 targets:

- remove duplicate FK/select/JSON/textarea field control implementations
- remove duplicate read-only detail rendering paths
- make inline detail editing use the same control layer as schema-driven forms
- make foreign-key navigation a capability of the canonical detail renderer
- make custom detail tabs a capability of the canonical detail renderer
- tighten registry manifests so shared implementation files install with the blocks that depend on them

Current implementation status:

- shared field controls now live in `registry/default/lemma-record-form/components/record-form-fields.tsx`
- shared detail rendering now lives in `registry/default/lemma-records-view/components/records-detail.tsx`
- `lemma-detail-panel` is now a wrapper around the canonical detail renderer instead of a separate renderer
- inline detail editing now uses the same control layer as create/edit forms
- pod member mutation hooks now live in `src/react/useAddPodMember.ts`, `src/react/useUpdatePodMemberRole.ts`, and `src/react/useRemovePodMember.ts`
- `lemma-members` now uses those hooks instead of calling `client.podMembers` directly
- `examples/inbox-crm` now copies only the canonical registry files and showcases the kept block set in one routed desk

## Canonical Component Set

| Component | About | Duplicate? | Explanation | Keep | Variants |
| --- | --- | --- | --- | --- | --- |
| `lemma-records-view` | Core records workspace | No | This becomes the primary workspace block and absorbs most data-view duplication. | yes | `table`, `list`, `grid`, `grouped`, `kanban`, `linear`, `calendar`, `timeline`, `matrix`; configurable detail mode; configurable related sections; custom cells/cards; saved views later |
| `lemma-detail-panel` | Canonical record detail primitive | Partial | It overlaps with `records-view` detail, but we still want a standalone detail surface that shares the same internals. | yes | `inline`, `sidebar`, `sheet`, `modal`, `page`; `readOnly`; `editable`; `tabs`; `sections`; related records; files; comments; activity |
| `lemma-record-form` | Canonical create/edit primitive | No | This is the only schema-driven record form block we should maintain. | yes | `inline`, `sheet`, `modal`, `wizard`; field groups; field order; conditional visibility; searchable FK inputs; direct/function submit |
| `lemma-global-search` | Search and command palette | No | Core shell/search primitive for Airtable, Notion, and Linear-like apps. | yes | `dialog`, `inline`, `page`; grouped results; quick actions; assistant handoff; record/file scopes |
| `lemma-breadcrumbs` | Shell navigation | No | Small but useful primitive for route, record, page, and file navigation. | yes | route, record, file-path, page-tree aware |
| `lemma-file-browser` | Canonical file workspace | No | Defines the main pod-files story: folders, search, upload, browse, and retrieval for unstructured content. | yes | workspace browser, compact browser, search/results mode, picker mode, folder-tree mode |
| `lemma-file-viewer` | Canonical file preview | No | The main reader/preview surface for datastore files and converted artifacts. | yes | inline, sheet, modal, full-page, split preview, document reader |
| `lemma-document-workspace` | Canonical document workspace | No | The flagship create/read/edit surface for block-native pod-backed documents. | yes | page, modal, create, read, edit, assistant context, references, metadata rails |
| `lemma-document-creator` | Lightweight document creation | Partial | Useful for explicit file/template/import flows beside the richer workspace. | yes | page, modal, folder targeting, starter templates, import path |
| `lemma-document-viewer` | Supporting document reader | Partial | A focused read-only surface for structured documents when the full workspace is too much. | yes | page, modal, metadata rail, references, assistant launch |
| `lemma-document-editor` | Supporting document authoring | Partial | A focused authoring surface for structured documents when the full workspace is not needed. | yes | page, modal, save state, outline, references, assistant launch |
| `lemma-markdown-editor` | Lightweight markdown editor | No | Useful for plain markdown fields and notes beside the richer block-native document lane. | yes | write, preview, split, read-only |
| `lemma-members` | People/member and access workspace | No | This should grow beyond chips/selects into the standard members page most apps will need. | yes | chip, avatar group, member select, user resolver, members list page, access admin workspace |
| `lemma-comments` | Record discussion thread | No | Important detail primitive for issue trackers, projects, requests, and docs. | yes | inline, sidebar, compact, read-only, composer on/off |
| `lemma-activity-feed` | Event and history feed | No | Needed for Linear/Jira-like history and audit surfaces. | yes | record feed, workspace feed, compact, grouped by day/source |
| `lemma-insights` | Metrics and charts | No | Canonical analytics primitive. It should absorb funnel-style reporting. | yes | stats, bar, line, area, pie, funnel, function-backed metrics |
| `lemma-assistant-experience` | Canonical assistant UI | No | The only assistant block we should keep. Embedded should become a variant here. | yes | full page, side panel, embedded, compact, context-aware launch states |
| `lemma-status-flow` | Status and transition control | No | Important Linear/Jira-like primitive for record workflows. | yes | interactive, read-only, compact, expanded, horizontal, vertical, tracker mode |
| `lemma-workflow-runner` | Workflow run visualization | No | Distinct workflow execution primitive worth keeping. | yes | sidebar, full page, compact, step detail, live status |
| `lemma-page-tree` | Hierarchical page navigation | No | Important for Notion-like page/workspace experiences. | yes | sidebar tree, compact tree, selectable, create/reorder hooks |
| `lemma-notification-bell` | Notifications shell primitive | No | Useful shell component once the rest of the workspace exists. | yes | compact badge, grouped popover, action rows |
| `lemma-user-menu` | User/auth shell primitive | No | Standard shell primitive for internal apps. | yes | compact, full menu, custom actions |
| `lemma-inbox` | Opinionated records workspace | Yes | This is a preset over records + detail, not a primitive. | no | fold into `lemma-records-view` triage preset |
| `lemma-approval-queue` | Opinionated records workspace | Yes | Approval UX should be composed from records + detail + status/action slots. | no | fold into recipe/template, not registry block |
| `lemma-email-workbench` | Workflow-specific review UI | Yes | Too specialized for the core registry. Better as an app template. | no | move to example/template only |
| `lemma-linked-records` | Related-records surface | Yes | Related records belong inside `detail-panel` and `records-view`, not as a separate block. | no | fold into detail related-sections API |
| `lemma-calendar` | Date-based records view | Yes | This should be a records view mode. | no | fold into `lemma-records-view` calendar mode |
| `lemma-timeline` | Gantt-like records view | Yes | This should be a records view mode. | no | fold into `lemma-records-view` timeline mode |
| `lemma-matrix` | Pivot/crosstab records view | Yes | Useful, but it should be a records view mode. | no | fold into `lemma-records-view` matrix mode |
| `lemma-attachment-viewer` | Record-file surface | Yes | File linkage should be handled by the canonical files story plus detail-panel sections, not by a separate block. | no | fold into `detail-panel` file section + canonical file picker/link flows |
| `lemma-assistant-embedded` | Assistant wrapper | Yes | Thin wrapper around the canonical assistant block. | no | fold into `lemma-assistant-experience` embedded mode |
| `lemma-progress-tracker` | Read-only stepper | Yes | This overlaps with non-interactive `status-flow`. | no | fold into `lemma-status-flow` tracker mode |
| `lemma-pipeline-funnel` | Funnel visualization | Yes | This belongs under the analytics story, not as a separate block. | no | fold into `lemma-insights` funnel variant |
| `lemma-checklist` | Checklist workflow surface | Yes | Better expressed as related records + inline actions in detail or records view. | no | move to recipe/template only |
| `lemma-scorecard` | Structured evaluation UI | Yes | Better as a recipe over form, detail, and insights primitives. | no | move to recipe/template only |
| `lemma-schedule-view` | Time-grid scheduler | No | This is distinct, but it is not in the initial product story and should be removed for now. | no | delete now; revisit later only if scheduling becomes a product lane |
| `lemma-org-chart` | Hierarchy visualization | No | Distinct but not part of the default internal-tools kit. | no | delete now; revisit later if we commit to people/org tooling |
| `lemma-diff-viewer` | Utility viewer | No | Useful utility, but not part of the core internal-tools kit. | no | delete now; revisit later if change-review becomes a product lane |
| `lemma-dashboard` | Unshipped stub | No | There is no registered implementation and no reason to keep the stub around. | no | delete folder |

## Components To Improve

These are the blocks we should actively invest in.

### 1. `lemma-records-view`

Must become the flagship block.

Required work:

- Add `calendar`, `timeline`, and `matrix` as first-class view modes.
- Make detail rendering use the same internals as `lemma-detail-panel`.
- Add related-record sections so `lemma-linked-records` goes away.
- Add record file sections so `lemma-attachment-viewer` goes away.
- Add stronger column configuration: sort, visibility, widths, primary field pinning.
- Add reusable presets for `triage`, `issues`, `crm`, and `docs`.
- Normalize action slots for row actions, bulk actions, and detail actions.
- Make search, filtering, empty states, and loading states feel product-grade by default.

### 2. `lemma-detail-panel`

Must become the standalone entry point into the same detail system used by records view.

Required work:

- Rebuild around shared detail internals instead of maintaining a separate renderer.
- Support `inline`, `sheet`, `modal`, and `page` consistently.
- Add slot-based sections for comments, activity, files, related records, and custom tabs.
- Add editable/read-only modes without branching into separate components.
- Normalize action APIs with records view.

### 3. `lemma-record-form`

Must become the only schema-driven field-rendering layer.

Required work:

- Share field renderer with every create/edit path in the registry.
- Replace basic FK selects with searchable combobox behavior.
- Add conditional field visibility and section-level visibility.
- Add `wizard` mode for long forms.
- Normalize direct/function-backed mutation props across blocks.

### 4. `lemma-insights`

Must absorb more reporting use cases so separate analytics blocks are unnecessary.

Required work:

- Add funnel as a native chart/report type.
- Add better table-to-chart mapping helpers.
- Add layout presets for dashboard cards, narrow sidecards, and full-page reports.
- Normalize value formatting and chart legends.

### 5. `lemma-assistant-experience`

Must become the only assistant UI block.

Required work:

- Add `embedded` mode so `lemma-assistant-embedded` can be deleted.
- Add launch/context props for record, file, table, and search-result context.
- Add compact and side-panel layouts.
- Keep the visual system aligned with records/detail/files surfaces.

### 6. `lemma-members`

Must become both a reusable people primitive set and a full members-management workspace.

Required work:

- Keep the existing chip, avatar-group, select, and user-field primitives.
- Add a standard full-page members workspace used by most apps without custom work.
- Support member list, search, role display, role updates, removal, and invite/add flows.
- Add hooks for pod member management instead of staying read-only.
- Reflect the real backend model cleanly: organization membership, pod membership, role changes, and invite/add actions.

### 7. `lemma-status-flow`

Must absorb stepper/tracker behavior.

Required work:

- Add a non-interactive tracker mode so `lemma-progress-tracker` can be deleted.
- Add clearer status semantics for issue/project workflows.
- Support denser inline usage inside detail headers and list rows.

### 8. `lemma-file-browser` + `lemma-file-viewer`

Must define one unified files story.

Required work:

- Treat pod files and folders as the primary model, not record attachments.
- Support folder navigation, path breadcrumbs, search, converted previews, upload, move, rename, and delete.
- Add file picker/link flows as optional integrations for records and workflows.
- Make attachments a usage mode, not the central abstraction.
- Standardize preview and action surfaces between browser and viewer.

### 9. `lemma-markdown-editor` + `lemma-file-viewer`

Must become credible document tooling over time, not just "good enough markdown."

Required work:

- Treat this as a phase 4/5 investment rather than a near-term blocker.
- Evaluate replacing the current editing surface with a stronger foundation such as Tiptap or Plate.
- Aim for Notion-quality reading and authoring for internal docs, notes, and knowledge pages.
- Ensure file viewing and document authoring feel like one document system, not disconnected widgets.

### 10. `lemma-comments` + `lemma-activity-feed`

Must become first-class detail sections.

Required work:

- Ensure both can render comfortably inside `detail-panel` and `records-view` detail.
- Add compact variants for sidebars and split panes.
- Normalize headers, pagination/refresh behavior, and action slots.

## Hook And Action Roadmap

These are not all phase-1 tasks, but they should be part of the architecture from the start.

### Pod member management hooks

Current state:

- `useMembers` is read-only in the SDK today.
- The client namespace already supports pod member add, role update, and remove actions.

Planned work:

- Add first-class pod-member mutation hooks for add/invite, role update, and remove.
- Refresh the generated client surface if needed so the hook layer exposes the newer direct pod-invite flow cleanly.
- Add a higher-level members admin hook or controller if that gives a cleaner UI integration path.
- Update the members block to use those hooks directly in its page/admin variants.

### First-class long-running actions

This is a later-phase but important direction for records/detail/workspace UX.

Planned work:

- Define a shared action model that can execute direct mutations, functions, workflows, and agents.
- Allow actions in records tables, detail panels, and other blocks to declare their execution type instead of only "direct" vs "function".
- Add a lightweight live "working" surface that shows in-progress actions until they reach a terminal state.
- Keep this as phase 4/5 so the primitive cleanup lands first.

## Components To Remove

Delete these from the registry completely in the first cleanup pass:

- `lemma-inbox`
- `lemma-approval-queue`
- `lemma-email-workbench`
- `lemma-linked-records`
- `lemma-calendar`
- `lemma-timeline`
- `lemma-matrix`
- `lemma-attachment-viewer`
- `lemma-assistant-embedded`
- `lemma-progress-tracker`
- `lemma-pipeline-funnel`
- `lemma-checklist`
- `lemma-scorecard`
- `lemma-schedule-view`
- `lemma-org-chart`
- `lemma-diff-viewer`
- `lemma-dashboard`

## Concrete Cleanup Sequence

### Phase 1: Registry Reduction

- Remove deleted items from `registry.json`.
- Delete the corresponding folders under `registry/default/`.
- Remove deleted examples, routes, and docs references.
- Keep the surviving block list small and obvious in README/docs.

### Phase 2: Shared Internals

- Extract one shared record-detail rendering layer.
- Extract one shared schema-field rendering layer.
- Extract shared async state primitives.
- Extract shared member/user resolution utilities.

#### Phase 2A: Shared headless record helpers

Primary files:

- `src/record-form.ts`
- `src/record-display.ts`
- `src/index.ts`
- `registry/default/lemma-record-form/components/lemma-record-form.tsx`
- `registry/default/lemma-records-view/components/records-form-sheet.tsx`
- `registry/default/lemma-detail-panel/components/lemma-detail-panel.tsx`
- `registry/default/lemma-records-view/components/records-detail.tsx`

Scope:

- Move form-ordering, default-hidden-field lists, and record detail heuristics into SDK exports.
- Stop duplicating title/description/status detection logic across registry blocks.
- Stop duplicating form field ordering logic across `lemma-record-form` and `records-view`.

Acceptance criteria:

- Detail heuristics live in `src/`, not inside multiple registry components.
- Form ordering/default-hidden behavior is defined once.
- `lemma-record-form`, `records-form-sheet`, `records-detail`, and `detail-panel` all consume the shared exports.

#### Phase 2B: Shared record detail architecture

Primary files:

- `registry/default/lemma-records-view/components/records-detail.tsx`
- `registry/default/lemma-detail-panel/components/lemma-detail-panel.tsx`
- `registry/default/lemma-records-view/components/records-detail-sheet.tsx`
- `registry/default/lemma-records-view/components/lemma-records-view.tsx`

Scope:

- Make `RecordDetail` the canonical detail renderer.
- Reduce `lemma-detail-panel` to a wrapper/composer around shared detail internals instead of a separate implementation.
- Normalize field groups, tabs, status/header treatment, action wiring, and empty/error states.

Acceptance criteria:

- One detail renderer owns field display behavior.
- `lemma-detail-panel` no longer carries its own independent field rendering logic.
- Shared detail sections can host comments, activity, files, and related records consistently.

#### Phase 2C: Shared schema field rendering

Primary files:

- `registry/default/lemma-record-form/components/lemma-record-form.tsx`
- `registry/default/lemma-records-view/components/records-form-sheet.tsx`
- `src/react/useRecordForm.ts`
- `src/record-form.ts`

Scope:

- Define one schema-driven field rendering contract.
- Remove duplicated FK select, JSON, number, boolean, textarea, and date input behavior.
- Keep wrapper differences only at the shell/chrome level.

Acceptance criteria:

- `lemma-record-form` and the records create/edit surface use the same field-control implementation path.
- FK search behavior and field error rendering are identical between both surfaces.
- Any new field type is added once.

### Phase 3: Canonical Block Upgrades

- Expand `lemma-records-view` with `calendar`, `timeline`, and `matrix`.
- Expand `lemma-detail-panel` with shared detail sections and mode variants.
- Expand `lemma-record-form` with searchable FK inputs and conditional sections.
- Expand `lemma-insights` with funnel/report variants.
- Expand `lemma-assistant-experience` with embedded and side-panel modes.
- Expand `lemma-members` with page/admin variants and member-management hooks.
- Expand `lemma-status-flow` with read-only tracker mode.
- Expand files components as first-class pod file workspaces, plus optional picker/link flows.

#### Phase 3A: `lemma-records-view`

Primary files:

- `registry/default/lemma-records-view/components/lemma-records-view.tsx`
- `registry/default/lemma-records-view/components/records-list-view.tsx`
- `registry/default/lemma-records-view/components/records-grouped-view.tsx`
- `registry/default/lemma-records-view/components/records-detail.tsx`
- `registry/default/lemma-records-view/components/records-filter-builder.tsx`

Scope:

- Add the new canonical view modes that survive consolidation.
- Make records detail, related sections, files sections, and actions feel like one operator workspace.
- Improve table ergonomics: sorting, visibility, primary-field pinning, better defaults, and stronger empty/loading states.

Acceptance criteria:

- `records-view` can credibly replace old inbox/list/detail workflow blocks.
- `records-view` owns the canonical table/list/grouped/board experience.
- Related records and files are configured as sections, not separate block installs.

#### Phase 3B: `lemma-detail-panel`

Primary files:

- `registry/default/lemma-detail-panel/components/lemma-detail-panel.tsx`
- shared detail internals from Phase 2

Scope:

- Reposition as the standalone detail wrapper around the canonical detail renderer.
- Support `inline`, `sheet`, `modal`, and `page` usage cleanly.
- Add action slots that will later support direct, function, workflow, and agent-backed actions.

Acceptance criteria:

- The block is thinner, more composable, and no longer an alternate universe from `records-view`.
- Host apps can mount the same detail system inside list-detail layouts or dedicated pages.

#### Phase 3C: `lemma-members`

Primary files:

- `registry/default/lemma-members/components/lemma-members.tsx`
- `src/react/useMembers.ts`
- new pod-member mutation hooks in `src/react/`
- `src/namespaces/pod-members.ts`

Scope:

- Grow from primitive chips/selects into a standard members admin page.
- Add invite/add, role update, and remove flows.
- Model both organization membership and pod membership clearly enough for product teams to use without rethinking the IA.

Acceptance criteria:

- A default members page ships as part of the block.
- Member mutations use first-class hooks, not ad hoc client calls in UI code.
- Most apps can use the stock members page without building their own.

#### Phase 3D: Files and documents

Primary files:

- `registry/default/lemma-file-browser/components/lemma-file-browser.tsx`
- `registry/default/lemma-file-viewer/components/lemma-file-viewer.tsx`
- `registry/default/lemma-markdown-editor/components/lemma-markdown-editor.tsx`

Scope:

- Improve the pod-files story now.
- Leave Notion-quality document authoring for the later deeper investment.
- Prepare the APIs and component boundaries so file browsing, previewing, and document editing can converge later.

Acceptance criteria:

- File browser and file viewer feel like one system.
- Record-linking remains optional, not the primary model.
- The markdown/document path has a clear future upgrade path without another rewrite of the files story.

### Phase 4: Presets And Recipes

After the primitive layer is strong, add recipes and templates instead of new registry blocks:

- issue tracker preset
- approval workflow preset
- triage inbox preset
- CRM preset
- docs/page workspace preset

### Phase 5: Workflow Actions And Document Quality

- Add first-class workflow and agent-backed action execution across records, detail, and related surfaces.
- Add a live working/progress tab or rail for long-running actions until terminal state.
- Upgrade markdown/document authoring toward Notion-quality editing and reading.
- Evaluate Tiptap or Plate as the foundation for the long-term document experience.

## Definition Of Done

This cleanup is done when:

- The registry has one obvious path for records, detail, forms, files, comments, search, insights, assistant, and shell.
- The registry has one obvious path for members and access management.
- We are no longer maintaining duplicate record detail or form renderers.
- Workflow-specific experiences are built by composing primitives, not by adding more top-level blocks.
- A developer can build a credible Airtable-like, Notion-like, or Linear/Jira-like internal tool without hunting through overlapping components.
