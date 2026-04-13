"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useRelatedRecords, type RelatedRecordsInclude } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface LemmaRelatedRecordsTableProps {
  client: LemmaClient
  podId?: string
  tableName: string
  include: RelatedRecordsInclude[]
  baseFields?: string[]
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

function readColumnValue(record: Record<string, unknown>, column: {
  source: "base" | "related"
  field: string
  relationKey?: string
}): unknown {
  if (column.source === "base") {
    return record[column.field]
  }

  const relatedRecord = column.relationKey ? record[column.relationKey] : undefined
  if (!relatedRecord || typeof relatedRecord !== "object" || Array.isArray(relatedRecord)) {
    return undefined
  }

  return (relatedRecord as Record<string, unknown>)[column.field]
}

export function LemmaRelatedRecordsTable({
  client,
  podId,
  tableName,
  include,
  baseFields,
  limit = 10,
  title,
  description,
  emptyText = "No related records were found for this relation setup.",
}: LemmaRelatedRecordsTableProps) {
  const trimmedTableName = tableName.trim()
  const relatedState = useRelatedRecords({
    client,
    podId,
    tableName: trimmedTableName,
    include,
    baseFields,
    limit,
    enabled: trimmedTableName.length > 0 && include.length > 0,
  })

  if (!trimmedTableName || include.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title ?? "Related Records"}</CardTitle>
          <CardDescription>{description ?? "Choose a table with a foreign key to preview related data."}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>{title ?? `Related Records: ${trimmedTableName}`}</CardTitle>
            <CardDescription>
              {description ?? "Relation-aware joined records powered by foreign-key metadata."}
            </CardDescription>
          </div>
          <Button
            disabled={relatedState.isLoading}
            onClick={() => {
              void relatedState.refresh()
            }}
            variant="outline"
          >
            {relatedState.isLoading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {relatedState.error ? (
          <div className="rounded-md border border-[color:var(--resource-danger-border)] bg-[var(--resource-danger-soft)] px-3 py-2 text-sm text-[color:var(--resource-danger)]">
            {relatedState.error.message}
          </div>
        ) : null}

        {relatedState.isLoading && relatedState.records.length === 0 ? (
          <div className="rounded-md border border-dashed border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-6 text-sm text-[color:var(--resource-muted)]">
            Loading related records…
          </div>
        ) : null}

        {!relatedState.isLoading && relatedState.records.length === 0 ? (
          <div className="rounded-md border border-dashed border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-6 text-sm text-[color:var(--resource-muted)]">
            {emptyText}
          </div>
        ) : null}

        {relatedState.records.length > 0 && relatedState.columns.length > 0 ? (
          <div className="overflow-x-auto rounded-[calc(var(--resource-radius-md)-0.2rem)] border border-[color:var(--resource-border)]">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[var(--resource-table-header)] text-left text-[color:var(--resource-muted-strong)]">
                <tr>
                  {relatedState.columns.map((column) => (
                    <th key={column.key} className="px-3 py-2 font-medium">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {relatedState.records.map((record, index) => (
                  <tr key={index} className="border-t border-[color:var(--resource-border)] align-top text-[color:var(--resource-text)]">
                    {relatedState.columns.map((column) => {
                      const value = readColumnValue(record, column)
                      return (
                        <td key={column.key} className="max-w-[220px] px-3 py-2">
                          <div className="truncate" title={formatValue(value)}>
                            {formatValue(value)}
                          </div>
                        </td>
                      )
                    })}
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
