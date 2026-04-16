"use client"

import * as React from "react"
import {
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RefreshCw,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRecords, useReferencingRecords } from "lemma-sdk/react"
import type { LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"
import {
  runStatusClasses,
  stepStatusClasses,
  toRunStatus,
  toStepStatus,
  type EnumColorMap,
  type WorkflowRunStatus,
  type WorkflowStepStatus,
} from "./workflow-enum-utils"
import {
  workflowRadiusClassName,
  type LemmaWorkflowAppearance,
  type LemmaWorkflowDensity,
  type LemmaWorkflowRadius,
} from "./workflow-style-utils"

export type { LemmaWorkflowAppearance, LemmaWorkflowDensity, LemmaWorkflowRadius } from "./workflow-style-utils"
export type { EnumColorMap, WorkflowRunStatus, WorkflowStepStatus } from "./workflow-enum-utils"

export interface WorkflowStep {
  name: string
  status: WorkflowStepStatus
  started_at?: string
  completed_at?: string
  [key: string]: unknown
}

export interface LemmaWorkflowRunnerProps {
  client: LemmaClient
  podId?: string
  enabled?: boolean
  workflowName?: string
  runId?: string
  tableName?: string
  stepsTable?: string
  stepsForeignKey?: string
  stepsField?: string
  enumColorMap?: EnumColorMap

  appearance?: LemmaWorkflowAppearance
  density?: LemmaWorkflowDensity
  radius?: LemmaWorkflowRadius

  onRunClick?: (run: Record<string, unknown>) => void
  onManualStart?: () => void
  title?: React.ReactNode
  headerActions?: React.ReactNode
  className?: string
}

export function LemmaWorkflowRunner({
  client,
  podId,
  enabled = true,
  workflowName,
  runId: initialRunId,
  tableName = "workflow_runs",
  stepsTable,
  stepsForeignKey = "run_id",
  stepsField = "steps",
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  onRunClick,
  onManualStart,
  title,
  headerActions,
  className,
}: LemmaWorkflowRunnerProps) {
  const [selectedRunId, setSelectedRunId] = React.useState<string | null>(initialRunId ?? null)

  const filters = React.useMemo(() => {
    const f: Array<{ field: string; op: string; value: unknown }> = []
    if (workflowName) {
      f.push({ field: "workflow_name", op: "=", value: workflowName })
    }
    return f.length > 0 ? f : undefined
  }, [workflowName])

  const runsState = useRecords({
    client,
    podId,
    tableName,
    filters,
    sortBy: "started_at",
    order: "desc",
    limit: 100,
    enabled,
  })

  const stepsState = useReferencingRecords({
    client,
    podId,
    table: stepsTable ?? `${tableName.replace(/_runs$/, "")}_steps`,
    foreignKey: stepsForeignKey,
    recordId: selectedRunId,
    enabled: !!selectedRunId && !!stepsTable,
  })

  const selectedRun = React.useMemo(
    () => runsState.records.find((r) => String(r.id) === selectedRunId) ?? null,
    [runsState.records, selectedRunId],
  )

  const parsedSteps = React.useMemo<WorkflowStep[]>(() => {
    if (!selectedRun) return []
    if (stepsTable) {
      return stepsState.records.map((r) => ({
        name: String(r.name ?? r.step_name ?? r.step ?? "Step"),
        status: toStepStatus(r.status),
        started_at: r.started_at ? String(r.started_at) : undefined,
        completed_at: r.completed_at ? String(r.completed_at) : undefined,
        ...r,
      }))
    }
    const raw = selectedRun[stepsField]
    if (!raw) return []
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return normalizeSteps(parsed)
      } catch { /* noop */ }
      return []
    }
    if (Array.isArray(raw)) return normalizeSteps(raw)
    return []
  }, [selectedRun, stepsState.records, stepsTable, stepsField])

  const completedSteps = parsedSteps.filter((s) => s.status === "completed").length
  const totalSteps = parsedSteps.length
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  React.useEffect(() => {
    if (initialRunId && initialRunId !== selectedRunId) {
      setSelectedRunId(initialRunId)
    }
  }, [initialRunId])

  const isLoading = runsState.isLoading
  const hasError = runsState.error

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-workflow-runner flex h-full min-h-0 flex-col", workflowRootClassName(appearance), className)}
    >
      <div className={cn("shrink-0", workflowHeaderClassName(appearance))}>
        <div className={cn("flex items-center justify-between", workflowToolbarClassName(density))}>
          <div className="min-w-0 flex items-center gap-3">
            <span className={cn("flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground", workflowRadiusClassName(radius, "control"))}>
              <Zap className="size-3.5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {title ?? (workflowName ?? "Workflows")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {runsState.records.length} run{runsState.records.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            {onManualStart && (
              <Button size="sm" onClick={onManualStart} className="h-8 gap-2 text-xs">
                <Play className="size-3.5" />
                Start
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className={cn("flex flex-1 min-h-0 overflow-hidden", workflowContentClassName(density))}>
        {hasError ? (
          <div className="flex min-h-48 flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">{hasError.message}</p>
            <Button variant="outline" size="sm" onClick={() => runsState.refresh()}>
              <RefreshCw className="mr-2 size-3.5" />
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex-1 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : runsState.records.length === 0 ? (
          <div className="flex min-h-48 flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className={cn("flex size-10 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground", workflowRadiusClassName(radius, "pill"))}>
              <Zap className="size-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">No workflow runs</p>
              <p className="mt-1 text-sm text-muted-foreground">Runs will appear here when workflows are triggered.</p>
            </div>
          </div>
        ) : (
          <>
            <div className={cn(
              "shrink-0 flex flex-col border-r border-border/30 overflow-auto",
              density === "compact" ? "w-56" : density === "spacious" ? "w-80" : "w-64",
            )}>
              <div className={cn("flex-1 overflow-auto", density === "compact" ? "py-1" : density === "spacious" ? "py-3" : "py-2")}>
                {runsState.records.map((run) => {
                  const status = toRunStatus(run.status)
                  const isActive = String(run.id) === selectedRunId
                  return (
                    <button
                      key={String(run.id)}
                      type="button"
                      onClick={() => {
                        setSelectedRunId(String(run.id))
                        onRunClick?.(run)
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 text-left transition-colors",
                        isActive ? "bg-muted/50" : "hover:bg-muted/20",
                        density === "compact" ? "px-2 py-1.5" : density === "spacious" ? "px-4 py-3" : "px-3 py-2",
                        workflowRadiusClassName(radius, "control"),
                      )}
                    >
                      <span className={runStatusIconWrapper(status)}>
                        {runStatusIcon(status)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {String(run.name ?? run.workflow_name ?? `Run ${run.id}`)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={runStatusClasses(status)}>{status}</span>
                          {run.started_at != null && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimestamp(run.started_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={cn("size-3.5 shrink-0 text-muted-foreground", isActive && "text-foreground")} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {!selectedRun ? (
                <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-center">
                  <Clock className="size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Select a run to view details</p>
                </div>
              ) : (
                <div className={cn(density === "compact" ? "p-3" : density === "spacious" ? "p-5" : "p-4")}>
                  <div className="mb-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base font-semibold text-foreground truncate">
                        {String(selectedRun.name ?? selectedRun.workflow_name ?? `Run ${selectedRun.id}`)}
                      </h2>
                      <span className={runStatusClasses(toRunStatus(selectedRun.status))}>
                        {toRunStatus(selectedRun.status)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {selectedRun.started_at != null && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          Started: {formatTimestamp(selectedRun.started_at)}
                        </span>
                      )}
                      {selectedRun.completed_at != null && (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          Completed: {formatTimestamp(selectedRun.completed_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {parsedSteps.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Steps
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {completedSteps}/{totalSteps}
                        </span>
                      </div>

                      {totalSteps > 0 && (
                        <div className="mb-4 h-1.5 overflow-hidden bg-muted/60 rounded-full">
                          <div
                            className={cn("h-full rounded-full transition-all", progressPct === 100 ? "bg-emerald-500" : "bg-blue-500")}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}

                      <div className={cn("relative flex flex-col", density === "compact" ? "gap-2" : density === "spacious" ? "gap-4" : "gap-3")}>
                        {parsedSteps.map((step, index) => (
                          <div key={`${step.name}-${index}`} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                            <div className="flex flex-col items-center">
                              <span className={cn("flex size-7 items-center justify-center border", stepIconBorder(step.status), stepIconBg(step.status), workflowRadiusClassName(radius, "pill"))}>
                                {stepStatusIcon(step.status)}
                              </span>
                              {index < parsedSteps.length - 1 && (
                                <span className={cn("my-1 h-full min-h-4 w-px", stepConnectorClass(step.status))} />
                              )}
                            </div>
                            <div className={cn("border border-border/30 bg-muted/10", workflowRadiusClassName(radius, "surface"), density === "compact" ? "p-2" : density === "spacious" ? "p-4" : "p-3")}>
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium text-foreground">{step.name}</p>
                                <span className={stepStatusClasses(step.status)}>{step.status}</span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {step.started_at && (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {formatTimestamp(step.started_at)}
                                  </span>
                                )}
                                {step.completed_at && (
                                  <span className="inline-flex items-center gap-1">
                                    <CheckCircle2 className="size-3" />
                                    {formatTimestamp(step.completed_at)}
                                  </span>
                                )}
                                {step.started_at && step.completed_at && (
                                  <span>{formatDuration(step.started_at, step.completed_at)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsedSteps.length === 0 && stepsTable && stepsState.isLoading && (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="size-7 rounded-full shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {parsedSteps.length === 0 && !stepsTable && (
                    <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center">
                      <Clock className="size-6 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No step data available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function normalizeSteps(raw: unknown[]): WorkflowStep[] {
  return raw.map((item) => {
    const s = item as Record<string, unknown>
    return {
      name: String(s.name ?? s.step_name ?? s.step ?? s.label ?? "Step"),
      status: toStepStatus(s.status),
      started_at: s.started_at ? String(s.started_at) : undefined,
      completed_at: s.completed_at ? String(s.completed_at) : undefined,
      ...s,
    }
  })
}

function runStatusIcon(status: WorkflowRunStatus): React.ReactNode {
  switch (status) {
    case "pending": return <Clock className="size-3.5" />
    case "running": return <RefreshCw className="size-3.5 animate-spin" />
    case "completed": return <CheckCircle2 className="size-3.5" />
    case "failed": return <XCircle className="size-3.5" />
  }
}

function runStatusIconWrapper(status: WorkflowRunStatus): string {
  switch (status) {
    case "pending": return "flex size-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400"
    case "running": return "flex size-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400"
    case "completed": return "flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    case "failed": return "flex size-7 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400"
  }
}

function stepStatusIcon(status: WorkflowStepStatus): React.ReactNode {
  switch (status) {
    case "waiting": return <Clock className="size-3.5" />
    case "active": return <RefreshCw className="size-3.5 animate-spin" />
    case "completed": return <CheckCircle2 className="size-3.5" />
    case "failed": return <XCircle className="size-3.5" />
  }
}

function stepIconBorder(status: WorkflowStepStatus): string {
  switch (status) {
    case "waiting": return "border-amber-200 dark:border-amber-500/30"
    case "active": return "border-blue-200 dark:border-blue-500/30"
    case "completed": return "border-emerald-200 dark:border-emerald-500/30"
    case "failed": return "border-red-200 dark:border-red-500/30"
  }
}

function stepIconBg(status: WorkflowStepStatus): string {
  switch (status) {
    case "waiting": return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    case "active": return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    case "completed": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    case "failed": return "bg-red-500/10 text-red-600 dark:text-red-400"
  }
}

function stepConnectorClass(status: WorkflowStepStatus): string {
  if (status === "completed") return "bg-emerald-300 dark:bg-emerald-500/30"
  if (status === "failed") return "bg-red-300 dark:bg-red-500/30"
  if (status === "active") return "bg-blue-300 dark:bg-blue-500/30"
  return "bg-border/40"
}

function formatTimestamp(value: unknown): string {
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

function formatDuration(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return ""
  const diffMs = e.getTime() - s.getTime()
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remSec = seconds % 60
  if (minutes < 60) return `${minutes}m ${remSec}s`
  const hours = Math.floor(minutes / 60)
  const remMin = minutes % 60
  return `${hours}h ${remMin}m`
}

function workflowRootClassName(appearance: LemmaWorkflowAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function workflowHeaderClassName(appearance: LemmaWorkflowAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

function workflowToolbarClassName(density: LemmaWorkflowDensity) {
  if (density === "compact") return "gap-2 px-3 py-2"
  if (density === "spacious") return "gap-4 px-5 py-4"
  return "gap-3 px-4 py-3"
}

function workflowContentClassName(density: LemmaWorkflowDensity) {
  if (density === "compact") return "p-2"
  if (density === "spacious") return "p-5"
  return "p-4"
}
