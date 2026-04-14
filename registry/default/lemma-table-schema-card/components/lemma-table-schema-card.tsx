"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useTable } from "lemma-sdk/react"
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
  dataWorkspaceRowClassName,
  dataWorkspaceTypeBadgeClassName,
} from "@/components/lemma/registry-data-workspace"

export interface LemmaTableSchemaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  client: LemmaClient
  podId?: string
  tableName: string
  title?: string
  description?: string
}

function sentenceCase(value: string): string {
  return value
    .replace(/[_\.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

export const LemmaTableSchemaCard = React.forwardRef<HTMLDivElement, LemmaTableSchemaCardProps>(
  ({
    client,
    podId,
    tableName,
    title,
    description,
    className,
    ...props
  }, ref) => {
    const trimmedTableName = tableName.trim()
    const tableState = useTable({
      client,
      podId,
      tableName: trimmedTableName,
      enabled: trimmedTableName.length > 0,
    })

    if (!trimmedTableName) {
      return (
        <Card ref={ref} className={cn("", className)} {...props}>
          <CardHeader>
            <DataWorkspaceHeader
              description={description ?? "Select a table to inspect its schema and column metadata."}
              eyebrow="Schema"
              title={title ?? "Table Schema"}
            />
          </CardHeader>
        </Card>
      )
    }

    const columns = tableState.table?.columns ?? []

    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardHeader>
          <DataWorkspaceHeader
            actions={(
              <Button
                disabled={tableState.isLoading}
                onClick={() => {
                  void tableState.refresh()
                }}
                type="button"
                variant="ghost"
              >
                {tableState.isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            )}
            description={description ?? "Column metadata, constraints, and references for the active table."}
            eyebrow="Schema"
            meta={(
              <>
                <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("primary"))} variant="outline">
                  {trimmedTableName}
                </Badge>
                <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
                  {columns.length} column{columns.length === 1 ? "" : "s"}
                </Badge>
              </>
            )}
            title={title ?? "Table Schema"}
          />
        </CardHeader>
        <CardContent className="grid gap-4">
          {tableState.error ? (
            <DataWorkspaceState description={tableState.error.message} tone="danger" />
          ) : null}

          {tableState.isLoading && !tableState.table ? (
            <DataWorkspaceState description="Loading schema..." heading="Fetching column metadata" />
          ) : null}

          {!tableState.isLoading && tableState.table && columns.length === 0 ? (
            <DataWorkspaceState description="This table does not expose any columns yet." heading="No columns" />
          ) : null}

          {columns.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="border-b px-4 py-3 text-sm font-medium text-muted-foreground">Column</TableHead>
                    <TableHead className="border-b px-4 py-3 text-sm font-medium text-muted-foreground">Type</TableHead>
                    <TableHead className="border-b px-4 py-3 text-sm font-medium text-muted-foreground">Details</TableHead>
                    <TableHead className="border-b px-4 py-3 text-sm font-medium text-muted-foreground">Flags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map((column) => (
                    <TableRow className={dataWorkspaceRowClassName()} key={column.name}>
                      <TableCell className="px-4 py-3 align-top">
                        <div className="grid gap-1">
                          <div className="font-medium text-foreground">{sentenceCase(column.name)}</div>
                          <div className="font-mono text-xs text-muted-foreground">{column.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 align-top">
                        <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceTypeBadgeClassName(column.foreign_key?.references ? "foreign-key" : column.type))} variant="outline">
                          {column.foreign_key?.references ? "foreign-key" : column.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 align-top">
                        <div className="grid gap-1.5 text-sm leading-6 text-muted-foreground">
                          <div>{column.description?.trim() ? column.description : "No description provided."}</div>
                          {column.foreign_key?.references ? (
                            <div className="font-mono text-xs text-foreground/75">
                              Ref: {column.foreign_key.references}
                            </div>
                          ) : null}
                          {column.options?.length ? (
                            <div className="text-xs text-muted-foreground">
                              Options: {column.options.join(", ")}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-2">
                          {column.required ? (
                            <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("primary"))} variant="outline">
                              Required
                            </Badge>
                          ) : null}
                          {column.unique ? (
                            <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
                              Unique
                            </Badge>
                          ) : null}
                          {column.system ? (
                            <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
                              System
                            </Badge>
                          ) : null}
                          {column.computed ? (
                            <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
                              Computed
                            </Badge>
                          ) : null}
                          {column.auto ? (
                            <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
                              Auto
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
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
LemmaTableSchemaCard.displayName = "LemmaTableSchemaCard"
