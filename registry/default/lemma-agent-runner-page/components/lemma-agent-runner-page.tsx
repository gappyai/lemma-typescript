"use client"

import * as React from "react"
import type { Agent, LemmaClient } from "lemma-sdk"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LemmaAgentRunPanel } from "@/components/lemma/lemma-agent-run-panel"
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DATA_INPUT_CLASS_NAME,
  DataWorkspaceHeader,
  DataWorkspaceState,
} from "@/components/lemma/registry-data-workspace"
import { cn } from "@/lib/utils"

export interface LemmaAgentRunnerPageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError"> {
  client: LemmaClient
  podId?: string
  agents?: Agent[]
  agentName?: string
  onAgentNameChange?: (agentName: string) => void
  title?: string
  description?: string
  onError?: (error: Error) => void
}

export const LemmaAgentRunnerPage = React.forwardRef<HTMLDivElement, LemmaAgentRunnerPageProps>(
  ({
    client,
    podId,
    agents = [],
    agentName,
    onAgentNameChange,
    title = "Agent Runner",
    description = "Choose an agent and run it with a schema-aware input panel.",
    onError,
    className,
    ...props
  }, ref) => {
  const [internalAgentName, setInternalAgentName] = React.useState(agentName ?? agents[0]?.name ?? "")
  const selectedAgentName = agentName ?? internalAgentName

  React.useEffect(() => {
    if (agentName) return
    setInternalAgentName((current) => (
      current && agents.some((agent) => agent.name === current) ? current : (agents[0]?.name ?? "")
    ))
  }, [agentName, agents])

  const setSelectedAgentName = React.useCallback((nextAgentName: string) => {
    if (!agentName) setInternalAgentName(nextAgentName)
    onAgentNameChange?.(nextAgentName)
  }, [agentName, onAgentNameChange])

  const selectorActions = (
    <>
      <Select value={selectedAgentName} onValueChange={setSelectedAgentName}>
        <SelectTrigger className={cn(DATA_INPUT_CLASS_NAME, "min-w-[240px]")}>
          <SelectValue placeholder="Select an agent" />
        </SelectTrigger>
        <SelectContent>
          {agents.map((agent) => (
            <SelectItem key={agent.name} value={agent.name}>
              {agent.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )

  return (
    <div ref={ref} className={cn("grid gap-4", className)} {...props}>
      <div className={DATA_PANEL_CARD_CLASS_NAME}>
        <div className={DATA_PANEL_HEADER_CLASS_NAME}>
          <DataWorkspaceHeader actions={selectorActions} description={description} title={title} />
        </div>
      </div>

      {selectedAgentName ? (
        <LemmaAgentRunPanel client={client} podId={podId} agentName={selectedAgentName} onError={onError} />
      ) : (
        <div className={DATA_PANEL_CARD_CLASS_NAME}>
          <div className={DATA_PANEL_HEADER_CLASS_NAME}>
            <DataWorkspaceHeader description="Pass agents or an agentName to render the runner." title="No Agent Selected" />
          </div>
          <div className={DATA_PANEL_CONTENT_CLASS_NAME}>
            <DataWorkspaceState description="Select an agent from the list above to get started." />
          </div>
        </div>
      )}
    </div>
  )
})
LemmaAgentRunnerPage.displayName = "LemmaAgentRunnerPage"
