"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LemmaFunctionRunHistory } from "@/components/lemma/lemma-function-run-history"
import { LemmaFunctionRunPanel } from "@/components/lemma/lemma-function-run-panel"
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

  return (
    <div ref={ref} className={cn("grid gap-4", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <Select value={selectedFunctionName} onValueChange={setSelectedFunctionName}>
            <SelectTrigger>
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
        </div>
      </Card>

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
        <Card>
          <CardHeader>
            <CardTitle>No Function Selected</CardTitle>
            <CardDescription>Pass functions or a functionName to render the runner.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
})
LemmaFunctionRunnerPage.displayName = "LemmaFunctionRunnerPage"
