"use client"

import * as React from "react"
import type { FlowRun } from "lemma-sdk"
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DATA_CODE_BLOCK_CLASS_NAME,
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
    <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
      <div className={DATA_PANEL_HEADER_CLASS_NAME}>
        <DataWorkspaceHeader description={description} title={title} />
      </div>
      <div className={DATA_PANEL_CONTENT_CLASS_NAME}>
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
              <pre className={DATA_CODE_BLOCK_CLASS_NAME}>
                {formatJson(run.execution_context ?? {})}
              </pre>
              <pre className={DATA_CODE_BLOCK_CLASS_NAME}>
                {formatJson({
                  execution_stack: run.execution_stack ?? [],
                  step_history: run.step_history ?? [],
                })}
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  )
})
LemmaWorkflowRunDetails.displayName = "LemmaWorkflowRunDetails"
