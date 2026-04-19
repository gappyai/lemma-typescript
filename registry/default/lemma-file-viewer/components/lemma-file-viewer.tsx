"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  AlertCircle,
  Download,
  ExternalLink,
  File,
  FileText,
  Home,
  Image,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useFile } from "lemma-sdk/react"
import type { FileResponse, LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"

export type LemmaFileViewerAppearance = "default" | "minimal" | "borderless" | "contained"
export type LemmaFileViewerDensity = "compact" | "comfortable" | "spacious"
export type LemmaFileViewerRadius = "none" | "sm" | "md" | "lg" | "xl"
type TextWorkspaceMode = "preview" | "edit" | "split"

export interface LemmaFileViewerProps {
  client: LemmaClient
  podId?: string
  path: string
  file?: FileResponse | null
  enabled?: boolean
  convertedArtifact?: string
  showMetadata?: boolean
  showBreadcrumbs?: boolean
  appearance?: LemmaFileViewerAppearance
  density?: LemmaFileViewerDensity
  radius?: LemmaFileViewerRadius
  textEditable?: boolean
  defaultTextMode?: TextWorkspaceMode
  title?: React.ReactNode
  headerActions?: React.ReactNode
  className?: string
  onOpenExternal?: (file: FileResponse | null, path: string) => void
  onTextSaved?: (file: FileResponse, content: string) => void
}

type PreviewKind = "image" | "pdf" | "markdown" | "text" | "html" | "download"

export function LemmaFileViewer({
  client,
  podId,
  path,
  file,
  enabled = true,
  convertedArtifact = "document.md",
  showMetadata = true,
  showBreadcrumbs = true,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  textEditable = true,
  defaultTextMode = "preview",
  title,
  headerActions,
  className,
  onOpenExternal,
  onTextSaved,
}: LemmaFileViewerProps) {
  const scopedClient = React.useMemo(() => (podId ? client.withPod(podId) : client), [client, podId])
  const fileStateEnabled = enabled && !file
  const fileState = useFile({
    client,
    podId,
    path,
    enabled: fileStateEnabled,
  })
  const [localFile, setLocalFile] = React.useState<FileResponse | null>(null)
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null)
  const [content, setContent] = React.useState<string | null>(null)
  const [previewError, setPreviewError] = React.useState<Error | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false)
  const [textMode, setTextMode] = React.useState<TextWorkspaceMode>(defaultTextMode)
  const [draftText, setDraftText] = React.useState("")
  const [loadedText, setLoadedText] = React.useState("")
  const [isSavingText, setIsSavingText] = React.useState(false)
  const [textSaveError, setTextSaveError] = React.useState<string | null>(null)
  const resolvedFile = localFile ?? file ?? fileState.file
  const previewKind = inferPreviewKind(resolvedFile, path)
  const canEditText = textEditable && isEditableTextKind(previewKind)
  const isTextDirty = canEditText && draftText !== loadedText
  const displayName = displayFileName(resolvedFile?.name ?? fileNameFromPath(path))

  React.useEffect(() => {
    setLocalFile(null)
  }, [file?.id, file?.updated_at, path])

  const loadPreview = React.useCallback(async (signal?: AbortSignal) => {
    if (!enabled || !path) return

    setIsLoadingPreview(true)
    setPreviewError(null)
    setContent(null)
    setObjectUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return null
    })

    try {
      if (previewKind === "download") return

      if (previewKind === "html") {
        const html = await scopedClient.files.converted.render(path)
        if (signal?.aborted) return
        setContent(typeof html === "string" ? html : String(html ?? ""))
        return
      }

      if (previewKind === "markdown" && convertedArtifact) {
        try {
          const blob = await scopedClient.files.converted.download(path, convertedArtifact)
          const text = await blob.text()
          if (signal?.aborted) return
          setContent(text)
          return
        } catch {
          const blob = await scopedClient.files.download(path)
          const text = await blob.text()
          if (signal?.aborted) return
          setContent(text)
          return
        }
      }

      const blob = await scopedClient.files.download(path)
      if (signal?.aborted) return

      if (previewKind === "text") {
        setContent(await blob.text())
        return
      }

      setObjectUrl(URL.createObjectURL(blob))
    } catch (error) {
      if (signal?.aborted) return
      setPreviewError(error instanceof Error ? error : new Error("Failed to load file preview."))
    } finally {
      if (!signal?.aborted) setIsLoadingPreview(false)
    }
  }, [convertedArtifact, enabled, path, previewKind, scopedClient])

  React.useEffect(() => {
    const controller = new AbortController()
    void loadPreview(controller.signal)
    return () => {
      controller.abort()
      setObjectUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return null
      })
    }
  }, [loadPreview])

  React.useEffect(() => {
    if (!canEditText || content == null) return
    setDraftText(content)
    setLoadedText(content)
    setTextSaveError(null)
  }, [canEditText, content, path])

  const handleDownload = React.useCallback(async () => {
    const blob = await scopedClient.files.download(path)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = downloadFileNameFromPath(path)
    anchor.click()
    URL.revokeObjectURL(url)
  }, [path, scopedClient])

  const handleTextSave = React.useCallback(async () => {
    if (!canEditText || !isTextDirty || isSavingText) return
    setIsSavingText(true)
    setTextSaveError(null)
    try {
      const updated = await scopedClient.files.update(path, {
        file: new Blob([draftText], { type: inferTextMimeType(resolvedFile?.mime_type, path, previewKind) }),
      })
      setLocalFile(updated)
      setLoadedText(draftText)
      onTextSaved?.(updated, draftText)
      if (fileStateEnabled) {
        await fileState.refresh()
      }
      await loadPreview()
    } catch (error) {
      setTextSaveError(error instanceof Error ? error.message : "Failed to save text file.")
    } finally {
      setIsSavingText(false)
    }
  }, [canEditText, draftText, fileState, fileStateEnabled, isSavingText, isTextDirty, loadPreview, onTextSaved, path, previewKind, resolvedFile?.mime_type, scopedClient])

  const metadataItems = React.useMemo(() => {
    if (!resolvedFile) return []
    return [
      { label: "Kind", value: resolvedFile.kind },
      { label: "Type", value: resolvedFile.mime_type ?? "Unknown" },
      { label: "Size", value: typeof resolvedFile.size_bytes === "number" ? formatFileSize(resolvedFile.size_bytes) : "Unknown" },
      { label: "Status", value: resolvedFile.status },
      { label: "Visibility", value: resolvedFile.visibility ?? "default" },
      { label: "Updated", value: formatDateTime(resolvedFile.updated_at) },
      { label: "Indexed", value: resolvedFile.indexed_at ? formatDateTime(resolvedFile.indexed_at) : "Not indexed yet" },
      { label: "Search", value: resolvedFile.search_enabled === false ? "Disabled" : "Enabled" },
    ]
  }, [resolvedFile])

  const isLoading = (fileStateEnabled ? fileState.isLoading : false) || isLoadingPreview
  const error = (fileStateEnabled ? fileState.error : null) ?? previewError
  const textPreviewSurface = previewKind === "markdown" ? (
    <div className={cn("min-h-[34rem] overflow-auto border border-border/40 bg-card p-5 text-sm", radiusClassName(radius, "surface"))}>
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
          {canEditText ? draftText : content ?? ""}
        </ReactMarkdown>
      </div>
    </div>
  ) : (
    <pre className={cn("min-h-[34rem] overflow-auto whitespace-pre border border-border/40 bg-card p-4 font-mono text-xs text-foreground", radiusClassName(radius, "surface"))}>
      {canEditText ? draftText : content ?? ""}
    </pre>
  )
  const textEditorSurface = canEditText ? (
    <Textarea
      value={draftText}
      onChange={(event) => setDraftText(event.target.value)}
      spellCheck={previewKind === "markdown"}
      className={cn("min-h-[34rem] resize-none border-border/40 bg-card font-mono text-xs leading-6 shadow-none", radiusClassName(radius, "surface"))}
    />
  ) : null

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-file-viewer flex h-full min-h-0 flex-col", rootClassName(appearance), className)}
    >
      <div className={cn("shrink-0", headerClassName(appearance))}>
        <div className={cn("flex flex-col gap-4", toolbarClassName(density))}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{previewKindLabel(previewKind)}</Badge>
                {resolvedFile?.updated_at ? <Badge variant="outline">{`Updated ${formatDateTime(resolvedFile.updated_at)}`}</Badge> : null}
                {typeof resolvedFile?.size_bytes === "number" ? <Badge variant="outline">{formatFileSize(resolvedFile.size_bytes)}</Badge> : null}
                {canEditText ? (
                  <Badge variant={isTextDirty ? "secondary" : "outline"}>{isTextDirty ? "Unsaved" : "Saved"}</Badge>
                ) : null}
              </div>

              <div className="flex min-w-0 items-start gap-3">
                <span className={cn("mt-1 flex size-10 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground", radiusClassName(radius, "control"))}>
                  {viewerIcon(previewKind)}
                </span>
                <div className="min-w-0 flex-1">
                  <h1 className={titleClassName(density)}>{title ?? displayName}</h1>
                  <p className={cn("mt-2 max-w-3xl text-muted-foreground", descriptionClassName(density))}>
                    {resolvedFile?.description?.trim()
                      ? resolvedFile.description
                      : "Preview, edit, and route this file from the same workspace shell used across documents."}
                  </p>
                  <p className="mt-2 truncate text-xs text-muted-foreground">{displayPath(path)}</p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {headerActions}
              <Button variant="ghost" size="icon-sm" onClick={() => void loadPreview()} disabled={isLoading}>
                <RefreshCw className={cn(isLoading ? "animate-spin" : undefined)} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleDownload()}>
                <Download data-icon="inline-start" />
                Download
              </Button>
              {onOpenExternal ? (
                <Button variant="ghost" size="icon-sm" onClick={() => onOpenExternal(resolvedFile, path)}>
                  <ExternalLink />
                </Button>
              ) : null}
            </div>
          </div>

          {(showBreadcrumbs || canEditText) ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3">
              <div className="min-w-0 flex-1">
                {showBreadcrumbs ? <FileViewerBreadcrumb path={path} /> : null}
              </div>

              {canEditText ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Button variant={textMode === "preview" ? "default" : "outline"} size="sm" onClick={() => setTextMode("preview")}>
                      Preview
                    </Button>
                    <Button variant={textMode === "edit" ? "default" : "outline"} size="sm" onClick={() => setTextMode("edit")}>
                      Edit
                    </Button>
                    <Button variant={textMode === "split" ? "default" : "outline"} size="sm" onClick={() => setTextMode("split")}>
                      Split
                    </Button>
                  </div>
                  <Button size="sm" onClick={() => void handleTextSave()} disabled={!isTextDirty || isSavingText}>
                    {isSavingText ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
                    Save
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className={cn("flex-1 overflow-auto", contentClassName(density))}>
        {textSaveError ? (
          <div className={cn("mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive", radiusClassName(radius, "surface"))}>
            {textSaveError}
          </div>
        ) : null}

        {showMetadata && resolvedFile ? (
          <div className={cn("mb-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]")}>
            <div className={cn("border border-border/40 bg-card/70", radiusClassName(radius, "surface"), density === "compact" ? "p-3" : density === "spacious" ? "p-5" : "p-4")}>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <span>{resolvedFile.kind}</span>
                {resolvedFile.visibility ? <span>{resolvedFile.visibility}</span> : null}
                {resolvedFile.search_enabled === false ? <span>Search disabled</span> : <span>Searchable</span>}
              </div>
              <p className="mt-2 text-sm text-foreground">{displayPath(path)}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {resolvedFile.description?.trim() || "This file is part of the pod datastore and can be previewed, linked into records, or passed into assistant workflows."}
              </p>
            </div>
            <div className={cn("border border-border/40 bg-card/70", radiusClassName(radius, "surface"), density === "compact" ? "p-3" : density === "spacious" ? "p-5" : "p-4")}>
              <div className="space-y-2">
                {metadataItems.map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-right text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
            <span className={cn("flex size-11 items-center justify-center border border-destructive/30 bg-destructive/10 text-destructive", radiusClassName(radius, "pill"))}>
              <AlertCircle className="size-5" />
            </span>
            <div>
              <p className="font-medium text-foreground">Preview unavailable</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">{error.message}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void handleDownload()}>
              <Download data-icon="inline-start" />
              Download file
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : canEditText && content != null ? (
          textMode === "split" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {textEditorSurface}
              {textPreviewSurface}
            </div>
          ) : textMode === "edit" ? (
            textEditorSurface
          ) : (
            textPreviewSurface
          )
        ) : previewKind === "image" && objectUrl ? (
          <div className="flex min-h-full items-center justify-center">
            <img src={objectUrl} alt={displayName} className={cn("max-h-full max-w-full object-contain", radiusClassName(radius, "surface"))} />
          </div>
        ) : previewKind === "pdf" && objectUrl ? (
          <iframe title={displayName} src={objectUrl} className={cn("h-full min-h-[32rem] w-full border border-border/40 bg-background", radiusClassName(radius, "surface"))} />
        ) : previewKind === "markdown" && content != null ? (
          <div className={cn("mx-auto max-w-4xl border border-border/40 bg-card p-5 text-sm", radiusClassName(radius, "surface"))}>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        ) : previewKind === "text" && content != null ? (
          <pre className={cn("min-h-full overflow-auto border border-border/40 bg-card p-4 font-mono text-xs text-foreground", radiusClassName(radius, "surface"))}>{content}</pre>
        ) : previewKind === "html" && content != null ? (
          <iframe title={displayName} srcDoc={content} sandbox="" className={cn("h-full min-h-[32rem] w-full border border-border/40 bg-background", radiusClassName(radius, "surface"))} />
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
            <span className={cn("flex size-11 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground", radiusClassName(radius, "pill"))}>
              <File className="size-5" />
            </span>
            <div>
              <p className="font-medium text-foreground">No inline preview</p>
              <p className="mt-1 text-sm text-muted-foreground">Download the file or open it in another workflow.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void handleDownload()}>
              <Download data-icon="inline-start" />
              Download file
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function FileViewerBreadcrumb({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean)
  let currentPath = ""

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem>
          <BreadcrumbPage className="inline-flex items-center gap-1.5">
            <Home className="size-3.5" />
            Files
          </BreadcrumbPage>
        </BreadcrumbItem>
        {parts.map((part, index) => {
          currentPath += `/${part}`
          const isLast = index === parts.length - 1
          return (
            <React.Fragment key={currentPath}>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="max-w-56 truncate">{displayFileName(part)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href="#" onClick={(event) => event.preventDefault()} className="max-w-40 truncate text-muted-foreground">
                    {displayFileName(part)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function inferPreviewKind(file: FileResponse | null | undefined, path: string): PreviewKind {
  const mime = file?.mime_type?.toLowerCase() ?? ""
  const extension = extensionFromPath(path)
  const name = fileNameFromPath(path).toLowerCase()
  if (mime.startsWith("image/") || /^(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff|avif)$/.test(extension)) return "image"
  if (mime === "application/pdf" || extension === "pdf") return "pdf"
  if (isMarkdownExtension(extension)) return "markdown"
  if (isTextLikeMime(mime) || isTextLikeFile(extension, name)) return "text"
  if (/^(doc|docx|ppt|pptx|xls|xlsx|pages|rtf)$/.test(extension)) return "html"
  return "download"
}

function isEditableTextKind(kind: PreviewKind) {
  return kind === "markdown" || kind === "text"
}

function viewerIcon(kind: PreviewKind) {
  if (kind === "image") return <Image className="size-4" />
  if (kind === "markdown" || kind === "text" || kind === "html" || kind === "pdf") return <FileText className="size-4" />
  return <File className="size-4" />
}

function previewKindLabel(kind: PreviewKind) {
  if (kind === "markdown") return "Markdown"
  if (kind === "text") return "Text"
  if (kind === "html") return "HTML"
  if (kind === "pdf") return "PDF"
  if (kind === "image") return "Image"
  return "File"
}

function fileNameFromPath(path: string) {
  const parts = path.split("/").filter(Boolean)
  return parts[parts.length - 1] ?? path
}

function stripInternalDocumentExtension(name: string) {
  return name.toLowerCase().endsWith(".lemma-doc.json") ? name.slice(0, -".lemma-doc.json".length) : name
}

function displayFileName(name: string) {
  return stripInternalDocumentExtension(name)
}

function displayPath(path: string) {
  const parts = path.split("/")
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    if (!parts[index]) continue
    parts[index] = displayFileName(parts[index])
    break
  }
  return parts.join("/")
}

function downloadFileNameFromPath(path: string) {
  const name = fileNameFromPath(path)
  if (!name.toLowerCase().endsWith(".lemma-doc.json")) return name
  return `${stripInternalDocumentExtension(name)}.json`
}

function extensionFromPath(path: string) {
  const name = fileNameFromPath(path)
  const index = name.lastIndexOf(".")
  if (index < 0) return ""
  return name.slice(index + 1).toLowerCase()
}

function isMarkdownExtension(extension: string) {
  return extension === "md" || extension === "markdown" || extension === "mdx"
}

function isTextLikeMime(mime: string) {
  return mime.startsWith("text/") || /(json|xml|yaml|toml|javascript|typescript|shellscript|x-sh|graphql)/.test(mime)
}

function isTextLikeFile(extension: string, name: string) {
  if (name === "dockerfile" || name === "makefile") return true
  return /^(txt|text|csv|log|json|jsonc|xml|yaml|yml|toml|ini|conf|env|js|mjs|cjs|jsx|ts|mts|cts|tsx|css|scss|sass|less|html|htm|py|rb|go|rs|java|kt|swift|c|h|cc|cpp|hpp|cs|php|sh|bash|zsh|fish|sql|graphql|gql)$/.test(extension)
}

function inferTextMimeType(mimeType: string | null | undefined, path: string, kind: PreviewKind) {
  if (mimeType?.trim()) return mimeType
  const extension = extensionFromPath(path)
  if (kind === "markdown") return "text/markdown;charset=utf-8"
  if (extension === "json" || extension === "jsonc") return "application/json;charset=utf-8"
  if (extension === "yaml" || extension === "yml") return "application/yaml;charset=utf-8"
  if (extension === "html" || extension === "htm") return "text/html;charset=utf-8"
  if (extension === "csv") return "text/csv;charset=utf-8"
  return "text/plain;charset=utf-8"
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function rootClassName(appearance: LemmaFileViewerAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function headerClassName(appearance: LemmaFileViewerAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

function toolbarClassName(density: LemmaFileViewerDensity) {
  if (density === "compact") return "px-3 py-3"
  if (density === "spacious") return "px-6 py-5"
  return "px-5 py-4"
}

function contentClassName(density: LemmaFileViewerDensity) {
  if (density === "compact") return "p-2"
  if (density === "spacious") return "p-5"
  return "p-4"
}

function titleClassName(density: LemmaFileViewerDensity) {
  if (density === "compact") return "truncate text-2xl font-semibold tracking-tight text-foreground"
  if (density === "spacious") return "truncate text-4xl font-semibold tracking-tight text-foreground"
  return "truncate text-3xl font-semibold tracking-tight text-foreground"
}

function descriptionClassName(density: LemmaFileViewerDensity) {
  if (density === "compact") return "text-sm"
  if (density === "spacious") return "text-lg"
  return "text-base"
}

function radiusClassName(radius: LemmaFileViewerRadius, target: "surface" | "control" | "pill") {
  if (radius === "none") return "rounded-none"
  if (radius === "sm") return target === "surface" ? "rounded-md" : "rounded-sm"
  if (radius === "md") return target === "surface" ? "rounded-lg" : "rounded-md"
  if (radius === "xl") return target === "pill" ? "rounded-full" : target === "control" ? "rounded-xl" : "rounded-2xl"
  return target === "pill" ? "rounded-full" : target === "control" ? "rounded-lg" : "rounded-xl"
}
