"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { ColumnSchema, Table } from "lemma-sdk"
import { enumPillClasses, isSystemField } from "./records-enum-utils"

interface ListViewProps {
  records: Record<string, unknown>[]
  table: Table
  visibleColumns?: ColumnSchema[]
  selectedRecords: Set<string>
  onSelectRecord: (id: string) => void
  onRecordClick: (record: Record<string, unknown>) => void
  renderCard?: (record: Record<string, unknown>, columns: ColumnSchema[]) => React.ReactNode
}

export function ListView({
  records,
  table,
  visibleColumns,
  selectedRecords,
  onSelectRecord,
  onRecordClick,
  renderCard,
}: ListViewProps) {
  const pk = table.primary_key_column || "id"
  const columns = visibleColumns ?? table.columns.filter((c) => !isSystemField(c))

  const primaryCol = columns.find((c) => ["title", "name", "label", "subject"].includes(c.name)) ?? columns[0]
  const secondaryCols = columns.filter((c) => c.name !== primaryCol?.name).slice(0, 5)

  return (
    <div className="space-y-2">
      {records.map((record) => {
        const id = String(record[pk] ?? "")
        const selected = selectedRecords.has(id)
        return (
          <div
            key={id}
            onClick={() => onRecordClick(record)}
            className={cn(
              "rounded-lg border bg-card p-4 transition-colors cursor-pointer",
              selected
                ? "border-primary/25 bg-primary/5"
                : "border-border/50 hover:border-border hover:bg-muted/30",
            )}
          >
            {renderCard ? (
              renderCard(record, columns)
            ) : (
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    e.stopPropagation()
                    onSelectRecord(id)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground truncate">
                    {formatFieldValue(record[primaryCol?.name], primaryCol)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {secondaryCols.map((col) => {
                      const val = record[col.name]
                      if (val == null || val === "") return null
                      return (
                        <span key={col.name} className="text-xs text-muted-foreground">
                          <span className="font-medium">{col.name.replace(/_/g, " ")}:</span>{" "}
                          {formatFieldValue(val, col)}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatFieldValue(value: unknown, col?: ColumnSchema): React.ReactNode {
  if (value == null || value === "") return "—"
  if (col?.type === "ENUM" && col.options?.length) {
    return <span className={enumPillClasses(String(value), col.options)}>{String(value)}</span>
  }
  if (col?.type === "BOOLEAN") return value ? "Yes" : "No"
  if (col?.type === "UUID") {
    const s = String(value)
    return <span className="font-mono text-xs">{s.length > 8 ? `${s.slice(0, 4)}…${s.slice(-4)}` : s}</span>
  }
  return String(value)
}
