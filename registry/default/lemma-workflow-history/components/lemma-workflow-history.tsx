"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useWorkflowRuns } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DATA_LIST_ITEM_CLASS_NAME,
  DATA_SUBTLE_ACTION_CLASS_NAME,
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
      className={DATA_SUBTLE_ACTION_CLASS_NAME}
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
    <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
      <div className={DATA_PANEL_HEADER_CLASS_NAME}>
        <DataWorkspaceHeader actions={actions} description={description} title={title} />
      </div>
      <div className={DATA_PANEL_CONTENT_CLASS_NAME}>
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
                  className={cn(DATA_LIST_ITEM_CLASS_NAME, "text-left text-sm data-[selected=true]:border-primary/50 data-[selected=true]:bg-foreground/[0.04]")}
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
              className="rounded-xl"
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
      </div>
    </div>
  )
})
LemmaWorkflowHistory.displayName = "LemmaWorkflowHistory"
