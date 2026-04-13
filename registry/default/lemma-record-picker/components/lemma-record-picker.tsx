"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useRecords } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface LemmaRecordPickerProps {
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

export function LemmaRecordPicker({
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
}: LemmaRecordPickerProps) {
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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            disabled={effectiveIsLoading || trimmedTableName.length === 0}
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
      <CardContent className="grid gap-3">
        {effectiveError ? (
          <div className="rounded-md border border-[color:var(--resource-danger-border)] bg-[var(--resource-danger-soft)] px-3 py-2 text-sm text-[color:var(--resource-danger)]">
            {effectiveError.message}
          </div>
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
              const id = typeof record.id === "string" ? record.id : String(record.id ?? "")
              return (
                <SelectItem key={id} value={id}>
                  {summarizeRecord(record, labelFields)}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        <p className="text-xs text-[color:var(--resource-muted)]">
          {trimmedTableName.length === 0
            ? "Select a table first."
            : `${filteredRecords.length} record${filteredRecords.length === 1 ? "" : "s"} available`}
        </p>
      </CardContent>
    </Card>
  )
}
