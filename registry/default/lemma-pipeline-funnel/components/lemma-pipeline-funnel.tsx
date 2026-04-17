"use client"

import * as React from "react"
import {
  AlertCircle,
  ArrowRight,
  ArrowDown,
  Filter,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRecords, useFunctionRun } from "lemma-sdk/react"
import type { LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { ENUM_PALETTE, type EnumColorMap, type EnumColorEntry } from "./pipeline-funnel-enum-utils"
import {
  pipelineFunnelRadiusClassName,
  type LemmaPipelineFunnelAppearance,
  type LemmaPipelineFunnelDensity,
  type LemmaPipelineFunnelRadius,
} from "./pipeline-funnel-style-utils"

export type {
  LemmaPipelineFunnelAppearance,
  LemmaPipelineFunnelDensity,
  LemmaPipelineFunnelRadius,
} from "./pipeline-funnel-style-utils"
export type { EnumColorMap, EnumColorEntry } from "./pipeline-funnel-enum-utils"

export interface PipelineStage {
  value: string
  label?: string
  color?: string
}

interface StageData {
  value: string
  label: string
  count: number
  metric: number | null
  conversionRate: number | null
  colorClasses: { bg: string; text: string }
  records: Record<string, unknown>[]
}

export interface LemmaPipelineFunnelProps {
  client: LemmaClient
  podId?: string
  tableName: string
  enabled?: boolean

  stageField: string
  stages: PipelineStage[]
  metricField?: string
  showConversionRates?: boolean
  aggregationMode?: "client" | "function"
  aggregateFunctionName?: string

  onStageClick?: (stage: string, records: Record<string, unknown>[]) => void
  orientation?: "horizontal" | "vertical"
  enumColorMap?: EnumColorMap

  appearance?: LemmaPipelineFunnelAppearance
  density?: LemmaPipelineFunnelDensity
  radius?: LemmaPipelineFunnelRadius
  title?: React.ReactNode
  className?: string
}

function resolveColorClasses(
  stage: PipelineStage,
  index: number,
  enumColorMap?: EnumColorMap,
): { bg: string; text: string } {
  if (stage.color) {
    const paletteEntry = ENUM_PALETTE.find(
      (p) => p.bg === stage.color || p.text === stage.color,
    )
    if (paletteEntry) return { bg: paletteEntry.bg, text: paletteEntry.text }
    return { bg: stage.color, text: "text-foreground" }
  }
  if (enumColorMap?.[stage.value]) {
    return enumColorMap[stage.value]
  }
  return ENUM_PALETTE[index % ENUM_PALETTE.length]
}

function formatCount(n: number): string {
  return n.toLocaleString()
}

function formatMetric(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function computeConversionRates(data: StageData[]) {
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      data[i].conversionRate = data[i].count > 0 ? 100 : null
    } else if (data[i - 1].count > 0) {
      data[i].conversionRate = (data[i].count / data[i - 1].count) * 100
    } else {
      data[i].conversionRate = null
    }
  }
}

function mapFunctionOutputToStageData(
  output: unknown,
  stages: PipelineStage[],
  stageField: string,
  metricField: string | undefined,
  enumColorMap: EnumColorMap | undefined,
): StageData[] {
  if (!Array.isArray(output)) return []
  return stages.map((stage, i) => {
    const match = (output as Record<string, unknown>[]).find(
      (row) =>
        row.stage === stage.value ||
        row[stageField] === stage.value ||
        row.value === stage.value ||
        row.name === stage.value,
    )
    const count = match
      ? Number(match.count ?? match.total ?? 0)
      : 0
    const metric = match && metricField
      ? Number(match.metric ?? match.sum ?? match[metricField] ?? 0)
      : null
    return {
      value: stage.value,
      label: stage.label ?? stage.value,
      count: Number.isNaN(count) ? 0 : count,
      metric: metric !== null && !Number.isNaN(metric) ? metric : null,
      conversionRate: null,
      colorClasses: resolveColorClasses(stage, i, enumColorMap),
      records: [],
    }
  })
}

