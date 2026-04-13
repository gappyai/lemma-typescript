"use client"

import * as React from "react"
import type { LemmaClient, Table } from "lemma-sdk"
import { useBulkRecords, useRecordSchema, useRecords, useTables } from "lemma-sdk/react"
import { LemmaBulkActionsBar } from "@/components/lemma/lemma-bulk-actions-bar"
import { LemmaRecordDetailsCard } from "@/components/lemma/lemma-record-details-card"
import {
  LemmaRecordFiltersBar,
  type LemmaFilterCondition,
  type LemmaFilterFieldOption,
} from "@/components/lemma/lemma-record-filters-bar"
import { LemmaRecordForm } from "@/components/lemma/lemma-record-form"
import { LemmaRecordPicker } from "@/components/lemma/lemma-record-picker"
import {
  LemmaRecordsTable,
  type LemmaRecordsTableColumn,
  type LemmaRecordsTableRowAction,
} from "@/components/lemma/lemma-records-table"
import { LemmaRelatedRecordsTable } from "@/components/lemma/lemma-related-records-table"
import { LemmaReverseRelatedRecordsTable } from "@/components/lemma/lemma-reverse-related-records-table"
import { LemmaTablePicker } from "@/components/lemma/lemma-table-picker"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SortFieldOption = { value: string; label: string }

export interface LemmaRecordsPageProps {
  client: LemmaClient
  podId?: string
  title?: string
  description?: string
  tables?: Table[]
  isLoadingTables?: boolean
  tablesError?: Error | null
  onRefreshTables?: () => void
  tableName?: string
  onTableNameChange?: (value: string) => void
  initialTableName?: string
  initialRecordId?: string | null
  recordLimit?: number
  showRelatedRecords?: boolean
  showReverseRelations?: boolean
  showTablePicker?: boolean
  showRecordPicker?: boolean
  showRecordDetails?: boolean
  variant?: "workspace" | "browser"
  columns?: LemmaRecordsTableColumn[]
  hiddenColumnNames?: string[]
  defaultHiddenColumnNames?: string[]
  onHiddenColumnNamesChange?: (hiddenColumnNames: string[]) => void
  allowColumnVisibility?: boolean
  allowCreate?: boolean
  allowEdit?: boolean
  allowSelection?: boolean
  allowBulkDelete?: boolean
  allowSearch?: boolean
  allowFilters?: boolean
  allowSorting?: boolean
  allowPageSizeSelect?: boolean
  createButtonLabel?: string
  editButtonLabel?: string
  rowActions?: LemmaRecordsTableRowAction[]
  recordIdField?: string
  getRecordId?: (record: Record<string, unknown>) => string
  recordFormHiddenFields?: string[]
  recordFormFieldOrder?: string[]
  recordFormFieldLabels?: Record<string, string>
  recordFormFieldDescriptions?: Record<string, string>
  createFormTitle?: string
  editFormTitle?: string
  createSubmitLabel?: string
  editSubmitLabel?: string
  tableTitle?: string
  tableDescription?: string
}

function filterRecords(records: Record<string, unknown>[], search: string): Record<string, unknown>[] {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) return records

  return records.filter((record) => Object.values(record).some((value) => {
    if (typeof value === "string") return value.toLowerCase().includes(normalizedSearch)
    if (typeof value === "number" || typeof value === "boolean") return String(value).toLowerCase().includes(normalizedSearch)
    return false
  }))
}

function normalizeComparableValue(value: unknown): string {
  if (value === null || typeof value === "undefined") return ""
  if (typeof value === "string") return value.trim().toLowerCase()
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim().toLowerCase()

  try {
    return JSON.stringify(value).trim().toLowerCase()
  } catch {
    return String(value).trim().toLowerCase()
  }
}

function isEmptyValue(value: unknown): boolean {
  return value === null || typeof value === "undefined" || (typeof value === "string" && value.trim().length === 0)
}

