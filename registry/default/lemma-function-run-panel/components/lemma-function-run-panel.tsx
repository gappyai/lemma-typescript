"use client"

import * as React from "react"
import type { JsonSchemaLike, LemmaClient, FunctionRun } from "lemma-sdk"
import { useFunctionRun } from "lemma-sdk/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { LemmaSchemaForm } from "@/components/lemma/lemma-schema-form"
import {
  DataWorkspaceHeader,
  DataWorkspaceState,
} from "@/components/lemma/registry-data-workspace"
import { cn } from "@/lib/utils"

export interface LemmaFunctionRunPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError"> {
  client: LemmaClient
  podId?: string
  functionName: string
  inputSchema?: JsonSchemaLike | null
  title?: string
  description?: string
  onStarted?: (run: FunctionRun) => void
  onError?: (error: Error) => void
}

function formatJson(value: unknown): string {
  if (value === null || typeof value === "undefined") return ""
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export const LemmaFunctionRunPanel = React.forwardRef<HTMLDivElement, LemmaFunctionRunPanelProps>(
  ({
    client,
    podId,
    functionName,
    inputSchema,
    title = "Function Runner",
    description = "Run a function and inspect status plus output.",
    onStarted,
    onError,
    className,
    ...props
  }, ref) => {
  const run = useFunctionRun({
    client,
    podId,
    functionName: functionName || undefined,
  })

  React.useEffect(() => {
    if (run.error) {
      onError?.(run.error)
    }
  }, [run.error, onError])

  return (
    <div ref={ref} className={cn("grid gap-4", className)} {...props}>
      <LemmaSchemaForm
        disabled={!functionName || run.isPolling}
        description={description}
        onSubmit={async (data) => {
          const created = await run.start(data)
          onStarted?.(created)
        }}
        schema={inputSchema}
        submitLabel={run.isPolling ? "Running\u2026" : "Run function"}
        title={title}
      />
      <Card>
        <CardHeader className="p-6">
          <DataWorkspaceHeader
            description="Latest run status and output."
            title="Function Run"
          />
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex flex-col gap-4">
            {run.error ? (
              <DataWorkspaceState description={run.error.message} heading="Run error" tone="danger" />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Status</div>
                <div className="font-medium">{run.status ?? "idle"}</div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Run ID</div>
                <div className="truncate font-medium">{run.runId ?? "none"}</div>
              </div>
            </div>
            {run.output ? (
              <pre className="rounded-lg border bg-muted/50 p-4 overflow-x-auto whitespace-pre-wrap text-sm">
                {formatJson(run.output)}
              </pre>
            ) : (
              <DataWorkspaceState description="Run the function to inspect output." />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
LemmaFunctionRunPanel.displayName = "LemmaFunctionRunPanel"
