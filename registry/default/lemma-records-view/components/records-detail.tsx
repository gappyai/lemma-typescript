"use client"

import * as React from "react"
import { Calendar, Database, FileText, Link2, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useForeignKeyOptions, useReferencingRecords, useUpdateRecord } from "lemma-sdk/react"
import type { ColumnSchema, LemmaClient, Table } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { enumPillClasses, isSystemField, typeBadgeClasses, type EnumColorMap } from "./records-enum-utils"
import {
  formatRecordFieldValue,
  pickPrimaryColumn,
  pickSecondaryColumns,
  shortenIdentifier,
} from "./records-display-utils"
import {
  recordsRadiusClassName,
  type LemmaRecordsAppearance,
  type LemmaRecordsDensity,
  type LemmaRecordsRadius,
} from "./records-style-utils"

export type RecordDetailVariant = "summary" | "workspace" | "activity"
export type RecordDetailMode = "view" | "editable"
export type RecordDetailTab = "details" | "related" | "activity" | "files"

export interface RecordDetailRelatedRecord {
  tableName: string
  foreignKey: string
  label?: string
  fields?: string[]
  displayField?: string
  subtitleField?: string
  limit?: number
  sortBy?: string
  order?: "asc" | "desc" | string
  onRecordClick?: (record: Record<string, unknown>) => void
}

export interface RecordDetailProps {
  record: Record<string, unknown>
  table: Table
  client: LemmaClient
  podId?: string
  mode?: RecordDetailMode
  variant?: RecordDetailVariant
  tabs?: RecordDetailTab[]
  relatedRecords?: RecordDetailRelatedRecord[]
  hiddenFields?: string[]
  updateVia?: "direct" | "function"
  updateFunctionName?: string
  foreignKeyLabels?: Record<string, string>
  enumColorMap?: EnumColorMap
  appearance?: LemmaRecordsAppearance
  density?: LemmaRecordsDensity
  radius?: LemmaRecordsRadius
  actions?: React.ReactNode
  renderFiles?: (context: { record: Record<string, unknown>; table: Table; recordId: string }) => React.ReactNode
  className?: string
  onRecordChanged?: () => void
  onDelete?: () => void
}

