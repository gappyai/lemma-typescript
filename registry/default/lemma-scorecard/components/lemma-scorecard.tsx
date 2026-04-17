"use client"

import * as React from "react"
import {
  ClipboardCheck,
  Loader2,
  RefreshCw,
  Star,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  useReferencingRecords,
  useTable,
} from "lemma-sdk/react"
import type { LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { enumPillClasses, type EnumColorMap } from "./scorecard-enum-utils"
import {
  scorecardRadiusClassName,
  type LemmaScorecardAppearance,
  type LemmaScorecardDensity,
  type LemmaScorecardRadius,
} from "./scorecard-style-utils"

export type {
  LemmaScorecardAppearance,
  LemmaScorecardDensity,
  LemmaScorecardRadius,
} from "./scorecard-style-utils"
export type { EnumColorMap, EnumColorEntry } from "./scorecard-enum-utils"

export interface ScoreCriteria {
  label: string
  description?: string
  maxScore: number
  weight?: number
}

const RECOMMENDATION_OPTIONS = ["Strong Yes", "Yes", "No", "Strong No"] as const

export interface LemmaScorecardProps {
  client: LemmaClient
  podId?: string
  tableName: string
  foreignKey: string
  recordId: string
  enabled?: boolean

  criteria: ScoreCriteria[]
  scoreField: string
  notesField?: string
  overallScoreField?: string
  recommendationField?: string
  submitVia?: "direct" | "function"
  submitFunctionName?: string
  enumColorMap?: EnumColorMap

  appearance?: LemmaScorecardAppearance
  density?: LemmaScorecardDensity
  radius?: LemmaScorecardRadius
  title?: React.ReactNode
  className?: string
}

export function LemmaScorecard({
  client,
  podId,
  tableName,
  foreignKey,
  recordId,
  enabled = true,
  criteria,
  scoreField,
  notesField,
  overallScoreField,
  recommendationField,
  submitVia = "direct",
  submitFunctionName,
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  className,
}: LemmaScorecardProps) {
  const [scores, setScores] = React.useState<number[]>(() => criteria.map(() => 0))
  const [notes, setNotes] = React.useState<string[]>(() => criteria.map(() => ""))
  const [recommendation, setRecommendation] = React.useState<string>("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<Error | null>(null)
  const [initialized, setInitialized] = React.useState(false)

  const scopedClient = React.useMemo(
    () => (podId ? client.withPod(podId) : client),
    [client, podId],
  )

  const tableState = useTable({ client, podId, tableName, enabled })
  const referencingState = useReferencingRecords({
    client,
    podId,
    table: tableName,
    foreignKey,
    recordId,
    enabled: enabled && !!recordId,
  })

  const records = referencingState.records
  const isLoading = referencingState.isLoading || tableState.isLoading
  const error = referencingState.error || tableState.error

  React.useEffect(() => {
    if (initialized || isLoading || records.length === 0) return
    const nextScores = [...scores]
    const nextNotes = [...notes]
    const primaryKeyColumn = tableState.table?.primary_key_column ?? "id"
    records.forEach((record, index) => {
      if (index >= criteria.length) return
      const rawScore = record[scoreField]
      if (rawScore != null) {
        const num = Number(rawScore)
        if (!Number.isNaN(num)) nextScores[index] = num
      }
      if (notesField) {
        const rawNote = record[notesField]
        if (rawNote != null) nextNotes[index] = String(rawNote)
      }
      if (index === 0) {
        if (overallScoreField && record[overallScoreField] != null) {
          // overallScoreField is read-only display
        }
        if (recommendationField && record[recommendationField] != null) {
          setRecommendation(String(record[recommendationField]))
        }
      }
    })
    setScores(nextScores)
    setNotes(nextNotes)
    setInitialized(true)
  }, [records, isLoading, initialized, criteria.length, scoreField, notesField, overallScoreField, recommendationField, tableState.table, scores, notes])

  const weightedAverage = React.useMemo(() => {
    let totalWeight = 0
    let weightedSum = 0
    criteria.forEach((c, i) => {
      const w = c.weight ?? 1
      totalWeight += w
      weightedSum += (scores[i] ?? 0) * w
    })
    if (totalWeight === 0) return 0
    return weightedSum / totalWeight
  }, [criteria, scores])

  const maxPossibleScore = React.useMemo(() => {
    let totalWeight = 0
    let weightedSum = 0
    criteria.forEach((c) => {
      const w = c.weight ?? 1
      totalWeight += w
      weightedSum += c.maxScore * w
    })
    if (totalWeight === 0) return 1
    return weightedSum / totalWeight
  }, [criteria])

  const handleSubmit = React.useCallback(async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const primaryKeyColumn = tableState.table?.primary_key_column ?? "id"
      const payload: Record<string, unknown> = {
        criteria: criteria.map((c, i) => ({
          label: c.label,
          score: scores[i],
          maxScore: c.maxScore,
          weight: c.weight ?? 1,
          ...(notesField && notes[i] ? { notes: notes[i] } : {}),
        })),
        overallScore: weightedAverage,
        recommendation,
        [foreignKey]: recordId,
      }

      if (submitVia === "function") {
        const functionName = submitFunctionName ?? tableName
        await scopedClient.functions.runs.create(functionName, { input: payload })
      } else {
        for (let i = 0; i < criteria.length; i++) {
          const data: Record<string, unknown> = {
            [scoreField]: scores[i],
            [foreignKey]: recordId,
          }
          if (notesField) {
            data[notesField] = notes[i]
          }
          if (i === 0) {
            if (overallScoreField) data[overallScoreField] = weightedAverage
            if (recommendationField) data[recommendationField] = recommendation
          }
          const existingRecord = records[i]
          const existingId = existingRecord ? String(existingRecord[primaryKeyColumn] ?? "") : ""
          if (existingId) {
            await scopedClient.records.update(tableName, existingId, data)
          } else {
            await scopedClient.records.create(tableName, data)
          }
        }
      }
      referencingState.refresh()
    } catch (err) {
      setSubmitError(err instanceof Error ? err : new Error("Failed to submit scorecard."))
    } finally {
      setIsSubmitting(false)
    }
  }, [
    criteria,
    scores,
    notes,
    notesField,
    scoreField,
    foreignKey,
    recordId,
    overallScoreField,
    recommendationField,
    weightedAverage,
    recommendation,
    submitVia,
    submitFunctionName,
    tableName,
    scopedClient,
    records,
    tableState.table,
    referencingState,
  ])

  const handleScoreChange = React.useCallback((index: number, value: number) => {
    setScores((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  const handleNoteChange = React.useCallback((index: number, value: string) => {
    setNotes((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  const hasAnyScore = scores.some((s) => s > 0)

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-scorecard flex flex-col", rootClassName(appearance), className)}
    >
      <div className={cn("shrink-0", headerClassName(appearance))}>
        <div className={cn("flex items-center justify-between", toolbarClassName(density))}>
          <div className="min-w-0 flex items-center gap-3">
            <span
              className={cn(
                "flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground",
                scorecardRadiusClassName(radius, "control"),
              )}
            >
              <ClipboardCheck className="size-3.5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-semibold text-foreground">
                  {title ?? "Scorecard"}
                </h1>
                {criteria.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] font-medium">
                    {criteria.length} criteria
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => referencingState.refresh()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-auto", contentClassName(density))}>
        {error ? (
          <div className="flex min-h-36 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => referencingState.refresh()}>
              <RefreshCw className="mr-2 size-3.5" />
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : criteria.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center gap-3 text-center">
            <div
              className={cn(
                "flex size-10 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground",
                scorecardRadiusClassName(radius, "pill"),
              )}
            >
              <ClipboardCheck className="size-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">No criteria defined</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add criteria to begin scoring.
              </p>
            </div>
          </div>
        ) : (
          <div className={cn("flex flex-col", criteriaGapClassName(density))}>
            {criteria.map((criterion, index) => (
              <div
                key={criterion.label}
                className={cn(
                  "border border-border/40 bg-card/50 p-3",
                  scorecardRadiusClassName(radius, "surface"),
                  density === "compact" ? "p-2.5" : density === "spacious" ? "p-4" : "p-3",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-foreground">
                        {criterion.label}
                      </Label>
                      {criterion.weight != null && criterion.weight !== 1 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium tabular-nums"
                        >
                          ×{criterion.weight}
                        </Badge>
                      )}
                    </div>
                    {criterion.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {criterion.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2 tabular-nums">
                    <Input
                      type="number"
                      min={0}
                      max={criterion.maxScore}
                      value={scores[index]}
                      onChange={(e) => {
                        const v = e.target.value === "" ? 0 : Number(e.target.value)
                        handleScoreChange(index, Math.min(Math.max(0, v), criterion.maxScore))
                      }}
                      className={cn(
                        "h-7 w-14 border-border bg-background text-center text-sm",
                        scorecardRadiusClassName(radius, "control"),
                      )}
                    />
                    <span className="text-xs text-muted-foreground">/ {criterion.maxScore}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <Slider
                    value={[scores[index] ?? 0]}
                    onValueChange={(v) => handleScoreChange(index, Array.isArray(v) ? (v[0] ?? 0) : v)}
                    min={0}
                    max={criterion.maxScore}
                    step={1}
                    className="flex-1"
                  />
                </div>

                {notesField && (
                  <Textarea
                    value={notes[index]}
                    onChange={(e) => handleNoteChange(index, e.target.value)}
                    placeholder="Add notes..."
                    rows={2}
                    className={cn(
                      "mt-2 resize-none border-border bg-background text-sm placeholder:text-muted-foreground",
                      scorecardRadiusClassName(radius, "control"),
                    )}
                  />
                )}
              </div>
            ))}

            <Separator className="my-1" />

            <div
              className={cn(
                "border border-border/40 bg-muted/30 p-3",
                scorecardRadiusClassName(radius, "surface"),
                density === "compact" ? "p-2.5" : density === "spacious" ? "p-4" : "p-3",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Weighted Average</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {weightedAverage.toFixed(1)} / {maxPossibleScore.toFixed(1)}
                </span>
              </div>

              {(overallScoreField || recommendationField) && (
                <div className={cn("mt-3 flex flex-col", density === "compact" ? "gap-2" : "gap-3")}>
                  {overallScoreField && (
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Overall Score
                      </Label>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {weightedAverage.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {recommendationField && (
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Recommendation
                      </Label>
                      <Select
                        value={recommendation || undefined}
                        onValueChange={(v) => v && setRecommendation(v)}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-7 w-36 border-border bg-background text-sm",
                            scorecardRadiusClassName(radius, "control"),
                          )}
                        >
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {RECOMMENDATION_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                <span
                                  className={enumPillClasses(
                                    opt,
                                    [...RECOMMENDATION_OPTIONS],
                                    enumColorMap,
                                  )}
                                >
                                  {opt}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {submitError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError.message}
              </p>
            )}

            <Button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting || !hasAnyScore}
              className={cn("mt-1 w-full", scorecardRadiusClassName(radius, "control"))}
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit Scorecard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function rootClassName(appearance: LemmaScorecardAppearance) {
  if (appearance === "contained") return "bg-card border border-border/50"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function headerClassName(appearance: LemmaScorecardAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

function toolbarClassName(density: LemmaScorecardDensity) {
  if (density === "compact") return "gap-2 px-3 py-2"
  if (density === "spacious") return "gap-4 px-5 py-4"
  return "gap-3 px-4 py-3"
}

function contentClassName(density: LemmaScorecardDensity) {
  if (density === "compact") return "p-2"
  if (density === "spacious") return "p-5"
  return "p-4"
}

function criteriaGapClassName(density: LemmaScorecardDensity) {
  if (density === "compact") return "gap-2"
  if (density === "spacious") return "gap-4"
  return "gap-3"
}
