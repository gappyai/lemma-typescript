"use client"

import * as React from "react"
import type { LemmaClient, Table } from "lemma-sdk"
import { useBulkRecords, useRecordSchema, useRecords, useTables } from "lemma-sdk/react"
import { LemmaBulkActionsBar } from "@/components/lemma/lemma-bulk-actions-bar"
import { LemmaRecordDetailsCard } from "@/components/lemma/lemma-record-details-card"
import { LemmaRecordFiltersBar } from "@/components/lemma/lemma-record-filters-bar"
import { LemmaRecordForm } from "@/components/lemma/lemma-record-form"
import { LemmaRecordPicker } from "@/components/lemma/lemma-record-picker"
import { LemmaRecordsTable } from "@/components/lemma/lemma-records-table"
import { LemmaRelatedRecordsTable } from "@/components/lemma/lemma-related-records-table"
import { LemmaReverseRelatedRecordsTable } from "@/components/lemma/lemma-reverse-related-records-table"
import { LemmaTablePicker } from "@/components/lemma/lemma-table-picker"
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
  variant?: "workspace" | "browser"
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

function readRecordId(record: Record<string, unknown>): string {
  const value = record.id
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
  variant = "workspace",
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
  const selectedTableName = tableName ?? internalSelectedTableName
  const previousTableNameRef = React.useRef(selectedTableName)

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
    sortBy: sortBy || undefined,
    order: sortBy ? sortOrder : undefined,
  })
  const bulkRecords = useBulkRecords({
    client,
    podId,
    tableName: selectedTableName,
    enabled: selectedTableName.trim().length > 0 && variant === "workspace",
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

    if (!selectedRecordId && recordsState.records[0]?.id) {
      setSelectedRecordId(String(recordsState.records[0].id))
    }
  }, [recordMode, recordsState.records, selectedRecordId])

  React.useEffect(() => {
    const visibleRecordIds = new Set(recordsState.records.map((record) => readRecordId(record)).filter((value) => value.length > 0))
    setSelectedRecordIds((current) => current.filter((recordIdValue) => visibleRecordIds.has(recordIdValue)))
  }, [recordsState.records])

  const filteredRecords = React.useMemo(
    () => filterRecords(recordsState.records, search),
    [recordsState.records, search],
  )

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

  const pageIndex = Math.floor(offset / Math.max(pageSize, 1))
  const hasNextPage = !!recordsState.nextPageToken || (offset + pageSize < recordsState.total)

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
      sortBy: sortBy || undefined,
      order: sortBy ? sortOrder : undefined,
    })
  }, [
    bulkRecords,
    offset,
    pageSize,
    recordsState,
    selectedRecordId,
    selectedRecordIds,
    sortBy,
    sortOrder,
  ])

  return (
    <div className="grid min-w-0 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
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

          <LemmaRecordFiltersBar
            availableSortFields={sortFieldOptions}
            isRefreshing={recordsState.isLoading}
            onPageSizeChange={setPageSize}
            onRefresh={() => {
              void recordsState.refresh()
            }}
            onSearchChange={setSearch}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
            pageSize={pageSize}
            resultCount={search.trim().length > 0 ? filteredRecords.length : recordsState.total}
            search={search}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />

          {variant === "workspace" ? (
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

          <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
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

            <div className="grid gap-2">
              <p className="text-sm font-medium text-[color:var(--resource-text)]">Mode</p>
              <Select value={recordMode} onValueChange={(value) => setRecordMode(value as "create" | "update")}>
                <SelectTrigger id="lemma-records-page-mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">Create new record</SelectItem>
                  <SelectItem value="update">Edit existing record</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <LemmaRecordsTable
        client={client}
        description="Click a row to move the form and details panel to that record."
        hasNextPage={hasNextPage}
        isLoading={recordsState.isLoading}
        onNextPage={() => setOffset((current) => current + pageSize)}
        onPreviousPage={() => setOffset((current) => Math.max(0, current - pageSize))}
        onRefresh={() => {
          void recordsState.refresh()
        }}
        onRowSelect={(record) => {
          setRecordMode("update")
          setSelectedRecordId(String(record.id ?? ""))
        }}
        onSelectedRecordIdsChange={variant === "workspace" ? setSelectedRecordIds : undefined}
        pageIndex={pageIndex}
        pageSize={pageSize}
        podId={podId}
        records={recordsState.records}
        search={search}
        selectedRecordId={recordMode === "update" ? selectedRecordId : null}
        selectedRecordIds={selectedRecordIds}
        showSelection={variant === "workspace"}
        tableName={selectedTableName}
        title="Records Table"
        totalCount={recordsState.total}
      />

      <div className={variant === "workspace" ? "grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "grid min-w-0 gap-6"}>
        <LemmaRecordDetailsCard
          client={client}
          key={`${selectedTableName}:${selectedRecordId}:${recordDetailsVersion}`}
          description={recordMode === "update" ? "Inspect the current row." : "Switch to update mode to inspect a record."}
          podId={podId}
          recordId={recordMode === "update" ? selectedRecordId || null : null}
          tableName={selectedTableName}
          title="Record Details"
        />

        {variant === "workspace" ? (
          <LemmaRecordForm
            client={client}
            description={
              selectedTableName
                ? `Schema-aware form for ${selectedTableName}. ${recordSchema.editableFields.length} editable fields available.`
                : "Select a table to start editing records."
            }
            mode={recordMode}
            onSubmitted={() => {
              void recordsState.refresh({
                limit: pageSize,
                offset,
                sortBy: sortBy || undefined,
                order: sortBy ? sortOrder : undefined,
              })
              setRecordDetailsVersion((current) => current + 1)
            }}
            podId={podId}
            recordId={recordMode === "update" ? selectedRecordId || null : null}
            submitLabel={recordMode === "update" ? "Update record" : "Create record"}
            tableName={selectedTableName}
            title="Record Form"
          />
        ) : null}
      </div>

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