export function LemmaPipelineFunnel({
  client,
  podId,
  tableName,
  enabled = true,
  stageField,
  stages,
  metricField,
  showConversionRates = false,
  aggregationMode = "client",
  aggregateFunctionName,
  onStageClick,
  orientation = "horizontal",
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  className,
}: LemmaPipelineFunnelProps) {
  const isClientAgg = aggregationMode === "client"
  const isFnAgg = aggregationMode === "function" && !!aggregateFunctionName

  const recordsState = useRecords({
    client,
    podId,
    tableName,
    enabled: isClientAgg && enabled,
    limit: 5000,
  })

  const fnRun = useFunctionRun({
    client,
    podId,
    functionName: isFnAgg ? aggregateFunctionName : undefined,
  })

  const [fnStageData, setFnStageData] = React.useState<StageData[] | null>(null)
  const [fnLoading, setFnLoading] = React.useState(false)
  const [fnError, setFnError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (!isFnAgg || !aggregateFunctionName || !enabled) return
    let cancelled = false
    setFnLoading(true)
    setFnError(null)
    const input: Record<string, unknown> = {
      table: tableName,
      stage_field: stageField,
    }
    if (metricField) input.metric_field = metricField
    fnRun.start(input).then((res) => {
      if (cancelled) return
      const data = mapFunctionOutputToStageData(
        res.output_data,
        stages,
        stageField,
        metricField,
        enumColorMap,
      )
      computeConversionRates(data)
      setFnStageData(data)
    }).catch((err) => {
      if (cancelled) return
      setFnError(err instanceof Error ? err : new Error(String(err)))
    }).finally(() => {
      if (!cancelled) setFnLoading(false)
    })
    return () => { cancelled = true }
  }, [isFnAgg, aggregateFunctionName, enabled, tableName, stageField, metricField])

  const clientStageData = React.useMemo<StageData[]>(() => {
    if (!isClientAgg) return []
    const records = recordsState.records
    const grouped = new Map<string, Record<string, unknown>[]>()
    for (const rec of records) {
      const stageVal = String(rec[stageField] ?? "")
      if (!stageVal) continue
      const existing = grouped.get(stageVal) ?? []
      existing.push(rec)
      grouped.set(stageVal, existing)
    }
    const data: StageData[] = stages.map((stage, i) => {
      const stageRecords = grouped.get(stage.value) ?? []
      const count = stageRecords.length
      let metric: number | null = null
      if (metricField) {
        metric = stageRecords.reduce((acc, rec) => {
          const v = Number(rec[metricField] ?? 0)
          return acc + (Number.isNaN(v) ? 0 : v)
        }, 0)
      }
      return {
        value: stage.value,
        label: stage.label ?? stage.value,
        count,
        metric,
        conversionRate: null,
        colorClasses: resolveColorClasses(stage, i, enumColorMap),
        records: stageRecords,
      }
    })
    computeConversionRates(data)
    return data
  }, [isClientAgg, recordsState.records, stageField, stages, metricField, enumColorMap])

  const stageData = isFnAgg ? fnStageData : clientStageData
  const isLoading = isFnAgg ? fnLoading : recordsState.isLoading
  const error = isFnAgg ? fnError : recordsState.error

  const maxCount = React.useMemo(
    () => Math.max(1, ...(stageData ?? []).map((s) => s.count)),
    [stageData],
  )

  const handleRetry = () => {
    if (isFnAgg) {
      setFnLoading(true)
      setFnError(null)
      const input: Record<string, unknown> = {
        table: tableName,
        stage_field: stageField,
      }
      if (metricField) input.metric_field = metricField
      fnRun.start(input).then((res) => {
        const data = mapFunctionOutputToStageData(
          res.output_data,
          stages,
          stageField,
          metricField,
          enumColorMap,
        )
        computeConversionRates(data)
        setFnStageData(data)
      }).catch((err) => {
        setFnError(err instanceof Error ? err : new Error(String(err)))
      }).finally(() => {
        setFnLoading(false)
      })
    } else {
      recordsState.refresh()
    }
  }

  const isHorizontal = orientation === "horizontal"

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn(
        "lemma-pipeline-funnel flex flex-col",
        funnelRootClassName(appearance),
        pipelineFunnelRadiusClassName(radius, "surface"),
        className,
      )}
    >
      <div
        className={cn(
          "shrink-0",
          funnelHeaderClassName(appearance),
          density === "compact" ? "px-3 py-2" : density === "spacious" ? "px-5 py-4" : "px-4 py-3",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground",
                pipelineFunnelRadiusClassName(radius, "control"),
              )}
            >
              <Filter className="size-3.5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {title ?? "Pipeline"}
              </h1>
              {!isLoading && stageData && (
                <p className="text-xs text-muted-foreground">
                  {stageData.reduce((acc, s) => acc + s.count, 0)} records
                  {" "}across {stageData.length} stages
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex-1 overflow-auto",
          density === "compact" ? "p-3" : density === "spacious" ? "p-5" : "p-4",
        )}
      >
        {error ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="size-5 text-destructive" />
            <p className="text-sm text-destructive">
              {error.message}
            </p>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="mr-2 size-3.5" />
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div
            className={cn(
              "flex",
              isHorizontal ? "flex-row items-stretch" : "flex-col items-center",
              density === "compact" ? "gap-1" : density === "spacious" ? "gap-3" : "gap-2",
            )}
          >
            {stages.map((_, i) => (
              <div
                key={i}
                className={cn(isHorizontal ? "flex-1" : "w-full")}
              >
                <Skeleton
                  className={cn(
                    "h-28 w-full",
                    pipelineFunnelRadiusClassName(radius, "control"),
                  )}
                />
              </div>
            ))}
          </div>
        ) : !stageData || stageData.every((s) => s.count === 0) ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <Filter className="size-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No records in pipeline
            </p>
          </div>
        ) : (
          <TooltipProvider>
            <div
              className={cn(
                "flex",
                isHorizontal ? "flex-row items-stretch" : "flex-col items-center",
                density === "compact" ? "gap-1" : density === "spacious" ? "gap-3" : "gap-2",
              )}
            >
              {stageData.map((stage, i) => {
                const widthPct = Math.max(
                  (stage.count / maxCount) * 100,
                  20,
                )
                const ArrowIcon = isHorizontal ? ArrowRight : ArrowDown
                const stageRecords = isClientAgg
                  ? clientStageData.find((s) => s.value === stage.value)?.records ?? []
                  : []

                return (
                  <React.Fragment key={stage.value}>
                    <Tooltip>
                      <TooltipTrigger
                          onClick={() => onStageClick?.(stage.value, stageRecords)}
                          className={cn(
                            "group relative flex flex-col items-center justify-center text-center transition-opacity",
                            onStageClick && "cursor-pointer hover:opacity-80",
                            !onStageClick && "cursor-default",
                            pipelineFunnelRadiusClassName(radius, "control"),
                            stage.colorClasses.bg,
                            stage.colorClasses.text,
                            "border border-border/30",
                            density === "compact"
                              ? "py-2 px-3"
                              : density === "spacious"
                                ? "py-4 px-5"
                                : "py-3 px-4",
                          )}
                          style={
                            isHorizontal
                              ? { flex: `${widthPct} 0 0`, minWidth: "80px" }
                              : { width: `${widthPct}%`, minWidth: "120px" }
                          }
                        >
                          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                            {stage.label}
                          </span>
                          <span
                            className={cn(
                              "font-bold tracking-tight",
                              density === "compact"
                                ? "text-lg"
                                : density === "spacious"
                                  ? "text-3xl"
                                  : "text-2xl",
                            )}
                          >
                            {formatCount(stage.count)}
                          </span>
                          {stage.metric !== null && (
                            <span className="text-xs font-medium opacity-70">
                              {formatMetric(stage.metric)}
                            </span>
                          )}
                          {showConversionRates &&
                            stage.conversionRate !== null && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "mt-1 text-[10px] font-semibold",
                                  stage.conversionRate >= 80
                                    ? "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                                    : stage.conversionRate >= 50
                                      ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
                                      : "border-red-300 text-red-700 dark:border-red-700 dark:text-red-300",
                                )}
                              >
                                {stage.conversionRate.toFixed(0)}%
                              </Badge>
                            )}
                      </TooltipTrigger>
                      <TooltipContent
                        side={isHorizontal ? "bottom" : "right"}
                      >
                        <p>
                          {stage.label}: {formatCount(stage.count)} records
                          {stage.metric !== null &&
                            ` | ${formatMetric(stage.metric)}`}
                          {showConversionRates &&
                            stage.conversionRate !== null &&
                            ` | ${stage.conversionRate.toFixed(1)}% conversion`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    {i < stageData.length - 1 && (
                      <div
                        className={cn(
                          "flex items-center justify-center text-muted-foreground/50",
                          isHorizontal ? "px-0.5" : "py-0.5",
                        )}
                      >
                        <ArrowIcon
                          className={
                            density === "compact" ? "size-3" : "size-4"
                          }
                        />
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}

function funnelRootClassName(appearance: LemmaPipelineFunnelAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function funnelHeaderClassName(appearance: LemmaPipelineFunnelAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}
