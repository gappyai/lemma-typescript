"use client"

import * as React from "react"
import type { JsonSchemaLike } from "lemma-sdk"
import { useSchemaForm } from "lemma-sdk/react"
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

export interface LemmaSchemaFormProps {
  schema?: JsonSchemaLike | null
  uiSchema?: Record<string, unknown> | null
  initialValues?: Record<string, unknown>
  title?: string
  description?: string
  submitLabel?: string
  disabled?: boolean
  onSubmit?: (data: Record<string, unknown>) => Promise<unknown> | unknown
  onSubmitted?: (data: Record<string, unknown>) => void
}

export function LemmaSchemaForm({
  schema,
  uiSchema,
  initialValues,
  title = "Schema Form",
  description = "Generated from JSON Schema.",
  submitLabel = "Submit",
  disabled = false,
  onSubmit,
  onSubmitted,
}: LemmaSchemaFormProps) {
  const form = useSchemaForm({
    schema,
    uiSchema,
    initialValues,
    onSubmit: async (data) => {
      await onSubmit?.(data)
      onSubmitted?.(data)
    },
  })

  const hasFields = form.fields.length > 0

  const handleSubmit = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await form.submit()
  }, [form])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {form.error ? (
            <div className="rounded-md border border-[color:var(--resource-danger-border)] bg-[var(--resource-danger-soft)] px-3 py-2 text-sm text-[color:var(--resource-danger)]">
              {form.error.message}
            </div>
          ) : null}

          {!hasFields ? (
            <div className="rounded-md border border-dashed border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-6 text-sm text-[color:var(--resource-muted)]">
              This schema does not define any editable fields.
            </div>
          ) : null}

          {form.fields.map((field) => {
            const value = form.values[field.name]
            const error = form.fieldErrors[field.name]
            const commonLabel = (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required ? " *" : ""}
                </Label>
                {field.description ? (
                  <p className="text-sm text-[color:var(--resource-muted)]">{field.description}</p>
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
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                          : field.kind === "email"
                            ? "email"
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
            <Button disabled={disabled || form.isSubmitting} type="submit">
              {form.isSubmitting ? "Submitting…" : submitLabel}
            </Button>
            <Button
              disabled={disabled || form.isSubmitting}
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
