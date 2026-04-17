"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type RecordQuickActionMode = "direct" | "function"
export type RecordQuickActionPlacement = "detail" | "preview" | "both"

export interface RecordQuickAction {
  id?: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: "default" | "outline" | "destructive" | "ghost"
  mode?: RecordQuickActionMode
  functionName?: string
  nextValues?: Record<string, unknown> | ((record: Record<string, unknown>) => Record<string, unknown>)
  buildUpdate?: (record: Record<string, unknown>) => Record<string, unknown>
  buildInput?: (record: Record<string, unknown>) => Record<string, unknown>
  visible?: (record: Record<string, unknown>) => boolean
  disabled?: (record: Record<string, unknown>) => boolean
}

export interface RecordQuickActionContext {
  action: RecordQuickAction
  record: Record<string, unknown>
  recordId: string
  tableName: string
}

export function recordQuickActionKey(action: RecordQuickAction, recordId: string, index: number): string {
  return `${recordId}:${action.id ?? action.functionName ?? action.label}:${index}`
}

export function resolveQuickActionValues(
  action: RecordQuickAction,
  record: Record<string, unknown>,
): Record<string, unknown> {
  const nextValues = typeof action.nextValues === "function"
    ? action.nextValues(record)
    : action.nextValues
  return {
    ...(nextValues ?? {}),
    ...(action.buildUpdate?.(record) ?? {}),
  }
}

export function RecordQuickActionButtons({
  record,
  recordId,
  actions,
  pendingActionKey,
  onRun,
  compact = false,
  className,
}: {
  record: Record<string, unknown>
  recordId?: string
  actions: RecordQuickAction[]
  pendingActionKey?: string | null
  onRun: (action: RecordQuickAction, index: number, event?: React.MouseEvent) => void
  compact?: boolean
  className?: string
}) {
  const visibleActions = actions.filter((action) => action.visible?.(record) !== false)

  if (visibleActions.length === 0) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visibleActions.map((action, index) => {
        const key = recordQuickActionKey(action, recordId ?? String(record.id ?? ""), index)
        const Icon = action.icon
        const isPending = pendingActionKey === key
        return (
          <Button
            key={key}
            type="button"
            size={compact ? "sm" : "sm"}
            variant={action.variant ?? "outline"}
            className={cn(compact ? "h-7 px-2 text-[11px]" : "h-8 text-xs")}
            disabled={isPending || action.disabled?.(record)}
            onClick={(event) => {
              event.stopPropagation()
              onRun(action, index, event)
            }}
          >
            {Icon ? <Icon className={compact ? "mr-1 size-3.5" : "mr-1.5 size-3.5"} /> : null}
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}
