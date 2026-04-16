"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  RefreshCw,
  ThumbsDown,
  UserCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useRecords } from "lemma-sdk/react"
import type { LemmaClient, RecordFilter } from "lemma-sdk"
import { cn } from "@/lib/utils"

export type LemmaApprovalAppearance = "default" | "minimal" | "borderless" | "contained"
export type LemmaApprovalDensity = "compact" | "comfortable" | "spacious"
export type LemmaApprovalRadius = "none" | "sm" | "md" | "lg" | "xl"
export type LemmaApprovalAction = "approve" | "reject" | "request_changes"
export type LemmaApprovalActionMode = "direct" | "function"

export interface LemmaApprovalActionContext {
  record: Record<string, unknown>
  action: LemmaApprovalAction
  nextStatus: string
  note: string
}

export interface LemmaApprovalQueueProps {
  client: LemmaClient
  podId?: string
  tableName?: string
  enabled?: boolean
  filters?: RecordFilter[]
  pageSize?: number
  statusField?: string
  pendingStatus?: string
  approvedStatus?: string
  rejectedStatus?: string
  changesRequestedStatus?: string
  titleField?: string
  descriptionField?: string
  requesterField?: string
  ownerField?: string
  amountField?: string
  dueAtField?: string
  createdAtField?: string
  noteField?: string
  actionMode?: LemmaApprovalActionMode
  actionFunctionName?: string
  approveFunctionName?: string
  rejectFunctionName?: string
  requestChangesFunctionName?: string
  buildActionInput?: (context: LemmaApprovalActionContext) => Record<string, unknown>
  renderSummary?: (record: Record<string, unknown>) => React.ReactNode
  renderDetail?: (record: Record<string, unknown>) => React.ReactNode
  onActionSuccess?: (context: LemmaApprovalActionContext) => void
  onRecordOpen?: (record: Record<string, unknown>) => void
  appearance?: LemmaApprovalAppearance
  density?: LemmaApprovalDensity
  radius?: LemmaApprovalRadius
  title?: React.ReactNode
  description?: React.ReactNode
  className?: string
}

