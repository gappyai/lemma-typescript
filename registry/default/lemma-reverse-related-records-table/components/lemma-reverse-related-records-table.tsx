"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useReverseRelatedRecords, type ReverseRelationSelector } from "lemma-sdk/react"
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

export interface LemmaReverseRelatedRecordsTableProps {
  client: LemmaClient
  podId?: string
  tableName: string
  recordId?: string | null
  relation?: ReverseRelationSelector | null
  onRelationChange?: (relation: ReverseRelationSelector | null) => void
  fields?: string[]
  limit?: number
  title?: string
  description?: string
  emptyText?: string
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value === null || typeof value === "undefined") return "—"

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function LemmaReverseRelatedRecordsTable({
  client,
  podId,
  tableName,
  recordId,
  relation,
  onRelationChange,
  fields,
  limit = 10,
  title,
  description,
  emptyText = "No child records were found for this record.",
}: LemmaReverseRelatedRecordsTableProps) {
  const trimmedTableName = tableName.trim()
  const trimmedRecordId = typeof recordId === "string" ? recordId.trim() : ""
  const reverseState = useReverseRelatedRecords({
    client,
    podId,
    tableName: trimmedTableName,
    recordId: trimmedRecordId || null,
    relation,
    fields,
    limit,
    enabled: trimmedTableName.length > 0 && trimmedRecordId.length > 0,
  })

  if (!trimmedTableName || !trimmedRecordId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title ?? "Reverse Related Records"}</CardTitle>
          <CardDescription>{description ?? "Select a record to inspect child rows that point back to it."}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>{title ?? "Reverse Related Records"}</CardTitle>
            <CardDescription>
              {description ?? "Child rows discovered from foreign keys that reference this record's table."}
            </CardDescription>
          </div>
          <Button
            disabled={reverseState.isLoading}
            onClick={() => {
              void reverseState.refresh()
            }}
            variant="outline"
          >
            {reverseState.isLoading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {reverseState.relations.length > 1 ? (
          <Select
            value={reverseState.selectedRelation ? `${reverseState.selectedRelation.tableName}:${reverseState.selectedRelation.foreignKey}` : ""}
            onValueChange={(value) => {
              const [tableNameValue, foreignKeyValue] = value.split(":")
              onRelationChange?.(
                tableNameValue && foreignKeyValue
                  ? { tableName: tableNameValue, foreignKey: foreignKeyValue }
                  : null,
              )
            }}
          >
            <SelectTrigger id="lemma-reverse-related-relation">
              <SelectValue placeholder="Select a reverse relation" />
            </SelectTrigger>
            <SelectContent>
              {reverseState.relations.map((entry) => (
                <SelectItem key={`${entry.tableName}:${entry.foreignKey}`} value={`${entry.tableName}:${entry.foreignKey}`}>
                  {entry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {reverseState.error ? (
          <div className="rounded-md border border-[color:var(--resource-danger-border)] bg-[var(--resource-danger-soft)] px-3 py-2 text-sm text-[color:var(--resource-danger)]">
            {reverseState.error.message}
          </div>
        ) : null}

        {reverseState.isLoading && reverseState.records.length === 0 ? (
          <div className="rounded-md border border-dashed border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-6 text-sm text-[color:var(--resource-muted)]">
            Loading reverse-related records…
          </div>
        ) : null}

        {!reverseState.isLoading && reverseState.relations.length === 0 ? (
          <div className="rounded-md border border-dashed border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-6 text-sm text-[color:var(--resource-muted)]">
            No reverse relations were discovered for this table.
          </div>
        ) : null}

        {!reverseState.isLoading && reverseState.relations.length > 0 && reverseState.records.length === 0 ? (
          <div className="rounded-md border border-dashed border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-6 text-sm text-[color:var(--resource-muted)]">
            {emptyText}
          </div>
        ) : null}

        {reverseState.records.length > 0 && reverseState.columns.length > 0 ? (
          <div className="overflow-x-auto rounded-[calc(var(--resource-radius-md)-0.2rem)] border border-[color:var(--resource-border)]">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[var(--resource-table-header)] text-left text-[color:var(--resource-muted-strong)]">
                <tr>
                  {reverseState.columns.map((column) => (
                    <th key={column.key} className="px-3 py-2 font-medium">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reverseState.records.map((record, index) => (
                  <tr key={String(record.id ?? index)} className="border-t border-[color:var(--resource-border)] align-top text-[color:var(--resource-text)]">
                    {reverseState.columns.map((column) => (
                      <td key={column.key} className="max-w-[220px] px-3 py-2">
                        <div className="truncate" title={formatValue(record[column.field])}>
                          {formatValue(record[column.field])}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
