"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useAgentRun } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DATA_PANEL_SECTION_CLASS_NAME,
  DATA_SUBTLE_ACTION_CLASS_NAME,
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
      className={DATA_SUBTLE_ACTION_CLASS_NAME}
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
    <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
      <div className={DATA_PANEL_HEADER_CLASS_NAME}>
        <DataWorkspaceHeader
          actions={actions}
          description={description}
          title={title}
        />
      </div>
      <div className={DATA_PANEL_CONTENT_CLASS_NAME}>
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
              <div key={message.id} className={cn(DATA_PANEL_SECTION_CLASS_NAME, "p-4")}>
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
      </div>
    </div>
  )
})
LemmaAgentMessages.displayName = "LemmaAgentMessages"
