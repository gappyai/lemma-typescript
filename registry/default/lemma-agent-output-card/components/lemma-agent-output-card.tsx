"use client"

import * as React from "react"
import type { Task } from "lemma-sdk"
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DATA_PANEL_SECTION_CLASS_NAME,
  DATA_CODE_BLOCK_CLASS_NAME,
  DataWorkspaceHeader,
  DataWorkspaceState,
} from "@/components/lemma/registry-data-workspace"
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
    <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
      <div className={DATA_PANEL_HEADER_CLASS_NAME}>
        <DataWorkspaceHeader description={description} title={title} />
      </div>
      <div className={DATA_PANEL_CONTENT_CLASS_NAME}>
        <div className="flex flex-col gap-4">
          {task ? (
            <div className={cn(DATA_PANEL_SECTION_CLASS_NAME, "grid gap-2 p-4 text-sm")}>
              <div className="font-medium">Status: {task.status}</div>
              <div className="truncate text-sm text-muted-foreground">Task ID: {task.id}</div>
            </div>
          ) : null}
          {visibleOutput ? (
            <pre className={DATA_CODE_BLOCK_CLASS_NAME}>
              {formatJson(visibleOutput)}
            </pre>
          ) : (
            <DataWorkspaceState description={emptyText} />
          )}
        </div>
      </div>
    </div>
  )
})
LemmaAgentOutputCard.displayName = "LemmaAgentOutputCard"
