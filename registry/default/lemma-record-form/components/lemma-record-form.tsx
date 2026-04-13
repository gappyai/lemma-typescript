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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? `${recordId ? "Edit" : "Create"} ${tableName}`}</CardTitle>
        <CardDescription>
          {description ?? "Schema-aware form powered by lemma-sdk/react."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
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
            const commonLabel = (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required ? " *" : ""}
                </Label>
                {field.column.description ? (
                  <p className="text-sm text-[color:var(--resource-muted)]">{field.column.description}</p>
                ) : null}
              </div>
            )

            if (field.kind === "boolean") {
              return (
                <div key={field.name} className="grid gap-2 rounded-lg border border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] p-3">
                  {commonLabel}
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={Boolean(value)}
                      onCheckedChange={(checked) => form.setValue(field.name, checked === true)}
                    />
                    <span>{Boolean(value) ? "Enabled" : "Disabled"}</span>
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

          <div className="flex items-center gap-2 pt-2">
            <Button disabled={form.isSubmitting || form.isLoadingSchema || form.isLoadingRecord} type="submit">
              {form.isSubmitting ? "Saving…" : submitLabel}
            </Button>
            <Button
              disabled={form.isSubmitting}
              onClick={() => form.reset()}
              type="button"
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
