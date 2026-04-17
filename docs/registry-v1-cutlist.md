# Registry V1 Cutlist

Goal: ship a registry that feels like a coherent Airtable + Notion + Linear app kit, not a large pile of unrelated demos.

This cutlist is opinionated on purpose. The problem is no longer lack of components. The problem is focus, overlap, and last-mile polish.

## V1 Product Story

The v1 promise should be:

- Start with a real operator shell.
- Add a serious records workspace.
- Add forms, search, files, people, comments, insights, and assistant.
- Customize from there.

The default user should be able to build:

- A CRM or task desk
- A Linear-style issue or project tracker
- A Notion-like internal workspace with files, notes, related records, and assistant help

If a block does not strengthen that story, it should not be a headline v1 block.

## Decision Principles

- Out of the box means the block already feels credible before customization.
- A v1 block should solve a common business workflow, not just show an interesting layout.
- Overlapping blocks should be merged, wrapped, or hidden from the primary story.
- Specialized blocks are fine, but they should not dilute the main install path or homepage narrative.
- We should prefer one strong path for records, detail, files, and assistant instead of multiple partially-overlapping paths.

## V1 Headline Kit

These are the blocks we should actively position as the default Lemma v1 kit.

| Block | Decision | Why |
| --- | --- | --- |
| `lemma-dashboard` | Ship as core | Gives the kit a real app shell and ties the rest together. |
| `lemma-records-view` | Ship as core | This is the closest thing to the product center of gravity. |
| `lemma-record-form` | Ship as core | Essential create/edit surface and good pair with records view. |
| `lemma-global-search` | Ship as core | Strong differentiator and important for the Airtable/Notion/Linear feel. |
| `lemma-breadcrumbs` | Ship as core | Small but makes desks feel productized instead of demo-ish. |
| `lemma-file-browser` | Ship as core | Real file workflow surface, not a toy. |
| `lemma-file-viewer` | Ship as core | Makes files immediately useful and works well with records. |
| `lemma-members` | Ship as core | Strong primitive set for people, assignees, ownership, and collaboration. |
| `lemma-comments` | Ship as core | Important for collaborative business apps and already useful. |
| `lemma-insights` | Ship as core | Gives teams dashboards and reporting out of the box. |
| `lemma-assistant-experience` | Ship as core | Strong flagship AI surface and worth treating as the canonical assistant block. |
| `lemma-notification-bell` | Ship as core, lower priority | Useful shell primitive once the rest of the app is in place. |
| `lemma-user-menu` | Ship as core, lower priority | Useful shell primitive, but needs tighter identity wiring. |

## Ship, But As Secondary Workflow Blocks

These can ship in v1, but they should not be presented as equal peers to the core kit.

| Block | Decision | Why |
| --- | --- | --- |
| `lemma-inbox` | Secondary | Strong workflow surface, but not every customer starts here. |
| `lemma-approval-queue` | Secondary | Good workflow block, but specialized. |
| `lemma-email-workbench` | Secondary | Valuable, but should feel like a workflow pack, not a foundation block. |
| `lemma-calendar` | Secondary | Useful once the records foundation is strong. |
| `lemma-timeline` | Secondary | Good PM surface, but not core to every desk. |
| `lemma-activity-feed` | Secondary | Useful support block for records and workflows. |
| `lemma-status-flow` | Secondary | Strong Linear-like pattern, but should attach to records rather than lead the story. |
| `lemma-workflow-runner` | Secondary | Good ops surface, but not part of the primary starter kit. |
| `lemma-page-tree` | Secondary | Useful if we commit to documents/pages as a real product lane. |
| `lemma-pipeline-funnel` | Secondary | Good vertical workflow view, but not foundational. |

## Merge Or Reposition

These should not remain independent headline blocks in their current form.

| Block | Decision | Why |
| --- | --- | --- |
| `lemma-assistant-embedded` | Keep as variant, not separate flagship | It is a wrapper variant of assistant experience, not a distinct product surface. |
| `lemma-detail-panel` | Merge into one canonical detail system | We currently have too many record detail patterns. |
| `lemma-attachment-viewer` | Merge into the unified files story | Attachments and datastore files should feel like one opinion. |
| `lemma-linked-records` | Merge into canonical record detail and related-records story | Related records are core, but this should not feel like a separate universe from records detail. |

## Strategic, But Not Ready To Market Hard

These matter to the long-term product direction, but they should not be oversold in v1 until the UX is more complete.

| Block | Decision | Why |
| --- | --- | --- |
| `lemma-markdown-editor` | Keep, but do not market as a headline v1 block yet | It is useful as a lightweight editor, but it is not yet a true Notion-like document system. |

### Specific Merge Decisions

