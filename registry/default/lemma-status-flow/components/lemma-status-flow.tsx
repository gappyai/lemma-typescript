"use client"

import * as React from "react"
import {
  Check,
  ChevronRight,
  Circle,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUpdateRecord, useFunctionRun } from "lemma-sdk/react"
import type { LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { enumPillClasses, type EnumColorMap } from "./status-flow-enum-utils"
import {
  statusFlowRadiusClassName,
  type LemmaStatusFlowAppearance,
  type LemmaStatusFlowDensity,
  type LemmaStatusFlowRadius,
} from "./status-flow-style-utils"

export type { LemmaStatusFlowAppearance, LemmaStatusFlowDensity, LemmaStatusFlowRadius } from "./status-flow-style-utils"
export type { EnumColorMap } from "./status-flow-enum-utils"

export interface StatusTransition {
  from: string
  to: string
  label?: string
  icon?: React.ComponentType<{ className?: string }>
  functionName?: string
}

export interface LemmaStatusFlowProps {
  client: LemmaClient
  podId?: string
  tableName?: string
  recordId?: string
  enabled?: boolean

  currentStatus: string
  statuses: string[]
  statusField?: string
  transitions?: StatusTransition[]
  onTransition?: (from: string, to: string) => void
  actionMode?: "direct" | "function"
  enumColorMap?: EnumColorMap

  orientation?: "horizontal" | "vertical"
  appearance?: LemmaStatusFlowAppearance
  density?: LemmaStatusFlowDensity
  radius?: LemmaStatusFlowRadius
  className?: string
}

export function LemmaStatusFlow({
  client,
  podId,
  tableName,
  recordId,
  enabled = true,

  currentStatus,
  statuses,
  statusField = "status",
  transitions,
  onTransition,
  actionMode = "direct",
  enumColorMap,

  orientation = "horizontal",
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  className,
}: LemmaStatusFlowProps) {
  const [transitioning, setTransitioning] = React.useState<string | null>(null)

  const updateRecord = useUpdateRecord({
    client,
    podId,
    tableName: tableName ?? "",
    recordId: recordId ?? null,
    enabled: enabled && !!tableName && !!recordId,
  })

  const functionRun = useFunctionRun({
    client,
    podId,
  })

  if (!statuses || statuses.length === 0) {
    return null
  }

  const currentIndex = statuses.indexOf(currentStatus)

  const allowedTransitions = React.useMemo(() => {
    if (!transitions || transitions.length === 0) return null
    const map = new Map<string, StatusTransition[]>()
    for (const t of transitions) {
      const list = map.get(t.from) ?? []
      list.push(t)
      map.set(t.from, list)
    }
    return map
  }, [transitions])

  const isTransitionAllowed = (targetStatus: string): boolean => {
    if (!allowedTransitions) {
      if (currentIndex < 0) return false
      const targetIdx = statuses.indexOf(targetStatus)
      return targetIdx === currentIndex + 1
    }
    const fromTransitions = allowedTransitions.get(currentStatus)
    if (!fromTransitions) return false
    return fromTransitions.some((t) => t.to === targetStatus)
  }

  const getTransitionFor = (targetStatus: string): StatusTransition | undefined => {
    if (!allowedTransitions) {
      if (currentIndex >= 0 && statuses.indexOf(targetStatus) === currentIndex + 1) {
        return { from: currentStatus, to: targetStatus }
      }
      return undefined
    }
    return allowedTransitions.get(currentStatus)?.find((t) => t.to === targetStatus)
  }

  const handleTransition = async (targetStatus: string) => {
    const transition = getTransitionFor(targetStatus)
    if (!transition) return

    setTransitioning(targetStatus)
    try {
      if (actionMode === "function" && transition.functionName) {
        await functionRun.start({
          id: recordId,
          record_id: recordId,
          from: currentStatus,
          to: targetStatus,
          [statusField]: targetStatus,
        }, { functionName: transition.functionName })
      } else if (actionMode === "direct" && tableName && recordId) {
        await updateRecord.update({ [statusField]: targetStatus })
      }
      onTransition?.(currentStatus, targetStatus)
    } finally {
      setTransitioning(null)
    }
  }

  const nodeSize = density === "compact" ? "h-6 min-w-6 px-2 text-[11px]" : density === "spacious" ? "h-8 min-w-8 px-3 text-xs" : "h-7 min-w-7 px-2.5 text-xs"
  const connectorGap = density === "compact" ? "gap-1" : density === "spacious" ? "gap-2.5" : "gap-1.5"
  const isHorizontal = orientation === "horizontal"

  const getNodeState = (status: string, index: number): "past" | "current" | "future" => {
    if (currentIndex < 0) return status === currentStatus ? "current" : "future"
    if (index < currentIndex) return "past"
    if (index === currentIndex) return "current"
    return "future"
  }

  const renderNode = (status: string, index: number) => {
    const state = getNodeState(status, index)
    const canTransition = isTransitionAllowed(status)
    const isTransitioningTo = transitioning === status
    const pillBase = enumPillClasses(status, statuses, enumColorMap)

    const Icon = canTransition ? getTransitionFor(status)?.icon : undefined

    const nodeContent = (
      <span
        className={cn(
          "inline-flex items-center justify-center gap-1 font-medium transition-all",
          statusFlowRadiusClassName(radius, "pill"),
          nodeSize,
          state === "past" && "bg-muted/60 text-muted-foreground line-through decoration-muted-foreground/40",
          state === "current" && [
            pillBase,
            "ring-2 ring-primary/30 ring-offset-1 ring-offset-background font-semibold",
          ],
          state === "future" && [
            "border border-dashed border-border/60 bg-transparent text-muted-foreground",
          ],
          canTransition && "cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-primary/20 hover:ring-offset-1",
          isTransitioningTo && "opacity-70",
        )}
        onClick={canTransition && !isTransitioningTo ? () => void handleTransition(status) : undefined}
        role={canTransition ? "button" : undefined}
        tabIndex={canTransition ? 0 : undefined}
        onKeyDown={canTransition ? (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            void handleTransition(status)
          }
        } : undefined}
      >
        {state === "past" && <Check className="size-3 shrink-0" />}
        {state === "current" && <Circle className="size-2.5 shrink-0 fill-current" />}
        {isTransitioningTo && <Loader2 className="size-3 shrink-0 animate-spin" />}
        {!isTransitioningTo && Icon && <Icon className="size-3 shrink-0" />}
        <span className="truncate">{status}</span>
      </span>
    )

    const transition = getTransitionFor(status)

    if (canTransition && transition?.label) {
      return (
        <Tooltip key={status}>
          <TooltipTrigger>{nodeContent}</TooltipTrigger>
          <TooltipContent side={isHorizontal ? "top" : "right"} className="text-xs">
            {transition.label}
          </TooltipContent>
        </Tooltip>
      )
    }

    return <React.Fragment key={status}>{nodeContent}</React.Fragment>
  }

  const renderConnector = (fromIndex: number) => {
    const fromState = getNodeState(statuses[fromIndex], fromIndex)
    const toState = getNodeState(statuses[fromIndex + 1], fromIndex + 1)

    const isPastToCurrent = fromState === "past" && toState === "current"
    const isCurrentToFuture = fromState === "current" && toState === "future"
    const isPastToPast = fromState === "past" && toState === "past"

    const connectorClass = cn(
      isHorizontal ? "h-px min-w-4 flex-1" : "w-px min-h-4 flex-1",
      isPastToPast && "bg-emerald-400/60 dark:bg-emerald-500/30",
      isPastToCurrent && "bg-emerald-400/60 dark:bg-emerald-500/30",
      isCurrentToFuture && "border-dashed border-border/40 bg-transparent",
      !(isPastToPast || isPastToCurrent || isCurrentToFuture) && "bg-border/30",
    )

    const activeDot = isPastToCurrent && (
      <span className={cn(
        "shrink-0 rounded-full bg-primary size-1.5",
        statusFlowRadiusClassName(radius, "pill"),
      )} />
    )

    if (isCurrentToFuture) {
      return (
        <span
          key={`connector-${fromIndex}`}
          className={cn(
            "border-dashed",
            isHorizontal ? "border-t border-border/40 min-w-4 flex-1" : "border-l border-border/40 min-h-4 flex-1",
          )}
        />
      )
    }

    return (
      <React.Fragment key={`connector-${fromIndex}`}>
        {activeDot}
        <span className={connectorClass} />
      </React.Fragment>
    )
  }

  const isLoading = updateRecord.isSubmitting || (actionMode === "function" && functionRun.isPolling)

  return (
    <TooltipProvider delay={300}>
      <div
        data-appearance={appearance}
        data-density={density}
        data-radius={radius}
        className={cn(
          "lemma-status-flow",
          isHorizontal ? "flex flex-row items-center" : "flex flex-col items-start",
          connectorGap,
          statusFlowRootClassName(appearance),
          density === "compact" ? "p-1.5" : density === "spacious" ? "p-3" : "p-2",
          className,
        )}
      >
        {isLoading && (
          <Loader2 className="size-3 animate-spin text-muted-foreground shrink-0" />
        )}
        {statuses.map((status, index) => (
          <React.Fragment key={status}>
            {renderNode(status, index)}
            {index < statuses.length - 1 && renderConnector(index)}
          </React.Fragment>
        ))}
      </div>
    </TooltipProvider>
  )
}

export function LemmaStatusFlowSkeleton({
  count = 4,
  orientation = "horizontal",
  density = "comfortable",
  className,
}: {
  count?: number
  orientation?: "horizontal" | "vertical"
  density?: LemmaStatusFlowDensity
  className?: string
}) {
  const isHorizontal = orientation === "horizontal"
  const pillH = density === "compact" ? "h-5" : density === "spacious" ? "h-7" : "h-6"
  const pillW = density === "compact" ? "w-16" : density === "spacious" ? "w-24" : "w-20"

  return (
    <div
      className={cn(
        isHorizontal ? "flex flex-row items-center gap-2" : "flex flex-col items-start gap-2",
        density === "compact" ? "p-1.5" : density === "spacious" ? "p-3" : "p-2",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>
          <Skeleton className={cn(pillH, pillW, "rounded-full")} />
          {i < count - 1 && (
            <Skeleton className={cn(isHorizontal ? "h-px w-4" : "w-px h-4")} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function statusFlowRootClassName(appearance: LemmaStatusFlowAppearance) {
  if (appearance === "contained") return "bg-card border border-border/30"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}
