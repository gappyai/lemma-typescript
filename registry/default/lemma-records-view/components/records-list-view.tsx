"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { ColumnSchema, Table } from "lemma-sdk"
import { isSystemField, type EnumColorMap } from "./records-enum-utils"
import {
  displayColumnLabel,
  formatRecordPlainText,
  formatRecordFieldValue,
  pickColumn,
  pickPrimaryColumn,
  pickSecondaryColumns,
  type ColumnLabelMap,
  type ForeignKeyLabelMap,
  type RecordPreviewDisplayOptions,
} from "./records-display-utils"
import { RecordQuickActionButtons, type RecordQuickAction } from "./records-quick-actions"
import {
  recordsRadiusClassName,
  type LemmaRecordsAppearance,
  type LemmaRecordsDensity,
  type LemmaRecordsRadius,
} from "./records-style-utils"

interface ListViewProps {
  records: Record<string, unknown>[]
  table: Table
  visibleColumns?: ColumnSchema[]
  appearance?: LemmaRecordsAppearance
  density?: LemmaRecordsDensity
  radius?: LemmaRecordsRadius
  selectedRecords: Set<string>
  onSelectRecord: (id: string) => void
  onRecordClick: (record: Record<string, unknown>) => void
  renderCard?: (record: Record<string, unknown>, columns: ColumnSchema[]) => React.ReactNode
  foreignKeyLabelMap?: ForeignKeyLabelMap
  columnLabels?: ColumnLabelMap
  displayOptions?: RecordPreviewDisplayOptions
  quickActions?: RecordQuickAction[]
  onQuickAction?: (action: RecordQuickAction, record: Record<string, unknown>, index: number) => void
  pendingActionKey?: string | null
  enumColorMap?: EnumColorMap
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
  columnLabels,
  displayOptions,
  quickActions,
  onQuickAction,
  pendingActionKey,
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
}: ListViewProps) {
  const pk = table.primary_key_column || "id"
  const columns = visibleColumns ?? table.columns.filter((c) => !isSystemField(c))

  const primaryCol = pickPrimaryColumn(columns, displayOptions?.primaryField)
  const secondaryCols = pickSecondaryColumns(columns, primaryCol, {
    count: 5,
    fields: displayOptions?.secondaryFields,
  })
  const descriptionCol = pickColumn(columns, displayOptions?.descriptionField)
  const badgeCol = pickColumn(columns, displayOptions?.badgeField)
  const showFieldLabels = displayOptions?.showFieldLabels ?? true

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
              recordsRadiusClassName(radius, "surface"),
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                          {formatRecordFieldValue(primaryCol ? record[primaryCol.name] : undefined, primaryCol, foreignKeyLabelMap, enumColorMap)}
                        </p>
                        {badgeCol && record[badgeCol.name] != null && record[badgeCol.name] !== "" ? (
                          <span className={cn("shrink-0", badgeCol.type === "ENUM" ? "contents" : "inline-flex items-center border border-border/50 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground", badgeCol.type === "ENUM" ? undefined : recordsRadiusClassName(radius, "pill"))}>
                            {formatRecordFieldValue(record[badgeCol.name], badgeCol, foreignKeyLabelMap, enumColorMap)}
                          </span>
                        ) : null}
                      </div>
                      {descriptionCol ? (
                        (() => {
                          const description = formatRecordPlainText(record[descriptionCol.name])
                          if (!description) return null
                          return (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {description}
                            </p>
                          )
                        })()
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {secondaryCols.map((col) => {
                      const val = record[col.name]
                      if (val == null || val === "") return null
                      return (
                        <span key={col.name} className="text-xs text-muted-foreground">
                          {showFieldLabels ? <span className="font-medium">{displayColumnLabel(col.name, columnLabels)}:</span> : null}
                          {showFieldLabels ? " " : null}
                          {formatRecordFieldValue(val, col, foreignKeyLabelMap, enumColorMap)}
                        </span>
                      )
                    })}
                  </div>
                  {quickActions?.length && onQuickAction ? (
                    <RecordQuickActionButtons
                      record={record}
                      recordId={id}
                      actions={quickActions}
                      pendingActionKey={pendingActionKey}
                      onRun={(action, index) => onQuickAction(action, record, index)}
                      compact
                      className="mt-2"
                    />
                  ) : null}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
