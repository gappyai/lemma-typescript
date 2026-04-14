"use client"

import * as React from "react"
import {
  Filter,
  List,
  LayoutGrid,
  Plus,
  Search,
  Trash2,
  Edit,
  MoreVertical,
  ChevronDown,
  Rows3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useTable,
  useRecords,
  useCreateRecord,
  useUpdateRecord,
  useDeleteRecord,
  useRecordForm,
  useForeignKeyOptions,
} from "lemma-sdk/react"
import type { LemmaClient, ColumnSchema, RecordFilter, Table } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { EditableCell } from "./records-editable-cell"
import { FilterBuilder } from "./records-filter-builder"
import { DetailSheet } from "./records-detail-sheet"
import { ListView } from "./records-list-view"
import { GroupedView } from "./records-grouped-view"
import { isSystemField, typeBadgeClasses } from "./records-enum-utils"
import { RecordFormSheet } from "./records-form-sheet"

type ViewMode = "grid" | "list" | "grouped"

export interface LemmaRecordsViewProps {
  client: LemmaClient
  podId?: string
  tableName: string
  enabled?: boolean

  visibleColumns?: string[]
  hiddenFields?: string[]
  renderCell?: (record: Record<string, unknown>, column: ColumnSchema, value: unknown) => React.ReactNode
  renderCard?: (record: Record<string, unknown>, columns: ColumnSchema[]) => React.ReactNode
  foreignKeyLabels?: Record<string, string>

  defaultView?: ViewMode
  groupBy?: string
  defaultFilters?: RecordFilter[]
  pageSize?: number

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
  onRecordClick?: (record: Record<string, unknown>) => void
}

