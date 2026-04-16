# Registry Design System Todo

Goal: make the Lemma shadcn registry feel like a coherent Airtable + Notion + Linear style app kit, not isolated demo components.

## Fixed In Current Pass

- Assistant blocks install cleanly as client components.
- `lemma-assistant-embedded` now imports sibling installed files instead of source-tree registry paths.
- README registry docs now list the current registry blocks and install commands.
- Added `npm run registry:check` to build and validate generated registry JSON.
- Records workspace search now filters visible records, exposes `searchFields`, clears search, and updates empty copy.
- Records workspace now uses shadcn table primitives for the grid instead of raw table markup.
- Records list/grouped views now use shadcn `Card` and `Checkbox` primitives.
- Grouped records view now behaves more like an operator board with horizontal status columns.
- Filter builder now uses shadcn `Select` primitives, grouped select items, mobile-friendly rows, and null-safe handlers.
- Record forms now render accessible Dialog/Sheet titles and inline submit actions.
- Record form and inline edit selects now wrap `SelectItem` with `SelectGroup`.
- Inline/detail updates now honor `onUpdateOptions.updateVia: "function"`.
- Detail FK labels now honor `foreignKeyLabels`.
- Default list, kanban, linear, grid, forms, and detail surfaces now avoid full raw FK UUIDs when FK labels are available.
- Records filters now normalize UI operators before querying, including `ilike`, starts/ends-with, `in`, and empty checks.
- Records grouped view is now split into horizontal `kanban` and vertical `linear` modes.
- Records create interactions now support `sheet`, `modal`, and `page` modes.
- Records detail interactions now support sheet or page-routing mode.
- Example CRM now demonstrates deals as kanban, tasks as Linear-style, contacts detail as page, contacts create as modal, companies create as page, and deals create as sheet.
- Added a standalone `lemma-global-search` block for grouped record/file search with keyboard navigation.
- Global search now debounces explicit queries, supports `minQueryLength`/`debounceMs`, and the example uses a stronger 3-character, 450ms setup.
- Global search now progressively renders table/file sources as each source returns instead of waiting for all sources.
- Global search now uses a smoother loading panel, aligns its input/close control, and omits empty source rows instead of showing zero-result tables.
- Global search result clicks now support `href`, async `onSelect`, and `openMode="navigate" | "new-tab" | "callback" | "none"` with query/result context.
- Global search now supports assistant handoff by `assistantName`, including configurable query/results message building and post-conversation routing callbacks.
- Registry blocks now share initial `appearance="default" | "minimal" | "borderless" | "contained"` and `density="compact" | "comfortable" | "spacious"` knobs across records, forms, insights, global search, and assistant experience surfaces.
- `appearance="minimal"` is now the cardless mode: transparent block surfaces, subtle dividers, and no default card rings/shadows.
- Records view propagates appearance/density into grid, list, kanban, linear, detail sheet, and create form surfaces.
- Example Theme Lab now live-switches one registry block chrome setting across search, records, forms, insights, and the assistant page.
- Example CRM now has an `/assistant` page with assistant-name setup, conversation list, search handoff deep-links, and a message composer.
- Assistant hooks and the example assistant page now guard conversation bootstrap loads by conversation id to avoid repeated message fetch loops.
- Example CRM now includes a theme lab for switching across shadcn-inspired style families, accents, and surface modes.
- Insights chart colors now use Tailwind v4 CSS variables directly instead of invalid `hsl(var(...))`.
- Example app now has a real desk shell with sidebar navigation, mobile nav, action buttons, route context, and pod status.
- Generated `public/r` registry output now includes every item declared in `registry.json`.
- Added file SDK wrappers and hooks for datastore lists, file metadata, search, tree, converted previews, and converted artifact download.
- Added `lemma-breadcrumbs` for route, record, and file-path breadcrumbs.
- Added `lemma-file-browser` for folder navigation, path breadcrumbs, upload, download, search, and AlertDialog-backed delete.
- Added `lemma-file-viewer` for image, PDF, text, markdown, converted HTML, and download fallback previews.
- Added `lemma-markdown-editor` for write, preview, and split editing modes.
- Added `lemma-members` for member chips, avatar groups, searchable member select, and user-field display helpers.
- Records detail now exposes a `renderFiles`/`renderFilesTab` slot so file components can plug into record workspaces without hard coupling.
- Added `lemma-approval-queue` for direct or function-backed approve, reject, and request-changes workflows.
- Added `lemma-email-workbench` for AI-drafted email review with thread context, editable composer, approve, send, and approve-and-send actions.
- Upgraded `lemma-insights` with count/sum/avg chart aggregation, area charts, chart descriptions, formatters, sorting, limits, and empty states.
- Example CRM now mounts breadcrumbs, files, record file tabs, member resolution, approval queue, AI email workbench, markdown editor, and richer insights routes.

