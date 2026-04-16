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
  Image,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useFile } from "lemma-sdk/react"
import type { FileResponse, LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"

export type LemmaFileViewerAppearance = "default" | "minimal" | "borderless" | "contained"
export type LemmaFileViewerDensity = "compact" | "comfortable" | "spacious"
export type LemmaFileViewerRadius = "none" | "sm" | "md" | "lg" | "xl"

export interface LemmaFileViewerProps {
  client: LemmaClient
  podId?: string
  path: string
  file?: FileResponse | null
  enabled?: boolean
  convertedArtifact?: string
  appearance?: LemmaFileViewerAppearance
  density?: LemmaFileViewerDensity
  radius?: LemmaFileViewerRadius
  title?: React.ReactNode
  headerActions?: React.ReactNode
  className?: string
  onOpenExternal?: (file: FileResponse | null, path: string) => void
}

type PreviewKind = "image" | "pdf" | "markdown" | "text" | "html" | "download"

export function LemmaFileViewer({
  client,
  podId,
  path,
  file,
  enabled = true,
  convertedArtifact = "document.md",
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  headerActions,
  className,
  onOpenExternal,
}: LemmaFileViewerProps) {
  const scopedClient = React.useMemo(() => (podId ? client.withPod(podId) : client), [client, podId])
  const fileState = useFile({
    client,
    podId,
    path,
    enabled: enabled && !file,
  })
  const resolvedFile = file ?? fileState.file
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null)
  const [content, setContent] = React.useState<string | null>(null)
  const [previewError, setPreviewError] = React.useState<Error | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false)
  const previewKind = inferPreviewKind(resolvedFile, path)
  const displayName = resolvedFile?.name ?? fileNameFromPath(path)

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

  const handleDownload = React.useCallback(async () => {
    const blob = await scopedClient.files.download(path)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = displayName
    anchor.click()
    URL.revokeObjectURL(url)
  }, [displayName, path, scopedClient])

  const isLoading = fileState.isLoading || isLoadingPreview
  const error = fileState.error ?? previewError

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-file-viewer flex h-full min-h-0 flex-col", rootClassName(appearance), className)}
    >
      <div className={cn("shrink-0", headerClassName(appearance))}>
        <div className={cn("flex items-center justify-between gap-3", toolbarClassName(density))}>
          <div className="min-w-0 flex items-center gap-3">
            <span className={cn("flex size-8 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground", radiusClassName(radius, "control"))}>
              {viewerIcon(previewKind)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground">{title ?? displayName}</h1>
              <p className="truncate text-xs text-muted-foreground">{path}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
      </div>

      <div className={cn("flex-1 overflow-auto", contentClassName(density))}>
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
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
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

function inferPreviewKind(file: FileResponse | null | undefined, path: string): PreviewKind {
  const mime = file?.mime_type?.toLowerCase() ?? ""
  const extension = extensionFromPath(path)
  if (mime.startsWith("image/") || /^(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff|avif)$/.test(extension)) return "image"
  if (mime === "application/pdf" || extension === "pdf") return "pdf"
  if (extension === "md" || extension === "markdown") return "markdown"
  if (mime.startsWith("text/") || /^(txt|csv|log|json|xml|yaml|yml)$/.test(extension)) return "text"
  if (/^(doc|docx|ppt|pptx|xls|xlsx|pages|rtf)$/.test(extension)) return "html"
  return "download"
}

function viewerIcon(kind: PreviewKind) {
  if (kind === "image") return <Image className="size-4" />
  if (kind === "markdown" || kind === "text" || kind === "html" || kind === "pdf") return <FileText className="size-4" />
  return <File className="size-4" />
}

function fileNameFromPath(path: string) {
  const parts = path.split("/").filter(Boolean)
  return parts[parts.length - 1] ?? path
}

function extensionFromPath(path: string) {
  const name = fileNameFromPath(path)
  const index = name.lastIndexOf(".")
  if (index < 0) return ""
  return name.slice(index + 1).toLowerCase()
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
  if (density === "compact") return "px-3 py-2"
  if (density === "spacious") return "px-5 py-4"
  return "px-4 py-3"
}

function contentClassName(density: LemmaFileViewerDensity) {
  if (density === "compact") return "p-2"
  if (density === "spacious") return "p-5"
  return "p-4"
}

function radiusClassName(radius: LemmaFileViewerRadius, target: "surface" | "control" | "pill") {
  if (radius === "none") return "rounded-none"
  if (radius === "sm") return target === "surface" ? "rounded-md" : "rounded-sm"
  if (radius === "md") return target === "surface" ? "rounded-lg" : "rounded-md"
  if (radius === "xl") return target === "pill" ? "rounded-full" : target === "control" ? "rounded-xl" : "rounded-2xl"
  return target === "pill" ? "rounded-full" : target === "control" ? "rounded-lg" : "rounded-xl"
}
