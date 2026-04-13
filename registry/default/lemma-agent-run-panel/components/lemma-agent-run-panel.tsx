"use client"

import * as React from "react"
import type { JsonSchemaLike, LemmaClient, Task } from "lemma-sdk"
import { useAgentInputSchema, useAgentRun } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LemmaAgentMessages } from "@/components/lemma/lemma-agent-messages"
import { LemmaAgentOutputCard } from "@/components/lemma/lemma-agent-output-card"
import { LemmaSchemaForm } from "@/components/lemma/lemma-schema-form"

export interface LemmaAgentRunPanelProps {
  client: LemmaClient
  podId?: string
  agentName: string
  inputSchema?: JsonSchemaLike | null
  title?: string
  description?: string
  onStarted?: (task: Task) => void
}

export function LemmaAgentRunPanel({
  client,
  podId,
  agentName,
  inputSchema,
  title = "Agent Runner",
  description = "Start an agent with schema-aware input, then inspect status, output, and messages.",
  onStarted,
}: LemmaAgentRunPanelProps) {
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

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {schemaState.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {schemaState.error.message}
            </div>
          ) : null}
          {run.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {run.error.message}
            </div>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <div className="text-muted-foreground">Status</div>
              <div className="font-medium">{run.status ?? "idle"}</div>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <div className="text-muted-foreground">Task ID</div>
              <div className="truncate font-medium">{run.taskId ?? "none"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <LemmaSchemaForm
        disabled={!agentName || run.isStreaming}
        description={schemaState.isLoading ? "Loading agent input schema..." : "Submit structured input to start this agent."}
        onSubmit={async (data) => {
          const task = await run.start(data)
          onStarted?.(task)
        }}
        schema={schema}
        submitLabel={run.isStreaming ? "Running..." : "Run agent"}
        title={agentName ? `Input: ${agentName}` : "Agent Input"}
      />

      {run.isWaitingForInput ? (
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Input</CardTitle>
            <CardDescription>This run is waiting for a response before it can continue.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {followUpError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {followUpError}
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="lemma-agent-follow-up">Response</Label>
              <Textarea
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
                  setFollowUpError(error instanceof Error ? error.message : "Failed to submit follow-up input.")
                }
              }}
            >
              Submit response
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <LemmaAgentOutputCard task={run.task} />
      <LemmaAgentMessages client={client} podId={podId} taskId={run.taskId} />
    </div>
  )
}
