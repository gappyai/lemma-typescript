"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useWorkflowRuns } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DataWorkspaceHeader,
  DataWorkspaceState,
} from "@/components/lemma/registry-data-workspace"
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

  const actions = (
    <Button
      disabled={history.isLoading || !workflowName}
      onClick={() => {
        void history.refresh()
      }}
      type="button"
      variant="outline"
    >
      {history.isLoading ? "Refreshing\u2026" : "Refresh"}
    </Button>
  )

  return (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props}>
      <CardHeader className="p-6">
        <DataWorkspaceHeader actions={actions} description={description} title={title} />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex flex-col gap-4">
          {history.error ? (
            <DataWorkspaceState description={history.error.message} heading="Failed to load history" tone="danger" />
          ) : null}
          {history.runs.length === 0 ? (
            <DataWorkspaceState description="No workflow runs loaded." />
          ) : (
            history.runs.map((run) => {
              const runId = run.id ?? null
              const selected = runId === history.effectiveSelectedRunId
              return (
                <button
                  className="rounded-lg border p-4 hover:bg-muted/50 text-left text-sm data-[selected=true]:border-primary/50 data-[selected=true]:bg-foreground/[0.04]"
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
              type="button"
              variant="outline"
            >
              {history.isLoadingMore ? "Loading\u2026" : "Load more"}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </div>
  )
})
LemmaWorkflowHistory.displayName = "LemmaWorkflowHistory"
