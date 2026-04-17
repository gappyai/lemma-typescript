"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  ArrowLeftRight,
  Columns2,
  FileText,
  GitCompare,
  Rows3,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  diffViewerRadiusClassName,
  diffViewerRootClassName,
  diffViewerHeaderClassName,
  diffViewerToolbarClassName,
  diffViewerContentClassName,
  diffViewerBodyClassName,
  type LemmaDiffViewerAppearance,
  type LemmaDiffViewerDensity,
  type LemmaDiffViewerRadius,
} from "./diff-viewer-style-utils"

export type {
  LemmaDiffViewerAppearance,
  LemmaDiffViewerDensity,
  LemmaDiffViewerRadius,
} from "./diff-viewer-style-utils"

type DiffMode = "side-by-side" | "inline" | "unified"
type DiffFormat = "text" | "markdown" | "json"

interface DiffLine {
  type: "added" | "removed" | "unchanged"
  content: string
  lineNumber?: number
}

interface LemmaDiffViewerProps {
  before: string
  after: string
  mode?: DiffMode
  format?: DiffFormat
  leftLabel?: string
  rightLabel?: string
  showLineNumbers?: boolean
  contextLines?: number
  appearance?: LemmaDiffViewerAppearance
  density?: LemmaDiffViewerDensity
  radius?: LemmaDiffViewerRadius
  className?: string
}

export type { DiffMode, DiffFormat, DiffLine, LemmaDiffViewerProps }

function computeDiff(beforeLines: string[], afterLines: string[]): DiffLine[] {
  const result: DiffLine[] = []
  const beforeSet = new Map<string, number[]>()
  beforeLines.forEach((line, i) => {
    const arr = beforeSet.get(line) ?? []
    arr.push(i)
    beforeSet.set(line, arr)
  })

  const afterUsed = new Set<number>()
  const beforeUsed = new Set<number>()

  const afterLookup: Map<string, number[]> = new Map()
  afterLines.forEach((line, i) => {
    const arr = afterLookup.get(line) ?? []
    arr.push(i)
    afterLookup.set(line, arr)
  })

  let bi = 0
  let ai = 0

  while (bi < beforeLines.length || ai < afterLines.length) {
    if (bi < beforeLines.length && ai < afterLines.length && beforeLines[bi] === afterLines[ai]) {
      result.push({ type: "unchanged", content: beforeLines[bi], lineNumber: ai + 1 })
      bi++
      ai++
    } else if (bi < beforeLines.length && ai < afterLines.length) {
      const afterMatches = afterLookup.get(beforeLines[bi])
      const beforeMatches = beforeSet.get(afterLines[ai])

      const afterHasMatch = afterMatches && afterMatches.some((idx) => idx >= ai && !afterUsed.has(idx))
      const beforeHasMatch = beforeMatches && beforeMatches.some((idx) => idx >= bi && !beforeUsed.has(idx))

      if (afterHasMatch && !beforeHasMatch) {
        result.push({ type: "added", content: afterLines[ai], lineNumber: ai + 1 })
        afterUsed.add(ai)
        ai++
      } else if (beforeHasMatch && !afterHasMatch) {
        result.push({ type: "removed", content: beforeLines[bi], lineNumber: bi + 1 })
        beforeUsed.add(bi)
        bi++
      } else {
        result.push({ type: "removed", content: beforeLines[bi], lineNumber: bi + 1 })
        result.push({ type: "added", content: afterLines[ai], lineNumber: ai + 1 })
        bi++
        ai++
      }
    } else if (bi < beforeLines.length) {
      result.push({ type: "removed", content: beforeLines[bi], lineNumber: bi + 1 })
      bi++
    } else if (ai < afterLines.length) {
      result.push({ type: "added", content: afterLines[ai], lineNumber: ai + 1 })
      ai++
    }
  }

  return result
}

function applyContextLines(lines: DiffLine[], contextLines: number): DiffLine[] {
  if (contextLines < 0) return lines

  const changeIndices: number[] = []
  lines.forEach((line, i) => {
    if (line.type !== "unchanged") changeIndices.push(i)
  })

  if (changeIndices.length === 0) return lines

  const visible = new Set<number>()
  changeIndices.forEach((ci) => {
    for (let j = Math.max(0, ci - contextLines); j <= Math.min(lines.length - 1, ci + contextLines); j++) {
      visible.add(j)
    }
  })

  const sorted = Array.from(visible).sort((a, b) => a - b)
  const result: DiffLine[] = []
  let prevIndex = -2

  for (const idx of sorted) {
    if (idx > prevIndex + 1) {
      result.push({ type: "unchanged", content: "..." })
    }
    result.push(lines[idx])
    prevIndex = idx
  }

  return result
}

function prettyPrintJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

function countChanges(lines: DiffLine[]): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const line of lines) {
    if (line.type === "added") added++
    if (line.type === "removed") removed++
  }
  return { added, removed }
}

