"use client"

import * as React from "react"
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useRecord,
  useTable,
  useUpdateRecord,
} from "lemma-sdk/react"
import type { LemmaClient, ColumnSchema, DatastoreDataType } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { enumPillClasses, type EnumColorMap } from "./detail-panel-enum-utils"
import {
  detailPanelRadiusClassName,
  type LemmaDetailPanelAppearance,
  type LemmaDetailPanelDensity,
  type LemmaDetailPanelRadius,
} from "./detail-panel-style-utils"

export type {
  LemmaDetailPanelAppearance,
  LemmaDetailPanelDensity,
  LemmaDetailPanelRadius,
} from "./detail-panel-style-utils"
export type { EnumColorMap } from "./detail-panel-enum-utils"

export interface FieldGroup {
  label: string
  fields: string[]
}

export interface DetailAction {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: "default" | "outline" | "destructive" | "ghost"
  functionName?: string
  workflowName?: string
  buildInput?: (record: Record<string, unknown>) => Record<string, unknown>
}

export interface DetailTab {
  id: string
  label: string
  content: React.ReactNode
}

export interface LemmaDetailPanelProps {
  client: LemmaClient
  podId?: string
  tableName: string
  recordId?: string
  enabled?: boolean

  headerFields?: string[]
  fieldGroups?: FieldGroup[]
  tabs?: DetailTab[]
  actions?: DetailAction[]
  actionMode?: "direct" | "function"
  statusField?: string
  titleField?: string
  descriptionField?: string
  identifierField?: string
  enumColorMap?: EnumColorMap

  onNavigate?: (type: string, id: string) => void
  onRecordChange?: (record: Record<string, unknown>) => void
  appearance?: LemmaDetailPanelAppearance
  density?: LemmaDetailPanelDensity
  radius?: LemmaDetailPanelRadius
  title?: React.ReactNode
  className?: string
}

function isDateLikeType(type: DatastoreDataType): boolean {
  return type === "DATE" || type === "DATETIME"
}

function isEnumType(type: DatastoreDataType): boolean {
  return type === "ENUM"
}

function isBooleanType(type: DatastoreDataType): boolean {
  return type === "BOOLEAN"
}

function isJsonType(type: DatastoreDataType): boolean {
  return type === "JSON"
}

function isFkColumn(column: ColumnSchema): boolean {
  return column.foreign_key != null
}

function formatDateValue(value: unknown): string {
  if (value == null || value === "") return "Not set"
  const d = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(d.getTime())) return String(value)
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d)
}

