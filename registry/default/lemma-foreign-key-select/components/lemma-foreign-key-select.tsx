"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useForeignKeyOptions } from "lemma-sdk/react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { DATA_INPUT_CLASS_NAME } from "@/components/lemma/registry-data-workspace"

const EMPTY_VALUE = "__lemma_empty__"

export interface LemmaForeignKeySelectProps extends React.HTMLAttributes<HTMLDivElement> {
  client: LemmaClient
  podId?: string
  tableName: string
  columnName: string
  value?: string | null
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  allowEmpty?: boolean
  emptyLabel?: string
  labelField?: string
  labelFields?: string[]
  limit?: number
  search?: string
}

export const LemmaForeignKeySelect = React.forwardRef<HTMLDivElement, LemmaForeignKeySelectProps>(
  ({
    client,
    podId,
    tableName,
    columnName,
    value,
    onValueChange,
    placeholder = "Select an option",
    disabled,
    allowEmpty = true,
    emptyLabel = "None",
    labelField,
    labelFields,
    limit,
    search,
    className,
    ...props
  }, ref) => {
  const { options, isLoading, error } = useForeignKeyOptions({
    client,
    podId,
    tableName,
    columnName,
    labelField,
    labelFields,
    limit,
    search,
  })

  const resolvedValue = value && value.length > 0 ? value : EMPTY_VALUE
  const isDisabled = disabled || isLoading || !!error

  return (
    <div ref={ref} className={cn("", className)} {...props}>
      <Select
        disabled={isDisabled}
        value={resolvedValue}
        onValueChange={(nextValue) => onValueChange?.(nextValue === EMPTY_VALUE ? "" : nextValue)}
      >
        <SelectTrigger className={DATA_INPUT_CLASS_NAME}>
          <SelectValue
            placeholder={
              error
                ? "Failed to load options"
                : isLoading
                  ? "Loading options..."
                  : placeholder
            }
          />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty ? <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem> : null}
          {options.map((option) => {
            const optionValue = String(option.value)
            return (
              <SelectItem key={optionValue} value={optionValue}>
                {option.label}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
})
LemmaForeignKeySelect.displayName = "LemmaForeignKeySelect"
