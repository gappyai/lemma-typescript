"use client"

import type { LemmaClient } from "lemma-sdk"
import { useAgentRun } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface LemmaAgentMessagesProps {
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

export function LemmaAgentMessages({
  client,
  podId,
  taskId,
  title = "Agent Messages",
  description = "Task messages streamed or loaded from the selected agent run.",
}: LemmaAgentMessagesProps) {
  const run = useAgentRun({
    client,
    podId,
    taskId,
    autoConnect: false,
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            disabled={!taskId}
            onClick={() => {
              void run.loadMessages(taskId)
            }}
            variant="outline"
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {run.error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {run.error.message}
          </div>
        ) : null}
        {!taskId ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-6 text-sm text-muted-foreground">
            Select or start an agent run to load messages.
          </div>
        ) : run.messages.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-6 text-sm text-muted-foreground">
            No messages loaded for this run.
          </div>
        ) : (
          run.messages.map((message) => (
            <div key={message.id} className="rounded-md border border-border bg-muted/30 p-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {message.role ?? "message"}
              </div>
              <pre className="whitespace-pre-wrap text-sm leading-6">
                {formatContent(message.content)}
              </pre>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
