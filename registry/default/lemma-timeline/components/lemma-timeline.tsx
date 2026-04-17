"use client"

import * as React from "react"
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  GanttChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRecords, useTable } from "lemma-sdk/react"
import type { LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { enumPillClasses, type EnumColorMap } from "./timeline-enum-utils"
import {
  timelineRadiusClassName,
  type LemmaTimelineAppearance,
  type LemmaTimelineDensity,
  type LemmaTimelineRadius,
} from "./timeline-style-utils"

export type { LemmaTimelineAppearance, LemmaTimelineDensity, LemmaTimelineRadius } from "./timeline-style-utils"

export interface LemmaTimelineProps {
  client: LemmaClient
  podId?: string
  tableName: string
  enabled?: boolean

  startDateField: string
  endDateField: string
  titleField?: string
  colorField?: string
  progressField?: string
  assigneeField?: string
  enumColorMap?: EnumColorMap

  appearance?: LemmaTimelineAppearance
  density?: LemmaTimelineDensity
  radius?: LemmaTimelineRadius

  onRecordClick?: (record: Record<string, unknown>) => void
  onCreateClick?: () => void
  title?: React.ReactNode
  headerActions?: React.ReactNode
  className?: string
}

export function LemmaTimeline({
  client,
  podId,
  tableName,
  enabled = true,
  startDateField,
  endDateField,
  titleField,
  colorField,
  progressField,
  assigneeField,
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  onRecordClick,
  onCreateClick,
  title,
  headerActions,
  className,
}: LemmaTimelineProps) {
  const [scrollDate, setScrollDate] = React.useState(() => new Date())

  const tableState = useTable({ client, podId, tableName, enabled })
  const table = tableState.table

  const startColumn = React.useMemo(
    () => table?.columns.find((c) => c.name === startDateField),
    [table, startDateField],
  )
  const endColumn = React.useMemo(
    () => table?.columns.find((c) => c.name === endDateField),
    [table, endDateField],
  )
  const isStartDateOnly = startColumn?.type === "DATE"
  const isEndDateOnly = endColumn?.type === "DATE"

  const formatDateFilter = React.useCallback((d: Date, dateOnly: boolean) => {
    if (dateOnly) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    }
    return d.toISOString()
  }, [])

  const dateRange = React.useMemo(() => {
    const start = new Date(scrollDate)
    start.setDate(start.getDate() - 15)
    const end = new Date(scrollDate)
    end.setDate(end.getDate() + 45)
    return { start, end }
  }, [scrollDate])

  const recordsState = useRecords({
    client,
    podId,
    tableName,
    enabled: !!table && enabled,
    filters: [
      { field: startDateField, op: "lte", value: formatDateFilter(dateRange.end, isStartDateOnly) },
      { field: endDateField, op: "gte", value: formatDateFilter(dateRange.start, isEndDateOnly) },
    ],
    limit: 500,
  })

  const titleColumn = React.useMemo(
    () => titleField ? table?.columns.find((c) => c.name === titleField) : undefined,
    [table, titleField],
  )
  const colorColumn = React.useMemo(
    () => colorField ? table?.columns.find((c) => c.name === colorField) : undefined,
    [table, colorField],
  )

  const { totalDays, dayOffsets, dayLabels, monthLabels } = React.useMemo(() => {
    const ms = dateRange.end.getTime() - dateRange.start.getTime()
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24))
    const offsets: number[] = []
    const labels: { key: string; label: string; isWeekend: boolean; isToday: boolean }[] = []
    const monthMap = new Map<string, { label: string; span: number }>()

    const today = new Date()
    for (let i = 0; i <= days; i++) {
      const d = new Date(dateRange.start)
      d.setDate(d.getDate() + i)
      offsets.push(i)
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`
      const monthLabel = d.toLocaleDateString(undefined, { month: "short", year: "numeric" })
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { label: monthLabel, span: 1 })
      } else {
        monthMap.get(monthKey)!.span++
      }
      labels.push({
        key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
        label: String(d.getDate()),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isToday: d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate(),
      })
    }
    return { totalDays: days + 1, dayOffsets: offsets, dayLabels: labels, monthLabels: Array.from(monthMap.entries()) }
  }, [dateRange])

  const barHeight = density === "compact" ? 24 : density === "spacious" ? 36 : 28
  const rowHeight = density === "compact" ? 32 : density === "spacious" ? 44 : 36

  const getRecordTitle = (record: Record<string, unknown>) => {
    if (titleColumn) {
      const v = record[titleColumn.name]
      if (v != null && v !== "") return String(v)
    }
    const primary = table?.columns.find((c) =>
      /title|name|label|subject|summary/i.test(c.name) && c.type === "TEXT"
    )
    if (primary) {
      const v = record[primary.name]
      if (v != null && v !== "") return String(v)
    }
    return "Untitled"
  }

  const getBarColor = (record: Record<string, unknown>) => {
    if (!colorColumn || !colorColumn.options?.length) return "bg-primary/80"
    const v = record[colorColumn.name]
    if (v == null) return "bg-primary/80"
    const classes = enumPillClasses(String(v), colorColumn.options, enumColorMap)
    const bgMatch = classes.match(/bg-\S+/)
    return bgMatch ? bgMatch[0].replace(/\/\d+$/, "/80") : "bg-primary/80"
  }

  const getProgress = (record: Record<string, unknown>) => {
    if (!progressField) return undefined
    const v = record[progressField]
    if (v == null) return undefined
    const n = typeof v === "number" ? v : Number(v)
    if (Number.isNaN(n)) return undefined
    return Math.max(0, Math.min(100, n))
  }

  const getAssignee = (record: Record<string, unknown>) => {
    if (!assigneeField) return undefined
    const v = record[assigneeField]
    if (v == null) return undefined
    return String(v)
  }

  const navigatePrev = () => setScrollDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 30))
  const navigateNext = () => setScrollDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 30))
  const navigateToday = () => setScrollDate(new Date())

  if (tableState.isLoading) {
    return (
      <div className={cn("p-6", timelineRootClassName(appearance))}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-5 w-40" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 mb-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-full rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-timeline flex h-full min-h-0 flex-col", timelineRootClassName(appearance), className)}
    >
      <div className={cn("shrink-0", timelineHeaderClassName(appearance))}>
        <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between", timelineToolbarClassName(density))}>
          <div className="min-w-0 flex items-center gap-3">
            <span className={cn("flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground", timelineRadiusClassName(radius, "control"))}>
              <GanttChart className="size-3.5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {title ?? (table?.name ?? tableName)}
              </h1>
              <p className="text-xs text-muted-foreground">
                {recordsState.records.length} records in view
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={navigatePrev}>
                <ChevronLeft />
              </Button>
              <Button variant="ghost" size="sm" onClick={navigateToday} className="text-xs">
                Today
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={navigateNext}>
                <ChevronRight />
              </Button>
            </div>

            {headerActions}

            {onCreateClick && (
              <Button size="sm" onClick={onCreateClick} className="h-8 gap-2 text-xs">
                <Plus className="size-3.5" />
                New
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-auto", timelineContentClassName(density))}>
        {recordsState.error ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">{recordsState.error.message}</p>
            <Button variant="outline" size="sm" onClick={() => recordsState.refresh()}>
              <RefreshCw className="mr-2 size-3.5" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="min-w-max">
            <div className="sticky top-0 z-10 border-b border-border/30 bg-card/95 backdrop-blur-md">
              <div className="flex">
                <div className={cn("shrink-0 border-r border-border/30 font-medium text-muted-foreground", density === "compact" ? "w-36 py-1 px-2 text-xs" : density === "spacious" ? "w-52 py-2 px-3 text-xs" : "w-44 py-1.5 px-3 text-xs")}>
                  Task
                </div>
                <div className="flex-1">
                  <div className="flex">
                    {monthLabels.map(([key, { label, span }]) => (
                      <div
                        key={key}
                        className="border-r border-border/20 px-1 py-1 text-[10px] font-semibold text-muted-foreground"
                        style={{ width: `${(span / totalDays) * 100}%`, minWidth: `${span * 28}px` }}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                  <div className="flex">
                    {dayLabels.map((d) => (
                      <div
                        key={d.key}
                        className={cn(
                          "border-r border-border/10 text-center text-[10px]",
                          d.isWeekend && "bg-muted/20 text-muted-foreground/50",
                          d.isToday && "bg-primary/10 font-semibold text-primary",
                          density === "compact" ? "w-7 py-0.5" : density === "spacious" ? "w-9 py-1" : "w-8 py-0.5",
                        )}
                      >
                        {d.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {recordsState.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : recordsState.records.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                No records in this time range
              </div>
            ) : (
              recordsState.records.map((record, index) => {
                const startVal = record[startDateField]
                const endVal = record[endDateField]
                if (startVal == null || endVal == null) return null

                const startDate = new Date(String(startVal))
                const endDate = new Date(String(endVal))
                if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null

                const startOffset = Math.max(0, Math.round((startDate.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)))
                const duration = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
                const leftPercent = (startOffset / totalDays) * 100
                const widthPercent = (duration / totalDays) * 100

                const barColor = getBarColor(record)
                const progress = getProgress(record)
                const assignee = getAssignee(record)
                const recordTitle = getRecordTitle(record)

                return (
                  <div
                    key={String(record[table?.primary_key_column ?? "id"] ?? index)}
                    className={cn(
                      "flex items-center border-b border-border/10 transition-colors hover:bg-muted/20",
                    )}
                    style={{ height: `${rowHeight}px` }}
                  >
                    <div className={cn("shrink-0 truncate border-r border-border/30 text-foreground", density === "compact" ? "w-36 px-2 text-xs" : density === "spacious" ? "w-52 px-3 text-xs" : "w-44 px-3 text-xs")}>
                      <button
                        type="button"
                        className="truncate hover:underline"
                        onClick={() => onRecordClick?.(record)}
                      >
                        {recordTitle}
                      </button>
                      {assignee && (
                        <span className="ml-1.5 text-muted-foreground">{assignee}</span>
                      )}
                    </div>
                    <div className="relative flex-1" style={{ height: `${rowHeight}px` }}>
                      <button
                        type="button"
                        onClick={() => onRecordClick?.(record)}
                        className={cn(
                          "absolute rounded transition-opacity hover:opacity-80",
                          barColor,
                        )}
                        style={{
                          top: `${(rowHeight - barHeight) / 2}px`,
                          left: `${leftPercent}%`,
                          width: `${Math.max(widthPercent, 1)}%`,
                          height: `${barHeight}px`,
                          minWidth: "4px",
                        }}
                      >
                        <div className="flex h-full items-center px-2 text-[11px] font-medium text-white truncate">
                          {progress != null && (
                            <div className="absolute inset-0 rounded bg-black/20" style={{ width: `${progress}%` }} />
                          )}
                          <span className="relative z-10 truncate">{recordTitle}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function timelineRootClassName(appearance: LemmaTimelineAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function timelineHeaderClassName(appearance: LemmaTimelineAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

function timelineToolbarClassName(density: LemmaTimelineDensity) {
  if (density === "compact") return "gap-2 px-3 py-2"
  if (density === "spacious") return "gap-4 px-5 py-4"
  return "gap-3 px-4 py-3"
}

function timelineContentClassName(density: LemmaTimelineDensity) {
  if (density === "compact") return "p-2"
  if (density === "spacious") return "p-5"
  return "p-4"
}