- `lemma-assistant-experience` should be the canonical assistant block.
- `lemma-assistant-embedded` should remain installable only as a thin wrapper or preset around the canonical assistant files.
- `RecordDetail` inside records view should become the canonical record detail architecture.
- `lemma-detail-panel` should either wrap that shared detail system or move to advanced/specialized status.
- `lemma-file-browser` and `lemma-file-viewer` should define the primary files story.
- `lemma-attachment-viewer` should become a record-file preset or attachment-mode wrapper, not a separate mental model.
- `lemma-linked-records` should fold into richer related-record sections inside the canonical detail surface.

## Defer From The V1 Promise

These are not bad components. They are just not important enough to the v1 story and will make the registry feel unfocused if we present them too prominently now.

| Block | Decision | Why |
| --- | --- | --- |
| `lemma-checklist` | Defer | Useful, but specialized workflow UI. |
| `lemma-progress-tracker` | Defer | Helpful pattern, but not a foundation block. |
| `lemma-scorecard` | Defer | Good niche workflow block, not core starter-kit UI. |
| `lemma-matrix` | Defer | Interesting analytics/planning pattern, but advanced. |
| `lemma-org-chart` | Defer | Useful for specific org or hierarchy desks, not a v1 core need. |
| `lemma-diff-viewer` | Defer | Valuable in some products, not part of the main business-app kit. |
| `lemma-schedule-view` | Defer | Specialized calendar variant, not needed in the main story. |

## Do Not Hard Delete Yet

Hard deletion is the wrong move before we cut the story and consolidate the overlaps.

Do not delete source blocks immediately unless they become clear wrappers or dead code.

Delete or archive only after one of these is true:

- A stronger canonical replacement exists.
- The example no longer uses the block.
- The docs and README no longer advertise it.
- We have no near-term product lane that depends on it.

## Immediate Trim List

This is the fastest way to make the registry feel sharper without rewriting everything.

### Registry And Docs

- Reduce the headline registry story to the core kit.
- Move secondary and deferred blocks into separate sections in docs and README.
- Stop presenting every block as equally important.
- Explicitly label workflow blocks and specialized blocks.

### Example App

- Make the example app primarily demonstrate these surfaces:
- `records` workspace
- `record detail` and related records
- `files` and record files
- `assistant`
- `search`
- `insights`
- `members` and comments

- Move the more specialized routes behind a `More`, `Advanced`, or `Workflow Examples` grouping.
- Remove the feeling that the main nav is trying to prove all 35 blocks at once.

### Naming And Positioning

- Stop treating `embedded`, `panel`, `attachment`, and `linked-records` as separate flagship concepts.
- Start positioning them as variants, presets, or extensions of the core records/files/assistant system.

## V1 Polish Gaps

These are the real blockers between "good registry demo" and "ready to ship v1."

### P0: Must Fix Before Calling It V1

- Make foreign-key inputs genuinely searchable comboboxes across forms and detail editing.
- Add user-visible mutation feedback for create, update, delete, upload, and function-backed actions.
- Replace remaining `confirm(...)` delete flows with proper confirmation UI everywhere.
- Choose one canonical record detail system and stop splitting effort.
- Unify the files story so record files, attachments, and datastore browsing feel like one system.
- Resolve member and user fields consistently across blocks instead of rendering raw ids in many places.
- Tighten empty, loading, error, and success states so blocks feel product-grade before customization.
- Add at least one fresh-app smoke test outside this repo for the headline kit.

### P1: High-Value Polish Right After V1

- Add column visibility, sort controls, and pinned primary column behavior to records view.
- Improve related-record sections with better empty/error/loading states and stronger drill-in actions.
- Add route helper props so apps do not need to rely on `window.location.*` style navigation.
- Improve assistant entry points for record context, file context, and selected search results.
- Add first-class record file attach/link flows.
- Give markdown and file flows a clearer persistence story.

### P2: Strong Upgrades, Not V1 Blockers

- Kanban drag/drop with function-backed transitions.
- Stronger audit/history strips for workflow surfaces.
- Better multi-surface chrome controls beyond appearance and density.
- More install presets or precomposed desk templates.

## Duplicate And Structural Cleanup

These are not just cleanup chores. They directly affect how fast we can polish the kit.

### Duplicate Record Form Rendering

The same schema-driven field rendering logic exists in multiple places:

- `lemma-record-form`
- records create form inside `lemma-records-view`
- create form inside `lemma-linked-records`

This should become one shared field-rendering layer with thin wrappers.

### Duplicate Detail Systems

We currently have:

- `RecordDetail` inside records view
- `lemma-detail-panel`
- page-level example detail compositions

This is too many surfaces solving the same problem.

### Duplicate Example Copies

The example app currently mirrors most registry component files instead of clearly depending on one canonical implementation path.

That makes polish slower and increases the chance that:

- the example drifts away from the installed registry blocks
- fixes land in one place first
- the example looks better or worse than the actual install experience

## Example App Cutlist

