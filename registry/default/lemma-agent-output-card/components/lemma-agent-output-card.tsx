"use client"

import * as React from "react"
import type { Task } from "lemma-sdk"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface LemmaAgentOutputCardProps extends React.HTMLAttributes<HTMLDivElement> {
  task?: Task | null
  output?: Record<string, unknown> | unknown[] | string | null
  finalOnly?: boolean
  title?: string
  description?: string
  emptyText?: string
}

function formatJson(value: unknown): string {
  if (value === null || typeof value === "undefined") return ""
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export const LemmaAgentOutputCard = React.forwardRef<HTMLDivElement, LemmaAgentOutputCardProps>(
  ({
    task,
    output,
    finalOnly = false,
    title = "Agent Output",
    description = "Inspect the latest structured output from the selected task.",
    emptyText = "Run an agent to inspect output here.",
    className,
    ...props
  }, ref) => {
  const isFinal = task?.status === "COMPLETED" || task?.status === "FAILED" || task?.status === "CANCELLED" || task?.status === "STOPPED"
  const resolvedOutput = typeof output === "undefined" ? task?.output_data : output
  const visibleOutput = finalOnly && !isFinal ? null : resolvedOutput

  return (
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {task ? (
          <div className="grid gap-2 rounded-md border border-border bg-muted/40 p-4 text-sm">
            <div className="font-medium">Status: {task.status}</div>
            <div className="truncate text-sm text-muted-foreground">Task ID: {task.id}</div>
          </div>
        ) : null}
        {visibleOutput ? (
          <pre className="max-h-[420px] overflow-auto rounded-md border border-border bg-muted/40 p-4 text-sm leading-6">
            {formatJson(visibleOutput)}
          </pre>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
            {emptyText}
          </div>
        )}
      </CardContent>
    </Card>
  )
})
LemmaAgentOutputCard.displayName = "LemmaAgentOutputCard"
