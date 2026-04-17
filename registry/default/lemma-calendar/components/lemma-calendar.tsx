"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RefreshCw,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRecords, useTable } from "lemma-sdk/react"
import type { LemmaClient, ColumnSchema } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { enumPillClasses, type EnumColorMap } from "./calendar-enum-utils"
import {
  calendarRadiusClassName,
  type LemmaCalendarAppearance,
  type LemmaCalendarDensity,
  type LemmaCalendarRadius,
} from "./calendar-style-utils"

export type { LemmaCalendarAppearance, LemmaCalendarDensity, LemmaCalendarRadius } from "./calendar-style-utils"

type CalendarView = "month" | "week"

export interface LemmaCalendarProps {
  client: LemmaClient
  podId?: string
  tableName: string
  enabled?: boolean

  dateField: string
  endDateField?: string
  titleField?: string
  colorField?: string
  hiddenFields?: string[]
  enumColorMap?: EnumColorMap

  defaultView?: CalendarView
  appearance?: LemmaCalendarAppearance
  density?: LemmaCalendarDensity
  radius?: LemmaCalendarRadius

  onRecordClick?: (record: Record<string, unknown>) => void
  onCreateClick?: (date?: Date) => void
  title?: React.ReactNode
  headerActions?: React.ReactNode
  className?: string
}

