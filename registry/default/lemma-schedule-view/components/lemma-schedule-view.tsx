"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRecords, useTable } from "lemma-sdk/react"
import type { LemmaClient, ColumnSchema } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { enumBarColor, autoBarColor, type EnumColorMap } from "./schedule-view-enum-utils"
import {
  scheduleViewRadiusClassName,
  scheduleViewRootClassName,
  scheduleViewHeaderClassName,
  scheduleViewToolbarClassName,
  scheduleViewContentClassName,
  scheduleViewPixelsPerSlot,
  scheduleViewTimeLabelClassName,
  scheduleViewGridBorderClassName,
  scheduleViewEventTextClassName,
  type LemmaScheduleViewAppearance,
  type LemmaScheduleViewDensity,
  type LemmaScheduleViewRadius,
} from "./schedule-view-style-utils"

export type { LemmaScheduleViewAppearance, LemmaScheduleViewDensity, LemmaScheduleViewRadius } from "./schedule-view-style-utils"
export type { EnumColorMap, EnumColorEntry } from "./schedule-view-enum-utils"

export interface ScheduleResource {
  id: string
  label: string
}

export interface LemmaScheduleViewProps {
  client: LemmaClient
  podId?: string
  tableName: string
  enabled?: boolean

  dateField: string
  startTimeField: string
  endTimeField: string
  titleField: string
  assigneeField?: string
  colorField?: string
  slotDuration?: number
  resources?: ScheduleResource[]
  resourceField?: string
  startHour?: number
  endHour?: number

  onSlotClick?: (date: Date, startTime: string, resourceId?: string) => void
  onEventClick?: (record: Record<string, unknown>) => void
  enumColorMap?: EnumColorMap

  appearance?: LemmaScheduleViewAppearance
  density?: LemmaScheduleViewDensity
  radius?: LemmaScheduleViewRadius
  title?: React.ReactNode
  className?: string
}

