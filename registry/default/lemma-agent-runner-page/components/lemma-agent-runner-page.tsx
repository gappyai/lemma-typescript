"use client"

import * as React from "react"
import type { Agent, LemmaClient } from "lemma-sdk"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LemmaAgentRunPanel } from "@/components/lemma/lemma-agent-run-panel"
import {
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
        <SelectTrigger className="min-w-[240px]">
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
      <Card>
        <CardHeader className="p-6">
          <DataWorkspaceHeader actions={selectorActions} description={description} title={title} />
        </CardHeader>
      </Card>

      {selectedAgentName ? (
        <LemmaAgentRunPanel client={client} podId={podId} agentName={selectedAgentName} onError={onError} />
      ) : (
        <Card>
          <CardHeader className="p-6">
            <DataWorkspaceHeader description="Pass agents or an agentName to render the runner." title="No Agent Selected" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <DataWorkspaceState description="Select an agent from the list above to get started." />
          </CardContent>
        </Card>
      )}
    </div>
  )
})
LemmaAgentRunnerPage.displayName = "LemmaAgentRunnerPage"
