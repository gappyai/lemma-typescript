"use client"

import * as React from "react"
import {
  ChevronRight,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Unlink,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useReferencingRecords,
  useForeignKeyOptions,
  useRecordForm,
  useCreateRecord,
  useTable,
} from "lemma-sdk/react"
import type { LemmaClient, ColumnSchema } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { enumPillClasses, type EnumColorMap } from "./linked-records-enum-utils"
import {
  linkedRecordsRadiusClassName,
  type LemmaLinkedRecordsAppearance,
  type LemmaLinkedRecordsDensity,
  type LemmaLinkedRecordsRadius,
} from "./linked-records-style-utils"

export type {
  LemmaLinkedRecordsAppearance,
  LemmaLinkedRecordsDensity,
  LemmaLinkedRecordsRadius,
} from "./linked-records-style-utils"
export type { EnumColorMap, EnumColorEntry } from "./linked-records-enum-utils"

export interface LinkedRecordFormConfig {
  submitVia?: "direct" | "function"
  submitFunctionName?: string
  hiddenFields?: string[]
  visibleFields?: string[]
  initialValues?: Record<string, unknown>
}

export interface LemmaLinkedRecordsProps {
  client: LemmaClient
  podId?: string
  sourceTableName: string
  foreignKey: string
  recordId: string
  enabled?: boolean

  displayFields?: string[]
  linkLabelField?: string
  allowCreate?: boolean
  createFormConfig?: LinkedRecordFormConfig
  allowUnlink?: boolean
  expandMode?: "inline" | "sheet" | "page"
  onRecordClick?: (record: Record<string, unknown>) => void
  enumColorMap?: EnumColorMap

  appearance?: LemmaLinkedRecordsAppearance
  density?: LemmaLinkedRecordsDensity
  radius?: LemmaLinkedRecordsRadius
  title?: React.ReactNode
  className?: string
}

