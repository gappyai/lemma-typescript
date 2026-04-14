"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useRecordForm, useForeignKeyOptions } from "lemma-sdk/react"
import type { LemmaClient, Table, ColumnSchema } from "lemma-sdk"
import { typeBadgeClasses, enumPillClasses, isSystemField } from "./records-enum-utils"

interface RecordFormSheetProps {
  client: LemmaClient
  podId?: string
  tableName: string
  table: Table
  recordId?: string
  submitVia?: "direct" | "function"
  submitFunctionName?: string
  hiddenFields?: string[]
  fieldOrder?: string[]
  fieldGroups?: Array<{ label: string; fields: string[] }>
  mode?: "inline" | "modal" | "sheet"
  onClose: () => void
  onSuccess: () => void
}

export function RecordFormSheet({
  client,
  podId,
  tableName,
  table,
  recordId,
  submitVia = "direct",
  submitFunctionName,
  hiddenFields = [],
  fieldOrder,
  fieldGroups,
  mode = "sheet",
  onClose,
  onSuccess,
}: RecordFormSheetProps) {
  const form = useRecordForm({
    client,
    podId,
    tableName,
    recordId: recordId || null,
    hiddenFields: [...hiddenFields, "id", "created_at", "updated_at", "creator_user_id", "sort_order"],
    submitVia,
    submitFunctionName,
    onSubmitSuccess: () => onSuccess(),
  })

  const isEdit = !!recordId
  const title = isEdit ? "Edit Record" : "New Record"

  const orderedFields = React.useMemo(() => {
    let fields = form.editableFields
    if (fieldOrder) {
      const ordered = fieldOrder
        .map((n) => fields.find((f) => f.name === n))
        .filter((f): f is typeof fields[number] => f !== undefined)
      const remaining = fields.filter((f) => !fieldOrder.includes(f.name))
      fields = [...ordered, ...remaining]
    }
    return fields
  }, [form.editableFields, fieldOrder])

  const content = (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border/50 px-6 py-4">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{table.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {fieldGroups ? (
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
                        field={field}
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
                field={field}
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
      </div>

      <div className="shrink-0 border-t border-border/50 bg-muted/30 px-6 py-3">
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
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
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-lg p-0 gap-0">{content}</SheetContent>
      </Sheet>
    )
  }

  if (mode === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-xl border border-border/50 bg-card shadow-xl">
          {content}
        </div>
      </div>
    )
  }

  return <div className="rounded-xl border border-border/50 bg-card">{content}</div>
}

function FormField({
  field,
  value,
  error,
  onChange,
  client,
  podId,
  tableName,
}: {
  field: { name: string; label: string; kind: string; column: ColumnSchema; required?: boolean; options?: string[]; foreignKey?: unknown }
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
    columnName: field.name,
    enabled: field.kind === "foreign-key",
  })

  const label = field.label || field.name.replace(/_/g, " ")

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
          {field.required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        <span className={typeBadgeClasses(field.column)}>
          {field.kind === "foreign-key" ? "ref" : field.column.type.toLowerCase()}
        </span>
      </div>

      {renderInput(field, value, onChange, fkOptions.options)}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function renderInput(
  field: { name: string; kind: string; column: ColumnSchema; options?: string[] },
  value: unknown,
  onChange: (v: unknown) => void,
  fkOptions: Array<{ value: unknown; label: string }>,
): React.ReactNode {
  const strVal = value == null ? "" : String(value)
  const placeholder = field.name.replace(/_/g, " ")

  if (field.kind === "foreign-key" && fkOptions.length > 0) {
    return (
      <Select value={String(value ?? "")} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {fkOptions.map((opt) => (
            <SelectItem key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (field.kind === "select" && field.options?.length) {
    return (
      <Select value={strVal || undefined} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              <span className={enumPillClasses(opt, field.options!)}>{opt}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (field.kind === "boolean") {
    return (
      <div className="flex items-center gap-2 h-9">
        <Checkbox checked={Boolean(value)} onCheckedChange={(c) => onChange(c === true)} />
        <span className="text-sm text-muted-foreground">{value ? "Yes" : "No"}</span>
      </div>
    )
  }

  if (field.kind === "textarea") {
    return (
      <Textarea
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="resize-none border-border bg-background placeholder:text-muted-foreground focus-ring"
      />
    )
  }

  if (field.kind === "number") {
    return (
      <Input
        type="number"
        value={strVal}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="h-9 border-border bg-background placeholder:text-muted-foreground focus-ring"
      />
    )
  }

  if (field.kind === "date") {
    return (
      <Input
        type="date"
        value={strVal}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-9 border-border bg-background placeholder:text-muted-foreground focus-ring"
      />
    )
  }

  if (field.kind === "datetime") {
    return (
      <Input
        type="datetime-local"
        value={strVal}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-9 border-border bg-background placeholder:text-muted-foreground focus-ring"
      />
    )
  }

  if (field.kind === "json") {
    return (
      <Textarea
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="font-mono text-xs resize-none border-border bg-background placeholder:text-muted-foreground focus-ring"
        placeholder="{}"
      />
    )
  }

  return (
    <Input
      type="text"
      value={strVal}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 border-border bg-background placeholder:text-muted-foreground focus-ring"
      placeholder={placeholder}
    />
  )
}
