"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { ColumnSchema } from "lemma-sdk"
import { enumPillClasses } from "./records-enum-utils"
import {
  formatRecordFieldValue,
  pickPrimaryColumn,
  pickSecondaryColumns,
  type ForeignKeyLabelMap,
} from "./records-display-utils"

interface GroupedViewProps {
  records: Record<string, unknown>[]
  groupByColumn: ColumnSchema
  layout?: "kanban" | "linear"
  appearance?: "default" | "minimal" | "borderless" | "contained"
  density?: "compact" | "comfortable" | "spacious"
  primaryKey: string
  visibleColumns: ColumnSchema[]
  selectedRecords: Set<string>
  onSelectRecord: (id: string) => void
  onRecordClick: (record: Record<string, unknown>) => void
  renderCard?: (record: Record<string, unknown>, columns: ColumnSchema[]) => React.ReactNode
  foreignKeyLabelMap?: ForeignKeyLabelMap
}

export function GroupedView({
  records,
  groupByColumn,
  layout = "kanban",
  appearance = "default",
  density = "comfortable",
  primaryKey,
  visibleColumns,
  selectedRecords,
  onSelectRecord,
  onRecordClick,
  renderCard,
  foreignKeyLabelMap,
}: GroupedViewProps) {
  const groups = React.useMemo(() => {
    const map = new Map<string, Record<string, unknown>[]>()
    const ungrouped: Record<string, unknown>[] = []

    for (const rec of records) {
      const key = rec[groupByColumn.name]
      if (key == null || key === "") {
        ungrouped.push(rec)
      } else {
        const k = String(key)
        if (!map.has(k)) map.set(k, [])
        map.get(k)!.push(rec)
      }
    }

    const entries: Array<{ label: string; records: Record<string, unknown>[] }> = []
    if (groupByColumn.options?.length) {
      for (const opt of groupByColumn.options) {
        entries.push({ label: opt, records: map.get(opt) ?? [] })
        map.delete(opt)
      }
    }
    for (const [k, recs] of map) {
      entries.push({ label: k, records: recs })
    }
    if (ungrouped.length) {
      entries.push({ label: "Ungrouped", records: ungrouped })
    }

    return entries
  }, [records, groupByColumn])

  const primaryCol = pickPrimaryColumn(visibleColumns)
  const secondaryCols = pickSecondaryColumns(visibleColumns, primaryCol, {
    groupBy: groupByColumn.name,
    count: layout === "kanban" ? 4 : 5,
  })

  const groupClass = layout === "kanban"
    ? cn("flex min-w-max pb-2", density === "compact" ? "gap-2" : density === "spacious" ? "gap-4" : "gap-3")
    : cn("flex min-w-0 flex-col", density === "compact" ? "gap-2" : density === "spacious" ? "gap-4" : "gap-3")

  const sectionClass = layout === "kanban"
    ? cn(
        "flex max-h-full shrink-0 flex-col rounded-xl",
        density === "compact" ? "w-72" : density === "spacious" ? "w-96" : "w-80",
        appearance === "minimal"
          ? "border-0 bg-transparent"
          : appearance === "borderless"
            ? "border-0 bg-muted/10"
            : "border border-border/50 bg-muted/20",
      )
    : cn(
        "flex min-w-0 flex-col rounded-xl",
        appearance === "minimal"
          ? "border-0 bg-transparent"
          : appearance === "borderless"
            ? "border-0 bg-transparent"
            : "border border-border/50 bg-card",
      )

  return (
    <div className={groupClass}>
      {groups.map((group) => (
        <section
          key={group.label}
          className={sectionClass}
        >
          <div className={cn("flex items-center justify-between gap-3 px-3", appearance === "borderless" ? "border-b-0" : appearance === "minimal" ? "border-b border-border/15" : "border-b border-border/40", density === "compact" ? "py-2" : density === "spacious" ? "py-3" : "py-2.5")}>
            {groupByColumn.options?.length ? (
              <span className={enumPillClasses(group.label, groupByColumn.options)}>
                {group.label}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border/50 bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                {group.label}
              </span>
            )}
            <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border/50">
              {group.records.length}
            </span>
          </div>
          <div className={cn("flex flex-col", density === "compact" ? "gap-1.5 p-1.5" : density === "spacious" ? "gap-3 p-3" : "gap-2 p-2", layout === "kanban" && "overflow-y-auto")}>
            {group.records.length === 0 && (
              <div className={cn("rounded-lg px-3 py-6 text-center text-xs text-muted-foreground", appearance === "minimal" ? "border border-dashed border-border/25 bg-transparent" : "border border-dashed border-border/60 bg-background/40")}>
                No records
              </div>
            )}
            {group.records.map((record) => {
              const id = String(record[primaryKey] ?? "")
              const selected = selectedRecords.has(id)
              if (renderCard) {
                return (
                  <Card
                    key={id}
                    size="sm"
                    onClick={() => onRecordClick(record)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selected ? "bg-primary/5 ring-primary/35" : "hover:bg-background hover:ring-foreground/20",
                      appearance === "borderless" && "ring-0 shadow-none",
                      appearance === "minimal" && (
                        selected
                          ? "shadow-none ring-primary/25"
                          : "bg-transparent shadow-none ring-0 hover:bg-muted/30"
                      ),
                    )}
                  >
                    <CardContent>{renderCard(record, visibleColumns)}</CardContent>
                  </Card>
                )
              }
              return (
                <Card
                  key={id}
                  size="sm"
                  onClick={() => onRecordClick(record)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selected ? "bg-primary/5 ring-primary/35" : "hover:bg-background hover:ring-foreground/20",
                    appearance === "borderless" && "ring-0 shadow-none",
                    appearance === "minimal" && (
                      selected
                        ? "shadow-none ring-primary/25"
                        : "bg-transparent shadow-none ring-0 hover:bg-muted/30"
                    ),
                  )}
                >
                  <CardContent className={cn("flex gap-2", layout === "kanban" ? "flex-col" : "items-center", density === "compact" ? "py-2" : density === "spacious" ? "py-4" : null)}>
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => onSelectRecord(id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {formatRecordFieldValue(primaryCol ? record[primaryCol.name] : undefined, primaryCol, foreignKeyLabelMap)}
                      </span>
                    </div>
                    <div className={cn("flex flex-wrap gap-1.5", layout === "kanban" ? "pl-6" : "justify-end")}>
                      {secondaryCols.map((col) => {
                        const v = record[col.name]
                        if (v == null || v === "") return null
                        return (
                          <span
                            key={col.name}
                            className="max-w-full truncate rounded-md bg-muted/50 px-1.5 py-0.5 text-xs text-muted-foreground"
                          >
                            {formatRecordFieldValue(v, col, foreignKeyLabelMap)}
                          </span>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
