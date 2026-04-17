"use client"

import * as React from "react"
import {
  AlertCircle,
  Grid3X3,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRecords, useTable } from "lemma-sdk/react"
import type { LemmaClient, RecordFilter, ColumnSchema } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { ENUM_PALETTE, enumPillClasses, type EnumColorMap, type EnumColorEntry } from "./matrix-enum-utils"
import {
  matrixRadiusClassName,
  type LemmaMatrixAppearance,
  type LemmaMatrixDensity,
  type LemmaMatrixRadius,
} from "./matrix-style-utils"

export type {
  LemmaMatrixAppearance,
  LemmaMatrixDensity,
  LemmaMatrixRadius,
} from "./matrix-style-utils"
export type { EnumColorMap, EnumColorEntry } from "./matrix-enum-utils"

export type MatrixCellMode = "count" | "status" | "record"

export interface LemmaMatrixProps {
  client: LemmaClient
  podId?: string
  tableName: string
  enabled?: boolean

  rowField: string
  columnField: string
  cellMode: MatrixCellMode
  cellStatusField?: string
  cellRecordFields?: string[]
  rowLabels?: string[]
  columnLabels?: string[]
  filters?: RecordFilter[]
  onCellClick?: (rowValue: string, columnValue: string, records: Record<string, unknown>[]) => void
  enumColorMap?: EnumColorMap

  appearance?: LemmaMatrixAppearance
  density?: LemmaMatrixDensity
  radius?: LemmaMatrixRadius
  title?: React.ReactNode
  className?: string
}

