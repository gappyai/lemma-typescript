"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRecords, useFunctionRun } from "lemma-sdk/react"
import type { LemmaClient, RecordFilter } from "lemma-sdk"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export type StatSource =
  | { type: "count"; table: string; filters?: RecordFilter[]; label?: string }
  | { type: "sum"; table: string; field: string; filters?: RecordFilter[]; label?: string }
  | { type: "avg"; table: string; field: string; filters?: RecordFilter[]; label?: string }
  | { type: "function"; functionName: string; input?: Record<string, unknown>; extractPath?: string; label?: string }

export type ChartSource =
  | {
      type: "bar" | "line"
      table: string
      category: string
      value: string
      filters?: RecordFilter[]
    }
  | {
      type: "pie"
      table: string
      category: string
      value?: string
      filters?: RecordFilter[]
    }
  | {
      type: "bar" | "line" | "pie"
      table?: undefined
      function: string
      input?: Record<string, unknown>
      extractPath?: string
    }

export interface StatCardDef {
  source: StatSource
  title: string
  format?: (value: number) => string
  trend?: "up" | "down" | "flat"
  trendLabel?: string
}

export interface ChartCardDef {
  source: ChartSource
  title: string
  height?: number
}

export interface LemmaInsightsProps {
  client: LemmaClient
  podId?: string
  stats?: StatCardDef[]
  charts?: ChartCardDef[]
  columns?: 1 | 2 | 3 | 4
  appearance?: "default" | "minimal" | "borderless" | "contained"
  density?: "compact" | "comfortable" | "spacious"
  className?: string
}

