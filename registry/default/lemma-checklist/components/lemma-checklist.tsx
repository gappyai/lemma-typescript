"use client"

import * as React from "react"
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  ListChecks,
  Plus,
  RefreshCw,
  User,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useReferencingRecords, useUpdateRecord, useCreateRecord, useTable } from "lemma-sdk/react"
import type { LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { enumPillClasses, type EnumColorMap } from "./checklist-enum-utils"
import {
  checklistRadiusClassName,
  type LemmaChecklistAppearance,
  type LemmaChecklistDensity,
  type LemmaChecklistRadius,
} from "./checklist-style-utils"

export type { LemmaChecklistAppearance, LemmaChecklistDensity, LemmaChecklistRadius } from "./checklist-style-utils"
export type { EnumColorMap } from "./checklist-enum-utils"

export interface LemmaChecklistProps {
  client: LemmaClient
  podId?: string
  tableName: string
  foreignKey: string
  recordId: string
  enabled?: boolean

  titleField: string
  completedField: string
  requiredField?: string
  assigneeField?: string
  dueDateField?: string
  notesField?: string
  orderField?: string
  allowCreate?: boolean
  allowReorder?: boolean
  submitVia?: "direct" | "function"
  submitFunctionName?: string
  enumColorMap?: EnumColorMap

  appearance?: LemmaChecklistAppearance
  density?: LemmaChecklistDensity
  radius?: LemmaChecklistRadius
  title?: React.ReactNode
  className?: string
}

export function LemmaChecklist({
  client,
  podId,
  tableName,
  foreignKey,
  recordId,
  enabled = true,
  titleField = "title",
  completedField = "completed",
  requiredField,
  assigneeField,
  dueDateField,
  notesField,
  orderField,
  allowCreate = false,
  allowReorder = false,
  submitVia = "direct",
  submitFunctionName,
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  className,
}: LemmaChecklistProps) {
  const [newItemTitle, setNewItemTitle] = React.useState("")
  const [showAddInput, setShowAddInput] = React.useState(false)
  const [expandedNotes, setExpandedNotes] = React.useState<Set<string>>(new Set())
  const [togglingIds, setTogglingIds] = React.useState<Set<string>>(new Set())

  const itemsState = useReferencingRecords({
    client,
    podId,
    table: tableName,
    foreignKey,
    recordId,
    sortBy: orderField,
    order: "asc",
    limit: 200,
    enabled,
  })

  const updateRecord = useUpdateRecord({
    client,
    podId,
    tableName,
    updateVia: submitVia === "function" ? "function" : "direct",
    updateFunctionName: submitFunctionName,
    onSuccess: () => {
      itemsState.refresh()
    },
  })

  const createRecord = useCreateRecord({
    client,
    podId,
    tableName,
    enabled,
    onSuccess: () => {
      setNewItemTitle("")
      setShowAddInput(false)
      itemsState.refresh()
    },
  })

  const sortedItems = React.useMemo(() => {
    const items = [...itemsState.records]
    if (orderField) {
      items.sort((a, b) => {
        const aVal = a[orderField]
        const bVal = b[orderField]
        const aNum = typeof aVal === "number" ? aVal : Number(aVal) || 0
        const bNum = typeof bVal === "number" ? bVal : Number(bVal) || 0
        return aNum - bNum
      })
    }
    return items
  }, [itemsState.records, orderField])

  const completedCount = React.useMemo(
    () => sortedItems.filter((item) => Boolean(item[completedField])).length,
    [sortedItems, completedField],
  )

  const totalCount = sortedItems.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleToggle = async (itemId: string, currentValue: boolean) => {
    setTogglingIds((prev) => new Set(prev).add(itemId))
    try {
      await updateRecord.update(
        { [completedField]: !currentValue },
        { recordId: itemId },
      )
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const handleAddItem = async () => {
    const trimmed = newItemTitle.trim()
    if (!trimmed || createRecord.isSubmitting) return
    await createRecord.create({
      [titleField]: trimmed,
      [foreignKey]: recordId,
    })
  }

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddItem()
    }
    if (e.key === "Escape") {
      setShowAddInput(false)
      setNewItemTitle("")
    }
  }

  const toggleNote = (itemId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const isLoading = itemsState.isLoading
  const hasError = itemsState.error

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-checklist flex h-full min-h-0 flex-col", checklistRootClassName(appearance), className)}
    >
      <div className={cn("shrink-0", checklistHeaderClassName(appearance))}>
        <div className={cn("flex items-center justify-between", checklistToolbarClassName(density))}>
          <div className="min-w-0 flex items-center gap-3">
            <span className={cn("flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground", checklistRadiusClassName(radius, "control"))}>
              <ListChecks className="size-3.5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {title ?? "Checklist"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {totalCount > 0 ? `${completedCount} of ${totalCount} completed` : "No items"}
              </p>
            </div>
          </div>
          {allowCreate && !isLoading && !hasError && totalCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddInput(true)}
              disabled={showAddInput}
              className={cn("h-7 gap-1.5 text-xs", checklistRadiusClassName(radius, "control"))}
            >
              <Plus className="size-3" />
              Add item
            </Button>
          )}
        </div>

        {totalCount > 0 && (
          <div className={cn(density === "compact" ? "px-3 pb-2 pt-1" : density === "spacious" ? "px-5 pb-4 pt-2" : "px-4 pb-3 pt-1.5")}>
            <div className="flex items-center gap-3">
              <div className={cn("h-1.5 flex-1 overflow-hidden bg-muted/60", checklistRadiusClassName(radius, "pill"))}>
                <div
                  className={cn("h-full bg-primary transition-all duration-300", checklistRadiusClassName(radius, "pill"))}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground">
                {progressPercent}%
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={cn("flex-1 overflow-auto", checklistContentClassName(density))}>
        {hasError ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">{hasError.message}</p>
            <Button variant="outline" size="sm" onClick={() => itemsState.refresh()} className={checklistRadiusClassName(radius, "control")}>
              <RefreshCw className="mr-2 size-3.5" />
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-5 shrink-0 rounded-sm" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : totalCount === 0 && !showAddInput ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <div className={cn("flex size-10 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground", checklistRadiusClassName(radius, "pill"))}>
              <CheckSquare className="size-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">No items yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Checklist items will appear here as they are added.</p>
            </div>
            {allowCreate && (
              <Button variant="outline" size="sm" onClick={() => setShowAddInput(true)} className={cn("mt-2", checklistRadiusClassName(radius, "control"))}>
                <Plus className="mr-2 size-3.5" />
                Add item
              </Button>
            )}
          </div>
        ) : (
          <div className={cn("flex flex-col", density === "compact" ? "gap-1" : density === "spacious" ? "gap-3" : "gap-1.5")}>
            {sortedItems.map((item) => {
              const itemId = String(item.id ?? "")
              const isCompleted = Boolean(item[completedField])
              const isRequired = requiredField ? Boolean(item[requiredField]) : false
              const assignee = assigneeField && item[assigneeField] != null ? String(item[assigneeField]) : undefined
              const dueDate = dueDateField && item[dueDateField] != null ? new Date(String(item[dueDateField])) : undefined
              const notes = notesField && item[notesField] != null ? String(item[notesField]) : undefined
              const isOverdue = !!dueDate && !isCompleted && !Number.isNaN(dueDate.getTime()) && dueDate < new Date()
              const isToggling = togglingIds.has(itemId)
              const isNoteExpanded = expandedNotes.has(itemId)

              return (
                <div
                  key={itemId}
                  className={cn(
                    "flex flex-col border border-border/30 bg-muted/10 transition-colors",
                    checklistRadiusClassName(radius, "surface"),
                    density === "compact" ? "p-2" : density === "spacious" ? "p-4" : "p-3",
                    isCompleted && "opacity-60",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isCompleted}
                      disabled={isToggling}
                      onCheckedChange={() => handleToggle(itemId, isCompleted)}
                      className={cn("shrink-0", checklistRadiusClassName(radius, "control"))}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("truncate text-sm font-medium", isCompleted ? "line-through text-muted-foreground" : "text-foreground")}>
                          {String(item[titleField] ?? "")}
                        </span>
                        {isRequired && (
                          <Badge variant="outline" className={cn("shrink-0 gap-1 text-[10px] px-1.5 py-0 h-4", checklistRadiusClassName(radius, "pill"))}>
                            Required
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {assignee && (
                          <span className="inline-flex items-center gap-1">
                            <User className="size-3" />
                            {assignee}
                          </span>
                        )}
                        {dueDate && !Number.isNaN(dueDate.getTime()) && (
                          <span className={cn("inline-flex items-center gap-1", isOverdue && "text-destructive font-medium")}>
                            <Clock className="size-3" />
                            {formatDueDate(dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    {notes && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("shrink-0 size-7 text-muted-foreground", checklistRadiusClassName(radius, "control"))}
                        onClick={() => toggleNote(itemId)}
                      >
                        {isNoteExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      </Button>
                    )}
                  </div>
                  {notes && isNoteExpanded && (
                    <div className={cn("mt-2 border-t border-border/20 pt-2", density === "compact" ? "pl-6" : "pl-8")}>
                      <p className="whitespace-pre-wrap text-xs text-muted-foreground">{notes}</p>
                    </div>
                  )}
                </div>
              )
            })}

            {showAddInput && (
              <div className={cn("flex items-center gap-3 border border-dashed border-border/60 bg-muted/5", checklistRadiusClassName(radius, "surface"), density === "compact" ? "p-2" : density === "spacious" ? "p-4" : "p-3")}>
                <Checkbox checked={false} disabled className={cn("shrink-0", checklistRadiusClassName(radius, "control"))} />
                <Input
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  onKeyDown={handleAddKeyDown}
                  placeholder="Item title..."
                  disabled={createRecord.isSubmitting}
                  autoFocus
                  className={cn("h-7 flex-1 text-sm", checklistRadiusClassName(radius, "control"))}
                />
                <Button
                  size="sm"
                  onClick={handleAddItem}
                  disabled={!newItemTitle.trim() || createRecord.isSubmitting}
                  className={cn("shrink-0 h-7 gap-1.5 text-xs", checklistRadiusClassName(radius, "control"))}
                >
                  <Plus className="size-3" />
                  Add
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowAddInput(false); setNewItemTitle("") }}
                  className={cn("shrink-0 h-7 text-xs", checklistRadiusClassName(radius, "control"))}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function formatDueDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function checklistRootClassName(appearance: LemmaChecklistAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function checklistHeaderClassName(appearance: LemmaChecklistAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

function checklistToolbarClassName(density: LemmaChecklistDensity) {
  if (density === "compact") return "gap-2 px-3 py-2"
  if (density === "spacious") return "gap-4 px-5 py-4"
  return "gap-3 px-4 py-3"
}

function checklistContentClassName(density: LemmaChecklistDensity) {
  if (density === "compact") return "p-2"
  if (density === "spacious") return "p-5"
  return "p-4"
}
