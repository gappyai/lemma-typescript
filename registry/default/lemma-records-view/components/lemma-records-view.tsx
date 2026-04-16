"use client"

import * as React from "react"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Database,
  Filter,
  List,
  LayoutGrid,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  MoreVertical,
  Rows3,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table as DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useTable,
  useRecords,
  useForeignKeyOptions,
} from "lemma-sdk/react"
import type { LemmaClient, ColumnSchema, RecordFilter, Table } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { EditableCell } from "./records-editable-cell"
import { FilterBuilder } from "./records-filter-builder"
import { DetailSheet } from "./records-detail-sheet"
import { ListView } from "./records-list-view"
import { GroupedView } from "./records-grouped-view"
import { isSystemField, typeBadgeClasses, enumPillClasses, type EnumColorMap } from "./records-enum-utils"
import { RecordFormSheet } from "./records-form-sheet"
import type { ForeignKeyLabelMap } from "./records-display-utils"
import type {
  RecordDetailRelatedRecord,
  RecordDetailTab,
  RecordDetailVariant,
} from "./records-detail"
import {
  recordsRadiusClassName,
  type LemmaRecordsAppearance,
  type LemmaRecordsDensity,
  type LemmaRecordsRadius,
} from "./records-style-utils"

export type { LemmaRecordsAppearance, LemmaRecordsDensity, LemmaRecordsRadius } from "./records-style-utils"

type ViewMode = "grid" | "list" | "grouped" | "kanban" | "linear"
type ResolvedViewMode = "grid" | "list" | "kanban" | "linear"
type CreateMode = "sheet" | "modal" | "page"
type DetailMode = "sheet" | "modal" | "page"
type PaginationMode = "pagination" | "load-more" | "infinite"

export interface LemmaRecordsViewProps {
  client: LemmaClient
  podId?: string
  tableName: string
  enabled?: boolean

  visibleColumns?: string[]
  hiddenFields?: string[]
  columnLabels?: Record<string, string>
  showTypeHints?: boolean
  enumColorMap?: EnumColorMap
  renderCell?: (record: Record<string, unknown>, column: ColumnSchema, value: unknown) => React.ReactNode
  renderCard?: (record: Record<string, unknown>, columns: ColumnSchema[]) => React.ReactNode
  foreignKeyLabels?: Record<string, string>
  searchFields?: string[]
  searchPlaceholder?: string

  defaultView?: ViewMode
  appearance?: LemmaRecordsAppearance
  density?: LemmaRecordsDensity
  radius?: LemmaRecordsRadius
  groupBy?: string
  defaultFilters?: RecordFilter[]
  pageSize?: number
  paginationMode?: PaginationMode
  createMode?: CreateMode
  createRoute?: string | (() => string)
  detailMode?: DetailMode
  detailRoute?: (record: Record<string, unknown>) => string
  detailVariant?: RecordDetailVariant
  detailTabs?: RecordDetailTab[]
  detailRelatedRecords?: RecordDetailRelatedRecord[]
  detailEditable?: boolean
  renderFilesTab?: (context: { record: Record<string, unknown>; table: Table; recordId: string }) => React.ReactNode

  onCreateOptions?: {
    submitVia?: "direct" | "function"
    submitFunctionName?: string
    hiddenFields?: string[]
  }
  onUpdateOptions?: {
    updateVia?: "direct" | "function"
    updateFunctionName?: string
  }

  title?: React.ReactNode
  headerActions?: React.ReactNode
  emptyState?: React.ReactNode
  className?: string
  onRecordClick?: (record: Record<string, unknown>) => void
}

