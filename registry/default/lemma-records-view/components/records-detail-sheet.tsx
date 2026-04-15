"use client"

import * as React from "react"
import { Calendar, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useReferencingRecords, useForeignKeyOptions, useUpdateRecord } from "lemma-sdk/react"
import type { LemmaClient, Table, ColumnSchema } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { enumPillClasses, typeBadgeClasses, isSystemField } from "./records-enum-utils"

interface DetailSheetProps {
  record: Record<string, unknown>
  table: Table
  client: LemmaClient
  podId?: string
  onClose: () => void
  onRecordChanged: () => void
  onDelete: () => void
  onNext?: () => void
  onPrevious?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  updateVia?: "direct" | "function"
  updateFunctionName?: string
  foreignKeyLabels?: Record<string, string>
  appearance?: "default" | "minimal" | "borderless" | "contained"
  density?: "compact" | "comfortable" | "spacious"
}

function detectTitle(record: Record<string, unknown>, columns: ColumnSchema[]): string {
  for (const name of ["title", "name", "label", "subject", "description"]) {
    const col = columns.find((c) => c.name === name)
    if (col && record[col.name] != null && String(record[col.name]).trim()) {
      return String(record[col.name])
    }
  }
  const first = columns.find((c) => !isSystemField(c) && c.type === "TEXT")
  if (first && record[first.name] != null) return String(record[first.name])
  return String(record[columns[0]?.name ?? "id"] ?? "Record")
}

