"use client"

import * as React from "react"
import type { FlowRun } from "lemma-sdk"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DataWorkspaceHeader,
  DataWorkspaceState,
} from "@/components/lemma/registry-data-workspace"
import { cn } from "@/lib/utils"

export interface LemmaWorkflowRunDetailsProps extends React.HTMLAttributes<HTMLDivElement> {
  run?: FlowRun | null
  isLoading?: boolean
  error?: Error | null
  title?: string
  description?: string
}

function formatJson(value: unknown): string {
  if (value === null || typeof value === "undefined") return ""
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export const LemmaWorkflowRunDetails = React.forwardRef<HTMLDivElement, LemmaWorkflowRunDetailsProps>(
  ({
    run,
    isLoading,
    error,
    title = "Workflow Run Details",
    description = "Inspect execution context, stack, and step history.",
    className,
    ...props
  }, ref) => {
  return (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props}>
      <CardHeader className="p-6">
        <DataWorkspaceHeader description={description} title={title} />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="grid gap-4">
          {error ? (
            <DataWorkspaceState description={error.message} heading="Failed to load details" tone="danger" />
          ) : null}
          {isLoading ? (
            <DataWorkspaceState description="Loading run details\u2026" />
          ) : !run ? (
            <DataWorkspaceState description="Select a workflow run to inspect details." />
          ) : (
            <>
              <pre className="rounded-lg border bg-muted/50 p-4 overflow-x-auto whitespace-pre-wrap text-sm">
                {formatJson(run.execution_context ?? {})}
              </pre>
              <pre className="rounded-lg border bg-muted/50 p-4 overflow-x-auto whitespace-pre-wrap text-sm">
                {formatJson({
                  execution_stack: run.execution_stack ?? [],
                  step_history: run.step_history ?? [],
                })}
              </pre>
            </>
          )}
        </div>
      </CardContent>
    </div>
  )
})
LemmaWorkflowRunDetails.displayName = "LemmaWorkflowRunDetails"