export function LemmaLinkedRecords({
  client,
  podId,
  sourceTableName,
  foreignKey,
  recordId,
  enabled = true,
  displayFields,
  linkLabelField,
  allowCreate = false,
  createFormConfig,
  allowUnlink = false,
  expandMode = "inline",
  onRecordClick,
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  className,
}: LemmaLinkedRecordsProps) {
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [expandedRecordId, setExpandedRecordId] = React.useState<string | null>(null)
  const [sheetRecord, setSheetRecord] = React.useState<Record<string, unknown> | null>(null)

  const tableState = useTable({ client, podId, tableName: sourceTableName, enabled })
  const table = tableState.table

  const referencingState = useReferencingRecords({
    client,
    podId,
    table: sourceTableName,
    foreignKey,
    recordId,
    fields: displayFields,
    enabled: enabled && !!recordId,
  })

  const records = referencingState.records
  const isLoading = referencingState.isLoading || tableState.isLoading
  const error = referencingState.error || tableState.error

  const labelField = React.useMemo(() => {
    if (linkLabelField) return linkLabelField
    const nameCol = table?.columns.find((c) =>
      /^(name|title|label|subject|summary)$/i.test(c.name) && !isSystemField(c)
    )
    return nameCol?.name ?? "id"
  }, [table, linkLabelField])

  const resolvedDisplayFields = React.useMemo(() => {
    if (displayFields?.length) return displayFields
    if (!table) return []
    return table.columns
      .filter((c) => !isSystemField(c) && c.name !== foreignKey)
      .map((c) => c.name)
      .slice(0, 4)
  }, [table, displayFields, foreignKey])

  const displayColumns = React.useMemo(() => {
    if (!table) return []
    return resolvedDisplayFields
      .map((name) => table.columns.find((c) => c.name === name))
      .filter((c): c is ColumnSchema => c !== undefined)
  }, [table, resolvedDisplayFields])

  const getRecordLabel = (record: Record<string, unknown>): string => {
    const v = record[labelField]
    if (v != null && String(v).trim()) return String(v)
    for (const fallback of ["name", "title", "label", "subject", "email", "id"]) {
      const fv = record[fallback]
      if (fv != null && String(fv).trim()) return String(fv)
    }
    return "Untitled"
  }

  const handleRecordClick = (record: Record<string, unknown>) => {
    if (expandMode === "page") {
      onRecordClick?.(record)
      return
    }
    if (expandMode === "sheet") {
      setSheetRecord(record)
      return
    }
    const rid = String(record[table?.primary_key_column ?? "id"] ?? "")
    setExpandedRecordId((prev) => (prev === rid ? null : rid))
  }

  const handleUnlink = async (record: Record<string, unknown>) => {
    const rid = String(record[table?.primary_key_column ?? "id"] ?? "")
    if (!rid || !table) return
    try {
      const scopedClient = podId ? client.withPod(podId) : client
      await scopedClient.records.update(sourceTableName, rid, { [foreignKey]: null })
      referencingState.refresh()
    } catch {}
  }

  const handleCreateSuccess = () => {
    setShowCreateForm(false)
    referencingState.refresh()
  }

  const primaryKeyColumn = table?.primary_key_column ?? "id"

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-linked-records flex flex-col", rootClassName(appearance), className)}
    >
      <div className={cn("shrink-0", headerClassName(appearance))}>
        <div className={cn("flex items-center justify-between", toolbarClassName(density))}>
          <div className="min-w-0 flex items-center gap-3">
            <span className={cn("flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground", linkedRecordsRadiusClassName(radius, "control"))}>
              <Link2 className="size-3.5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-semibold text-foreground">
                  {title ?? (table?.name ?? sourceTableName)}
                </h1>
                <Badge variant="secondary" className="text-[10px] font-medium">
                  {records.length} linked
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {allowCreate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(true)}
                className="h-7 gap-1.5 text-xs"
              >
                <Plus className="size-3" />
                Add
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-auto", contentClassName(density))}>
        {error ? (
          <div className="flex min-h-36 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => referencingState.refresh()}>
              <RefreshCw className="mr-2 size-3.5" />
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-5 rounded-full shrink-0" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center gap-3 text-center">
            <div className={cn("flex size-10 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground", linkedRecordsRadiusClassName(radius, "pill"))}>
              <Link2 className="size-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">No linked records</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Records from {table?.name ?? sourceTableName} will appear here.
              </p>
            </div>
            {allowCreate && (
              <Button variant="outline" size="sm" onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 size-3.5" />
                Create & Link
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-6" />
                {displayColumns.map((col) => (
                  <TableHead key={col.name} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {col.name.replace(/_/g, " ")}
                  </TableHead>
                ))}
                {allowUnlink && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record, index) => {
                const rid = String(record[primaryKeyColumn] ?? index)
                const isExpanded = expandedRecordId === rid
                const label = getRecordLabel(record)

                return (
                  <React.Fragment key={rid}>
                    <TableRow
                      className={cn(
                        "cursor-pointer transition-colors",
                        isExpanded && "bg-muted/30",
                      )}
                      onClick={() => handleRecordClick(record)}
                    >
                      <TableCell className="w-6 px-2">
                        <ChevronRight className={cn("size-3.5 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                      </TableCell>
                      {displayColumns.map((col) => (
                        <TableCell key={col.name} className="px-3 py-2">
                          {renderCellValue(record, col, enumColorMap, client, podId, sourceTableName, radius)}
                        </TableCell>
                      ))}
                      {allowUnlink && (
                        <TableCell className="w-10 px-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUnlink(record)
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Unlink className="size-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                    {isExpanded && expandMode === "inline" && table && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={displayColumns.length + (allowUnlink ? 2 : 1)} className="px-4 py-3">
                          <ExpandedRecordFields
                            record={record}
                            table={table}
                            enumColorMap={enumColorMap}
                            client={client}
                            podId={podId}
                            sourceTableName={sourceTableName}
                            radius={radius}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {showCreateForm && allowCreate && (
        <CreateRecordForm
          client={client}
          podId={podId}
          tableName={sourceTableName}
          foreignKey={foreignKey}
          recordId={recordId}
          config={createFormConfig}
          enumColorMap={enumColorMap}
          appearance={appearance}
          density={density}
          radius={radius}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {sheetRecord && expandMode === "sheet" && table && (
        <Sheet open onOpenChange={(open) => !open && setSheetRecord(null)}>
          <SheetContent className={cn("w-full min-w-lg sm:max-w-xl lg:max-w-2xl p-0 gap-0", overlayClassName(appearance, radius))}>
            <SheetHeader className={cn("shrink-0", sheetHeaderClassName(appearance, density))}>
              <SheetTitle className="text-lg font-semibold tracking-tight">
                {getRecordLabel(sheetRecord)}
              </SheetTitle>
              <SheetDescription>{sourceTableName}</SheetDescription>
            </SheetHeader>
            <div className={cn("flex-1 overflow-y-auto", contentClassName(density))}>
              <ExpandedRecordFields
                record={sheetRecord}
                table={table}
                enumColorMap={enumColorMap}
                client={client}
                podId={podId}
                sourceTableName={sourceTableName}
                radius={radius}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

function ExpandedRecordFields({
  record,
  table,
  enumColorMap,
  client,
  podId,
  sourceTableName,
  radius,
}: {
  record: Record<string, unknown>
  table: import("lemma-sdk").Table
  enumColorMap?: EnumColorMap
  client: LemmaClient
  podId?: string
  sourceTableName: string
  radius: LemmaLinkedRecordsRadius
}) {
  const visibleCols = table.columns.filter((c) => !isSystemField(c))

  return (
    <div className="space-y-3">
      {visibleCols.map((col) => (
        <div key={col.name} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {col.name.replace(/_/g, " ")}
          </span>
          <span className="text-sm text-foreground">
            {renderCellValue(record, col, enumColorMap, client, podId, sourceTableName, radius)}
          </span>
        </div>
      ))}
    </div>
  )
}

function CreateRecordForm({
  client,
  podId,
  tableName,
  foreignKey,
  recordId,
  config,
  enumColorMap,
  appearance,
  density,
  radius,
  onClose,
  onSuccess,
}: {
  client: LemmaClient
  podId?: string
  tableName: string
  foreignKey: string
  recordId: string
  config?: LinkedRecordFormConfig
  enumColorMap?: EnumColorMap
  appearance: LemmaLinkedRecordsAppearance
  density: LemmaLinkedRecordsDensity
  radius: LemmaLinkedRecordsRadius
  onClose: () => void
  onSuccess: () => void
}) {
  const form = useRecordForm({
    client,
    podId,
    tableName,
    recordId: null,
    submitVia: config?.submitVia ?? "direct",
    submitFunctionName: config?.submitFunctionName,
    hiddenFields: [...(config?.hiddenFields ?? []), "id", "created_at", "updated_at", "creator_user_id", "sort_order"],
    visibleFields: config?.visibleFields,
    initialValues: { ...(config?.initialValues ?? {}), [foreignKey]: recordId },
    onSubmitSuccess: () => onSuccess(),
  })

  const orderedFields = form.editableFields.filter(
    (f) => f.name !== foreignKey,
  )

  return (
    <Card className={cn("border-t border-border/30", cardSurfaceClassName(appearance, radius))}>
      <CardHeader className={cn("shrink-0", formHeaderClassName(appearance, density))}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">New {tableName.replace(/_/g, " ")}</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-4", formBodyClassName(density))}>
        <input type="hidden" value={recordId} />
        {form.isLoadingSchema ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading schema…
          </div>
        ) : (
          orderedFields.map((field) => (
            <FormField
              key={field.name}
              field={field}
              value={form.values[field.name]}
              error={form.fieldErrors[field.name]}
              onChange={(v) => form.setValue(field.name, v)}
              client={client}
              podId={podId}
              tableName={tableName}
              enumColorMap={enumColorMap}
              radius={radius}
            />
          ))
        )}
        {form.error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {form.error.message}
          </p>
        )}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button
            onClick={() => form.submit()}
            disabled={form.isSubmitting || form.isLoadingSchema}
            size="sm"
          >
            {form.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create & Link
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FormField({
  field,
  value,
  error,
  onChange,
  client,
  podId,
  tableName,
  enumColorMap,
  radius,
}: {
  field: { name: string; label: string; kind: string; column: ColumnSchema; required?: boolean; options?: string[] }
  value: unknown
  error?: string
  onChange: (v: unknown) => void
  client: LemmaClient
  podId?: string
  tableName: string
  enumColorMap?: EnumColorMap
  radius: LemmaLinkedRecordsRadius
}) {
  const fkOptions = useForeignKeyOptions({
    client,
    podId,
    tableName,
    columnName: field.name,
    enabled: field.kind === "foreign-key",
  })

  const displayLabel = field.label || field.name.replace(/_/g, " ")
  const strVal = value == null ? "" : String(value)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {displayLabel}
          {field.required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      </div>

      {renderFormInput(field, value, onChange, fkOptions.options, radius, enumColorMap)}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function renderFormInput(
  field: { name: string; kind: string; column: ColumnSchema; options?: string[] },
  value: unknown,
  onChange: (v: unknown) => void,
  fkOptions: Array<{ value: unknown; label: string }>,
  radius: LemmaLinkedRecordsRadius,
  enumColorMap?: EnumColorMap,
): React.ReactNode {
  const strVal = value == null ? "" : String(value)
  const placeholder = field.name.replace(/_/g, " ")

  if (field.kind === "foreign-key") {
    const selectedLabel = fkOptions.find((opt) => String(opt.value) === strVal)?.label
    return (
      <Select value={String(value ?? "")} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className={cn("h-9", linkedRecordsRadiusClassName(radius, "control"))}>
          <SelectValue placeholder="Select…">
            {selectedLabel ?? (strVal ? shortenId(strVal) : undefined)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {fkOptions.map((opt) => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  if (field.kind === "select" && field.options?.length) {
    return (
      <Select value={strVal || undefined} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className={cn("h-9", linkedRecordsRadiusClassName(radius, "control"))}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                <span className={enumPillClasses(opt, field.options!, enumColorMap)}>{opt}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  if (field.kind === "boolean") {
    return (
      <div className="flex items-center gap-2 h-9">
        <Checkbox checked={Boolean(value)} onCheckedChange={(c) => onChange(c === true)} />
        <span className="text-sm text-muted-foreground">{value ? "Yes" : "No"}</span>
      </div>
    )
  }

  if (field.kind === "textarea") {
    return (
      <Textarea
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={cn("resize-none border-border bg-background placeholder:text-muted-foreground focus-ring", linkedRecordsRadiusClassName(radius, "control"))}
      />
    )
  }

  if (field.kind === "number") {
    return (
      <Input
        type="number"
        value={strVal}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className={cn("h-9 border-border bg-background placeholder:text-muted-foreground focus-ring", linkedRecordsRadiusClassName(radius, "control"))}
      />
    )
  }

  if (field.kind === "date") {
    return (
      <Input
        type="date"
        value={strVal}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn("h-9 border-border bg-background placeholder:text-muted-foreground focus-ring", linkedRecordsRadiusClassName(radius, "control"))}
      />
    )
  }

  if (field.kind === "datetime") {
    return (
      <Input
        type="datetime-local"
        value={strVal}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn("h-9 border-border bg-background placeholder:text-muted-foreground focus-ring", linkedRecordsRadiusClassName(radius, "control"))}
      />
    )
  }

  if (field.kind === "json") {
    return (
      <Textarea
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={cn("font-mono text-xs resize-none border-border bg-background placeholder:text-muted-foreground focus-ring", linkedRecordsRadiusClassName(radius, "control"))}
        placeholder="{}"
      />
    )
  }

  return (
    <Input
      type="text"
      value={strVal}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-9 border-border bg-background placeholder:text-muted-foreground focus-ring", linkedRecordsRadiusClassName(radius, "control"))}
      placeholder={placeholder}
    />
  )
}

function renderCellValue(
  record: Record<string, unknown>,
  col: ColumnSchema,
  enumColorMap?: EnumColorMap,
  client?: LemmaClient,
  podId?: string,
  tableName?: string,
  radius?: LemmaLinkedRecordsRadius,
): React.ReactNode {
  const raw = record[col.name]
  if (raw == null) return <span className="text-muted-foreground">—</span>

  if (col.type === "ENUM" && col.options?.length) {
    const val = String(raw)
    return <span className={enumPillClasses(val, col.options, enumColorMap)}>{val}</span>
  }

  if (col.type === "BOOLEAN") {
    return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", raw ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-muted/40 text-muted-foreground")}>{raw ? "Yes" : "No"}</span>
  }

  if (col.foreign_key && tableName && client) {
    return <ForeignKeyCell client={client} podId={podId} tableName={tableName} columnName={col.name} value={raw} />
  }

  const str = String(raw)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return <span className="font-mono text-xs text-muted-foreground">{shortenId(str)}</span>
  }

  return <span className="truncate">{str}</span>
}

function ForeignKeyCell({
  client,
  podId,
  tableName,
  columnName,
  value,
}: {
  client: LemmaClient
  podId?: string
  tableName: string
  columnName: string
  value: unknown
}) {
  const { options, isLoading } = useForeignKeyOptions({
    client,
    podId,
    tableName,
    columnName,
    enabled: !!value,
  })

  if (isLoading) return <Skeleton className="h-4 w-16" />
  const label = options.find((opt) => String(opt.value) === String(value))?.label
  if (!label) return <span className="font-mono text-xs text-muted-foreground">{shortenId(String(value))}</span>
  return <span className="text-sm text-sky-700 dark:text-sky-300">{label}</span>
}

function shortenId(value: string): string {
  if (!value) return "—"
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return `${value.slice(0, 8)}…${value.slice(-4)}`
  }
  return value.length > 28 ? `${value.slice(0, 24)}…` : value
}

function isSystemField(column: ColumnSchema): boolean {
  return (
    column.system === true ||
    column.auto === true ||
    column.computed === true ||
    column.name === "id" ||
    column.name === "created_at" ||
    column.name === "updated_at" ||
    column.name === "creator_user_id" ||
    column.name === "sort_order"
  )
}

function rootClassName(appearance: LemmaLinkedRecordsAppearance) {
  if (appearance === "contained") return "bg-card border border-border/50"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function headerClassName(appearance: LemmaLinkedRecordsAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

function toolbarClassName(density: LemmaLinkedRecordsDensity) {
  if (density === "compact") return "gap-2 px-3 py-2"
  if (density === "spacious") return "gap-4 px-5 py-4"
  return "gap-3 px-4 py-3"
}

function contentClassName(density: LemmaLinkedRecordsDensity) {
  if (density === "compact") return "p-2"
  if (density === "spacious") return "p-5"
  return "p-4"
}

function sheetHeaderClassName(appearance: LemmaLinkedRecordsAppearance, density: LemmaLinkedRecordsDensity) {
  return cn(
    appearance === "borderless" ? "border-b-0" : appearance === "minimal" ? "border-b border-border/15" : "border-b border-border/50",
    density === "compact" ? "px-4 py-3" : density === "spacious" ? "px-7 py-5" : "px-6 py-4",
  )
}

function formHeaderClassName(appearance: LemmaLinkedRecordsAppearance, density: LemmaLinkedRecordsDensity) {
  return cn(
    appearance === "borderless" ? "border-b-0" : "border-b border-border/15",
    density === "compact" ? "px-4 py-2.5" : density === "spacious" ? "px-5 py-4" : "px-4 py-3",
  )
}

function formBodyClassName(density: LemmaLinkedRecordsDensity) {
  if (density === "compact") return "px-4 py-3"
  if (density === "spacious") return "px-5 py-5"
  return "px-4 py-4"
}

function cardSurfaceClassName(appearance: LemmaLinkedRecordsAppearance, radius: LemmaLinkedRecordsRadius) {
  const r = linkedRecordsRadiusClassName(radius, "surface")
  if (appearance === "borderless") return cn(r, "border-0 shadow-none ring-0")
  if (appearance === "minimal") return cn(r, "border-0 shadow-none ring-0")
  if (appearance === "contained") return cn(r, "border-border/70 shadow-sm")
  return cn(r, "border-border/50")
}

function overlayClassName(appearance: LemmaLinkedRecordsAppearance, radius: LemmaLinkedRecordsRadius) {
  const r = linkedRecordsRadiusClassName(radius, "overlay")
  if (appearance === "borderless") return cn(r, "border-0 shadow-xl ring-0")
  if (appearance === "minimal") return cn(r, "border-0 shadow-none ring-0")
  if (appearance === "contained") return cn(r, "border-border/70 shadow-xl")
  return cn(r, "border-border/50")
}
