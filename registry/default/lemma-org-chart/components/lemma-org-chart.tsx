"use client"

import * as React from "react"
import {
  AlertCircle,
  ChevronDown,
  Network,
  RefreshCw,
  User,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRecords, useTable } from "lemma-sdk/react"
import type { LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { enumPillClasses, type EnumColorMap } from "./org-chart-enum-utils"
import {
  orgChartRadiusClassName,
  type LemmaOrgChartAppearance,
  type LemmaOrgChartDensity,
  type LemmaOrgChartRadius,
} from "./org-chart-style-utils"

export type { LemmaOrgChartAppearance, LemmaOrgChartDensity, LemmaOrgChartRadius } from "./org-chart-style-utils"
export type { EnumColorMap as LemmaOrgChartEnumColorMap } from "./org-chart-enum-utils"

interface TreeNode {
  record: Record<string, unknown>
  children: TreeNode[]
}

interface LemmaOrgChartProps {
  client: LemmaClient
  podId?: string
  tableName: string
  enabled?: boolean

  parentField: string
  labelField: string
  avatarField?: string
  subtitleField?: string
  selectedId?: string
  onNodeClick?: (record: Record<string, unknown>) => void
  layout?: "vertical" | "horizontal"
  enumColorMap?: EnumColorMap

  appearance?: LemmaOrgChartAppearance
  density?: LemmaOrgChartDensity
  radius?: LemmaOrgChartRadius
  title?: React.ReactNode
  className?: string
}

export function LemmaOrgChart({
  client,
  podId,
  tableName,
  enabled = true,
  parentField,
  labelField,
  avatarField,
  subtitleField,
  selectedId,
  onNodeClick,
  layout = "vertical",
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  className,
}: LemmaOrgChartProps) {
  const tableState = useTable({ client, podId, tableName, enabled })
  const recordsState = useRecords({
    client,
    podId,
    tableName,
    enabled: enabled && !!tableState.table,
    limit: 500,
  })

  const tree = React.useMemo(() => {
    if (!recordsState.records.length) return []
    const map = new Map<string, TreeNode>()
    const roots: TreeNode[] = []

    for (const record of recordsState.records) {
      const id = String(record.id ?? "")
      map.set(id, { record, children: [] })
    }

    for (const record of recordsState.records) {
      const id = String(record.id ?? "")
      const node = map.get(id)
      if (!node) continue

      const parentId = record[parentField]
      if (parentId == null || parentId === "") {
        roots.push(node)
      } else {
        const parentKey = String(parentId)
        const parent = map.get(parentKey)
        if (parent) {
          parent.children.push(node)
        } else {
          roots.push(node)
        }
      }
    }

    const sortChildren = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        const aLabel = String(a.record[labelField] ?? "")
        const bLabel = String(b.record[labelField] ?? "")
        return aLabel.localeCompare(bLabel)
      })
      for (const node of nodes) {
        sortChildren(node.children)
      }
    }
    sortChildren(roots)

    return roots
  }, [recordsState.records, parentField, labelField])

  const isLoading = tableState.isLoading || recordsState.isLoading

  if (isLoading) {
    return (
      <div className={cn("lemma-org-chart p-6", rootClassName(appearance), className)}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex justify-center gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className={cn("h-16 w-28", orgChartRadiusClassName(radius, "surface"))} />
              <div className="flex gap-4">
                {Array.from({ length: 2 }).map((_, j) => (
                  <Skeleton key={j} className={cn("h-14 w-24", orgChartRadiusClassName(radius, "surface"))} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (recordsState.error) {
    return (
      <div className={cn("lemma-org-chart flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center", rootClassName(appearance), className)}>
        <span className={cn("flex size-11 items-center justify-center border border-border/60 bg-muted/40 text-destructive", orgChartRadiusClassName(radius, "pill"))}>
          <AlertCircle className="size-5" />
        </span>
        <p className="text-sm text-destructive">{recordsState.error.message}</p>
        <Button variant="outline" size="sm" onClick={() => recordsState.refresh()}>
          <RefreshCw className="mr-2 size-3.5" />
          Retry
        </Button>
      </div>
    )
  }

  if (!tree.length) {
    return (
      <div className={cn("lemma-org-chart flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center", rootClassName(appearance), className)}>
        <span className={cn("flex size-11 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground", orgChartRadiusClassName(radius, "pill"))}>
          <Network className="size-5" />
        </span>
        <p className="font-medium text-foreground">No records</p>
        <p className="text-sm text-muted-foreground">No records found to build hierarchy.</p>
      </div>
    )
  }

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn("lemma-org-chart flex h-full min-h-0 flex-col", rootClassName(appearance), className)}
    >
      <div className={cn("shrink-0", headerClassName(appearance))}>
        <div className={cn("flex items-center gap-3", toolbarClassName(density))}>
          <span className={cn("flex size-7 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground", orgChartRadiusClassName(radius, "control"))}>
            <Network className="size-3.5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-foreground">
              {title ?? (tableState.table?.name ?? tableName)}
            </h1>
            <p className="text-xs text-muted-foreground">
              {recordsState.records.length} records
            </p>
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-auto", contentClassName(density))}>
        <TooltipProvider>
          {layout === "horizontal" ? (
            <div className="flex items-start gap-6 p-4">
              {tree.map((root) => (
                <HorizontalNode
                  key={String(root.record.id)}
                  node={root}
                  labelField={labelField}
                  avatarField={avatarField}
                  subtitleField={subtitleField}
                  selectedId={selectedId}
                  onNodeClick={onNodeClick}
                  density={density}
                  radius={radius}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0 p-4">
              {tree.map((root, i) => (
                <React.Fragment key={String(root.record.id)}>
                  {i > 0 && <div className="h-6" />}
                  <VerticalNode
                    node={root}
                    labelField={labelField}
                    avatarField={avatarField}
                    subtitleField={subtitleField}
                    selectedId={selectedId}
                    onNodeClick={onNodeClick}
                    density={density}
                    radius={radius}
                  />
                </React.Fragment>
              ))}
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  )
}

function NodeCard({
  record,
  labelField,
  avatarField,
  subtitleField,
  isSelected,
  onClick,
  density,
  radius,
}: {
  record: Record<string, unknown>
  labelField: string
  avatarField?: string
  subtitleField?: string
  isSelected: boolean
  onClick?: () => void
  density: LemmaOrgChartDensity
  radius: LemmaOrgChartRadius
}) {
  const label = String(record[labelField] ?? "Untitled")
  const subtitle = subtitleField ? String(record[subtitleField] ?? "") : ""
  const avatarUrl = avatarField ? String(record[avatarField] ?? "") : ""

  const initials = label
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const padding = density === "compact" ? "p-2" : density === "spacious" ? "p-3.5" : "p-2.5"
  const gap = density === "compact" ? "gap-1.5" : "gap-2"

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        className={cn(
          "flex items-center border transition-colors",
          padding,
          gap,
          orgChartRadiusClassName(radius, "surface"),
          isSelected
            ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
            : "border-border/50 bg-card hover:bg-muted/35",
          onClick && "cursor-pointer",
        )}
      >
        <span
            className={cn(
              "flex shrink-0 items-center justify-center overflow-hidden bg-muted/60 text-[10px] font-semibold text-muted-foreground",
              orgChartRadiusClassName(radius, "pill"),
              density === "compact" ? "size-6" : density === "spacious" ? "size-8" : "size-7",
            )}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              initials || <User className="size-3" />
            )}
          </span>
          <div className="min-w-0 text-left">
            <p className="truncate text-xs font-medium text-foreground">{label}</p>
            {subtitle && (
              <p className="truncate text-[10px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}{subtitle && ` — ${subtitle}`}
      </TooltipContent>
    </Tooltip>
  )
}

function VerticalNode({
  node,
  labelField,
  avatarField,
  subtitleField,
  selectedId,
  onNodeClick,
  density,
  radius,
}: {
  node: TreeNode
  labelField: string
  avatarField?: string
  subtitleField?: string
  selectedId?: string
  onNodeClick?: (record: Record<string, unknown>) => void
  density: LemmaOrgChartDensity
  radius: LemmaOrgChartRadius
}) {
  const nodeId = String(node.record.id ?? "")
  const isSelected = nodeId === selectedId
  const hasChildren = node.children.length > 0
  const connectorGap = density === "compact" ? "h-4" : density === "spacious" ? "h-8" : "h-6"

  return (
    <div className="flex flex-col items-center">
      <NodeCard
        record={node.record}
        labelField={labelField}
        avatarField={avatarField}
        subtitleField={subtitleField}
        isSelected={isSelected}
        onClick={onNodeClick ? () => onNodeClick(node.record) : undefined}
        density={density}
        radius={radius}
      />

      {hasChildren && (
        <>
          <div className={cn("w-px bg-border/50", connectorGap)} />
          <div className="relative flex">
            {node.children.length > 1 && (
              <div
                className="absolute top-0 border-t border-border/50"
                style={{
                  left: `${100 / node.children.length / 2}%`,
                  right: `${100 / node.children.length / 2}%`,
                }}
              />
            )}
            <div className="flex gap-4">
              {node.children.map((child) => (
                <div key={String(child.record.id)} className="flex flex-col items-center">
                  <div className={cn("w-px bg-border/50", density === "compact" ? "h-3" : "h-4")} />
                  <VerticalNode
                    node={child}
                    labelField={labelField}
                    avatarField={avatarField}
                    subtitleField={subtitleField}
                    selectedId={selectedId}
                    onNodeClick={onNodeClick}
                    density={density}
                    radius={radius}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function HorizontalNode({
  node,
  labelField,
  avatarField,
  subtitleField,
  selectedId,
  onNodeClick,
  density,
  radius,
}: {
  node: TreeNode
  labelField: string
  avatarField?: string
  subtitleField?: string
  selectedId?: string
  onNodeClick?: (record: Record<string, unknown>) => void
  density: LemmaOrgChartDensity
  radius: LemmaOrgChartRadius
}) {
  const nodeId = String(node.record.id ?? "")
  const isSelected = nodeId === selectedId
  const hasChildren = node.children.length > 0

  return (
    <div className="flex items-start gap-2">
      <div className="flex flex-col items-center">
        <NodeCard
          record={node.record}
          labelField={labelField}
          avatarField={avatarField}
          subtitleField={subtitleField}
          isSelected={isSelected}
          onClick={onNodeClick ? () => onNodeClick(node.record) : undefined}
          density={density}
          radius={radius}
        />
      </div>

      {hasChildren && (
        <>
          <div className={cn("w-px self-stretch bg-border/50", density === "compact" ? "mx-1" : "mx-2")} />
          <div className="flex flex-col gap-2">
            {node.children.map((child) => (
              <HorizontalNode
                key={String(child.record.id)}
                node={child}
                labelField={labelField}
                avatarField={avatarField}
                subtitleField={subtitleField}
                selectedId={selectedId}
                onNodeClick={onNodeClick}
                density={density}
                radius={radius}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function rootClassName(appearance: LemmaOrgChartAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function headerClassName(appearance: LemmaOrgChartAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

function toolbarClassName(density: LemmaOrgChartDensity) {
  if (density === "compact") return "gap-2 px-3 py-2"
  if (density === "spacious") return "gap-4 px-5 py-4"
  return "gap-3 px-4 py-3"
}

function contentClassName(density: LemmaOrgChartDensity) {
  if (density === "compact") return "p-2"
  if (density === "spacious") return "p-5"
  return "p-4"
}
