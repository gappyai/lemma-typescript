"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useRecordForm } from "lemma-sdk/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { LemmaForeignKeySelect } from "@/components/lemma/lemma-foreign-key-select"
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DATA_PANEL_SECTION_CLASS_NAME,
  DATA_INPUT_CLASS_NAME,
  DATA_SUBTLE_ACTION_CLASS_NAME,
  DATA_FIELD_LABEL_CLASS_NAME,
  DATA_TYPE_BADGE_CLASS_NAME,
  DataWorkspaceHeader,
  DataWorkspaceState,
  dataWorkspaceTypeBadgeClassName,
  dataWorkspaceMetaBadgeClassName,
} from "@/components/lemma/registry-data-workspace"
import { cn } from "@/lib/utils"

type LemmaRecordFormVariant = "card" | "sheet"
type LemmaRecordFormSide = "top" | "right" | "bottom" | "left"

export interface LemmaRecordFormProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError"> {
  client: LemmaClient
  podId?: string
  tableName: string
  recordId?: string | null
  initialValues?: Record<string, unknown>
  mode?: "auto" | "create" | "update"
  title?: string
  description?: string
  submitLabel?: string
  hiddenFields?: string[]
  fieldOrder?: string[]
  onSubmitted?: (record: Record<string, unknown>) => void
  onCancel?: () => void
  appearance?: "card" | "modal"
  variant?: LemmaRecordFormVariant
  side?: LemmaRecordFormSide
  open?: boolean
  onOpenChange?: (open: boolean) => void
  fieldLabels?: Record<string, string>
  fieldDescriptions?: Record<string, string>
  showReset?: boolean
  resetLabel?: string
  cancelLabel?: string
  onError?: (error: Error) => void
}

function orderFields(
  fields: Array<ReturnType<typeof useRecordForm>["editableFields"][number]>,
  fieldOrder?: string[],
) {
  if (!fieldOrder?.length) return fields

  const indexByName = new Map(fieldOrder.map((name, index) => [name, index]))

  return [...fields].sort((left, right) => {
    const leftIndex = indexByName.get(left.name)
    const rightIndex = indexByName.get(right.name)

    if (typeof leftIndex === "number" && typeof rightIndex === "number") {
      return leftIndex - rightIndex
    }

    if (typeof leftIndex === "number") return -1
    if (typeof rightIndex === "number") return 1
    return left.label.localeCompare(right.label)
  })
}

function defaultFieldLabel(name: string): string {
  return name.replace(/\./g, "_").toUpperCase()
}

function buildPlaceholder(label: string, kind: string): string {
  if (kind === "select") return `Select ${label.toLowerCase()}`
  if (kind === "foreign-key") return `Choose ${label.toLowerCase()}`
  return `Enter ${label.toLowerCase()}...`
}