### Keep In The Primary Example Narrative

- Deals
- Contacts
- Tasks
- Files
- Assistant
- Insights
- Search
- Record detail
- Comments
- Members

### Keep, But Move Out Of The Main Hero Path

- Inbox
- Approvals
- Email
- Calendar
- Timeline
- Activity
- Pipeline
- Pages

### Move To Advanced Or Internal Demo Status

- Org chart
- Schedule
- Matrix-like or scorecard-heavy routes if added later
- Any route that exists mainly to prove a niche block rather than the starter-kit story

## Recommended V1 Registry Tiering

### Tier 1: Headline

- Dashboard
- Records View
- Record Form
- Global Search
- Assistant Experience
- Files
- Members
- Comments
- Insights
- Breadcrumbs

### Tier 2: Supporting Shell And Workflow

- Notification Bell
- User Menu
- Inbox
- Approval Queue
- Email Workbench
- Calendar
- Timeline
- Activity Feed
- Workflow Runner
- Status Flow

### Tier 3: Strategic Utility

- Markdown Editor

### Tier 4: Specialized

- Page Tree
- Pipeline Funnel
- Checklist
- Progress Tracker
- Scorecard
- Matrix
- Org Chart
- Diff Viewer
- Schedule View

### Tier 5: Merge Into Core Or Preset

- Assistant Embedded
- Detail Panel
- Attachment Viewer
- Linked Records

## Later Plan

### Phase 0: Lock The Story

Goal: stop bleeding scope.

- Freeze the v1 headline kit.
- Freeze which blocks are core, secondary, specialized, and merge-targets.
- Update README, docs, install examples, and registry landing copy to match the cut.
- Simplify the example app nav to match the v1 story.

Exit criteria:

- Anyone landing on the repo can explain the primary kit in under one minute.
- We are no longer marketing all blocks as equal peers.

### Phase 1: Polish The Core Experience

Goal: make the core blocks feel ready without custom work.

- Replace FK `Select` controls with searchable combobox behavior.
- Add consistent mutation feedback and confirmation patterns.
- Standardize empty/error/loading states across records, files, comments, search, and workflows.
- Resolve member and current-user identities across all core blocks.
- Add clearer route and action hooks instead of pushing apps toward `window.location.*`.

Exit criteria:

- A default records desk looks credible before heavy customization.
- Common CRUD flows feel safe and responsive.

### Phase 2: Unify The Big Concepts

Goal: stop making users choose between overlapping implementations.

- Pick one canonical record detail system.
- Refactor `lemma-detail-panel` into that system or reposition it.
- Pick one files model and wrap attachment behavior into it.
- Collapse duplicate field rendering into shared internals.
- Make assistant variants feel like presets, not separate products.

Exit criteria:

- Records, detail, files, and assistant each have one obvious default path.

### Phase 3: Strengthen The Notion-Like Lane

Goal: make docs, notes, pages, and files feel like a real product lane instead of a demo lane.

- Decide whether markdown is just a light editor or a true document surface.
- If it is a true document surface, add persistence hooks, save lifecycle, link/attach flows, toolbar actions, and richer content ergonomics.
- Improve `page-tree` only if we are committing to a real page/document lane in v1.1 or v2.

Exit criteria:

- We can honestly describe the kit as supporting internal docs and workspace notes, not just markdown textareas.

### Phase 4: Package And Install Confidence

Goal: make the install story trustworthy.

- Add fresh-app smoke tests for the headline kit outside the repo.
- Verify install, typecheck, and render behavior for the main blocks.
- Reduce example duplication so the example is a real proof of the registry, not a parallel codebase.
- Consider shipping a `new desk` example or starter template based on the final core kit.

Exit criteria:

- The install story is repeatable and trusted.

### Phase 5: Bring Back Specialized Blocks Selectively

Goal: expand breadth only after the core is clearly strong.

- Reintroduce specialized blocks as workflow packs or advanced surfaces.
- Only promote specialized blocks that are clearly better than composing existing primitives.
- Keep the main registry narrative narrow even as total block count grows.

Exit criteria:

- New blocks increase capability without confusing the product story.

## Recommended Next Actions

If we want the highest leverage in the next pass, do these first:

1. Freeze the v1 headline kit and hide the rest from the main story.
2. Choose the canonical record detail system.
3. Choose the canonical files story.
4. Replace FK selects with searchable comboboxes.
5. Add mutation feedback and confirmation patterns across the core kit.
6. Resolve member and user labels consistently across core blocks.
7. Simplify the example app nav so it sells the right story.
8. Reduce duplicated form and detail logic before doing another large polish pass.

## Short Version

We do not need more components to ship v1.

We need:

- a smaller headline kit
- one opinion for records/detail/files/assistant
- better last-mile polish
- less overlap
- a cleaner example story

That is the shortest path from "near" to "ship."
