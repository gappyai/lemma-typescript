"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useFunctionRuns } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

  return (
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            disabled={history.isLoading || !functionName}
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
            No function runs loaded.
          </div>
        ) : (
          history.runs.map((run) => (
            <button
              className="rounded-md border border-border bg-muted/30 p-4 text-left text-sm transition-colors hover:bg-muted data-[selected=true]:border-primary"
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
            variant="outline"
          >
            {history.isLoadingMore ? "Loading..." : "Load more"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
})
LemmaFunctionRunHistory.displayName = "LemmaFunctionRunHistory"
