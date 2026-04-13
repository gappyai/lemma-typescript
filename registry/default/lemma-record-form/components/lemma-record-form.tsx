"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useRecordForm } from "lemma-sdk/react"
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { LemmaForeignKeySelect } from "@/components/lemma/lemma-foreign-key-select"

export interface LemmaRecordFormProps {
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
  fieldLabels?: Record<string, string>
  fieldDescriptions?: Record<string, string>
  showReset?: boolean
  resetLabel?: string
  cancelLabel?: string
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

export function LemmaRecordForm({
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
  fieldLabels,
  fieldDescriptions,
  showReset = true,
  resetLabel = "Reset",
  cancelLabel = "Cancel",
}: LemmaRecordFormProps) {
  const hasTableName = tableName.trim().length > 0

  const form = useRecordForm({
    client,
    podId,
    tableName,
    recordId,
    initialValues,
    mode,
    onSubmitSuccess: (record) => onSubmitted?.(record),
  })

  const fields = React.useMemo(() => {
    const visibleFields = form.editableFields.filter((field) => !hiddenFields.includes(field.name))
    return orderFields(visibleFields, fieldOrder)
  }, [fieldOrder, form.editableFields, hiddenFields])

  const handleSubmit = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await form.submit()
  }, [form])

  if (!hasTableName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title ?? "Registry Record Form"}</CardTitle>
          <CardDescription>
            {description ?? "Select a table to render the generated record form."}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const header = (
    <div className="grid gap-2">
      <h3 className="text-2xl font-semibold text-[color:var(--resource-text)]">
        {title ?? `${recordId ? "Edit" : "Create"} ${tableName}`}
      </h3>
      <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--resource-muted-strong)]">
        {description ?? "Schema-aware form powered by lemma-sdk/react."}
      </p>
    </div>
  )

  const body = (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      {form.error ? (
        <div className="rounded-md border border-[color:var(--resource-danger-border)] bg-[var(--resource-danger-soft)] px-3 py-2 text-sm text-[color:var(--resource-danger)]">
          {form.error.message}
        </div>
      ) : null}

      {form.isLoadingSchema || form.isLoadingRecord ? (
        <div className="rounded-md border border-dashed border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-6 text-sm text-[color:var(--resource-muted)]">
          Loading form…
        </div>
      ) : null}

      {!form.isLoadingSchema && !form.isLoadingRecord && fields.length === 0 ? (
        <div className="rounded-md border border-dashed border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-6 text-sm text-[color:var(--resource-muted)]">
          No editable fields were found for this table.
        </div>
      ) : null}

      {fields.map((field) => {
        const value = form.values[field.name]
        const error = form.fieldErrors[field.name]
        const resolvedLabel = fieldLabels?.[field.name] ?? field.label
        const resolvedDescription = fieldDescriptions?.[field.name] ?? field.column.description
        const commonLabel = (
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--resource-muted-strong)]" htmlFor={field.name}>
                {resolvedLabel}
                {field.required ? " *" : ""}
              </Label>
              <span className="inline-flex rounded-[6px] bg-[#e8eeff] px-2 py-0.5 text-xs font-medium uppercase tracking-[0.08em] text-[#3e78ff]">
                {field.column.type.toLowerCase()}
              </span>
            </div>
            {resolvedDescription ? (
              <p className="text-sm text-[color:var(--resource-muted)]">{resolvedDescription}</p>
            ) : null}
          </div>
        )

        if (field.kind === "boolean") {
          return (
            <div key={field.name} className="grid gap-3">
              {commonLabel}
              <label className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={Boolean(value)}
                  onCheckedChange={(checked) => form.setValue(field.name, checked === true)}
                />
                <span>{Boolean(value) ? "Yes" : "No"}</span>
              </label>
              {error ? <p className="text-sm text-[color:var(--resource-danger)]">{error}</p> : null}
            </div>
          )
        }

        if (field.kind === "select") {
          return (
            <div key={field.name} className="grid gap-2">
              {commonLabel}
              <Select
                value={typeof value === "string" ? value : ""}
                onValueChange={(nextValue) => form.setValue(field.name, nextValue)}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error ? <p className="text-sm text-[color:var(--resource-danger)]">{error}</p> : null}
            </div>
          )
        }

        if (field.kind === "foreign-key") {
          return (
            <div key={field.name} className="grid gap-2">
              {commonLabel}
              <LemmaForeignKeySelect
                client={client}
                podId={podId}
                tableName={tableName}
                columnName={field.name}
                value={typeof value === "string" ? value : value ? String(value) : ""}
                onValueChange={(nextValue: string) => form.setValue(field.name, nextValue)}
              />
              {error ? <p className="text-sm text-[color:var(--resource-danger)]">{error}</p> : null}
            </div>
          )
        }

        if (field.kind === "json" || field.kind === "textarea") {
          return (
            <div key={field.name} className="grid gap-2">
              {commonLabel}
              <Textarea
                id={field.name}
                rows={field.kind === "json" ? 8 : 4}
                value={typeof value === "string" ? value : ""}
                onChange={(event) => form.setValue(field.name, event.target.value)}
              />
              {error ? <p className="text-sm text-[color:var(--resource-danger)]">{error}</p> : null}
            </div>
          )
        }

        return (
          <div key={field.name} className="grid gap-2">
            {commonLabel}
            <Input
              id={field.name}
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
              onChange={(event) => form.setValue(field.name, event.target.value)}
            />
            {error ? <p className="text-sm text-[color:var(--resource-danger)]">{error}</p> : null}
          </div>
        )
      })}

      {appearance === "card" ? (
        <div className="flex items-center gap-2 pt-2">
          <Button disabled={form.isSubmitting || form.isLoadingSchema || form.isLoadingRecord} type="submit">
            {form.isSubmitting ? "Saving…" : submitLabel}
          </Button>
          {showReset ? (
            <Button
              disabled={form.isSubmitting}
              onClick={() => form.reset()}
              type="button"
              variant="outline"
            >
              {resetLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </form>
  )

  if (appearance === "modal") {
    return (
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-[var(--resource-surface)]">
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--resource-border)] px-6 py-5">
          {header}
          <Button onClick={onCancel} type="button" variant="ghost">
            Close
          </Button>
        </div>
        <div className="min-h-0 overflow-y-auto px-6 py-6">
          {body}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[color:var(--resource-border)] px-6 py-5">
          <Button onClick={onCancel} type="button" variant="ghost">
            {cancelLabel}
          </Button>
          <Button
            disabled={form.isSubmitting || form.isLoadingSchema || form.isLoadingRecord}
            onClick={() => {
              void form.submit()
            }}
            type="button"
          >
            {form.isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? `${recordId ? "Edit" : "Create"} ${tableName}`}</CardTitle>
        <CardDescription>
          {description ?? "Schema-aware form powered by lemma-sdk/react."}
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
