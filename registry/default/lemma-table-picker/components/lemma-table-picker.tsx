"use client"

import * as React from "react"
import type { LemmaClient, Table } from "lemma-sdk"
import { useTables } from "lemma-sdk/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
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

export interface LemmaTablePickerProps extends React.HTMLAttributes<HTMLDivElement> {
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

export const LemmaTablePicker = React.forwardRef<HTMLDivElement, LemmaTablePickerProps>(
  ({
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
    className,
    ...props
  }, ref) => {
  const tablesState = useTables({
    client,
    podId,
    enabled: !tables,
    limit,
  })

  const effectiveTables = tables ?? tablesState.tables
  const effectiveIsLoading = isLoading ?? tablesState.isLoading
  const effectiveError = error ?? tablesState.error
  const selectedTable = effectiveTables.find((table) => table.name === value) ?? null

  return (
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardHeader>
        <DataWorkspaceHeader
          actions={(
            <Button
              disabled={effectiveIsLoading}
              onClick={() => {
                if (onRefresh) {
                  onRefresh()
                  return
                }
                void tablesState.refresh()
              }}
              type="button"
              variant="ghost"
            >
              {effectiveIsLoading ? "Refreshing…" : "Refresh"}
            </Button>
          )}
          description={description}
          eyebrow="Table Context"
          meta={(
            <>
              <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
                {effectiveIsLoading ? "Loading…" : `${effectiveTables.length} table${effectiveTables.length === 1 ? "" : "s"}`}
              </Badge>
              {selectedTable ? (
                <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("primary"))} variant="outline">
                  {selectedTable.name}
                </Badge>
              ) : null}
            </>
          )}
          title={title}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {effectiveError ? (
          <DataWorkspaceState description={effectiveError.message} tone="danger" />
        ) : null}

        <Select disabled={effectiveTables.length === 0 && effectiveIsLoading} value={value ?? ""} onValueChange={onValueChange}>
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

        {!effectiveError ? (
          <DataWorkspaceState
            description={selectedTable
              ? `Using ${selectedTable.name} as the active table for records, forms, and relation views.`
              : effectiveIsLoading
                ? "Loading tables so you can choose the active workspace context."
                : "Choose a table to anchor the records workspace and its related views."}
            heading={selectedTable ? "Active table ready" : "Choose a table"}
          />
        ) : null}
      </CardContent>
    </Card>
  )
})
LemmaTablePicker.displayName = "LemmaTablePicker"
