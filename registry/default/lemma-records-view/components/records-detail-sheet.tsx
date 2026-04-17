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
  type RecordDetailFieldGroup,
  type RecordDetailRelatedRecord,
  type RecordDetailTab,
  type RecordDetailVariant,
} from "./records-detail"
import { type EnumColorMap } from "./records-enum-utils"
import type { ColumnLabelMap } from "./records-display-utils"
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
  headerFields?: string[]
  fieldGroups?: RecordDetailFieldGroup[]
  relatedRecords?: RecordDetailRelatedRecord[]
  editable?: boolean
  hiddenFields?: string[]
  titleField?: string
  descriptionField?: string
  identifierField?: string
  statusField?: string
  onClose: () => void
  onRecordChanged: () => void
  onDelete: () => void
  onNext?: () => void
  onPrevious?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  updateVia?: "direct" | "function"
  updateFunctionName?: string
  columnLabels?: ColumnLabelMap
  foreignKeyLabels?: Record<string, string>
  enumColorMap?: EnumColorMap
  appearance?: LemmaRecordsAppearance
  density?: LemmaRecordsDensity
  radius?: LemmaRecordsRadius
  actions?: React.ReactNode
  renderFiles?: (context: { record: Record<string, unknown>; table: Table; recordId: string }) => React.ReactNode
}

export function DetailSheet({
  record,
  table,
  client,
  podId,
  mode = "sheet",
  variant = "workspace",
  tabs,
  headerFields,
  fieldGroups,
  relatedRecords,
  editable = true,
  hiddenFields,
  titleField,
  descriptionField,
  identifierField,
  statusField,
  onClose,
  onRecordChanged,
  onDelete,
  onNext,
  onPrevious,
  hasPrevious,
  hasNext,
  updateVia,
  updateFunctionName,
  columnLabels,
  foreignKeyLabels,
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  actions,
  renderFiles,
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
      headerFields={headerFields}
      fieldGroups={fieldGroups}
      relatedRecords={relatedRecords}
      hiddenFields={hiddenFields}
      titleField={titleField}
      descriptionField={descriptionField}
      identifierField={identifierField}
      statusField={statusField}
      updateVia={updateVia}
      updateFunctionName={updateFunctionName}
      columnLabels={columnLabels}
      foreignKeyLabels={foreignKeyLabels}
      enumColorMap={enumColorMap}
      appearance={appearance}
      density={density}
      radius={radius}
      renderFiles={renderFiles}
      onRecordChanged={onRecordChanged}
      onDelete={onDelete}
      className="h-full overflow-y-auto border-0 shadow-none"
      actions={
        <div className="flex items-center gap-1">
          {actions}
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
            "min-w-lg max-h-[88vh] max-w-5xl gap-0 overflow-hidden p-0",
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
          "w-full min-w-lg gap-0 overflow-hidden p-0 sm:max-w-3xl lg:max-w-4xl",
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