export function LemmaCalendar({
  client,
  podId,
  tableName,
  enabled = true,
  dateField,
  endDateField,
  titleField,
  colorField,
  hiddenFields = [],
  enumColorMap,
  defaultView = "month",
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  onRecordClick,
  onCreateClick,
  title,
  headerActions,
  className,
}: LemmaCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [view, setView] = React.useState<CalendarView>(defaultView)

  const tableState = useTable({ client, podId, tableName, enabled })
  const table = tableState.table

  const dateColumn = React.useMemo(
    () => table?.columns.find((c) => c.name === dateField),
    [table, dateField],
  )
  const isDateOnly = dateColumn?.type === "DATE"

  const formatDateFilter = React.useCallback((d: Date) => {
    if (isDateOnly) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    }
    return d.toISOString()
  }, [isDateOnly])

  const dateRange = React.useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    if (view === "week") {
      const day = currentDate.getDay()
      const start = new Date(year, month, currentDate.getDate() - day)
      const end = new Date(year, month, currentDate.getDate() + (6 - day))
      return { start, end }
    }
    const start = new Date(year, month, 1)
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(year, month + 1, 0)
    end.setDate(end.getDate() + (6 - end.getDay()))
    return { start, end }
  }, [currentDate, view])

  const recordsState = useRecords({
    client,
    podId,
    tableName,
    enabled: !!table && enabled,
    filters: [
      { field: dateField, op: "gte", value: formatDateFilter(dateRange.start) },
      { field: dateField, op: "lte", value: formatDateFilter(dateRange.end) },
    ],
    limit: 500,
  })
  const endColumn = React.useMemo(
    () => endDateField ? table?.columns.find((c) => c.name === endDateField) : undefined,
    [table, endDateField],
  )
  const titleColumn = React.useMemo(
    () => titleField ? table?.columns.find((c) => c.name === titleField) : undefined,
    [table, titleField],
  )
  const colorColumn = React.useMemo(
    () => colorField ? table?.columns.find((c) => c.name === colorField) : undefined,
    [table, colorField],
  )

  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, Record<string, unknown>[]>()
    for (const record of recordsState.records) {
      const startVal = record[dateField]
      if (startVal == null) continue
      const startDate = new Date(String(startVal))
      if (Number.isNaN(startDate.getTime())) continue

      const endVal = endDateField ? record[endDateField] : null
      const endDate = endVal ? new Date(String(endVal)) : null

      const d = new Date(startDate)
      while (d <= (endDate && !Number.isNaN(endDate.getTime()) ? endDate : startDate)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(record)
        d.setDate(d.getDate() + 1)
        if (!endDateField) break
      }
    }
    return map
  }, [recordsState.records, dateField, endDateField])

  const calendarDays = React.useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDay = new Date(year, month, 1 - firstDay.getDay())
    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      days.push(new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + i))
    }
    return days
  }, [currentDate])

  const navigatePrev = () => {
    setCurrentDate((d) => {
      if (view === "week") return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7)
      return new Date(d.getFullYear(), d.getMonth() - 1, 1)
    })
  }
  const navigateNext = () => {
    setCurrentDate((d) => {
      if (view === "week") return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
      return new Date(d.getFullYear(), d.getMonth() + 1, 1)
    })
  }
  const navigateToday = () => setCurrentDate(new Date())

  const today = new Date()
  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  const isCurrentMonth = (d: Date) => d.getMonth() === currentDate.getMonth()

  const getEventTitle = (record: Record<string, unknown>) => {
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

  const getEventColor = (record: Record<string, unknown>) => {
    if (!colorColumn || !colorColumn.options?.length) return undefined
    const v = record[colorColumn.name]
    if (v == null) return undefined
    return enumPillClasses(String(v), colorColumn.options, enumColorMap)
  }

  if (tableState.isLoading) {
    return (
      <div className={cn("p-6", calendarRootClassName(appearance))}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-calendar flex h-full min-h-0 flex-col", calendarRootClassName(appearance), className)}
    >
      <div className={cn("shrink-0", calendarHeaderClassName(appearance))}>
        <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between", calendarToolbarClassName(density))}>
          <div className="min-w-0 flex items-center gap-3">
            <span className={cn("flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground", calendarRadiusClassName(radius, "control"))}>
              <CalendarDays className="size-3.5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {title ?? (table?.name ?? tableName)}
              </h1>
              <p className="text-xs text-muted-foreground">
                {currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("flex items-center gap-0.5 border border-border/50 bg-muted/30 p-0.5", calendarRadiusClassName(radius, "control"))}>
              <button
                onClick={() => setView("month")}
                className={cn(
                  "px-2 py-1 text-xs transition-colors",
                  calendarRadiusClassName(radius, "control"),
                  view === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-card/50",
                )}
              >
                Month
              </button>
              <button
                onClick={() => setView("week")}
                className={cn(
                  "px-2 py-1 text-xs transition-colors",
                  calendarRadiusClassName(radius, "control"),
                  view === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-card/50",
                )}
              >
                Week
              </button>
            </div>

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
              <Button size="sm" onClick={() => onCreateClick()} className="h-8 gap-2 text-xs">
                <Plus className="size-3.5" />
                New
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-auto", calendarContentClassName(density))}>
        {recordsState.error ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">{recordsState.error.message}</p>
            <Button variant="outline" size="sm" onClick={() => recordsState.refresh()}>
              <RefreshCw className="mr-2 size-3.5" />
              Retry
            </Button>
          </div>
        ) : (
          <div className={cn("grid grid-cols-7", calendarGridClassName(appearance))}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className={cn(
                  "border-b border-border/30 text-center text-xs font-medium text-muted-foreground",
                  density === "compact" ? "py-1.5" : density === "spacious" ? "py-3" : "py-2",
                )}
              >
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => {
              const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`
              const dayEvents = eventsByDate.get(key) ?? []
              const today = isToday(day)
              const outside = !isCurrentMonth(day)

              return (
                <div
                  key={index}
                  className={cn(
                    "group min-h-0 border-b border-r border-border/20 transition-colors",
                    outside && "bg-muted/10",
                    today && "bg-primary/5",
                    density === "compact" ? "min-h-20 p-1" : density === "spacious" ? "min-h-32 p-2.5" : "min-h-24 p-1.5",
                    appearance === "borderless" && "border-border/10",
                    appearance === "minimal" && "border-border/5",
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center text-xs",
                        today
                          ? "rounded-full bg-primary font-semibold text-primary-foreground"
                          : outside
                            ? "text-muted-foreground/50"
                            : "text-foreground",
                        density === "compact" && "size-5 text-[11px]",
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {onCreateClick && (
                      <button
                        type="button"
                        onClick={() => onCreateClick(day)}
                        className="size-5 flex items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                      >
                        <Plus className="size-3" />
                      </button>
                    )}
                  </div>
                  <div className={cn("mt-0.5 flex flex-col gap-0.5 overflow-hidden", density === "compact" ? "max-h-12" : density === "spacious" ? "max-h-24" : "max-h-16")}>
                    {dayEvents.slice(0, 3).map((record, ei) => {
                      const evTitle = getEventTitle(record)
                      const evColor = getEventColor(record)
                      return (
                        <button
                          key={ei}
                          type="button"
                          onClick={() => onRecordClick?.(record)}
                          className={cn(
                            "truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition-colors hover:opacity-80",
                            evColor ?? "bg-primary/10 text-primary",
                          )}
                        >
                          {evTitle}
                        </button>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <span className="px-1.5 text-[10px] text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function calendarRootClassName(appearance: LemmaCalendarAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function calendarHeaderClassName(appearance: LemmaCalendarAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

function calendarToolbarClassName(density: LemmaCalendarDensity) {
  if (density === "compact") return "gap-2 px-3 py-2"
  if (density === "spacious") return "gap-4 px-5 py-4"
  return "gap-3 px-4 py-3"
}

function calendarContentClassName(density: LemmaCalendarDensity) {
  if (density === "compact") return "p-2"
  if (density === "spacious") return "p-5"
  return "p-4"
}

function calendarGridClassName(appearance: LemmaCalendarAppearance) {
  if (appearance === "borderless" || appearance === "minimal") return "border-0"
  return "border border-border/40"
}
