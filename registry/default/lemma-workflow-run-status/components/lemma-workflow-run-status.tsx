"use client"

import * as React from "react"
import type { FlowRun } from "lemma-sdk"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
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
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props}>
      <CardHeader className="p-6">
        <DataWorkspaceHeader description={description} title={title} />
      </CardHeader>
      <CardContent className="p-6 pt-0">
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
          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Status</div>
            <div className="font-medium">{run?.status ?? "idle"}</div>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Run ID</div>
            <div className="truncate font-medium">{run?.id ?? "none"}</div>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Current node</div>
            <div className="truncate font-medium">{run?.current_node_id ?? "none"}</div>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Waiting on</div>
            <div className="truncate font-medium">{waitingOn ?? "nothing"}</div>
          </div>
          </>
          )}
        </div>
      </CardContent>
    </div>
  )
})
LemmaWorkflowRunStatus.displayName = "LemmaWorkflowRunStatus"