function cellIntensityClassName(count: number, maxCount: number): string {
  if (count === 0) return "bg-muted/20 text-muted-foreground/40"
  const ratio = count / maxCount
  if (ratio >= 0.8) return "bg-primary/25 text-primary font-semibold"
  if (ratio >= 0.6) return "bg-primary/18 text-primary font-semibold"
  if (ratio >= 0.4) return "bg-primary/12 text-primary/80"
  if (ratio >= 0.2) return "bg-primary/7 text-primary/60"
  return "bg-primary/4 text-primary/50"
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

export function LemmaMatrix({
  client,
  podId,
  tableName,
  enabled = true,
  rowField,
  columnField,
  cellMode,
  cellStatusField,
  cellRecordFields,
  rowLabels,
  columnLabels,
  filters,
  onCellClick,
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  className,
}: LemmaMatrixProps) {
  const tableState = useTable({ client, podId, tableName, enabled })
  const table = tableState.table

  const recordsState = useRecords({
    client,
    podId,
    tableName,
    enabled: !!table && enabled,
    filters,
    limit: 5000,
  })

  const rowColumn = React.useMemo(
    () => table?.columns.find((c) => c.name === rowField),
    [table, rowField],
  )
  const colColumn = React.useMemo(
    () => table?.columns.find((c) => c.name === columnField),
    [table, columnField],
  )

  const pivot = React.useMemo(() => {
    const map = new Map<string, Map<string, Record<string, unknown>[]>>()
    for (const rec of recordsState.records) {
      const rowVal = String(rec[rowField] ?? "")
      const colVal = String(rec[columnField] ?? "")
      if (!rowVal || !colVal) continue
      if (!map.has(rowVal)) map.set(rowVal, new Map())
      const rowMap = map.get(rowVal)!
      if (!rowMap.has(colVal)) rowMap.set(colVal, [])
      rowMap.get(colVal)!.push(rec)
    }
    return map
  }, [recordsState.records, rowField, columnField])

  const rowValues = React.useMemo(() => {
    if (rowLabels && rowLabels.length > 0) return rowLabels
    const values = Array.from(pivot.keys())
    const options = rowColumn?.options
    if (options && options.length > 0) {
      const ordered: string[] = []
      for (const opt of options) {
        if (values.includes(opt)) ordered.push(opt)
      }
      for (const v of values) {
        if (!ordered.includes(v)) ordered.push(v)
      }
      return ordered
    }
    return values.sort()
  }, [pivot, rowColumn, rowLabels])

  const columnValues = React.useMemo(() => {
    if (columnLabels && columnLabels.length > 0) return columnLabels
    const allColVals = new Set<string>()
    for (const rowMap of pivot.values()) {
      for (const colVal of rowMap.keys()) {
        allColVals.add(colVal)
      }
    }
    const values = Array.from(allColVals)
    const options = colColumn?.options
    if (options && options.length > 0) {
      const ordered: string[] = []
      for (const opt of options) {
        if (values.includes(opt)) ordered.push(opt)
      }
      for (const v of values) {
        if (!ordered.includes(v)) ordered.push(v)
      }
      return ordered
    }
    return values.sort()
  }, [pivot, colColumn, columnLabels])

  const maxCount = React.useMemo(() => {
    let max = 0
    for (const rowMap of pivot.values()) {
      for (const cellRecords of rowMap.values()) {
        if (cellRecords.length > max) max = cellRecords.length
      }
    }
    return Math.max(1, max)
  }, [pivot])

  const rowOptions = rowColumn?.options ?? rowValues
  const colOptions = colColumn?.options ?? columnValues

  const isLoading = tableState.isLoading || recordsState.isLoading
  const error = recordsState.error

  const handleRetry = () => {
    recordsState.refresh()
  }

  const renderCountCell = (count: number) => (
    <span className={cn("flex items-center justify-center tabular-nums", cellIntensityClassName(count, maxCount))}>
      {count === 0 ? "\u2014" : formatCount(count)}
    </span>
  )

  const renderStatusCell = (records: Record<string, unknown>[]) => {
    if (!cellStatusField || records.length === 0) {
      return <span className="text-muted-foreground/40">{"\u2014"}</span>
    }
    const primary = records[0]
    const statusVal = String(primary[cellStatusField] ?? "")
    if (!statusVal) return <span className="text-muted-foreground/40">{"\u2014"}</span>
    const statusOptions = table?.columns.find((c) => c.name === cellStatusField)?.options ?? [statusVal]
    return (
      <span className={enumPillClasses(statusVal, statusOptions, enumColorMap)}>
        {statusVal}
      </span>
    )
  }

  const renderRecordCell = (records: Record<string, unknown>[]) => {
    if (records.length === 0 || !cellRecordFields || cellRecordFields.length === 0) {
      return <span className="text-muted-foreground/40">{"\u2014"}</span>
    }
    return (
      <div className="flex flex-col gap-0.5">
        {records.slice(0, 3).map((rec, i) => (
          <span key={i} className="truncate text-xs leading-tight">
            {cellRecordFields.map((f) => String(rec[f] ?? "")).join(" \u00B7 ")}
          </span>
        ))}
        {records.length > 3 && (
          <span className="text-[10px] text-muted-foreground">
            +{records.length - 3} more
          </span>
        )}
      </div>
    )
  }

  const renderCell = (rowVal: string, colVal: string) => {
    const cellRecords = pivot.get(rowVal)?.get(colVal) ?? []
    const count = cellRecords.length

    let content: React.ReactNode
    if (cellMode === "count") {
      content = renderCountCell(count)
    } else if (cellMode === "status") {
      content = renderStatusCell(cellRecords)
    } else {
      content = renderRecordCell(cellRecords)
    }

    return (
      <Tooltip key={`${rowVal}-${colVal}`}>
        <TooltipTrigger
          onClick={() => onCellClick?.(rowVal, colVal, cellRecords)}
          className={cn(
            "h-full w-full text-center transition-colors",
            cellMode === "count" && "min-h-10",
            onCellClick && "cursor-pointer hover:bg-muted/40",
            !onCellClick && "cursor-default",
            density === "compact" ? "px-1.5 py-1" : density === "spacious" ? "px-3 py-2" : "px-2 py-1.5",
          )}
        >
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <p>{rowVal} x {colVal}: {count} record{count !== 1 ? "s" : ""}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn(
        "lemma-matrix flex flex-col",
        matrixRootClassName(appearance),
        matrixRadiusClassName(radius, "surface"),
        className,
      )}
    >
      <div
        className={cn(
          "shrink-0",
          matrixHeaderClassName(appearance),
          density === "compact" ? "px-3 py-2" : density === "spacious" ? "px-5 py-4" : "px-4 py-3",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground",
                matrixRadiusClassName(radius, "control"),
              )}
            >
              <Grid3X3 className="size-3.5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {title ?? (table?.name ?? tableName)}
              </h1>
              {!isLoading && (
                <p className="text-xs text-muted-foreground">
                  {recordsState.records.length} records
                  {" "}across {rowValues.length} x {columnValues.length}
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
          <div className="space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              {columnValues.length > 0
                ? columnValues.map((_, i) => <Skeleton key={i} className="h-6 flex-1" />)
                : Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 flex-1" />)}
            </div>
            {(rowValues.length > 0 ? rowValues : Array.from({ length: 4 })).map((_, i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                {columnValues.length > 0
                  ? columnValues.map((_, j) => <Skeleton key={j} className="h-10 flex-1" />)
                  : Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-10 flex-1" />)}
              </div>
            ))}
          </div>
        ) : recordsState.records.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <Grid3X3 className="size-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No data for matrix
            </p>
          </div>
        ) : (
          <TooltipProvider delay={300}>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className={cn(
                        "sticky left-0 z-10 bg-card/95 backdrop-blur-sm",
                        density === "compact" ? "px-2 py-1.5" : density === "spacious" ? "px-4 py-3" : "px-3 py-2",
                      )}
                    >
                      {rowField}
                    </TableHead>
                    {columnValues.map((colVal) => (
                      <TableHead
                        key={colVal}
                        className={cn(
                          "text-center",
                          density === "compact" ? "px-2 py-1.5" : density === "spacious" ? "px-4 py-3" : "px-3 py-2",
                        )}
                      >
                        {colVal}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rowValues.map((rowVal) => (
                    <TableRow key={rowVal}>
                      <TableCell
                        className={cn(
                          "sticky left-0 z-10 bg-card/95 backdrop-blur-sm font-medium",
                          density === "compact" ? "px-2 py-1.5 text-xs" : density === "spacious" ? "px-4 py-3 text-sm" : "px-3 py-2 text-xs",
                        )}
                      >
                        {rowVal}
                      </TableCell>
                      {columnValues.map((colVal) => (
                        <TableCell
                          key={colVal}
                          className={cn(
                            "p-0",
                            matrixRadiusClassName(radius, "control"),
                          )}
                        >
                          {renderCell(rowVal, colVal)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}

export function LemmaMatrixSkeleton({
  rows = 4,
  cols = 3,
  density = "comfortable",
  className,
}: {
  rows?: number
  cols?: number
  density?: LemmaMatrixDensity
  className?: string
}) {
  const cellH = density === "compact" ? "h-8" : density === "spacious" ? "h-12" : "h-10"

  return (
    <div className={cn("space-y-2 p-4", className)}>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24" />
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-6 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <Skeleton className={cn(cellH, "w-24")} />
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={cn(cellH, "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  )
}

function matrixRootClassName(appearance: LemmaMatrixAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function matrixHeaderClassName(appearance: LemmaMatrixAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}