## Next P0/P1 Work

- Global search follow-up:
- Add first-class `route` helper props for apps that prefer route objects over `href` strings.
- Add explicit result action slots for "open in sheet", "open page", "copy link", and "ask assistant about this result".
- Add per-source retry controls after table/file failures.
- Add optional selected-result assistant handoff in addition to the current query/results handoff.
- Assistant follow-up:
- Add assistant launch/sheet/page variants that can accept search context, record context, file context, and table context.
- Add selected-result and record-context assistant entry points, not only query/results handoff.
- Keep tightening the assistant visual language around the same operator-desk surfaces as records and insights.
- File and folder components:
- Add `lemma-file-picker` for attaching/linking files to records.
- Add a focused file search/results surface that can plug into global search.
- People and membership components:
- Resolve `owner_user_id`, `creator_user_id`, assignee, and participant fields to human labels across more existing blocks, not only explicit member slots.
- Business workflow follow-up:
- Add reusable audit/history strips for approval and email action outcomes.
- Add function-run status toasts or inline status rows for long-running send/approve actions.
- Style controls:
- Add the next `chrome="full" | "toolbar" | "none"` layer for host apps that want to remove block headers entirely.
- Keep shadcn presets responsible for primitive tokens, with Lemma blocks owning lightweight layout/chrome controls for business workflows.
- Run a fresh shadcn install smoke test in a temporary app.
- Verify `@lemma/lemma-records-view`, `@lemma/lemma-record-form`, `@lemma/lemma-insights`, and assistant blocks install, typecheck, and render outside this repo.
- Add a documented “new app” smoke script if the install flow is stable enough to automate.
- Replace `window.confirm` delete flows with a registry-provided confirmation pattern, likely `AlertDialog` if we add that dependency.
- Add user-visible mutation feedback for inline edits, creates, deletes, and function-backed mutations.
- Make FK inputs genuinely searchable, not just select lists, for large business tables.
- Add server-side search or documented search semantics; current search is local to the fetched page.
- Add sort controls, column visibility, density, and pinned primary column behavior to records view.
- Add drag/drop moves for kanban with function-backed transition hooks.
- Turn detail reverse-lookups into a stronger related-records section with empty/error/loading states per relation.
- Normalize type/enum badges around shadcn `Badge` or tokenized helpers so the visual language is consistent and less raw-color-coded.

## Design System Work

- Define a small token contract for workspace surfaces: page background, chrome, raised cards, board columns, active rows, pills, and chart series.
- Ensure every registry block works against host app tokens instead of assuming a dark/light look.
- Create one high-quality “operator desk” example per major block: records, form, insights, assistant, and dashboard.
- Add visual affordances that make records feel product-grade out of the box: row hover actions, selected row toolbar, empty states, error states, grouped boards, and real pagination copy.
- Align assistant, dashboard, records, and insights around the same spacing, radius, and typography rhythm.

## Known Limitations After This Pass

- `examples/` is currently untracked in git, so example app changes will not show in normal tracked diffs until the directory is added.
- Search filters only the records returned for the current page.
- FK selectors now use labels, but still need true searchable combobox behavior for large datasets.
- Delete confirmation still uses `confirm(...)`.
- The registry validator is local and structural; it is not yet a fresh app install smoke test.
