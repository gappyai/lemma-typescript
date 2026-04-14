"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export const DATA_PANEL_CARD_CLASS_NAME = "overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/95 shadow-[0_1px_0_rgba(255,255,255,0.65),0_18px_48px_-32px_rgba(15,23,42,0.28)]"
export const DATA_PANEL_HEADER_CLASS_NAME = "border-b border-border/60 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_84%,var(--muted))_0%,color-mix(in_srgb,var(--background)_96%,transparent)_100%)] px-5 py-4 md:px-6"
export const DATA_PANEL_CONTENT_CLASS_NAME = "px-5 py-5 md:px-6 md:py-6"
export const DATA_PANEL_SECTION_CLASS_NAME = "rounded-[1.1rem] border border-border/60 bg-muted/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
export const DATA_TOOLBAR_CARD_CLASS_NAME = "rounded-[1.25rem] border border-border/70 bg-card/90 px-4 py-4 shadow-[0_1px_0_rgba(255,255,255,0.55),0_16px_38px_-34px_rgba(15,23,42,0.35)]"
export const DATA_TABLE_FRAME_CLASS_NAME = "overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/95 shadow-[0_1px_0_rgba(255,255,255,0.52),0_20px_45px_-40px_rgba(15,23,42,0.4)]"
export const DATA_FLOATING_BAR_CLASS_NAME = "rounded-full border border-border/70 bg-background/85 px-5 py-2.5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)] backdrop-blur-md supports-[backdrop-filter]:bg-background/78"
export const DATA_INPUT_CLASS_NAME = "rounded-xl border border-border/70 bg-background/90 shadow-[0_1px_0_rgba(255,255,255,0.45)] transition-colors hover:border-border focus-visible:border-ring"
export const DATA_SUBTLE_ACTION_CLASS_NAME = "rounded-xl border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
export const DATA_DIVIDER_CLASS_NAME = "bg-border/60"
export const DATA_RUNNER_CARD_CLASS_NAME = "overflow-hidden rounded-[1.25rem] border border-border/70 bg-card/95 shadow-[0_1px_0_rgba(255,255,255,0.55),0_14px_36px_-32px_rgba(15,23,42,0.22)]"
export const DATA_LIST_ITEM_CLASS_NAME = "rounded-[1rem] border border-border/60 bg-muted/[0.16] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-colors hover:bg-muted/[0.26]"
export const DATA_STATUS_BOX_CLASS_NAME = "rounded-[1rem] border border-border/60 bg-muted/[0.16] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
export const DATA_CODE_BLOCK_CLASS_NAME = "max-h-[360px] overflow-auto rounded-[1rem] border border-border/60 bg-muted/[0.16] p-4 text-sm leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
export const DATA_FIELD_LABEL_CLASS_NAME = "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
export const DATA_TYPE_BADGE_CLASS_NAME = "rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]"

type DataStateTone = "neutral" | "danger" | "success"

export function dataWorkspaceStateClassName(tone: DataStateTone = "neutral"): string {
  if (tone === "danger") {
    return "rounded-[1rem] border border-destructive/25 bg-destructive/10 px-4 py-4 text-sm text-destructive shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
  }

  if (tone === "success") {
    return "rounded-[1rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] dark:text-emerald-300"
  }

  return "rounded-[1rem] border border-dashed border-border/70 bg-muted/[0.2] px-4 py-6 text-sm text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
}

export function dataWorkspaceTypeBadgeClassName(type?: string): string {
  const normalizedType = (type ?? "text").toLowerCase()

  if (normalizedType === "enum" || normalizedType === "select") {
    return "border-amber-300/60 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  }

  if (normalizedType === "uuid" || normalizedType === "foreign-key" || normalizedType === "link") {
    return "border-sky-300/60 bg-sky-500/10 text-sky-700 dark:text-sky-300"
  }

  if (normalizedType === "datetime" || normalizedType === "date") {
    return "border-violet-300/60 bg-violet-500/10 text-violet-700 dark:text-violet-300"
  }

  if (normalizedType === "boolean") {
    return "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  }

  if (normalizedType === "json") {
    return "border-rose-300/60 bg-rose-500/10 text-rose-700 dark:text-rose-300"
  }

  return "border-border/70 bg-muted/45 text-muted-foreground"
}

export function dataWorkspaceMetaBadgeClassName(tone: "default" | "primary" | "success" | "danger" = "default"): string {
  if (tone === "primary") {
    return "border-border/70 bg-foreground/[0.06] text-foreground"
  }

  if (tone === "success") {
    return "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  }

  if (tone === "danger") {
    return "border-destructive/25 bg-destructive/10 text-destructive"
  }

  return "border-border/70 bg-background/70 text-muted-foreground"
}

export function dataWorkspaceRelationBadgeClassName(source?: string): string {
  if (source === "base") {
    return "border-border/70 bg-background/80 text-foreground"
  }

  return "border-border/70 bg-muted/50 text-muted-foreground"
}

export function dataWorkspaceRowClassName(options?: {
  interactive?: boolean
  selected?: boolean
}): string {
  return cn(
    "group border-border/50 transition-colors duration-150",
    options?.interactive && "cursor-pointer hover:bg-muted/[0.26]",
    options?.selected && "bg-foreground/[0.05] hover:bg-foreground/[0.07]",
  )
}

export interface DataWorkspaceHeaderProps {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function DataWorkspaceHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: DataWorkspaceHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between", className)}>
      <div className="min-w-0 space-y-3">
        <div className="space-y-1.5">
          {eyebrow ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/90">
              {eyebrow}
            </div>
          ) : null}
          <div className="text-lg font-semibold leading-tight tracking-[-0.01em] text-foreground md:text-xl">
            {title}
          </div>
          {description ? (
            <div className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
        {meta ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {meta}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export interface DataWorkspaceStateProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: DataStateTone
  heading?: React.ReactNode
  description: React.ReactNode
}

export function DataWorkspaceState({
  tone = "neutral",
  heading,
  description,
  className,
  ...props
}: DataWorkspaceStateProps) {
  return (
    <div className={cn(dataWorkspaceStateClassName(tone), className)} {...props}>
      <div className="grid gap-1.5">
        {heading ? (
          <div className="text-sm font-medium text-foreground">
            {heading}
          </div>
        ) : null}
        <div className={cn("leading-6", tone === "neutral" ? "text-muted-foreground" : undefined)}>
          {description}
        </div>
      </div>
    </div>
  )
}
