"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import type { LemmaClient, Table } from "lemma-sdk"
import { cn } from "@/lib/utils"
import {
  RecordDetail,
  type RecordDetailRelatedRecord,
  type RecordDetailTab,
  type RecordDetailVariant,
} from "./records-detail"
import {
  recordsRadiusClassName,
  type LemmaRecordsAppearance,
  type LemmaRecordsDensity,
  type LemmaRecordsRadius,
} from "./records-style-utils"

export interface DetailSheetProps {
  record: Record<string, unknown>
  table: Table
  client: LemmaClient
  podId?: string
  mode?: "sheet" | "modal"
  variant?: RecordDetailVariant
  tabs?: RecordDetailTab[]
  relatedRecords?: RecordDetailRelatedRecord[]
  editable?: boolean
  hiddenFields?: string[]
  onClose: () => void
  onRecordChanged: () => void
  onDelete: () => void
  onNext?: () => void
  onPrevious?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  updateVia?: "direct" | "function"
  updateFunctionName?: string
  foreignKeyLabels?: Record<string, string>
  appearance?: LemmaRecordsAppearance
  density?: LemmaRecordsDensity
  radius?: LemmaRecordsRadius
}

export function DetailSheet({
  record,
  table,
  client,
  podId,
  mode = "sheet",
  variant = "workspace",
  tabs,
  relatedRecords,
  editable = true,
  hiddenFields,
  onClose,
  onRecordChanged,
  onDelete,
  onNext,
  onPrevious,
  hasPrevious,
  hasNext,
  updateVia,
  updateFunctionName,
  foreignKeyLabels,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
}: DetailSheetProps) {
  const content = (
    <RecordDetail
      record={record}
      table={table}
      client={client}
      podId={podId}
      mode={editable ? "editable" : "view"}
      variant={variant}
      tabs={tabs}
      relatedRecords={relatedRecords}
      hiddenFields={hiddenFields}
      updateVia={updateVia}
      updateFunctionName={updateFunctionName}
      foreignKeyLabels={foreignKeyLabels}
      appearance={appearance}
      density={density}
      radius={radius}
      onRecordChanged={onRecordChanged}
      onDelete={onDelete}
      className="h-full overflow-y-auto border-0 shadow-none"
      actions={
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onPrevious}
            disabled={!hasPrevious}
          >
            <ChevronLeft />
            <span className="sr-only">Previous record</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onNext}
            disabled={!hasNext}
          >
            <ChevronRight />
            <span className="sr-only">Next record</span>
          </Button>
        </div>
      }
    />
  )

  if (mode === "modal") {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className={cn(
            "max-h-[88vh] max-w-4xl gap-0 overflow-hidden p-0",
            detailOverlayClassName(appearance, radius),
          )}
        >
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className={cn(
          "w-full gap-0 overflow-hidden p-0 sm:max-w-2xl",
          detailOverlayClassName(appearance, radius),
        )}
      >
        {content}
      </SheetContent>
    </Sheet>
  )
}
function detailOverlayClassName(appearance: LemmaRecordsAppearance, radius: LemmaRecordsRadius) {
  return cn(
    recordsRadiusClassName(radius, "overlay"),
    appearance === "minimal" ? "border-0 bg-background shadow-none" : null,
    appearance === "borderless" ? "border-0 bg-background shadow-xl" : null,
    appearance === "contained" ? "border-border/70 bg-card shadow-xl" : null,
    appearance === "default" ? "border-border/50 bg-card" : null,
  )
}
