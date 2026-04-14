"use client"

import * as React from "react"
import type { JsonSchemaLike, LemmaClient, Task } from "lemma-sdk"
import { useAgentInputSchema, useAgentRun } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LemmaAgentMessages } from "@/components/lemma/lemma-agent-messages"
import { LemmaAgentOutputCard } from "@/components/lemma/lemma-agent-output-card"
import { LemmaSchemaForm } from "@/components/lemma/lemma-schema-form"
import {
  DataWorkspaceHeader,
  DataWorkspaceState,
} from "@/components/lemma/registry-data-workspace"
import { cn } from "@/lib/utils"

export interface LemmaAgentRunPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError"> {
  client: LemmaClient
  podId?: string
  agentName: string
  inputSchema?: JsonSchemaLike | null
  title?: string
  description?: string
  onStarted?: (task: Task) => void
  onError?: (error: Error) => void
}

export const LemmaAgentRunPanel = React.forwardRef<HTMLDivElement, LemmaAgentRunPanelProps>(
  ({
    client,
    podId,
    agentName,
    inputSchema,
    title = "Agent Runner",
    description = "Start an agent with schema-aware input, then inspect status, output, and messages.",
    onStarted,
    onError,
    className,
    ...props
  }, ref) => {
  const [followUp, setFollowUp] = React.useState("")
  const [followUpError, setFollowUpError] = React.useState<string | null>(null)
  const schemaState = useAgentInputSchema({
    client,
    podId,
    agentName,
    enabled: !!agentName && !inputSchema,
  })
  const run = useAgentRun({
    client,
    podId,
    agentName: agentName || undefined,
    autoConnect: true,
    autoConnectOnStart: true,
  })
  const schema = inputSchema ?? schemaState.inputSchema

  React.useEffect(() => {
    if (schemaState.error) {
      onError?.(schemaState.error)
    }
  }, [schemaState.error, onError])

  React.useEffect(() => {
    if (run.error) {
      onError?.(run.error)
    }
  }, [run.error, onError])

  return (
    <div ref={ref} className={cn("grid gap-4", className)} {...props}>
      <Card>
        <CardHeader className="p-6">
          <DataWorkspaceHeader description={description} title={title} />
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex flex-col gap-4">
            {schemaState.error ? (
              <DataWorkspaceState description={schemaState.error.message} heading="Schema error" tone="danger" />
            ) : null}
            {run.error ? (
              <DataWorkspaceState description={run.error.message} heading="Run error" tone="danger" />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Status</div>
                <div className="font-medium">{run.status ?? "idle"}</div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Task ID</div>
                <div className="truncate font-medium">{run.taskId ?? "none"}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <LemmaSchemaForm
        disabled={!agentName || run.isStreaming}
        description={schemaState.isLoading ? "Loading agent input schema\u2026" : "Submit structured input to start this agent."}
        onSubmit={async (data) => {
          const task = await run.start(data)
          onStarted?.(task)
        }}
        schema={schema}
        submitLabel={run.isStreaming ? "Running\u2026" : "Run agent"}
        title={agentName ? `Input: ${agentName}` : "Agent Input"}
      />

      {run.isWaitingForInput ? (
        <Card>
          <CardHeader className="p-6">
            <DataWorkspaceHeader
              description="This run is waiting for a response before it can continue."
              title="Follow-up Input"
            />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-col gap-4">
              {followUpError ? (
                <DataWorkspaceState description={followUpError} heading="Failed to submit" tone="danger" />
              ) : null}
              <div className="grid gap-2">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground" htmlFor="lemma-agent-follow-up">
                  Response
                </Label>
                <Textarea
                  className="min-h-24"
                  id="lemma-agent-follow-up"
                  onChange={(event) => setFollowUp(event.target.value)}
                  rows={4}
                  value={followUp}
                />
              </div>
              <Button
                disabled={!followUp.trim()}
                onClick={async () => {
                  setFollowUpError(null)
                  try {
                    await run.submitInput(followUp)
                    setFollowUp("")
                  } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : "Failed to submit follow-up input."
                    setFollowUpError(errorMsg)
                    onError?.(error instanceof Error ? error : new Error(errorMsg))
                  }
                }}
              >
                Submit response
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <LemmaAgentOutputCard task={run.task} />
      <LemmaAgentMessages client={client} podId={podId} taskId={run.taskId} />
    </div>
  )
})
LemmaAgentRunPanel.displayName = "LemmaAgentRunPanel"