export function RecordDetail({
  record,
  table,
  client,
  podId,
  mode = "editable",
  variant = "workspace",
  tabs,
  relatedRecords = [],
  hiddenFields = [],
  updateVia,
  updateFunctionName,
  foreignKeyLabels,
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  actions,
  renderFiles,
  className,
  onRecordChanged,
  onDelete,
}: RecordDetailProps) {
  const primaryKey = table.primary_key_column || "id"
  const recordId = String(record[primaryKey] ?? "")
  const columns = React.useMemo(
    () =>
      table.columns
        .filter((column) => !hiddenFields.includes(column.name))
        .filter((column) => column.type !== "VECTOR"),
    [hiddenFields, table.columns],
  )
  const userColumns = columns.filter((column) => !isSystemField(column))
  const systemColumns = columns.filter((column) => isSystemField(column))
  const primaryColumn = pickPrimaryColumn(userColumns)
  const secondaryColumns = pickSecondaryColumns(userColumns, primaryColumn, { count: 3 })
  const title = formatPlainValue(primaryColumn ? record[primaryColumn.name] : undefined) || "Untitled record"
  const activeTabs = React.useMemo(() => {
    const requested = tabs?.length ? tabs : relatedRecords.length ? ["details", "related", "activity"] : ["details", "activity"]
    return requested.filter((tab, index, allTabs) => allTabs.indexOf(tab) === index)
  }, [relatedRecords.length, tabs])
  const defaultTab = activeTabs[0] ?? "details"

  return (
    <section
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn(
        "lemma-record-detail min-h-0 min-w-lg overflow-hidden",
        detailSurfaceClassName(appearance, radius),
        className,
      )}
    >
      <div className={cn("flex flex-col", density === "compact" ? "gap-3 p-4" : density === "spacious" ? "gap-5 p-7" : "gap-4 p-6")}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className={cn("flex shrink-0 items-center justify-center border border-border/50 bg-muted/35 text-muted-foreground", recordsRadiusClassName(radius, "control"), density === "compact" ? "size-9" : "size-10")}>
              <Database className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={cn("truncate font-semibold tracking-tight text-foreground", density === "compact" ? "text-lg" : "text-xl")}>
                  {title}
                </h2>
                <span className={cn("inline-flex items-center border border-border/50 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground", recordsRadiusClassName(radius, "pill"))}>
                  {shortenIdentifier(recordId)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{table.name}</span>
                {secondaryColumns.map((column) => {
                  const value = record[column.name]
                  if (value == null || value === "") return null
                  return (
                    <span key={column.name} className={cn("inline-flex max-w-64 items-center gap-1 truncate bg-muted/35 px-2 py-0.5", recordsRadiusClassName(radius, "pill"))}>
                      <span className="text-muted-foreground/75">{column.name.replace(/_/g, " ")}</span>
                       <span className="truncate text-foreground">{formatRecordFieldValue(value, column, undefined, enumColorMap)}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            ) : null}
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="min-h-0">
          {activeTabs.length > 1 ? (
            <TabsList className={cn("w-full justify-start", recordsRadiusClassName(radius, "control"))}>
              {activeTabs.map((tab) => (
                <TabsTrigger key={tab} value={tab} className="capitalize">
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          ) : null}

          {activeTabs.includes("details") ? (
            <TabsContent value="details" className="mt-4">
              <DetailsTab
                record={record}
                columns={userColumns}
                client={client}
                podId={podId}
                tableName={table.name}
                recordId={recordId}
                mode={mode}
                variant={variant}
                updateVia={updateVia}
                updateFunctionName={updateFunctionName}
                foreignKeyLabels={foreignKeyLabels}
                enumColorMap={enumColorMap}
                density={density}
                radius={radius}
                onRecordChanged={onRecordChanged}
              />
            </TabsContent>
          ) : null}

          {activeTabs.includes("related") ? (
            <TabsContent value="related" className="mt-4">
              <RelatedTab
                recordId={recordId}
                configs={relatedRecords}
                client={client}
                podId={podId}
                appearance={appearance}
                density={density}
                radius={radius}
              />
            </TabsContent>
          ) : null}

          {activeTabs.includes("activity") ? (
            <TabsContent value="activity" className="mt-4">
              <ActivityTab record={record} columns={systemColumns} appearance={appearance} density={density} radius={radius} />
            </TabsContent>
          ) : null}

          {activeTabs.includes("files") ? (
            <TabsContent value="files" className="mt-4">
              {renderFiles ? (
                renderFiles({ record, table, recordId })
              ) : (
                <EmptyDetailState
                  icon={FileText}
                  title="Files are ready to attach"
                  description="Pass renderFiles to plug in lemma-file-browser, lemma-file-viewer, or a record-specific attachment surface."
                  appearance={appearance}
                  radius={radius}
                />
              )}
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </section>
  )
}

function DetailsTab({
  record,
  columns,
  client,
  podId,
  tableName,
  recordId,
  mode,
  variant,
  updateVia,
  updateFunctionName,
  foreignKeyLabels,
  enumColorMap,
  density,
  radius,
  onRecordChanged,
}: {
  record: Record<string, unknown>
  columns: ColumnSchema[]
  client: LemmaClient
  podId?: string
  tableName: string
  recordId: string
  mode: RecordDetailMode
  variant: RecordDetailVariant
  updateVia?: "direct" | "function"
  updateFunctionName?: string
  foreignKeyLabels?: Record<string, string>
  enumColorMap?: EnumColorMap
  density: LemmaRecordsDensity
  radius: LemmaRecordsRadius
  onRecordChanged?: () => void
}) {
  const fieldColumns = columns.filter((column) => column.name !== "id" && column.name !== "sort_order")
  const gridClassName = variant === "summary"
    ? "grid-cols-1"
    : "grid-cols-1 md:grid-cols-2"

  return (
    <div className={cn("grid", gridClassName, density === "compact" ? "gap-2" : density === "spacious" ? "gap-4" : "gap-3")}>
      {fieldColumns.map((column) => (
        <RecordField
          key={column.name}
          record={record}
          column={column}
          client={client}
          podId={podId}
          tableName={tableName}
          recordId={recordId}
          mode={mode}
          updateVia={updateVia}
          updateFunctionName={updateFunctionName}
          foreignKeyLabels={foreignKeyLabels}
          enumColorMap={enumColorMap}
          density={density}
          radius={radius}
          onRecordChanged={onRecordChanged}
        />
      ))}
    </div>
  )
}

function RecordField({
  record,
  column,
  client,
  podId,
  tableName,
  recordId,
  mode,
  updateVia,
  updateFunctionName,
  foreignKeyLabels,
  enumColorMap,
  density,
  radius,
  onRecordChanged,
}: {
  record: Record<string, unknown>
  column: ColumnSchema
  client: LemmaClient
  podId?: string
  tableName: string
  recordId: string
  mode: RecordDetailMode
  updateVia?: "direct" | "function"
  updateFunctionName?: string
  foreignKeyLabels?: Record<string, string>
  enumColorMap?: EnumColorMap
  density: LemmaRecordsDensity
  radius: LemmaRecordsRadius
  onRecordChanged?: () => void
}) {
  const value = record[column.name]
  const updateMutation = useUpdateRecord({ client, podId, tableName, recordId, updateVia, updateFunctionName })
  const save = async (nextValue: unknown) => {
    await updateMutation.update({ [column.name]: nextValue })
    onRecordChanged?.()
  }

  return (
    <div className={cn("group border border-border/40 bg-muted/15", recordsRadiusClassName(radius, "surface"), density === "compact" ? "p-3" : density === "spacious" ? "p-4" : "p-3.5")}>
      <div className="mb-2 flex items-center gap-2">
        <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {column.name.replace(/_/g, " ")}
        </p>
        <span className={typeBadgeClasses(column)}>
          {column.foreign_key ? "ref" : column.type.toLowerCase()}
        </span>
      </div>
      {mode === "editable" ? (
        <EditableFieldValue
          value={value}
          column={column}
          client={client}
          podId={podId}
          tableName={tableName}
          labelField={foreignKeyLabels?.[column.name]}
          enumColorMap={enumColorMap}
          radius={radius}
          disabled={updateMutation.isSubmitting}
          onSave={save}
        />
      ) : (
        <ReadOnlyFieldValue
          value={value}
          column={column}
          client={client}
          podId={podId}
          tableName={tableName}
          labelField={foreignKeyLabels?.[column.name]}
          enumColorMap={enumColorMap}
          radius={radius}
        />
      )}
      {updateMutation.error ? (
        <p className="mt-2 text-xs text-destructive">{updateMutation.error.message}</p>
      ) : null}
    </div>
  )
}

function ReadOnlyFieldValue({
  value,
  column,
  client,
  podId,
  tableName,
  labelField,
  enumColorMap,
  radius,
}: {
  value: unknown
  column: ColumnSchema
  client: LemmaClient
  podId?: string
  tableName: string
  labelField?: string
  enumColorMap?: EnumColorMap
  radius: LemmaRecordsRadius
}) {
  const fkOptions = useForeignKeyOptions({
    client,
    podId,
    tableName,
    columnName: column.name,
    labelField,
    enabled: !!column.foreign_key,
  })
  const resolvedLabel = fkOptions.options.find((option) => String(option.value) === String(value))?.label

  if (value == null || value === "") return <p className="text-sm italic text-muted-foreground">Empty</p>
  if (column.foreign_key) return <p className="truncate text-sm font-medium text-foreground">{resolvedLabel ?? shortenIdentifier(value)}</p>
  if (column.type === "JSON") {
    const text = typeof value === "string" ? value : JSON.stringify(value, null, 2)
    return (
      <pre className={cn("max-h-48 overflow-auto border border-border/40 bg-background/60 p-3 font-mono text-xs text-foreground", recordsRadiusClassName(radius, "control"))}>
        {text}
      </pre>
    )
  }
  if (column.type === "DATE" || column.type === "DATETIME") {
    return (
      <p className="flex items-center gap-1.5 text-sm text-foreground">
        <Calendar className="size-3.5 text-muted-foreground" />
        {formatTimestamp(value)}
      </p>
    )
  }
  return <div className="break-words text-sm text-foreground">{formatRecordFieldValue(value, column, undefined, enumColorMap)}</div>
}

function EditableFieldValue({
  value,
  column,
  client,
  podId,
  tableName,
  labelField,
  enumColorMap,
  radius,
  disabled,
  onSave,
}: {
  value: unknown
  column: ColumnSchema
  client: LemmaClient
  podId?: string
  tableName: string
  labelField?: string
  enumColorMap?: EnumColorMap
  radius: LemmaRecordsRadius
  disabled?: boolean
  onSave: (value: unknown) => Promise<void>
}) {
  const [draft, setDraft] = React.useState(value == null ? "" : String(value))
  const fkOptions = useForeignKeyOptions({
    client,
    podId,
    tableName,
    columnName: column.name,
    labelField,
    enabled: !!column.foreign_key,
  })

  React.useEffect(() => {
    setDraft(value == null ? "" : String(value))
  }, [value])

  const controlClassName = cn("border-border/70 bg-background/70", recordsRadiusClassName(radius, "control"))

  if (column.foreign_key) {
    const selectedLabel = fkOptions.options.find((option) => String(option.value) === draft)?.label
    return (
      <Select value={draft} onValueChange={(nextValue) => void onSave(nextValue)} disabled={disabled}>
        <SelectTrigger className={cn("h-8", controlClassName)}>
          <SelectValue placeholder="Select...">
            {selectedLabel ?? (draft ? shortenIdentifier(draft) : undefined)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {fkOptions.options.map((option) => (
              <SelectItem key={String(option.value)} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  if (column.type === "ENUM" && column.options?.length) {
    return (
      <Select value={draft || undefined} onValueChange={(nextValue) => void onSave(nextValue)} disabled={disabled}>
        <SelectTrigger className={cn("h-8", controlClassName)}>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {column.options.map((option) => (
              <SelectItem key={option} value={option}>
                <span className={enumPillClasses(option, column.options!, enumColorMap)}>{option}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  if (column.type === "BOOLEAN") {
    const checked = draft === "true" || draft === "1"
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("h-8 justify-start", controlClassName)}
        disabled={disabled}
        onClick={() => void onSave(!checked)}
      >
        {checked ? "Yes" : "No"}
      </Button>
    )
  }

  if (column.type === "JSON") {
    return (
      <Textarea
        value={draft}
        rows={5}
        disabled={disabled}
        className={cn("font-mono text-xs", controlClassName)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void onSave(parseJsonDraft(draft))}
      />
    )
  }

  if (column.type === "DATE" || column.type === "DATETIME") {
    return (
      <Input
        type={column.type === "DATE" ? "date" : "datetime-local"}
        value={draft}
        disabled={disabled}
        className={cn("h-8", controlClassName)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void onSave(draft || null)}
      />
    )
  }

  return (
    <Input
      value={draft}
      type={column.type === "INTEGER" || column.type === "FLOAT" ? "number" : "text"}
      disabled={disabled}
      className={cn("h-8", controlClassName)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => void onSave(coerceDraftValue(draft, column))}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur()
        }
      }}
    />
  )
}

function RelatedTab({
  recordId,
  configs,
  client,
  podId,
  appearance,
  density,
  radius,
}: {
  recordId: string
  configs: RecordDetailRelatedRecord[]
  client: LemmaClient
  podId?: string
  appearance: LemmaRecordsAppearance
  density: LemmaRecordsDensity
  radius: LemmaRecordsRadius
}) {
  if (configs.length === 0) {
    return (
      <EmptyDetailState
        icon={Link2}
        title="No related sections configured"
        description="Pass relatedRecords to show child tables like tasks, comments, emails, notes, line items, or activity history for this record."
        appearance={appearance}
        radius={radius}
      />
    )
  }

  return (
    <div className={cn("grid grid-cols-1", density === "compact" ? "gap-2" : density === "spacious" ? "gap-4" : "gap-3")}>
      {configs.map((config) => (
        <RelatedRecordsPanel
          key={`${config.tableName}:${config.foreignKey}`}
          recordId={recordId}
          config={config}
          client={client}
          podId={podId}
          appearance={appearance}
          radius={radius}
        />
      ))}
    </div>
  )
}

function RelatedRecordsPanel({
  recordId,
  config,
  client,
  podId,
  appearance,
  radius,
}: {
  recordId: string
  config: RecordDetailRelatedRecord
  client: LemmaClient
  podId?: string
  appearance: LemmaRecordsAppearance
  radius: LemmaRecordsRadius
}) {
  const related = useReferencingRecords({
    client,
    podId,
    table: config.tableName,
    foreignKey: config.foreignKey,
    recordId,
    fields: config.fields,
    limit: config.limit ?? 8,
    sortBy: config.sortBy,
    order: config.order,
  })
  const table = related.referencedTable
  const primaryColumn = table
    ? table.columns.find((column) => column.name === config.displayField) ?? pickPrimaryColumn(table.columns)
    : undefined
  const subtitleColumn = table && config.subtitleField
    ? table.columns.find((column) => column.name === config.subtitleField)
    : undefined

  return (
    <div className={cn("border border-border/40", relatedPanelClassName(appearance), recordsRadiusClassName(radius, "surface"))}>
      <div className="flex items-center justify-between gap-3 border-b border-border/25 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{config.label ?? sentenceCase(config.tableName)}</p>
          <p className="text-xs text-muted-foreground">{config.foreignKey} links back to this record</p>
        </div>
        <span className={cn("shrink-0 bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground", recordsRadiusClassName(radius, "pill"))}>
          {related.isLoading ? "..." : related.total}
        </span>
      </div>
      <div className="p-2">
        {related.isLoading ? (
          <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
            <RefreshCw className="size-4 animate-spin" />
            Loading related records...
          </div>
        ) : related.error ? (
          <p className="px-2 py-3 text-sm text-destructive">{related.error.message}</p>
        ) : related.records.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No related records yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {related.records.map((childRecord, index) => {
              const title = formatPlainValue(primaryColumn ? childRecord[primaryColumn.name] : undefined) || "Untitled"
              const subtitle = subtitleColumn ? formatPlainValue(childRecord[subtitleColumn.name]) : null
              return (
                <button
                  key={String(childRecord.id ?? index)}
                  type="button"
                  className={cn(
                    "flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/45",
                    recordsRadiusClassName(radius, "control"),
                  )}
                  onClick={() => config.onRecordClick?.(childRecord)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{title}</span>
                    {subtitle ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span> : null}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{shortenIdentifier(childRecord.id ?? index)}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityTab({
  record,
  columns,
  appearance,
  density,
  radius,
}: {
  record: Record<string, unknown>
  columns: ColumnSchema[]
  appearance: LemmaRecordsAppearance
  density: LemmaRecordsDensity
  radius: LemmaRecordsRadius
}) {
  const events = columns
    .filter((column) => column.name === "created_at" || column.name === "updated_at" || /activity|contacted|closed|sent|received/i.test(column.name))
    .map((column) => ({
      key: column.name,
      label: sentenceCase(column.name),
      value: record[column.name],
    }))
    .filter((event) => event.value != null && event.value !== "")

  if (events.length === 0) {
    return (
      <EmptyDetailState
        icon={Calendar}
        title="No activity timeline yet"
        description="Timestamp fields, comments, emails, workflow runs, and audit events can all land here as the pod schema grows."
        appearance={appearance}
        radius={radius}
      />
    )
  }

  return (
    <div className={cn("relative flex flex-col", density === "compact" ? "gap-2" : "gap-3")}>
      {events.map((event, index) => (
        <div key={event.key} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
          <div className="flex flex-col items-center">
            <span className={cn("flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground", recordsRadiusClassName(radius, "pill"))}>
              <Calendar className="size-3.5" />
            </span>
            {index < events.length - 1 ? <span className="my-1 h-full min-h-4 w-px bg-border/50" /> : null}
          </div>
          <div className={cn("border border-border/40 bg-muted/15 p-3", recordsRadiusClassName(radius, "surface"))}>
            <p className="text-sm font-medium text-foreground">{event.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{formatTimestamp(event.value)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyDetailState({
  title,
  description,
  icon: Icon,
  appearance,
  radius,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  appearance: LemmaRecordsAppearance
  radius: LemmaRecordsRadius
}) {
  return (
    <div className={cn("flex min-h-48 flex-col items-center justify-center gap-3 border border-dashed border-border/40 px-6 py-8 text-center", appearance === "minimal" ? "bg-transparent" : "bg-muted/15", recordsRadiusClassName(radius, "surface"))}>
      <div className={cn("flex size-10 items-center justify-center border border-border/50 bg-muted/35 text-muted-foreground", recordsRadiusClassName(radius, "pill"))}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function detailSurfaceClassName(appearance: LemmaRecordsAppearance, radius: LemmaRecordsRadius) {
  return cn(
    recordsRadiusClassName(radius, "surface"),
    appearance === "minimal" ? "bg-transparent" : "bg-card",
    appearance === "borderless" || appearance === "minimal" ? "border-0 shadow-none" : "border border-border/50 shadow-sm",
    appearance === "contained" && "border-border/70 bg-card",
  )
}

function relatedPanelClassName(appearance: LemmaRecordsAppearance) {
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-card/80"
}

function formatPlainValue(value: unknown): string {
  if (value == null || value === "") return ""
  if (value instanceof Date) return formatTimestamp(value)
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function formatTimestamp(value: unknown): string {
  if (value == null || value === "") return "—"
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function sentenceCase(value: string): string {
  return value
    .replace(/[_\.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function coerceDraftValue(value: string, column: ColumnSchema): unknown {
  if (value === "") return null
  if (column.type === "INTEGER") return Number.parseInt(value, 10)
  if (column.type === "FLOAT") return Number.parseFloat(value)
  return value
}

function parseJsonDraft(value: string): unknown {
  if (!value.trim()) return null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
