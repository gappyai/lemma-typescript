"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useRecord } from "lemma-sdk/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DataWorkspaceHeader,
  DataWorkspaceState,
  dataWorkspaceMetaBadgeClassName,
} from "@/components/lemma/registry-data-workspace"
import { cn } from "@/lib/utils"

type LemmaRecordDetailsVariant = "card" | "sheet"
type LemmaRecordDetailsSide = "top" | "right" | "bottom" | "left"

export interface LemmaRecordDetailsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  client: LemmaClient
  podId?: string
  tableName: string
  recordId?: string | null
  fields?: string[]
  title?: string
  description?: string
  variant?: LemmaRecordDetailsVariant
  side?: LemmaRecordDetailsSide
  open?: boolean
  onOpenChange?: (open: boolean) => void
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
  if (value === null || typeof value === "undefined") return "\u2014"

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export const LemmaRecordDetailsCard = React.forwardRef<HTMLDivElement, LemmaRecordDetailsCardProps>(
  ({
    client,
    podId,
    tableName,
    recordId,
    fields,
    title,
    description,
    variant = "card",
    side = "right",
    open,
    onOpenChange,
    className,
    ...props
  }, ref) => {
    const trimmedTableName = tableName.trim()
    const trimmedRecordId = typeof recordId === "string" ? recordId.trim() : ""
    const recordKey = `${trimmedTableName}:${trimmedRecordId}`
    const [dismissedRecordKey, setDismissedRecordKey] = React.useState<string | null>(null)
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

    React.useEffect(() => {
      setDismissedRecordKey(null)
    }, [recordKey])

    const resolvedOpen = variant === "sheet"
      ? typeof open === "boolean"
        ? open
        : trimmedRecordId.length > 0 && dismissedRecordKey !== recordKey
      : false

    const handleOpenChange = React.useCallback((nextOpen: boolean) => {
      if (!nextOpen && typeof open !== "boolean") {
        setDismissedRecordKey(recordKey)
      }
      onOpenChange?.(nextOpen)
    }, [onOpenChange, open, recordKey])

    const headerTitle = title ?? "Record Details"
    const headerDescription = description ?? "Inspect the selected record with real values."
    const meta = (
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))}
          variant="outline"
        >
          {trimmedTableName}
        </Badge>
        <Badge
          className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))}
          variant="outline"
        >
          {visibleFields.length} field{visibleFields.length === 1 ? "" : "s"}
        </Badge>
        <Badge
          className={cn("rounded-full border px-2 py-0.5 text-xs max-w-full truncate font-mono text-[10px]", dataWorkspaceMetaBadgeClassName("primary"))}
          variant="outline"
        >
          {trimmedRecordId}
        </Badge>
      </div>
    )
    const actions = (
      <Button
        disabled={recordState.isLoading}
        onClick={() => {
          void recordState.refresh()
        }}
        type="button"
        variant="outline"
      >
        {recordState.isLoading ? "Refreshing\u2026" : "Refresh"}
      </Button>
    )

    const detailsBody = (
      <div className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="p-6">
          <DataWorkspaceHeader
            actions={actions}
            description={headerDescription}
            meta={meta}
            title={headerTitle}
          />
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-y-auto p-6 pt-0">
          <div className="grid gap-4">
            {recordState.error ? (
              <DataWorkspaceState description={recordState.error.message} heading="Failed to load record" tone="danger" />
            ) : null}

            {recordState.isLoading && !recordState.record ? (
              <DataWorkspaceState description="Loading record details\u2026" />
            ) : null}

            {recordState.record ? (
              <div className="grid gap-3 md:grid-cols-2">
                {visibleFields.map((field) => (
                  <section
                    key={field}
                    className="rounded-lg border bg-muted/50 p-4 grid gap-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-foreground">{sentenceCase(field)}</div>
                      <Badge
                        className={cn("rounded-full border px-2 py-0.5 text-xs font-mono", dataWorkspaceMetaBadgeClassName("default"))}
                        variant="outline"
                      >
                        {field}
                      </Badge>
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                      {formatValue(recordState.record?.[field])}
                    </pre>
                  </section>
                ))}
              </div>
            ) : null}
          </div>
        </CardContent>
      </div>
    )

    if (!trimmedTableName || !trimmedRecordId) {
      if (variant === "sheet") {
        return null
      }

      return (
        <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props}>
          <CardHeader className="p-6">
            <DataWorkspaceHeader
              description={description ?? "Select a record to inspect its full payload."}
              title={headerTitle}
            />
          </CardHeader>
        </div>
      )
    }

    if (variant === "sheet") {
      return (
        <Sheet open={resolvedOpen} onOpenChange={handleOpenChange}>
          <SheetContent className="flex w-full flex-col gap-0 p-0 border-l border-border/60 sm:max-w-2xl" side={side}>
            <SheetHeader className="sr-only">
              <SheetTitle>{headerTitle}</SheetTitle>
              <SheetDescription>{headerDescription}</SheetDescription>
            </SheetHeader>
            {detailsBody}
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props}>
        {detailsBody}
      </div>
    )
  },
)
LemmaRecordDetailsCard.displayName = "LemmaRecordDetailsCard"
