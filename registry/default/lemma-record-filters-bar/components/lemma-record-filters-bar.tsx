"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SortFieldOption = string | { value: string; label: string }
export type LemmaFilterFieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "json"
  | "date"
  | "datetime"
  | "select"
  | "foreign-key"
  | "uuid"
  | (string & {})

export interface LemmaFilterFieldOption {
  value: string
  label: string
  type?: LemmaFilterFieldType
  options?: string[]
}

export interface LemmaFilterCondition {
  id: string
  field: string
  op: string
  value?: string
}

export interface LemmaRecordFiltersBarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  resultCount?: number
  onRefresh?: () => void
  isRefreshing?: boolean
  sortBy?: string
  onSortByChange?: (value: string) => void
  sortOrder?: "asc" | "desc"
  onSortOrderChange?: (value: "asc" | "desc") => void
  availableSortFields?: SortFieldOption[]
  pageSize?: number
  onPageSizeChange?: (value: number) => void
  pageSizeOptions?: number[]
  availableFilterFields?: LemmaFilterFieldOption[]
  filters?: LemmaFilterCondition[]
  onFiltersChange?: (filters: LemmaFilterCondition[]) => void
  allowSearch?: boolean
  allowFilters?: boolean
  allowSorting?: boolean
  allowPageSizeSelect?: boolean
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const DEFAULT_SORT_VALUE = "__default__"
const FILTERABLE_TEXT_TYPES = new Set(["text", "textarea", "uuid", "foreign-key", "json"])
const FILTERABLE_NUMERIC_TYPES = new Set(["number"])
const FILTERABLE_TEMPORAL_TYPES = new Set(["date", "datetime"])

function createEmptyFilter(field?: LemmaFilterFieldOption): LemmaFilterCondition {
  return {
    id: Math.random().toString(36).slice(2, 10),
    field: field?.value ?? "",
    op: defaultFilterOperator(field?.type),
    value: "",
  }
}

function normalizeSortOptions(options?: SortFieldOption[]): Array<{ value: string; label: string }> {
  if (!options?.length) return []

  return options
    .map((option) => (
      typeof option === "string"
        ? { value: option, label: option }
        : option
    ))
    .filter((option) => option.value.trim().length > 0)
}

function defaultFilterOperator(type?: LemmaFilterFieldType): string {
  if (type === "boolean") return "is"
  if (type === "select") return "is"
  if (FILTERABLE_NUMERIC_TYPES.has(type ?? "")) return "is"
  if (FILTERABLE_TEMPORAL_TYPES.has(type ?? "")) return "is"
  return "contains"
}

function availableOperators(type?: LemmaFilterFieldType): Array<{ value: string; label: string }> {
  if (type === "boolean" || type === "select") {
    return [
      { value: "is", label: "is" },
      { value: "is_not", label: "is not" },
    ]
  }

  if (FILTERABLE_NUMERIC_TYPES.has(type ?? "") || FILTERABLE_TEMPORAL_TYPES.has(type ?? "")) {
    return [
      { value: "is", label: "is" },
      { value: "is_not", label: "is not" },
      { value: "gt", label: "greater than" },
      { value: "gte", label: "greater or equal" },
      { value: "lt", label: "less than" },
      { value: "lte", label: "less or equal" },
      { value: "is_empty", label: "is empty" },
      { value: "is_not_empty", label: "is not empty" },
    ]
  }

  return [
    { value: "contains", label: "contains" },
    { value: "does_not_contain", label: "does not contain" },
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "starts_with", label: "starts with" },
    { value: "ends_with", label: "ends with" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ]
}

function operatorNeedsValue(op: string): boolean {
  return op !== "is_empty" && op !== "is_not_empty"
}

