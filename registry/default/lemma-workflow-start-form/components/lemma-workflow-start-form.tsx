"use client"

import * as React from "react"
import type { FlowRun, LemmaClient } from "lemma-sdk"
import { useWorkflowStart } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LemmaSchemaForm } from "@/components/lemma/lemma-schema-form"
import { cn } from "@/lib/utils"

export interface LemmaWorkflowStartFormProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError" | "onSubmit"> {
  client: LemmaClient
  podId?: string
  workflowName: string
  title?: string
  description?: string
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onStarted?: (run: FlowRun) => void
  onError?: (error: Error) => void
}

export const LemmaWorkflowStartForm = React.forwardRef<HTMLDivElement, LemmaWorkflowStartFormProps>(
  ({
    client,
    podId,
    workflowName,
    title = "Start Workflow",
    description = "Launch a workflow with a schema-aware form when input is required.",
    submitLabel = "Start workflow",
    initialValues,
    onStarted,
    onError,
    className,
    ...props
  }, ref) => {
  const hasWorkflowName = workflowName.trim().length > 0

  const workflow = useWorkflowStart({
    client,
    podId,
    workflowName,
  })

  React.useEffect(() => {
    if (workflow.error) {
      onError?.(workflow.error)
    }
  }, [workflow.error, onError])

  const handleStart = React.useCallback(async (data: Record<string, unknown>) => {
    try {
      const run = await workflow.start(data)
      onStarted?.(run)
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }, [onStarted, onError, workflow])

  if (!hasWorkflowName) {
    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!workflow.workflow && workflow.isLoadingWorkflow) {
    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Loading workflow definition…</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!workflow.inputSchema || Object.keys(workflow.inputSchema).length === 0) {
    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {workflow.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {workflow.error.message}
            </div>
          ) : null}
          <Button
            disabled={workflow.isStarting}
            onClick={() => {
              void workflow.start(initialValues ?? {}).then((run) => {
                onStarted?.(run)
              })
            }}
            type="button"
          >
            {workflow.isStarting ? "Starting…" : submitLabel}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <LemmaSchemaForm
      ref={ref}
      className={className}
      description={description}
      disabled={workflow.isStarting}
      initialValues={initialValues}
      onSubmit={handleStart}
      schema={workflow.inputSchema}
      submitLabel={workflow.isStarting ? "Starting…" : submitLabel}
      title={title}
      uiSchema={workflow.inputUiSchema}
      {...props}
    />
  )
})
LemmaWorkflowStartForm.displayName = "LemmaWorkflowStartForm"
