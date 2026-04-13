"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useRecords, useTable } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

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

export interface LemmaRecordsTableProps {
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

export function LemmaRecordsTable({
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
  density = "compact",
  hiddenColumnNames,
  defaultHiddenColumnNames = [],
  onHiddenColumnNamesChange,
  allowColumnVisibility = false,
  columnVisibilityLabel = "Columns",
  onCreateRecord,
  createButtonLabel = "New Record",
  rowActions = [],
  rowActionsLabel = "Actions",
}: LemmaRecordsTableProps) {
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
          label: sentenceCase(columnName),
          type: schemaColumn?.type?.toLowerCase() ?? "text",
        } satisfies LemmaRecordsTableColumn
      })
    }

    const schemaColumns = tableState.table?.columns
      .filter((column) => column.name !== "created_at" && column.name !== "updated_at")
      .slice(0, maxColumns)
      .map((column) => ({
        name: column.name,
        label: sentenceCase(column.name),
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
      label: sentenceCase(columnName),
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
      <Card>
        <CardHeader>
          <CardTitle>{title ?? "Records Table"}</CardTitle>
          <CardDescription>{description ?? "Select a table to preview its records."}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-1">
              <CardTitle>{title ?? `Records: ${trimmedTableName}`}</CardTitle>
              <CardDescription>
                {description ?? `Preview the latest ${limit} records from this table.`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {onCreateRecord ? (
                <Button onClick={onCreateRecord} type="button">
                  {createButtonLabel}
                </Button>
              ) : null}
              {allowColumnVisibility && allColumns.length > 0 ? (
                <Button
                  onClick={() => setIsColumnEditorOpen(true)}
                  type="button"
                  variant="outline"
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
                variant="outline"
              >
                {effectiveIsLoading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {effectiveError ? (
            <div className="rounded-md border border-[color:var(--resource-danger-border)] bg-[var(--resource-danger-soft)] px-3 py-2 text-sm text-[color:var(--resource-danger)]">
              {effectiveError.message}
            </div>
          ) : null}

          {effectiveIsLoading && filteredRecords.length === 0 ? (
            <div className="rounded-md border border-dashed border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-6 text-sm text-[color:var(--resource-muted)]">
              Loading records…
            </div>
          ) : null}

          {!effectiveIsLoading && filteredRecords.length === 0 ? (
            <div className="rounded-md border border-dashed border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-6 text-sm text-[color:var(--resource-muted)]">
              {emptyText}
            </div>
          ) : null}

          {!effectiveIsLoading && filteredRecords.length > 0 && visibleColumns.length === 0 ? (
            <div className="rounded-md border border-dashed border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-6 text-sm text-[color:var(--resource-muted)]">
              All columns are currently hidden. Reopen the column picker to show fields.
            </div>
          ) : null}

          {filteredRecords.length > 0 && visibleColumns.length > 0 ? (
            <div className="overflow-x-auto rounded-[8px] border border-[color:var(--resource-border)] bg-[var(--resource-surface)]">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--resource-table-header)] text-left text-[color:var(--resource-muted-strong)]">
                  <tr>
                    {selectionEnabled ? (
                      <th className="w-10 px-3 py-3 font-medium">
                        <Checkbox
                          aria-label="Select visible records"
                          checked={allVisibleSelected}
                          onCheckedChange={(checked) => toggleVisibleSelection(checked === true)}
                        />
                      </th>
                    ) : null}
                    {visibleColumns.map((column) => (
                      <th
                        className={[
                          "px-4 py-3 font-medium",
                          alignClassName(column.align),
                          column.headerClassName ?? "",
                        ].join(" ")}
                        key={column.name}
                        style={{
                          minWidth: normalizeWidth(column.minWidth),
                          width: normalizeWidth(column.width),
                        }}
                      >
                        <div className="grid gap-1">
                          <span className="text-base font-medium text-[color:var(--resource-text)]">
                            {column.label ?? sentenceCase(column.name)}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex w-fit rounded-[6px] bg-[var(--resource-badge)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--resource-badge-text)]">
                              {column.type ?? "text"}
                            </span>
                            {column.description ? (
                              <span className="text-xs text-[color:var(--resource-muted)]">
                                {column.description}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </th>
                    ))}
                    {hasRowActions ? (
                      <th className="px-4 py-3 text-right font-medium text-[color:var(--resource-text)]">
                        {rowActionsLabel}
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => {
                    const rowId = readRecordId(record, recordIdField, getRecordId)
                    const isSelected = !!selectedRecordId && rowId === selectedRecordId

                    return (
                      <tr
                        className={[
                          "border-t border-[color:var(--resource-border)] align-top text-[color:var(--resource-text)]",
                          onRowSelect ? "cursor-pointer transition-colors hover:bg-[var(--resource-table-row-hover)]" : "",
                          isSelected ? "bg-[var(--resource-table-row-selected)] shadow-[inset_0_0_0_1px_var(--resource-ring)]" : "",
                        ].join(" ")}
                        key={rowId || index}
                        onClick={onRowSelect ? () => onRowSelect(record) : undefined}
                      >
                        {selectionEnabled ? (
                          <td className={`px-3 ${rowPadding}`}>
                            <Checkbox
                              aria-label={`Select record ${rowId || index + 1}`}
                              checked={selectedIdSet.has(rowId)}
                              onCheckedChange={(checked) => {
                                if (!rowId) return
                                toggleRecordSelection(rowId, checked === true)
                              }}
                              onClick={(event) => event.stopPropagation()}
                            />
                          </td>
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
                            : formatValue(value)

                          return (
                            <td
                              className={[
                                `max-w-[360px] px-4 ${rowPadding}`,
                                alignClassName(column.align),
                                column.cellClassName ?? "",
                              ].join(" ")}
                              key={column.name}
                              style={{
                                minWidth: normalizeWidth(column.minWidth),
                                width: normalizeWidth(column.width),
                              }}
                            >
                              <div className="truncate font-medium text-[color:var(--resource-text)]" title={formatValue(value)}>
                                {renderedValue}
                              </div>
                            </td>
                          )
                        })}
                        {hasRowActions ? (
                          <td className={`px-4 ${rowPadding}`}>
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
                                  variant={action.variant ?? "outline"}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {resolvedTotalCount > 0 && (onPreviousPage || onNextPage) ? (
            <div className="flex flex-col gap-3 border-t border-[color:var(--resource-border)] pt-4 text-sm text-[color:var(--resource-muted-strong)] md:flex-row md:items-center md:justify-between">
              <div>
                Showing {rangeStart}-{rangeEnd} of {resolvedTotalCount}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  disabled={pageIndex === 0}
                  onClick={onPreviousPage}
                  variant="outline"
                >
                  Previous
                </Button>
                <div className="text-xs text-[color:var(--resource-muted)]">Page {pageIndex + 1}</div>
                <Button
                  disabled={!hasNextPage}
                  onClick={onNextPage}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isColumnEditorOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-4 py-8 backdrop-blur-[1px]">
          <div className="w-full max-w-2xl rounded-[8px] border border-[color:var(--resource-border)] bg-[var(--resource-surface)] shadow-[0_28px_90px_-40px_var(--resource-shadow-lg)]">
            <div className="flex items-start justify-between gap-4 border-b border-[color:var(--resource-border)] px-6 py-5">
              <div className="grid gap-2">
                <h3 className="text-2xl font-semibold text-[color:var(--resource-text)]">
                  Choose Columns
                </h3>
                <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--resource-muted-strong)]">
                  Show or hide fields for this table view
                </p>
              </div>
              <Button
                onClick={() => setIsColumnEditorOpen(false)}
                type="button"
                variant="ghost"
              >
                Close
              </Button>
            </div>
            <div className="grid gap-3 px-6 py-6">
              {allColumns.map((column) => {
                const isHideable = column.hideable !== false
                const isChecked = !hiddenColumnNameSet.has(column.name)
                return (
                  <label
                    className={[
                      "flex items-start gap-3 rounded-[8px] border border-[color:var(--resource-border)] px-4 py-3",
                      isHideable ? "cursor-pointer bg-[var(--resource-surface)]" : "bg-[var(--resource-surface-alt)] opacity-70",
                    ].join(" ")}
                    key={column.name}
                  >
                    <Checkbox
                      checked={isChecked}
                      disabled={!isHideable}
                      onCheckedChange={(checked) => {
                        if (!isHideable) return

                        const nextHiddenColumnNames = new Set(hiddenColumnNameSet)
                        if (checked === true) {
                          nextHiddenColumnNames.delete(column.name)
                        } else {
                          nextHiddenColumnNames.add(column.name)
                        }
                        setResolvedHiddenColumnNames(Array.from(nextHiddenColumnNames))
                      }}
                    />
                    <div className="grid gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[color:var(--resource-text)]">
                          {column.label ?? sentenceCase(column.name)}
                        </span>
                        <span className="inline-flex rounded-[6px] bg-[var(--resource-badge)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--resource-badge-text)]">
                          {column.type ?? "text"}
                        </span>
                      </div>
                      {column.description ? (
                        <p className="text-sm text-[color:var(--resource-muted)]">
                          {column.description}
                        </p>
                      ) : null}
                    </div>
                  </label>
                )
              })}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[color:var(--resource-border)] px-6 py-5">
              <Button
                onClick={() => setResolvedHiddenColumnNames([])}
                type="button"
                variant="ghost"
              >
                Show All
              </Button>
              <Button
                onClick={() => setIsColumnEditorOpen(false)}
                type="button"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
