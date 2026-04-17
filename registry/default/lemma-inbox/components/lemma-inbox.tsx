"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
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
import { useMembers, useRecords } from "lemma-sdk/react"
import type { LemmaClient, RecordFilter } from "lemma-sdk"
import { cn } from "@/lib/utils"
import {
  inboxRadiusClassName,
  type LemmaInboxAppearance,
  type LemmaInboxDensity,
  type LemmaInboxRadius,
} from "./inbox-style-utils"
import { enumPillClasses, type EnumColorMap } from "./inbox-enum-utils"

export interface QuickAction {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: "default" | "outline" | "destructive" | "ghost"
  functionName?: string
  nextStatus?: string
  buildInput?: (record: Record<string, unknown>) => Record<string, unknown>
}

export interface QueueFilter {
  id: string
  label: string
  filters: RecordFilter[]
}

export interface LemmaInboxProps {
  client: LemmaClient
  podId?: string
  tableName: string
  enabled?: boolean

  statusField?: string
  pendingStatus?: string
  resolvedStatus?: string
  titleField?: string
  descriptionField?: string
  assigneeField?: string
  priorityField?: string
  categoryField?: string
  createdAtField?: string
  updatedAtField?: string

  queueFilters?: QueueFilter[]
  quickActions?: QuickAction[]
  actionMode?: "direct" | "function"
  groupByField?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"

  renderSummary?: (record: Record<string, unknown>) => React.ReactNode
  renderDetail?: (record: Record<string, unknown>) => React.ReactNode
  onRecordOpen?: (record: Record<string, unknown>) => void
  enumColorMap?: EnumColorMap

  appearance?: LemmaInboxAppearance
  density?: LemmaInboxDensity
  radius?: LemmaInboxRadius
  title?: React.ReactNode
  className?: string
}

