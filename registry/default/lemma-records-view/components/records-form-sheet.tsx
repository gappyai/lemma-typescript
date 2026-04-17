"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { useRecordForm, useForeignKeyOptions } from "lemma-sdk/react"
import type { LemmaClient, Table, ColumnSchema } from "lemma-sdk"
import { typeBadgeClasses, enumPillClasses, isSystemField, type EnumColorMap } from "./records-enum-utils"
import { shortenIdentifier } from "./records-display-utils"
import {
  recordsRadiusClassName,
  type LemmaRecordsAppearance,
  type LemmaRecordsDensity,
  type LemmaRecordsRadius,
} from "./records-style-utils"
import { cn } from "@/lib/utils"

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
  foreignKeyLabels?: Record<string, string>
  enumColorMap?: EnumColorMap
  mode?: "inline" | "modal" | "sheet"
  appearance?: LemmaRecordsAppearance
  density?: LemmaRecordsDensity
  radius?: LemmaRecordsRadius
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
  foreignKeyLabels,
  enumColorMap,
  mode = "sheet",
  appearance = "default",
  density = "comfortable",
  radius = "lg",
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
      {mode === "modal" ? (
        <DialogHeader className={cn("shrink-0", formHeaderClassName(appearance, density))}>
          <DialogTitle className="text-lg font-semibold tracking-tight">{title}</DialogTitle>
          <DialogDescription>{table.name}</DialogDescription>
        </DialogHeader>
      ) : (
        <SheetHeader className={cn("shrink-0", formHeaderClassName(appearance, density))}>
          <SheetTitle className="text-lg font-semibold tracking-tight">{title}</SheetTitle>
          <SheetDescription>{table.name}</SheetDescription>
        </SheetHeader>
      )}

      <div className={cn("flex-1 overflow-y-auto", formBodyClassName(density))}>
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
                         labelField={foreignKeyLabels?.[field.name]}
                         enumColorMap={enumColorMap}
                         radius={radius}
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
                labelField={foreignKeyLabels?.[field.name]}
                enumColorMap={enumColorMap}
                radius={radius}
              />
            ))}
          </div>
        )}
      </div>

      <div className={cn("shrink-0", formFooterClassName(appearance, density))}>
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
        <SheetContent className={cn("w-full min-w-lg sm:max-w-xl lg:max-w-2xl p-0 gap-0", overlaySurfaceClassName(appearance, radius))}>{content}</SheetContent>
      </Sheet>
    )
  }

  if (mode === "modal") {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={cn("min-w-lg max-w-xl p-0 gap-0", overlaySurfaceClassName(appearance, radius))}>{content}</DialogContent>
      </Dialog>
    )
  }

  return <div className={cn("min-w-lg", appearance === "minimal" ? "bg-transparent" : "bg-card", overlaySurfaceClassName(appearance, radius))}>{content}</div>
}

function formHeaderClassName(appearance: LemmaRecordsAppearance, density: LemmaRecordsDensity) {
  return cn(
    appearance === "borderless" ? "border-b-0" : appearance === "minimal" ? "border-b border-border/15" : "border-b border-border/50",
    density === "compact" ? "px-4 py-3" : density === "spacious" ? "px-7 py-5" : "px-6 py-4",
  )
}

function formBodyClassName(density: LemmaRecordsDensity) {
  if (density === "compact") return "px-4 py-3"
  if (density === "spacious") return "px-7 py-6"
  return "px-6 py-4"
}

function formFooterClassName(appearance: LemmaRecordsAppearance, density: LemmaRecordsDensity) {
  return cn(
    appearance === "borderless"
      ? "border-t-0 bg-transparent"
      : appearance === "minimal"
        ? "border-t border-border/15 bg-transparent"
        : "border-t border-border/50 bg-muted/30",
    density === "compact" ? "px-4 py-2.5" : density === "spacious" ? "px-7 py-4" : "px-6 py-3",
  )
}

function overlaySurfaceClassName(appearance: LemmaRecordsAppearance, radius: LemmaRecordsRadius) {
  const radiusClassName = recordsRadiusClassName(radius, "overlay")
  if (appearance === "borderless") return cn(radiusClassName, "border-0 shadow-xl ring-0")
  if (appearance === "minimal") return cn(radiusClassName, "border-0 shadow-none ring-0")
  if (appearance === "contained") return cn(radiusClassName, "border-border/70 shadow-xl")
  return cn(radiusClassName, "border-border/50")
}

