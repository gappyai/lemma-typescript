"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  BookOpen,
  FileText,
  Hash,
  Link2,
  Sparkles,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type LemmaDocumentViewerAppearance = "default" | "minimal" | "borderless" | "contained"
export type LemmaDocumentViewerDensity = "compact" | "comfortable" | "spacious"
export type LemmaDocumentViewerRadius = "none" | "sm" | "md" | "lg" | "xl"
export type LemmaDocumentViewerMode = "page" | "modal"

export interface LemmaDocumentMetadataItem {
  label: React.ReactNode
  value: React.ReactNode
}

export interface LemmaDocumentSidebarItem {
  id: string
  title: React.ReactNode
  description?: React.ReactNode
  meta?: React.ReactNode
  href?: string
  onSelect?: () => void
}

export interface LemmaDocumentContextItem {
  label: React.ReactNode
  value?: React.ReactNode
}

export interface LemmaDocumentViewerProps {
  title?: React.ReactNode
  description?: React.ReactNode
  body?: string
  mode?: LemmaDocumentViewerMode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  icon?: React.ReactNode
  status?: React.ReactNode
  lastEditedLabel?: React.ReactNode
  coverImageUrl?: string
  coverAlt?: string
  metadata?: LemmaDocumentMetadataItem[]
  backlinks?: LemmaDocumentSidebarItem[]
  references?: LemmaDocumentSidebarItem[]
  assistantContext?: LemmaDocumentContextItem[]
  headerActions?: React.ReactNode
  className?: string
  appearance?: LemmaDocumentViewerAppearance
  density?: LemmaDocumentViewerDensity
  radius?: LemmaDocumentViewerRadius
}

