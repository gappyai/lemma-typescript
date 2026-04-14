"use client"

import * as React from "react"
import type { FlowRun, LemmaClient, Workflow } from "lemma-sdk"
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
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DATA_INPUT_CLASS_NAME,
  DataWorkspaceHeader,
  DataWorkspaceState,
} from "@/components/lemma/registry-data-workspace"
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

  const selectorActions = (
    <Select value={selectedWorkflowName} onValueChange={setSelectedWorkflowName}>
      <SelectTrigger className={cn(DATA_INPUT_CLASS_NAME, "min-w-[240px]")}>
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
  )

  return (
    <div ref={ref} className={cn("grid gap-4", className)} {...props}>
      <div className={DATA_PANEL_CARD_CLASS_NAME}>
        <div className={DATA_PANEL_HEADER_CLASS_NAME}>
          <DataWorkspaceHeader actions={selectorActions} description={description} title={title} />
        </div>
      </div>

      {selectedWorkflowName ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div className="grid gap-4">
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
        <div className={DATA_PANEL_CARD_CLASS_NAME}>
          <div className={DATA_PANEL_HEADER_CLASS_NAME}>
            <DataWorkspaceHeader description="Pass workflows or a workflowName to render the launcher." title="No Workflow Selected" />
          </div>
          <div className={DATA_PANEL_CONTENT_CLASS_NAME}>
            <DataWorkspaceState description="Select a workflow from the list above to get started." />
          </div>
        </div>
      )}
    </div>
  )
})
LemmaWorkflowLauncherPage.displayName = "LemmaWorkflowLauncherPage"
