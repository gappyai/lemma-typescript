"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { ColumnSchema, Table } from "lemma-sdk"
import { isSystemField } from "./records-enum-utils"
import {
  formatRecordFieldValue,
  pickPrimaryColumn,
  pickSecondaryColumns,
  type ForeignKeyLabelMap,
} from "./records-display-utils"

interface ListViewProps {
  records: Record<string, unknown>[]
  table: Table
  visibleColumns?: ColumnSchema[]
  appearance?: "default" | "minimal" | "borderless" | "contained"
  density?: "compact" | "comfortable" | "spacious"
  selectedRecords: Set<string>
  onSelectRecord: (id: string) => void
  onRecordClick: (record: Record<string, unknown>) => void
  renderCard?: (record: Record<string, unknown>, columns: ColumnSchema[]) => React.ReactNode
  foreignKeyLabelMap?: ForeignKeyLabelMap
}

export function ListView({
  records,
  table,
  visibleColumns,
  selectedRecords,
  onSelectRecord,
  onRecordClick,
  renderCard,
  foreignKeyLabelMap,
  appearance = "default",
  density = "comfortable",
}: ListViewProps) {
  const pk = table.primary_key_column || "id"
  const columns = visibleColumns ?? table.columns.filter((c) => !isSystemField(c))

  const primaryCol = pickPrimaryColumn(columns)
  const secondaryCols = pickSecondaryColumns(columns, primaryCol, { count: 5 })

  return (
    <div className={cn("flex flex-col", density === "compact" ? "gap-1.5" : density === "spacious" ? "gap-3" : "gap-2")}>
      {records.map((record) => {
        const id = String(record[pk] ?? "")
        const selected = selectedRecords.has(id)
        return (
          <Card
            key={id}
            size="sm"
            onClick={() => onRecordClick(record)}
            className={cn(
              "cursor-pointer transition-colors",
              selected
                ? "bg-primary/5 ring-primary/35"
                : "hover:bg-muted/30 hover:ring-foreground/20",
              appearance === "borderless" && "ring-0 shadow-none",
              appearance === "minimal" && (
                selected
                  ? "shadow-none ring-primary/25"
                  : "bg-transparent shadow-none ring-0 hover:bg-muted/30"
              ),
            )}
          >
            {renderCard ? (
              <CardContent>{renderCard(record, columns)}</CardContent>
            ) : (
              <CardContent className={cn("flex items-start gap-3", density === "compact" ? "py-2" : density === "spacious" ? "py-4" : null)}>
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onSelectRecord(id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground truncate">
                    {formatRecordFieldValue(primaryCol ? record[primaryCol.name] : undefined, primaryCol, foreignKeyLabelMap)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {secondaryCols.map((col) => {
                      const val = record[col.name]
                      if (val == null || val === "") return null
                      return (
                        <span key={col.name} className="text-xs text-muted-foreground">
                          <span className="font-medium">{col.name.replace(/_/g, " ")}:</span>{" "}
                          {formatRecordFieldValue(val, col, foreignKeyLabelMap)}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
