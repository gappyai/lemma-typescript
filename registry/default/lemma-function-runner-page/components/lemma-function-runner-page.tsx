"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LemmaFunctionRunHistory } from "@/components/lemma/lemma-function-run-history"
import { LemmaFunctionRunPanel } from "@/components/lemma/lemma-function-run-panel"
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DATA_INPUT_CLASS_NAME,
  DataWorkspaceHeader,
  DataWorkspaceState,
} from "@/components/lemma/registry-data-workspace"
import { cn } from "@/lib/utils"

export interface LemmaFunctionSummary {
  name: string
  input_schema?: Record<string, unknown> | null
}

export interface LemmaFunctionRunnerPageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError"> {
  client: LemmaClient
  podId?: string
  functions?: LemmaFunctionSummary[]
  functionName?: string
  onFunctionNameChange?: (functionName: string) => void
  title?: string
  description?: string
  onError?: (error: Error) => void
}

export const LemmaFunctionRunnerPage = React.forwardRef<HTMLDivElement, LemmaFunctionRunnerPageProps>(
  ({
    client,
    podId,
    functions = [],
    functionName,
    onFunctionNameChange,
    title = "Function Runner",
    description = "Choose a function, run it, and inspect recent run history.",
    onError,
    className,
    ...props
  }, ref) => {
  const [internalFunctionName, setInternalFunctionName] = React.useState(functionName ?? functions[0]?.name ?? "")
  const selectedFunctionName = functionName ?? internalFunctionName
  const selectedFunction = functions.find((item) => item.name === selectedFunctionName) ?? null

  React.useEffect(() => {
    if (functionName) return
    setInternalFunctionName((current) => (
      current && functions.some((item) => item.name === current) ? current : (functions[0]?.name ?? "")
    ))
  }, [functionName, functions])

  const setSelectedFunctionName = React.useCallback((nextFunctionName: string) => {
    if (!functionName) setInternalFunctionName(nextFunctionName)
    onFunctionNameChange?.(nextFunctionName)
  }, [functionName, onFunctionNameChange])

  const selectorActions = (
    <Select value={selectedFunctionName} onValueChange={setSelectedFunctionName}>
      <SelectTrigger className={cn(DATA_INPUT_CLASS_NAME, "min-w-[240px]")}>
        <SelectValue placeholder="Select a function" />
      </SelectTrigger>
      <SelectContent>
        {functions.map((item) => (
          <SelectItem key={item.name} value={item.name}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div ref={ref} className={cn("grid gap-4", className)} {...props}>
      <div className={DATA_PANEL_CARD_CLASS_NAME}>
        <div className={DATA_PANEL_HEADER_CLASS_NAME}>
          <DataWorkspaceHeader actions={selectorActions} description={description} title={title} />
        </div>
      </div>

      {selectedFunctionName ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <LemmaFunctionRunPanel
            client={client}
            functionName={selectedFunctionName}
            inputSchema={selectedFunction?.input_schema ?? null}
            onError={onError}
            podId={podId}
          />
          <LemmaFunctionRunHistory
            client={client}
            functionName={selectedFunctionName}
            podId={podId}
          />
        </div>
      ) : (
        <div className={DATA_PANEL_CARD_CLASS_NAME}>
          <div className={DATA_PANEL_HEADER_CLASS_NAME}>
            <DataWorkspaceHeader description="Pass functions or a functionName to render the runner." title="No Function Selected" />
          </div>
          <div className={DATA_PANEL_CONTENT_CLASS_NAME}>
            <DataWorkspaceState description="Select a function from the list above to get started." />
          </div>
        </div>
      )}
    </div>
  )
})
LemmaFunctionRunnerPage.displayName = "LemmaFunctionRunnerPage"
