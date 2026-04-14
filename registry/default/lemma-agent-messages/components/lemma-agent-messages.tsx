"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useAgentRun } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DataWorkspaceHeader,
  DataWorkspaceState,
} from "@/components/lemma/registry-data-workspace"
import { cn } from "@/lib/utils"

export interface LemmaAgentMessagesProps extends React.HTMLAttributes<HTMLDivElement> {
  client: LemmaClient
  podId?: string
  taskId?: string | null
  title?: string
  description?: string
}

function formatContent(value: unknown): string {
  if (typeof value === "string") return value
  if (value === null || typeof value === "undefined") return ""
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export const LemmaAgentMessages = React.forwardRef<HTMLDivElement, LemmaAgentMessagesProps>(
  ({
    client,
    podId,
    taskId,
    title = "Agent Messages",
    description = "Task messages streamed or loaded from the selected agent run.",
    className,
    ...props
  }, ref) => {
  const run = useAgentRun({
    client,
    podId,
    taskId,
    autoConnect: false,
  })

  const actions = (
    <Button
      disabled={!taskId}
      onClick={() => {
        void run.loadMessages(taskId)
      }}
      type="button"
      variant="outline"
    >
      Refresh
    </Button>
  )

  return (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props}>
      <CardHeader className="p-6">
        <DataWorkspaceHeader
          actions={actions}
          description={description}
          title={title}
        />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex flex-col gap-4">
          {run.error ? (
            <DataWorkspaceState description={run.error.message} heading="Failed to load messages" tone="danger" />
          ) : null}
          {!taskId ? (
            <DataWorkspaceState description="Select or start an agent run to load messages." />
          ) : run.messages.length === 0 ? (
            <DataWorkspaceState description="No messages loaded for this run." />
          ) : (
            run.messages.map((message) => (
              <div key={message.id} className="rounded-lg border bg-muted/50 p-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {message.role ?? "message"}
                </div>
                <pre className="whitespace-pre-wrap text-sm leading-6">
                  {formatContent(message.content)}
                </pre>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </div>
  )
})
LemmaAgentMessages.displayName = "LemmaAgentMessages"
