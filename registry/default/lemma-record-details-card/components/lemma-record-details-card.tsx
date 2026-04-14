"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useRecord } from "lemma-sdk/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  if (value === null || typeof value === "undefined") return "—"

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
    const metaSummary = (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{trimmedTableName}</Badge>
        <Badge variant="outline">{visibleFields.length} field{visibleFields.length === 1 ? "" : "s"}</Badge>
        <Badge variant="outline" className="max-w-full truncate font-mono text-[11px]">
          {trimmedRecordId}
        </Badge>
      </div>
    )

    const detailsBody = (
      <div ref={ref} className={cn("flex min-h-0 flex-1 flex-col", className)} {...props}>
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
          <div className="grid gap-3">
            <div className="grid gap-1">
              <h3 className="text-lg font-semibold text-foreground">{headerTitle}</h3>
              <p className="text-sm text-muted-foreground">{headerDescription}</p>
            </div>
            {metaSummary}
          </div>
          <Button
            disabled={recordState.isLoading}
            onClick={() => {
              void recordState.refresh()
            }}
            type="button"
            variant="outline"
          >
            {recordState.isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="grid gap-4">
            {recordState.error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {recordState.error.message}
              </div>
            ) : null}

            {recordState.isLoading && !recordState.record ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
                Loading record details...
              </div>
            ) : null}

            {recordState.record ? (
              <div className="grid gap-3 md:grid-cols-2">
                {visibleFields.map((field) => (
                  <section
                    key={field}
                    className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-foreground">{sentenceCase(field)}</div>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wide">
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
        </div>
      </div>
    )

    if (!trimmedTableName || !trimmedRecordId) {
      if (variant === "sheet") {
        return null
      }

      return (
        <Card ref={ref} className={cn("", className)} {...props}>
          <CardHeader>
            <CardTitle>{headerTitle}</CardTitle>
            <CardDescription>{description ?? "Select a record to inspect its full payload."}</CardDescription>
          </CardHeader>
        </Card>
      )
    }

    if (variant === "sheet") {
      return (
        <Sheet open={resolvedOpen} onOpenChange={handleOpenChange}>
          <SheetContent className="flex w-full flex-col gap-0 sm:max-w-2xl" side={side}>
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
      <Card ref={ref} className={cn("overflow-hidden border-border/70 shadow-sm", className)} {...props}>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-3">
              <div className="grid gap-1">
                <CardTitle>{headerTitle}</CardTitle>
                <CardDescription>{headerDescription}</CardDescription>
              </div>
              {metaSummary}
            </div>
            <Button
              disabled={recordState.isLoading}
              onClick={() => {
                void recordState.refresh()
              }}
              type="button"
              variant="outline"
            >
              {recordState.isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {recordState.error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {recordState.error.message}
            </div>
          ) : null}

          {recordState.isLoading && !recordState.record ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
              Loading record details...
            </div>
          ) : null}

          {recordState.record ? (
            <div className="grid gap-3 md:grid-cols-2">
              {visibleFields.map((field) => (
                <section
                  key={field}
                  className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-foreground">{sentenceCase(field)}</div>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wide">
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
        </CardContent>
      </Card>
    )
  },
)
LemmaRecordDetailsCard.displayName = "LemmaRecordDetailsCard"
