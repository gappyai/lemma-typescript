"use client"

import * as React from "react"
import type { JsonSchemaLike } from "lemma-sdk"
import { useSchemaForm } from "lemma-sdk/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DATA_PANEL_SECTION_CLASS_NAME,
  DATA_INPUT_CLASS_NAME,
  DATA_FIELD_LABEL_CLASS_NAME,
  DATA_TYPE_BADGE_CLASS_NAME,
  DataWorkspaceHeader,
  DataWorkspaceState,
  dataWorkspaceTypeBadgeClassName,
} from "@/components/lemma/registry-data-workspace"
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

function schemaFieldType(kind: string): string {
  if (kind === "select") return "select"
  if (kind === "boolean") return "boolean"
  if (kind === "json") return "json"
  if (kind === "number") return "number"
  if (kind === "date") return "date"
  if (kind === "datetime") return "datetime"
  if (kind === "email") return "text"
  return "text"
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
  const visibleFields = form.fields.filter((field) => !hiddenFields.includes(field.name))

  const handleSubmit = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await form.submit()
  }, [form])

  const meta = hasFields ? (
    <Badge
      className={cn(DATA_TYPE_BADGE_CLASS_NAME, "border-border/70 bg-background/70 text-muted-foreground")}
      variant="outline"
    >
      {visibleFields.length} field{visibleFields.length === 1 ? "" : "s"}
    </Badge>
  ) : null

  return (
    <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
      <div className={DATA_PANEL_HEADER_CLASS_NAME}>
        <DataWorkspaceHeader
          description={description}
          meta={meta}
          title={title}
        />
      </div>
      <div className={DATA_PANEL_CONTENT_CLASS_NAME}>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          {form.error ? (
            <DataWorkspaceState description={form.error.message} heading="Submission failed" tone="danger" />
          ) : null}

          {!hasFields ? (
            <DataWorkspaceState description="This schema does not define any editable fields." />
          ) : null}

          {visibleFields.map((field) => {
            const value = form.values[field.name]
            const error = form.fieldErrors[field.name]
            const resolvedLabel = fieldLabels?.[field.name] ?? field.label
            const resolvedDescription = fieldDescriptions?.[field.name] ?? field.description
            const fieldBadge = (
              <Badge
                className={cn(DATA_TYPE_BADGE_CLASS_NAME, dataWorkspaceTypeBadgeClassName(schemaFieldType(field.kind)))}
                variant="outline"
              >
                {field.kind}
              </Badge>
            )
            const fieldLabel = (
              <div className="flex flex-wrap items-center gap-3">
                <Label className={DATA_FIELD_LABEL_CLASS_NAME} htmlFor={field.name}>
                  {resolvedLabel}
                  {field.required ? " *" : ""}
                </Label>
                {fieldBadge}
              </div>
            )

            if (field.kind === "boolean") {
              return (
                <div key={field.name} className={cn(DATA_PANEL_SECTION_CLASS_NAME, "grid gap-3 p-4")}>
                  {fieldLabel}
                  {resolvedDescription ? (
                    <p className="text-sm leading-6 text-muted-foreground">{resolvedDescription}</p>
                  ) : null}
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={Boolean(value)}
                      onCheckedChange={(checked) => form.setValue(field.name, checked === true)}
                    />
                    <span className="font-medium text-foreground">{Boolean(value) ? "Enabled" : "Disabled"}</span>
                  </label>
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                </div>
              )
            }

            if (field.kind === "select") {
              return (
                <div key={field.name} className="grid gap-2">
                  {fieldLabel}
                  {resolvedDescription ? (
                    <p className="text-sm leading-6 text-muted-foreground">{resolvedDescription}</p>
                  ) : null}
                  <Select
                    value={typeof value === "string" ? value : ""}
                    onValueChange={(nextValue) => form.setValue(field.name, nextValue)}
                  >
                    <SelectTrigger className={cn(DATA_INPUT_CLASS_NAME, "h-12")} id={field.name}>
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
                  {fieldLabel}
                  {resolvedDescription ? (
                    <p className="text-sm leading-6 text-muted-foreground">{resolvedDescription}</p>
                  ) : null}
                  <Textarea
                    className="min-h-24 rounded-xl border-border/70 bg-background px-4 py-3 text-sm shadow-sm"
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
                {fieldLabel}
                {resolvedDescription ? (
                  <p className="text-sm leading-6 text-muted-foreground">{resolvedDescription}</p>
                ) : null}
                <Input
                  className={cn(DATA_INPUT_CLASS_NAME, "h-12 px-4 text-sm")}
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

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-5">
            {showReset ? (
              <Button
                className="rounded-xl"
                disabled={disabled || form.isSubmitting}
                onClick={() => form.reset()}
                type="button"
                variant="outline"
              >
                {resetLabel}
              </Button>
            ) : null}
            <Button
              className="rounded-xl"
              disabled={disabled || form.isSubmitting}
              type="submit"
            >
              {form.isSubmitting ? "Submitting\u2026" : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
})
LemmaSchemaForm.displayName = "LemmaSchemaForm"
