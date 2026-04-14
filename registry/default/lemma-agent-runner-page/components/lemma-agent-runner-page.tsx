"use client"

import * as React from "react"
import type { Agent, LemmaClient } from "lemma-sdk"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LemmaAgentRunPanel } from "@/components/lemma/lemma-agent-run-panel"
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

  return (
    <div ref={ref} className={cn("grid gap-4", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Select value={selectedAgentName} onValueChange={setSelectedAgentName}>
            <SelectTrigger>
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
          <Button
            onClick={() => {
              if (selectedAgentName) setSelectedAgentName(selectedAgentName)
            }}
            variant="outline"
          >
            Use selected agent
          </Button>
        </CardContent>
      </Card>

      {selectedAgentName ? (
        <LemmaAgentRunPanel client={client} podId={podId} agentName={selectedAgentName} onError={onError} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Agent Selected</CardTitle>
            <CardDescription>Pass agents or an agentName to render the runner.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
})
LemmaAgentRunnerPage.displayName = "LemmaAgentRunnerPage"