export function LemmaInsights({
  client,
  podId,
  stats = [],
  charts = [],
  columns = 4,
  appearance = "default",
  density = "comfortable",
  className,
}: LemmaInsightsProps) {
  const gridCols = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[columns]
  const gapClassName = density === "compact" ? "gap-2" : density === "spacious" ? "gap-5" : "gap-4"

  return (
    <div data-appearance={appearance} data-density={density} className={cn("flex flex-col", density === "compact" ? "gap-4" : density === "spacious" ? "gap-7" : "gap-6", className)}>
      {stats.length > 0 && (
        <div className={cn("grid", gridCols, gapClassName)}>
          {stats.map((def, i) => (
            <StatCard key={i} def={def} client={client} podId={podId} appearance={appearance} density={density} />
          ))}
        </div>
      )}

      {charts.length > 0 && (
        <div className={cn("grid grid-cols-1 lg:grid-cols-2", gapClassName)}>
          {charts.map((def, i) => (
            <ChartCard key={i} def={def} client={client} podId={podId} appearance={appearance} density={density} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  def,
  client,
  podId,
  appearance,
  density,
}: {
  def: StatCardDef
  client: LemmaClient
  podId?: string
  appearance: NonNullable<LemmaInsightsProps["appearance"]>
  density: NonNullable<LemmaInsightsProps["density"]>
}) {
  const { source, title, format, trend, trendLabel } = def

  const recordsState = useRecords({
    client,
    podId,
    tableName: ("table" in source ? source.table : "") as string,
    filters: "filters" in source ? source.filters : undefined,
    enabled: source.type !== "function",
    limit: 1000,
  })

  const fnRun = useFunctionRun({
    client,
    podId,
    functionName: source.type === "function" ? source.functionName : undefined,
  })

  const [fnResult, setFnResult] = React.useState<number | null>(null)
  const [fnLoading, setFnLoading] = React.useState(source.type === "function")
  React.useEffect(() => {
    if (source.type !== "function") return
    fnRun.start(source.input ?? {}).then((res) => {
      if (source.extractPath) {
        const val = extractNested(res.output_data, source.extractPath)
        setFnResult(typeof val === "number" ? val : 0)
      } else {
        setFnResult(typeof res.output_data === "number" ? res.output_data : 0)
      }
    }).catch(() => {
      setFnResult(0)
    }).finally(() => {
      setFnLoading(false)
    })
  }, [source.type])

  let value = 0

  if (source.type === "count") {
    value = recordsState.total
  } else if (source.type === "sum" || source.type === "avg") {
    const records = recordsState.records
    const nums = records.map((r) => Number(r[source.field])).filter((n) => !Number.isNaN(n))
    if (source.type === "sum") value = nums.reduce((a, b) => a + b, 0)
    else value = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
  } else if (fnResult != null) {
    value = fnResult
  }

  const displayValue = format ? format(value) : defaultFormat(value, source.type)
  const isLoading = source.type !== "function" ? recordsState.isLoading : fnLoading

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  const trendColor =
    trend === "up"
      ? "text-primary"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground"

  return (
    <Card className={insightCardClassName(appearance)}>
      <CardHeader className={cn("flex flex-row items-center justify-between", density === "compact" ? "px-3 pb-1 pt-3" : density === "spacious" ? "px-5 pb-3 pt-5" : "px-4 pb-2 pt-4")}>
        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </CardTitle>
        {trend && (
          <TrendIcon className={cn("size-4", trendColor)} />
        )}
      </CardHeader>
      <CardContent className={density === "compact" ? "px-3 pb-3" : density === "spacious" ? "px-5 pb-5" : "px-4 pb-4"}>
        <div className={cn("font-bold tracking-tight text-foreground", density === "compact" ? "text-xl" : "text-2xl")}>
          {isLoading ? "—" : displayValue}
        </div>
        {trendLabel && (
          <p className={`mt-0.5 text-xs ${trendColor}`}>{trendLabel}</p>
        )}
      </CardContent>
    </Card>
  )
}

function ChartCard({
  def,
  client,
  podId,
  appearance,
  density,
}: {
  def: ChartCardDef
  client: LemmaClient
  podId?: string
  appearance: NonNullable<LemmaInsightsProps["appearance"]>
  density: NonNullable<LemmaInsightsProps["density"]>
}) {
  const { source, title, height = 300 } = def

  const isTableSource = "table" in source && source.table

  const recordsState = useRecords({
    client,
    podId,
    tableName: isTableSource ? (source.table as string) : "",
    filters: "filters" in source ? source.filters : undefined,
    enabled: !!isTableSource,
    limit: 500,
  })

  const [fnData, setFnData] = React.useState<Array<Record<string, unknown>>>([])
  React.useEffect(() => {
    if (isTableSource) return
    const fnSource = source as unknown as { function: string; input?: Record<string, unknown> }
    client.withPod(podId ?? (client as { podId?: string }).podId ?? "")
      .functions.runs.create(fnSource.function, {
        input: fnSource.input ?? {},
      })
      .then((run) => {
        const output = run.output_data
        if (Array.isArray(output)) setFnData(output)
        else if (typeof output === "object" && output !== null) setFnData([output])
        else setFnData([])
      })
      .catch(() => setFnData([]))
  }, [isTableSource])

  const data = isTableSource ? aggregateChartData(recordsState.records, source) : fnData

  return (
    <Card className={insightCardClassName(appearance)}>
      <CardHeader className={density === "compact" ? "px-3 pb-1 pt-3" : density === "spacious" ? "px-5 pb-3 pt-5" : "px-4 pb-2 pt-4"}>
        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={density === "compact" ? "px-3 pb-3" : density === "spacious" ? "px-5 pb-5" : "px-4 pb-4"}>
        <ResponsiveContainer width="100%" height={density === "compact" ? Math.max(180, height - 60) : density === "spacious" ? height + 40 : height}>
          {source.type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : source.type === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={height / 3}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function insightCardClassName(appearance: NonNullable<LemmaInsightsProps["appearance"]>) {
  if (appearance === "borderless") return "border-0 shadow-none ring-0"
  if (appearance === "minimal") return "border-0 bg-transparent shadow-none ring-0"
  if (appearance === "contained") return "border-border/70 shadow-sm"
  return "border-border/50"
}

function aggregateChartData(
  records: Record<string, unknown>[],
  source: ChartSource,
): Array<{ category: string; value: number }> {
  if (!("category" in source) || !("value" in source)) return []

  const catField = source.category
  const valField = source.value

  if (source.type === "pie" && !valField) {
    const counts = new Map<string, number>()
    for (const rec of records) {
      const cat = String(rec[catField] ?? "Unknown")
      counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
    return Array.from(counts.entries()).map(([category, value]) => ({ category, value }))
  }

  const groups = new Map<string, number[]>()
  for (const rec of records) {
    const cat = String(rec[catField] ?? "Unknown")
    const val = Number(rec[valField!] ?? 0)
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat)!.push(val)
  }

  return Array.from(groups.entries()).map(([category, vals]) => ({
    category,
    value: vals.reduce((a, b) => a + b, 0),
  }))
}

function defaultFormat(value: number, type: string): string {
  if (type === "count") return value.toLocaleString()
  if (type === "avg") return value.toFixed(1)
  if (type === "sum") return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  return String(value)
}

function extractNested(obj: unknown, path: string): unknown {
  const keys = path.split(".")
  let current = obj
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}
