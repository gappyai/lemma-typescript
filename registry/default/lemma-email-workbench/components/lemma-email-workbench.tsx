"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  MailCheck,
  MailPlus,
  RefreshCw,
  SendHorizontal,
  Sparkles,
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
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useRecords } from "lemma-sdk/react"
import type { LemmaClient, RecordFilter } from "lemma-sdk"
import { cn } from "@/lib/utils"

export type LemmaEmailWorkbenchAppearance = "default" | "minimal" | "borderless" | "contained"
export type LemmaEmailWorkbenchDensity = "compact" | "comfortable" | "spacious"
export type LemmaEmailWorkbenchRadius = "none" | "sm" | "md" | "lg" | "xl"
export type LemmaEmailAction = "approve" | "send" | "approve_send"
export type LemmaEmailActionMode = "direct" | "function"

export interface LemmaEmailActionContext {
  draft: Record<string, unknown>
  thread: Record<string, unknown> | null
  action: LemmaEmailAction
  fields: {
    to: string
    cc: string
    bcc: string
    subject: string
    body: string
  }
}

export interface LemmaEmailWorkbenchProps {
  client: LemmaClient
  podId?: string
  draftsTableName?: string
  threadsTableName?: string
  enabled?: boolean
  draftFilters?: RecordFilter[]
  pageSize?: number
  statusField?: string
  pendingStatus?: string
  approvedStatus?: string
  sentStatus?: string
  toField?: string
  ccField?: string
  bccField?: string
  subjectField?: string
  bodyField?: string
  summaryField?: string
  reasonField?: string
  aiConfidenceField?: string
  threadIdField?: string
  threadSubjectField?: string
  threadFromField?: string
  threadSnippetField?: string
  threadLastMessageAtField?: string
  actionMode?: LemmaEmailActionMode
  approveFunctionName?: string
  sendFunctionName?: string
  approveAndSendFunctionName?: string
  buildActionInput?: (context: LemmaEmailActionContext) => Record<string, unknown>
  renderDraftSummary?: (draft: Record<string, unknown>) => React.ReactNode
  renderThread?: (thread: Record<string, unknown> | null, draft: Record<string, unknown>) => React.ReactNode
  onActionSuccess?: (context: LemmaEmailActionContext) => void
  appearance?: LemmaEmailWorkbenchAppearance
  density?: LemmaEmailWorkbenchDensity
  radius?: LemmaEmailWorkbenchRadius
  title?: React.ReactNode
  description?: React.ReactNode
  className?: string
}

