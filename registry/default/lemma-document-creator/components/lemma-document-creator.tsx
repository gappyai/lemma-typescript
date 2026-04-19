"use client"

import * as React from "react"
import {
  FilePlus2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { FileResponse, LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"

export type LemmaDocumentCreatorAppearance = "default" | "minimal" | "borderless" | "contained"
export type LemmaDocumentCreatorDensity = "compact" | "comfortable" | "spacious"
export type LemmaDocumentCreatorRadius = "none" | "sm" | "md" | "lg" | "xl"
export type LemmaDocumentCreatorMode = "page" | "modal"

export interface LemmaDocumentTemplate {
  id: string
  label: React.ReactNode
  description?: React.ReactNode
  fileName?: string
  title?: string
  summary?: string
  body: string
}

export interface LemmaDocumentCreatorProps {
  client: LemmaClient
  podId?: string
  enabled?: boolean
  mode?: LemmaDocumentCreatorMode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultDirectoryPath?: string
  defaultFileName?: string
  defaultTitle?: string
  defaultSummary?: string
  defaultBody?: string
  searchEnabled?: boolean
  templates?: LemmaDocumentTemplate[]
  title?: React.ReactNode
  description?: React.ReactNode
  createLabel?: React.ReactNode
  headerActions?: React.ReactNode
  className?: string
  appearance?: LemmaDocumentCreatorAppearance
  density?: LemmaDocumentCreatorDensity
  radius?: LemmaDocumentCreatorRadius
  onCreateSuccess?: (
    file: FileResponse,
    draft: {
      directoryPath: string
      fileName: string
      title: string
      summary: string
      body: string
    },
  ) => void
}

export function LemmaDocumentCreator({
  client,
  podId,
  enabled = true,
  mode = "page",
  open,
  onOpenChange,
  defaultDirectoryPath = "/",
  defaultFileName = "untitled.md",
  defaultTitle = "",
  defaultSummary = "",
  defaultBody = "",
  searchEnabled = true,
  templates = defaultTemplates(),
  title = "Create document",
  description = "Create a new markdown-first document directly in the pod file namespace.",
  createLabel = "Create document",
  headerActions,
  className,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  onCreateSuccess,
}: LemmaDocumentCreatorProps) {
  const [directoryPath, setDirectoryPath] = React.useState(defaultDirectoryPath)
  const [fileName, setFileName] = React.useState(defaultFileName)
  const [documentTitle, setDocumentTitle] = React.useState(defaultTitle)
  const [summary, setSummary] = React.useState(defaultSummary)
  const [body, setBody] = React.useState(defaultBody)
  const [error, setError] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const scopedClient = React.useMemo(() => (podId ? client.withPod(podId) : client), [client, podId])

  const handleTemplate = React.useCallback((template: LemmaDocumentTemplate) => {
    setDocumentTitle(template.title ?? "")
    setSummary(template.summary ?? "")
    setBody(template.body)
    if (template.fileName) setFileName(template.fileName)
    setError(null)
  }, [])

  const handleCreate = React.useCallback(async () => {
    const nextDirectoryPath = normalizePath(directoryPath)
    const nextFileName = normalizeDocumentFileName(fileName)
    if (!enabled || !nextFileName || isCreating) return

    setIsCreating(true)
    setError(null)
    try {
      const finalBody = buildDocumentBody({
        title: documentTitle,
        summary,
        body,
      })
      const blob = new Blob([finalBody], { type: "text/markdown;charset=utf-8" })
      const file = await scopedClient.files.upload(blob, {
        name: nextFileName,
        directoryPath: nextDirectoryPath,
        description: summary.trim() || undefined,
        searchEnabled,
      })
      onCreateSuccess?.(file, {
        directoryPath: nextDirectoryPath,
        fileName: nextFileName,
        title: documentTitle,
        summary,
        body: finalBody,
      })
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : "Failed to create document.")
    } finally {
      setIsCreating(false)
    }
  }, [body, directoryPath, documentTitle, enabled, fileName, isCreating, onCreateSuccess, scopedClient, searchEnabled, summary])

  const content = (
    <div
      data-appearance={appearance}
      data-density={density}
      data-mode={mode}
      data-radius={radius}
      className={cn("lemma-document-creator flex min-h-0 flex-col overflow-hidden", shellClassName(appearance, radius, mode), className)}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 px-4 py-1.5">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span>{normalizePath(directoryPath)}</span>
          <span>·</span>
          <span>Docstore</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {headerActions}
          <Button size="sm" className="h-7 gap-1.5 px-3 text-xs" onClick={() => void handleCreate()} disabled={!enabled || !fileName.trim() || isCreating}>
            {isCreating ? <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" /> : <FilePlus2 data-icon="inline-start" className="size-3.5" />}
            {createLabel}
          </Button>
        </div>
      </div>

      <div className={cn("min-h-0 flex-1 overflow-auto", contentPaddingClassName(density))}>
        <div className="mx-auto max-w-[720px] space-y-5">
          <h1 className={cn("font-bold tracking-tight text-foreground", inlineTitleClassName(density))}>{title}</h1>
          <p className={cn("text-muted-foreground", inlineDescriptionClassName(density))}>{description}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <CreatorField label="File name" description="Stored directly in the pod file namespace.">
              <Input value={fileName} onChange={(event) => setFileName(event.target.value)} placeholder="customer-playbook.md" />
            </CreatorField>
            <CreatorField label="Folder path" description="The target folder inside pod files.">
              <Input value={directoryPath} onChange={(event) => setDirectoryPath(event.target.value)} placeholder="/manuals" />
            </CreatorField>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <CreatorField label="Document title">
              <Input value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} placeholder="Customer success playbook" />
            </CreatorField>
            <CreatorField label="Summary" description="Stored as the file description for quick scanning.">
              <Input value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Shared operating guide for onboarding, escalation, and handoffs." />
            </CreatorField>
          </div>

          <CreatorField label="Body">
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="# New document"
              className={cn("min-h-[26rem] resize-none text-base", radiusClassName(radius, "surface"))}
            />
          </CreatorField>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {templates.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Starting points</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplate(template)}
                    className="rounded-lg border border-border/40 bg-muted/20 p-3 text-left transition-colors hover:bg-muted/35"
                  >
                    <p className="text-sm font-medium text-foreground">{template.label}</p>
                    {template.description ? <p className="mt-1 text-sm text-muted-foreground">{template.description}</p> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (mode === "modal") {
    return (
      <Dialog open={open ?? true} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "!h-[92vh] !max-h-[92vh] !w-[calc(100vw-2rem)] !max-w-[76rem] gap-0 overflow-hidden p-0",
            overlayClassName(appearance, radius),
          )}
        >
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return <div className="mx-auto flex h-full w-full max-w-[1120px] flex-col">{content}</div>
}

function CreatorField({
  label,
  description,
  children,
}: {
  label: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}

function buildDocumentBody({
  title,
  summary,
  body,
}: {
  title: string
  summary: string
  body: string
}) {
  const trimmedBody = body.trim()
  if (trimmedBody.length > 0) return trimmedBody
  const lines: string[] = []
  if (title.trim()) lines.push(`# ${title.trim()}`, "")
  if (summary.trim()) lines.push(summary.trim(), "")
  if (lines.length === 0) lines.push("# Untitled document", "")
  lines.push("Start writing...")
  return lines.join("\n")
}

function normalizeDocumentFileName(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return /\.[a-z0-9]+$/i.test(trimmed) ? trimmed : `${trimmed}.md`
}

function normalizePath(path: string) {
  const trimmed = path.trim()
  if (!trimmed || trimmed === "/") return "/"
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`
}

function defaultTemplates(): LemmaDocumentTemplate[] {
  return [
    {
      id: "brief",
      label: "Working brief",
      description: "A lean decision document with context, goals, and open questions.",
      fileName: "working-brief.md",
      title: "Working brief",
      summary: "Shared context for a team decision or active project thread.",
      body: "# Working brief\n\n## Context\n\n## Goal\n\n## Constraints\n\n## Open questions\n",
    },
    {
      id: "playbook",
      label: "Ops playbook",
      description: "A repeatable operational guide with triggers, steps, and escalation notes.",
      fileName: "ops-playbook.md",
      title: "Operations playbook",
      summary: "Repeatable operating guide for the team.",
      body: "# Operations playbook\n\n## When to use this\n\n## Inputs\n\n## Steps\n\n## Escalation path\n\n## Done looks like\n",
    },
  ]
}

function shellClassName(
  appearance: LemmaDocumentCreatorAppearance,
  radius: LemmaDocumentCreatorRadius,
  mode: LemmaDocumentCreatorMode,
) {
  if (mode === "modal") {
    return "h-full border-0 bg-transparent shadow-none"
  }

  return cn(
    radiusClassName(radius, "surface"),
    appearance === "minimal" ? "border-0 bg-transparent shadow-none" : null,
    appearance === "borderless" ? "border-0 bg-transparent shadow-none" : null,
    appearance === "contained" ? "border border-border/70 bg-card shadow-sm" : null,
    appearance === "default" ? "border-0 bg-transparent shadow-none" : null,
  )
}

function headerPaddingClassName(density: LemmaDocumentCreatorDensity) {
  if (density === "compact") return "p-4"
  if (density === "spacious") return "p-8"
  return "p-6"
}

function contentPaddingClassName(density: LemmaDocumentCreatorDensity) {
  if (density === "compact") return "px-4 pt-6 pb-10 md:px-8"
  if (density === "spacious") return "px-6 pt-10 pb-16 md:px-16"
  return "px-5 pt-8 pb-12 md:px-12"
}

function cardPaddingClassName(density: LemmaDocumentCreatorDensity) {
  if (density === "compact") return "p-3"
  if (density === "spacious") return "p-5"
  return "p-4"
}

function inlineTitleClassName(density: LemmaDocumentCreatorDensity) {
  if (density === "compact") return "text-2xl"
  if (density === "spacious") return "text-4xl"
  return "text-3xl"
}

function inlineDescriptionClassName(density: LemmaDocumentCreatorDensity) {
  if (density === "compact") return "text-sm"
  if (density === "spacious") return "text-lg"
  return "text-base"
}

function overlayClassName(appearance: LemmaDocumentCreatorAppearance, radius: LemmaDocumentCreatorRadius) {
  return cn(
    radiusClassName(radius, "overlay"),
    appearance === "minimal" ? "border-0 bg-background shadow-none" : null,
    appearance === "borderless" ? "border-0 bg-background shadow-xl" : null,
    appearance === "contained" ? "border border-border/70 bg-card shadow-xl" : null,
    appearance === "default" ? "border border-border/50 bg-background shadow-xl" : null,
  )
}

function radiusClassName(radius: LemmaDocumentCreatorRadius, target: "surface" | "control" | "overlay") {
  if (radius === "none") return "rounded-none"
  if (radius === "sm") return target === "surface" || target === "overlay" ? "rounded-md" : "rounded-sm"
  if (radius === "md") return target === "surface" || target === "overlay" ? "rounded-lg" : "rounded-md"
  if (radius === "xl") return target === "surface" || target === "overlay" ? "rounded-2xl" : "rounded-xl"
  return target === "surface" || target === "overlay" ? "rounded-xl" : "rounded-lg"
}
