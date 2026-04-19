"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  BookOpen,
  Bot,
  FileText,
  Hash,
  Loader2,
  PencilLine,
  Save,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export type LemmaDocumentEditorAppearance = "default" | "minimal" | "borderless" | "contained"
export type LemmaDocumentEditorDensity = "compact" | "comfortable" | "spacious"
export type LemmaDocumentEditorRadius = "none" | "sm" | "md" | "lg" | "xl"
export type LemmaDocumentEditorMode = "write" | "preview" | "split"
export type LemmaDocumentSaveState = "saved" | "saving" | "dirty"
export type LemmaDocumentSurfaceMode = "page" | "modal"

export interface LemmaDocumentEditorMetadataItem {
  label: React.ReactNode
  value: React.ReactNode
}

export interface LemmaDocumentEditorSidebarItem {
  id: string
  title: React.ReactNode
  description?: React.ReactNode
  meta?: React.ReactNode
  href?: string
  onSelect?: () => void
}

export interface LemmaDocumentEditorContextItem {
  label: React.ReactNode
  value?: React.ReactNode
}

export interface LemmaDocumentEditorProps {
  titleValue?: string
  defaultTitle?: string
  onTitleChange?: (value: string) => void
  summaryValue?: string
  defaultSummary?: string
  onSummaryChange?: (value: string) => void
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  surfaceMode?: LemmaDocumentSurfaceMode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  mode?: LemmaDocumentEditorMode
  onModeChange?: (mode: LemmaDocumentEditorMode) => void
  saveState?: LemmaDocumentSaveState
  onSave?: () => void
  saveDisabled?: boolean
  icon?: React.ReactNode
  status?: React.ReactNode
  lastEditedLabel?: React.ReactNode
  coverImageUrl?: string
  coverAlt?: string
  metadata?: LemmaDocumentEditorMetadataItem[]
  backlinks?: LemmaDocumentEditorSidebarItem[]
  references?: LemmaDocumentEditorSidebarItem[]
  assistantContext?: LemmaDocumentEditorContextItem[]
  headerActions?: React.ReactNode
  className?: string
  appearance?: LemmaDocumentEditorAppearance
  density?: LemmaDocumentEditorDensity
  radius?: LemmaDocumentEditorRadius
}

