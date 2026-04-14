"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useReverseRelatedRecords, type ReverseRelationSelector } from "lemma-sdk/react"
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

export interface LemmaReverseRelatedRecordsTableProps extends React.HTMLAttributes<HTMLDivElement> {
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
  recordIdField?: string
  getRecordId?: (record: Record<string, unknown>) => string
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

function readRecordId(
  record: Record<string, unknown>,
  recordIdField: string,
  getRecordId?: (record: Record<string, unknown>) => string,
): string {
  if (getRecordId) {
    const customId = getRecordId(record)
    return typeof customId === "string" ? customId : ""
  }

  const value = record[recordIdField]
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

export const LemmaReverseRelatedRecordsTable = React.forwardRef<HTMLDivElement, LemmaReverseRelatedRecordsTableProps>(
  ({
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
    recordIdField = "id",
    getRecordId,
    className,
    ...props
  }, ref) => {
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
        <Card ref={ref} className={cn("", className)} {...props}>
          <CardHeader>
            <DataWorkspaceHeader
              description={description ?? "Select a record to inspect child rows that point back to it."}
              eyebrow="Reverse Relations"
              title={title ?? "Reverse Related Records"}
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
                disabled={reverseState.isLoading}
                onClick={() => {
                  void reverseState.refresh()
                }}
                type="button"
                variant="ghost"
              >
                {reverseState.isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            )}
            description={description ?? "Child rows discovered from foreign keys that reference this record's table."}
            eyebrow="Reverse Relations"
            meta={(
              <>
                <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("primary"))} variant="outline">
                  {trimmedTableName}
                </Badge>
                <Badge className={cn("max-w-full rounded-full border px-2 py-0.5 font-mono text-xs", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
                  {trimmedRecordId}
                </Badge>
              </>
            )}
            title={title ?? "Reverse Related Records"}
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
                <SelectGroup>
                  {reverseState.relations.map((entry) => (
                    <SelectItem key={`${entry.tableName}:${entry.foreignKey}`} value={`${entry.tableName}:${entry.foreignKey}`}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : null}

          {reverseState.error ? (
            <DataWorkspaceState description={reverseState.error.message} tone="danger" />
          ) : null}

          {reverseState.isLoading && reverseState.records.length === 0 ? (
            <DataWorkspaceState description="Loading reverse-related records..." heading="Finding child rows" />
          ) : null}

          {!reverseState.isLoading && reverseState.relations.length === 0 ? (
            <DataWorkspaceState description="No reverse relations were discovered for this table." heading="No reverse relations" />
          ) : null}

          {!reverseState.isLoading && reverseState.relations.length > 0 && reverseState.records.length === 0 ? (
            <DataWorkspaceState description={emptyText} heading="No child rows" />
          ) : null}

          {reverseState.records.length > 0 && reverseState.columns.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    {reverseState.columns.map((column) => (
                      <TableHead key={column.key} className="align-top border-b px-4 py-3">
                        <div className="grid gap-2">
                          <div className="text-sm font-medium text-foreground">{column.label}</div>
                          <Badge className={cn("w-fit rounded-full border px-2 py-0.5 text-xs", dataWorkspaceRelationBadgeClassName("related"))} variant="outline">
                            {column.field}
                          </Badge>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reverseState.records.map((record, index) => (
                    <TableRow key={readRecordId(record, recordIdField, getRecordId) || index} className={dataWorkspaceRowClassName()}>
                      {reverseState.columns.map((column) => (
                        <TableCell key={column.key} className="max-w-[240px] px-4 py-3 align-top">
                          <div className="truncate text-sm leading-6 text-foreground/90" title={formatValue(record[column.field])}>
                            {formatValue(record[column.field])}
                          </div>
                        </TableCell>
                      ))}
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
LemmaReverseRelatedRecordsTable.displayName = "LemmaReverseRelatedRecordsTable"
