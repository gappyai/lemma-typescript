"use client"

import * as React from "react"
import {
  Download,
  File,
  FileText,
  Folder,
  Home,
  Image,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useFiles, useFileSearch } from "lemma-sdk/react"
import type { FileResponse, FileSearchResultSchema, LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"

export type LemmaFileBrowserAppearance = "default" | "minimal" | "borderless" | "contained"
export type LemmaFileBrowserDensity = "compact" | "comfortable" | "spacious"
export type LemmaFileBrowserRadius = "none" | "sm" | "md" | "lg" | "xl"

export interface LemmaFileBrowserProps {
  client: LemmaClient
  podId?: string
  initialPath?: string
  enabled?: boolean
  limit?: number
  searchMinLength?: number
  uploadEnabled?: boolean
  deleteEnabled?: boolean
  appearance?: LemmaFileBrowserAppearance
  density?: LemmaFileBrowserDensity
  radius?: LemmaFileBrowserRadius
  title?: React.ReactNode
  headerActions?: React.ReactNode
  className?: string
  onFileOpen?: (file: FileResponse) => void
  onSearchResultOpen?: (result: FileSearchResultSchema) => void
  onPathChange?: (path: string) => void
  onUploadSuccess?: (file: FileResponse) => void
  onDeleteSuccess?: (file: FileResponse) => void
}

export function LemmaFileBrowser({
  client,
  podId,
  initialPath = "/",
  enabled = true,
  limit = 100,
  searchMinLength = 2,
  uploadEnabled,
  deleteEnabled,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  headerActions,
  className,
  onFileOpen,
  onSearchResultOpen,
  onPathChange,
  onUploadSuccess,
  onDeleteSuccess,
}: LemmaFileBrowserProps) {
  const [currentPath, setCurrentPath] = React.useState(normalizePath(initialPath))
  const [query, setQuery] = React.useState("")
  const [uploading, setUploading] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<FileResponse | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const scopedClient = React.useMemo(() => (podId ? client.withPod(podId) : client), [client, podId])
  const trimmedQuery = query.trim()
  const hasSearch = trimmedQuery.length >= searchMinLength

  const filesState = useFiles({
    client,
    podId,
    enabled,
    directoryPath: currentPath,
    limit,
  })

  const searchState = useFileSearch({
    client,
    podId,
    enabled: enabled && hasSearch,
    query: trimmedQuery,
    minQueryLength: searchMinLength,
    limit,
  })

  React.useEffect(() => {
    const nextPath = normalizePath(initialPath)
    setCurrentPath(nextPath)
  }, [initialPath])

  const entries = React.useMemo(() => {
    if (hasSearch) {
      return searchState.results.map((result) => ({
        key: `search:${result.file_id}:${result.chunk_index}`,
        title: fileNameFromPath(result.path),
        path: result.path,
        kind: "file",
        preview: result.content,
        raw: result,
      }))
    }

    return filesState.files.map((file) => ({
      key: file.id ?? file.path,
      title: file.name || fileNameFromPath(file.path),
      path: file.path,
      kind: file.kind,
      size: file.size_bytes,
      status: file.status,
      updatedAt: file.updated_at,
      raw: file,
    }))
  }, [filesState.files, hasSearch, searchState.results])

  const isLoading = hasSearch ? searchState.isLoading : filesState.isLoading
  const error = hasSearch ? searchState.error : filesState.error

  const navigateToPath = React.useCallback((path: string) => {
    const nextPath = normalizePath(path)
    setCurrentPath(nextPath)
    setQuery("")
    onPathChange?.(nextPath)
  }, [onPathChange])

  const handleEntryOpen = React.useCallback((entry: (typeof entries)[number]) => {
    if (isDirectoryKind(entry.kind)) {
      navigateToPath(entry.path)
      return
    }
    if (hasSearch) {
      onSearchResultOpen?.(entry.raw as FileSearchResultSchema)
      return
    }
    onFileOpen?.(entry.raw as FileResponse)
  }, [hasSearch, navigateToPath, onFileOpen, onSearchResultOpen])

  const handleUpload = React.useCallback(async (fileList: FileList | null) => {
    const selected = fileList ? Array.from(fileList) : []
    if (selected.length === 0) return
    setUploading(true)
    try {
      for (const file of selected) {
        const uploaded = await scopedClient.files.upload(file, { directoryPath: currentPath })
        onUploadSuccess?.(uploaded)
      }
      await filesState.refresh()
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [currentPath, filesState, onUploadSuccess, scopedClient])

  const handleDelete = React.useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await scopedClient.files.delete(deleteTarget.path)
      onDeleteSuccess?.(deleteTarget)
      setDeleteTarget(null)
      await filesState.refresh()
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, filesState, onDeleteSuccess, scopedClient])

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-file-browser flex h-full min-h-0 flex-col", rootClassName(appearance), className)}
    >
      <div className={cn("shrink-0", headerClassName(appearance))}>
        <div className={cn("flex flex-col gap-3", toolbarClassName(density))}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <span className={cn("flex size-8 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground", radiusClassName(radius, "control"))}>
                <Folder className="size-4" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-foreground">{title ?? "Files"}</h1>
                <p className="truncate text-xs text-muted-foreground">{hasSearch ? `${searchState.totalResults} search results` : currentPath}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {headerActions}
              <Button variant="ghost" size="icon-sm" onClick={() => void filesState.refresh()} disabled={isLoading}>
                <RefreshCw className={cn(isLoading ? "animate-spin" : undefined)} />
              </Button>
              {uploadEnabled ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => void handleUpload(event.target.files)}
                  />
                  <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Upload data-icon="inline-start" />}
                    Upload
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <FilePathBreadcrumb path={currentPath} radius={radius} onNavigate={navigateToPath} />
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search files..."
                className={cn("h-8 pl-8 text-xs", radiusClassName(radius, "control"))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-auto", contentClassName(density))}>
        {error ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => hasSearch ? void searchState.search() : void filesState.refresh()}>
              <RefreshCw data-icon="inline-start" />
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-md" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <span className={cn("flex size-11 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground", radiusClassName(radius, "pill"))}>
              <Folder className="size-5" />
            </span>
            <div>
              <p className="font-medium text-foreground">{hasSearch ? "No matching files" : "No files here"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{hasSearch ? "Try a broader filename or phrase." : "Upload files or open another folder."}</p>
            </div>
          </div>
        ) : (
          <div className={cn("flex flex-col", density === "compact" ? "gap-1" : "gap-2")}>
            {entries.map((entry) => {
              const isDirectory = isDirectoryKind(entry.kind)
              const extension = isDirectory ? "" : extensionFromPath(entry.path)
              return (
                <div
                  key={entry.key}
                  className={cn(
                    "group flex items-center gap-3 border border-border/30 bg-muted/10 transition-colors hover:bg-muted/25",
                    radiusClassName(radius, "surface"),
                    density === "compact" ? "p-2" : density === "spacious" ? "p-4" : "p-3",
                  )}
                >
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => handleEntryOpen(entry)}>
                    <span className={cn("flex shrink-0 items-center justify-center border border-border/40 bg-muted/20 text-muted-foreground", radiusClassName(radius, "control"), density === "compact" ? "size-8" : "size-10")}>
                      {isDirectory ? <Folder className="size-4" /> : fileIcon(extension)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{entry.title}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{entry.path}</span>
                        {"size" in entry && typeof entry.size === "number" ? <span>{formatFileSize(entry.size)}</span> : null}
                        {"preview" in entry && entry.preview ? <span className="line-clamp-1">{entry.preview}</span> : null}
                      </span>
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!isDirectory ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => void downloadFile(scopedClient, entry.path)}
                      >
                        <Download />
                      </Button>
                    ) : null}
                    {deleteEnabled && !hasSearch ? (
                      <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(entry.raw as FileResponse)}>
                        <Trash2 />
                      </Button>
                    ) : (
                      <MoreHorizontal className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {deleteTarget?.name ?? "this item"} from the datastore. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={() => void handleDelete()}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FilePathBreadcrumb({
  path,
  radius,
  onNavigate,
}: {
  path: string
  radius: LemmaFileBrowserRadius
  onNavigate: (path: string) => void
}) {
  const parts = path.split("/").filter(Boolean)
  let currentPath = ""

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem>
          {parts.length === 0 ? (
            <BreadcrumbPage className="inline-flex items-center gap-1.5">
              <Home className="size-3.5" />
              Files
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink className={cn("inline-flex items-center gap-1.5", radiusClassName(radius, "control"))} href="#" onClick={(event) => { event.preventDefault(); onNavigate("/") }}>
              <Home className="size-3.5" />
              Files
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {parts.map((part, index) => {
          currentPath += `/${part}`
          const itemPath = currentPath
          const isLast = index === parts.length - 1
          return (
            <React.Fragment key={itemPath}>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="max-w-48 truncate">{part}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink className="max-w-40 truncate" href="#" onClick={(event) => { event.preventDefault(); onNavigate(itemPath) }}>
                    {part}
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

async function downloadFile(client: LemmaClient, path: string) {
  const blob = await client.files.download(path)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileNameFromPath(path)
  anchor.click()
  URL.revokeObjectURL(url)
}

function normalizePath(path: string) {
  const trimmed = path.trim()
  if (!trimmed || trimmed === "/") return "/"
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`
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

function fileIcon(extension: string) {
  if (/^(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff|avif)$/.test(extension)) return <Image className="size-4" />
  if (/^(md|txt|doc|docx|pdf|rtf|csv|xls|xlsx|ppt|pptx)$/.test(extension)) return <FileText className="size-4" />
  return <File className="size-4" />
}

function isDirectoryKind(kind: unknown) {
  return String(kind).toLowerCase() === "directory" || String(kind).toLowerCase() === "folder"
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function rootClassName(appearance: LemmaFileBrowserAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function headerClassName(appearance: LemmaFileBrowserAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

function toolbarClassName(density: LemmaFileBrowserDensity) {
  if (density === "compact") return "px-3 py-2"
  if (density === "spacious") return "px-5 py-4"
  return "px-4 py-3"
}

function contentClassName(density: LemmaFileBrowserDensity) {
  if (density === "compact") return "p-2"
  if (density === "spacious") return "p-5"
  return "p-4"
}

function radiusClassName(radius: LemmaFileBrowserRadius, target: "surface" | "control" | "pill") {
  if (radius === "none") return "rounded-none"
  if (radius === "sm") return target === "surface" ? "rounded-md" : "rounded-sm"
  if (radius === "md") return target === "surface" ? "rounded-lg" : "rounded-md"
  if (radius === "xl") return target === "pill" ? "rounded-full" : target === "control" ? "rounded-xl" : "rounded-2xl"
  return target === "pill" ? "rounded-full" : target === "control" ? "rounded-lg" : "rounded-xl"
}
