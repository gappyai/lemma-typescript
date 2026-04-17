"use client"

import * as React from "react"
import { Calendar, Check, ChevronsUpDown, Database, FileText, Link2, RefreshCw, Search, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useForeignKeyOptions, useReferencingRecords, useUpdateRecord } from "lemma-sdk/react"
import type { ColumnSchema, LemmaClient, Table } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { enumPillClasses, isSystemField, typeBadgeClasses, type EnumColorMap } from "./records-enum-utils"
import {
  displayColumnLabel,
  formatRecordFieldValue,
  pickPrimaryColumn,
  pickSecondaryColumns,
  shortenIdentifier,
  type ColumnLabelMap,
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
export type RecordDetailLayout = "default" | "embedded"
export interface RecordDetailFieldGroup {
  label: string
  fields: string[]
}

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
  headerFields?: string[]
  fieldGroups?: RecordDetailFieldGroup[]
  relatedRecords?: RecordDetailRelatedRecord[]
  hiddenFields?: string[]
  titleField?: string
  descriptionField?: string
  identifierField?: string
  statusField?: string
  updateVia?: "direct" | "function"
  updateFunctionName?: string
  columnLabels?: ColumnLabelMap
  foreignKeyLabels?: Record<string, string>
  enumColorMap?: EnumColorMap
  appearance?: LemmaRecordsAppearance
  density?: LemmaRecordsDensity
  radius?: LemmaRecordsRadius
  layout?: RecordDetailLayout
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
  headerFields,
  fieldGroups,
  relatedRecords = [],
  hiddenFields = [],
  titleField,
  descriptionField,
  identifierField,
  statusField,
  updateVia,
  updateFunctionName,
  columnLabels,
  foreignKeyLabels,
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  layout = "default",
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
  const resolvedTitleField = React.useMemo(
    () => titleField ?? detectTitleColumn(userColumns)?.name,
    [titleField, userColumns],
  )
  const resolvedDescriptionField = React.useMemo(
    () => descriptionField ?? detectDescriptionColumn(userColumns)?.name,
    [descriptionField, userColumns],
  )
  const resolvedStatusField = React.useMemo(
    () => statusField ?? detectStatusColumn(userColumns)?.name,
    [statusField, userColumns],
  )
  const resolvedFieldGroups = React.useMemo<RecordDetailFieldGroup[]>(() => {
    if (fieldGroups?.length) return fieldGroups
    const excluded = new Set(
      [resolvedTitleField, resolvedDescriptionField, resolvedStatusField, identifierField]
        .filter((value): value is string => Boolean(value)),
    )
    const displayable = userColumns.filter((column) => !excluded.has(column.name))
    if (displayable.length === 0) return []
    return [{ label: "Details", fields: displayable.map((column) => column.name) }]
  }, [fieldGroups, identifierField, resolvedDescriptionField, resolvedStatusField, resolvedTitleField, userColumns])
  const headerColumns = React.useMemo(() => {
    if (headerFields?.length) {
      return headerFields
        .map((fieldName) => userColumns.find((column) => column.name === fieldName))
        .filter((column): column is ColumnSchema => Boolean(column))
    }
    return secondaryColumns
  }, [headerFields, secondaryColumns, userColumns])
  const title = formatPlainValue(
    resolvedTitleField ? record[resolvedTitleField] : primaryColumn ? record[primaryColumn.name] : undefined,
  ) || "Untitled record"
  const description = formatPlainValue(resolvedDescriptionField ? record[resolvedDescriptionField] : undefined)
  const statusColumn = resolvedStatusField
    ? userColumns.find((column) => column.name === resolvedStatusField)
    : undefined
  const statusValue = resolvedStatusField ? record[resolvedStatusField] : undefined
  const identifierValue = identifierField ? record[identifierField] : recordId
  const activeTabs = React.useMemo(() => {
    const requested = tabs?.length ? tabs : relatedRecords.length ? ["details", "related", "activity"] : ["details", "activity"]
    return requested.filter((tab, index, allTabs) => allTabs.indexOf(tab) === index)
  }, [relatedRecords.length, tabs])
  const defaultTab = activeTabs[0] ?? "details"
  const isEmbedded = layout === "embedded"

  return (
    <section
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn(
        "lemma-record-detail min-h-0 min-w-0 overflow-hidden",
        detailSurfaceClassName(appearance, radius),
        className,
      )}
    >
      <div className={cn("flex flex-col", isEmbedded ? "gap-4 p-4" : density === "compact" ? "gap-3 p-4" : density === "spacious" ? "gap-5 p-7" : "gap-4 p-6")}>
        {isEmbedded ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className={cn("flex shrink-0 items-center justify-center border border-border/50 bg-muted/35 text-muted-foreground", recordsRadiusClassName(radius, "control"), density === "compact" ? "size-9" : "size-10")}>
                  <Database className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {statusValue != null && statusValue !== "" ? (
                      statusColumn?.type === "ENUM" && statusColumn.options?.length ? (
                        <span className={enumPillClasses(String(statusValue), statusColumn.options, enumColorMap)}>
                          {String(statusValue)}
                        </span>
                      ) : (
                        <span className={cn("inline-flex items-center border border-border/50 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground", recordsRadiusClassName(radius, "pill"))}>
                          {String(statusValue)}
                        </span>
                      )
                    ) : null}
                    {identifierValue != null && identifierValue !== "" ? (
                      <span className={cn("inline-flex items-center border border-border/50 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground", recordsRadiusClassName(radius, "pill"))}>
                        {shortenIdentifier(identifierValue)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                    {table.name.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              {actions || onDelete ? (
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
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
              ) : null}
            </div>
            <div className="min-w-0">
              <h2
                className={cn(
                  "break-words tracking-tight text-foreground",
                  density === "compact"
                    ? "text-[1.45rem] font-semibold leading-[1.08]"
                    : "text-[1.7rem] font-semibold leading-[1.04]",
                )}
              >
                {title}
              </h2>
              {description ? (
                <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-muted-foreground">{description}</p>
              ) : null}
              {headerColumns.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {headerColumns.map((column) => {
                    const value = record[column.name]
                    if (value == null || value === "") return null
                    return (
                      <span
                        key={column.name}
                        className={cn(
                          "inline-flex max-w-full items-center gap-1.5 border border-border/35 bg-muted/25 px-2.5 py-1",
                          recordsRadiusClassName(radius, "pill"),
                        )}
                      >
                        <span className="text-muted-foreground/75">{displayColumnLabel(column.name, columnLabels)}</span>
                        <span className="break-words text-foreground">
                          {formatRecordFieldValue(value, column, undefined, enumColorMap)}
                        </span>
                      </span>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className={cn("flex shrink-0 items-center justify-center border border-border/50 bg-muted/35 text-muted-foreground", recordsRadiusClassName(radius, "control"), density === "compact" ? "size-9" : "size-10")}>
                <Database className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {statusValue != null && statusValue !== "" ? (
                    statusColumn?.type === "ENUM" && statusColumn.options?.length ? (
                      <span className={enumPillClasses(String(statusValue), statusColumn.options, enumColorMap)}>
                        {String(statusValue)}
                      </span>
                    ) : (
                      <span className={cn("inline-flex items-center border border-border/50 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground", recordsRadiusClassName(radius, "pill"))}>
                        {String(statusValue)}
                      </span>
                    )
                  ) : null}
                  {identifierValue != null && identifierValue !== "" ? (
                    <span className={cn("inline-flex items-center border border-border/50 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground", recordsRadiusClassName(radius, "pill"))}>
                      {shortenIdentifier(identifierValue)}
                    </span>
                  ) : null}
                </div>
                <h2 className={cn("mt-2 break-words tracking-tight text-foreground", density === "compact" ? "text-xl font-semibold leading-tight" : "text-[2rem] font-semibold leading-tight")}>
                  {title}
                </h2>
                {description ? (
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{table.name}</span>
                  {headerColumns.map((column) => {
                    const value = record[column.name]
                    if (value == null || value === "") return null
                    return (
                      <span key={column.name} className={cn("inline-flex max-w-64 items-center gap-1 bg-muted/35 px-2 py-0.5 truncate", recordsRadiusClassName(radius, "pill"))}>
                        <span className="text-muted-foreground/75">{displayColumnLabel(column.name, columnLabels)}</span>
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
        )}

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
                fieldGroups={resolvedFieldGroups}
                columnLabels={columnLabels}
                updateVia={updateVia}
                updateFunctionName={updateFunctionName}
                foreignKeyLabels={foreignKeyLabels}
                enumColorMap={enumColorMap}
                density={density}
                radius={radius}
                layout={layout}
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
              <ActivityTab record={record} columns={systemColumns} columnLabels={columnLabels} appearance={appearance} density={density} radius={radius} />
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
  fieldGroups,
  columnLabels,
  updateVia,
  updateFunctionName,
  foreignKeyLabels,
  enumColorMap,
  density,
  radius,
  layout,
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
  fieldGroups: RecordDetailFieldGroup[]
  columnLabels?: ColumnLabelMap
  updateVia?: "direct" | "function"
  updateFunctionName?: string
  foreignKeyLabels?: Record<string, string>
  enumColorMap?: EnumColorMap
  density: LemmaRecordsDensity
  radius: LemmaRecordsRadius
  layout: RecordDetailLayout
  onRecordChanged?: () => void
}) {
  const gridClassName = variant === "summary" || mode === "view"
    ? "grid-cols-1"
    : "grid-cols-1 md:grid-cols-2"

  return (
    <div className={cn("flex flex-col", density === "compact" ? "gap-3" : density === "spacious" ? "gap-5" : "gap-4")}>
      {fieldGroups.map((group) => {
        const groupColumns = group.fields
          .map((fieldName) => columns.find((column) => column.name === fieldName))
          .filter((column): column is ColumnSchema => Boolean(column))

        if (groupColumns.length === 0) return null

        return (
          <section key={group.label}>
            <div className="mb-3 flex items-center gap-3">
              <p className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{group.label}</p>
              <span className="h-px flex-1 bg-border/30" />
            </div>
            {mode === "view" ? (
              <div className="divide-y divide-border/30">
                {groupColumns.map((column) => (
                  <RecordField
                    key={column.name}
                    record={record}
                    column={column}
                    label={displayColumnLabel(column.name, columnLabels)}
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
                    layout={layout}
                    onRecordChanged={onRecordChanged}
                  />
                ))}
              </div>
            ) : (
              <div className={cn("grid", gridClassName, density === "compact" ? "gap-2" : density === "spacious" ? "gap-4" : "gap-3")}>
                {groupColumns.map((column) => (
                  <RecordField
                    key={column.name}
                    record={record}
                    column={column}
                    label={displayColumnLabel(column.name, columnLabels)}
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
                    layout={layout}
                    onRecordChanged={onRecordChanged}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function RecordField({
  record,
  column,
  label,
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
  layout,
  onRecordChanged,
}: {
  record: Record<string, unknown>
  column: ColumnSchema
  label: string
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
  layout: RecordDetailLayout
  onRecordChanged?: () => void
}) {
  const value = record[column.name]
  const updateMutation = useUpdateRecord({ client, podId, tableName, recordId, updateVia, updateFunctionName })
  const save = async (nextValue: unknown) => {
    await updateMutation.update({ [column.name]: nextValue })
    onRecordChanged?.()
  }

  if (mode === "view") {
    return (
      layout === "embedded" ? (
        <div className="grid gap-2 py-3 sm:grid-cols-[minmax(8rem,10rem)_minmax(0,1fr)] sm:items-start sm:gap-4">
          <p className="text-[11px] font-medium leading-5 text-muted-foreground">
            {label}
          </p>
          <div className="min-w-0">
            <ReadOnlyFieldValue
              value={value}
              column={column}
              client={client}
              podId={podId}
              tableName={tableName}
              labelField={foreignKeyLabels?.[column.name]}
              enumColorMap={enumColorMap}
              radius={radius}
              layout={layout}
            />
          </div>
        </div>
      ) : (
        <div className={cn("grid gap-2 py-3", density === "compact" ? "sm:grid-cols-[minmax(6.5rem,8rem)_minmax(0,1fr)]" : "sm:grid-cols-[minmax(7.5rem,9rem)_minmax(0,1fr)] sm:gap-4")}>
          <div className="flex items-center gap-2 sm:pt-1">
            <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <span className={typeBadgeClasses(column)}>
              {column.foreign_key ? "ref" : column.type.toLowerCase()}
            </span>
          </div>
          <div className="min-w-0">
            <ReadOnlyFieldValue
              value={value}
              column={column}
              client={client}
              podId={podId}
              tableName={tableName}
              labelField={foreignKeyLabels?.[column.name]}
              enumColorMap={enumColorMap}
              radius={radius}
              layout={layout}
            />
          </div>
        </div>
      )
    )
  }

  return (
    <div className={cn("group border border-border/40 bg-muted/15", recordsRadiusClassName(radius, "surface"), density === "compact" ? "p-3" : density === "spacious" ? "p-4" : "p-3.5")}>
      <div className="mb-2 flex items-center gap-2">
        <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
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
          layout={layout}
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
  layout = "default",
}: {
  value: unknown
  column: ColumnSchema
  client: LemmaClient
  podId?: string
  tableName: string
  labelField?: string
  enumColorMap?: EnumColorMap
  radius: LemmaRecordsRadius
  layout?: RecordDetailLayout
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
  if (column.foreign_key) {
    return (
      <p className={cn("text-sm font-medium text-foreground", layout === "embedded" ? "break-words leading-6" : "truncate")}>
        {resolvedLabel ?? shortenIdentifier(value)}
      </p>
    )
  }
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
      <p className={cn("flex items-center gap-1.5 text-sm text-foreground", layout === "embedded" && "leading-6")}>
        <Calendar className="size-3.5 text-muted-foreground" />
        {formatTimestamp(value)}
      </p>
    )
  }
  return (
    <div className={cn("break-words text-sm text-foreground", layout === "embedded" && "leading-6")}>
      {formatRecordFieldValue(value, column, undefined, enumColorMap)}
    </div>
  )
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
      <SearchableForeignKeySelect
        value={draft}
        selectedLabel={selectedLabel}
        options={fkOptions.options}
        radius={radius}
        disabled={disabled}
        onChange={(nextValue) => void onSave(nextValue || null)}
      />
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
  columnLabels,
  appearance,
  density,
  radius,
}: {
  record: Record<string, unknown>
  columns: ColumnSchema[]
  columnLabels?: ColumnLabelMap
  appearance: LemmaRecordsAppearance
  density: LemmaRecordsDensity
  radius: LemmaRecordsRadius
}) {
  const events = columns
    .filter((column) => column.name === "created_at" || column.name === "updated_at" || /activity|contacted|closed|sent|received/i.test(column.name))
    .map((column) => ({
      key: column.name,
      label: displayColumnLabel(column.name, columnLabels),
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

function detectTitleColumn(columns: ColumnSchema[]): ColumnSchema | undefined {
  return columns.find((column) => /title|name|subject|label|full_name|primary_email/i.test(column.name))
}

function detectDescriptionColumn(columns: ColumnSchema[]): ColumnSchema | undefined {
  return columns.find((column) => /description|summary|body|content|notes|reason/i.test(column.name) && column.type === "TEXT")
}

function detectStatusColumn(columns: ColumnSchema[]): ColumnSchema | undefined {
  return columns.find((column) => /status|stage|state/i.test(column.name))
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

function SearchableForeignKeySelect({
  value,
  selectedLabel,
  options,
  radius,
  disabled,
  onChange,
}: {
  value: string
  selectedLabel?: string
  options: Array<{ value: unknown; label: string }>
  radius: LemmaRecordsRadius
  disabled?: boolean
  onChange: (value: string | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const filteredOptions = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => option.label.toLowerCase().includes(needle) || String(option.value).toLowerCase().includes(needle))
  }, [options, query])

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (disabled) return
        setOpen(nextOpen)
        if (!nextOpen) setQuery("")
      }}
    >
      <PopoverTrigger
        type="button"
        disabled={disabled}
        className={cn(
          "inline-flex h-8 w-full items-center justify-between gap-3 border border-border/70 bg-background/70 px-3 text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
          recordsRadiusClassName(radius, "control"),
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {selectedLabel ?? (value ? shortenIdentifier(value) : <span className="text-muted-foreground">Select...</span>)}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-[var(--radix-popper-anchor-width)] min-w-72 p-0", recordsRadiusClassName(radius, "surface"))}>
        <div className="border-b border-border/40 p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search..."
              className={cn("h-8 pl-8 text-xs", recordsRadiusClassName(radius, "control"))}
            />
          </div>
        </div>
        <div className="max-h-72 overflow-auto p-1">
          {value ? (
            <button
              type="button"
              className={cn("flex w-full items-center gap-2 px-2 py-2 text-left text-sm text-muted-foreground hover:bg-muted/45", recordsRadiusClassName(radius, "control"))}
              onClick={() => {
                onChange(null)
                setOpen(false)
                setQuery("")
              }}
            >
              <X className="size-4" />
              Clear selection
            </button>
          ) : null}
          {filteredOptions.length === 0 ? (
            <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">
              No options found
            </div>
          ) : (
            filteredOptions.map((option) => {
              const selected = String(option.value) === value
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  className={cn("flex w-full items-center gap-2 px-2 py-2 text-left text-sm hover:bg-muted/45", recordsRadiusClassName(radius, "control"), selected ? "bg-muted/60" : null)}
                  onClick={() => {
                    onChange(String(option.value))
                    setOpen(false)
                    setQuery("")
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {selected ? <Check className="size-4 text-primary" /> : null}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
