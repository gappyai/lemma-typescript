"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useRecordForm, useForeignKeyOptions } from "lemma-sdk/react"
import type { LemmaClient } from "lemma-sdk"

export interface LemmaRecordFormProps {
  client: LemmaClient
  podId?: string
  tableName: string
  recordId?: string

  mode?: "inline" | "modal" | "sheet"
  submitVia?: "direct" | "function"
  submitFunctionName?: string
  submitFunctionInput?: (payload: Record<string, unknown>) => Record<string, unknown>
  hiddenFields?: string[]
  visibleFields?: string[]
  fieldOrder?: string[]
  fieldGroups?: Array<{ label: string; fields: string[] }>

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
  submitVia = "direct",
  submitFunctionName,
  submitFunctionInput,
  hiddenFields = [],
  visibleFields,
  fieldOrder,
  fieldGroups,
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
      {(mode === "modal" || mode === "sheet") && (
        <div className="shrink-0 border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{tableName}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {form.isLoadingSchema ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading schema…
          </div>
        ) : fieldGroups ? (
          <div className="space-y-6">
            {fieldGroups.map((group, gi) => (
              <div key={gi}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {group.label}
                </p>
                <div className="space-y-4">
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
                      />
                    ))}
                </div>
                {gi < fieldGroups.length - 1 && <Separator className="mt-6 bg-border/30" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
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

      {(mode === "modal" || mode === "sheet") && (
        <div className="shrink-0 border-t border-border/50 bg-muted/30 px-6 py-3">
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
      )}
    </div>
  )

  if (mode === "sheet") {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose?.()}>
        <SheetContent className="w-full sm:max-w-lg p-0 gap-0">{inner}</SheetContent>
      </Sheet>
    )
  }

  if (mode === "modal") {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose?.()}>
        <DialogContent className="max-w-lg p-0 gap-0">{inner}</DialogContent>
      </Dialog>
    )
  }

  return <div className="rounded-xl border border-border/50 bg-card">{inner}</div>
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
}) {
  const fkOptions = useForeignKeyOptions({
    client,
    podId,
    tableName,
    columnName: name,
    enabled: kind === "foreign-key",
  })

  const displayLabel = label || name.replace(/_/g, " ")
  const strVal = value == null ? "" : String(value)

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

      {kind === "foreign-key" && fkOptions.options.length > 0 ? (
        <Select value={String(value ?? "")} onValueChange={(v) => onChange(v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {fkOptions.options.map((opt) => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : kind === "select" && options?.length ? (
        <Select value={strVal || undefined} onValueChange={(v) => onChange(v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
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
