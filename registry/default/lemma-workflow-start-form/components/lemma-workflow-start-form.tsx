"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
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

export interface LemmaWorkflowStartFormProps {
  client: LemmaClient
  podId?: string
  workflowName: string
  title?: string
  description?: string
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onStarted?: (run: Record<string, unknown>) => void
}

export function LemmaWorkflowStartForm({
  client,
  podId,
  workflowName,
  title = "Start Workflow",
  description = "Launch a workflow with a schema-aware form when input is required.",
  submitLabel = "Start workflow",
  initialValues,
  onStarted,
}: LemmaWorkflowStartFormProps) {
  const hasWorkflowName = workflowName.trim().length > 0

  const workflow = useWorkflowStart({
    client,
    podId,
    workflowName,
  })

  const handleStart = React.useCallback(async (data: Record<string, unknown>) => {
    const run = await workflow.start(data)
    onStarted?.((run ?? {}) as Record<string, unknown>)
  }, [onStarted, workflow])

  if (!hasWorkflowName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!workflow.workflow && workflow.isLoadingWorkflow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Loading workflow definition…</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!workflow.inputSchema || Object.keys(workflow.inputSchema).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {workflow.error ? (
            <div className="rounded-md border border-[color:var(--resource-danger-border)] bg-[var(--resource-danger-soft)] px-3 py-2 text-sm text-[color:var(--resource-danger)]">
              {workflow.error.message}
            </div>
          ) : null}
          <Button
            disabled={workflow.isStarting}
            onClick={() => {
              void workflow.start(initialValues ?? {}).then((run) => {
                onStarted?.((run ?? {}) as Record<string, unknown>)
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
      description={description}
      disabled={workflow.isStarting}
      initialValues={initialValues}
      onSubmit={handleStart}
      schema={workflow.inputSchema}
      submitLabel={workflow.isStarting ? "Starting…" : submitLabel}
      title={title}
      uiSchema={workflow.inputUiSchema}
    />
  )
}