export const LemmaRecordForm = React.forwardRef<HTMLDivElement, LemmaRecordFormProps>(
  ({
    client,
    podId,
    tableName,
    recordId,
    initialValues,
    mode = "auto",
    title,
    description,
    submitLabel = recordId ? "Save changes" : "Create record",
    hiddenFields = [],
    fieldOrder,
    onSubmitted,
    onCancel,
    appearance = "card",
    variant,
    side = "right",
    open,
    onOpenChange,
    fieldLabels,
    fieldDescriptions,
    showReset = true,
    resetLabel = "Reset",
    cancelLabel = "Cancel",
    onError,
    className,
    ...props
  }, ref) => {
    const hasTableName = tableName.trim().length > 0
    const formId = React.useId()
    const resolvedVariant = variant ?? (appearance === "modal" ? "sheet" : "card")
    const [internalOpen, setInternalOpen] = React.useState(open ?? true)

    const form = useRecordForm({
      client,
      podId,
      tableName,
      recordId,
      initialValues,
      mode,
      onSubmitSuccess: (record) => onSubmitted?.(record),
    })

    React.useEffect(() => {
      if (form.error) {
        onError?.(form.error)
      }
    }, [form.error, onError])

    React.useEffect(() => {
      if (typeof open === "boolean") {
        setInternalOpen(open)
      }
    }, [open])

    const fields = React.useMemo(() => {
      const visibleFields = form.editableFields.filter((field) => !hiddenFields.includes(field.name))
      return orderFields(visibleFields, fieldOrder)
    }, [fieldOrder, form.editableFields, hiddenFields])

    const handleSubmit = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      await form.submit()
    }, [form])

    const handleSheetOpenChange = React.useCallback((nextOpen: boolean) => {
      if (typeof open !== "boolean") {
        setInternalOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
      if (!nextOpen) {
        onCancel?.()
      }
    }, [onCancel, onOpenChange, open])

    if (!hasTableName) {
      return (
        <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
          <div className={DATA_PANEL_HEADER_CLASS_NAME}>
            <DataWorkspaceHeader
              description={description ?? "Select a table to render the generated record form."}
              title={title ?? "Registry Record Form"}
            />
          </div>
        </div>
      )
    }

    const resolvedTitle = title ?? `${recordId ? "Edit" : "Create"} ${tableName}`
    const resolvedDescription = description ?? "Schema-aware form powered by lemma-sdk/react."
    const meta = (
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          className={cn(DATA_TYPE_BADGE_CLASS_NAME, dataWorkspaceMetaBadgeClassName(recordId ? "success" : "primary"))}
          variant="outline"
        >
          {recordId ? "Update" : "Create"}
        </Badge>
        <Badge
          className={cn(DATA_TYPE_BADGE_CLASS_NAME, dataWorkspaceMetaBadgeClassName("default"))}
          variant="outline"
        >
          {fields.length} field{fields.length === 1 ? "" : "s"}
        </Badge>
        <Badge
          className={cn(DATA_TYPE_BADGE_CLASS_NAME, dataWorkspaceMetaBadgeClassName("default"))}
          variant="outline"
        >
          {tableName}
        </Badge>
      </div>
    )

    const body = (
      <form className="flex flex-col gap-5" id={formId} onSubmit={handleSubmit}>
        {form.error ? (
          <DataWorkspaceState description={form.error.message} heading="Submission failed" tone="danger" />
        ) : null}

        {form.isLoadingSchema || form.isLoadingRecord ? (
          <DataWorkspaceState description="Loading form\u2026" />
        ) : null}

        {!form.isLoadingSchema && !form.isLoadingRecord && fields.length === 0 ? (
          <DataWorkspaceState description="No editable fields were found for this table." />
        ) : null}

        {fields.map((field) => {
          const value = form.values[field.name]
          const error = form.fieldErrors[field.name]
          const resolvedLabel = fieldLabels?.[field.name] ?? defaultFieldLabel(field.name)
          const resolvedFieldDescription = fieldDescriptions?.[field.name] ?? field.column.description
          const placeholder = buildPlaceholder(resolvedLabel, field.kind)
          const fieldHeader = (
            <div className="flex flex-wrap items-center gap-3">
              <Label className={DATA_FIELD_LABEL_CLASS_NAME} htmlFor={field.name}>
                {resolvedLabel}
                {field.required ? " *" : ""}
              </Label>
              <Badge
                className={cn(DATA_TYPE_BADGE_CLASS_NAME, dataWorkspaceTypeBadgeClassName(field.kind))}
                variant="outline"
              >
                {field.column.type.toLowerCase()}
              </Badge>
            </div>
          )

          if (field.kind === "boolean") {
            return (
              <div key={field.name} className="grid gap-3">
                {fieldHeader}
                {resolvedFieldDescription ? (
                  <p className="text-sm leading-6 text-muted-foreground">{resolvedFieldDescription}</p>
                ) : null}
                <label className={cn(DATA_PANEL_SECTION_CLASS_NAME, "flex items-center gap-3 px-4 py-4 text-sm")}>
                  <Checkbox
                    checked={Boolean(value)}
                    onCheckedChange={(checked) => form.setValue(field.name, checked === true)}
                  />
                  <span className="font-medium text-foreground">{Boolean(value) ? "Yes" : "No"}</span>
                </label>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>
            )
          }

          if (field.kind === "select") {
            return (
              <div key={field.name} className="grid gap-2">
                {fieldHeader}
                {resolvedFieldDescription ? (
                  <p className="text-sm leading-6 text-muted-foreground">{resolvedFieldDescription}</p>
                ) : null}
                <Select
                  value={typeof value === "string" ? value : ""}
                  onValueChange={(nextValue) => form.setValue(field.name, nextValue)}
                >
                  <SelectTrigger className={cn(DATA_INPUT_CLASS_NAME, "h-12 w-full px-4 text-sm")} id={field.name}>
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {field.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>
            )
          }

          if (field.kind === "foreign-key") {
            return (
              <div key={field.name} className="grid gap-2">
                {fieldHeader}
                {resolvedFieldDescription ? (
                  <p className="text-sm leading-6 text-muted-foreground">{resolvedFieldDescription}</p>
                ) : null}
                <LemmaForeignKeySelect
                  client={client}
                  columnName={field.name}
                  onValueChange={(nextValue: string) => form.setValue(field.name, nextValue)}
                  podId={podId}
                  tableName={tableName}
                  value={typeof value === "string" ? value : value ? String(value) : ""}
                />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>
            )
          }

          if (field.kind === "json" || field.kind === "textarea") {
            return (
              <div key={field.name} className="grid gap-2">
                {fieldHeader}
                {resolvedFieldDescription ? (
                  <p className="text-sm leading-6 text-muted-foreground">{resolvedFieldDescription}</p>
                ) : null}
                <Textarea
                  className="min-h-24 rounded-xl border-border/70 bg-background px-4 py-3 text-sm shadow-sm"
                  id={field.name}
                  onChange={(event) => form.setValue(field.name, event.target.value)}
                  placeholder={placeholder}
                  rows={field.kind === "json" ? 6 : 3}
                  value={typeof value === "string" ? value : ""}
                />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>
            )
          }

          return (
            <div key={field.name} className="grid gap-2">
              {fieldHeader}
              {resolvedFieldDescription ? (
                <p className="text-sm leading-6 text-muted-foreground">{resolvedFieldDescription}</p>
              ) : null}
              <Input
                className={cn(DATA_INPUT_CLASS_NAME, "h-12 px-4 text-sm")}
                id={field.name}
                onChange={(event) => form.setValue(field.name, event.target.value)}
                placeholder={placeholder}
                type={
                  field.kind === "number"
                    ? "number"
                    : field.kind === "date"
                      ? "date"
                      : field.kind === "datetime"
                        ? "datetime-local"
                        : "text"
                }
                value={typeof value === "string" ? value : value ? String(value) : ""}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
          )
        })}

        {resolvedVariant === "card" ? (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-5">
            {showReset ? (
              <Button
                className="rounded-xl"
                disabled={form.isSubmitting}
                onClick={() => form.reset()}
                type="button"
                variant="outline"
              >
                {resetLabel}
              </Button>
            ) : null}
            <Button className="rounded-xl" onClick={onCancel} type="button" variant="ghost">
              {cancelLabel}
            </Button>
            <Button
              className="rounded-xl"
              disabled={form.isSubmitting || form.isLoadingSchema || form.isLoadingRecord}
              type="submit"
            >
              {form.isSubmitting ? "Saving\u2026" : submitLabel}
            </Button>
          </div>
        ) : null}
      </form>
    )

    if (resolvedVariant === "sheet") {
      return (
        <Sheet open={open ?? internalOpen} onOpenChange={handleSheetOpenChange}>
          <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl" side={side}>
            <SheetHeader className={cn(DATA_PANEL_HEADER_CLASS_NAME, "text-left")}>
              <SheetTitle className="text-lg font-semibold leading-tight tracking-[-0.01em] md:text-xl">
                {resolvedTitle}
              </SheetTitle>
              <SheetDescription className="text-sm leading-6 text-muted-foreground">
                {resolvedDescription}
              </SheetDescription>
              {meta}
            </SheetHeader>
            <div ref={ref} className={cn("min-h-0 flex-1 overflow-y-auto", DATA_PANEL_CONTENT_CLASS_NAME, className)} {...props}>
              {body}
            </div>
            <SheetFooter className="border-t border-border/60 px-5 py-4 sm:justify-between md:px-6">
              <div className="flex flex-wrap items-center gap-2">
                {showReset ? (
                  <Button
                    className="rounded-xl"
                    disabled={form.isSubmitting}
                    onClick={() => form.reset()}
                    type="button"
                    variant="outline"
                  >
                    {resetLabel}
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button className="rounded-xl" onClick={onCancel} type="button" variant="ghost">
                  {cancelLabel}
                </Button>
                <Button
                  className="rounded-xl"
                  disabled={form.isSubmitting || form.isLoadingSchema || form.isLoadingRecord}
                  form={formId}
                  type="submit"
                >
                  {form.isSubmitting ? "Saving\u2026" : submitLabel}
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
        <div className={DATA_PANEL_HEADER_CLASS_NAME}>
          <DataWorkspaceHeader
            description={resolvedDescription}
            meta={meta}
            title={resolvedTitle}
          />
        </div>
        <div className={DATA_PANEL_CONTENT_CLASS_NAME}>{body}</div>
      </div>
    )
  },
)
LemmaRecordForm.displayName = "LemmaRecordForm"
