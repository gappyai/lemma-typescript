"use client"

import * as React from "react"
import type { FlowRun } from "lemma-sdk"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message}
          </div>
        ) : null}
        {isLoading ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground animate-pulse">
            Loading run details…
          </div>
        ) : !run ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
            Select a workflow run to inspect details.
          </div>
        ) : (
          <>
            <pre className="max-h-[320px] overflow-auto rounded-md border border-border bg-muted/40 p-4 text-sm leading-6">
              {formatJson(run.execution_context ?? {})}
            </pre>
            <pre className="max-h-[320px] overflow-auto rounded-md border border-border bg-muted/40 p-4 text-sm leading-6">
              {formatJson({
                execution_stack: run.execution_stack ?? [],
                step_history: run.step_history ?? [],
              })}
            </pre>
          </>
        )}
      </CardContent>
    </Card>
  )
})
LemmaWorkflowRunDetails.displayName = "LemmaWorkflowRunDetails"