const LINE_CLASSES = {
  added: "bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300",
  removed: "bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300",
  unchanged: "",
} as const

const INLINE_PREFIX = {
  added: "+",
  removed: "−",
  unchanged: " ",
} as const

export function LemmaDiffViewer({
  before,
  after,
  mode: controlledMode,
  format = "text",
  leftLabel = "Original",
  rightLabel = "Revised",
  showLineNumbers = true,
  contextLines = 3,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  className,
}: LemmaDiffViewerProps) {
  const [uncontrolledMode, setUncontrolledMode] = React.useState<DiffMode>("side-by-side")
  const currentMode = controlledMode ?? uncontrolledMode

  const beforeText = format === "json" ? prettyPrintJson(before) : before
  const afterText = format === "json" ? prettyPrintJson(after) : after

  const beforeLines = React.useMemo(() => beforeText.split("\n"), [beforeText])
  const afterLines = React.useMemo(() => afterText.split("\n"), [afterText])

  const diffLines = React.useMemo(
    () => computeDiff(beforeLines, afterLines),
    [beforeLines, afterLines],
  )

  const stats = React.useMemo(() => countChanges(diffLines), [diffLines])

  const visibleLines = React.useMemo(
    () => currentMode === "unified" ? applyContextLines(diffLines, contextLines) : diffLines,
    [diffLines, currentMode, contextLines],
  )

  const fontSize = density === "compact" ? "text-xs" : density === "spacious" ? "text-sm" : "text-xs"
  const linePadding = density === "compact" ? "px-2 py-0.5" : density === "spacious" ? "px-4 py-1" : "px-3 py-0.5"
  const lineNumWidth = density === "compact" ? "w-6" : density === "spacious" ? "w-10" : "w-8"

  const renderLineContent = (content: string) => {
    if (format === "markdown") {
      return (
        <span className="prose prose-sm prose-inline max-w-none dark:prose-invert [&_p]:m-0 [&_p]:leading-inherit">
          <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{content}</ReactMarkdown>
        </span>
      )
    }
    return <span className="whitespace-pre">{content}</span>
  }

  const renderSideBySide = () => {
    const leftLines: (DiffLine | null)[] = []
    const rightLines: (DiffLine | null)[] = []

    for (const line of visibleLines) {
      if (line.type === "removed") {
        leftLines.push(line)
        rightLines.push(null)
      } else if (line.type === "added") {
        leftLines.push(null)
        rightLines.push(line)
      } else {
        leftLines.push(line)
        rightLines.push(line)
      }
    }

    return (
      <div className="grid grid-cols-2 divide-x divide-border/30">
        <div className="overflow-auto">
          <div className={cn("flex items-center justify-between border-b border-border/30 bg-muted/30", linePadding)}>
            <span className="text-xs font-medium text-muted-foreground">{leftLabel}</span>
            {stats.removed > 0 && (
              <Badge variant="secondary" className={cn("h-5 gap-1 text-[10px]", diffViewerRadiusClassName(radius, "pill"))}>
                <span className="text-red-600 dark:text-red-400">−{stats.removed}</span>
              </Badge>
            )}
          </div>
          {leftLines.map((line, i) => (
            <div
              key={`l-${i}`}
              className={cn(
                "flex items-start font-mono",
                fontSize,
                linePadding,
                line ? LINE_CLASSES[line.type] : "",
                !line && "invisible",
              )}
            >
              {showLineNumbers && (
                <span className={cn("shrink-0 select-none text-muted-foreground/50", lineNumWidth)}>
                  {line?.type !== "unchanged" || !line ? "" : line.lineNumber ?? ""}
                </span>
              )}
              <span className="min-w-0 flex-1">
                {line ? renderLineContent(line.content) : "\u00A0"}
              </span>
            </div>
          ))}
        </div>

        <div className="overflow-auto">
          <div className={cn("flex items-center justify-between border-b border-border/30 bg-muted/30", linePadding)}>
            <span className="text-xs font-medium text-muted-foreground">{rightLabel}</span>
            {stats.added > 0 && (
              <Badge variant="secondary" className={cn("h-5 gap-1 text-[10px]", diffViewerRadiusClassName(radius, "pill"))}>
                <span className="text-green-600 dark:text-green-400">+{stats.added}</span>
              </Badge>
            )}
          </div>
          {rightLines.map((line, i) => (
            <div
              key={`r-${i}`}
              className={cn(
                "flex items-start font-mono",
                fontSize,
                linePadding,
                line ? LINE_CLASSES[line.type] : "",
                !line && "invisible",
              )}
            >
              {showLineNumbers && (
                <span className={cn("shrink-0 select-none text-muted-foreground/50", lineNumWidth)}>
                  {line?.lineNumber ?? ""}
                </span>
              )}
              <span className="min-w-0 flex-1">
                {line ? renderLineContent(line.content) : "\u00A0"}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderInline = () => (
    <div className="overflow-auto">
      <div className={cn("flex items-center gap-3 border-b border-border/30 bg-muted/30", linePadding)}>
        <span className="text-xs font-medium text-muted-foreground">{leftLabel}</span>
        <Separator orientation="vertical" className="h-3" />
        <span className="text-xs font-medium text-muted-foreground">{rightLabel}</span>
        <span className="ml-auto flex items-center gap-2">
          {stats.removed > 0 && (
            <Badge variant="secondary" className={cn("h-5 gap-1 text-[10px]", diffViewerRadiusClassName(radius, "pill"))}>
              <span className="text-red-600 dark:text-red-400">−{stats.removed}</span>
            </Badge>
          )}
          {stats.added > 0 && (
            <Badge variant="secondary" className={cn("h-5 gap-1 text-[10px]", diffViewerRadiusClassName(radius, "pill"))}>
              <span className="text-green-600 dark:text-green-400">+{stats.added}</span>
            </Badge>
          )}
        </span>
      </div>
      {visibleLines.map((line, i) => (
        <div
          key={`i-${i}`}
          className={cn(
            "flex items-start font-mono",
            fontSize,
            linePadding,
            LINE_CLASSES[line.type],
          )}
        >
          {showLineNumbers && (
            <span className={cn("shrink-0 select-none text-muted-foreground/50", lineNumWidth)}>
              {line.lineNumber ?? ""}
            </span>
          )}
          <span className={cn(
            "shrink-0 select-none font-bold",
            line.type === "added" && "text-green-700 dark:text-green-400",
            line.type === "removed" && "text-red-700 dark:text-red-400",
            line.type === "unchanged" && "text-muted-foreground/40",
            "w-4 text-center",
          )}>
            {INLINE_PREFIX[line.type]}
          </span>
          <span className="min-w-0 flex-1">
            {renderLineContent(line.content)}
          </span>
        </div>
      ))}
    </div>
  )

  const modeIcon = (m: DiffMode) => {
    if (m === "side-by-side") return <Columns2 className="size-3.5" />
    if (m === "inline") return <Rows3 className="size-3.5" />
    return <GitCompare className="size-3.5" />
  }

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn(
        "lemma-diff-viewer flex h-full min-h-0 flex-col overflow-hidden",
        diffViewerRootClassName(appearance),
        appearance === "minimal" || appearance === "borderless"
          ? "border-0"
          : "border border-border/50",
        diffViewerRadiusClassName(radius, "surface"),
        className,
      )}
    >
      <div className={cn("shrink-0", diffViewerHeaderClassName(appearance))}>
        <div className={cn("flex items-center justify-between", diffViewerToolbarClassName(density))}>
          <div className="min-w-0 flex items-center gap-3">
            <span className={cn(
              "flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground",
              diffViewerRadiusClassName(radius, "control"),
            )}>
              <FileText className="size-3.5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground">Diff</h1>
              <p className="text-xs text-muted-foreground">
                {stats.added + stats.removed === 0
                  ? "No changes"
                  : `${stats.added + stats.removed} change${stats.added + stats.removed !== 1 ? "s" : ""}`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stats.removed > 0 && (
              <Badge variant="secondary" className={cn("h-5 gap-1 text-[10px]", diffViewerRadiusClassName(radius, "pill"))}>
                <span className="text-red-600 dark:text-red-400">−{stats.removed}</span>
              </Badge>
            )}
            {stats.added > 0 && (
              <Badge variant="secondary" className={cn("h-5 gap-1 text-[10px]", diffViewerRadiusClassName(radius, "pill"))}>
                <span className="text-green-600 dark:text-green-400">+{stats.added}</span>
              </Badge>
            )}
            <Separator orientation="vertical" className="h-4" />
            <Tabs
              value={currentMode}
              onValueChange={(v: string) => {
                if (!controlledMode) setUncontrolledMode(v as DiffMode)
              }}
            >
              <TabsList className={cn("h-7", diffViewerRadiusClassName(radius, "control"))}>
                {(["side-by-side", "inline", "unified"] as DiffMode[]).map((m) => (
                  <TabsTrigger key={m} value={m} className="gap-1 text-[10px] px-2 h-5">
                    {modeIcon(m)}
                    <span className="hidden sm:inline">
                      {m === "side-by-side" ? "Split" : m === "inline" ? "Inline" : "Unified"}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <Card
        className={cn(
          "m-0 flex-1 overflow-hidden border-0 rounded-none shadow-none",
          diffViewerBodyClassName(appearance),
        )}
      >
        <div className={cn("flex-1 overflow-auto", diffViewerContentClassName(density))}>
          {currentMode === "side-by-side" ? renderSideBySide() : renderInline()}
        </div>
      </Card>
    </div>
  )
}