export function LemmaDocumentEditor({
  titleValue,
  defaultTitle = "",
  onTitleChange,
  summaryValue,
  defaultSummary = "",
  onSummaryChange,
  value,
  defaultValue = "",
  onChange,
  placeholder = "Start writing...",
  surfaceMode = "page",
  open,
  onOpenChange,
  mode,
  onModeChange,
  saveState = "saved",
  onSave,
  saveDisabled = false,
  icon,
  status,
  lastEditedLabel,
  coverImageUrl,
  coverAlt,
  metadata = [],
  backlinks = [],
  references = [],
  assistantContext = [],
  headerActions,
  className,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
}: LemmaDocumentEditorProps) {
  const [uncontrolledTitle, setUncontrolledTitle] = React.useState(defaultTitle)
  const [uncontrolledSummary, setUncontrolledSummary] = React.useState(defaultSummary)
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const [uncontrolledMode, setUncontrolledMode] = React.useState<LemmaDocumentEditorMode>("split")

  const resolvedTitle = titleValue ?? uncontrolledTitle
  const resolvedSummary = summaryValue ?? uncontrolledSummary
  const resolvedBody = value ?? uncontrolledValue
  const resolvedMode = mode ?? uncontrolledMode

  const setTitle = React.useCallback((nextValue: string) => {
    if (titleValue == null) setUncontrolledTitle(nextValue)
    onTitleChange?.(nextValue)
  }, [onTitleChange, titleValue])

  const setSummary = React.useCallback((nextValue: string) => {
    if (summaryValue == null) setUncontrolledSummary(nextValue)
    onSummaryChange?.(nextValue)
  }, [onSummaryChange, summaryValue])

  const setBody = React.useCallback((nextValue: string) => {
    if (value == null) setUncontrolledValue(nextValue)
    onChange?.(nextValue)
  }, [onChange, value])

  const setEditorMode = React.useCallback((nextMode: LemmaDocumentEditorMode) => {
    if (mode == null) setUncontrolledMode(nextMode)
    onModeChange?.(nextMode)
  }, [mode, onModeChange])

  const outline = React.useMemo(() => extractMarkdownHeadings(resolvedBody), [resolvedBody])
  const wordCount = React.useMemo(() => countWords(resolvedBody), [resolvedBody])
  const hasSidebar = metadata.length > 0 || backlinks.length > 0 || references.length > 0 || assistantContext.length > 0 || outline.length > 0

  const content = (
    <div
      data-appearance={appearance}
      data-density={density}
      data-mode={surfaceMode}
      data-radius={radius}
      className={cn("lemma-document-editor flex min-h-0 flex-col overflow-hidden", shellClassName(appearance, radius, surfaceMode), className)}
    >
      {coverImageUrl ? (
        <DocumentCover
          coverImageUrl={coverImageUrl}
          coverAlt={typeof coverAlt === "string" ? coverAlt : resolvedTitle || "Document cover"}
          radius={radius}
        />
      ) : null}

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 px-4 py-1.5">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className={cn(saveState === "dirty" ? "font-medium text-foreground" : null)}>{saveStateLabel(saveState)}</span>
          <span>·</span>
          <span>{wordCount} words</span>
          {lastEditedLabel ? (
            <>
              <span>·</span>
              <span>{lastEditedLabel}</span>
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {headerActions}
          {onSave ? (
            <Button size="sm" className="h-7 gap-1.5 px-3 text-xs" onClick={onSave} disabled={saveDisabled || saveState === "saving"}>
              {saveState === "saving" ? <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" /> : <Save data-icon="inline-start" className="size-3.5" />}
              Save
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className={cn("mx-auto w-full max-w-[860px]", contentPaddingClassName(density))}>
          <input
            value={resolvedTitle}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Untitled"
            className={cn("w-full border-0 bg-transparent font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50", inlineTitleClassName(density))}
          />

          <input
            value={resolvedSummary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Add a summary..."
            className={cn("mt-1 w-full border-0 bg-transparent text-muted-foreground outline-none placeholder:text-muted-foreground/40", inlineSummaryClassName(density))}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs value={resolvedMode} onValueChange={(next) => setEditorMode(next as LemmaDocumentEditorMode)}>
              <TabsList className={cn("h-7", radiusClassName(radius, "control"))}>
                <TabsTrigger value="write" className="gap-1.5 px-2.5 text-xs">Write</TabsTrigger>
                <TabsTrigger value="preview" className="gap-1.5 px-2.5 text-xs">Preview</TabsTrigger>
                <TabsTrigger value="split" className="gap-1.5 px-2.5 text-xs">Split</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className={cn("mt-4 grid min-h-0", resolvedMode === "split" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1", hasSidebar ? "" : "")}>
            {resolvedMode !== "preview" ? (
              <div className={cn("min-h-[34rem]", resolvedMode === "split" ? "border-b border-border/20 xl:border-b-0 xl:border-r" : null)}>
                <Textarea
                  value={resolvedBody}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={placeholder}
                  className={cn("h-full min-h-[34rem] resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0", bodyPaddingClassName(density))}
                />
              </div>
            ) : null}

            {resolvedMode !== "write" ? (
              <div className={cn("min-h-[34rem] overflow-auto", bodyPaddingClassName(density))}>
                {resolvedBody.trim().length > 0 ? (
                  <div className={cn("prose prose-neutral max-w-none dark:prose-invert", proseClassName(density))}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
                      {resolvedBody}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <DocumentEmptyBody radius={radius} density={density} />
                )}
              </div>
            ) : null}
          </div>
        </div>

        {hasSidebar ? (
          <aside className={cn("mt-8 border-t border-border/30", contentPaddingClassName(density))}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DocumentSectionCard
                title="Document"
                icon={<FileText className="size-4" />}
                radius={radius}
                density={density}
              >
                <SidebarMetaRow label="Save state" value={saveStateLabel(saveState)} />
                <SidebarMetaRow label="Words" value={String(wordCount)} />
                {metadata.map((item, index) => (
                  <SidebarMetaRow key={index} label={item.label} value={item.value} />
                ))}
              </DocumentSectionCard>

              {outline.length > 0 ? (
                <DocumentSectionCard
                  title="Outline"
                  icon={<Hash className="size-4" />}
                  radius={radius}
                  density={density}
                >
                  <div className="space-y-1">
                    {outline.map((item) => (
                      <div key={item.id} className={cn("truncate text-sm text-foreground/85", item.depth === 1 ? "" : item.depth === 2 ? "pl-3" : "pl-6")}>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </DocumentSectionCard>
              ) : null}

              {backlinks.length > 0 ? (
                <DocumentSectionCard
                  title="Backlinks"
                  icon={<BookOpen className="size-4" />}
                  radius={radius}
                  density={density}
                >
                  <SidebarItemList items={backlinks} />
                </DocumentSectionCard>
              ) : null}

              {references.length > 0 ? (
                <DocumentSectionCard
                  title="References"
                  icon={<FileText className="size-4" />}
                  radius={radius}
                  density={density}
                >
                  <SidebarItemList items={references} />
                </DocumentSectionCard>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )

  if (surfaceMode === "modal") {
    return (
      <Dialog open={open ?? true} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "!h-[92vh] !max-h-[92vh] !w-[calc(100vw-2rem)] !max-w-[82rem] gap-0 overflow-hidden p-0",
            overlayClassName(appearance, radius),
          )}
        >
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return <div className="mx-auto flex h-full w-full max-w-[1220px] flex-col">{content}</div>
}

function DocumentCover({
  coverImageUrl,
  coverAlt,
  radius,
}: {
  coverImageUrl?: string
  coverAlt: string
  radius: LemmaDocumentEditorRadius
}) {
  if (!coverImageUrl) return null
  return (
    <div className={cn("relative h-40 overflow-hidden border-b border-border/40", radiusClassName(radius, "surface"))}>
      <img src={coverImageUrl} alt={coverAlt} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-transparent" />
    </div>
  )
}

function DocumentSectionCard({
  title,
  icon,
  children,
  radius,
  density,
}: {
  title: React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
  radius: LemmaDocumentEditorRadius
  density: LemmaDocumentEditorDensity
}) {
  return (
    <section className={cn("border border-border/40 bg-card/70", radiusClassName(radius, "surface"), cardPaddingClassName(density))}>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="text-muted-foreground">{icon ?? <Sparkles className="size-4" />}</span>
        <span>{title}</span>
      </div>
      {children}
    </section>
  )
}

function SidebarMetaRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  )
}

function SidebarItemList({ items }: { items: LemmaDocumentEditorSidebarItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const content = (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
            {item.description ? <p className="mt-1 text-sm text-muted-foreground">{item.description}</p> : null}
            {item.meta ? <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p> : null}
          </div>
        )

        if (item.onSelect) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onSelect}
              className="w-full rounded-lg border border-border/40 bg-muted/20 p-3 text-left transition-colors hover:bg-muted/35"
            >
              {content}
            </button>
          )
        }

        if (item.href) {
          return (
            <a
              key={item.id}
              href={item.href}
              className="block rounded-lg border border-border/40 bg-muted/20 p-3 transition-colors hover:bg-muted/35"
            >
              {content}
            </a>
          )
        }

        return (
          <div key={item.id} className="rounded-lg border border-border/40 bg-muted/20 p-3">
            {content}
          </div>
        )
      })}
    </div>
  )
}

function DocumentEmptyBody({
  radius,
  density,
}: {
  radius: LemmaDocumentEditorRadius
  density: LemmaDocumentEditorDensity
}) {
  return (
    <div className={cn("flex min-h-64 flex-col items-center justify-center gap-3 border border-dashed border-border/50 bg-muted/20 text-center text-muted-foreground", radiusClassName(radius, "surface"), density === "compact" ? "p-6" : density === "spacious" ? "p-12" : "p-8")}>
      <PencilLine className="size-5" />
      <div>
        <p className="font-medium text-foreground">Nothing to preview yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Write in the editor or switch back to split mode to keep shaping the page.</p>
      </div>
    </div>
  )
}

function extractMarkdownHeadings(body: string) {
  return body
    .split("\n")
    .map((line, index) => {
      const match = /^(#{1,6})\s+(.+)$/.exec(line.trim())
      if (!match) return null
      return {
        id: `heading-${index}`,
        depth: match[1].length,
        label: match[2].trim(),
      }
    })
    .filter((item): item is { id: string; depth: number; label: string } => Boolean(item))
}

function countWords(body: string) {
  const stripped = body.replace(/[#>*`[\]\-]/g, " ").trim()
  if (!stripped) return 0
  return stripped.split(/\s+/).filter(Boolean).length
}

function saveStateLabel(state: LemmaDocumentSaveState) {
  if (state === "saving") return "Saving"
  if (state === "dirty") return "Unsaved"
  return "Saved"
}

function shellClassName(
  appearance: LemmaDocumentEditorAppearance,
  radius: LemmaDocumentEditorRadius,
  mode: LemmaDocumentSurfaceMode,
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

function documentPaddingClassName(density: LemmaDocumentEditorDensity) {
  if (density === "compact") return "p-4"
  if (density === "spacious") return "p-8"
  return "p-6"
}

function contentPaddingClassName(density: LemmaDocumentEditorDensity) {
  if (density === "compact") return "px-4 pt-6 pb-10 md:px-8"
  if (density === "spacious") return "px-6 pt-10 pb-16 md:px-16"
  return "px-5 pt-8 pb-12 md:px-12"
}

function headerPaddingClassName(density: LemmaDocumentEditorDensity) {
  if (density === "compact") return "px-4 py-3"
  if (density === "spacious") return "px-6 py-4"
  return "px-5 py-3"
}

function bodyPaddingClassName(density: LemmaDocumentEditorDensity) {
  if (density === "compact") return "p-3"
  if (density === "spacious") return "p-5"
  return "p-4"
}

function cardPaddingClassName(density: LemmaDocumentEditorDensity) {
  if (density === "compact") return "p-3"
  if (density === "spacious") return "p-5"
  return "p-4"
}

function inlineTitleClassName(density: LemmaDocumentEditorDensity) {
  if (density === "compact") return "text-2xl"
  if (density === "spacious") return "text-4xl"
  return "text-3xl"
}

function inlineSummaryClassName(density: LemmaDocumentEditorDensity) {
  if (density === "compact") return "text-sm"
  if (density === "spacious") return "text-base"
  return "text-[15px]"
}

function proseClassName(density: LemmaDocumentEditorDensity) {
  if (density === "compact") return "prose-sm"
  if (density === "spacious") return "prose-lg"
  return "prose-base"
}

function overlayClassName(appearance: LemmaDocumentEditorAppearance, radius: LemmaDocumentEditorRadius) {
  return cn(
    radiusClassName(radius, "overlay"),
    appearance === "minimal" ? "border-0 bg-background shadow-none" : null,
    appearance === "borderless" ? "border-0 bg-background shadow-xl" : null,
    appearance === "contained" ? "border border-border/70 bg-card shadow-xl" : null,
    appearance === "default" ? "border border-border/50 bg-background shadow-xl" : null,
  )
}

function radiusClassName(radius: LemmaDocumentEditorRadius, target: "surface" | "control" | "overlay") {
  if (radius === "none") return "rounded-none"
  if (radius === "sm") return target === "surface" || target === "overlay" ? "rounded-md" : "rounded-sm"
  if (radius === "md") return target === "surface" || target === "overlay" ? "rounded-lg" : "rounded-md"
  if (radius === "xl") return target === "surface" || target === "overlay" ? "rounded-2xl" : "rounded-xl"
  return target === "surface" || target === "overlay" ? "rounded-xl" : "rounded-lg"
}
