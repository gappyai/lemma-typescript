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
import { cn } from "@/lib/utils"

export interface LemmaSchemaFormProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  schema?: JsonSchemaLike | null
  uiSchema?: Record<string, unknown> | null
  initialValues?: Record<string, unknown>
  title?: string
  description?: string
  submitLabel?: string
  disabled?: boolean
  onSubmit?: (data: Record<string, unknown>) => Promise<void> | void
  onSubmitted?: (data: Record<string, unknown>) => void
  showReset?: boolean
  resetLabel?: string
  hiddenFields?: string[]
  fieldLabels?: Record<string, string>
  fieldDescriptions?: Record<string, string>
}

export const LemmaSchemaForm = React.forwardRef<HTMLDivElement, LemmaSchemaFormProps>(
  ({
    schema,
    uiSchema,
    initialValues,
    title = "Schema Form",
    description = "Generated from JSON Schema.",
    submitLabel = "Submit",
    disabled = false,
    onSubmit,
    onSubmitted,
    showReset = true,
    resetLabel = "Reset",
    hiddenFields = [],
    fieldLabels,
    fieldDescriptions,
    className,
    ...props
  }, ref) => {
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
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {form.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {form.error.message}
            </div>
          ) : null}

          {!hasFields ? (
            <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
              This schema does not define any editable fields.
            </div>
          ) : null}

          {form.fields
            .filter((field) => !hiddenFields.includes(field.name))
            .map((field) => {
            const value = form.values[field.name]
            const error = form.fieldErrors[field.name]
            const resolvedLabel = fieldLabels?.[field.name] ?? field.label
            const resolvedDescription = fieldDescriptions?.[field.name] ?? field.description
            const commonLabel = (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>
                  {resolvedLabel}
                  {field.required ? " *" : ""}
                </Label>
                {resolvedDescription ? (
                  <p className="text-sm text-muted-foreground">{resolvedDescription}</p>
                ) : null}
              </div>
            )

            if (field.kind === "boolean") {
              return (
                <div key={field.name} className="grid gap-2 rounded-lg border border-border bg-muted/30 p-4">
                  {commonLabel}
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={Boolean(value)}
                      onCheckedChange={(checked) => form.setValue(field.name, checked === true)}
                    />
                    <span>{Boolean(value) ? "Enabled" : "Disabled"}</span>
                  </label>
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>
            )
          })}

          <div className="flex items-center gap-2 pt-2">
            <Button disabled={disabled || form.isSubmitting} type="submit">
              {form.isSubmitting ? "Submitting…" : submitLabel}
            </Button>
            {showReset ? (
              <Button
                disabled={disabled || form.isSubmitting}
                onClick={() => form.reset()}
                type="button"
                variant="outline"
              >
                {resetLabel}
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
})
LemmaSchemaForm.displayName = "LemmaSchemaForm"