function applyFilterConditions(
  records: Record<string, unknown>[],
  filters: LemmaFilterCondition[],
): Record<string, unknown>[] {
  const activeFilters = filters.filter((filter) => filter.field.trim().length > 0)
  if (activeFilters.length === 0) return records

  return records.filter((record) => activeFilters.every((filter) => {
    const rawValue = record[filter.field]
    const normalizedRecordValue = normalizeComparableValue(rawValue)
    const normalizedFilterValue = normalizeComparableValue(filter.value ?? "")
    const numericRecordValue = typeof rawValue === "number" ? rawValue : Number(rawValue)
    const numericFilterValue = Number(filter.value)

    switch (filter.op) {
      case "contains":
        return normalizedRecordValue.includes(normalizedFilterValue)
      case "does_not_contain":
        return !normalizedRecordValue.includes(normalizedFilterValue)
      case "is":
        return normalizedRecordValue === normalizedFilterValue
      case "is_not":
        return normalizedRecordValue !== normalizedFilterValue
      case "starts_with":
        return normalizedRecordValue.startsWith(normalizedFilterValue)
      case "ends_with":
        return normalizedRecordValue.endsWith(normalizedFilterValue)
      case "gt":
        return Number.isFinite(numericRecordValue) && Number.isFinite(numericFilterValue) && numericRecordValue > numericFilterValue
      case "gte":
        return Number.isFinite(numericRecordValue) && Number.isFinite(numericFilterValue) && numericRecordValue >= numericFilterValue
      case "lt":
        return Number.isFinite(numericRecordValue) && Number.isFinite(numericFilterValue) && numericRecordValue < numericFilterValue
      case "lte":
        return Number.isFinite(numericRecordValue) && Number.isFinite(numericFilterValue) && numericRecordValue <= numericFilterValue
      case "is_empty":
        return isEmptyValue(rawValue)
      case "is_not_empty":
        return !isEmptyValue(rawValue)
      default:
        return true
    }
  }))
}

