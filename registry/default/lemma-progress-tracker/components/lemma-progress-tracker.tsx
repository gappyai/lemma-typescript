"use client"

import * as React from "react"
import {
  Check,
  X,
  Circle,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  progressTrackerRadiusClassName,
  type LemmaProgressTrackerAppearance,
  type LemmaProgressTrackerDensity,
  type LemmaProgressTrackerRadius,
} from "./progress-tracker-style-utils"

export type { LemmaProgressTrackerAppearance, LemmaProgressTrackerDensity, LemmaProgressTrackerRadius } from "./progress-tracker-style-utils"

export type StepStatus = "pending" | "active" | "complete" | "error"

export interface ProgressStep {
  id: string
  label: string
  description?: string
  status: StepStatus
  icon?: React.ComponentType<{ className?: string }>
}

export interface LemmaProgressTrackerProps {
  steps: ProgressStep[]
  currentStepId?: string
  orientation?: "horizontal" | "vertical"
  showConnectors?: boolean
  onStepClick?: (stepId: string) => void
  appearance?: LemmaProgressTrackerAppearance
  density?: LemmaProgressTrackerDensity
  radius?: LemmaProgressTrackerRadius
  className?: string
}

export function LemmaProgressTracker({
  steps,
  currentStepId,
  orientation = "horizontal",
  showConnectors = true,
  onStepClick,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  className,
}: LemmaProgressTrackerProps) {
  const resolvedSteps = React.useMemo(
    () =>
      steps.map((step) => ({
        ...step,
        status: currentStepId === step.id ? "active" : step.status,
      })),
    [steps, currentStepId],
  )

  const nodeSize = density === "compact" ? "size-6" : density === "spacious" ? "size-9" : "size-7"
  const iconSize = density === "compact" ? "size-3" : density === "spacious" ? "size-4" : "size-3.5"
  const labelSize = density === "compact" ? "text-[11px]" : density === "spacious" ? "text-sm" : "text-xs"
  const descSize = density === "compact" ? "text-[9px]" : density === "spacious" ? "text-xs" : "text-[10px]"

  const isHorizontal = orientation === "horizontal"

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn(
        "lemma-progress-tracker",
        isHorizontal ? "flex items-start" : "flex flex-col",
        trackerRootClassName(appearance),
        className,
      )}
    >
      {resolvedSteps.map((step, index) => {
        const isLast = index === resolvedSteps.length - 1
        const clickable = !!onStepClick

        return (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                "flex",
                isHorizontal ? "flex-col items-center" : "flex-row items-center",
              )}
            >
              <button
                type="button"
                disabled={!clickable}
                onClick={clickable ? () => onStepClick(step.id) : undefined}
                className={cn(
                  "relative flex items-center justify-center border-2 transition-colors",
                  nodeSize,
                  progressTrackerRadiusClassName(radius, "pill"),
                  stepNodeBorder(step.status),
                  stepNodeBg(step.status),
                  clickable && "cursor-pointer hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  !clickable && "cursor-default",
                )}
              >
                {step.status === "active" && (
                  <span className="absolute inset-0 animate-ping opacity-30 rounded-full bg-primary" />
                )}
                <span className="relative z-10">
                  {step.icon ? (
                    <step.icon className={iconSize} />
                  ) : (
                    stepStatusIcon(step.status, iconSize)
                  )}
                </span>
              </button>

              {(step.label || step.description) && (
                <div
                  className={cn(
                    "min-w-0",
                    isHorizontal ? "mt-1.5 text-center" : "ml-3",
                  )}
                >
                  <p
                    className={cn(
                      "font-medium leading-tight truncate",
                      labelSize,
                      stepLabelColor(step.status),
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p
                      className={cn(
                        "leading-tight truncate text-muted-foreground",
                        descSize,
                      )}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {showConnectors && !isLast && (
              <div
                className={cn(
                  isHorizontal
                    ? "flex items-center self-center"
                    : "flex flex-col items-center",
                  isHorizontal
                    ? cn(
                        "h-0.5",
                        density === "compact" ? "w-8" : density === "spacious" ? "w-16" : "w-12",
                      )
                    : cn(
                        "w-0.5",
                        density === "compact" ? "h-5" : density === "spacious" ? "h-10" : "h-7",
                      ),
                  stepConnectorClass(step.status, resolvedSteps[index + 1]?.status),
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function stepStatusIcon(status: StepStatus, iconSize: string): React.ReactNode {
  switch (status) {
    case "complete":
      return <Check className={cn("text-white", iconSize)} />
    case "active":
      return <Circle className={cn("text-white fill-current", iconSize)} />
    case "error":
      return <X className={cn("text-white", iconSize)} />
    case "pending":
      return <Circle className={cn("text-muted-foreground/40", iconSize)} />
  }
}

function stepNodeBorder(status: StepStatus): string {
  switch (status) {
    case "complete":
      return "border-emerald-500 dark:border-emerald-400"
    case "active":
      return "border-primary"
    case "error":
      return "border-red-500 dark:border-red-400"
    case "pending":
      return "border-dashed border-muted-foreground/30"
  }
}

function stepNodeBg(status: StepStatus): string {
  switch (status) {
    case "complete":
      return "bg-emerald-500 dark:bg-emerald-400"
    case "active":
      return "bg-primary text-primary-foreground"
    case "error":
      return "bg-red-500 dark:bg-red-400"
    case "pending":
      return "bg-transparent"
  }
}

function stepLabelColor(status: StepStatus): string {
  switch (status) {
    case "complete":
      return "text-emerald-600 dark:text-emerald-400"
    case "active":
      return "text-foreground"
    case "error":
      return "text-red-600 dark:text-red-400"
    case "pending":
      return "text-muted-foreground"
  }
}

function stepConnectorClass(fromStatus: StepStatus, nextStatus?: StepStatus): string {
  if (fromStatus === "complete") return "bg-emerald-400 dark:bg-emerald-500/40"
  if (fromStatus === "active") return "border-dashed border-primary/40 bg-transparent border-t border-b"
  if (fromStatus === "error") return "bg-red-300 dark:bg-red-500/30"
  return "border-dashed border-muted-foreground/20 bg-transparent border-t border-b"
}

function trackerRootClassName(appearance: LemmaProgressTrackerAppearance): string {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}
