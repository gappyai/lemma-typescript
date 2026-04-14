"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

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
    "group border-b transition-colors",
    options?.interactive && "cursor-pointer hover:bg-muted/50",
    options?.selected && "bg-muted hover:bg-muted/70",
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
    <div className={cn("flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        <div className="space-y-1">
          {eyebrow ? (
            <p className="text-xs font-medium text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </h3>
          {description ? (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {meta ? (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pt-1">
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

type DataStateTone = "neutral" | "danger" | "success"

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
    <div
      className={cn(
        "rounded-lg border p-4 text-sm",
        tone === "danger" && "border-destructive/50 bg-destructive/10 text-destructive",
        tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        tone === "neutral" && "border-dashed text-muted-foreground",
        className,
      )}
      {...props}
    >
      <div className="grid gap-1">
        {heading ? (
          <p className="font-medium text-foreground">{heading}</p>
        ) : null}
        <div className={tone === "neutral" ? "text-muted-foreground" : undefined}>
          {description}
        </div>
      </div>
    </div>
  )
}
