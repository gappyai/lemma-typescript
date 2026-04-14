"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { ColumnSchema } from "lemma-sdk"
import { enumPillClasses } from "./records-enum-utils"

interface GroupedViewProps {
  records: Record<string, unknown>[]
  groupByColumn: ColumnSchema
  primaryKey: string
  visibleColumns: ColumnSchema[]
  selectedRecords: Set<string>
  onSelectRecord: (id: string) => void
  onRecordClick: (record: Record<string, unknown>) => void
  renderCard?: (record: Record<string, unknown>, columns: ColumnSchema[]) => React.ReactNode
}

export function GroupedView({
  records,
  groupByColumn,
  primaryKey,
  visibleColumns,
  selectedRecords,
  onSelectRecord,
  onRecordClick,
  renderCard,
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
        if (map.has(opt)) {
          entries.push({ label: opt, records: map.get(opt)! })
          map.delete(opt)
        }
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

  const primaryCol = visibleColumns.find((c) => ["title", "name", "label", "subject"].includes(c.name)) ?? visibleColumns[0]
  const secondaryCols = visibleColumns.filter((c) => c.name !== primaryCol?.name).slice(0, 3)

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="mb-3 flex items-center gap-2">
            {groupByColumn.options?.length ? (
              <span className={enumPillClasses(group.label, groupByColumn.options)}>
                {group.label}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border/50 bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                {group.label}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{group.records.length}</span>
          </div>
          <div className="space-y-1.5">
            {group.records.map((record) => {
              const id = String(record[primaryKey] ?? "")
              const selected = selectedRecords.has(id)
              if (renderCard) {
                return (
                  <div
                    key={id}
                    onClick={() => onRecordClick(record)}
                    className={cn(
                      "cursor-pointer rounded-lg border p-3 transition-colors",
                      selected ? "border-primary/25 bg-primary/5" : "border-border/50 hover:border-border hover:bg-muted/30",
                    )}
                  >
                    {renderCard(record, visibleColumns)}
                  </div>
                )
              }
              return (
                <div
                  key={id}
                  onClick={() => onRecordClick(record)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                    selected ? "border-primary/25 bg-primary/5" : "border-border/50 hover:border-border hover:bg-muted/30",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onSelectRecord(id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-border"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground">
                      {formatVal(record[primaryCol?.name], primaryCol)}
                    </span>
                  </div>
                  {secondaryCols.map((col) => {
                    const v = record[col.name]
                    if (v == null) return null
                    return (
                      <span key={col.name} className="shrink-0 text-xs text-muted-foreground">
                        {formatVal(v, col)}
                      </span>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function formatVal(value: unknown, col?: ColumnSchema): React.ReactNode {
  if (value == null || value === "") return "—"
  if (col?.type === "ENUM" && col.options?.length) {
    return <span className={enumPillClasses(String(value), col.options)}>{String(value)}</span>
  }
  if (col?.type === "BOOLEAN") return value ? "Yes" : "No"
  return String(value)
}
