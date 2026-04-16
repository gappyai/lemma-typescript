"use client"

import * as React from "react"
import {
  Download,
  File,
  FileText,
  Image,
  Paperclip,
  RefreshCw,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRecords } from "lemma-sdk/react"
import type { LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { enumPillClasses, extensionCategory, extensionCategoryBadgeClasses, type EnumColorMap } from "./attachment-enum-utils"
import {
  attachmentRadiusClassName,
  type LemmaAttachmentAppearance,
  type LemmaAttachmentDensity,
  type LemmaAttachmentRadius,
} from "./attachment-style-utils"

export type { LemmaAttachmentAppearance, LemmaAttachmentDensity, LemmaAttachmentRadius } from "./attachment-style-utils"

export interface LemmaAttachmentViewerProps {
  client: LemmaClient
  podId?: string
  tableName: string
  recordId?: string
  foreignKey?: string
  enabled?: boolean
  enumColorMap?: EnumColorMap
  appearance?: LemmaAttachmentAppearance
  density?: LemmaAttachmentDensity
  radius?: LemmaAttachmentRadius
  filenameField?: string
  urlField?: string
  sizeField?: string
  contentTypeField?: string
  dateField?: string
  title?: React.ReactNode
  className?: string
  onFileClick?: (file: Record<string, unknown>) => void
  uploadEnabled?: boolean
  onUpload?: () => void
}

export function LemmaAttachmentViewer({
  client,
  podId,
  tableName,
  recordId,
  foreignKey,
  enabled = true,
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  filenameField = "filename",
  urlField = "file_url",
  sizeField = "file_size",
  contentTypeField = "content_type",
  dateField = "created_at",
  title,
  className,
  onFileClick,
  uploadEnabled,
  onUpload,
}: LemmaAttachmentViewerProps) {
  const filters = React.useMemo(() => {
    if (!recordId) return undefined
    const fk = foreignKey ?? `${tableName}_id`
    return [{ field: fk, op: "=", value: recordId }]
  }, [recordId, foreignKey, tableName])

  const { records, isLoading, error, refresh } = useRecords({
    client,
    podId,
    tableName,
    filters,
    sortBy: dateField,
    order: "desc",
    enabled,
  })

  const parsedFiles = React.useMemo(() =>
    records.map((r) => ({
      record: r,
      id: String(r.id ?? ""),
      filename: String(r[filenameField] ?? "Untitled"),
      url: r[urlField] != null ? String(r[urlField]) : undefined,
      size: r[sizeField] != null ? Number(r[sizeField]) : undefined,
      contentType: r[contentTypeField] != null ? String(r[contentTypeField]) : undefined,
      date: r[dateField] != null ? new Date(String(r[dateField])) : undefined,
      ext: extractExtension(String(r[filenameField] ?? "")),
      isImage: isImageContentType(r[contentTypeField] != null ? String(r[contentTypeField]) : undefined, String(r[filenameField] ?? "")),
    })),
    [records, filenameField, urlField, sizeField, contentTypeField, dateField],
  )

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-attachment-viewer flex h-full min-h-0 flex-col", viewerRootClassName(appearance), className)}
    >
      <div className={cn("shrink-0", viewerHeaderClassName(appearance))}>
        <div className={cn("flex items-center justify-between", viewerToolbarClassName(density))}>
          <div className="min-w-0 flex items-center gap-3">
            <span className={cn("flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground", attachmentRadiusClassName(radius, "control"))}>
              <Paperclip className="size-3.5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {title ?? "Attachments"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {parsedFiles.length} file{parsedFiles.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {uploadEnabled && (
              <Button variant="outline" size="sm" onClick={onUpload} className={attachmentRadiusClassName(radius, "control")}>
                <Upload className="mr-2 size-3.5" />
                Upload
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-auto", viewerContentClassName(density))}>
        {error ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => refresh()} className={attachmentRadiusClassName(radius, "control")}>
              <RefreshCw className="mr-2 size-3.5" />
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : parsedFiles.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <div className={cn("flex size-10 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground", attachmentRadiusClassName(radius, "pill"))}>
              <Paperclip className="size-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">No attachments</p>
              <p className="mt-1 text-sm text-muted-foreground">Files linked to this record will appear here.</p>
            </div>
            {uploadEnabled && (
              <Button variant="outline" size="sm" onClick={onUpload} className={cn("mt-2", attachmentRadiusClassName(radius, "control"))}>
                <Upload className="mr-2 size-3.5" />
                Upload file
              </Button>
            )}
          </div>
        ) : (
          <div className={cn("flex flex-col", density === "compact" ? "gap-1.5" : density === "spacious" ? "gap-3" : "gap-2")}>
            {parsedFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-3 border border-border/30 bg-muted/10 transition-colors",
                  onFileClick && "cursor-pointer hover:bg-muted/25",
                  !onFileClick && "cursor-default",
                  attachmentRadiusClassName(radius, "surface"),
                  density === "compact" ? "p-2" : density === "spacious" ? "p-4" : "p-3",
                )}
                onClick={() => onFileClick?.(file.record)}
              >
                {file.isImage && file.url ? (
                  <div className={cn("relative shrink-0 overflow-hidden border border-border/40 bg-muted/20", attachmentRadiusClassName(radius, "control"), density === "compact" ? "size-8" : density === "spacious" ? "size-12" : "size-10")}>
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={cn("flex shrink-0 items-center justify-center border border-border/40 bg-muted/20 text-muted-foreground", attachmentRadiusClassName(radius, "control"), density === "compact" ? "size-8" : density === "spacious" ? "size-12" : "size-10")}>
                    {fileIcon(file.ext)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {file.filename}
                    </p>
                    <span className={extensionCategoryBadgeClasses(file.ext)}>
                      {file.ext.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {file.size != null && (
                      <span>{formatFileSize(file.size)}</span>
                    )}
                    {file.date && !Number.isNaN(file.date.getTime()) && (
                      <>
                        {file.size != null && <span>&middot;</span>}
                        <span>{formatDate(file.date)}</span>
                      </>
                    )}
                  </div>
                </div>

                {file.url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("shrink-0 size-8", attachmentRadiusClassName(radius, "control"))}
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(file.url, "_blank", "noopener")
                    }}
                  >
                    <Download className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function fileIcon(ext: string): React.ReactNode {
  const cat = extensionCategory(ext)
  if (cat === "image") return <Image className="size-4" />
  if (cat === "document") return <FileText className="size-4" />
  return <File className="size-4" />
}

function extractExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".")
  if (lastDot < 0 || lastDot === filename.length - 1) return "file"
  return filename.slice(lastDot + 1).toLowerCase()
}

function isImageContentType(contentType?: string, filename?: string): boolean {
  if (contentType && contentType.startsWith("image/")) return true
  if (!filename) return false
  const ext = extractExtension(filename)
  return /^(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff|avif)$/.test(ext)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function viewerRootClassName(appearance: LemmaAttachmentAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function viewerHeaderClassName(appearance: LemmaAttachmentAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

function viewerToolbarClassName(density: LemmaAttachmentDensity) {
  if (density === "compact") return "gap-2 px-3 py-2"
  if (density === "spacious") return "gap-4 px-5 py-4"
  return "gap-3 px-4 py-3"
}

function viewerContentClassName(density: LemmaAttachmentDensity) {
  if (density === "compact") return "p-2"
  if (density === "spacious") return "p-5"
  return "p-4"
}