export function LemmaDocumentViewer({
  title = "Untitled document",
  description,
  body = "",
  mode = "page",
  open,
  onOpenChange,
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
}: LemmaDocumentViewerProps) {
  const outline = React.useMemo(() => extractMarkdownHeadings(body), [body])
  const wordCount = React.useMemo(() => countWords(body), [body])
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220))
  const hasSidebar = metadata.length > 0 || backlinks.length > 0 || references.length > 0 || assistantContext.length > 0 || outline.length > 0

  const content = (
    <div
      data-appearance={appearance}
      data-density={density}
      data-mode={mode}
      data-radius={radius}
      className={cn("lemma-document-viewer flex min-h-0 flex-col overflow-hidden", shellClassName(appearance, radius, mode), className)}
    >
      {coverImageUrl ? (
        <DocumentCover
          coverImageUrl={coverImageUrl}
          coverAlt={typeof coverAlt === "string" ? coverAlt : typeof title === "string" ? title : "Document cover"}
          radius={radius}
        />
      ) : null}

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 px-4 py-1.5">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span>{wordCount} words</span>
          <span>·</span>
          <span>{readingMinutes} min read</span>
          {lastEditedLabel ? (
            <>
              <span>·</span>
              <span>{lastEditedLabel}</span>
            </>
          ) : null}
        </div>
        {headerActions ? <div className="flex shrink-0 items-center gap-1.5">{headerActions}</div> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className={cn("mx-auto w-full max-w-[860px]", contentPaddingClassName(density))}>
          <h1 className={cn("font-bold tracking-tight text-foreground", inlineTitleClassName(density))}>{title}</h1>
          {description ? (
            <p className={cn("mt-1 text-muted-foreground", inlineDescriptionClassName(density))}>{description}</p>
          ) : null}

          {body.trim().length > 0 ? (
            <article className="mt-6">
              <div className={cn("prose prose-neutral max-w-none dark:prose-invert", proseClassName(density))}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
                  {body}
                </ReactMarkdown>
              </div>
            </article>
          ) : (
            <DocumentEmptyBody radius={radius} density={density} />
          )}
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
                <SidebarMetaRow label="Words" value={String(wordCount)} />
                <SidebarMetaRow label="Read time" value={`${readingMinutes} min`} />
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
                  icon={<Link2 className="size-4" />}
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

  if (mode === "modal") {
    return (
      <Dialog open={open ?? true} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "!h-[92vh] !max-h-[92vh] !w-[calc(100vw-2rem)] !max-w-[78rem] gap-0 overflow-hidden p-0",
            overlayClassName(appearance, radius),
          )}
        >
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return <div className="mx-auto flex h-full w-full max-w-[1180px] flex-col">{content}</div>
}

function DocumentCover({
  coverImageUrl,
  coverAlt,
  radius,
}: {
  coverImageUrl?: string
  coverAlt: string
  radius: LemmaDocumentViewerRadius
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
  radius: LemmaDocumentViewerRadius
  density: LemmaDocumentViewerDensity
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

function SidebarItemList({ items }: { items: LemmaDocumentSidebarItem[] }) {
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
  radius: LemmaDocumentViewerRadius
  density: LemmaDocumentViewerDensity
}) {
  return (
    <div className={cn("flex min-h-80 flex-col items-center justify-center gap-3 border border-dashed border-border/50 bg-muted/20 text-center text-muted-foreground", radiusClassName(radius, "surface"), density === "compact" ? "p-6" : density === "spacious" ? "p-12" : "p-8")}>
      <BookOpen className="size-5" />
      <div>
        <p className="font-medium text-foreground">No document body yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Add content to turn this page into a real working document.</p>
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

function shellClassName(
  appearance: LemmaDocumentViewerAppearance,
  radius: LemmaDocumentViewerRadius,
  mode: LemmaDocumentViewerMode,
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

function documentPaddingClassName(density: LemmaDocumentViewerDensity) {
  if (density === "compact") return "p-4"
  if (density === "spacious") return "p-8"
  return "p-6"
}

function contentPaddingClassName(density: LemmaDocumentViewerDensity) {
  if (density === "compact") return "px-4 pt-6 pb-10 md:px-8"
  if (density === "spacious") return "px-6 pt-10 pb-16 md:px-16"
  return "px-5 pt-8 pb-12 md:px-12"
}

function bodyPaddingClassName(density: LemmaDocumentViewerDensity) {
  if (density === "compact") return "p-3"
  if (density === "spacious") return "p-5"
  return "p-4"
}

function cardPaddingClassName(density: LemmaDocumentViewerDensity) {
  if (density === "compact") return "p-3"
  if (density === "spacious") return "p-5"
  return "p-4"
}

function inlineTitleClassName(density: LemmaDocumentViewerDensity) {
  if (density === "compact") return "text-2xl"
  if (density === "spacious") return "text-4xl"
  return "text-3xl"
}

function inlineDescriptionClassName(density: LemmaDocumentViewerDensity) {
  if (density === "compact") return "text-sm"
  if (density === "spacious") return "text-lg"
  return "text-base"
}

function proseClassName(density: LemmaDocumentViewerDensity) {
  if (density === "compact") return "prose-sm"
  if (density === "spacious") return "prose-lg"
  return "prose-base"
}

function overlayClassName(appearance: LemmaDocumentViewerAppearance, radius: LemmaDocumentViewerRadius) {
  return cn(
    radiusClassName(radius, "overlay"),
    appearance === "minimal" ? "border-0 bg-background shadow-none" : null,
    appearance === "borderless" ? "border-0 bg-background shadow-xl" : null,
    appearance === "contained" ? "border border-border/70 bg-card shadow-xl" : null,
    appearance === "default" ? "border border-border/50 bg-background shadow-xl" : null,
  )
}

function radiusClassName(radius: LemmaDocumentViewerRadius, target: "surface" | "control" | "overlay") {
  if (radius === "none") return "rounded-none"
  if (radius === "sm") return target === "surface" || target === "overlay" ? "rounded-md" : "rounded-sm"
  if (radius === "md") return target === "surface" || target === "overlay" ? "rounded-lg" : "rounded-md"
  if (radius === "xl") return target === "surface" || target === "overlay" ? "rounded-2xl" : "rounded-xl"
  return target === "surface" || target === "overlay" ? "rounded-xl" : "rounded-lg"
}
