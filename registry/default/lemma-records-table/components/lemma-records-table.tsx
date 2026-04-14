"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useRecords, useTable } from "lemma-sdk/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  DataWorkspaceHeader,
  DataWorkspaceState,
  dataWorkspaceMetaBadgeClassName,
  dataWorkspaceRowClassName,
  dataWorkspaceTypeBadgeClassName,
} from "@/components/lemma/registry-data-workspace"

type LemmaRecordsTableButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link"

export interface LemmaRecordsTableColumn {
  name: string
  label?: string
  description?: string
  type?: string
  width?: number | string
  minWidth?: number | string
  align?: "start" | "center" | "end"
  searchable?: boolean
  hideable?: boolean
  hidden?: boolean
  headerClassName?: string
  cellClassName?: string
  renderCell?: (args: {
    record: Record<string, unknown>
    value: unknown
    column: LemmaRecordsTableColumn
    rowIndex: number
    isSelected: boolean
  }) => React.ReactNode
}

export interface LemmaRecordsTableRowAction {
  key: string
  label: string
  onClick: (record: Record<string, unknown>) => void
  disabled?: (record: Record<string, unknown>) => boolean
  variant?: LemmaRecordsTableButtonVariant
}

export interface LemmaRecordsTableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError"> {
  client: LemmaClient
  podId?: string
  tableName: string
  title?: string
  description?: string
  limit?: number
  records?: Record<string, unknown>[]
  isLoading?: boolean
  error?: Error | null
  onRefresh?: () => void
  columnNames?: string[]
  columns?: LemmaRecordsTableColumn[]
  maxColumns?: number
  search?: string
  searchFields?: string[]
  selectedRecordId?: string | null
  recordIdField?: string
  getRecordId?: (record: Record<string, unknown>) => string
  emptyText?: string
  onRowSelect?: (record: Record<string, unknown>) => void
  showSelection?: boolean
  selectedRecordIds?: string[]
  onSelectedRecordIdsChange?: (recordIds: string[]) => void
  pageIndex?: number
  pageSize?: number
  totalCount?: number
  hasNextPage?: boolean
  onPreviousPage?: () => void
  onNextPage?: () => void
  density?: "compact" | "comfortable"
  hiddenColumnNames?: string[]
  defaultHiddenColumnNames?: string[]
  onHiddenColumnNamesChange?: (hiddenColumnNames: string[]) => void
  allowColumnVisibility?: boolean
  columnVisibilityLabel?: string
  onCreateRecord?: () => void
  createButtonLabel?: string
  rowActions?: LemmaRecordsTableRowAction[]
  rowActionsLabel?: string
  onError?: (error: Error) => void
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value === null || typeof value === "undefined") return "—"

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function readRecordId(
  record: Record<string, unknown>,
  recordIdField: string,
  getRecordId?: (record: Record<string, unknown>) => string,
): string {
  if (getRecordId) {
    const customId = getRecordId(record)
    return typeof customId === "string" ? customId : ""
  }

  const value = record[recordIdField]
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function sentenceCase(value: string): string {
  return value
    .replace(/[_\.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function normalizeWidth(value?: number | string): string | undefined {
  if (typeof value === "number") return `${value}px`
  return value
}

function alignClassName(align: LemmaRecordsTableColumn["align"]): string {
  if (align === "center") return "text-center"
  if (align === "end") return "text-right"
  return "text-left"
}

function headerLabel(column: LemmaRecordsTableColumn): string {
  return column.label ?? column.name
}

function renderCellValue(value: unknown, column: LemmaRecordsTableColumn): React.ReactNode {
  const normalizedType = (column.type ?? "text").toLowerCase()

  if (value === null || typeof value === "undefined" || value === "") {
    return <span className="text-muted-foreground">—</span>
  }

  if ((normalizedType === "enum" || normalizedType === "select") && typeof value === "string") {
    return (
      <Badge
        className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("primary"))}
        variant="outline"
      >
        {value}
      </Badge>
    )
  }

  return formatValue(value)
}

export const LemmaRecordsTable = React.forwardRef<HTMLDivElement, LemmaRecordsTableProps>(
  ({
    client,
    podId,
    tableName,
    title,
    description,
    limit = 10,
    records,
    isLoading,
    error,
    onRefresh,
    columnNames,
    columns,
    maxColumns = 6,
    search,
    searchFields,
    selectedRecordId,
    recordIdField = "id",
    getRecordId,
    emptyText = "No records found for this table.",
    onRowSelect,
    showSelection = false,
    selectedRecordIds,
    onSelectedRecordIdsChange,
    pageIndex = 0,
    pageSize = limit,
    totalCount,
    hasNextPage = false,
    onPreviousPage,
    onNextPage,
    density = "comfortable",
    hiddenColumnNames,
    defaultHiddenColumnNames = [],
    onHiddenColumnNamesChange,
    allowColumnVisibility = false,
    columnVisibilityLabel = "Columns",
    onCreateRecord,
    createButtonLabel = "New Record",
    rowActions = [],
    rowActionsLabel = "Actions",
    onError,
    className,
    ...props
  }, ref) => {
    const trimmedTableName = tableName.trim()
    const tableState = useTable({
      client,
      podId,
      tableName: trimmedTableName,
      enabled: trimmedTableName.length > 0,
    })
    const recordsState = useRecords({
      client,
      podId,
      tableName: trimmedTableName,
      enabled: trimmedTableName.length > 0 && !records,
      limit,
    })
    const effectiveRecords = records ?? recordsState.records
    const effectiveIsLoading = isLoading ?? recordsState.isLoading
    const effectiveError = error ?? recordsState.error

    React.useEffect(() => {
      if (effectiveError) {
        onError?.(effectiveError)
      }
    }, [effectiveError, onError])

    const deferredSearch = React.useDeferredValue(search ?? "")
    const [isColumnEditorOpen, setIsColumnEditorOpen] = React.useState(false)
    const [internalHiddenColumnNames, setInternalHiddenColumnNames] = React.useState(defaultHiddenColumnNames)

    const setResolvedHiddenColumnNames = React.useCallback((nextHiddenColumnNames: string[]) => {
      if (typeof hiddenColumnNames === "undefined") {
        setInternalHiddenColumnNames(nextHiddenColumnNames)
      }
      onHiddenColumnNamesChange?.(nextHiddenColumnNames)
    }, [hiddenColumnNames, onHiddenColumnNamesChange])

    const resolvedHiddenColumnNames = hiddenColumnNames ?? internalHiddenColumnNames

    const allColumns = React.useMemo<LemmaRecordsTableColumn[]>(() => {
      if (columns?.length) {
        return columns
      }

      if (columnNames?.length) {
        return columnNames.map((columnName) => {
          const schemaColumn = tableState.table?.columns.find((column) => column.name === columnName)
          return {
            name: columnName,
            label: columnName,
            type: schemaColumn?.type?.toLowerCase() ?? "text",
          } satisfies LemmaRecordsTableColumn
        })
      }

      const schemaColumns = tableState.table?.columns
        .filter((column) => column.name !== "created_at" && column.name !== "updated_at")
        .slice(0, maxColumns)
        .map((column) => ({
          name: column.name,
          label: column.name,
          type: column.type.toLowerCase(),
        } satisfies LemmaRecordsTableColumn))

      if (schemaColumns && schemaColumns.length > 0) {
        return schemaColumns
      }

      const discoveredKeys = Array.from(
        new Set(effectiveRecords.flatMap((record) => Object.keys(record))),
      ).slice(0, maxColumns)

      return discoveredKeys.map((columnName) => ({
        name: columnName,
        label: columnName,
        type: "text",
      } satisfies LemmaRecordsTableColumn))
    }, [columnNames, columns, effectiveRecords, maxColumns, tableState.table])

    const hiddenColumnNameSet = React.useMemo(() => {
      const names = new Set(resolvedHiddenColumnNames)
      allColumns.forEach((column) => {
        if (column.hidden) {
          names.add(column.name)
        }
      })
      return names
    }, [allColumns, resolvedHiddenColumnNames])

    const visibleColumns = React.useMemo(
      () => allColumns.filter((column) => !hiddenColumnNameSet.has(column.name)),
      [allColumns, hiddenColumnNameSet],
    )

    const searchableFieldNames = React.useMemo(() => {
      if (searchFields?.length) return searchFields
      return allColumns
        .filter((column) => column.searchable !== false)
        .map((column) => column.name)
    }, [allColumns, searchFields])

    const filteredRecords = React.useMemo(() => {
      const normalizedSearch = deferredSearch.trim().toLowerCase()
      if (!normalizedSearch) return effectiveRecords

      return effectiveRecords.filter((record) => searchableFieldNames.some((field) => {
        const value = record[field]
        if (typeof value === "string") return value.toLowerCase().includes(normalizedSearch)
        if (typeof value === "number" || typeof value === "boolean") {
          return String(value).toLowerCase().includes(normalizedSearch)
        }
        return false
      }))
    }, [deferredSearch, effectiveRecords, searchableFieldNames])

    const selectedIdSet = React.useMemo(
      () => new Set(selectedRecordIds ?? []),
      [selectedRecordIds],
    )
    const visibleSelectableIds = React.useMemo(
      () => filteredRecords
        .map((record) => readRecordId(record, recordIdField, getRecordId))
        .filter((value) => value.length > 0),
      [filteredRecords, getRecordId, recordIdField],
    )
    const allVisibleSelected = visibleSelectableIds.length > 0
      && visibleSelectableIds.every((recordId) => selectedIdSet.has(recordId))
    const selectionEnabled = showSelection && !!onSelectedRecordIdsChange
    const resolvedTotalCount = typeof totalCount === "number" ? totalCount : filteredRecords.length
    const rangeStart = resolvedTotalCount === 0 ? 0 : (pageIndex * pageSize) + 1
    const rangeEnd = Math.min((pageIndex * pageSize) + filteredRecords.length, resolvedTotalCount)
    const rowPadding = density === "compact" ? "py-3" : "py-4"
    const hasRowActions = rowActions.length > 0

    const toggleRecordSelection = React.useCallback((recordId: string, checked: boolean) => {
      if (!onSelectedRecordIdsChange) return

      const nextSelection = new Set(selectedRecordIds ?? [])
      if (checked) {
        nextSelection.add(recordId)
      } else {
        nextSelection.delete(recordId)
      }
      onSelectedRecordIdsChange(Array.from(nextSelection))
    }, [onSelectedRecordIdsChange, selectedRecordIds])

    const toggleVisibleSelection = React.useCallback((checked: boolean) => {
      if (!onSelectedRecordIdsChange) return

      const nextSelection = new Set(selectedRecordIds ?? [])
      visibleSelectableIds.forEach((recordId) => {
        if (checked) {
          nextSelection.add(recordId)
        } else {
          nextSelection.delete(recordId)
        }
      })
      onSelectedRecordIdsChange(Array.from(nextSelection))
    }, [onSelectedRecordIdsChange, selectedRecordIds, visibleSelectableIds])

    if (!trimmedTableName) {
      return (
        <Card ref={ref} className={className} {...props}>
          <CardHeader>
            <CardTitle>{title ?? "Records Table"}</CardTitle>
            <CardDescription>{description ?? "Select a table to preview its records."}</CardDescription>
          </CardHeader>
        </Card>
      )
    }

    return (
      <div ref={ref} className={className} {...props}>
        <div className="grid gap-4">
          {(title || description || onCreateRecord || allowColumnVisibility || onRefresh) ? (
            <Card>
              <CardHeader>
                <DataWorkspaceHeader
                  actions={(
                    <>
                      {allowColumnVisibility && allColumns.length > 0 ? (
                        <Button
                          onClick={() => setIsColumnEditorOpen(true)}
                          type="button"
                          variant="ghost"
                        >
                          {columnVisibilityLabel}
                        </Button>
                      ) : null}
                      <Button
                        disabled={effectiveIsLoading}
                        onClick={() => {
                          if (onRefresh) {
                            onRefresh()
                            return
                          }
                          void recordsState.refresh()
                        }}
                        type="button"
                        variant="ghost"
                      >
                        {effectiveIsLoading ? "Refreshing..." : "Refresh"}
                      </Button>
                      {onCreateRecord ? (
                        <Button onClick={onCreateRecord} type="button">
                          {createButtonLabel}
                        </Button>
                      ) : null}
                    </>
                  )}
                  description={description ?? `Preview the latest ${limit} records from this table.`}
                  eyebrow="Records"
                  meta={(
                    <>
                      <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("primary"))} variant="outline">
                        {trimmedTableName}
                      </Badge>
                      <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
                        {filteredRecords.length} row{filteredRecords.length === 1 ? "" : "s"}
                      </Badge>
                      <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
                        {visibleColumns.length} column{visibleColumns.length === 1 ? "" : "s"}
                      </Badge>
                    </>
                  )}
                  title={title ?? `Records: ${trimmedTableName}`}
                />
              </CardHeader>
            </Card>
          ) : null}

          <div className="rounded-lg border">
            {effectiveError ? (
              <DataWorkspaceState className="m-4" description={effectiveError.message} tone="danger" />
            ) : null}

            {effectiveIsLoading && filteredRecords.length === 0 ? (
              <DataWorkspaceState className="m-4" description="Loading records..." heading="Fetching rows" />
            ) : null}

            {!effectiveIsLoading && filteredRecords.length === 0 ? (
              <DataWorkspaceState className="m-4" description={emptyText} heading="No rows found" />
            ) : null}

            {!effectiveIsLoading && filteredRecords.length === 0 && visibleColumns.length === 0 ? (
              <DataWorkspaceState className="m-4" description="All columns are currently hidden. Reopen the column picker to show fields." heading="Nothing visible" />
            ) : null}

            {filteredRecords.length > 0 && visibleColumns.length > 0 ? (
              <div className="overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                      {selectionEnabled ? (
                        <TableHead className="w-12 border-b px-3">
                          <Checkbox
                            aria-label="Select visible records"
                            checked={allVisibleSelected}
                            onCheckedChange={(checked) => toggleVisibleSelection(checked === true)}
                          />
                        </TableHead>
                      ) : null}
                      {visibleColumns.map((column) => (
                        <TableHead
                          className={cn(
                            "border-b px-4 py-3 align-middle",
                            alignClassName(column.align),
                            column.headerClassName,
                          )}
                          key={column.name}
                          style={{
                            minWidth: normalizeWidth(column.minWidth),
                            width: normalizeWidth(column.width),
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[0.95rem] font-medium text-foreground/85">
                              {headerLabel(column)}
                            </span>
                            <Badge
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-xs",
                                dataWorkspaceTypeBadgeClassName(column.type),
                              )}
                              variant="outline"
                            >
                              {column.type ?? "text"}
                            </Badge>
                          </div>
                        </TableHead>
                      ))}
                      {hasRowActions ? (
                        <TableHead className="border-b px-4 py-3 text-right text-foreground/80">
                          {rowActionsLabel}
                        </TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record, index) => {
                      const rowId = readRecordId(record, recordIdField, getRecordId)
                      const isSelected = !!selectedRecordId && rowId === selectedRecordId

                      return (
                        <TableRow
                          className={cn(
                            dataWorkspaceRowClassName({
                              interactive: !!onRowSelect,
                              selected: isSelected,
                            }),
                            "align-top",
                          )}
                          key={rowId || index}
                          onClick={onRowSelect ? () => onRowSelect(record) : undefined}
                        >
                          {selectionEnabled ? (
                            <TableCell className={cn("w-12 px-3", rowPadding)}>
                              <Checkbox
                                aria-label={`Select record ${rowId || index + 1}`}
                                checked={selectedIdSet.has(rowId)}
                                onCheckedChange={(checked) => {
                                  if (!rowId) return
                                  toggleRecordSelection(rowId, checked === true)
                                }}
                                onClick={(event) => event.stopPropagation()}
                              />
                            </TableCell>
                          ) : null}
                          {visibleColumns.map((column) => {
                            const value = record[column.name]
                            const renderedValue = column.renderCell
                              ? column.renderCell({
                                  record,
                                  value,
                                  column,
                                  rowIndex: index,
                                  isSelected,
                                })
                              : renderCellValue(value, column)

                            return (
                              <TableCell
                                className={cn(
                                  "max-w-[360px] px-4 align-middle",
                                  rowPadding,
                                  alignClassName(column.align),
                                  column.cellClassName,
                                )}
                                key={column.name}
                                style={{
                                  minWidth: normalizeWidth(column.minWidth),
                                  width: normalizeWidth(column.width),
                                }}
                              >
                                <div
                                  className={cn(
                                    "text-[0.98rem] leading-7 text-foreground/92",
                                    typeof renderedValue === "string" || typeof renderedValue === "number" || typeof renderedValue === "boolean"
                                      ? "truncate"
                                      : "whitespace-normal",
                                  )}
                                  title={formatValue(value)}
                                >
                                  {renderedValue}
                                </div>
                              </TableCell>
                            )
                          })}
                          {hasRowActions ? (
                            <TableCell className={cn("px-4 text-right", rowPadding)}>
                              <div className="flex items-center justify-end gap-2">
                                {rowActions.map((action) => (
                                  <Button
                                    disabled={action.disabled?.(record) ?? false}
                                    key={action.key}
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      action.onClick(record)
                                    }}
                                    size="sm"
                                    type="button"
                                    variant={action.variant ?? "ghost"}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {resolvedTotalCount > 0 && (onPreviousPage || onNextPage) ? (
              <div className="flex flex-col gap-4 border-t px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                <div className="inline-flex items-center gap-2">
                  Showing {rangeStart}-{rangeEnd} of {resolvedTotalCount}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    disabled={pageIndex === 0}
                    onClick={onPreviousPage}
                    type="button"
                    variant="ghost"
                  >
                    Previous
                  </Button>
                  <div className="text-sm text-muted-foreground">Page {pageIndex + 1}</div>
                  <Button
                    disabled={!hasNextPage}
                    onClick={onNextPage}
                    type="button"
                    variant="ghost"
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <Sheet open={isColumnEditorOpen} onOpenChange={setIsColumnEditorOpen}>
          <SheetContent className="flex w-full flex-col gap-0 border-l p-0 sm:max-w-xl" side="right">
            <SheetHeader className="border-b px-6 py-5 text-left">
              <SheetTitle>Choose Columns</SheetTitle>
              <SheetDescription>Show or hide fields for this table view.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid gap-3">
                {allColumns.map((column) => {
                  const isHideable = column.hideable !== false
                  const isChecked = !hiddenColumnNameSet.has(column.name)

                  return (
                    <label
                      className={cn(
                        "grid gap-3 rounded-lg border p-4",
                        isHideable ? "cursor-pointer hover:bg-muted/50" : "opacity-70",
                      )}
                      key={column.name}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isChecked}
                          disabled={!isHideable}
                          onCheckedChange={(checked) => {
                            if (!isHideable) return

                            const nextHiddenColumns = new Set(hiddenColumnNameSet)
                            if (checked === true) {
                              nextHiddenColumns.delete(column.name)
                            } else {
                              nextHiddenColumns.add(column.name)
                            }
                            setResolvedHiddenColumnNames(Array.from(nextHiddenColumns))
                          }}
                        />
                        <div className="grid gap-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {headerLabel(column)}
                            </span>
                            <Badge
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-xs",
                                dataWorkspaceTypeBadgeClassName(column.type),
                              )}
                              variant="outline"
                            >
                              {column.type ?? "text"}
                            </Badge>
                          </div>
                          {column.description ? (
                            <p className="text-sm leading-6 text-muted-foreground">{column.description}</p>
                          ) : null}
                          {!isHideable ? (
                            <p className="text-xs text-muted-foreground">
                              This column is locked and cannot be hidden.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="border-t px-6 py-5">
              <div className="flex items-center justify-end gap-3">
                <Button
                  onClick={() => setResolvedHiddenColumnNames([])}
                  type="button"
                  variant="ghost"
                >
                  Show All
                </Button>
                <Button onClick={() => setIsColumnEditorOpen(false)} type="button">
                  Done
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  },
)
LemmaRecordsTable.displayName = "LemmaRecordsTable"
