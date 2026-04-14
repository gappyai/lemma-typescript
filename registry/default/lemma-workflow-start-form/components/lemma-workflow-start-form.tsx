"use client"

import * as React from "react"
import type { FlowRun, LemmaClient } from "lemma-sdk"
import { useWorkflowStart } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import { LemmaSchemaForm } from "@/components/lemma/lemma-schema-form"
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DataWorkspaceHeader,
  DataWorkspaceState,
} from "@/components/lemma/registry-data-workspace"
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
      <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
        <div className={DATA_PANEL_HEADER_CLASS_NAME}>
          <DataWorkspaceHeader description={description} title={title} />
        </div>
      </div>
    )
  }

  if (!workflow.workflow && workflow.isLoadingWorkflow) {
    return (
      <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
        <div className={DATA_PANEL_HEADER_CLASS_NAME}>
          <DataWorkspaceHeader description="Loading workflow definition\u2026" title={title} />
        </div>
      </div>
    )
  }

  if (!workflow.inputSchema || Object.keys(workflow.inputSchema).length === 0) {
    return (
      <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
        <div className={DATA_PANEL_HEADER_CLASS_NAME}>
          <DataWorkspaceHeader description={description} title={title} />
        </div>
        <div className={DATA_PANEL_CONTENT_CLASS_NAME}>
          <div className="grid gap-4">
            {workflow.error ? (
              <DataWorkspaceState description={workflow.error.message} heading="Workflow error" tone="danger" />
            ) : null}
            <Button
              className="rounded-xl"
              disabled={workflow.isStarting}
              onClick={() => {
                void workflow.start(initialValues ?? {}).then((run) => {
                  onStarted?.(run)
                })
              }}
              type="button"
            >
              {workflow.isStarting ? "Starting\u2026" : submitLabel}
            </Button>
          </div>
        </div>
      </div>
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
      submitLabel={workflow.isStarting ? "Starting\u2026" : submitLabel}
      title={title}
      uiSchema={workflow.inputUiSchema}
      {...props}
    />
  )
})
LemmaWorkflowStartForm.displayName = "LemmaWorkflowStartForm"
