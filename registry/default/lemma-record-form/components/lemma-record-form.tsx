"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useRecordForm, useForeignKeyOptions } from "lemma-sdk/react"
import type { LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"

export type LemmaRecordFormAppearance = "default" | "minimal" | "borderless" | "contained"
export type LemmaRecordFormDensity = "compact" | "comfortable" | "spacious"

export interface LemmaRecordFormProps {
  client: LemmaClient
  podId?: string
  tableName: string
  recordId?: string

  mode?: "inline" | "modal" | "sheet"
  appearance?: LemmaRecordFormAppearance
  density?: LemmaRecordFormDensity
  submitVia?: "direct" | "function"
  submitFunctionName?: string
  submitFunctionInput?: (payload: Record<string, unknown>) => Record<string, unknown>
  hiddenFields?: string[]
  visibleFields?: string[]
  fieldOrder?: string[]
  fieldGroups?: Array<{ label: string; fields: string[] }>
  foreignKeyLabels?: Record<string, string>

  initialValues?: Record<string, unknown>
  onSuccess?: (record: Record<string, unknown>) => void
  onClose?: () => void
}

export function LemmaRecordForm({
  client,
  podId,
  tableName,
  recordId,
  mode = "inline",
  appearance = "default",
  density = "comfortable",
  submitVia = "direct",
  submitFunctionName,
  submitFunctionInput,
  hiddenFields = [],
  visibleFields,
  fieldOrder,
  fieldGroups,
  foreignKeyLabels,
  initialValues,
  onSuccess,
  onClose,
}: LemmaRecordFormProps) {
  const form = useRecordForm({
    client,
    podId,
    tableName,
    recordId: recordId || null,
    hiddenFields: [...hiddenFields, "id", "created_at", "updated_at", "creator_user_id", "sort_order"],
    visibleFields,
    submitVia,
    submitFunctionName,
    submitFunctionInput,
    onSubmitSuccess: (record) => onSuccess?.(record),
    initialValues,
  })

  const isEdit = !!recordId
  const title = isEdit ? "Edit Record" : "New Record"

  const orderedFields = React.useMemo(() => {
    let fields = form.editableFields
    if (fieldOrder) {
      const ordered = fieldOrder.map((n) => fields.find((f) => f.name === n)).filter((f): f is typeof fields[number] => f !== undefined)
      const remaining = fields.filter((f) => !fieldOrder.includes(f.name))
      fields = [...ordered, ...remaining]
    }
    return fields
  }, [form.editableFields, fieldOrder])

  const inner = (
    <div className="flex h-full flex-col">
      {mode === "modal" && (
        <DialogHeader className={cn("shrink-0", formHeaderClassName(appearance, density))}>
          <DialogTitle className="text-lg font-semibold tracking-tight">{title}</DialogTitle>
          <DialogDescription>{tableName}</DialogDescription>
        </DialogHeader>
      )}

      {mode === "sheet" && (
        <SheetHeader className={cn("shrink-0", formHeaderClassName(appearance, density))}>
          <SheetTitle className="text-lg font-semibold tracking-tight">{title}</SheetTitle>
          <SheetDescription>{tableName}</SheetDescription>
        </SheetHeader>
      )}

      <div className={cn("flex-1 overflow-y-auto", formBodyClassName(density))}>
        {form.isLoadingSchema ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading schema…
          </div>
        ) : fieldGroups ? (
          <div className={cn("flex flex-col", density === "compact" ? "gap-4" : density === "spacious" ? "gap-7" : "gap-6")}>
            {fieldGroups.map((group, gi) => (
              <div key={gi}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {group.label}
                </p>
                <div className={cn("flex flex-col", density === "compact" ? "gap-3" : density === "spacious" ? "gap-5" : "gap-4")}>
                  {group.fields
                    .map((n) => orderedFields.find((f) => f.name === n))
                    .filter((f): f is typeof orderedFields[number] => f !== undefined)
                    .map((field) => (
                      <FormField
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        kind={field.kind}
                        column={field.column}
                        required={field.required}
                        options={field.options}
                        value={form.values[field.name]}
                        error={form.fieldErrors[field.name]}
                        onChange={(v) => form.setValue(field.name, v)}
                        client={client}
                        podId={podId}
                        tableName={tableName}
                        labelField={foreignKeyLabels?.[field.name]}
                      />
                    ))}
                </div>
                {gi < fieldGroups.length - 1 && <Separator className="mt-6 bg-border/30" />}
              </div>
            ))}
          </div>
        ) : (
          <div className={cn("flex flex-col", density === "compact" ? "gap-3" : density === "spacious" ? "gap-5" : "gap-4")}>
            {orderedFields.map((field) => (
              <FormField
                key={field.name}
                name={field.name}
                label={field.label}
                kind={field.kind}
                column={field.column}
                required={field.required}
                options={field.options}
                value={form.values[field.name]}
                error={form.fieldErrors[field.name]}
                onChange={(v) => form.setValue(field.name, v)}
                client={client}
                podId={podId}
                tableName={tableName}
                labelField={foreignKeyLabels?.[field.name]}
              />
            ))}
          </div>
        )}

        {form.error && (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {form.error.message}
          </p>
        )}
      </div>

      <div className={cn("shrink-0", formFooterClassName(appearance, density))}>
        <div className="flex items-center justify-end gap-3">
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            onClick={() => form.submit()}
            disabled={form.isSubmitting || form.isLoadingSchema}
          >
            {form.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  )

  if (mode === "sheet") {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose?.()}>
        <SheetContent className={cn("w-full sm:max-w-lg p-0 gap-0", formSurfaceClassName(appearance))}>{inner}</SheetContent>
      </Sheet>
    )
  }

  if (mode === "modal") {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose?.()}>
        <DialogContent className={cn("max-w-lg p-0 gap-0", formSurfaceClassName(appearance))}>{inner}</DialogContent>
      </Dialog>
    )
  }

  return <div className={cn(appearance === "minimal" ? "rounded-xl bg-transparent" : "rounded-xl bg-card", formSurfaceClassName(appearance))}>{inner}</div>
}

