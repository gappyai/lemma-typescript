"use client"

import * as React from "react"
import type { FlowRun } from "lemma-sdk"
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DATA_PANEL_SECTION_CLASS_NAME,
  DataWorkspaceHeader,
  DataWorkspaceState,
} from "@/components/lemma/registry-data-workspace"
import { cn } from "@/lib/utils"

export interface LemmaWorkflowRunStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  run?: FlowRun | null
  isLoading?: boolean
  error?: Error | null
  title?: string
  description?: string
}

export const LemmaWorkflowRunStatus = React.forwardRef<HTMLDivElement, LemmaWorkflowRunStatusProps>(
  ({
    run,
    isLoading,
    error,
    title = "Workflow Run Status",
    description = "Current state for the selected workflow run.",
    className,
    ...props
  }, ref) => {
  const waitingOn = run?.waiting_task_id
    ? `Task ${run.waiting_task_id}`
    : run?.waiting_function_run_id
      ? `Function run ${run.waiting_function_run_id}`
      : run?.waiting_trigger_id
        ? `Trigger ${run.waiting_trigger_id}`
        : null

  return (
    <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
      <div className={DATA_PANEL_HEADER_CLASS_NAME}>
        <DataWorkspaceHeader description={description} title={title} />
      </div>
      <div className={DATA_PANEL_CONTENT_CLASS_NAME}>
        <div className="grid gap-4 sm:grid-cols-2">
          {error ? (
            <div className="col-span-full">
              <DataWorkspaceState description={error.message} heading="Failed to load status" tone="danger" />
            </div>
          ) : null}
          {isLoading ? (
            <div className="col-span-full">
              <DataWorkspaceState description="Loading run status\u2026" />
            </div>
          ) : (
          <>
          <div className={cn(DATA_PANEL_SECTION_CLASS_NAME, "p-4 text-sm")}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Status</div>
            <div className="font-medium">{run?.status ?? "idle"}</div>
          </div>
          <div className={cn(DATA_PANEL_SECTION_CLASS_NAME, "p-4 text-sm")}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Run ID</div>
            <div className="truncate font-medium">{run?.id ?? "none"}</div>
          </div>
          <div className={cn(DATA_PANEL_SECTION_CLASS_NAME, "p-4 text-sm")}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Current node</div>
            <div className="truncate font-medium">{run?.current_node_id ?? "none"}</div>
          </div>
          <div className={cn(DATA_PANEL_SECTION_CLASS_NAME, "p-4 text-sm")}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Waiting on</div>
            <div className="truncate font-medium">{waitingOn ?? "nothing"}</div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  )
})
LemmaWorkflowRunStatus.displayName = "LemmaWorkflowRunStatus"