export function LemmaInbox({
  client,
  podId,
  tableName,
  enabled = true,
  statusField = "status",
  pendingStatus = "open",
  resolvedStatus = "resolved",
  titleField = "title",
  descriptionField = "description",
  assigneeField = "assignee_user_id",
  priorityField,
  categoryField = "category",
  createdAtField = "created_at",
  updatedAtField = "updated_at",
  queueFilters,
  quickActions,
  actionMode,
  groupByField,
  sortBy: sortByProp,
  sortOrder = "desc",
  renderSummary,
  renderDetail,
  onRecordOpen,
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  className,
}: LemmaInboxProps) {
  const [activeFilterId, setActiveFilterId] = React.useState<string>(
    queueFilters?.[0]?.id ?? "__default",
  )
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [submittingLabel, setSubmittingLabel] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")

  const scopedClient = React.useMemo(
    () => (podId ? client.withPod(podId) : client),
    [client, podId],
  )

  const activeFilters = React.useMemo<RecordFilter[]>(() => {
    if (!queueFilters || queueFilters.length === 0) {
      return [{ field: statusField, op: "eq", value: pendingStatus }]
    }
    const active = queueFilters.find((f) => f.id === activeFilterId)
    return active?.filters ?? []
  }, [activeFilterId, pendingStatus, queueFilters, statusField])

  const recordsState = useRecords({
    client,
    podId,
    tableName,
    enabled,
    filters: activeFilters,
    sortBy: sortByProp ?? updatedAtField,
    order: sortOrder,
    limit: 50,
  })

  const membersState = useMembers({
    client,
    podId,
    enabled: enabled && Boolean(assigneeField),
  })

  const selectedRecord = React.useMemo(() => {
    return (
      recordsState.records.find(
        (r) => String(r.id ?? "") === selectedId,
      ) ??
      recordsState.records[0] ??
      null
    )
  }, [recordsState.records, selectedId])

  React.useEffect(() => {
    if (selectedRecord) {
      setSelectedId(String(selectedRecord.id ?? ""))
      return
    }
    setSelectedId(null)
  }, [selectedRecord])

  const statusOptions = React.useMemo(() => {
    const set = new Set<string>()
    for (const r of recordsState.records) {
      const v = String(r[statusField] ?? "")
      if (v) set.add(v)
    }
    return Array.from(set)
  }, [recordsState.records, statusField])

  const memberNameMap = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const m of membersState.members) {
      map.set(m.user_id, m.user_name ?? m.user_email ?? m.user_id)
    }
    return map
  }, [membersState.members])

  const resolveAssignee = React.useCallback(
    (record: Record<string, unknown>) => {
      if (!assigneeField) return null
      const value = record[assigneeField]
      if (value == null || value === "") return null
      const id = String(value)
      return memberNameMap.get(id) ?? id
    },
    [assigneeField, memberNameMap],
  )

  const filteredRecords = React.useMemo(() => {
    if (!search.trim()) return recordsState.records
    const q = search.toLowerCase()
    return recordsState.records.filter((r) =>
      String(r[titleField] ?? "")
        .toLowerCase()
        .includes(q),
    )
  }, [recordsState.records, search, titleField])

  const groupedRecords = React.useMemo(() => {
    if (!groupByField) return null
    const groups = new Map<string, Record<string, unknown>[]>()
    for (const record of filteredRecords) {
      const key = String(record[groupByField] ?? "Ungrouped")
      const list = groups.get(key) ?? []
      list.push(record)
      groups.set(key, list)
    }
    return groups
  }, [groupByField, filteredRecords])

  const runQuickAction = React.useCallback(
    async (action: QuickAction) => {
      if (!selectedRecord || selectedRecord.id == null) return
      const recordId = String(selectedRecord.id)
      const mode =
        actionMode ?? (action.functionName ? "function" : "direct")

      setSubmittingLabel(action.label)
      try {
        if (mode === "function" && action.functionName) {
          const input = action.buildInput?.(selectedRecord) ?? {
            id: recordId,
            record_id: recordId,
            ...(action.nextStatus
              ? { [statusField]: action.nextStatus }
              : {}),
            record: selectedRecord,
          }
          await scopedClient.functions.runs.create(action.functionName, {
            input,
          })
        } else {
          const update: Record<string, unknown> = {}
          if (action.nextStatus) update[statusField] = action.nextStatus
          const extra = action.buildInput?.(selectedRecord)
          if (extra) Object.assign(update, extra)
          await scopedClient.records.update(tableName, recordId, update)
        }
        await recordsState.refresh()
      } finally {
        setSubmittingLabel(null)
      }
    },
    [
      actionMode,
      recordsState,
      scopedClient,
      selectedRecord,
      statusField,
      tableName,
    ],
  )

  const isLoading = recordsState.isLoading
  const isSubmitting = submittingLabel != null

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn(
        "lemma-inbox grid h-full min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]",
        gapClassName(density),
        className,
      )}
    >
      <Card
        className={cn(
          "min-h-0 overflow-hidden",
          cardClassName(appearance, radius),
        )}
      >
        <CardHeader className={headerPaddingClassName(density)}>
          <CardTitle>{title ?? "Inbox"}</CardTitle>
          <CardDescription>
            Triaged work queue with quick actions.
          </CardDescription>
          <CardAction>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void recordsState.refresh()}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn(isLoading ? "animate-spin" : undefined)}
              />
            </Button>
          </CardAction>
        </CardHeader>

        {queueFilters && queueFilters.length > 0 ? (
          <div
            className={cn(
              "flex items-center gap-2 border-b border-border/40",
              contentPaddingClassName(density),
              "pb-3",
            )}
          >
            <Tabs
              value={activeFilterId}
              onValueChange={setActiveFilterId}
            >
              <TabsList className="h-7">
                {queueFilters.map((filter) => (
                  <TabsTrigger
                    key={filter.id}
                    value={filter.id}
                    className="h-5 px-2.5 text-xs"
                  >
                    {filter.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        ) : null}

        <CardContent
          className={cn("min-h-0 overflow-auto", contentPaddingClassName(density))}
        >
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter items..."
              className={cn(
                "h-9 pl-8",
                inboxRadiusClassName(radius, "control"),
              )}
            />
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : recordsState.error ? (
            <StateMessage
              icon={AlertCircle}
              title="Queue could not be loaded"
              description={recordsState.error.message}
              radius={radius}
            />
          ) : filteredRecords.length === 0 ? (
            <StateMessage
              icon={search.trim() ? Search : CheckCircle2}
              title={search.trim() ? "No matches" : "Nothing in queue"}
              description={
                search.trim()
                  ? "No items match your search."
                  : "No items match the current filter."
              }
              radius={radius}
            />
          ) : groupedRecords ? (
            <div className="flex flex-col gap-4">
              {Array.from(groupedRecords.entries()).map(
                ([group, records]) => (
                  <div key={group} className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      {group}
                    </p>
                    {records.map((record) => (
                      <QueueItem
                        key={String(
                          record.id ?? stableRecordKey(record),
                        )}
                        record={record}
                        selected={selectedRecord === record}
                        statusField={statusField}
                        titleField={titleField}
                        priorityField={priorityField}
                        assigneeField={assigneeField}
                        createdAtField={createdAtField}
                        statusOptions={statusOptions}
                        enumColorMap={enumColorMap}
                        resolveAssignee={resolveAssignee}
                        renderSummary={renderSummary}
                        onClick={() =>
                          setSelectedId(String(record.id ?? ""))
                        }
                        radius={radius}
                      />
                    ))}
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredRecords.map((record) => (
                <QueueItem
                  key={String(record.id ?? stableRecordKey(record))}
                  record={record}
                  selected={selectedRecord === record}
                  statusField={statusField}
                  titleField={titleField}
                  priorityField={priorityField}
                  assigneeField={assigneeField}
                  createdAtField={createdAtField}
                  statusOptions={statusOptions}
                  enumColorMap={enumColorMap}
                  resolveAssignee={resolveAssignee}
                  renderSummary={renderSummary}
                  onClick={() =>
                    setSelectedId(String(record.id ?? ""))
                  }
                  radius={radius}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card
        className={cn(
          "min-h-0 overflow-hidden",
          cardClassName(appearance, radius),
        )}
      >
        {selectedRecord ? (
          renderDetail ? (
            <CardContent
              className={cn(
                "min-h-0 overflow-auto",
                contentPaddingClassName(density),
              )}
            >
              {renderDetail(selectedRecord)}
            </CardContent>
          ) : (
            <>
              <CardHeader className={headerPaddingClassName(density)}>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={enumPillClasses(
                      String(
                        selectedRecord[statusField] ?? pendingStatus,
                      ),
                      statusOptions,
                      enumColorMap,
                    )}
                  >
                    {String(
                      selectedRecord[statusField] ?? pendingStatus,
                    )}
                  </span>
                  {priorityField &&
                  selectedRecord[priorityField] != null ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <PriorityDot
                        value={selectedRecord[priorityField]}
                      />
                      {String(selectedRecord[priorityField])}
                    </span>
                  ) : null}
                </div>
                <CardTitle className="mt-2">
                  {recordTitle(selectedRecord, titleField)}
                </CardTitle>
                <CardDescription>
                  {recordDescription(selectedRecord, descriptionField)}
                </CardDescription>
              </CardHeader>
              <CardContent
                className={cn(
                  "flex min-h-0 flex-col overflow-auto",
                  contentPaddingClassName(density),
                  gapClassName(density),
                )}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  {assigneeField ? (
                    <DetailField
                      label="Assignee"
                      value={
                        resolveAssignee(selectedRecord) ?? "Unassigned"
                      }
                    />
                  ) : null}
                  {priorityField ? (
                    <DetailField
                      label="Priority"
                      value={selectedRecord[priorityField]}
                    />
                  ) : null}
                  {categoryField ? (
                    <DetailField
                      label="Category"
                      value={selectedRecord[categoryField]}
                    />
                  ) : null}
                  <DetailField
                    label="Created"
                    value={formatRelativeDate(
                      selectedRecord[createdAtField],
                    )}
                  />
                  <DetailField
                    label="Updated"
                    value={formatRelativeDate(
                      selectedRecord[updatedAtField],
                    )}
                  />
                </div>

                <Separator />

                {quickActions && quickActions.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {quickActions.map((action) => {
                      const Icon = action.icon
                      const isActing =
                        isSubmitting &&
                        submittingLabel === action.label
                      return (
                        <Button
                          key={action.label}
                          type="button"
                          variant={action.variant ?? "default"}
                          onClick={() => void runQuickAction(action)}
                          disabled={isSubmitting}
                        >
                          {Icon ? (
                            <Icon data-icon="inline-start" />
                          ) : null}
                          {isActing ? "Working\u2026" : action.label}
                        </Button>
                      )
                    })}
                    {onRecordOpen ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onRecordOpen(selectedRecord)}
                      >
                        Open record
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </>
          )
        ) : (
          <CardContent
            className={cn(
              "flex h-full items-center justify-center",
              contentPaddingClassName(density),
            )}
          >
            <StateMessage
              icon={Clock3}
              title="Select an item"
              description="Pick a queue item to see details and take action."
              radius={radius}
            />
          </CardContent>
        )}
      </Card>
    </div>
  )
}

function QueueItem({
  record,
  selected,
  statusField,
  titleField,
  priorityField,
  assigneeField,
  createdAtField,
  statusOptions,
  enumColorMap,
  resolveAssignee,
  renderSummary,
  onClick,
  radius,
}: {
  record: Record<string, unknown>
  selected: boolean
  statusField: string
  titleField: string
  priorityField?: string
  assigneeField?: string
  createdAtField: string
  statusOptions: string[]
  enumColorMap?: EnumColorMap
  resolveAssignee: (
    record: Record<string, unknown>,
  ) => string | null
  renderSummary?: (
    record: Record<string, unknown>,
  ) => React.ReactNode
  onClick: () => void
  radius: LemmaInboxRadius
}) {
  const status = String(record[statusField] ?? "")
  const assignee = resolveAssignee(record)

  return (
    <button
      type="button"
      className={cn(
        "w-full border p-3 text-left transition-colors",
        inboxRadiusClassName(radius, "surface"),
        selected
          ? "border-primary/40 bg-primary/5"
          : "border-border/50 bg-card hover:bg-muted/35",
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {priorityField && record[priorityField] != null ? (
              <PriorityDot value={record[priorityField]} />
            ) : null}
            <p className="truncate text-sm font-medium text-foreground">
              {recordTitle(record, titleField)}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            {assigneeField ? (
              <>
                <span className="truncate">
                  {assignee ?? "Unassigned"}
                </span>
                <span>·</span>
              </>
            ) : null}
            <span>
              {formatRelativeDate(record[createdAtField])}
            </span>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {status || "—"}
        </Badge>
      </div>
      {renderSummary ? (
        <div className="mt-3">{renderSummary(record)}</div>
      ) : null}
    </button>
  )
}

function PriorityDot({ value }: { value: unknown }) {
  const v = String(value ?? "").toLowerCase()
  let color = "bg-muted-foreground"
  if (v === "urgent" || v === "critical" || v === "p0")
    color = "bg-red-500"
  else if (v === "high" || v === "p1") color = "bg-orange-500"
  else if (
    v === "medium" ||
    v === "normal" ||
    v === "p2"
  )
    color = "bg-amber-500"
  else if (v === "low" || v === "p3" || v === "p4")
    color = "bg-blue-400"
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", color)}
    />
  )
}

function DetailField({
  label,
  value,
}: {
  label: string
  value: unknown
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/25 p-3">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm text-foreground">
        {displayValue(value)}
      </p>
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
  radius: LemmaInboxRadius
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
      <span
        className={cn(
          "flex size-11 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground",
          inboxRadiusClassName(radius, "pill"),
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

function recordTitle(record: Record<string, unknown>, field: string) {
  return displayValue(
    record[field] ?? record.name ?? record.subject ?? record.id ?? "Item",
  )
}

function recordDescription(
  record: Record<string, unknown>,
  field: string,
) {
  return displayValue(
    record[field] ??
      record.summary ??
      record.reason ??
      "No description provided.",
  )
}

function displayValue(value: unknown): string {
  if (value == null || value === "") return "Not set"
  if (typeof value === "number") return value.toLocaleString()
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (Array.isArray(value)) return value.map(displayValue).join(", ")
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function formatRelativeDate(value: unknown): string {
  if (!value) return "Not set"
  const date =
    value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return displayValue(value)
  const diff = Date.now() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date)
}

function stableRecordKey(record: Record<string, unknown>) {
  return JSON.stringify(record).slice(0, 80)
}

function cardClassName(
  appearance: LemmaInboxAppearance,
  radius: LemmaInboxRadius,
) {
  const radiusClass = inboxRadiusClassName(radius, "surface")
  if (appearance === "minimal" || appearance === "borderless")
    return cn(
      radiusClass,
      "border-0 bg-transparent shadow-none ring-0",
    )
  if (appearance === "contained")
    return cn(radiusClass, "border-border/70 shadow-sm")
  return cn(radiusClass, "border-border/50")
}

function headerPaddingClassName(density: LemmaInboxDensity) {
  if (density === "compact") return "p-3"
  if (density === "spacious") return "p-6"
  return "p-4"
}

function contentPaddingClassName(density: LemmaInboxDensity) {
  if (density === "compact") return "p-3 pt-0"
  if (density === "spacious") return "p-6 pt-0"
  return "p-4 pt-0"
}

function gapClassName(density: LemmaInboxDensity) {
  if (density === "compact") return "gap-2"
  if (density === "spacious") return "gap-5"
  return "gap-3"
}
