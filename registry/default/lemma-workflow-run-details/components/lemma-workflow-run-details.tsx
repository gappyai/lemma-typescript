"use client"

import type { FlowRun } from "lemma-sdk"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface LemmaWorkflowRunDetailsProps {
  run?: FlowRun | null
  title?: string
  description?: string
}

function formatJson(value: unknown): string {
  if (value === null || typeof value === "undefined") return ""
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function LemmaWorkflowRunDetails({
  run,
  title = "Workflow Run Details",
  description = "Inspect execution context, stack, and step history.",
}: LemmaWorkflowRunDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!run ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-6 text-sm text-muted-foreground">
            Select a workflow run to inspect details.
          </div>
        ) : (
          <>
            <pre className="max-h-[320px] overflow-auto rounded-md border border-border bg-muted/40 p-3 text-sm leading-6">
              {formatJson(run.execution_context ?? {})}
            </pre>
            <pre className="max-h-[320px] overflow-auto rounded-md border border-border bg-muted/40 p-3 text-sm leading-6">
              {formatJson({
                execution_stack: run.execution_stack ?? [],
                step_history: run.step_history ?? [],
              })}
            </pre>
          </>
        )}
      </CardContent>
    </Card>
  )
}