export function LemmaRecordsView({
  client,
  podId,
  tableName,
  enabled = true,
  visibleColumns: visibleColumnNames,
  hiddenFields = [],
  renderCell,
  renderCard,
  foreignKeyLabels,
  defaultView = "grid",
  groupBy: groupByProp,
  defaultFilters = [],
  pageSize = 50,
  onCreateOptions,
  onUpdateOptions,
  title,
  headerActions,
  emptyState,
  onRecordClick,
}: LemmaRecordsViewProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>(defaultView)
  const [filters, setFilters] = React.useState<RecordFilter[]>(defaultFilters)
  const [showFilterBuilder, setShowFilterBuilder] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())
  const [detailRecord, setDetailRecord] = React.useState<Record<string, unknown> | null>(null)
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [page, setPage] = React.useState(0)

  const tableState = useTable({ client, podId, tableName, enabled })
  const table = tableState.table

  const recordsState = useRecords({
    client,
    podId,
    tableName,
    filters: filters.length > 0 ? filters : undefined,
    limit: pageSize,
    offset: page * pageSize,
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

  const groupByColumn = React.useMemo(() => {
    if (!table) return null
    if (groupByProp) return table.columns.find((c) => c.name === groupByProp) ?? null
    return (
      table.columns.find((c) => /status|stage|state|priority|type|category/i.test(c.name) && c.type === "ENUM") ?? null
    )
  }, [table, groupByProp])

  const getRecordId = (r: Record<string, unknown>) => String(r[pk] ?? "")

  const handleSelectAll = () => {
    if (selectedRows.size === records.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(records.map(getRecordId)))
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
    if (onRecordClick) onRecordClick(record)
    else setDetailRecord(record)
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

  if (tableState.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border/50 bg-card">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    )
  }

  if (!table) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 text-center">
        <p className="text-lg font-semibold text-foreground">Table not found</p>
        <p className="mt-1 text-sm text-muted-foreground">The table &quot;{tableName}&quot; could not be loaded.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border/40 bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-foreground">
              {title ?? table.name}
            </h1>
            <span className="text-xs text-muted-foreground">
              {total} records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-8 w-44 pl-8 text-xs"
              />
            </div>

            <div className="mx-1 h-5 w-px bg-border/50" />

            <ViewModeToggle mode={viewMode} onChange={setViewMode} hasGroupBy={!!groupByColumn} />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilterBuilder(true)}
              className="h-8 gap-2 text-xs"
            >
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              Filter{filters.length > 0 ? ` (${filters.length})` : ""}
            </Button>

            {headerActions}

            <div className="mx-1 h-5 w-px bg-border/50" />

            <Button
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="h-8 gap-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
        </div>
      </div>

      {selectedRows.size > 0 && (
        <div className="absolute left-1/2 top-20 z-30 flex -translate-x-1/2 items-center gap-4 rounded-full border border-border/50 bg-card/95 px-5 py-2.5 shadow-lg backdrop-blur-sm">
          <span className="text-sm font-medium text-foreground">{selectedRows.size} selected</span>
          <div className="h-4 w-px bg-border" />
          <Button variant="ghost" size="sm" className="h-8 rounded-full" onClick={handleDeleteSelected}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5 text-destructive" />
            Delete
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {viewMode === "grid" ? (
          <div className="overflow-auto rounded-xl border border-border/50 bg-card">
            <table className="min-w-full table-fixed">
              <thead className="sticky top-0 z-10 border-b border-border/30 bg-card/95 backdrop-blur-md">
                <tr>
                  <th className="w-10 px-2 py-2 text-center">
                    <Checkbox
                      checked={selectedRows.size === records.length && records.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="h-4 w-4 rounded"
                    />
                  </th>
                  {resolvedColumns.map((col) => (
                    <th
                      key={col.name}
                      className="px-3 py-2.5 text-left text-xs font-medium tracking-wide text-muted-foreground"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.name.replace(/_/g, " ")}</span>
                        <span className={typeBadgeClasses(col)}>
                          {col.foreign_key ? "ref" : col.type.toLowerCase()}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {recordsState.isLoading ? (
                  <tr>
                    <td colSpan={resolvedColumns.length + 2} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Loading records…
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={resolvedColumns.length + 2} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      {emptyState ?? "No records found"}
                    </td>
                  </tr>
                ) : (
                  records.map((record) => {
                    const id = getRecordId(record)
                    const selected = selectedRows.has(id)
                    return (
                      <tr
                        key={id}
                        className={cn(
                          "group transition-colors duration-75 hover:bg-muted/30",
                          selected && "bg-primary/5",
                        )}
                      >
                        <td className="px-2 py-1 text-center">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => handleSelectRow(id)}
                            className={cn(
                              "h-4 w-4 rounded opacity-0 transition-opacity group-hover:opacity-100",
                              selected && "opacity-100",
                            )}
                          />
                        </td>
                        {resolvedColumns.map((col) => (
                          <td key={col.name} className="px-0 py-0">
                            {renderCell ? (
                              renderCell(record, col, record[col.name])
                            ) : (
                              <EditableCell
                                value={record[col.name]}
                                column={col}
                                onSave={async (newValue) => {
                                  const scoped = podId ? client.withPod(podId) : client
                                  await scoped.records.update(tableName, id, { [col.name]: newValue })
                                  recordsState.refresh()
                                }}
                              />
                            )}
                          </td>
                        ))}
                        <td className="px-2 py-1">
                          <button
                            onClick={() => handleRecordClick(record)}
                            className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-muted/50 hover:text-foreground group-hover:opacity-100"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : viewMode === "list" ? (
          <ListView
            records={records}
            table={table}
            visibleColumns={resolvedColumns}
            selectedRecords={selectedRows}
            onSelectRecord={handleSelectRow}
            onRecordClick={handleRecordClick}
            renderCard={renderCard}
          />
        ) : viewMode === "grouped" && groupByColumn ? (
          <GroupedView
            records={records}
            groupByColumn={groupByColumn}
            primaryKey={pk}
            visibleColumns={resolvedColumns}
            selectedRecords={selectedRows}
            onSelectRecord={handleSelectRow}
            onRecordClick={handleRecordClick}
            renderCard={renderCard}
          />
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border/40 bg-card px-4 py-2.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {page * pageSize + 1}–{page * pageSize + records.length} of {total}
          </span>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>

      {showFilterBuilder && table && (
        <FilterBuilder
          columns={resolvedColumns}
          filters={filters}
          onApply={setFilters}
          onClose={() => setShowFilterBuilder(false)}
        />
      )}

      {detailRecord && table && (
        <DetailSheet
          record={detailRecord}
          table={table}
          client={client}
          podId={podId}
          onClose={() => setDetailRecord(null)}
          onRecordChanged={() => recordsState.refresh()}
          onDelete={async () => {
            const id = getRecordId(detailRecord)
            const scoped = podId ? client.withPod(podId) : client
            await scoped.records.delete(tableName, id)
            setDetailRecord(null)
            recordsState.refresh()
          }}
          onNext={() => {
            const idx = records.findIndex((r) => getRecordId(r) === getRecordId(detailRecord))
            if (idx < records.length - 1) setDetailRecord(records[idx + 1])
          }}
          onPrevious={() => {
            const idx = records.findIndex((r) => getRecordId(r) === getRecordId(detailRecord))
            if (idx > 0) setDetailRecord(records[idx - 1])
          }}
          hasPrevious={records.findIndex((r) => getRecordId(r) === getRecordId(detailRecord)) > 0}
          hasNext={records.findIndex((r) => getRecordId(r) === getRecordId(detailRecord)) < records.length - 1}
          foreignKeyLabels={foreignKeyLabels}
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

function ViewModeToggle({
  mode,
  onChange,
  hasGroupBy,
}: {
  mode: ViewMode
  onChange: (m: ViewMode) => void
  hasGroupBy: boolean
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/30 p-0.5">
      <button
        onClick={() => onChange("grid")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
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
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
          mode === "list"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:bg-card/50 hover:text-foreground",
        )}
      >
        <List className="h-3.5 w-3.5" />
        List
      </button>
      {hasGroupBy && (
        <button
          onClick={() => onChange("grouped")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
            mode === "grouped"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-card/50 hover:text-foreground",
          )}
        >
          <Rows3 className="h-3.5 w-3.5" />
          Grouped
        </button>
      )}
    </div>
  )
}