export function LemmaApprovalQueue({
  client,
  podId,
  tableName = "approval_requests",
  enabled = true,
  filters,
  pageSize = 25,
  statusField = "status",
  pendingStatus = "pending",
  approvedStatus = "approved",
  rejectedStatus = "rejected",
  changesRequestedStatus = "changes_requested",
  titleField = "title",
  descriptionField = "description",
  requesterField = "requester_user_id",
  ownerField = "owner_user_id",
  amountField,
  dueAtField = "due_at",
  createdAtField = "created_at",
  noteField = "decision_note",
  actionMode,
  actionFunctionName,
  approveFunctionName,
  rejectFunctionName,
  requestChangesFunctionName,
  buildActionInput,
  renderSummary,
  renderDetail,
  onActionSuccess,
  onRecordOpen,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  description,
  className,
}: LemmaApprovalQueueProps) {
  const defaultFilters = React.useMemo<RecordFilter[]>(
    () => [{ field: statusField, op: "eq", value: pendingStatus }],
    [pendingStatus, statusField],
  )
  const recordsState = useRecords({
    client,
    podId,
    tableName,
    enabled,
    filters: filters ?? defaultFilters,
    sortBy: dueAtField || createdAtField,
    order: "asc",
    limit: pageSize,
  })
  const scopedClient = React.useMemo(() => (podId ? client.withPod(podId) : client), [client, podId])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [note, setNote] = React.useState("")
  const [submittingAction, setSubmittingAction] = React.useState<LemmaApprovalAction | null>(null)
  const selectedRecord = React.useMemo(() => {
    return recordsState.records.find((record) => String(record.id ?? "") === selectedId) ?? recordsState.records[0] ?? null
  }, [recordsState.records, selectedId])

  React.useEffect(() => {
    if (selectedRecord) {
      setSelectedId(String(selectedRecord.id ?? ""))
      return
    }
    setSelectedId(null)
  }, [selectedRecord])

  const runAction = React.useCallback(async (action: LemmaApprovalAction) => {
    if (!selectedRecord || selectedRecord.id == null) return
    const nextStatus =
      action === "approve"
        ? approvedStatus
        : action === "reject"
          ? rejectedStatus
          : changesRequestedStatus
    const context: LemmaApprovalActionContext = {
      record: selectedRecord,
      action,
      nextStatus,
      note: note.trim(),
    }
    const mode = actionMode ?? (actionFunctionName || approveFunctionName || rejectFunctionName || requestChangesFunctionName ? "function" : "direct")
    const recordId = String(selectedRecord.id)

    setSubmittingAction(action)
    try {
      if (mode === "function") {
        const functionName =
          action === "approve"
            ? approveFunctionName ?? actionFunctionName
            : action === "reject"
              ? rejectFunctionName ?? actionFunctionName
              : requestChangesFunctionName ?? actionFunctionName
        if (!functionName) {
          throw new Error("Set an approval function name or use direct mode.")
        }
        const input = buildActionInput?.(context) ?? {
          id: recordId,
          record_id: recordId,
          action,
          status: nextStatus,
          note: context.note,
          record: selectedRecord,
        }
        await scopedClient.functions.runs.create(functionName, { input })
      } else {
        await scopedClient.records.update(tableName, recordId, {
          [statusField]: nextStatus,
          ...(context.note ? { [noteField]: context.note } : {}),
        })
      }
      onActionSuccess?.(context)
      setNote("")
      await recordsState.refresh()
    } finally {
      setSubmittingAction(null)
    }
  }, [
    actionFunctionName,
    actionMode,
    approveFunctionName,
    approvedStatus,
    buildActionInput,
    changesRequestedStatus,
    note,
    noteField,
    onActionSuccess,
    recordsState,
    rejectFunctionName,
    rejectedStatus,
    requestChangesFunctionName,
    scopedClient,
    selectedRecord,
    statusField,
    tableName,
  ])

  const isLoading = recordsState.isLoading
  const isSubmitting = submittingAction != null

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-approval-queue grid h-full min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]", gapClassName(density), className)}
    >
      <Card className={cn("min-h-0 overflow-hidden", cardClassName(appearance, radius))}>
        <CardHeader className={headerPaddingClassName(density)}>
          <CardTitle>{title ?? "Approvals"}</CardTitle>
          <CardDescription>{description ?? "Review queued decisions before they move forward."}</CardDescription>
          <CardAction>
            <Button variant="ghost" size="icon-sm" onClick={() => void recordsState.refresh()} disabled={isLoading}>
              <RefreshCw className={cn(isLoading ? "animate-spin" : undefined)} />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className={cn("min-h-0 overflow-auto", contentPaddingClassName(density))}>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          ) : recordsState.error ? (
            <StateMessage
              icon={AlertCircle}
              title="Approvals could not be loaded"
              description={recordsState.error.message}
              radius={radius}
            />
          ) : recordsState.records.length === 0 ? (
            <StateMessage
              icon={CheckCircle2}
              title="Nothing waiting"
              description="No approval records match this queue."
              radius={radius}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {recordsState.records.map((record) => {
                const recordId = String(record.id ?? "")
                const isSelected = selectedRecord === record
                return (
                  <button
                    key={recordId || stableRecordKey(record)}
                    type="button"
                    className={cn(
                      "w-full border p-3 text-left transition-colors",
                      radiusClassName(radius, "surface"),
                      isSelected ? "border-primary/40 bg-primary/5" : "border-border/50 bg-card hover:bg-muted/35",
                    )}
                    onClick={() => setSelectedId(recordId)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{recordTitle(record, titleField)}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{recordDescription(record, descriptionField)}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{String(record[statusField] ?? pendingStatus)}</Badge>
                    </div>
                    {renderSummary ? (
                      <div className="mt-3">{renderSummary(record)}</div>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {fieldChip("Requested", record[requesterField])}
                        {fieldChip("Owner", record[ownerField])}
                        {amountField ? fieldChip("Amount", record[amountField]) : null}
                        {fieldChip("Due", formatDate(record[dueAtField]))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={cn("min-h-0 overflow-hidden", cardClassName(appearance, radius))}>
        {selectedRecord ? (
          <>
            <CardHeader className={headerPaddingClassName(density)}>
              <CardTitle>{recordTitle(selectedRecord, titleField)}</CardTitle>
              <CardDescription>{recordDescription(selectedRecord, descriptionField)}</CardDescription>
              <CardAction>
                <Badge variant="outline">{String(selectedRecord[statusField] ?? pendingStatus)}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className={cn("flex min-h-0 flex-col overflow-auto", contentPaddingClassName(density), gapClassName(density))}>
              {renderDetail ? (
                renderDetail(selectedRecord)
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <DetailField label="Requested by" value={selectedRecord[requesterField]} />
                  <DetailField label="Owner" value={selectedRecord[ownerField]} />
                  {amountField ? <DetailField label="Amount" value={selectedRecord[amountField]} /> : null}
                  <DetailField label="Due" value={formatDate(selectedRecord[dueAtField])} />
                  <DetailField label="Created" value={formatDate(selectedRecord[createdAtField])} />
                </div>
              )}

              <Separator />

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground" htmlFor="approval-note">
                  Decision note
                </label>
                <Textarea
                  id="approval-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add context for the audit trail..."
                  rows={density === "compact" ? 3 : 4}
                  className={radiusClassName(radius, "control")}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" onClick={() => void runAction("approve")} disabled={isSubmitting}>
                  <CheckCircle2 data-icon="inline-start" />
                  {submittingAction === "approve" ? "Approving" : "Approve"}
                </Button>
                <Button type="button" variant="outline" onClick={() => void runAction("request_changes")} disabled={isSubmitting}>
                  <MessageSquareText data-icon="inline-start" />
                  Changes
                </Button>
                <Button type="button" variant="destructive" onClick={() => void runAction("reject")} disabled={isSubmitting}>
                  <ThumbsDown data-icon="inline-start" />
                  Reject
                </Button>
                {onRecordOpen ? (
                  <Button type="button" variant="ghost" onClick={() => onRecordOpen(selectedRecord)}>
                    Open record
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className={cn("flex h-full items-center justify-center", contentPaddingClassName(density))}>
            <StateMessage
              icon={Clock3}
              title="Select an approval"
              description="Pick a queued request to review the context and decide."
              radius={radius}
            />
          </CardContent>
        )}
      </Card>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/25 p-3">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm text-foreground">{displayValue(value)}</p>
    </div>
  )
}

function StateMessage({
  icon: Icon,
  title,
  description,
  radius,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: React.ReactNode
  description: React.ReactNode
  radius: LemmaApprovalRadius
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
      <span className={cn("flex size-11 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground", radiusClassName(radius, "pill"))}>
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function fieldChip(label: string, value: unknown) {
  if (value == null || value === "") return null
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-border/50 bg-muted/35 px-2 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium text-foreground">{displayValue(value)}</span>
    </span>
  )
}

function recordTitle(record: Record<string, unknown>, field: string) {
  return displayValue(record[field] ?? record.name ?? record.subject ?? record.id ?? "Approval request")
}

function recordDescription(record: Record<string, unknown>, field: string) {
  return displayValue(record[field] ?? record.summary ?? record.reason ?? "Review the generated recommendation and choose the next step.")
}

function displayValue(value: unknown): string {
  if (value == null || value === "") return "Not set"
  if (typeof value === "number") return value.toLocaleString()
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (Array.isArray(value)) return value.map(displayValue).join(", ")
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function formatDate(value: unknown) {
  if (!value) return "Not set"
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return displayValue(value)
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date)
}

function stableRecordKey(record: Record<string, unknown>) {
  return JSON.stringify(record).slice(0, 80)
}

function cardClassName(appearance: LemmaApprovalAppearance, radius: LemmaApprovalRadius) {
  const radiusClass = radiusClassName(radius, "surface")
  if (appearance === "minimal" || appearance === "borderless") return cn(radiusClass, "border-0 bg-transparent shadow-none ring-0")
  if (appearance === "contained") return cn(radiusClass, "border-border/70 shadow-sm")
  return cn(radiusClass, "border-border/50")
}

function headerPaddingClassName(density: LemmaApprovalDensity) {
  if (density === "compact") return "p-3"
  if (density === "spacious") return "p-6"
  return "p-4"
}

function contentPaddingClassName(density: LemmaApprovalDensity) {
  if (density === "compact") return "p-3 pt-0"
  if (density === "spacious") return "p-6 pt-0"
  return "p-4 pt-0"
}

function gapClassName(density: LemmaApprovalDensity) {
  if (density === "compact") return "gap-2"
  if (density === "spacious") return "gap-5"
  return "gap-3"
}

function radiusClassName(radius: LemmaApprovalRadius, target: "surface" | "control" | "pill") {
  if (radius === "none") return "rounded-none"
  if (radius === "sm") return target === "surface" ? "rounded-md" : "rounded-sm"
  if (radius === "md") return target === "surface" ? "rounded-lg" : "rounded-md"
  if (radius === "xl") return target === "pill" ? "rounded-full" : target === "control" ? "rounded-xl" : "rounded-2xl"
  return target === "pill" ? "rounded-full" : target === "control" ? "rounded-lg" : "rounded-xl"
}
