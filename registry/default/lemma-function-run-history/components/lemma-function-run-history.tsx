"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useFunctionRuns } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
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
            <DataWorkspaceState description="No function runs loaded." />
          ) : (
            history.runs.map((run) => (
              <button
                className="rounded-lg border p-4 hover:bg-muted/50 text-left text-sm data-[selected=true]:border-primary/50 data-[selected=true]:bg-foreground/[0.04]"
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
LemmaFunctionRunHistory.displayName = "LemmaFunctionRunHistory"
