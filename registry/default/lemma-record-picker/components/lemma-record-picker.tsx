"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useRecords } from "lemma-sdk/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  DataWorkspaceHeader,
  DataWorkspaceState,
  dataWorkspaceMetaBadgeClassName,
} from "@/components/lemma/registry-data-workspace"

export interface LemmaRecordPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  client: LemmaClient
  podId?: string
  tableName: string
  value?: string
  onValueChange?: (value: string) => void
  title?: string
  description?: string
  placeholder?: string
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  searchFields?: string[]
  labelFields?: string[]
  limit?: number
  records?: Record<string, unknown>[]
  isLoading?: boolean
  error?: Error | null
  onRefresh?: () => void
  recordIdField?: string
  getRecordId?: (record: Record<string, unknown>) => string
}

const EMPTY_LABEL_FIELDS: string[] = []

function summarizeRecord(record: Record<string, unknown>, labelFields: string[]): string {
  const candidates = [
    ...labelFields,
    "title",
    "name",
    "label",
    "email",
    "id",
  ]

  for (const field of candidates) {
    const value = record[field]
    if (typeof value === "string" && value.trim().length > 0) return value
    if (typeof value === "number") return String(value)
  }

  try {
    return JSON.stringify(record)
  } catch {
    return "Untitled record"
  }
}

export const LemmaRecordPicker = React.forwardRef<HTMLDivElement, LemmaRecordPickerProps>(
  ({
    client,
    podId,
    tableName,
    value,
    onValueChange,
    title = "Record Picker",
    description = "Jump to a specific record in the selected table.",
    placeholder = "Select a record",
    search,
    onSearchChange,
    searchPlaceholder = "Search loaded records…",
    searchFields,
    labelFields = EMPTY_LABEL_FIELDS,
    limit = 50,
    records,
    isLoading,
    error,
    onRefresh,
    recordIdField = "id",
    getRecordId,
    className,
    ...props
  }, ref) => {
  const [internalSearch, setInternalSearch] = React.useState("")
  const activeSearch = search ?? internalSearch
  const deferredSearch = React.useDeferredValue(activeSearch)
  const trimmedTableName = tableName.trim()
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

  const filteredRecords = React.useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase()
    if (!normalizedSearch) return effectiveRecords

    const fields = searchFields?.length
      ? searchFields
      : Array.from(new Set([...labelFields, "title", "name", "label", "email", "id"]))

    return effectiveRecords.filter((record) => fields.some((field) => {
      const fieldValue = record[field]
      if (typeof fieldValue === "string") return fieldValue.toLowerCase().includes(normalizedSearch)
      if (typeof fieldValue === "number" || typeof fieldValue === "boolean") {
        return String(fieldValue).toLowerCase().includes(normalizedSearch)
      }
      return false
    }))
  }, [deferredSearch, effectiveRecords, labelFields, searchFields])

  return (
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardHeader>
        <DataWorkspaceHeader
          actions={(
            <Button
              disabled={effectiveIsLoading || trimmedTableName.length === 0}
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
              {effectiveIsLoading ? "Refreshing…" : "Refresh"}
            </Button>
          )}
          description={description}
          eyebrow="Record Context"
          meta={(
            <>
              {trimmedTableName ? (
                <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("primary"))} variant="outline">
                  {trimmedTableName}
                </Badge>
              ) : null}
              <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
                {filteredRecords.length} result{filteredRecords.length === 1 ? "" : "s"}
              </Badge>
            </>
          )}
          title={title}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {effectiveError ? (
          <DataWorkspaceState description={effectiveError.message} tone="danger" />
        ) : null}

        <Input
          onChange={(event) => {
            if (onSearchChange) {
              onSearchChange(event.target.value)
              return
            }
            setInternalSearch(event.target.value)
          }}
          placeholder={searchPlaceholder}
          value={activeSearch}
        />

        <Select
          disabled={trimmedTableName.length === 0 || filteredRecords.length === 0}
          value={value ?? ""}
          onValueChange={onValueChange}
        >
          <SelectTrigger id="lemma-record-picker">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {filteredRecords.map((record) => {
              const id = getRecordId
                ? getRecordId(record)
                : typeof record[recordIdField] === "string"
                  ? record[recordIdField] as string
                  : String(record[recordIdField] ?? "")
              return (
                <SelectItem key={id} value={id}>
                  {summarizeRecord(record, labelFields)}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        {!effectiveError ? (
          <DataWorkspaceState
            description={trimmedTableName.length === 0
              ? "Select a table first so the picker can load records."
              : filteredRecords.length === 0
                ? "No loaded records match the current search."
                : "Choose a record to sync the details panel and related views."}
            heading={trimmedTableName.length === 0 ? "Waiting for table" : "Jump to a record"}
          />
        ) : null}
      </CardContent>
    </Card>
  )
})
LemmaRecordPicker.displayName = "LemmaRecordPicker"