export function DetailSheet({
  record,
  table,
  client,
  podId,
  onClose,
  onRecordChanged,
  onDelete,
  onNext,
  onPrevious,
  hasPrevious,
  hasNext,
  updateVia,
  updateFunctionName,
  foreignKeyLabels,
  appearance = "default",
  density = "comfortable",
}: DetailSheetProps) {
  const pk = table.primary_key_column || "id"
  const recordId = String(record[pk] ?? "")
  const title = detectTitle(record, table.columns)
  const userColumns = table.columns.filter((c) => !isSystemField(c))
  const systemColumns = table.columns.filter((c) => isSystemField(c) && (c.name === "created_at" || c.name === "updated_at"))
  const fkColumns = userColumns.filter((c) => c.foreign_key)

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className={cn("w-full sm:max-w-lg gap-0 p-0", detailSurfaceClassName(appearance))}>
        <div className={cn("sticky top-0 z-10 backdrop-blur-sm", appearance === "borderless" ? "border-b-0 bg-background/80" : appearance === "minimal" ? "border-b border-border/15 bg-background/90" : "border-b border-border/50 bg-background/95")}>
          <SheetHeader className={density === "compact" ? "px-4 py-3" : density === "spacious" ? "px-7 py-5" : "px-6 py-4"}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg font-semibold tracking-tight truncate">
                  {title}
                </SheetTitle>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    {recordId.length > 8 ? `${recordId.slice(0, 4)}…${recordId.slice(-4)}` : recordId}
                  </span>
                  <span>{table.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onPrevious}
                  disabled={!hasPrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onNext}
                  disabled={!hasNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className={cn("overflow-y-auto", density === "compact" ? "px-4 py-3" : density === "spacious" ? "px-7 py-6" : "px-6 py-4")}>
          <div className={cn("flex flex-col", density === "compact" ? "gap-4" : density === "spacious" ? "gap-7" : "gap-6")}>
          <FieldsSection
            record={record}
            columns={userColumns}
            client={client}
            podId={podId}
            tableName={table.name}
            recordId={recordId}
            onRecordChanged={onRecordChanged}
            updateVia={updateVia}
            updateFunctionName={updateFunctionName}
            foreignKeyLabels={foreignKeyLabels}
          />

          {fkColumns.map((col) => (
            <ReverseLookupSection
              key={col.name}
              client={client}
              podId={podId}
              table={table}
              column={col}
              recordId={recordId}
            />
          ))}

          {systemColumns.length > 0 && (
            <>
              <Separator className="bg-border/40" />
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Timestamps
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {systemColumns.map((col) => (
                    <div key={col.name}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {col.name.replace(/_/g, " ")}
                      </p>
                      <p className="mt-0.5 text-sm text-foreground">
                        {formatTimestamp(record[col.name])}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          </div>
        </div>

        <div className={cn("sticky bottom-0", appearance === "borderless" ? "border-t-0 bg-transparent" : appearance === "minimal" ? "border-t border-border/15 bg-transparent" : "border-t border-border/50 bg-muted/30", density === "compact" ? "px-4 py-2.5" : density === "spacious" ? "px-7 py-4" : "px-6 py-3")}>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function detailSurfaceClassName(appearance: "default" | "minimal" | "borderless" | "contained") {
  if (appearance === "borderless") return "border-0 shadow-xl ring-0"
  if (appearance === "minimal") return "border-0 shadow-none ring-0"
  if (appearance === "contained") return "border-border/70 shadow-xl"
  return "border-border/50"
}

function FieldsSection({
  record,
  columns,
  client,
  podId,
  tableName,
  recordId,
  onRecordChanged,
  updateVia,
  updateFunctionName,
  foreignKeyLabels,
}: {
  record: Record<string, unknown>
  columns: ColumnSchema[]
  client: LemmaClient
  podId?: string
  tableName: string
  recordId: string
  onRecordChanged: () => void
  updateVia?: "direct" | "function"
  updateFunctionName?: string
  foreignKeyLabels?: Record<string, string>
}) {
  const updateMutation = useUpdateRecord({ client, podId, tableName, recordId, updateVia, updateFunctionName })

  return (
    <div className="space-y-3">
      {columns.map((col) => (
        <div key={col.name} className="group">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {col.name.replace(/_/g, " ")}
            </p>
            <span className={typeBadgeClasses(col)}>
              {col.foreign_key ? "REF" : col.type.toLowerCase()}
            </span>
          </div>
          <FieldValue
            record={record}
            column={col}
            client={client}
            podId={podId}
            tableName={tableName}
            foreignKeyLabels={foreignKeyLabels}
            onSave={async (value) => {
              await updateMutation.update({ [col.name]: value })
              onRecordChanged()
            }}
          />
        </div>
      ))}
    </div>
  )
}

function FieldValue({
  record,
  column,
  client,
  podId,
  tableName,
  foreignKeyLabels,
  onSave,
}: {
  record: Record<string, unknown>
  column: ColumnSchema
  client: LemmaClient
  podId?: string
  tableName: string
  foreignKeyLabels?: Record<string, string>
  onSave: (value: unknown) => Promise<void>
}) {
  const value = record[column.name]
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState("")

  const fkOptions = useForeignKeyOptions({
    client,
    podId,
    tableName,
    columnName: column.name,
    labelField: foreignKeyLabels?.[column.name],
    enabled: !!column.foreign_key,
  })

  if (value == null || value === "") {
    return <p className="mt-0.5 text-sm italic text-muted-foreground">Empty</p>
  }

  if (column.type === "BOOLEAN") {
    const bool = Boolean(value)
    return (
      <span
        className={cn(
          "mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
          bool
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "border-border bg-muted/50 text-muted-foreground",
        )}
      >
        {bool ? "Yes" : "No"}
      </span>
    )
  }

  if (column.type === "ENUM" && column.options?.length) {
    return (
      <span className={enumPillClasses(String(value), column.options)}>
        {String(value)}
      </span>
    )
  }

  if (column.foreign_key && fkOptions.options.length > 0) {
    const opt = fkOptions.options.find((o) => String(o.value) === String(value))
    return (
      <p className="mt-0.5 text-sm font-medium text-foreground">
        {opt?.label ?? String(value)}
      </p>
    )
  }

  if (column.type === "JSON") {
    const str = typeof value === "string" ? value : JSON.stringify(value, null, 2)
    return (
      <pre className="mt-0.5 max-h-40 overflow-auto rounded-lg border border-border/50 bg-muted/30 p-3 font-mono text-xs text-foreground">
        {str}
      </pre>
    )
  }

  if (column.type === "DATE" || column.type === "DATETIME") {
    return (
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-foreground">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        {formatTimestamp(value)}
      </p>
    )
  }

  if (editing) {
    return (
      <input
        autoFocus
        className="mt-0.5 h-8 w-full rounded-md border border-border bg-background px-2 text-sm focus-ring"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            await onSave(column.type === "INTEGER" ? Number(draft) : draft)
            setEditing(false)
          }
          if (e.key === "Escape") setEditing(false)
        }}
        onBlur={async () => {
          await onSave(column.type === "INTEGER" ? Number(draft) : draft)
          setEditing(false)
        }}
      />
    )
  }

  return (
    <p
      className="mt-0.5 cursor-pointer rounded px-0.5 text-sm text-foreground transition-colors hover:bg-muted/50"
      onClick={() => {
        setDraft(String(value ?? ""))
        setEditing(true)
      }}
    >
      {String(value)}
    </p>
  )
}

function ReverseLookupSection({
  client,
  podId,
  table,
  column,
  recordId,
}: {
  client: LemmaClient
  podId?: string
  table: Table
  column: ColumnSchema
  recordId: string
}) {
  const ref = column.foreign_key?.references
  if (!ref) return null

  const [refTable, refCol] = ref.includes(".") ? ref.split(".") : [ref, "id"]

  const referencing = useReferencingRecords({
    client,
    podId,
    table: table.name,
    foreignKey: column.name,
    recordId,
    enabled: !!recordId,
  })

  if (!referencing.records.length && !referencing.isLoading) return null

  const col = referencing.columns

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Related {table.name} → {column.name}
      </p>
      {referencing.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-1">
          {referencing.records.slice(0, 5).map((rec, i) => (
            <div
              key={i}
              className="rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs text-foreground"
            >
              {col.map((c) => rec[c.field]).filter(Boolean).join(" · ") || "—"}
            </div>
          ))}
          {referencing.records.length > 5 && (
            <p className="text-[10px] text-muted-foreground">
              +{referencing.records.length - 5} more
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function formatTimestamp(value: unknown): string {
  if (value == null) return "—"
  try {
    const d = new Date(String(value))
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return String(value)
  }
}