export function LemmaEmailWorkbench({
  client,
  podId,
  draftsTableName = "email_drafts",
  threadsTableName = "email_threads",
  enabled = true,
  draftFilters,
  pageSize = 20,
  statusField = "status",
  pendingStatus = "pending_approval",
  approvedStatus = "approved",
  sentStatus = "sent",
  toField = "to_email",
  ccField = "cc",
  bccField = "bcc",
  subjectField = "subject",
  bodyField = "body",
  summaryField = "ai_summary",
  reasonField = "ai_reason",
  aiConfidenceField = "ai_confidence",
  threadIdField = "thread_id",
  threadSubjectField = "subject",
  threadFromField = "from_display",
  threadSnippetField = "snippet",
  threadLastMessageAtField = "last_message_at",
  actionMode,
  approveFunctionName,
  sendFunctionName,
  approveAndSendFunctionName,
  buildActionInput,
  renderDraftSummary,
  renderThread,
  onActionSuccess,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  description,
  className,
}: LemmaEmailWorkbenchProps) {
  const defaultFilters = React.useMemo<RecordFilter[]>(
    () => [{ field: statusField, op: "eq", value: pendingStatus }],
    [pendingStatus, statusField],
  )
  const draftsState = useRecords({
    client,
    podId,
    tableName: draftsTableName,
    enabled,
    filters: draftFilters ?? defaultFilters,
    sortBy: "updated_at",
    order: "desc",
    limit: pageSize,
  })
  const scopedClient = React.useMemo(() => (podId ? client.withPod(podId) : client), [client, podId])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [mode, setMode] = React.useState<"compose" | "preview">("compose")
  const [fields, setFields] = React.useState({ to: "", cc: "", bcc: "", subject: "", body: "" })
  const [submittingAction, setSubmittingAction] = React.useState<LemmaEmailAction | null>(null)
  const selectedDraft = React.useMemo(() => {
    return draftsState.records.find((draft) => String(draft.id ?? "") === selectedId) ?? draftsState.records[0] ?? null
  }, [draftsState.records, selectedId])
  const threadId = selectedDraft ? valueString(selectedDraft[threadIdField]) : ""
  const threadState = useRecords({
    client,
    podId,
    tableName: threadsTableName,
    enabled: enabled && Boolean(selectedDraft && threadId),
    filters: threadId ? [{ field: "id", op: "eq", value: threadId }] : [],
    limit: 1,
  })
  const selectedThread = threadState.records[0] ?? null

  React.useEffect(() => {
    if (selectedDraft) {
      setSelectedId(String(selectedDraft.id ?? ""))
      setFields({
        to: valueString(selectedDraft[toField]),
        cc: valueString(selectedDraft[ccField]),
        bcc: valueString(selectedDraft[bccField]),
        subject: valueString(selectedDraft[subjectField]),
        body: valueString(selectedDraft[bodyField]),
      })
      return
    }
    setSelectedId(null)
    setFields({ to: "", cc: "", bcc: "", subject: "", body: "" })
  }, [bccField, bodyField, ccField, selectedDraft, subjectField, toField])

  const runAction = React.useCallback(async (action: LemmaEmailAction) => {
    if (!selectedDraft || selectedDraft.id == null) return
    const context: LemmaEmailActionContext = {
      draft: selectedDraft,
      thread: selectedThread,
      action,
      fields,
    }
    const functionName =
      action === "approve"
        ? approveFunctionName
        : action === "send"
          ? sendFunctionName
          : approveAndSendFunctionName ?? sendFunctionName ?? approveFunctionName
    const modeForAction = actionMode ?? (functionName ? "function" : "direct")
    const draftId = String(selectedDraft.id)
    const nextStatus = action === "approve" ? approvedStatus : sentStatus

    setSubmittingAction(action)
    try {
      if (modeForAction === "function") {
        if (!functionName) throw new Error("Set an email action function name or use direct mode.")
        const input = buildActionInput?.(context) ?? {
          id: draftId,
          record_id: draftId,
          draft_id: draftId,
          action,
          status: nextStatus,
          ...fields,
          draft: selectedDraft,
          thread: selectedThread,
        }
        await scopedClient.functions.runs.create(functionName, { input })
      } else {
        await scopedClient.records.update(draftsTableName, draftId, {
          [statusField]: nextStatus,
          [toField]: fields.to,
          [ccField]: fields.cc,
          [bccField]: fields.bcc,
          [subjectField]: fields.subject,
          [bodyField]: fields.body,
        })
      }
      onActionSuccess?.(context)
      await draftsState.refresh()
    } finally {
      setSubmittingAction(null)
    }
  }, [
    actionMode,
    approveAndSendFunctionName,
    approveFunctionName,
    approvedStatus,
    bccField,
    bodyField,
    buildActionInput,
    ccField,
    draftsState,
    draftsTableName,
    fields,
    onActionSuccess,
    scopedClient,
    selectedDraft,
    selectedThread,
    sendFunctionName,
    sentStatus,
    statusField,
    subjectField,
    toField,
  ])

  const isLoading = draftsState.isLoading
  const isSubmitting = submittingAction != null

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-email-workbench grid h-full min-h-0 grid-cols-1 overflow-hidden xl:grid-cols-[22rem_minmax(0,1fr)]", gapClassName(density), className)}
    >
      <Card className={cn("min-h-0 overflow-hidden", cardClassName(appearance, radius))}>
        <CardHeader className={headerPaddingClassName(density)}>
          <CardTitle>{title ?? "AI email drafts"}</CardTitle>
          <CardDescription>{description ?? "Review generated replies before they reach customers."}</CardDescription>
          <CardAction>
            <Button variant="ghost" size="icon-sm" onClick={() => void draftsState.refresh()} disabled={isLoading}>
              <RefreshCw className={cn(isLoading ? "animate-spin" : undefined)} />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className={cn("min-h-0 overflow-auto", contentPaddingClassName(density))}>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
          ) : draftsState.error ? (
            <StateMessage icon={AlertCircle} title="Drafts could not be loaded" description={draftsState.error.message} radius={radius} />
          ) : draftsState.records.length === 0 ? (
            <StateMessage icon={MailCheck} title="No drafts waiting" description="There are no AI-written email drafts in this queue." radius={radius} />
          ) : (
            <div className="flex flex-col gap-2">
              {draftsState.records.map((draft) => {
                const draftId = String(draft.id ?? stableRecordKey(draft))
                const selected = selectedDraft === draft
                return (
                  <button
                    key={draftId}
                    type="button"
                    className={cn(
                      "w-full border p-3 text-left transition-colors",
                      radiusClassName(radius, "surface"),
                      selected ? "border-primary/40 bg-primary/5" : "border-border/50 bg-card hover:bg-muted/35",
                    )}
                    onClick={() => setSelectedId(String(draft.id ?? ""))}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{valueString(draft[subjectField]) || "Untitled draft"}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{valueString(draft[toField]) || "No recipient"}</p>
                      </div>
                      <Badge variant="secondary">{valueString(draft[statusField]) || pendingStatus}</Badge>
                    </div>
                    {renderDraftSummary ? (
                      <div className="mt-3">{renderDraftSummary(draft)}</div>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {draft[aiConfidenceField] != null ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/35 px-2 py-1">
                            <Sparkles className="size-3" />
                            {formatPercent(draft[aiConfidenceField])}
                          </span>
                        ) : null}
                        {valueString(draft[summaryField]) ? (
                          <span className="line-clamp-1 min-w-0 flex-1">{valueString(draft[summaryField])}</span>
                        ) : null}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className={cn("grid min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]", gapClassName(density))}>
        <Card className={cn("min-h-0 overflow-hidden", cardClassName(appearance, radius))}>
          <CardHeader className={headerPaddingClassName(density)}>
            <CardTitle>Thread context</CardTitle>
            <CardDescription>{selectedDraft ? "Recent customer context for this draft." : "Select a draft to view its thread."}</CardDescription>
          </CardHeader>
          <CardContent className={cn("min-h-0 overflow-auto", contentPaddingClassName(density))}>
            {selectedDraft ? (
              renderThread ? (
                renderThread(selectedThread, selectedDraft)
              ) : (
                <ThreadContext
                  draft={selectedDraft}
                  thread={selectedThread}
                  isLoading={threadState.isLoading}
                  threadSubjectField={threadSubjectField}
                  threadFromField={threadFromField}
                  threadSnippetField={threadSnippetField}
                  threadLastMessageAtField={threadLastMessageAtField}
                  reasonField={reasonField}
                  radius={radius}
                />
              )
            ) : (
              <StateMessage icon={Inbox} title="No draft selected" description="Pick a draft to see the thread and AI reasoning." radius={radius} />
            )}
          </CardContent>
        </Card>

        <Card className={cn("min-h-0 overflow-hidden", cardClassName(appearance, radius))}>
          {selectedDraft ? (
            <>
              <CardHeader className={headerPaddingClassName(density)}>
                <CardTitle>{fields.subject || "Email draft"}</CardTitle>
                <CardDescription>Approve the generated reply, edit it, or approve and send.</CardDescription>
                <CardAction>
                  <Tabs value={mode} onValueChange={(next) => setMode(next as "compose" | "preview")}>
                    <TabsList>
                      <TabsTrigger value="compose">Compose</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardAction>
              </CardHeader>
              <CardContent className={cn("flex min-h-0 flex-col overflow-auto", contentPaddingClassName(density), gapClassName(density))}>
                {mode === "compose" ? (
                  <div className="flex flex-col gap-3">
                    <FieldRow label="To">
                      <Input value={fields.to} onChange={(event) => setFields((current) => ({ ...current, to: event.target.value }))} className={radiusClassName(radius, "control")} />
                    </FieldRow>
                    <div className="grid gap-3 md:grid-cols-2">
                      <FieldRow label="Cc">
                        <Input value={fields.cc} onChange={(event) => setFields((current) => ({ ...current, cc: event.target.value }))} className={radiusClassName(radius, "control")} />
                      </FieldRow>
                      <FieldRow label="Bcc">
                        <Input value={fields.bcc} onChange={(event) => setFields((current) => ({ ...current, bcc: event.target.value }))} className={radiusClassName(radius, "control")} />
                      </FieldRow>
                    </div>
                    <FieldRow label="Subject">
                      <Input value={fields.subject} onChange={(event) => setFields((current) => ({ ...current, subject: event.target.value }))} className={radiusClassName(radius, "control")} />
                    </FieldRow>
                    <FieldRow label="Body">
                      <Textarea value={fields.body} onChange={(event) => setFields((current) => ({ ...current, body: event.target.value }))} rows={density === "compact" ? 12 : 16} className={cn("font-mono text-sm", radiusClassName(radius, "control"))} />
                    </FieldRow>
                  </div>
                ) : (
                  <div className={cn("border border-border/50 bg-card p-4", radiusClassName(radius, "surface"))}>
                    <div className="flex flex-col gap-1 text-sm">
                      <p><span className="text-muted-foreground">To:</span> {fields.to || "No recipient"}</p>
                      {fields.cc ? <p><span className="text-muted-foreground">Cc:</span> {fields.cc}</p> : null}
                      <p><span className="text-muted-foreground">Subject:</span> {fields.subject || "No subject"}</p>
                    </div>
                    <Separator className="my-4" />
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{fields.body || "No body."}</div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => void runAction("approve")} disabled={isSubmitting}>
                    <CheckCircle2 data-icon="inline-start" />
                    {submittingAction === "approve" ? "Approving" : "Approve"}
                  </Button>
                  <Button type="button" onClick={() => void runAction("approve_send")} disabled={isSubmitting || !fields.to || !fields.subject || !fields.body}>
                    <SendHorizontal data-icon="inline-start" />
                    {submittingAction === "approve_send" ? "Sending" : "Approve and send"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => void runAction("send")} disabled={isSubmitting || !fields.to || !fields.subject || !fields.body}>
                    <MailPlus data-icon="inline-start" />
                    Send only
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className={cn("flex h-full items-center justify-center", contentPaddingClassName(density))}>
              <StateMessage icon={MailCheck} title="Select a draft" description="Open an AI draft to compose, approve, or send." radius={radius} />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

function ThreadContext({
  draft,
  thread,
  isLoading,
  threadSubjectField,
  threadFromField,
  threadSnippetField,
  threadLastMessageAtField,
  reasonField,
  radius,
}: {
  draft: Record<string, unknown>
  thread: Record<string, unknown> | null
  isLoading: boolean
  threadSubjectField: string
  threadFromField: string
  threadSnippetField: string
  threadLastMessageAtField: string
  reasonField: string
  radius: LemmaEmailWorkbenchRadius
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("border border-border/50 bg-muted/25 p-3", radiusClassName(radius, "surface"))}>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Thread</p>
        <p className="mt-2 text-sm font-medium text-foreground">{valueString(thread?.[threadSubjectField]) || valueString(draft[threadSubjectField]) || "No thread subject"}</p>
        <p className="mt-1 text-xs text-muted-foreground">{valueString(thread?.[threadFromField]) || "Unknown sender"}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/85">{valueString(thread?.[threadSnippetField]) || "No snippet is available."}</p>
        <p className="mt-3 text-xs text-muted-foreground">{formatDate(thread?.[threadLastMessageAtField])}</p>
      </div>
      <div className={cn("border border-border/50 bg-muted/25 p-3", radiusClassName(radius, "surface"))}>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          <Sparkles className="size-3.5" />
          AI reasoning
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/85">{valueString(draft[reasonField]) || "No AI reasoning field is set for this draft."}</p>
      </div>
    </div>
  )
}

function FieldRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
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
  radius: LemmaEmailWorkbenchRadius
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

function formatPercent(value: unknown) {
  const number = Number(value)
  if (Number.isNaN(number)) return valueString(value)
  const normalized = number > 1 ? number : number * 100
  return `${Math.round(normalized)}% confidence`
}

function formatDate(value: unknown) {
  if (!value) return "No recent timestamp"
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return valueString(value)
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date)
}

function valueString(value: unknown): string {
  if (value == null || value === "") return ""
  if (Array.isArray(value)) return value.map(valueString).filter(Boolean).join(", ")
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function stableRecordKey(record: Record<string, unknown>) {
  return JSON.stringify(record).slice(0, 80)
}

function cardClassName(appearance: LemmaEmailWorkbenchAppearance, radius: LemmaEmailWorkbenchRadius) {
  const radiusClass = radiusClassName(radius, "surface")
  if (appearance === "minimal" || appearance === "borderless") return cn(radiusClass, "border-0 bg-transparent shadow-none ring-0")
  if (appearance === "contained") return cn(radiusClass, "border-border/70 shadow-sm")
  return cn(radiusClass, "border-border/50")
}

function headerPaddingClassName(density: LemmaEmailWorkbenchDensity) {
  if (density === "compact") return "p-3"
  if (density === "spacious") return "p-6"
  return "p-4"
}

function contentPaddingClassName(density: LemmaEmailWorkbenchDensity) {
  if (density === "compact") return "p-3 pt-0"
  if (density === "spacious") return "p-6 pt-0"
  return "p-4 pt-0"
}

function gapClassName(density: LemmaEmailWorkbenchDensity) {
  if (density === "compact") return "gap-2"
  if (density === "spacious") return "gap-5"
  return "gap-3"
}

function radiusClassName(radius: LemmaEmailWorkbenchRadius, target: "surface" | "control" | "pill") {
  if (radius === "none") return "rounded-none"
  if (radius === "sm") return target === "surface" ? "rounded-md" : "rounded-sm"
  if (radius === "md") return target === "surface" ? "rounded-lg" : "rounded-md"
  if (radius === "xl") return target === "pill" ? "rounded-full" : target === "control" ? "rounded-xl" : "rounded-2xl"
  return target === "pill" ? "rounded-full" : target === "control" ? "rounded-lg" : "rounded-xl"
}
