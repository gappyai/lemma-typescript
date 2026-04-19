# Registry TODO

This is the execution tracker for the registry cleanup. Keep this file crisp: move finished work into "Done", keep "Now" small, and do not turn pending ideas into shipped blocks unless they survive the canonical-component model.

## Pending

- Deepen the document lane from the initial workspace into a full Notion/Coda-grade system.
  - Add real slash-command search, keyboard insertion, and block transformations to `lemma-document-workspace`.
  - Promote file previews, record views, assistant blocks, and page references from placeholders into first-class node views.
  - Add anchored comments and stronger backlink semantics on top of the document model.
  - Add richer file/document composition so embedded files and page-body files feel native inside the workspace.
  - Define derived markdown/html/plain-text export behavior for search, previews, and interoperability.
  - Keep current `lemma-markdown-editor` as the lightweight plain-markdown editor beside the richer document lane.

- Push the file workspace further once real pod usage teaches us where it strains.
  - Add bulk actions and drag/drop when there is a clear canonical shape.
  - Add stronger tree and split-pane layouts if they survive real app composition.

- Expand `lemma-assistant-experience`.
  - Add embedded and side-panel modes.
  - Add launch context for records, files, tables, search results, and pages.
  - Align assistant cards visually with records/detail/files.

- Expand analytics and status primitives.
  - Add report/dashboard presets around the shipped funnel support in `lemma-insights`.
  - Add better compact modes for detail headers and list rows.

- Add direct pod invite to `lemma-members` after the generated client exposes that API.

## Later

- Add first-class long-running action surfaces.
  - Actions can run direct mutations, functions, workflows, or agents.
  - Records tables and detail panels should show a live working row/tab until terminal state.
  - Agent/workflow progress should be resumable and inspectable, not just a spinner.

- Add recipe/example packs after primitives are strong.
  - Issue tracker.
  - CRM workspace.
  - Triage inbox.
  - Approval workflow.
  - Docs/workspace OS.

- Revisit removed specialized blocks only if a product lane proves they need to be primitives.
  - Scheduler/resource calendar.
  - Org chart.
  - Diff/change-review viewer.

## Done

- Focused the shipped registry into a canonical set, then added dedicated document viewer/editor blocks when the document lane matured.
- Removed duplicate workflow-specific blocks from the registry.
- Added shared record display/form helpers in `src/`.
- Shared create/edit/detail field controls through `record-form-fields`.
- Made `lemma-detail-panel` use the canonical `records-detail` renderer.
- Added pod member mutation hooks: `useAddPodMember`, `useUpdatePodMemberRole`, `useRemovePodMember`.
- Made `lemma-members` use the pod member mutation hooks.
- Rebuilt `examples/inbox-crm` around the kept canonical blocks only.
- Added `lemma-records-view` presets: `triage`, `issues`, `crm`, and `docs`.
- Added `calendar`, `timeline`, and `matrix` as consolidated `lemma-records-view` modes.
- Expanded `lemma-records-view` as the consolidation center with preset view mixes, comments/activity/files section hooks, column visibility defaults, pinned columns, widths, and default sort resolution.
- Added one shared record action contract for row, detail, and bulk actions with direct update, function run, and workflow start support.
- Kept `lemma-detail-panel` on the canonical `records-detail` renderer and moved its actions onto the shared record action contract.
- Added conditional field visibility and section visibility to `lemma-record-form` and records-view create sheets.
- Added funnel chart support to `lemma-insights`.
- Added read-only and tracker modes to `lemma-status-flow`.
- Updated the README and hook recipes to document the canonical registry surface, consolidated records views, and pod member mutation hooks.
- Set the long-term document direction in `docs/document-system-direction.md`, choosing future `lemma-document-editor` / `lemma-document-viewer` blocks and a Tiptap-based foundation while keeping `lemma-markdown-editor` interim.
- Upgraded `lemma-file-browser` and `lemma-file-viewer` into a shared workspace story with rename, move, folder creation, picker mode, link actions, selection-aware browsing, metadata rails, and richer preview context.
- Added initial `lemma-document-viewer` and `lemma-document-editor` blocks for richer reading and authoring shells.
- Added `lemma-document-creator` plus a docstore-backed example workspace with modal and full-page document flows on top of pod files instead of assuming table-backed pages or embedded editors.
- Added `lemma-document-workspace` as the canonical near-fullscreen Tiptap-backed document surface with structured `lemma.document` JSON storage, page/modal modes, creation flow wiring, file-reference blocks, metadata rails, backlinks, and assistant context.
