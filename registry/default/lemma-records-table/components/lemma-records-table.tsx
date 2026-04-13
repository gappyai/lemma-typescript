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
  maxColumns?: number
  search?: string
  searchFields?: string[]
  selectedRecordId?: string | null
  recordIdField?: string
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

function getRecordId(record: Record<string, unknown>, recordIdField: string): string {
  const value = record[recordIdField]
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
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
  maxColumns = 6,
  search,
  searchFields,
  selectedRecordId,
  recordIdField = "id",
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

  const visibleColumns = React.useMemo(() => {
    if (columnNames?.length) return columnNames

    const schemaColumns = tableState.table?.columns
      .map((column) => column.name)
      .filter((name) => name !== "created_at" && name !== "updated_at")

    if (schemaColumns && schemaColumns.length > 0) {
      return schemaColumns.slice(0, maxColumns)
    }

    const discoveredKeys = Array.from(
      new Set(effectiveRecords.flatMap((record) => Object.keys(record))),
    )

    return discoveredKeys.slice(0, maxColumns)
  }, [columnNames, effectiveRecords, maxColumns, tableState.table])

  const filteredRecords = React.useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase()
    if (!normalizedSearch) return effectiveRecords

    const activeSearchFields = searchFields?.length
      ? searchFields
      : visibleColumns

    return effectiveRecords.filter((record) => activeSearchFields.some((field) => {
      const value = record[field]
      if (typeof value === "string") return value.toLowerCase().includes(normalizedSearch)
      if (typeof value === "number" || typeof value === "boolean") {
        return String(value).toLowerCase().includes(normalizedSearch)
      }
      return false
    }))
  }, [deferredSearch, effectiveRecords, searchFields, visibleColumns])

  const selectedIdSet = React.useMemo(
    () => new Set(selectedRecordIds ?? []),
    [selectedRecordIds],
  )
  const visibleSelectableIds = React.useMemo(
    () => filteredRecords
      .map((record) => getRecordId(record, recordIdField))
      .filter((value) => value.length > 0),
    [filteredRecords, recordIdField],
  )
  const allVisibleSelected = visibleSelectableIds.length > 0
    && visibleSelectableIds.every((recordId) => selectedIdSet.has(recordId))
  const selectionEnabled = showSelection && !!onSelectedRecordIdsChange
  const resolvedTotalCount = typeof totalCount === "number" ? totalCount : filteredRecords.length
  const rangeStart = resolvedTotalCount === 0 ? 0 : (pageIndex * pageSize) + 1
  const rangeEnd = Math.min((pageIndex * pageSize) + filteredRecords.length, resolvedTotalCount)

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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>{title ?? `Records: ${trimmedTableName}`}</CardTitle>
            <CardDescription>
              {description ?? `Preview the latest ${limit} records from this table.`}
            </CardDescription>
          </div>
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

        {filteredRecords.length > 0 && visibleColumns.length > 0 ? (
          <div className="overflow-x-auto rounded-[calc(var(--resource-radius-md)-0.2rem)] border border-[color:var(--resource-border)]">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[var(--resource-table-header)] text-left text-[color:var(--resource-muted-strong)]">
                <tr>
                  {selectionEnabled ? (
                    <th className="w-10 px-3 py-2 font-medium">
                      <Checkbox
                        aria-label="Select visible records"
                        checked={allVisibleSelected}
                        onCheckedChange={(checked) => toggleVisibleSelection(checked === true)}
                      />
                    </th>
                  ) : null}
                  {visibleColumns.map((columnName) => (
                    <th key={columnName} className="px-3 py-2 font-medium">
                      {columnName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => {
                  const rowId = getRecordId(record, recordIdField)
                  const isSelected = !!selectedRecordId && rowId === selectedRecordId

                  return (
                    <tr
                      key={rowId || index}
                      className={[
                        "border-t border-[color:var(--resource-border)] align-top text-[color:var(--resource-text)]",
                        onRowSelect ? "cursor-pointer transition-colors hover:bg-[var(--resource-table-row-hover)]" : "",
                        isSelected ? "bg-[var(--resource-table-row-selected)]" : "",
                      ].join(" ")}
                      onClick={onRowSelect ? () => onRowSelect(record) : undefined}
                    >
                      {selectionEnabled ? (
                        <td className="px-3 py-2">
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
                      {visibleColumns.map((columnName) => (
                        <td key={columnName} className="max-w-[220px] px-3 py-2">
                          <div className="truncate" title={formatValue(record[columnName])}>
                            {formatValue(record[columnName])}
                          </div>
                        </td>
                      ))}
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
  )
}