function FormField({
  field,
  value,
  error,
  onChange,
  client,
  podId,
  tableName,
  labelField,
  enumColorMap,
  radius,
}: {
  field: { name: string; label: string; kind: string; column: ColumnSchema; required?: boolean; options?: string[]; foreignKey?: unknown }
  value: unknown
  error?: string
  onChange: (v: unknown) => void
  client: LemmaClient
  podId?: string
  tableName: string
  labelField?: string
  enumColorMap?: EnumColorMap
  radius: LemmaRecordsRadius
}) {
  const fkOptions = useForeignKeyOptions({
    client,
    podId,
    tableName,
    columnName: field.name,
    labelField,
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

      {renderInput(field, value, onChange, fkOptions.options, radius, enumColorMap)}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function renderInput(
  field: { name: string; kind: string; column: ColumnSchema; options?: string[] },
  value: unknown,
  onChange: (v: unknown) => void,
  fkOptions: Array<{ value: unknown; label: string }>,
  radius: LemmaRecordsRadius,
  enumColorMap?: EnumColorMap,
): React.ReactNode {
  const strVal = value == null ? "" : String(value)
  const placeholder = field.name.replace(/_/g, " ")

  if (field.kind === "foreign-key") {
    const selectedLabel = fkOptions.find((opt) => String(opt.value) === strVal)?.label
    return (
      <SearchableValueSelect
        value={strVal}
        selectedLabel={selectedLabel}
        options={fkOptions}
        placeholder="Select…"
        searchPlaceholder={`Search ${placeholder.toLowerCase()}...`}
        radius={radius}
        onChange={(nextValue) => onChange(nextValue || null)}
      />
    )
  }

  if (field.kind === "select" && field.options?.length) {
    return (
      <Select value={strVal || undefined} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className={cn("h-9", recordsRadiusClassName(radius, "control"))}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                <span className={enumPillClasses(opt, field.options!, enumColorMap)}>{opt}</span>
              </SelectItem>
            ))}
          </SelectGroup>
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
        className={cn("resize-none border-border bg-background placeholder:text-muted-foreground focus-ring", recordsRadiusClassName(radius, "control"))}
      />
    )
  }

  if (field.kind === "number") {
    return (
      <Input
        type="number"
        value={strVal}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className={cn("h-9 border-border bg-background placeholder:text-muted-foreground focus-ring", recordsRadiusClassName(radius, "control"))}
      />
    )
  }

  if (field.kind === "date") {
    return (
      <Input
        type="date"
        value={strVal}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn("h-9 border-border bg-background placeholder:text-muted-foreground focus-ring", recordsRadiusClassName(radius, "control"))}
      />
    )
  }

  if (field.kind === "datetime") {
    return (
      <Input
        type="datetime-local"
        value={strVal}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn("h-9 border-border bg-background placeholder:text-muted-foreground focus-ring", recordsRadiusClassName(radius, "control"))}
      />
    )
  }

  if (field.kind === "json") {
    return (
      <Textarea
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={cn("font-mono text-xs resize-none border-border bg-background placeholder:text-muted-foreground focus-ring", recordsRadiusClassName(radius, "control"))}
        placeholder="{}"
      />
    )
  }

  return (
    <Input
      type="text"
      value={strVal}
      onChange={(e) => onChange(e.target.value)}
        className={cn("h-9 border-border bg-background placeholder:text-muted-foreground focus-ring", recordsRadiusClassName(radius, "control"))}
      placeholder={placeholder}
    />
  )
}

function SearchableValueSelect({
  value,
  selectedLabel,
  options,
  placeholder,
  searchPlaceholder,
  radius,
  onChange,
}: {
  value: string
  selectedLabel?: string
  options: Array<{ value: unknown; label: string }>
  placeholder: string
  searchPlaceholder: string
  radius: LemmaRecordsRadius
  onChange: (value: string | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const filteredOptions = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => option.label.toLowerCase().includes(needle) || String(option.value).toLowerCase().includes(needle))
  }, [options, query])

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setQuery("")
      }}
    >
      <PopoverTrigger
        type="button"
        className={cn(
          "inline-flex h-9 w-full items-center justify-between gap-3 border border-border bg-background px-3 text-sm transition-colors hover:bg-muted",
          recordsRadiusClassName(radius, "control"),
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {selectedLabel ?? (value ? shortenIdentifier(value) : <span className="text-muted-foreground">{placeholder}</span>)}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-[var(--radix-popper-anchor-width)] min-w-72 p-0", recordsRadiusClassName(radius, "surface"))}>
        <div className="border-b border-border/40 p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className={cn("h-8 pl-8 text-xs", recordsRadiusClassName(radius, "control"))}
            />
          </div>
        </div>
        <div className="max-h-72 overflow-auto p-1">
          {value ? (
            <button
              type="button"
              className={cn("flex w-full items-center gap-2 px-2 py-2 text-left text-sm text-muted-foreground hover:bg-muted/45", recordsRadiusClassName(radius, "control"))}
              onClick={() => {
                onChange(null)
                setOpen(false)
                setQuery("")
              }}
            >
              <X className="size-4" />
              Clear selection
            </button>
          ) : null}
          {filteredOptions.length === 0 ? (
            <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">
              No options found
            </div>
          ) : (
            filteredOptions.map((option) => {
              const selected = String(option.value) === value
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  className={cn("flex w-full items-center gap-2 px-2 py-2 text-left text-sm hover:bg-muted/45", recordsRadiusClassName(radius, "control"), selected ? "bg-muted/60" : null)}
                  onClick={() => {
                    onChange(String(option.value))
                    setOpen(false)
                    setQuery("")
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {selected ? <Check className="size-4 text-primary" /> : null}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
