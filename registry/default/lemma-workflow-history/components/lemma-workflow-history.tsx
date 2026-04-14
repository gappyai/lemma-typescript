"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useWorkflowRuns } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface LemmaWorkflowHistoryProps extends React.HTMLAttributes<HTMLDivElement> {
  client: LemmaClient
  podId?: string
  workflowName: string
  title?: string
  description?: string
  onRunSelect?: (runId: string | null) => void
}

export const LemmaWorkflowHistory = React.forwardRef<HTMLDivElement, LemmaWorkflowHistoryProps>(
  ({
    client,
    podId,
    workflowName,
    title = "Workflow History",
    description = "Recent runs for the selected workflow.",
    onRunSelect,
    className,
    ...props
  }, ref) => {
  const history = useWorkflowRuns({
    client,
    podId,
    workflowName,
    enabled: workflowName.trim().length > 0,
  })

  return (
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            disabled={history.isLoading || !workflowName}
            onClick={() => {
              void history.refresh()
            }}
            variant="outline"
          >
            {history.isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {history.error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {history.error.message}
          </div>
        ) : null}
        {history.runs.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
            No workflow runs loaded.
          </div>
        ) : (
          history.runs.map((run) => {
            const runId = run.id ?? null
            const selected = runId === history.effectiveSelectedRunId
            return (
              <button
                className="rounded-md border border-border bg-muted/30 p-4 text-left text-sm transition-colors hover:bg-muted data-[selected=true]:border-primary"
                data-selected={selected}
                key={run.id ?? `${run.flow_id}-${run.created_at}`}
                onClick={() => {
                  history.selectRun(runId)
                  onRunSelect?.(runId)
                }}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{run.status ?? "UNKNOWN"}</span>
                  <span className="text-sm text-muted-foreground">{run.created_at ?? "no timestamp"}</span>
                </div>
                <div className="mt-1 truncate text-sm text-muted-foreground">{run.id ?? "missing run id"}</div>
              </button>
            )
          })
        )}
        {history.nextPageToken ? (
          <Button
            disabled={history.isLoadingMore}
            onClick={() => {
              void history.loadMore()
            }}
            variant="outline"
          >
            {history.isLoadingMore ? "Loading..." : "Load more"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
})
LemmaWorkflowHistory.displayName = "LemmaWorkflowHistory"