function readRecordId(
  record: Record<string, unknown>,
  recordIdField: string,
  getRecordId?: (record: Record<string, unknown>) => string,
): string {
  if (getRecordId) {
    return getRecordId(record)
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

function buildSortFieldOptions(table: Table | null): SortFieldOption[] {
  if (!table) return []

  return table.columns
    .map((column) => column.name)
    .filter((name) => name !== "created_at" && name !== "updated_at")
    .map((name) => ({
      value: name,
      label: sentenceCase(name),
    }))
}

function buildFilterFieldOptions(table: Table | null): LemmaFilterFieldOption[] {
  if (!table) return []

  return table.columns
    .filter((column) => !column.system && !column.computed)
    .map((column) => ({
      value: column.name,
      label: sentenceCase(column.name),
      type: column.foreign_key?.references ? "foreign-key" : column.type.toLowerCase(),
      options: column.options ?? [],
    }))
}

export function LemmaRecordsPage({
  client,
  podId,
  title = "Records Page",
  description = "Browse, inspect, edit, and relate table rows from one block.",
  tables,
  isLoadingTables,
  tablesError,
  onRefreshTables,
  tableName,
  onTableNameChange,
  initialTableName = "",
  initialRecordId = null,
  recordLimit = 25,
  showRelatedRecords = true,
  showReverseRelations = true,
  showTablePicker = true,
  showRecordPicker = true,
  showRecordDetails = true,
  variant = "workspace",
  columns,
  hiddenColumnNames,
  defaultHiddenColumnNames = [],
  onHiddenColumnNamesChange,
  allowColumnVisibility = true,
  allowCreate = true,
  allowEdit = true,
  allowSelection = true,
  allowBulkDelete = true,
  allowSearch = true,
  allowFilters = true,
  allowSorting = true,
  allowPageSizeSelect = true,
  createButtonLabel = "New Record",
  editButtonLabel = "Edit Selected",
  rowActions = [],
  recordIdField = "id",
  getRecordId,
  recordFormHiddenFields,
  recordFormFieldOrder,
  recordFormFieldLabels,
  recordFormFieldDescriptions,
  createFormTitle = "New Record",
  editFormTitle = "Edit Record",
  createSubmitLabel = "Create Record",
  editSubmitLabel = "Update Record",
  tableTitle = "Records Table",
  tableDescription = "Click a row to move the form and details panel to that record.",
}: LemmaRecordsPageProps) {
  const hasExternalTables = typeof tables !== "undefined"
  const [internalSelectedTableName, setInternalSelectedTableName] = React.useState(initialTableName)
  const [selectedRecordId, setSelectedRecordId] = React.useState(initialRecordId ?? "")
  const [recordMode, setRecordMode] = React.useState<"create" | "update">(initialRecordId ? "update" : "create")
  const [selectedRelationFieldName, setSelectedRelationFieldName] = React.useState("")
  const [selectedReverseRelationKey, setSelectedReverseRelationKey] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [recordDetailsVersion, setRecordDetailsVersion] = React.useState(0)
  const [selectedRecordIds, setSelectedRecordIds] = React.useState<string[]>([])
  const [pageSize, setPageSize] = React.useState(recordLimit)
  const [offset, setOffset] = React.useState(0)
  const [sortBy, setSortBy] = React.useState("")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")
  const [filters, setFilters] = React.useState<LemmaFilterCondition[]>([])
  const [isRecordFormOpen, setIsRecordFormOpen] = React.useState(false)
  const [internalHiddenColumnNames, setInternalHiddenColumnNames] = React.useState(defaultHiddenColumnNames)
  const selectedTableName = tableName ?? internalSelectedTableName
  const previousTableNameRef = React.useRef(selectedTableName)
  const resolvedSearch = allowSearch ? search : ""
  const resolvedFilters = allowFilters ? filters : []
  const resolvedSortBy = allowSorting ? sortBy : ""
  const resolvedSortOrder: "asc" | "desc" = allowSorting ? sortOrder : "asc"
  const resolvedHiddenColumnNames = hiddenColumnNames ?? internalHiddenColumnNames
  const showBulkBar = variant === "workspace" && allowSelection && allowBulkDelete
  const showCreateAction = variant === "workspace" && allowCreate
  const showEditAction = variant === "workspace" && allowEdit
  const showSelectionControls = variant === "workspace" && allowSelection

  const setResolvedHiddenColumns = React.useCallback((nextHiddenColumnNames: string[]) => {
    if (typeof hiddenColumnNames === "undefined") {
      setInternalHiddenColumnNames(nextHiddenColumnNames)
    }
    onHiddenColumnNamesChange?.(nextHiddenColumnNames)
  }, [hiddenColumnNames, onHiddenColumnNamesChange])

  const setSelectedTableName = React.useCallback((value: string) => {
    if (typeof tableName === "undefined") {
      setInternalSelectedTableName(value)
    }

    onTableNameChange?.(value)
  }, [onTableNameChange, tableName])

  const tablesState = useTables({
    client,
    podId,
    enabled: !hasExternalTables,
    limit: 100,
  })
  const effectiveTables = tables ?? tablesState.tables
  const effectiveTablesIsLoading = isLoadingTables ?? tablesState.isLoading
  const effectiveTablesError = tablesError ?? tablesState.error

  const recordsState = useRecords({
    client,
    podId,
    tableName: selectedTableName,
    enabled: selectedTableName.trim().length > 0,
    limit: pageSize,
    offset,
    sortBy: resolvedSortBy || undefined,
    order: resolvedSortBy ? resolvedSortOrder : undefined,
  })
  const bulkRecords = useBulkRecords({
    client,
    podId,
    tableName: selectedTableName,
    enabled: selectedTableName.trim().length > 0 && showBulkBar,
  })

  const recordSchema = useRecordSchema({
    client,
    podId,
    tableName: selectedTableName,
    enabled: selectedTableName.trim().length > 0,
  })

  React.useEffect(() => {
    if (!selectedTableName && effectiveTables[0]?.name) {
      setSelectedTableName(effectiveTables[0].name)
    }
  }, [effectiveTables, selectedTableName, setSelectedTableName])

  React.useEffect(() => {
    if (previousTableNameRef.current === selectedTableName) {
      return
    }

    previousTableNameRef.current = selectedTableName
    setRecordMode("create")
    setSelectedRecordId("")
    setSelectedRecordIds([])
    setSelectedRelationFieldName("")
    setSelectedReverseRelationKey("")
    setSearch("")
    setFilters([])
    setOffset(0)
    setSortBy("")
    setSortOrder("asc")
    setRecordDetailsVersion((current) => current + 1)
  }, [selectedTableName])

  React.useEffect(() => {
    setOffset(0)
  }, [pageSize, sortBy, sortOrder])

  React.useEffect(() => {
    if (recordMode === "create") {
      setSelectedRecordId("")
      return
    }

    if (!selectedRecordId && recordsState.records[0]) {
      setSelectedRecordId(readRecordId(recordsState.records[0], recordIdField, getRecordId))
    }
  }, [getRecordId, recordIdField, recordMode, recordsState.records, selectedRecordId])

  React.useEffect(() => {
    const visibleRecordIds = new Set(
      recordsState.records
        .map((record) => readRecordId(record, recordIdField, getRecordId))
        .filter((value) => value.length > 0),
    )
    setSelectedRecordIds((current) => current.filter((recordIdValue) => visibleRecordIds.has(recordIdValue)))
  }, [getRecordId, recordIdField, recordsState.records])

  const filteredRecords = React.useMemo(() => {
    const searchedRecords = filterRecords(recordsState.records, resolvedSearch)
    return applyFilterConditions(searchedRecords, resolvedFilters)
  }, [recordsState.records, resolvedFilters, resolvedSearch])

  const relationFields = React.useMemo(
    () => recordSchema.fields.filter((field) => field.foreignKey),
    [recordSchema.fields],
  )

  React.useEffect(() => {
    if (relationFields.length === 0) {
      setSelectedRelationFieldName("")
      return
    }

    setSelectedRelationFieldName((current) => (
      current && relationFields.some((field) => field.name === current)
        ? current
        : (relationFields[0]?.name ?? "")
    ))
  }, [relationFields])

  const selectedRelationField = React.useMemo(
    () => relationFields.find((field) => field.name === selectedRelationFieldName) ?? null,
    [relationFields, selectedRelationFieldName],
  )

  const relatedInclude = React.useMemo(() => {
    if (!selectedRelationField?.foreignKey) return []
    return [{ foreignKey: selectedRelationField.name }]
  }, [selectedRelationField])

  const sortFieldOptions = React.useMemo(
    () => buildSortFieldOptions(recordSchema.table),
    [recordSchema.table],
  )
  const filterFieldOptions = React.useMemo(
    () => buildFilterFieldOptions(recordSchema.table),
    [recordSchema.table],
  )

  const pageIndex = Math.floor(offset / Math.max(pageSize, 1))
  const hasActiveClientFiltering = resolvedSearch.trim().length > 0 || resolvedFilters.length > 0
  const resolvedVisibleTotalCount = hasActiveClientFiltering ? filteredRecords.length : recordsState.total
  const hasNextPage = !hasActiveClientFiltering && (!!recordsState.nextPageToken || (offset + pageSize < recordsState.total))

  const handleDeleteSelected = React.useCallback(async () => {
    if (selectedRecordIds.length === 0) return

    const nextOffset = offset > 0 && selectedRecordIds.length >= recordsState.records.length
      ? Math.max(0, offset - pageSize)
      : offset

    const response = await bulkRecords.deleteMany(selectedRecordIds)
    if (!response) return

    if (selectedRecordIds.includes(selectedRecordId)) {
      setSelectedRecordId("")
      setRecordMode("create")
      setRecordDetailsVersion((current) => current + 1)
    }

    setSelectedRecordIds([])
    if (nextOffset !== offset) {
      setOffset(nextOffset)
    }

    await recordsState.refresh({
      limit: pageSize,
      offset: nextOffset,
      sortBy: resolvedSortBy || undefined,
      order: resolvedSortBy ? resolvedSortOrder : undefined,
    })
  }, [
    bulkRecords,
    offset,
    pageSize,
    recordsState,
    resolvedSortBy,
    resolvedSortOrder,
    selectedRecordId,
    selectedRecordIds,
  ])

  return (
    <div className="grid min-w-0 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {showTablePicker ? (
            <LemmaTablePicker
              client={client}
              description="Choose the active table for this records workspace."
              error={effectiveTablesError}
              isLoading={effectiveTablesIsLoading}
              onRefresh={() => {
                if (onRefreshTables) {
                  onRefreshTables()
                  return
                }
                void tablesState.refresh()
              }}
              onValueChange={setSelectedTableName}
              podId={podId}
              tables={effectiveTables}
              title="Active Table"
              value={selectedTableName}
            />
          ) : null}

          <LemmaRecordFiltersBar
            allowFilters={allowFilters}
            allowPageSizeSelect={allowPageSizeSelect}
            allowSearch={allowSearch}
            allowSorting={allowSorting}
            availableFilterFields={filterFieldOptions}
            availableSortFields={sortFieldOptions}
            filters={filters}
            isRefreshing={recordsState.isLoading}
            onFiltersChange={allowFilters ? setFilters : undefined}
            onPageSizeChange={allowPageSizeSelect ? setPageSize : undefined}
            onRefresh={() => {
              void recordsState.refresh()
            }}
            onSearchChange={setSearch}
            onSortByChange={allowSorting ? setSortBy : undefined}
            onSortOrderChange={allowSorting ? setSortOrder : undefined}
            pageSize={pageSize}
            resultCount={resolvedVisibleTotalCount}
            search={search}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />

          {showBulkBar ? (
            <LemmaBulkActionsBar
              error={bulkRecords.error}
              isDeleting={bulkRecords.isSubmitting}
              message={bulkRecords.lastMessage}
              onClearSelection={() => setSelectedRecordIds([])}
              onDeleteSelected={() => {
                void handleDeleteSelected()
              }}
              selectedCount={selectedRecordIds.length}
            />
          ) : null}

          {showRecordPicker || showEditAction ? (
            <div className={`grid min-w-0 gap-4 ${showRecordPicker && showEditAction ? "md:grid-cols-[minmax(0,1fr)_220px]" : ""}`}>
              {showRecordPicker ? (
                <LemmaRecordPicker
                  client={client}
                  description="Quick-jump to a record in the current table."
                  isLoading={recordsState.isLoading}
                  onRefresh={() => {
                    void recordsState.refresh()
                  }}
                  onSearchChange={setSearch}
                  onValueChange={(value) => {
                    setRecordMode("update")
                    setSelectedRecordId(value)
                  }}
                  podId={podId}
                  records={recordsState.records}
                  search={search}
                  tableName={selectedTableName}
                  title="Record Picker"
                  value={selectedRecordId}
                />
              ) : null}

              {showEditAction ? (
                <div className="grid gap-2">
                  <p className="text-sm font-medium text-[color:var(--resource-text)]">Actions</p>
                  <div className="grid gap-2">
                    <Button
                      disabled={!selectedRecordId}
                      onClick={() => {
                        if (!selectedRecordId) return
                        setRecordMode("update")
                        setIsRecordFormOpen(true)
                      }}
                      type="button"
                      variant="outline"
                    >
                      {editButtonLabel}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <LemmaRecordsTable
        client={client}
        allowColumnVisibility={allowColumnVisibility}
        columnVisibilityLabel="Columns"
        columns={columns}
        createButtonLabel={createButtonLabel}
        defaultHiddenColumnNames={defaultHiddenColumnNames}
        description={tableDescription}
        getRecordId={getRecordId}
        hasNextPage={hasNextPage}
        hiddenColumnNames={resolvedHiddenColumnNames}
        isLoading={recordsState.isLoading}
        onNextPage={() => setOffset((current) => current + pageSize)}
        onPreviousPage={() => setOffset((current) => Math.max(0, current - pageSize))}
        onCreateRecord={showCreateAction ? () => {
          setRecordMode("create")
          setSelectedRecordId("")
          setIsRecordFormOpen(true)
        } : undefined}
        onHiddenColumnNamesChange={setResolvedHiddenColumns}
        onRefresh={() => {
          void recordsState.refresh()
        }}
        onRowSelect={(record) => {
          setSelectedRecordId(readRecordId(record, recordIdField, getRecordId))
          setRecordDetailsVersion((current) => current + 1)
        }}
        onSelectedRecordIdsChange={showSelectionControls ? setSelectedRecordIds : undefined}
        pageIndex={pageIndex}
        pageSize={pageSize}
        podId={podId}
        recordIdField={recordIdField}
        records={filteredRecords}
        rowActions={rowActions}
        search=""
        selectedRecordId={selectedRecordId || null}
        selectedRecordIds={selectedRecordIds}
        showSelection={showSelectionControls}
        tableName={selectedTableName}
        title={tableTitle}
        totalCount={resolvedVisibleTotalCount}
      />

      {showRecordDetails ? (
        <div className="grid min-w-0 gap-6">
          <LemmaRecordDetailsCard
            client={client}
            key={`${selectedTableName}:${selectedRecordId}:${recordDetailsVersion}`}
            description={selectedRecordId ? "Inspect the current row." : "Select a row to inspect it in detail."}
            podId={podId}
            recordId={selectedRecordId || null}
            tableName={selectedTableName}
            title="Record Details"
          />
        </div>
      ) : null}

      {variant === "workspace" && isRecordFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-4 py-6 backdrop-blur-[1px]">
          <div className="h-[calc(100vh-3rem)] w-full max-w-4xl overflow-hidden rounded-[8px] border border-[color:var(--resource-border)] bg-[var(--resource-surface)] shadow-[0_28px_90px_-40px_var(--resource-shadow-lg)]">
            <LemmaRecordForm
              appearance="modal"
              client={client}
              description={
                selectedTableName
                  ? `Schema-aware form for ${selectedTableName}. ${recordSchema.editableFields.length} editable fields available.`
                  : "Select a table to start editing records."
              }
              mode={recordMode}
              onCancel={() => setIsRecordFormOpen(false)}
              onSubmitted={(record) => {
                const nextRecordId = readRecordId(record, recordIdField, getRecordId)
                void recordsState.refresh({
                  limit: pageSize,
                  offset,
                  sortBy: resolvedSortBy || undefined,
                  order: resolvedSortBy ? resolvedSortOrder : undefined,
                })
                if (nextRecordId) {
                  setSelectedRecordId(nextRecordId)
                }
                setRecordMode("update")
                setIsRecordFormOpen(false)
                setRecordDetailsVersion((current) => current + 1)
              }}
              fieldDescriptions={recordFormFieldDescriptions}
              fieldLabels={recordFormFieldLabels}
              fieldOrder={recordFormFieldOrder}
              hiddenFields={recordFormHiddenFields}
              podId={podId}
              recordId={recordMode === "update" ? selectedRecordId || null : null}
              submitLabel={recordMode === "update" ? editSubmitLabel : createSubmitLabel}
              tableName={selectedTableName}
              title={recordMode === "update" ? editFormTitle : createFormTitle}
            />
          </div>
        </div>
      ) : null}

      {showRelatedRecords ? (
        <div className="grid gap-4">
          {relationFields.length > 1 ? (
            <Card>
              <CardHeader>
                <CardTitle>Forward Relation Picker</CardTitle>
                <CardDescription>Choose which foreign-key relationship to preview from the active table.</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedRelationFieldName} onValueChange={setSelectedRelationFieldName}>
                  <SelectTrigger id="lemma-records-page-relation">
                    <SelectValue placeholder="Select a relation" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationFields.map((field) => (
                      <SelectItem key={field.name} value={field.name}>
                        {field.foreignKey ? `${field.name} -> ${field.foreignKey.table}` : field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ) : null}

          <LemmaRelatedRecordsTable
            client={client}
            description={
              selectedRelationField?.foreignKey
                ? `Following ${selectedTableName}.${selectedRelationField.name} into ${selectedRelationField.foreignKey.table}.`
                : "Choose a table with a foreign key to preview related data."
            }
            include={relatedInclude}
            podId={podId}
            tableName={selectedTableName}
            title="Related Records"
          />
        </div>
      ) : null}

      {showReverseRelations ? (
        <LemmaReverseRelatedRecordsTable
          client={client}
          description="Child rows discovered from other tables that reference the currently selected record."
          onRelationChange={(relationValue) => {
            setSelectedReverseRelationKey(
              relationValue ? `${relationValue.tableName}:${relationValue.foreignKey}` : "",
            )
          }}
          podId={podId}
          recordId={recordMode === "update" ? selectedRecordId || null : null}
          relation={selectedReverseRelationKey
            ? {
                tableName: selectedReverseRelationKey.split(":")[0] ?? "",
                foreignKey: selectedReverseRelationKey.split(":")[1] ?? "",
              }
            : null}
          tableName={selectedTableName}
          title="Reverse Related Records"
        />
      ) : null}
    </div>
  )
}