function formHeaderClassName(appearance: LemmaRecordFormAppearance, density: LemmaRecordFormDensity) {
  return cn(
    appearance === "borderless" ? "border-b-0" : appearance === "minimal" ? "border-b border-border/15" : "border-b border-border/50",
    density === "compact" ? "px-4 py-3" : density === "spacious" ? "px-7 py-5" : "px-6 py-4",
  )
}

function formBodyClassName(density: LemmaRecordFormDensity) {
  if (density === "compact") return "px-4 py-3"
  if (density === "spacious") return "px-7 py-6"
  return "px-6 py-4"
}

function formFooterClassName(appearance: LemmaRecordFormAppearance, density: LemmaRecordFormDensity) {
  return cn(
    appearance === "borderless"
      ? "border-t-0 bg-transparent"
      : appearance === "minimal"
        ? "border-t border-border/15 bg-transparent"
        : "border-t border-border/50 bg-muted/30",
    density === "compact" ? "px-4 py-2.5" : density === "spacious" ? "px-7 py-4" : "px-6 py-3",
  )
}

function formSurfaceClassName(appearance: LemmaRecordFormAppearance) {
  if (appearance === "borderless") return "border-0 shadow-none ring-0"
  if (appearance === "minimal") return "border-0 shadow-none ring-0"
  if (appearance === "contained") return "border border-border/70 shadow-sm"
  return "border border-border/50"
}

function FormField({
  name,
  label,
  kind,
  column,
  required,
  options,
  value,
  error,
  onChange,
  client,
  podId,
  tableName,
  labelField,
}: {
  name: string
  label: string
  kind: string
  column: import("lemma-sdk").ColumnSchema
  required?: boolean
  options?: string[]
  value: unknown
  error?: string
  onChange: (v: unknown) => void
  client: LemmaClient
  podId?: string
  tableName: string
  labelField?: string
}) {
  const fkOptions = useForeignKeyOptions({
    client,
    podId,
    tableName,
    columnName: name,
    labelField,
    enabled: kind === "foreign-key",
  })

  const displayLabel = label || name.replace(/_/g, " ")
  const strVal = value == null ? "" : String(value)
  const selectedForeignKeyLabel = fkOptions.options.find((opt) => String(opt.value) === strVal)?.label

  const typeTints: Record<string, { bg: string; text: string }> = {
    TEXT: { bg: "bg-muted/45", text: "text-muted-foreground" },
    INTEGER: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300" },
    FLOAT: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-300" },
    BOOLEAN: { bg: "bg-primary/10", text: "text-primary" },
    DATE: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-300" },
    DATETIME: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-300" },
    ENUM: { bg: "bg-violet-500/10", text: "text-violet-700 dark:text-violet-300" },
    JSON: { bg: "bg-rose-500/10", text: "text-rose-700 dark:text-rose-300" },
    UUID: { bg: "bg-sky-500/10", text: "text-sky-700 dark:text-sky-300" },
  }
  const tint = column.foreign_key
    ? { bg: "bg-sky-500/10", text: "text-sky-700 dark:text-sky-300" }
    : typeTints[column.type] ?? typeTints.TEXT

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {displayLabel}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        <span className={`rounded-full border border-border/50 ${tint.bg} px-1.5 py-0.5 text-[9px] font-medium normal-case ${tint.text}`}>
          {column.foreign_key ? "ref" : column.type.toLowerCase()}
        </span>
      </div>

      {kind === "foreign-key" ? (
        <Select value={String(value ?? "")} onValueChange={(v) => onChange(v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select…">
              {selectedForeignKeyLabel ?? (strVal ? shortenIdentifier(strVal) : undefined)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {fkOptions.options.map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : kind === "select" && options?.length ? (
        <Select value={strVal || undefined} onValueChange={(v) => onChange(v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : kind === "boolean" ? (
        <div className="flex items-center gap-2 h-9">
          <Checkbox checked={Boolean(value)} onCheckedChange={(c) => onChange(c === true)} />
          <span className="text-sm text-muted-foreground">{value ? "Yes" : "No"}</span>
        </div>
      ) : kind === "textarea" ? (
        <Textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="resize-none border-border bg-background placeholder:text-muted-foreground focus-ring"
        />
      ) : kind === "number" ? (
        <Input
          type="number"
          value={strVal}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className="h-9 border-border bg-background placeholder:text-muted-foreground focus-ring"
        />
      ) : kind === "date" ? (
        <Input
          type="date"
          value={strVal}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-9 border-border bg-background placeholder:text-muted-foreground focus-ring"
        />
      ) : kind === "datetime" ? (
        <Input
          type="datetime-local"
          value={strVal}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-9 border-border bg-background placeholder:text-muted-foreground focus-ring"
        />
      ) : kind === "json" ? (
        <Textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="font-mono text-xs resize-none border-border bg-background placeholder:text-muted-foreground focus-ring"
          placeholder="{}"
        />
      ) : (
        <Input
          type="text"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 border-border bg-background placeholder:text-muted-foreground focus-ring"
          placeholder={displayLabel}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function shortenIdentifier(value: unknown): string {
  const text = String(value ?? "")
  if (!text) return "—"
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) {
    return `${text.slice(0, 8)}…${text.slice(-4)}`
  }
  return text.length > 28 ? `${text.slice(0, 24)}…` : text
}
