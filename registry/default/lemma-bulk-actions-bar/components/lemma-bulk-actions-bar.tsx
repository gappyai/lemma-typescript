"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

export interface LemmaBulkActionsBarProps {
  selectedCount: number
  title?: string
  description?: string
  isDeleting?: boolean
  deleteLabel?: string
  clearLabel?: string
  onDeleteSelected?: () => void
  onClearSelection?: () => void
  error?: Error | null
  message?: string | null
}

export function LemmaBulkActionsBar({
  selectedCount,
  title = "Bulk actions",
  description = "Select multiple rows to run a single action across them.",
  isDeleting = false,
  deleteLabel = "Delete selected",
  clearLabel = "Clear selection",
  onDeleteSelected,
  onClearSelection,
  error,
  message,
}: LemmaBulkActionsBarProps) {
  if (selectedCount <= 0 && !error && !message) return null

  return (
    <div className="grid gap-3 rounded-[var(--resource-radius-md)] border border-[color:var(--resource-border)] bg-[var(--resource-surface)] p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-1">
          <div className="text-sm font-medium text-[color:var(--resource-text)]">{title}</div>
          <div className="text-sm text-[color:var(--resource-muted)]">
            {selectedCount > 0
              ? `${selectedCount} record${selectedCount === 1 ? "" : "s"} selected. ${description}`
              : description}
          </div>
        </div>
        {selectedCount > 0 ? (
          <div className="flex items-center gap-2">
            {onClearSelection ? (
              <Button onClick={onClearSelection} variant="ghost">
                {clearLabel}
              </Button>
            ) : null}
            {onDeleteSelected ? (
              <Button disabled={isDeleting} onClick={onDeleteSelected}>
                {isDeleting ? "Deleting…" : deleteLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-[color:var(--resource-danger-border)] bg-[var(--resource-danger-soft)] px-3 py-2 text-sm text-[color:var(--resource-danger)]">
          {error.message}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-md border border-[color:var(--resource-border-strong)] bg-[var(--resource-surface-alt)] px-3 py-2 text-sm text-[color:var(--resource-text)]">
          {message}
        </div>
      ) : null}
    </div>
  )
}
