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
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const DEFAULT_SORT_VALUE = "__default__"

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
}: LemmaRecordFiltersBarProps) {
  const sortOptions = React.useMemo(
    () => normalizeSortOptions(availableSortFields),
    [availableSortFields],
  )

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-[var(--resource-radius-md)] border border-[color:var(--resource-border)] bg-[var(--resource-surface)] p-4 shadow-sm md:flex-row md:items-center">
      <div className="min-w-[220px] flex-1">
        <Input
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          value={search}
        />
      </div>
      {sortOptions.length > 0 && onSortByChange ? (
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
      {onSortOrderChange ? (
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
      {typeof pageSize === "number" && onPageSizeChange ? (
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
  )
}
