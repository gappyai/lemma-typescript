"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useRecord } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface LemmaRecordDetailsCardProps {
  client: LemmaClient
  podId?: string
  tableName: string
  recordId?: string | null
  fields?: string[]
  title?: string
  description?: string
}

function sentenceCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value === null || typeof value === "undefined") return "—"

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function LemmaRecordDetailsCard({
  client,
  podId,
  tableName,
  recordId,
  fields,
  title,
  description,
}: LemmaRecordDetailsCardProps) {
  const trimmedTableName = tableName.trim()
  const trimmedRecordId = typeof recordId === "string" ? recordId.trim() : ""
  const recordState = useRecord({
    client,
    podId,
    tableName: trimmedTableName,
    recordId: trimmedRecordId || null,
    enabled: trimmedTableName.length > 0 && trimmedRecordId.length > 0,
  })

  const visibleFields = React.useMemo(() => {
    const record = recordState.record
    if (!record) return fields ?? []
    if (fields?.length) return fields
    return Object.keys(record)
      .filter((field) => field !== "created_at" && field !== "updated_at")
      .slice(0, 12)
  }, [fields, recordState.record])

  if (!trimmedTableName || !trimmedRecordId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title ?? "Record Details"}</CardTitle>
          <CardDescription>{description ?? "Select a record to inspect its full payload."}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>{title ?? "Record Details"}</CardTitle>
            <CardDescription>{description ?? "Inspect the selected record with real values."}</CardDescription>
          </div>
          <Button
            disabled={recordState.isLoading}
            onClick={() => {
              void recordState.refresh()
            }}
            variant="outline"
          >
            {recordState.isLoading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {recordState.error ? (
          <div className="rounded-md border border-[color:var(--resource-danger-border)] bg-[var(--resource-danger-soft)] px-3 py-2 text-sm text-[color:var(--resource-danger)]">
            {recordState.error.message}
          </div>
        ) : null}

        {recordState.isLoading && !recordState.record ? (
          <div className="rounded-md border border-dashed border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-6 text-sm text-[color:var(--resource-muted)]">
            Loading record details…
          </div>
        ) : null}

        {recordState.record ? (
          <div className="grid gap-3">
            {visibleFields.map((field) => (
              <div key={field} className="rounded-[calc(var(--resource-radius-md)-0.2rem)] border border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-3">
                <div className="text-xs uppercase tracking-[0.16em] text-[color:var(--resource-subtle)]">{sentenceCase(field)}</div>
                <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[color:var(--resource-text)]">
                  {formatValue(recordState.record?.[field])}
                </pre>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
