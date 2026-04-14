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
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {error ? (
          <div className="col-span-full rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message}
          </div>
        ) : null}
        {isLoading ? (
          <div className="col-span-full rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground animate-pulse">
            Loading run status…
          </div>
        ) : (
        <>
        <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
          <div className="text-muted-foreground">Status</div>
          <div className="font-medium">{run?.status ?? "idle"}</div>
        </div>
        <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
          <div className="text-muted-foreground">Run ID</div>
          <div className="truncate font-medium">{run?.id ?? "none"}</div>
        </div>
        <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
          <div className="text-muted-foreground">Current node</div>
          <div className="truncate font-medium">{run?.current_node_id ?? "none"}</div>
        </div>
        <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
          <div className="text-muted-foreground">Waiting on</div>
          <div className="truncate font-medium">{waitingOn ?? "nothing"}</div>
        </div>
        </>
        )}
      </CardContent>
    </Card>
  )
})
LemmaWorkflowRunStatus.displayName = "LemmaWorkflowRunStatus"
