"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  DATA_INPUT_CLASS_NAME,
  DATA_PANEL_SECTION_CLASS_NAME,
  DATA_SUBTLE_ACTION_CLASS_NAME,
  DATA_TOOLBAR_CARD_CLASS_NAME,
  DataWorkspaceState,
  dataWorkspaceMetaBadgeClassName,
} from "@/components/lemma/registry-data-workspace"

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

export type LemmaFilterOperator =
  | "contains"
  | "does_not_contain"
  | "is"
  | "is_not"
  | "starts_with"
  | "ends_with"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "is_empty"
  | "is_not_empty"

export interface LemmaFilterCondition {
  id: string
  field: string
  op: LemmaFilterOperator
  value?: string | number | boolean
}

export interface LemmaRecordFiltersBarProps extends React.HTMLAttributes<HTMLDivElement> {
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

function defaultFilterOperator(type?: LemmaFilterFieldType): LemmaFilterOperator {
  if (type === "boolean") return "is"
  if (type === "select") return "is"
  if (FILTERABLE_NUMERIC_TYPES.has(type ?? "")) return "is"
  if (FILTERABLE_TEMPORAL_TYPES.has(type ?? "")) return "is"
  return "contains"
}

function availableOperators(type?: LemmaFilterFieldType): Array<{ value: LemmaFilterOperator; label: string }> {
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

function operatorNeedsValue(op: LemmaFilterOperator): boolean {
  return op !== "is_empty" && op !== "is_not_empty"
}

function stringifyFilterValue(value: LemmaFilterCondition["value"]): string {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return ""
}

export const LemmaRecordFiltersBar = React.forwardRef<HTMLDivElement, LemmaRecordFiltersBarProps>(
  ({
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
    className,
    ...props
  }, ref) => {
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

  const activeFilterCount = filters.filter((filter) => (
    filter.field
    && (operatorNeedsValue(filter.op) ? stringifyFilterValue(filter.value).trim().length > 0 : true)
  )).length
  const firstFilterField = availableFilterFields[0]

  return (
    <div ref={ref} className={cn("", className)} {...props}>
    <div className={cn("flex min-w-0 flex-col gap-4", DATA_TOOLBAR_CARD_CLASS_NAME)}>
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
      {allowSearch ? (
        <div className="min-w-[240px] flex-1">
          <Input
            className={DATA_INPUT_CLASS_NAME}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            value={search}
          />
        </div>
      ) : null}
      {allowFilters && onFiltersChange && availableFilterFields.length > 0 ? (
        <Button
          className={DATA_SUBTLE_ACTION_CLASS_NAME}
          onClick={() => {
            setDraftFilters(filters.length > 0 ? filters : [createEmptyFilter(firstFilterField)])
            setIsFilterEditorOpen(true)
          }}
          type="button"
          variant="ghost"
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
            <SelectTrigger className={DATA_INPUT_CLASS_NAME} id="lemma-record-filters-sort-by">
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
            <SelectTrigger className={DATA_INPUT_CLASS_NAME} id="lemma-record-filters-sort-order">
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
            <SelectTrigger className={DATA_INPUT_CLASS_NAME} id="lemma-record-filters-page-size">
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
      <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
        {typeof resultCount === "number" ? (
          <p className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", dataWorkspaceMetaBadgeClassName("default"))}>
            {resultCount} result{resultCount === 1 ? "" : "s"}
          </p>
        ) : null}
        {onRefresh ? (
          <Button className={DATA_SUBTLE_ACTION_CLASS_NAME} disabled={isRefreshing} onClick={onRefresh} type="button" variant="ghost">
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
        ) : null}
      </div>
      </div>
      {activeFilterCount > 0 ? (
        <div className="flex flex-wrap gap-2">
          {filters
            .filter((filter) => (
              filter.field
              && (operatorNeedsValue(filter.op) ? stringifyFilterValue(filter.value).trim().length > 0 : true)
            ))
            .map((filter) => {
              const field = availableFilterFields.find((option) => option.value === filter.field)
              const operator = availableOperators(field?.type).find((option) => option.value === filter.op)
              return (
                <div
                  className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs", dataWorkspaceMetaBadgeClassName("default"))}
                  key={filter.id}
                >
                  <span className="font-medium text-foreground">{field?.label ?? filter.field}</span>
                  <span>{operator?.label ?? filter.op}</span>
                  {operatorNeedsValue(filter.op) ? <span>{filter.value}</span> : null}
                </div>
              )
            })}
        </div>
      ) : null}

      {!activeFilterCount && !search.trim() && !sortBy && typeof resultCount !== "undefined" ? (
        <DataWorkspaceState
          description="Search, sort, and filters stay compact until you need them, then expand into a dedicated editor."
          heading="Operational controls"
        />
      ) : null}
    </div>
    <Sheet open={isFilterEditorOpen} onOpenChange={setIsFilterEditorOpen}>
      <SheetContent className="flex w-full flex-col gap-0 border-l border-border/70 bg-background/95 p-0 sm:max-w-4xl" side="right">
        <SheetHeader className="border-b border-border/60 px-6 py-5 text-left">
          <SheetTitle>Filter Records</SheetTitle>
          <SheetDescription>
            Refine the current records view with structured conditions.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 border-b border-border/60 px-6 py-6">
            {draftFilters.map((filter, index) => {
              const field = availableFilterFields.find((option) => option.value === filter.field) ?? firstFilterField
              const operators = availableOperators(field?.type)
              const showValueInput = operatorNeedsValue(filter.op)
              const fieldType = field?.type ?? "text"
              return (
                <div className={cn("grid gap-3 p-4 md:grid-cols-[minmax(0,1.3fr)_minmax(180px,0.9fr)_minmax(0,1.6fr)_auto]", DATA_PANEL_SECTION_CLASS_NAME)} key={filter.id}>
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
                    <SelectTrigger className={DATA_INPUT_CLASS_NAME}>
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
                      const opValue = value as LemmaFilterOperator
                      setDraftFilters((current) => current.map((entry) => (
                        entry.id === filter.id
                          ? {
                              ...entry,
                              op: opValue,
                              value: operatorNeedsValue(opValue) ? entry.value ?? "" : "",
                            }
                          : entry
                      )))
                    }}
                  >
                    <SelectTrigger className={DATA_INPUT_CLASS_NAME}>
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
                        value={stringifyFilterValue(filter.value)}
                        onValueChange={(value) => {
                          setDraftFilters((current) => current.map((entry) => (
                            entry.id === filter.id ? { ...entry, value } : entry
                          )))
                        }}
                      >
                        <SelectTrigger className={DATA_INPUT_CLASS_NAME}>
                          <SelectValue placeholder="Value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : fieldType === "select" && field?.options?.length ? (
                      <Select
                        value={stringifyFilterValue(filter.value)}
                        onValueChange={(value) => {
                          setDraftFilters((current) => current.map((entry) => (
                            entry.id === filter.id ? { ...entry, value } : entry
                          )))
                        }}
                      >
                        <SelectTrigger className={DATA_INPUT_CLASS_NAME}>
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
                        className={DATA_INPUT_CLASS_NAME}
                        onChange={(event) => {
                          const value = event.target.value
                          setDraftFilters((current) => current.map((entry) => (
                            entry.id === filter.id ? { ...entry, value } : entry
                          )))
                        }}
                        placeholder="Value"
                        type={fieldType === "number" ? "number" : fieldType === "date" ? "date" : fieldType === "datetime" ? "datetime-local" : "text"}
                        value={stringifyFilterValue(filter.value)}
                      />
                    )
                  ) : (
                    <div className="flex items-center rounded-xl border border-dashed border-border/70 bg-muted/[0.18] px-4 py-3 text-sm text-muted-foreground">
                      No value needed
                    </div>
                  )}
                  <Button
                    className={DATA_SUBTLE_ACTION_CLASS_NAME}
                    onClick={() => {
                      setDraftFilters((current) => current.filter((entry) => entry.id !== filter.id))
                    }}
                    type="button"
                    variant="ghost"
                  >
                    Remove
                  </Button>
                </div>
              )
            })}
            <button
              className="flex w-full items-center justify-center gap-2 rounded-[1rem] border border-dashed border-border/70 bg-muted/[0.12] px-4 py-4 text-base font-medium text-muted-foreground transition-colors hover:bg-muted/[0.22] hover:text-foreground"
              onClick={() => {
                setDraftFilters((current) => [...current, createEmptyFilter(firstFilterField)])
              }}
              type="button"
            >
              <span className="text-xl leading-none">+</span>
              Add Condition
            </button>
        </div>
        <SheetFooter className="border-t border-border/60 px-6 py-5">
          <Button
            className={DATA_SUBTLE_ACTION_CLASS_NAME}
            onClick={() => {
              setDraftFilters(filters)
              setIsFilterEditorOpen(false)
            }}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onFiltersChange?.(
                draftFilters.filter((filter) => (
                  filter.field.trim().length > 0
                  && (operatorNeedsValue(filter.op) ? stringifyFilterValue(filter.value).trim().length > 0 : true)
                )),
              )
              setIsFilterEditorOpen(false)
            }}
            type="button"
          >
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </div>
  )
})
LemmaRecordFiltersBar.displayName = "LemmaRecordFiltersBar"