export function LemmaRecordsView({
  client,
  podId,
  tableName,
  enabled = true,
  visibleColumns: visibleColumnNames,
  hiddenFields = [],
  columnLabels,
  showTypeHints = false,
  enumColorMap,
  renderCell,
  renderCard,
  foreignKeyLabels,
  searchFields,
  searchPlaceholder = "Search…",
  defaultView = "grid",
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  groupBy: groupByProp,
  defaultFilters = [],
  pageSize = 50,
  paginationMode = "pagination",
  createMode = "sheet",
  createRoute,
  detailMode = "sheet",
  detailRoute,
  detailVariant = "workspace",
  detailTabs,
  detailRelatedRecords,
  detailEditable = true,
  renderFilesTab,
  onCreateOptions,
  onUpdateOptions,
  title,
  headerActions,
  emptyState,
  className,
  onRecordClick,
}: LemmaRecordsViewProps) {
  const [viewMode, setViewMode] = React.useState<ResolvedViewMode>(normalizeViewMode(defaultView))
  const [filters, setFilters] = React.useState<RecordFilter[]>(defaultFilters)
  const [showFilterBuilder, setShowFilterBuilder] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())
  const [detailRecord, setDetailRecord] = React.useState<Record<string, unknown> | null>(null)
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [foreignKeyLabelMap, setForeignKeyLabelMap] = React.useState<ForeignKeyLabelMap>({})
  const [page, setPage] = React.useState(0)
  const [sortField, setSortField] = React.useState<string | null>(null)
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const [infiniteSentinel, setInfiniteSentinel] = React.useState<HTMLDivElement | null>(null)

  const tableState = useTable({ client, podId, tableName, enabled })
  const table = tableState.table
  const queryFilters = React.useMemo(() => normalizeRecordFilters(filters), [filters])

  const recordsState = useRecords({
    client,
    podId,
    tableName,
    filters: queryFilters.length > 0 ? queryFilters : undefined,
    sortBy: sortField ?? undefined,
    order: sortField ? sortOrder : undefined,
    limit: pageSize,
    offset: paginationMode === "pagination" ? page * pageSize : 0,
    enabled: !!table && enabled,
  })

  const records = recordsState.records
  const total = recordsState.total
  const pk = table?.primary_key_column ?? "id"

  const resolvedColumns = React.useMemo(() => {
    if (!table) return []
    const cols = table.columns.filter((c) => !hiddenFields.includes(c.name))
    if (visibleColumnNames) {
      return visibleColumnNames
        .map((n) => cols.find((c) => c.name === n))
        .filter(Boolean) as ColumnSchema[]
    }
    return cols
  }, [table, visibleColumnNames, hiddenFields])

  const foreignKeyColumns = React.useMemo(
    () => resolvedColumns.filter((column) => !!column.foreign_key),
    [resolvedColumns],
  )

  const groupByColumn = React.useMemo(() => {
    if (!table) return null
    if (groupByProp) return table.columns.find((c) => c.name === groupByProp) ?? null
    return (
      table.columns.find((c) => /status|stage|state|priority|type|category/i.test(c.name) && c.type === "ENUM") ?? null
    )
  }, [table, groupByProp])

  const getRecordId = (r: Record<string, unknown>) => String(r[pk] ?? "")
  const deferredSearch = React.useDeferredValue(search)
  const searchQuery = deferredSearch.trim().toLowerCase()
  const searchableColumnNames = React.useMemo(() => {
    if (searchFields?.length) return searchFields
    return resolvedColumns.filter(isSearchableColumn).map((c) => c.name)
  }, [resolvedColumns, searchFields])
  const displayedRecords = React.useMemo(() => {
    if (!searchQuery) return records
    return records.filter((record) =>
      searchableColumnNames.some((name) => matchesSearchValue(record[name], searchQuery)),
    )
  }, [records, searchQuery, searchableColumnNames])
  const displayedRecordIds = React.useMemo(() => displayedRecords.map(getRecordId), [displayedRecords, pk])
  const allDisplayedSelected =
    displayedRecordIds.length > 0 && displayedRecordIds.every((id) => selectedRows.has(id))
  const hasSearch = searchQuery.length > 0
  const hasFilters = filters.length > 0
  const hasActiveConstraints = hasSearch || hasFilters
  const pageStart = total === 0 ? 0 : page * pageSize + 1
  const pageEnd = Math.min(page * pageSize + records.length, total)
  const isGroupedView = (viewMode === "kanban" || viewMode === "linear") && !!groupByColumn
  const canLoadMore = records.length < total || !!recordsState.nextPageToken
  const progressivePagination = paginationMode === "load-more" || paginationMode === "infinite"
  const detailRecordIndex = detailRecord
    ? displayedRecords.findIndex((r) => getRecordId(r) === getRecordId(detailRecord))
    : -1

  const handleSortColumn = (colName: string) => {
    if (sortField === colName) {
      if (sortOrder === "asc") {
        setSortOrder("desc")
      } else {
        setSortField(null)
        setSortOrder("asc")
      }
    } else {
      setSortField(colName)
      setSortOrder("asc")
    }
    setPage(0)
  }

  const applyFilters = (nextFilters: RecordFilter[]) => {
    setFilters(nextFilters)
    setPage(0)
    setSelectedRows(new Set())
  }

  const clearSearch = () => setSearch("")

  const clearAllConstraints = () => {
    setSearch("")
    applyFilters([])
  }

  const handleSelectAll = () => {
    if (allDisplayedSelected) {
      setSelectedRows((prev) => {
        const next = new Set(prev)
        for (const id of displayedRecordIds) next.delete(id)
        return next
      })
    } else {
      setSelectedRows((prev) => {
        const next = new Set(prev)
        for (const id of displayedRecordIds) next.add(id)
        return next
      })
    }
  }

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleRecordClick = (record: Record<string, unknown>) => {
    if (onRecordClick) {
      onRecordClick(record)
      return
    }
    if (detailMode === "page" && detailRoute) {
      navigateTo(detailRoute(record))
      return
    }
    setDetailRecord(record)
  }

  const handleLoadMore = React.useCallback(async () => {
    if (!canLoadMore || recordsState.isLoading || recordsState.isLoadingMore) return
    await recordsState.loadMore()
  }, [canLoadMore, recordsState])

  React.useEffect(() => {
    if (paginationMode !== "infinite") return
    if (!infiniteSentinel || !canLoadMore || recordsState.isLoading || recordsState.isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void handleLoadMore()
        }
      },
      { root: contentRef.current, rootMargin: "320px 0px" },
    )

    observer.observe(infiniteSentinel)
    return () => observer.disconnect()
  }, [
    canLoadMore,
    handleLoadMore,
    infiniteSentinel,
    paginationMode,
    recordsState.isLoading,
    recordsState.isLoadingMore,
  ])

  const handleCreateClick = () => {
    if (createMode === "page" && createRoute) {
      navigateTo(typeof createRoute === "function" ? createRoute() : createRoute)
      return
    }
    setShowCreateForm(true)
  }

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedRows)
    if (!confirm(`Delete ${ids.length} record(s)?`)) return
    for (const id of ids) {
      const scoped = podId ? client.withPod(podId) : client
      await scoped.records.delete(tableName, id)
    }
    setSelectedRows(new Set())
    recordsState.refresh()
  }

  const handleUpdateRecord = async (recordId: string, data: Record<string, unknown>) => {
    const scoped = podId ? client.withPod(podId) : client
    if (onUpdateOptions?.updateVia === "function") {
      await scoped.functions.runs.create(onUpdateOptions.updateFunctionName ?? tableName, {
        input: { ...data, id: recordId, record_id: recordId },
      })
    } else {
      await scoped.records.update(tableName, recordId, data)
    }
    recordsState.refresh()
  }

  const handleResolveForeignKeyLabels = React.useCallback((columnName: string, labels: Record<string, string>) => {
    setForeignKeyLabelMap((previous) => {
      if (shallowEqualLabelMap(previous[columnName], labels)) return previous
      return { ...previous, [columnName]: labels }
    })
  }, [])

  if (tableState.isLoading) {
    return (
      <div className={cn("flex flex-col gap-4 p-6", recordsSurfaceClassName(appearance, radius))}>
        <div className="flex items-center gap-3">
          <Skeleton className="size-7 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <RecordsSkeletonGrid columnCount={4} rowCount={6} density={density} />
      </div>
    )
  }

  if (!table) {
    return (
      <div className={cn("flex h-64 flex-col items-center justify-center px-6 text-center", recordsSurfaceClassName(appearance, radius, true))}>
        <p className="text-lg font-semibold text-foreground">Table not found</p>
        <p className="mt-1 text-sm text-muted-foreground">The table &quot;{tableName}&quot; could not be loaded.</p>
      </div>
    )
  }

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-records-view flex h-full min-h-0 flex-col", recordsRootClassName(appearance), className)}
    >
      {foreignKeyColumns.map((column) => (
        <ForeignKeyLabelResolver
          key={column.name}
          client={client}
          podId={podId}
          tableName={tableName}
          column={column}
          labelField={foreignKeyLabels?.[column.name]}
          onResolve={handleResolveForeignKeyLabels}
        />
      ))}

      <div className={cn("shrink-0 backdrop-blur-sm", recordsHeaderClassName(appearance))}>
        <div className={cn("flex flex-col lg:flex-row lg:items-center lg:justify-between", recordsToolbarClassName(density))}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground", recordsRadiusClassName(radius, "control"))}>
                <Database className="size-3.5" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-foreground">
                  {title ?? table.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {hasSearch ? `${displayedRecords.length} matching on this page` : `${total} records`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn("h-8 w-full pl-8 pr-8 text-xs sm:w-56", recordsRadiusClassName(radius, "control"))}
              />
              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className={cn("absolute right-2 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", recordsRadiusClassName(radius, "control"))}
                >
                  <X className="size-3" />
                  <span className="sr-only">Clear search</span>
                </button>
              )}
            </div>

            <div className={cn("mx-1 h-5 w-px bg-border/50", appearance === "borderless" && "hidden")} />

            <ViewModeToggle mode={viewMode} onChange={setViewMode} hasGroupBy={!!groupByColumn} radius={radius} />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilterBuilder(true)}
              className="h-8 gap-2 text-xs"
            >
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              Filter{filters.length > 0 ? ` (${filters.length})` : ""}
            </Button>

            {hasActiveConstraints && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllConstraints}
                className="h-8 gap-2 text-xs text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}

            {headerActions}

            <div className={cn("mx-1 h-5 w-px bg-border/50", appearance === "borderless" && "hidden")} />

            <Button
              size="sm"
              onClick={handleCreateClick}
              className="h-8 gap-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
        </div>

        {hasFilters && (
          <div className={cn("flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground", appearance === "borderless" ? "border-t-0" : appearance === "minimal" ? "border-t border-border/15" : "border-t border-border/30")}>
            <span className="font-medium text-foreground">Filtered by</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {filters.map((filter, index) => (
                <button
                  key={`${filter.field}-${filter.op}-${index}`}
                  type="button"
                  onClick={() => applyFilters(filters.filter((_, i) => i !== index))}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-0.5 text-foreground transition-colors hover:bg-muted/60"
                >
                  <span>{filter.field}</span>
                  <span className="text-muted-foreground">{filter.op}</span>
                  {filter.value != null && filter.value !== "" && <span>{String(filter.value)}</span>}
                  <X className="size-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedRows.size > 0 && (
        <div className={cn("absolute left-1/2 top-20 z-30 flex -translate-x-1/2 items-center gap-4 rounded-full px-5 py-2.5 shadow-lg backdrop-blur-sm", recordsFloatingClassName(appearance))}>
          <span className="text-sm font-medium text-foreground">{selectedRows.size} selected</span>
          <div className="h-4 w-px bg-border" />
          <Button variant="ghost" size="sm" className="h-8 rounded-full" onClick={handleDeleteSelected}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5 text-destructive" />
            Delete
          </Button>
        </div>
      )}

      <div ref={contentRef} className={cn("flex-1 overflow-auto", recordsContentClassName(density))}>
        {recordsState.error ? (
          <RecordsErrorState error={recordsState.error} radius={radius} onRetry={() => recordsState.refresh()} />
        ) : viewMode === "grid" ? (
          <div className={cn("overflow-auto", recordsSurfaceClassName(appearance, radius))}>
            <DataTable className="min-w-full table-fixed">
              <TableHeader className={cn("sticky top-0 z-10 backdrop-blur-md", appearance === "minimal" || appearance === "borderless" ? "border-b border-border/15 bg-background/80" : "border-b border-border/30 bg-card/95")}>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 px-2 py-2 text-center">
                    <Checkbox
                      checked={allDisplayedSelected}
                      onCheckedChange={handleSelectAll}
                      className="h-4 w-4 rounded"
                    />
                  </TableHead>
                  {resolvedColumns.map((col) => (
                    <TableHead
                      key={col.name}
                      className={cn("cursor-pointer select-none px-3 text-left text-xs font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground", density === "compact" ? "py-2" : density === "spacious" ? "py-3.5" : "py-2.5")}
                      onClick={() => handleSortColumn(col.name)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{columnLabels?.[col.name] ?? col.name.replace(/_/g, " ")}</span>
                        {sortField === col.name ? (
                          sortOrder === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                        ) : null}
                        {showTypeHints && (
                          <span className={typeBadgeClasses(col)}>
                            {col.foreign_key ? "ref" : col.type.toLowerCase()}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-10 px-2 py-2" />
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/20">
                {recordsState.isLoading ? (
                  <RecordsSkeletonTableRows columnCount={resolvedColumns.length + 2} rowCount={8} density={density} />
                ) : displayedRecords.length === 0 ? (
                  <RecordsTableMessage colSpan={resolvedColumns.length + 2}>
                    <EmptyRecordsState
                      constrained={hasActiveConstraints}
                      emptyState={emptyState}
                      radius={radius}
                      onClear={hasActiveConstraints ? clearAllConstraints : undefined}
                      onCreate={handleCreateClick}
                    />
                  </RecordsTableMessage>
                ) : (
                  displayedRecords.map((record) => {
                    const id = getRecordId(record)
                    const selected = selectedRows.has(id)
                    return (
                      <TableRow
                        key={id}
                        data-state={selected ? "selected" : undefined}
                        className={cn(
                          "group transition-colors duration-75",
                          selected && "bg-primary/5",
                        )}
                      >
                        <TableCell className="px-2 py-1 text-center">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => handleSelectRow(id)}
                            className={cn(
                              "h-4 w-4 rounded opacity-0 transition-opacity group-hover:opacity-100",
                              selected && "opacity-100",
                            )}
                          />
                        </TableCell>
                        {resolvedColumns.map((col) => (
                          <TableCell key={col.name} className="px-0 py-0">
                            {renderCell ? (
                              renderCell(record, col, record[col.name])
                            ) : (
                              <EditableCell
                                value={record[col.name]}
                                column={col}
                                foreignKeyLabelMap={foreignKeyLabelMap[col.name]}
                                enumColorMap={enumColorMap}
                                onSave={async (newValue) => {
                                  await handleUpdateRecord(id, { [col.name]: newValue })
                                }}
                              />
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="px-2 py-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRecordClick(record)}
                            className="size-7 text-muted-foreground opacity-0 transition-all group-hover:opacity-100"
                          >
                            <MoreVertical className="size-3.5" />
                            <span className="sr-only">Open record details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </DataTable>
          </div>
        ) : recordsState.isLoading ? (
          <RecordsSkeletonList rowCount={6} density={density} radius={radius} />
        ) : displayedRecords.length === 0 && !isGroupedView ? (
          <EmptyRecordsState
            constrained={hasActiveConstraints}
            emptyState={emptyState}
            radius={radius}
            onClear={hasActiveConstraints ? clearAllConstraints : undefined}
            onCreate={handleCreateClick}
          />
        ) : viewMode === "list" ? (
          <ListView
            records={displayedRecords}
            table={table}
            visibleColumns={resolvedColumns}
            selectedRecords={selectedRows}
            onSelectRecord={handleSelectRow}
            onRecordClick={handleRecordClick}
            renderCard={renderCard}
            foreignKeyLabelMap={foreignKeyLabelMap}
            enumColorMap={enumColorMap}
            appearance={appearance}
            density={density}
            radius={radius}
          />
        ) : (viewMode === "kanban" || viewMode === "linear") && groupByColumn ? (
          <GroupedView
            records={displayedRecords}
            groupByColumn={groupByColumn}
            layout={viewMode}
            primaryKey={pk}
            visibleColumns={resolvedColumns}
            selectedRecords={selectedRows}
            onSelectRecord={handleSelectRow}
            onRecordClick={handleRecordClick}
            renderCard={renderCard}
            foreignKeyLabelMap={foreignKeyLabelMap}
            enumColorMap={enumColorMap}
            appearance={appearance}
            density={density}
            radius={radius}
          />
        ) : null}

        {paginationMode === "infinite" && !recordsState.isLoading ? (
          <div ref={setInfiniteSentinel} className="h-px" />
        ) : null}
      </div>

      <div className={cn("shrink-0 px-4", recordsFooterClassName(appearance, density))}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {progressivePagination
              ? hasSearch
                ? `Showing ${displayedRecords.length} matching loaded record(s)`
                : `Loaded ${records.length} of ${total}`
              : hasSearch
              ? `Showing ${displayedRecords.length} matching record(s) on this page`
              : `Showing ${pageStart}–${pageEnd} of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            {progressivePagination ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => void handleLoadMore()}
                disabled={!canLoadMore || recordsState.isLoadingMore}
              >
                {recordsState.isLoadingMore ? <RefreshCw className="mr-1.5 size-3 animate-spin" /> : null}
                {canLoadMore ? "Load more" : "All loaded"}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize + records.length >= total}
                >
                  Next
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {showFilterBuilder && table && (
        <FilterBuilder
          columns={resolvedColumns}
          filters={filters}
          onApply={applyFilters}
          onClose={() => setShowFilterBuilder(false)}
        />
      )}

      {detailRecord && table && (
        <DetailSheet
          record={detailRecord}
          table={table}
          client={client}
          podId={podId}
          mode={detailMode === "modal" ? "modal" : "sheet"}
          variant={detailVariant}
          tabs={detailTabs}
          relatedRecords={detailRelatedRecords}
          editable={detailEditable}
          hiddenFields={hiddenFields}
          onClose={() => setDetailRecord(null)}
          onRecordChanged={() => recordsState.refresh()}
          updateVia={onUpdateOptions?.updateVia}
          updateFunctionName={onUpdateOptions?.updateFunctionName}
          onDelete={async () => {
            const id = getRecordId(detailRecord)
            const scoped = podId ? client.withPod(podId) : client
            await scoped.records.delete(tableName, id)
            setDetailRecord(null)
            recordsState.refresh()
          }}
          onNext={() => {
            if (detailRecordIndex >= 0 && detailRecordIndex < displayedRecords.length - 1) {
              setDetailRecord(displayedRecords[detailRecordIndex + 1])
            }
          }}
          onPrevious={() => {
            if (detailRecordIndex > 0) setDetailRecord(displayedRecords[detailRecordIndex - 1])
          }}
          hasPrevious={detailRecordIndex > 0}
          hasNext={detailRecordIndex >= 0 && detailRecordIndex < displayedRecords.length - 1}
          foreignKeyLabels={foreignKeyLabels}
          enumColorMap={enumColorMap}
          appearance={appearance}
          density={density}
          radius={radius}
          renderFiles={renderFilesTab}
        />
      )}

      {showCreateForm && table && (
        <RecordFormSheet
          client={client}
          podId={podId}
          tableName={tableName}
          table={table}
          submitVia={onCreateOptions?.submitVia}
          submitFunctionName={onCreateOptions?.submitFunctionName}
          hiddenFields={onCreateOptions?.hiddenFields ?? hiddenFields}
          foreignKeyLabels={foreignKeyLabels}
          enumColorMap={enumColorMap}
          mode={createMode === "modal" ? "modal" : "sheet"}
          appearance={appearance}
          density={density}
          radius={radius}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            recordsState.refresh()
          }}
        />
      )}
    </div>
  )
}

function normalizeViewMode(mode: ViewMode): ResolvedViewMode {
  return mode === "grouped" ? "kanban" : mode
}

function navigateTo(path: string): void {
  if (typeof window !== "undefined") {
    window.location.assign(path)
  }
}

function normalizeRecordFilters(filters: RecordFilter[]): RecordFilter[] {
  return filters.map((filter) => {
    const value = typeof filter.value === "string" ? filter.value.trim() : filter.value

    if (filter.op === "ilike" && typeof value === "string") {
      return { ...filter, value: `%${value}%` }
    }

    if (filter.op === "starts_with" && typeof value === "string") {
      return { ...filter, op: "ilike", value: `${value}%` }
    }

    if (filter.op === "ends_with" && typeof value === "string") {
      return { ...filter, op: "ilike", value: `%${value}` }
    }

    if (filter.op === "in" && typeof value === "string") {
      return {
        field: filter.field,
        op: "in",
        values: value.split(",").map((entry) => entry.trim()).filter(Boolean),
      }
    }

    if (filter.op === "is" || filter.op === "is not") {
      return { ...filter, value: null }
    }

    return { ...filter, value }
  })
}

function shallowEqualLabelMap(
  a: Record<string, string> | undefined,
  b: Record<string, string>,
): boolean {
  const aKeys = Object.keys(a ?? {})
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  return bKeys.every((key) => a?.[key] === b[key])
}

function ForeignKeyLabelResolver({
  client,
  podId,
  tableName,
  column,
  labelField,
  onResolve,
}: {
  client: LemmaClient
  podId?: string
  tableName: string
  column: ColumnSchema
  labelField?: string
  onResolve: (columnName: string, labels: Record<string, string>) => void
}) {
  const options = useForeignKeyOptions({
    client,
    podId,
    tableName,
    columnName: column.name,
    labelField,
    limit: 250,
    enabled: !!column.foreign_key,
  })

  React.useEffect(() => {
    const labels: Record<string, string> = {}
    for (const option of options.options) {
      labels[String(option.value)] = option.label
    }
    onResolve(column.name, labels)
  }, [column.name, onResolve, options.options])

  return null
}

function RecordsTableMessage({
  colSpan,
  children,
}: {
  colSpan: number
  children: React.ReactNode
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="px-4 py-12">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {children}
        </div>
      </TableCell>
    </TableRow>
  )
}

function RecordsSkeletonGrid({
  columnCount,
  rowCount,
  density,
}: {
  columnCount: number
  rowCount: number
  density: LemmaRecordsDensity
}) {
  const rowH = density === "compact" ? "h-8" : density === "spacious" ? "h-12" : "h-10"
  return (
    <div className="space-y-2">
      <div className={cn("grid gap-2", `grid-cols-${columnCount}`)}>
        {Array.from({ length: columnCount }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i === 0 ? "w-16" : i === columnCount - 1 ? "w-12" : "w-24")} />
        ))}
      </div>
      {Array.from({ length: rowCount }).map((_, ri) => (
        <div key={ri} className={cn("grid gap-2 items-center", `grid-cols-${columnCount}`, rowH)}>
          {Array.from({ length: columnCount }).map((_, ci) => (
            <Skeleton key={ci} className={cn("h-5 rounded", ci === 0 ? "w-12" : ci % 3 === 0 ? "w-20" : "w-full")} />
          ))}
        </div>
      ))}
    </div>
  )
}

function RecordsSkeletonTableRows({
  columnCount,
  rowCount,
  density,
}: {
  columnCount: number
  rowCount: number
  density: LemmaRecordsDensity
}) {
  const cellH = density === "compact" ? "h-6" : density === "spacious" ? "h-8" : "h-7"
  return (
    <>
      {Array.from({ length: rowCount }).map((_, ri) => (
        <TableRow key={ri} className="hover:bg-transparent">
          {Array.from({ length: columnCount }).map((_, ci) => (
            <TableCell key={ci} className="px-2 py-1">
              <Skeleton className={cn(cellH, "w-full rounded", ci === 0 && "w-5", ci === columnCount - 1 && "w-7")} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function RecordsSkeletonList({
  rowCount,
  density,
  radius,
}: {
  rowCount: number
  density: LemmaRecordsDensity
  radius: LemmaRecordsRadius
}) {
  return (
    <div className={cn("flex flex-col", density === "compact" ? "gap-1.5" : density === "spacious" ? "gap-3" : "gap-2")}>
      {Array.from({ length: rowCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex items-start gap-3 border border-border/30 bg-card",
            recordsRadiusClassName(radius, "surface"),
            density === "compact" ? "p-3" : density === "spacious" ? "p-5" : "p-4",
          )}
        >
          <Skeleton className="size-4 mt-1 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <div className="flex gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function RecordsErrorState({ error, radius, onRetry }: { error: Error; radius: LemmaRecordsRadius; onRetry: () => void }) {
  return (
    <div className={cn("flex min-h-64 flex-col items-center justify-center gap-3 border border-destructive/30 bg-destructive/5 px-6 text-center", recordsRadiusClassName(radius, "surface"))}>
      <div className={cn("flex size-10 items-center justify-center bg-destructive/10 text-destructive", recordsRadiusClassName(radius, "pill"))}>
        <AlertCircle className="size-5" />
      </div>
      <div>
        <p className="font-medium text-foreground">Records could not be loaded</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-2 size-3.5" />
        Retry
      </Button>
    </div>
  )
}

function EmptyRecordsState({
  constrained,
  emptyState,
  radius,
  onClear,
  onCreate,
}: {
  constrained: boolean
  emptyState?: React.ReactNode
  radius: LemmaRecordsRadius
  onClear?: () => void
  onCreate: () => void
}) {
  if (!constrained && emptyState) return <>{emptyState}</>

  return (
    <div className={cn("flex min-h-64 flex-col items-center justify-center gap-3 border border-dashed border-border bg-card/60 px-6 text-center", recordsRadiusClassName(radius, "surface"))}>
      <div className={cn("flex size-10 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground", recordsRadiusClassName(radius, "pill"))}>
        <Database className="size-5" />
      </div>
      <div>
        <p className="font-medium text-foreground">
          {constrained ? "No records match this view" : "No records yet"}
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {constrained
            ? "Try clearing search or filters to broaden the table."
            : "Create the first record and this workspace will fill in automatically."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {onClear && (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear view
          </Button>
        )}
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-2 size-3.5" />
          New record
        </Button>
      </div>
    </div>
  )
}

function isSearchableColumn(column: ColumnSchema): boolean {
  return column.type !== "VECTOR"
}

function matchesSearchValue(value: unknown, query: string): boolean {
  if (value == null) return false
  if (typeof value === "string") return value.toLowerCase().includes(query)
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).toLowerCase().includes(query)
  }
  if (value instanceof Date) return value.toISOString().toLowerCase().includes(query)
  try {
    return JSON.stringify(value).toLowerCase().includes(query)
  } catch {
    return String(value).toLowerCase().includes(query)
  }
}

function ViewModeToggle({
  mode,
  onChange,
  hasGroupBy,
  radius,
}: {
  mode: ResolvedViewMode
  onChange: (m: ResolvedViewMode) => void
  hasGroupBy: boolean
  radius: LemmaRecordsRadius
}) {
  return (
    <div className={cn("flex items-center gap-0.5 border border-border/50 bg-muted/30 p-0.5", recordsRadiusClassName(radius, "control"))}>
      <button
        onClick={() => onChange("grid")}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 text-xs transition-colors",
          recordsRadiusClassName(radius, "control"),
          mode === "grid"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:bg-card/50 hover:text-foreground",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Grid
      </button>
      <button
        onClick={() => onChange("list")}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 text-xs transition-colors",
          recordsRadiusClassName(radius, "control"),
          mode === "list"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:bg-card/50 hover:text-foreground",
        )}
      >
        <List className="h-3.5 w-3.5" />
        List
      </button>
      {hasGroupBy && (
        <>
          <button
            onClick={() => onChange("kanban")}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 text-xs transition-colors",
              recordsRadiusClassName(radius, "control"),
              mode === "kanban"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-card/50 hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Kanban
          </button>
          <button
            onClick={() => onChange("linear")}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 text-xs transition-colors",
              recordsRadiusClassName(radius, "control"),
              mode === "linear"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-card/50 hover:text-foreground",
            )}
          >
            <Rows3 className="h-3.5 w-3.5" />
            Linear
          </button>
        </>
      )}
    </div>
  )
}

function recordsRootClassName(appearance: LemmaRecordsAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function recordsHeaderClassName(appearance: LemmaRecordsAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

function recordsToolbarClassName(density: LemmaRecordsDensity) {
  if (density === "compact") return "gap-2 px-3 py-2"
  if (density === "spacious") return "gap-4 px-5 py-4"
  return "gap-3 px-4 py-3"
}

function recordsContentClassName(density: LemmaRecordsDensity) {
  if (density === "compact") return "p-2"
  if (density === "spacious") return "p-5"
  return "p-4"
}

function recordsFooterClassName(appearance: LemmaRecordsAppearance, density: LemmaRecordsDensity) {
  return cn(
    appearance === "borderless"
      ? "border-t-0 bg-transparent"
      : appearance === "minimal"
        ? "border-t border-border/15 bg-transparent"
        : "border-t border-border/40 bg-card",
    density === "compact" ? "py-2" : density === "spacious" ? "py-3.5" : "py-2.5",
  )
}

function recordsFloatingClassName(appearance: LemmaRecordsAppearance) {
  if (appearance === "borderless") return "bg-card/90"
  if (appearance === "minimal") return "bg-background/90 shadow-none ring-1 ring-border/15"
  return "border border-border/50 bg-card/95"
}

function recordsSurfaceClassName(appearance: LemmaRecordsAppearance, radius: LemmaRecordsRadius, dashed = false) {
  if (appearance === "minimal") {
    return cn(
      "bg-transparent shadow-none",
      recordsRadiusClassName(radius, "surface"),
      dashed ? "border border-dashed border-border/25" : "border-0 ring-0",
    )
  }

  return cn(
    "bg-card",
    recordsRadiusClassName(radius, "surface"),
    dashed ? "border-dashed" : null,
    appearance === "borderless" ? "border-0 shadow-none" : null,
    appearance === "contained" ? "border border-border/70 shadow-sm" : null,
    appearance === "default" ? "border border-border/50" : null,
  )
}
