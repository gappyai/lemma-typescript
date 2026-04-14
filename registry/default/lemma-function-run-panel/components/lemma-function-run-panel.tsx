"use client"

import * as React from "react"
import type { JsonSchemaLike, LemmaClient, FunctionRun } from "lemma-sdk"
import { useFunctionRun } from "lemma-sdk/react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LemmaSchemaForm } from "@/components/lemma/lemma-schema-form"
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
        submitLabel={run.isPolling ? "Running..." : "Run function"}
        title={title}
      />
      <Card>
        <CardHeader>
          <CardTitle>Function Run</CardTitle>
          <CardDescription>Latest run status and output.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {run.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {run.error.message}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
              <div className="text-muted-foreground">Status</div>
              <div className="font-medium">{run.status ?? "idle"}</div>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
              <div className="text-muted-foreground">Run ID</div>
              <div className="truncate font-medium">{run.runId ?? "none"}</div>
            </div>
          </div>
          {run.output ? (
            <pre className="max-h-[360px] overflow-auto rounded-md border border-border bg-muted/40 p-4 text-sm leading-6">
              {formatJson(run.output)}
            </pre>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
              Run the function to inspect output.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
LemmaFunctionRunPanel.displayName = "LemmaFunctionRunPanel"
