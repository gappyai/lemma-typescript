"use client"

import type { FlowRun } from "lemma-sdk"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface LemmaWorkflowRunStatusProps {
  run?: FlowRun | null
  title?: string
  description?: string
}

export function LemmaWorkflowRunStatus({
  run,
  title = "Workflow Run Status",
  description = "Current state for the selected workflow run.",
}: LemmaWorkflowRunStatusProps) {
  const waitingOn = run?.waiting_task_id
    ? `Task ${run.waiting_task_id}`
    : run?.waiting_function_run_id
      ? `Function run ${run.waiting_function_run_id}`
      : run?.waiting_trigger_id
        ? `Trigger ${run.waiting_trigger_id}`
        : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          <div className="text-muted-foreground">Status</div>
          <div className="font-medium">{run?.status ?? "idle"}</div>
        </div>
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          <div className="text-muted-foreground">Run ID</div>
          <div className="truncate font-medium">{run?.id ?? "none"}</div>
        </div>
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          <div className="text-muted-foreground">Current node</div>
          <div className="truncate font-medium">{run?.current_node_id ?? "none"}</div>
        </div>
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          <div className="text-muted-foreground">Waiting on</div>
          <div className="truncate font-medium">{waitingOn ?? "nothing"}</div>
        </div>
      </CardContent>
    </Card>
  )
}