function formatTimeLabel(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`
}

function parseTimeField(value: unknown): { hours: number; minutes: number } | null {
  if (value == null) return null
  const str = String(value)
  const timeOnlyMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (timeOnlyMatch) {
    return { hours: parseInt(timeOnlyMatch[1], 10), minutes: parseInt(timeOnlyMatch[2], 10) }
  }
  const d = new Date(str)
  if (!Number.isNaN(d.getTime())) {
    return { hours: d.getHours(), minutes: d.getMinutes() }
  }
  return null
}

export function LemmaScheduleView({
  client,
  podId,
  tableName,
  enabled = true,
  dateField,
  startTimeField,
  endTimeField,
  titleField,
  assigneeField,
  colorField,
  slotDuration = 30,
  resources,
  resourceField,
  startHour: startHourProp = 8,
  endHour: endHourProp = 20,
  onSlotClick,
  onEventClick,
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  className,
}: LemmaScheduleViewProps) {
  const [currentDate, setCurrentDate] = React.useState(() => new Date())

  const startHour = startHourProp
  const endHour = endHourProp

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
    const start = new Date(currentDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(currentDate)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }, [currentDate])

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

  const titleColumn = React.useMemo(
    () => titleField ? table?.columns.find((c) => c.name === titleField) : undefined,
    [table, titleField],
  )
  const colorColumn = React.useMemo(
    () => colorField ? table?.columns.find((c) => c.name === colorField) : undefined,
    [table, colorField],
  )

  const pixelsPerSlot = scheduleViewPixelsPerSlot(density)
  const totalSlots = ((endHour - startHour) * 60) / slotDuration
  const totalGridHeight = totalSlots * pixelsPerSlot
  const columnCount = resources && resources.length > 0 ? resources.length : 1
  const timeColumnWidth = density === "compact" ? 56 : density === "spacious" ? 72 : 64

  const slots = React.useMemo(() => {
    const result: { hour: number; minute: number }[] = []
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += slotDuration) {
        result.push({ hour: h, minute: m })
      }
    }
    return result
  }, [startHour, endHour, slotDuration])

  const getResourceId = (record: Record<string, unknown>): string | undefined => {
    if (!resourceField || !resources) return undefined
    const v = record[resourceField]
    if (v == null) return undefined
    return String(v)
  }

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

  const getAssignee = (record: Record<string, unknown>) => {
    if (!assigneeField) return undefined
    const v = record[assigneeField]
    if (v == null) return undefined
    return String(v)
  }

  const getEventColor = (record: Record<string, unknown>) => {
    if (colorColumn && colorColumn.options?.length) {
      const v = record[colorColumn.name]
      if (v != null) return enumBarColor(String(v), colorColumn.options, enumColorMap)
    }
    const title = getRecordTitle(record)
    return autoBarColor(title)
  }

  const positionedEvents = React.useMemo(() => {
    const events: {
      record: Record<string, unknown>
      top: number
      height: number
      column: number
      color: string
      title: string
      assignee?: string
    }[] = []

    for (const record of recordsState.records) {
      const startParsed = parseTimeField(record[startTimeField])
      const endParsed = parseTimeField(record[endTimeField])
      if (!startParsed || !endParsed) continue

      const startMinutes = startParsed.hours * 60 + startParsed.minutes
      const endMinutes = endParsed.hours * 60 + endParsed.minutes
      const gridStart = startHour * 60
      const gridEnd = endHour * 60

      if (endMinutes <= gridStart || startMinutes >= gridEnd) continue

      const clampedStart = Math.max(startMinutes, gridStart)
      const clampedEnd = Math.min(endMinutes, gridEnd)
      const durationMinutes = clampedEnd - clampedStart

      const topSlots = (clampedStart - gridStart) / slotDuration
      const heightSlots = durationMinutes / slotDuration

      const top = topSlots * pixelsPerSlot
      const height = heightSlots * pixelsPerSlot

      let colIndex = 0
      if (resources && resourceField) {
        const resId = getResourceId(record)
        const idx = resources.findIndex((r) => r.id === resId)
        colIndex = idx >= 0 ? idx : 0
      }

      events.push({
        record,
        top,
        height: Math.max(height, pixelsPerSlot * 0.5),
        column: colIndex,
        color: getEventColor(record),
        title: getRecordTitle(record),
        assignee: getAssignee(record),
      })
    }

    return events
  }, [recordsState.records, startTimeField, endTimeField, startHour, endHour, slotDuration, pixelsPerSlot, resources, resourceField, colorColumn, enumColorMap, titleColumn, table, assigneeField])

  const navigatePrev = () => {
    setCurrentDate((d) => {
      const next = new Date(d)
      next.setDate(next.getDate() - 1)
      return next
    })
  }
  const navigateNext = () => {
    setCurrentDate((d) => {
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      return next
    })
  }
  const navigateToday = () => setCurrentDate(new Date())

  const now = new Date()
  const currentTimeTop = React.useMemo(() => {
    const todayStart = new Date(currentDate)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(currentDate)
    todayEnd.setHours(23, 59, 59, 999)
    if (now < todayStart || now > todayEnd) return null
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const gridStart = startHour * 60
    const gridEnd = endHour * 60
    if (nowMinutes < gridStart || nowMinutes > gridEnd) return null
    const slotsFromStart = (nowMinutes - gridStart) / slotDuration
    return slotsFromStart * pixelsPerSlot
  }, [currentDate, startHour, endHour, slotDuration, pixelsPerSlot])

  const handleSlotClick = (slotHour: number, slotMinute: number, resourceIndex?: number) => {
    if (!onSlotClick) return
    const startTime = `${String(slotHour).padStart(2, "0")}:${String(slotMinute).padStart(2, "0")}`
    const resourceId = resourceIndex != null && resources ? resources[resourceIndex]?.id : undefined
    onSlotClick(currentDate, startTime, resourceId)
  }

  const borderClass = scheduleViewGridBorderClassName(appearance)

  if (tableState.isLoading) {
    return (
      <div className={cn("p-6", scheduleViewRootClassName(appearance))}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-16" />
          <div className="flex-1 flex flex-col gap-0.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-schedule-view flex h-full min-h-0 flex-col", scheduleViewRootClassName(appearance), className)}
    >
      <div className={cn("shrink-0", scheduleViewHeaderClassName(appearance))}>
        <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between", scheduleViewToolbarClassName(density))}>
          <div className="min-w-0 flex items-center gap-3">
            <span className={cn("flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground", scheduleViewRadiusClassName(radius, "control"))}>
              <Clock className="size-3.5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {title ?? (table?.name ?? tableName)}
              </h1>
              <p className="text-xs text-muted-foreground">
                {currentDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
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
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-auto", scheduleViewContentClassName(density))}>
        {recordsState.error ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">{recordsState.error.message}</p>
            <Button variant="outline" size="sm" onClick={() => recordsState.refresh()}>
              <RefreshCw className="mr-2 size-3.5" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex min-w-max">
            <div
              className={cn("shrink-0 border-r", borderClass)}
              style={{ width: `${timeColumnWidth}px` }}
            >
              {slots.map((slot) => (
                <div
                  key={`${slot.hour}-${slot.minute}`}
                  className={cn(
                    "border-b border-border/20 text-right text-muted-foreground pr-2",
                    scheduleViewTimeLabelClassName(density),
                  )}
                  style={{ height: `${pixelsPerSlot}px` }}
                >
                  {slot.minute === 0 ? formatTimeLabel(slot.hour, slot.minute) : ""}
                </div>
              ))}
            </div>

            <div className="flex-1 relative">
              {resources && resources.length > 0 && (
                <div className="sticky top-0 z-20 flex border-b bg-card/95 backdrop-blur-md" style={{ height: `${density === "compact" ? 28 : density === "spacious" ? 36 : 32}px` }}>
                  {resources.map((res) => (
                    <div
                      key={res.id}
                      className={cn("flex-1 border-r last:border-r-0 text-center text-xs font-medium text-muted-foreground truncate px-1 py-1.5", borderClass)}
                    >
                      {res.label}
                    </div>
                  ))}
                </div>
              )}

              <div className="relative" style={{ height: `${totalGridHeight}px` }}>
                {slots.map((slot, slotIndex) => (
                  <div
                    key={`row-${slot.hour}-${slot.minute}`}
                    className="flex absolute w-full border-b border-border/10"
                    style={{ top: `${slotIndex * pixelsPerSlot}px`, height: `${pixelsPerSlot}px` }}
                  >
                    {Array.from({ length: columnCount }).map((_, colIdx) => (
                      <div
                        key={`cell-${slotIndex}-${colIdx}`}
                        className={cn("flex-1 border-r last:border-r-0 cursor-pointer transition-colors hover:bg-muted/20", colIdx < columnCount - 1 ? borderClass : "")}
                        onClick={() => handleSlotClick(slot.hour, slot.minute, resources ? colIdx : undefined)}
                      />
                    ))}
                  </div>
                ))}

                {positionedEvents.map((event, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onEventClick?.(event.record)}
                    className={cn(
                      "absolute z-10 rounded transition-opacity hover:opacity-80 overflow-hidden",
                      scheduleViewRadiusClassName(radius, "control"),
                      event.color,
                    )}
                    style={{
                      top: `${event.top}px`,
                      height: `${event.height}px`,
                      left: `${(event.column / columnCount) * 100}%`,
                      width: `${100 / columnCount}%`,
                    }}
                  >
                    <div className="flex h-full flex-col justify-center px-2 text-white">
                      <span className={cn("font-medium truncate leading-tight", scheduleViewEventTextClassName(density))}>
                        {event.title}
                      </span>
                      {event.assignee && event.height > pixelsPerSlot * 0.8 && (
                        <span className={cn("opacity-80 truncate leading-tight", scheduleViewEventTextClassName(density))}>
                          {event.assignee}
                        </span>
                      )}
                    </div>
                  </button>
                ))}

                {currentTimeTop != null && (
                  <div
                    className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                    style={{ top: `${currentTimeTop}px` }}
                  >
                    <div className="absolute -left-1 size-2.5 rounded-full bg-red-500" />
                    <div className="w-full h-0.5 bg-red-500" />
                  </div>
                )}
              </div>

              {recordsState.isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-card/50">
                  <RefreshCw className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : null}

              {!recordsState.isLoading && recordsState.records.length === 0 && positionedEvents.length === 0 && (
                <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                  No events scheduled
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