function formatDisplayValue(value: unknown): string {
  if (value == null || value === "") return "Not set"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") return value.toLocaleString()
  if (Array.isArray(value)) return value.map(formatDisplayValue).join(", ")
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function detectTitleColumn(columns: ColumnSchema[]): ColumnSchema | undefined {
  return columns.find((c) =>
    !c.system && !c.auto && !c.computed && /title|name|subject|label/i.test(c.name)
  )
}

function detectDescriptionColumn(columns: ColumnSchema[]): ColumnSchema | undefined {
  return columns.find((c) =>
    !c.system && !c.auto && !c.computed && /description|summary|body|content|notes|reason/i.test(c.name) && c.type === "TEXT"
  )
}

function sentenceCase(value: string): string {
  return value
    .replace(/[_\.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function shouldHideField(name: string): boolean {
  return name === "id" || name === "created_at" || name === "updated_at"
}

export function LemmaDetailPanel({
  client,
  podId,
  tableName,
  recordId,
  enabled = true,
  headerFields,
  fieldGroups,
  tabs,
  actions,
  actionMode,
  statusField,
  titleField,
  descriptionField,
  identifierField,
  enumColorMap,
  onNavigate,
  onRecordChange,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  className,
}: LemmaDetailPanelProps) {
  const tableState = useTable({ client, podId, tableName, enabled })
  const table = tableState.table

  const recordState = useRecord({
    client,
    podId,
    tableName,
    recordId: recordId ?? null,
    enabled: enabled && !!recordId,
  })
  const record = recordState.record

  const scopedClient = React.useMemo(
    () => (podId ? client.withPod(podId) : client),
    [client, podId],
  )

  const updateHook = useUpdateRecord({
    client,
    podId,
    tableName,
    recordId: recordId ?? null,
    enabled: !!recordId && enabled,
  })

  const resolvedTitleField = React.useMemo(() => {
    if (titleField) return titleField
    if (!table) return undefined
    const detected = detectTitleColumn(table.columns)
    return detected?.name
  }, [titleField, table])

  const resolvedDescriptionField = React.useMemo(() => {
    if (descriptionField) return descriptionField
    if (!table) return undefined
    const detected = detectDescriptionColumn(table.columns)
    return detected?.name
  }, [descriptionField, table])

  const resolvedFieldGroups = React.useMemo<FieldGroup[]>(() => {
    if (fieldGroups) return fieldGroups
    if (!table) return []
    const displayable = table.columns.filter(
      (c) =>
        !c.system &&
        !c.auto &&
        !c.computed &&
        !shouldHideField(c.name) &&
        c.name !== resolvedTitleField &&
        c.name !== resolvedDescriptionField &&
        c.name !== statusField &&
        c.name !== identifierField,
    )
    if (displayable.length === 0) return []
    return [
      {
        label: "Details",
        fields: displayable.map((c) => c.name),
      },
    ]
  }, [fieldGroups, table, resolvedTitleField, resolvedDescriptionField, statusField, identifierField])

  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set())

  const toggleGroup = React.useCallback((label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }, [])

  const getColumn = React.useCallback(
    (fieldName: string): ColumnSchema | undefined =>
      table?.columns.find((c) => c.name === fieldName),
    [table],
  )

  const resolveFkLabel = React.useCallback(
    (_column: ColumnSchema, value: unknown): string => {
      if (value == null) return "Not set"
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>
        const label = obj.name ?? obj.title ?? obj.label ?? obj.id
        return label != null ? String(label) : JSON.stringify(value)
      }
      return String(value)
    },
    [],
  )

  const renderFieldValue = React.useCallback(
    (fieldName: string, value: unknown) => {
      const column = getColumn(fieldName)
      if (!column) return formatDisplayValue(value)

      if (isEnumType(column.type as DatastoreDataType) && column.options?.length) {
        if (value == null || value === "") return "Not set"
        return (
          <span className={enumPillClasses(String(value), column.options, enumColorMap)}>
            {String(value)}
          </span>
        )
      }

      if (isBooleanType(column.type as DatastoreDataType)) {
        if (value == null) return "Not set"
        return value ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5" /> Yes
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <X className="size-3.5" /> No
          </span>
        )
      }

      if (isDateLikeType(column.type as DatastoreDataType)) {
        return formatDateValue(value)
      }

      if (isJsonType(column.type as DatastoreDataType)) {
        if (value == null) return "Not set"
        return (
          <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
            {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
          </pre>
        )
      }

      if (isFkColumn(column)) {
        return resolveFkLabel(column, value)
      }

      return formatDisplayValue(value)
    },
    [getColumn, enumColorMap, resolveFkLabel],
  )

  const statusColumn = React.useMemo(
    () => statusField ? getColumn(statusField) : undefined,
    [statusField, getColumn],
  )

  const statusValue = record?.[statusField ?? ""]
  const identifierValue = identifierField ? record?.[identifierField] : undefined
  const titleValue = resolvedTitleField ? record?.[resolvedTitleField] : undefined
  const descriptionValue = resolvedDescriptionField ? record?.[resolvedDescriptionField] : undefined

  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  const handleAction = React.useCallback(
    async (action: DetailAction) => {
      if (!record || record.id == null) return
      const recordIdStr = String(record.id)
      setActionLoading(action.label)
      try {
        if (action.functionName) {
          const input = action.buildInput?.(record) ?? {
            id: recordIdStr,
            record_id: recordIdStr,
            record,
          }
          await scopedClient.functions.runs.create(action.functionName, { input })
        } else if (action.workflowName) {
          const input = action.buildInput?.(record) ?? {
            id: recordIdStr,
            record_id: recordIdStr,
            record,
          }
          await scopedClient.workflows.runs.start(action.workflowName, input)
        } else if (actionMode === "function") {
          const input = action.buildInput?.(record) ?? {
            id: recordIdStr,
            record_id: recordIdStr,
            record,
          }
          await scopedClient.functions.runs.create(tableName, { input })
        } else {
          const input = action.buildInput?.(record) ?? {}
          await updateHook.update(input)
        }
        const refreshed = await recordState.refresh()
        if (refreshed) {
          onRecordChange?.(refreshed)
        }
      } finally {
        setActionLoading(null)
      }
    },
    [record, actionMode, scopedClient, tableName, updateHook, recordState, onRecordChange],
  )

  React.useEffect(() => {
    if (record) {
      onRecordChange?.(record)
    }
  }, [record, onRecordChange])

  if (!recordId) {
    return (
      <div
        data-appearance={appearance}
        data-density={density}
        data-radius={radius}
        className={cn("lemma-detail-panel flex h-full min-h-0 flex-col", rootClassName(appearance), className)}
      >
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <span className={cn("flex size-11 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground", detailPanelRadiusClassName(radius, "pill"))}>
            <FileText className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-medium text-foreground">Select a record</p>
            <p className="max-w-sm text-sm text-muted-foreground">Select a record to view details</p>
          </div>
        </div>
      </div>
    )
  }

  if (recordState.isLoading || tableState.isLoading) {
    return (
      <div
        data-appearance={appearance}
        data-density={density}
        data-radius={radius}
        className={cn("lemma-detail-panel flex h-full min-h-0 flex-col", rootClassName(appearance), className)}
      >
        <div className={cn(headerPaddingClassName(density), "border-b border-border/40")}>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="mt-2 h-6 w-3/4" />
          <Skeleton className="mt-1.5 h-4 w-1/2" />
        </div>
        <div className={cn(contentPaddingClassName(density), "flex flex-col gap-3")}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (recordState.error) {
    return (
      <div
        data-appearance={appearance}
        data-density={density}
        data-radius={radius}
        className={cn("lemma-detail-panel flex h-full min-h-0 flex-col", rootClassName(appearance), className)}
      >
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <span className={cn("flex size-11 items-center justify-center border border-border/60 bg-muted/40 text-destructive", detailPanelRadiusClassName(radius, "pill"))}>
            <AlertCircle className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-medium text-foreground">Failed to load record</p>
            <p className="max-w-sm text-sm text-muted-foreground">{recordState.error.message}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => recordState.refresh()}>
            <RefreshCw className="mr-2 size-3.5" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!record) {
    return (
      <div
        data-appearance={appearance}
        data-density={density}
        data-radius={radius}
        className={cn("lemma-detail-panel flex h-full min-h-0 flex-col", rootClassName(appearance), className)}
      >
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <span className={cn("flex size-11 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground", detailPanelRadiusClassName(radius, "pill"))}>
            <FileText className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-medium text-foreground">Record not found</p>
            <p className="max-w-sm text-sm text-muted-foreground">The requested record could not be found.</p>
          </div>
        </div>
      </div>
    )
  }

  const statusBadge = statusField && statusColumn?.options?.length && statusValue != null
    ? enumPillClasses(String(statusValue), statusColumn.options, enumColorMap)
    : null

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-detail-panel flex h-full min-h-0 flex-col", rootClassName(appearance), className)}
    >
      <div className={cn("shrink-0 border-b border-border/40", headerPaddingClassName(density))}>
        <div className="flex items-center gap-2">
          {statusBadge && (
            <span className={statusBadge}>{String(statusValue)}</span>
          )}
          {identifierValue != null && identifierValue !== "" && (
            <Badge variant="outline" className={cn("text-xs font-mono", detailPanelRadiusClassName(radius, "pill"))}>
              {String(identifierValue)}
            </Badge>
          )}
        </div>
        <h2 className="mt-1.5 truncate text-lg font-semibold text-foreground">
          {title ?? (titleValue != null && titleValue !== "" ? String(titleValue) : "Untitled")}
        </h2>
        {descriptionValue != null && descriptionValue !== "" && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {String(descriptionValue)}
          </p>
        )}
      </div>

      {actions && actions.length > 0 && (
        <div className={cn("shrink-0 flex flex-wrap gap-2 border-b border-border/40", actionBarPaddingClassName(density))}>
          {actions.map((action) => {
            const Icon = action.icon
            const isLoading = actionLoading === action.label
            return (
              <Button
                key={action.label}
                variant={action.variant ?? "outline"}
                size="sm"
                onClick={() => handleAction(action)}
                disabled={isLoading}
                className={cn("h-8 gap-1.5 text-xs", detailPanelRadiusClassName(radius, "control"))}
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : Icon ? (
                  <Icon className="size-3.5" />
                ) : null}
                {action.label}
              </Button>
            )
          })}
        </div>
      )}

      <div className={cn("flex-1 overflow-auto", contentPaddingClassName(density))}>
        {resolvedFieldGroups.map((group) => {
          const collapsed = collapsedGroups.has(group.label)
          return (
            <div key={group.label} className="mb-4">
              <button
                type="button"
                className="flex w-full items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground"
                onClick={() => toggleGroup(group.label)}
              >
                {collapsed ? (
                  <ChevronRight className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
                {group.label}
              </button>
              {!collapsed && (
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {group.fields.map((fieldName) => {
                    const column = getColumn(fieldName)
                    const value = record[fieldName]
                    const isFk = column && isFkColumn(column)
                    return (
                      <div key={fieldName} className="min-w-0">
                        <p className="truncate text-xs text-muted-foreground">
                          {column ? sentenceCase(column.name) : sentenceCase(fieldName)}
                        </p>
                        <div className="mt-0.5 truncate text-sm text-foreground">
                          {isFk && onNavigate && value != null ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                              onClick={() => {
                                const ref = column!.foreign_key?.references ?? ""
                                const refTable = ref.split(".")[0]
                                const fkId = typeof value === "object" && value !== null && !Array.isArray(value)
                                  ? String((value as Record<string, unknown>).id ?? value)
                                  : String(value)
                                onNavigate(refTable, fkId)
                              }}
                            >
                              {renderFieldValue(fieldName, value)}
                              <ExternalLink className="size-3 shrink-0" />
                            </button>
                          ) : (
                            renderFieldValue(fieldName, value)
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {tabs && tabs.length > 0 && (
        <div className={cn("shrink-0 border-t border-border/40", tabPaddingClassName(density))}>
          <Tabs defaultValue={tabs[0].id} className="w-full">
            <TabsList className="h-8 w-full justify-start">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-2">
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  )
}

function rootClassName(appearance: LemmaDetailPanelAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function headerPaddingClassName(density: LemmaDetailPanelDensity) {
  if (density === "compact") return "px-3 py-2"
  if (density === "spacious") return "px-5 py-4"
  return "px-4 py-3"
}

function actionBarPaddingClassName(density: LemmaDetailPanelDensity) {
  if (density === "compact") return "px-3 py-1.5"
  if (density === "spacious") return "px-5 py-3"
  return "px-4 py-2"
}

function contentPaddingClassName(density: LemmaDetailPanelDensity) {
  if (density === "compact") return "p-3"
  if (density === "spacious") return "p-5"
  return "p-4"
}

function tabPaddingClassName(density: LemmaDetailPanelDensity) {
  if (density === "compact") return "px-3 py-2"
  if (density === "spacious") return "px-5 py-4"
  return "px-4 py-3"
}
