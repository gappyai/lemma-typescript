"use client"

import type { Task } from "lemma-sdk"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface LemmaAgentOutputCardProps {
  task?: Task | null
  output?: unknown
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

export function LemmaAgentOutputCard({
  task,
  output,
  finalOnly = false,
  title = "Agent Output",
  description = "Inspect the latest structured output from the selected task.",
  emptyText = "Run an agent to inspect output here.",
}: LemmaAgentOutputCardProps) {
  const isFinal = task?.status === "COMPLETED" || task?.status === "FAILED" || task?.status === "CANCELLED" || task?.status === "STOPPED"
  const resolvedOutput = typeof output === "undefined" ? task?.output_data : output
  const visibleOutput = finalOnly && !isFinal ? null : resolvedOutput

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {task ? (
          <div className="grid gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
            <div className="font-medium">Status: {task.status}</div>
            <div className="truncate text-muted-foreground">Task ID: {task.id}</div>
          </div>
        ) : null}
        {visibleOutput ? (
          <pre className="max-h-[420px] overflow-auto rounded-md border border-border bg-muted/40 p-3 text-sm leading-6">
            {formatJson(visibleOutput)}
          </pre>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-6 text-sm text-muted-foreground">
            {emptyText}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
