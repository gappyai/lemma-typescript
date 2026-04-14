"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useRelatedRecords, type RelatedRecordsInclude } from "lemma-sdk/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  DataWorkspaceHeader,
  DataWorkspaceState,
  dataWorkspaceMetaBadgeClassName,
  dataWorkspaceRelationBadgeClassName,
  dataWorkspaceRowClassName,
} from "@/components/lemma/registry-data-workspace"

export interface LemmaRelatedRecordsTableProps extends React.HTMLAttributes<HTMLDivElement> {
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

export const LemmaRelatedRecordsTable = React.forwardRef<HTMLDivElement, LemmaRelatedRecordsTableProps>(
  ({
    client,
    podId,
    tableName,
    include,
    baseFields,
    limit = 10,
    title,
    description,
    emptyText = "No related records were found for this relation setup.",
    className,
    ...props
  }, ref) => {
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
        <Card ref={ref} className={cn("", className)} {...props}>
          <CardHeader>
            <DataWorkspaceHeader
              description={description ?? "Choose a table with a foreign key to preview related data."}
              eyebrow="Relations"
              title={title ?? "Related Records"}
            />
          </CardHeader>
        </Card>
      )
    }

    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardHeader>
          <DataWorkspaceHeader
            actions={(
              <Button
                disabled={relatedState.isLoading}
                onClick={() => {
                  void relatedState.refresh()
                }}
                type="button"
                variant="ghost"
              >
                {relatedState.isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            )}
            description={description ?? "Relation-aware joined records powered by foreign-key metadata."}
            eyebrow="Relations"
            meta={(
              <>
                <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("primary"))} variant="outline">
                  {trimmedTableName}
                </Badge>
                <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
                  {relatedState.records.length} joined
                </Badge>
              </>
            )}
            title={title ?? `Related Records: ${trimmedTableName}`}
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {relatedState.error ? (
            <DataWorkspaceState description={relatedState.error.message} tone="danger" />
          ) : null}

          {relatedState.isLoading && relatedState.records.length === 0 ? (
            <DataWorkspaceState description="Loading related records..." heading="Fetching joined rows" />
          ) : null}

          {!relatedState.isLoading && relatedState.records.length === 0 ? (
            <DataWorkspaceState description={emptyText} heading="No related rows" />
          ) : null}

          {relatedState.records.length > 0 && relatedState.columns.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    {relatedState.columns.map((column) => (
                      <TableHead key={column.key} className="align-top border-b px-4 py-3">
                        <div className="grid gap-2">
                          <div className="text-sm font-medium text-foreground">{column.label}</div>
                          <Badge className={cn("w-fit rounded-full border px-2 py-0.5 text-xs", dataWorkspaceRelationBadgeClassName(column.source))} variant="outline">
                            {column.source === "base" ? "Base" : column.relationKey ?? "Related"}
                          </Badge>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedState.records.map((record, index) => (
                    <TableRow key={index} className={dataWorkspaceRowClassName()}>
                      {relatedState.columns.map((column) => {
                        const value = readColumnValue(record, column)
                        return (
                          <TableCell key={column.key} className="max-w-[240px] px-4 py-3 align-top">
                            <div className="truncate text-sm leading-6 text-foreground/90" title={formatValue(value)}>
                              {formatValue(value)}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    )
  },
)
LemmaRelatedRecordsTable.displayName = "LemmaRelatedRecordsTable"
