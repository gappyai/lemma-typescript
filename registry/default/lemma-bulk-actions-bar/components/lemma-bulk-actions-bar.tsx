"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DATA_FLOATING_BAR_CLASS_NAME,
  DATA_SUBTLE_ACTION_CLASS_NAME,
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
        <div className={cn("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", DATA_FLOATING_BAR_CLASS_NAME)}>
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-medium text-foreground">{title}</div>
              <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em]", dataWorkspaceMetaBadgeClassName("primary"))}>
                {selectedCount} selected
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {description}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onClearSelection ? (
              <Button className={DATA_SUBTLE_ACTION_CLASS_NAME} onClick={onClearSelection} variant="ghost">
                {clearLabel}
              </Button>
            ) : null}
            {actions.map((action) => (
              <Button
                className={action.variant === "destructive" ? "" : DATA_SUBTLE_ACTION_CLASS_NAME}
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
