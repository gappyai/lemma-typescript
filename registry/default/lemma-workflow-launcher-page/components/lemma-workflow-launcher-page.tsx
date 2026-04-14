"use client"

import * as React from "react"
import type { FlowRun, LemmaClient, Workflow } from "lemma-sdk"
import {
  Card,
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
import { LemmaWorkflowHistory } from "@/components/lemma/lemma-workflow-history"
import { LemmaWorkflowRunDetails } from "@/components/lemma/lemma-workflow-run-details"
import { LemmaWorkflowRunStatus } from "@/components/lemma/lemma-workflow-run-status"
import { LemmaWorkflowStartForm } from "@/components/lemma/lemma-workflow-start-form"
import { cn } from "@/lib/utils"

export interface LemmaWorkflowLauncherPageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError"> {
  client: LemmaClient
  podId?: string
  workflows?: Workflow[]
  workflowName?: string
  onWorkflowNameChange?: (workflowName: string) => void
  title?: string
  description?: string
  onError?: (error: Error) => void
}

export const LemmaWorkflowLauncherPage = React.forwardRef<HTMLDivElement, LemmaWorkflowLauncherPageProps>(
  ({
    client,
    podId,
    workflows = [],
    workflowName,
    onWorkflowNameChange,
    title = "Workflow Launcher",
    description = "Start a workflow and review its recent run history.",
    onError,
    className,
    ...props
  }, ref) => {
  const [internalWorkflowName, setInternalWorkflowName] = React.useState(workflowName ?? workflows[0]?.name ?? "")
  const [lastRun, setLastRun] = React.useState<FlowRun | null>(null)
  const selectedWorkflowName = workflowName ?? internalWorkflowName

  React.useEffect(() => {
    if (workflowName) return
    setInternalWorkflowName((current) => (
      current && workflows.some((workflow) => workflow.name === current) ? current : (workflows[0]?.name ?? "")
    ))
  }, [workflowName, workflows])

  const setSelectedWorkflowName = React.useCallback((nextWorkflowName: string) => {
    if (!workflowName) setInternalWorkflowName(nextWorkflowName)
    onWorkflowNameChange?.(nextWorkflowName)
  }, [onWorkflowNameChange, workflowName])

  return (
    <div ref={ref} className={cn("grid gap-4", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <Select value={selectedWorkflowName} onValueChange={setSelectedWorkflowName}>
            <SelectTrigger>
              <SelectValue placeholder="Select a workflow" />
            </SelectTrigger>
            <SelectContent>
              {workflows.map((workflow) => (
                <SelectItem key={workflow.name} value={workflow.name}>
                  {workflow.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {selectedWorkflowName ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
    <div>
            <LemmaWorkflowStartForm
              client={client}
              onError={onError}
              onStarted={(run) => setLastRun(run)}
              podId={podId}
              workflowName={selectedWorkflowName}
            />
            <LemmaWorkflowRunStatus run={lastRun} />
            <LemmaWorkflowRunDetails run={lastRun} />
          </div>
          <LemmaWorkflowHistory
            client={client}
            podId={podId}
            workflowName={selectedWorkflowName}
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Workflow Selected</CardTitle>
            <CardDescription>Pass workflows or a workflowName to render the launcher.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
})
LemmaWorkflowLauncherPage.displayName = "LemmaWorkflowLauncherPage"
