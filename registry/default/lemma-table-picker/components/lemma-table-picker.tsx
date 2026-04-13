"use client"

import * as React from "react"
import type { LemmaClient, Table } from "lemma-sdk"
import { useTables } from "lemma-sdk/react"
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

export interface LemmaTablePickerProps {
  client: LemmaClient
  podId?: string
  value?: string
  onValueChange?: (value: string) => void
  title?: string
  description?: string
  placeholder?: string
  limit?: number
  tables?: Table[]
  isLoading?: boolean
  error?: Error | null
  onRefresh?: () => void
}

export function LemmaTablePicker({
  client,
  podId,
  value,
  onValueChange,
  title = "Table Picker",
  description = "Choose a datastore table.",
  placeholder = "Select a table",
  limit = 100,
  tables,
  isLoading,
  error,
  onRefresh,
}: LemmaTablePickerProps) {
  const tablesState = useTables({
    client,
    podId,
    enabled: !tables,
    limit,
  })

  const effectiveTables = tables ?? tablesState.tables
  const effectiveIsLoading = isLoading ?? tablesState.isLoading
  const effectiveError = error ?? tablesState.error

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            disabled={effectiveIsLoading}
            onClick={() => {
              if (onRefresh) {
                onRefresh()
                return
              }
              void tablesState.refresh()
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

        <Select value={value ?? ""} onValueChange={onValueChange}>
          <SelectTrigger id="lemma-table-picker">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {effectiveTables.map((table) => (
              <SelectItem key={table.name} value={table.name}>
                {table.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-xs text-[color:var(--resource-muted)]">
          {effectiveIsLoading ? "Loading tables…" : `${effectiveTables.length} table${effectiveTables.length === 1 ? "" : "s"} available`}
        </p>
      </CardContent>
    </Card>
  )
}