export function LemmaRecordFiltersBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search records…",
  resultCount,
  onRefresh,
  isRefreshing = false,
  sortBy = "",
  onSortByChange,
  sortOrder = "asc",
  onSortOrderChange,
  availableSortFields,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  availableFilterFields = [],
  filters = [],
  onFiltersChange,
  allowSearch = true,
  allowFilters = true,
  allowSorting = true,
  allowPageSizeSelect = true,
}: LemmaRecordFiltersBarProps) {
  const sortOptions = React.useMemo(
    () => normalizeSortOptions(availableSortFields),
    [availableSortFields],
  )
  const [isFilterEditorOpen, setIsFilterEditorOpen] = React.useState(false)
  const [draftFilters, setDraftFilters] = React.useState<LemmaFilterCondition[]>(filters)

  React.useEffect(() => {
    if (!isFilterEditorOpen) {
      setDraftFilters(filters)
    }
  }, [filters, isFilterEditorOpen])

  const activeFilterCount = filters.filter((filter) => filter.field && (operatorNeedsValue(filter.op) ? (filter.value ?? "").trim().length > 0 : true)).length
  const firstFilterField = availableFilterFields[0]

  return (
    <>
    <div className="flex min-w-0 flex-col gap-3 rounded-[8px] border border-[color:var(--resource-border)] bg-[var(--resource-surface)] p-4 shadow-sm">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center">
      {allowSearch ? (
        <div className="min-w-[220px] flex-1">
          <Input
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            value={search}
          />
        </div>
      ) : null}
      {allowFilters && onFiltersChange && availableFilterFields.length > 0 ? (
        <Button
          onClick={() => {
            setDraftFilters(filters.length > 0 ? filters : [createEmptyFilter(firstFilterField)])
            setIsFilterEditorOpen(true)
          }}
          variant="outline"
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>
      ) : null}
      {allowSorting && sortOptions.length > 0 && onSortByChange ? (
        <div className="grid gap-2 md:min-w-[180px]">
          <Select
            value={sortBy || DEFAULT_SORT_VALUE}
            onValueChange={(value) => onSortByChange(value === DEFAULT_SORT_VALUE ? "" : value)}
          >
            <SelectTrigger id="lemma-record-filters-sort-by">
              <SelectValue placeholder="Sort field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEFAULT_SORT_VALUE}>Default order</SelectItem>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {allowSorting && onSortOrderChange ? (
        <div className="grid gap-2 md:min-w-[140px]">
          <Select value={sortOrder} onValueChange={(value) => onSortOrderChange(value as "asc" | "desc")}>
            <SelectTrigger id="lemma-record-filters-sort-order">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {allowPageSizeSelect && typeof pageSize === "number" && onPageSizeChange ? (
        <div className="grid gap-2 md:min-w-[130px]">
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger id="lemma-record-filters-page-size">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        {typeof resultCount === "number" ? (
          <p className="text-xs text-[color:var(--resource-muted)]">
            {resultCount} result{resultCount === 1 ? "" : "s"}
          </p>
        ) : null}
        {onRefresh ? (
          <Button disabled={isRefreshing} onClick={onRefresh} variant="outline">
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
        ) : null}
      </div>
      </div>
      {activeFilterCount > 0 ? (
        <div className="flex flex-wrap gap-2">
          {filters
            .filter((filter) => filter.field && (operatorNeedsValue(filter.op) ? (filter.value ?? "").trim().length > 0 : true))
            .map((filter) => {
              const field = availableFilterFields.find((option) => option.value === filter.field)
              const operator = availableOperators(field?.type).find((option) => option.value === filter.op)
              return (
                <div
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-1 text-xs text-[color:var(--resource-muted-strong)]"
                  key={filter.id}
                >
                  <span className="font-medium text-[color:var(--resource-text)]">{field?.label ?? filter.field}</span>
                  <span>{operator?.label ?? filter.op}</span>
                  {operatorNeedsValue(filter.op) ? <span>{filter.value}</span> : null}
                </div>
              )
            })}
        </div>
      ) : null}
    </div>
    {isFilterEditorOpen ? (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-4 py-8 backdrop-blur-[1px]">
        <div className="w-full max-w-5xl rounded-[8px] border border-[color:var(--resource-border)] bg-[var(--resource-surface)] shadow-[0_28px_90px_-40px_var(--resource-shadow-lg)]">
          <div className="flex items-start justify-between gap-4 border-b border-[color:var(--resource-border)] px-6 py-5">
            <div className="grid gap-2">
              <h3 className="text-3xl font-semibold text-[color:var(--resource-text)]">Filter Records</h3>
              <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--resource-muted-strong)]">
                Refine your view by adding conditions
              </p>
            </div>
            <Button
              onClick={() => {
                setDraftFilters(filters)
                setIsFilterEditorOpen(false)
              }}
              variant="ghost"
            >
              Close
            </Button>
          </div>
          <div className="grid gap-4 border-b border-[color:var(--resource-border)] px-6 py-6">
            {draftFilters.map((filter, index) => {
              const field = availableFilterFields.find((option) => option.value === filter.field) ?? firstFilterField
              const operators = availableOperators(field?.type)
              const showValueInput = operatorNeedsValue(filter.op)
              const fieldType = field?.type ?? "text"
              return (
                <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(180px,0.9fr)_minmax(0,1.6fr)_auto]" key={filter.id}>
                  <Select
                    value={filter.field}
                    onValueChange={(value) => {
                      const nextField = availableFilterFields.find((option) => option.value === value)
                      setDraftFilters((current) => current.map((entry) => (
                        entry.id === filter.id
                          ? {
                              ...entry,
                              field: value,
                              op: defaultFilterOperator(nextField?.type),
                              value: "",
                            }
                          : entry
                      )))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFilterFields.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filter.op}
                    onValueChange={(value) => {
                      setDraftFilters((current) => current.map((entry) => (
                        entry.id === filter.id
                          ? {
                              ...entry,
                              op: value,
                              value: operatorNeedsValue(value) ? entry.value ?? "" : "",
                            }
                          : entry
                      )))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValueInput ? (
                    fieldType === "boolean" ? (
                      <Select
                        value={filter.value ?? ""}
                        onValueChange={(value) => {
                          setDraftFilters((current) => current.map((entry) => (
                            entry.id === filter.id ? { ...entry, value } : entry
                          )))
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : fieldType === "select" && field?.options?.length ? (
                      <Select
                        value={filter.value ?? ""}
                        onValueChange={(value) => {
                          setDraftFilters((current) => current.map((entry) => (
                            entry.id === filter.id ? { ...entry, value } : entry
                          )))
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Value" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        onChange={(event) => {
                          const value = event.target.value
                          setDraftFilters((current) => current.map((entry) => (
                            entry.id === filter.id ? { ...entry, value } : entry
                          )))
                        }}
                        placeholder="Value"
                        type={fieldType === "number" ? "number" : fieldType === "date" ? "date" : fieldType === "datetime" ? "datetime-local" : "text"}
                        value={filter.value ?? ""}
                      />
                    )
                  ) : (
                    <div className="flex items-center rounded-[8px] border border-dashed border-[color:var(--resource-border)] px-3 text-sm text-[color:var(--resource-muted)]">
                      No value needed
                    </div>
                  )}
                  <Button
                    onClick={() => {
                      setDraftFilters((current) => current.filter((entry) => entry.id !== filter.id))
                    }}
                    variant="ghost"
                  >
                    Remove
                  </Button>
                </div>
              )
            })}
            <button
              className="flex w-full items-center justify-center gap-2 rounded-[8px] border border-dashed border-[color:var(--resource-border)] px-4 py-4 text-base font-medium text-[color:var(--resource-muted-strong)] transition-colors hover:bg-[var(--resource-surface-alt)]"
              onClick={() => {
                setDraftFilters((current) => [...current, createEmptyFilter(firstFilterField)])
              }}
              type="button"
            >
              <span className="text-xl leading-none">+</span>
              Add Condition
            </button>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-5">
            <Button
              onClick={() => {
                setDraftFilters(filters)
                setIsFilterEditorOpen(false)
              }}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onFiltersChange?.(
                  draftFilters.filter((filter) => (
                    filter.field.trim().length > 0
                    && (operatorNeedsValue(filter.op) ? (filter.value ?? "").trim().length > 0 : true)
                  )),
                )
                setIsFilterEditorOpen(false)
              }}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  )
}
