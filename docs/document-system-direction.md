# Document System Direction

This note defines the document and file preview direction for the registry.

## Decision

- Keep `lemma-document-workspace` as the only canonical document/file workspace.
- Keep `lemma-markdown-editor` as a lightweight primitive for plain markdown fields, notes, and simple side-by-side writing.
- Keep `lemma-file-browser` for folder navigation, upload, search, rename, move, folder creation, picker mode, and selection.
- Do not ship separate document creator, document viewer, document editor, or file viewer registry blocks.
- Store document bodies in pod files. Records may reference file paths, but records should not own document bodies directly.

## Product Model

Documents and attachments are pod files first.

- A document exists independently in the pod file namespace with a stable path, metadata, search indexing state, and optional converted artifacts.
- Structured documents use `lemma.document` JSON files with ProseKit/ProseMirror JSON under `content`.
- Markdown, text, images, PDFs, converted HTML, and unsupported files are previewed or edited through `lemma-document-workspace` using pod-file params.
- Record attachments and page-like records should pass file paths into `lemma-document-workspace`.
- Optional record wrappers can add routing, hierarchy, ownership, workflow status, durable slugs, comments, or activity.

## Canonical Block Boundaries

### `lemma-document-workspace`

Owns the primary pod-file experience.

- Create, read, edit, and preview pod files through `intent="create" | "edit" | "read"`.
- Accept pod-file configuration through the `file` prop.
- Render structured `lemma.document` files as the rich block editor.
- Render text and markdown files through an inline text workspace.
- Render images, PDFs, converted HTML, and download fallbacks in the same shell.
- Provide title, summary, save state, document metadata, backlinks, file references, record views, comments/activity hooks, and assistant context in one cohesive surface.

### `lemma-file-browser`

Owns file navigation and file operations.

- Browse folders and search pod files.
- Upload, rename, move, delete, and create folders.
- Act as a picker or navigator for `lemma-document-workspace`.
- Stay focused on file lists and selection, not preview/editor rendering.

### `lemma-markdown-editor`

Owns lightweight markdown field editing.

- Use it inside custom forms, comments, notes, specs, and simple draft fields.
- Do not expand it into a full document, file, or assistant-aware workspace.

## Data Shape

Use one pod-file source of truth.

- Current canonical body:
  - `lemma.document` JSON files in the pod file namespace
  - ProseKit/ProseMirror JSON under `content`
  - title and summary mirrored into the document envelope and file metadata where useful
  - file paths and file ids as stable composition handles
- Import/fallback path:
  - markdown and text can be loaded and edited as pod files
  - converted HTML and preview artifacts remain useful for non-editor previews
- Optional record wrappers:
  - keep durable routing and metadata fields when needed
  - store file paths instead of document bodies

## Delivery State

The registry now ships one canonical document/file workspace:

1. `lemma-document-workspace` supports pod-file create/read/edit/preview flows.
2. `lemma-file-browser` can drive a paired workspace by passing selected file paths.
3. `lemma-document-creator`, `lemma-document-viewer`, `lemma-document-editor`, and `lemma-file-viewer` have been removed from the canonical registry.
4. `lemma-markdown-editor` remains the plain markdown primitive.
