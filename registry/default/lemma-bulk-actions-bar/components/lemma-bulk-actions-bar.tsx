"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DataWorkspaceState,
  dataWorkspaceMetaBadgeClassName,
} from "@/components/lemma/registry-data-workspace"

export interface BulkAction {
  label: string
  onClick: (selectedIds: string[]) => void
  variant?: "default" | "destructive"
  isLoading?: boolean
}

export interface LemmaBulkActionsBarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedCount: number
  selectedIds?: string[]
  title?: string
  description?: string
  isDeleting?: boolean
  isProcessing?: boolean
  deleteLabel?: string
  clearLabel?: string
  onDeleteSelected?: () => void
  onClearSelection?: () => void
  error?: Error | null
  message?: string | null
  actions?: BulkAction[]
}

export const LemmaBulkActionsBar = React.forwardRef<HTMLDivElement, LemmaBulkActionsBarProps>(
  ({
    selectedCount,
    selectedIds = [],
    title = "Bulk actions",
    description = "Select multiple rows to run a single action across them.",
    isDeleting = false,
    isProcessing,
    deleteLabel = "Delete selected",
    clearLabel = "Clear selection",
    onDeleteSelected,
    onClearSelection,
    error,
    message,
    actions = [],
    className,
    ...props
  }, ref) => {
  const isBusy = isDeleting || isProcessing
  if (selectedCount <= 0 && !error && !message) return null

  return (
    <div ref={ref} className={cn("grid gap-3", className)} {...props}>
      {selectedCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-full border bg-background/95 px-4 py-2 shadow-lg md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-medium text-foreground">{title}</div>
              <div className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("primary"))}>
                {selectedCount} selected
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {description}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onClearSelection ? (
              <Button onClick={onClearSelection} variant="ghost">
                {clearLabel}
              </Button>
            ) : null}
            {actions.map((action) => (
              <Button
                disabled={action.isLoading || isBusy}
                key={action.label}
                onClick={() => action.onClick(selectedIds)}
                variant={action.variant === "destructive" ? "destructive" : "ghost"}
              >
                {action.isLoading ? "Loading…" : action.label}
              </Button>
            ))}
            {onDeleteSelected ? (
              <Button disabled={isBusy} onClick={onDeleteSelected} type="button" variant="destructive">
                {isBusy ? "Deleting…" : deleteLabel}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? (
        <DataWorkspaceState
          description={error.message}
          tone="danger"
        />
      ) : null}

      {message ? (
        <DataWorkspaceState
          description={message}
          heading={selectedCount > 0 ? `${selectedCount} record${selectedCount === 1 ? "" : "s"} selected.` : title}
        />
      ) : null}
    </div>
  )
})
LemmaBulkActionsBar.displayName = "LemmaBulkActionsBar"
