"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useRecordForm } from "lemma-sdk/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

function fieldTypeBadgeClassName(kind: string): string {
  if (kind === "select") return "border-orange-200 bg-orange-50 text-orange-700"
  if (kind === "foreign-key" || kind === "uuid") return "border-sky-200 bg-sky-50 text-sky-700"
  if (kind === "boolean") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (kind === "date" || kind === "datetime") return "border-violet-200 bg-violet-50 text-violet-700"
  return "border-blue-200 bg-blue-50 text-blue-700"
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
        <Card ref={ref} className={cn("", className)} {...props}>
          <CardHeader>
            <CardTitle>{title ?? "Registry Record Form"}</CardTitle>
            <CardDescription>
              {description ?? "Select a table to render the generated record form."}
            </CardDescription>
          </CardHeader>
        </Card>
      )
    }

    const resolvedTitle = title ?? `${recordId ? "Edit" : "Create"} ${tableName}`
    const resolvedDescription = description ?? "Schema-aware form powered by lemma-sdk/react."
    const meta = (
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="rounded-full px-4 py-1 text-sm font-medium" variant="secondary">
          {recordId ? "Update" : "Create"}
        </Badge>
        <Badge className="rounded-full px-4 py-1 text-sm font-medium" variant="outline">
          {fields.length} field{fields.length === 1 ? "" : "s"}
        </Badge>
        <Badge className="rounded-full px-4 py-1 text-sm font-medium" variant="outline">
          {tableName}
        </Badge>
      </div>
    )

    const body = (
      <form className="flex flex-col gap-5" id={formId} onSubmit={handleSubmit}>
        {form.error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {form.error.message}
          </div>
        ) : null}

        {form.isLoadingSchema || form.isLoadingRecord ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
            Loading form...
          </div>
        ) : null}

        {!form.isLoadingSchema && !form.isLoadingRecord && fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
            No editable fields were found for this table.
          </div>
        ) : null}

        {fields.map((field) => {
          const value = form.values[field.name]
          const error = form.fieldErrors[field.name]
          const resolvedLabel = fieldLabels?.[field.name] ?? defaultFieldLabel(field.name)
          const resolvedFieldDescription = fieldDescriptions?.[field.name] ?? field.column.description
          const placeholder = buildPlaceholder(resolvedLabel, field.kind)
          const fieldHeader = (
            <div className="flex flex-wrap items-center gap-3">
              <Label
                className="text-[0.8rem] font-semibold tracking-[0.14em] text-muted-foreground"
                htmlFor={field.name}
              >
                {resolvedLabel}
                {field.required ? " *" : ""}
              </Label>
              <Badge
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[0.8rem] font-semibold lowercase tracking-normal",
                  fieldTypeBadgeClassName(field.kind),
                )}
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
                <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-background px-4 py-4 text-sm shadow-sm">
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
                  <SelectTrigger className="h-12 w-full rounded-xl border-border/70 bg-background px-4 text-sm shadow-sm" id={field.name}>
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
                className="h-12 rounded-xl border-border/70 bg-background px-4 text-sm shadow-sm"
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
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
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
              {form.isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </div>
        ) : null}
      </form>
    )

    if (resolvedVariant === "sheet") {
      return (
        <Sheet open={open ?? internalOpen} onOpenChange={handleSheetOpenChange}>
          <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl" side={side}>
            <SheetHeader className="border-b border-border px-8 py-7 text-left">
              <SheetTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {resolvedTitle}
              </SheetTitle>
              <SheetDescription className="pt-2 text-base leading-7 text-muted-foreground sm:text-xl">
                {resolvedDescription}
              </SheetDescription>
              {meta}
            </SheetHeader>
            <div ref={ref} className={cn("min-h-0 flex-1 overflow-y-auto px-8 py-6", className)} {...props}>
              {body}
            </div>
            <SheetFooter className="border-t border-border bg-background px-8 py-5 sm:justify-between">
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
                  {form.isSubmitting ? "Saving..." : submitLabel}
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <Card ref={ref} className={cn("overflow-hidden border-border/70 shadow-none", className)} {...props}>
        <CardHeader className="border-b border-border pb-6">
          <CardTitle className="text-2xl font-semibold tracking-tight">{resolvedTitle}</CardTitle>
          <CardDescription className="text-base leading-7">{resolvedDescription}</CardDescription>
          {meta}
        </CardHeader>
        <CardContent className="px-6 py-6">{body}</CardContent>
      </Card>
    )
  },
)
LemmaRecordForm.displayName = "LemmaRecordForm"
