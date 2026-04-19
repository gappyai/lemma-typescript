# Document System Direction

This note defines the long-term document path for the registry so we stop stretching `lemma-markdown-editor` past its job.

## Decision

- Keep `lemma-markdown-editor` as the lightweight interim editor for plain markdown fields, notes, and simple side-by-side writing.
- Design the real document lane around new canonical blocks:
  - `lemma-document-workspace`
  - `lemma-document-creator`
  - `lemma-document-editor`
  - `lemma-document-viewer`
- Keep the existing file/page primitives as composition pieces around that lane:
  - `lemma-page-tree` for navigation
  - `lemma-file-browser` / `lemma-file-viewer` for raw pod files and mixed-media workspace flows
  - `lemma-comments` and `lemma-activity-feed` for threaded discussion and timeline context
  - `lemma-assistant-experience` for assistant launch and handoff

## Product Model

Documents should be docstore-first pod files, with optional record composition layered on later when an app needs it.

- A document exists independently in the pod file namespace:
  - stable path
  - description / summary metadata
  - search indexing state
  - converted artifacts
  - mixed-media neighbors in the same folder tree
- The document body lives in the pod file/docstore layer, not in a required table record.
- Optional page or record wrappers can add:
  - routing and hierarchy
  - ownership and workflow status
  - durable slugs or public URLs
  - comments or activity keyed to business records
- Backlinks should be stored as derived relationship data, not as editor-only decoration.
- Comments should stay composable: page-level or record-level today, range-aware later.

## Canonical Block Boundaries

### `lemma-document-workspace`

Owns the primary Notion/Coda-style document experience.

- Render documents as near-fullscreen pages or near-fullscreen modals by default.
- Own creation, reading, and editing through `intent="create" | "edit" | "read"` so users start from the document canvas instead of a file form.
- Store and edit a structured `lemma.document` JSON body backed by Tiptap/ProseMirror JSON.
- Provide title, summary, save state, document metadata, backlinks, file references, record views, comments/activity hooks, and assistant context in one cohesive surface.
- Use slash-style command insertion as the primary authoring affordance, with fallback insert controls for mouse-first use.
- Treat files, records, comments, and assistant context as document composition primitives rather than separate top-level document routes.
- Keep creation, reading, and editing inside one consistent document workspace when a product wants the full experience.

### `lemma-document-creator`

Owns lightweight or explicit file creation.

- Create a new document directly into the pod file namespace.
- Choose folder, file name, starter template, title, summary, and initial body.
- Launch cleanly as either a full page or a modal, not only as an embedded panel.
- Use when an app needs explicit file controls, markdown import, or template selection outside the canonical workspace.
- Prefer `lemma-document-workspace` for rich creation flows; keep this block useful for lightweight markdown/import paths.

### `lemma-document-editor`

Owns supporting authoring.

- Rich block editor for pod-stored document bodies.
- Slash commands, embeds, callouts, tables, checklists, mentions, and file embeds.
- Autosave against a file-backed document source.
- Support two primary presentation modes:
  - full page for the main Notion-style working experience
  - modal for quick peek and quick edit flows
- Optional right rail for backlinks, page metadata, comments, and assistant actions.
- Exposes hooks/callbacks for save state, selection context, and linked records/files.
- Do not keep expanding this markdown-era editor when the full workspace model fits better.

### `lemma-document-viewer`

Owns supporting reading.

- Read-only document renderer with the same content model as the editor.
- Support the same full-page and modal interaction pattern as the editor.
- Optional metadata header, outline, backlinks, comments rail, and assistant context launcher.
- Can render embedded files and hand off non-document files to `lemma-file-viewer`.
- Must be credible as a full reading surface, not only a preview pane.
- Prefer `lemma-document-workspace intent="read"` for block-native documents.

### `lemma-file-browser` and `lemma-file-viewer`

Stay focused on the pod datastore.

- They should handle mixed files, folders, picker flows, and preview actions for any pod file.
- Record attachments remain a composition pattern built on top of them.
- They should not become the canonical structured document editor.

## Data Shape

Use a vendor-neutral stored document model, but keep the near-term storage reality honest.

- Current canonical body:
  - `lemma.document` JSON files in the pod file namespace
  - Tiptap/ProseMirror JSON under `content`
  - title and summary mirrored into the document envelope and file metadata where useful
  - file paths and file ids as stable composition handles
- Import/fallback path:
  - markdown, text, and older simple docs can be converted into the structured document shape on load/save
  - converted HTML / preview artifacts remain useful for non-editor preview surfaces
