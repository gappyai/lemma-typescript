"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { ColumnSchema, RecordFilter } from "lemma-sdk"

interface FilterBuilderProps {
  columns: ColumnSchema[]
  filters: RecordFilter[]
  onApply: (filters: RecordFilter[]) => void
  onClose: () => void
}

const OPERATORS = [
  { value: "eq", label: "is" },
  { value: "ne", label: "is not" },
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "ilike", label: "contains" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
  { value: "in", label: "in" },
  { value: "is", label: "is empty" },
  { value: "is not", label: "is not empty" },
] as const

function blank(columns: ColumnSchema[]): RecordFilter {
  return { field: columns[0]?.name ?? "", op: "eq", value: "" }
}

export function FilterBuilder({ columns, filters, onApply, onClose }: FilterBuilderProps) {
  const [rows, setRows] = React.useState<RecordFilter[]>(
    filters.length > 0 ? filters : [blank(columns)],
  )

  const update = <K extends keyof RecordFilter>(idx: number, key: K, val: RecordFilter[K]) => {
    setRows((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [key]: val }
      if (key === "field") {
        const col = columns.find((c) => c.name === val)
        if (col?.options?.length) next[idx] = { ...next[idx], op: "eq", value: "" }
      }
      return next
    })
  }

  const remove = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx))

  const add = () => setRows((prev) => [...prev, blank(columns)])

  const apply = () => {
    onApply(
      rows.filter(
        (r) =>
          r.field &&
          (r.op === "is" || r.op === "is not" || String(r.value ?? "").trim() !== ""),
      ),
    )
    onClose()
  }

  const selectClass =
    "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground hover:border-foreground/20 focus-ring"

  const inputClass =
    "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground hover:border-foreground/20 focus-ring"

  const currentColumn = (field: string) => columns.find((c) => c.name === field)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden border-border/60 bg-background p-0">
        <div className="border-b border-border/50 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Filter Records
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest text-muted-foreground">
              Refine your view by adding conditions
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-6">
          {rows.map((row, idx) => {
            const col = currentColumn(row.field)
            const needsValue = row.op !== "is" && row.op !== "is not"
            return (
              <div key={idx} className="group flex items-center gap-2">
                <div className="grid flex-1 grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <select
                      value={row.field}
                      onChange={(e) => update(idx, "field", e.target.value)}
                      className={selectClass}
                    >
                      {columns.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <select
                      value={row.op}
                      onChange={(e) => update(idx, "op", e.target.value)}
                      className={selectClass}
                    >
                      {OPERATORS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-5">
                    {needsValue && col?.type === "ENUM" && col.options ? (
                      <select
                        value={String(row.value ?? "")}
                        onChange={(e) => update(idx, "value", e.target.value)}
                        className={selectClass}
                      >
                        <option value="">—</option>
                        {col.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : needsValue && col?.type === "BOOLEAN" ? (
                      <select
                        value={String(row.value ?? "")}
                        onChange={(e) => update(idx, "value", e.target.value === "true")}
                        className={selectClass}
                      >
                        <option value="">—</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : needsValue ? (
                      <Input
                        value={String(row.value ?? "")}
                        onChange={(e) => update(idx, "value", e.target.value)}
                        placeholder="Value"
                        className={inputClass}
                      />
                    ) : (
                      <div className={inputClass + " flex items-center text-muted-foreground"}>
                        —
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => remove(idx)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={add}
            className="w-full border border-dashed border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Condition
          </Button>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/50 bg-muted/30 px-6 py-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={apply}>Apply Filters</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
