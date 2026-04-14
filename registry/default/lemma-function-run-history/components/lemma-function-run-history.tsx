"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useFunctionRuns } from "lemma-sdk/react"
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

export interface LemmaFunctionRunHistoryProps extends React.HTMLAttributes<HTMLDivElement> {
  client: LemmaClient
  podId?: string
  functionName: string
  title?: string
  description?: string
  onRunSelect?: (runId: string | null) => void
}

export const LemmaFunctionRunHistory = React.forwardRef<HTMLDivElement, LemmaFunctionRunHistoryProps>(
  ({
    client,
    podId,
    functionName,
    title = "Function Run History",
    description = "Recent runs for the selected function.",
    onRunSelect,
    className,
    ...props
  }, ref) => {
  const history = useFunctionRuns({
    client,
    podId,
    functionName,
    enabled: functionName.trim().length > 0,
  })

  const actions = (
    <Button
      className={DATA_SUBTLE_ACTION_CLASS_NAME}
      disabled={history.isLoading || !functionName}
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
            <DataWorkspaceState description="No function runs loaded." />
          ) : (
            history.runs.map((run) => (
              <button
                className={cn(DATA_LIST_ITEM_CLASS_NAME, "text-left text-sm data-[selected=true]:border-primary/50 data-[selected=true]:bg-foreground/[0.04]")}
                data-selected={run.id === history.effectiveSelectedRunId}
                key={run.id}
                onClick={() => {
                  history.selectRun(run.id)
                  onRunSelect?.(run.id)
                }}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{run.status}</span>
                  <span className="text-sm text-muted-foreground">{run.created_at}</span>
                </div>
                <div className="mt-1 truncate text-sm text-muted-foreground">{run.id}</div>
              </button>
            ))
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
LemmaFunctionRunHistory.displayName = "LemmaFunctionRunHistory"