- Derived exports:
  - markdown
  - plain text
  - HTML or rendered preview artifact
- Optional page records can keep durable routing and metadata fields when a product lane needs them.
- File search/indexing should target derived text artifacts so documents participate in the same pod file search story as uploads and imports.

This gives us one document source of truth while still fitting the current pod file APIs.

## Comments, Backlinks, Metadata, Assistant Context

These are first-class document concerns, but they should not be hardcoded into the editor foundation.

- Comments:
  - phase 1: page-level and record-level threads via `lemma-comments`
  - phase 2: anchored comments with range metadata
- Backlinks:
  - derived from explicit page references, record mentions, and file embeds
  - surfaced in `lemma-document-viewer` / `lemma-document-editor` side rails
- Metadata:
  - record-backed, editable outside the body content
  - rendered in header/inspector patterns, not only inside the body
- Assistant context:
  - the active page, selected block/range, linked files, and backlinks become launch context
  - assistant actions stay composition-driven, not editor-vendor-driven

## Tiptap vs Plate

Evaluation date: April 18, 2026.

### Tiptap

Pros:

- ProseMirror foundation is a strong fit for durable structured documents and complex transforms.
- Official React node views make custom Lemma blocks and embeds practical.
- Collaboration, comments, and versioning are documented in the official stack.
- The editor core is headless enough to keep our registry UI opinionated without locking the product model to a vendor UI kit.

Cons:

- Official markdown support is still documented as beta.
- Official comments are plan-gated, and some advanced collaboration features lean on Tiptap's managed ecosystem.
- We would still need to build our own Lemma-flavored shells, menus, and inspector rails.

References:

- [Tiptap docs overview](https://tiptap.dev/docs)
- [Tiptap React node views](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react)
- [Tiptap collaboration overview](https://tiptap.dev/docs/collaboration/getting-started/overview)
- [Tiptap comments overview](https://tiptap.dev/docs/comments/getting-started/overview)
- [Tiptap markdown overview](https://tiptap.dev/docs/editor/markdown)

### Plate

Pros:

- Strong React and shadcn/ui alignment, which matches the registry's delivery model.
- Open docs for comments, AI, markdown conversion, static rendering, and Yjs collaboration.
- `PlateStatic` is attractive for a future read-only `lemma-document-viewer`.
- Faster path for assembling a polished React-first editor shell.

Cons:

- The long-term document core is more tightly coupled to a React-first Slate stack.
- For a canonical registry primitive, the document schema and editing rules would likely require more Lemma-owned discipline to stay predictable.
- It is a great UI accelerator, but less compelling as the registry's long-term source of truth than a ProseMirror-first core.

References:

- [Plate introduction](https://platejs.org/docs)
- [Plate markdown](https://platejs.org/docs/markdown)
- [Plate static rendering](https://platejs.org/docs/static)
- [Plate AI](https://platejs.org/docs/ai)
- [Plate collaboration](https://platejs.org/docs/yjs)
- [Plate comments](https://next.platejs.org/docs/comments)

## Recommendation

Choose Tiptap as the foundation for the block-native document lane, starting with `lemma-document-workspace`.

Why:

- The registry needs a durable document core more than it needs a fast editor demo.
- ProseMirror's structure is the better fit for a long-lived canonical block that will eventually carry comments, embeds, backlinks, assistant actions, and higher-trust document transforms.
- We can still borrow interaction ideas from Plate's React/shadcn patterns without making Plate the canonical storage and editing model.
- The first shipped workspace now uses Tiptap JSON as the durable stored body while leaving room for better slash commands, node views, comments, and derived exports.

## Phase 1-3 Delivery

Delivered in the registry/example pass:

1. `lemma-document-workspace` is the canonical page/modal experience for pod-backed documents.
2. Creation now uses the same workspace canvas through `intent="create"` instead of a file-name-first form.
3. The workspace has a slash-style command menu, quieter chrome, capped radii, and no demo/internal product copy.
4. File, record, assistant, comments, and activity integration points are exposed as props so desks can wire real pod behavior without forking the editor.
5. The inbox CRM example composes documents and record-backed pages around the canonical workspace, with assistant handoff context.

Still intentionally separate:

- `lemma-markdown-editor` remains the plain markdown field tool.
- `lemma-document-creator` remains useful for explicit file/template/import flows.
- `lemma-document-viewer` and `lemma-document-editor` remain supporting/static surfaces while the workspace owns the flagship experience.
