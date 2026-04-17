"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Plus,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRecords } from "lemma-sdk/react"
import type { LemmaClient } from "lemma-sdk"
import { cn } from "@/lib/utils"
import { type EnumColorMap } from "./page-tree-enum-utils"
import {
  pageTreeRadiusClassName,
  type LemmaPageTreeAppearance,
  type LemmaPageTreeDensity,
  type LemmaPageTreeRadius,
} from "./page-tree-style-utils"

export type { LemmaPageTreeAppearance, LemmaPageTreeDensity, LemmaPageTreeRadius } from "./page-tree-style-utils"
export type { EnumColorMap, EnumColorEntry } from "./page-tree-enum-utils"

export interface TreeNode {
  id: string
  record: Record<string, unknown>
  children: TreeNode[]
}

export interface LemmaPageTreeProps {
  client: LemmaClient
  podId?: string
  tableName: string
  enabled?: boolean

  parentField: string
  titleField: string
  iconField?: string
  selectedId?: string
  onPageClick?: (record: Record<string, unknown>) => void
  onCreatePage?: (parentId?: string) => void
  onReorder?: (recordId: string, newParentId: string | null, newIndex: number) => void
  defaultExpandedIds?: string[]
  enumColorMap?: EnumColorMap

  appearance?: LemmaPageTreeAppearance
  density?: LemmaPageTreeDensity
  radius?: LemmaPageTreeRadius
  title?: React.ReactNode
  className?: string
}

export function LemmaPageTree({
  client,
  podId,
  tableName,
  enabled = true,
  parentField,
  titleField,
  iconField,
  selectedId,
  onPageClick,
  onCreatePage,
  onReorder,
  defaultExpandedIds,
  enumColorMap,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  title,
  className,
}: LemmaPageTreeProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    () => new Set(defaultExpandedIds ?? [])
  )

  const recordsState = useRecords({
    client,
    podId,
    tableName,
    enabled,
    limit: 500,
  })

  React.useEffect(() => {
    if (
      !recordsState.isLoading &&
      !recordsState.isLoadingMore &&
      recordsState.nextPageToken &&
      recordsState.records.length < recordsState.total
    ) {
      void recordsState.loadMore()
    }
  }, [recordsState.isLoading, recordsState.isLoadingMore, recordsState.nextPageToken, recordsState.records.length, recordsState.total, recordsState.loadMore])

  const tree = React.useMemo(
    () => buildTree(recordsState.records, parentField, titleField),
    [recordsState.records, parentField, titleField]
  )

  const toggleExpand = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const isLoading = recordsState.isLoading || recordsState.isLoadingMore
  const error = recordsState.error

  return (
    <div
      data-appearance={appearance}
      data-density={density}
      data-radius={radius}
      className={cn(
        "lemma-page-tree flex h-full min-h-0 flex-col",
        rootClassName(appearance),
        className,
      )}
    >
      <div className={cn("shrink-0", headerClassName(appearance))}>
        <div className={cn("flex items-center justify-between gap-3", headerPaddingClassName(density))}>
          <div className="min-w-0 flex items-center gap-3">
            <span
              className={cn(
                "flex size-8 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground",
                pageTreeRadiusClassName(radius, "control"),
              )}
            >
              <FileText className="size-4" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {title ?? "Pages"}
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                {recordsState.total} page{recordsState.total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void recordsState.refresh()}
              disabled={isLoading}
            >
              <RefreshCw className={cn(isLoading ? "animate-spin" : undefined)} />
            </Button>
            {onCreatePage ? (
              <Button size="sm" onClick={() => onCreatePage()}>
                <Plus data-icon="inline-start" />
                New
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-auto", contentPaddingClassName(density))}>
        {error ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive">{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => void recordsState.refresh()}>
              <RefreshCw data-icon="inline-start" />
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-1">
            {[
              { depth: 0, width: "w-32" },
              { depth: 1, width: "w-24" },
              { depth: 1, width: "w-20" },
              { depth: 0, width: "w-28" },
              { depth: 0, width: "w-36" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 py-1"
                style={{ paddingLeft: `${item.depth * indentPx(density)}px` }}
              >
                <Skeleton className="size-3.5 shrink-0 rounded-sm" />
                <Skeleton className={cn("h-4", item.width)} />
              </div>
            ))}
          </div>
        ) : tree.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <span
              className={cn(
                "flex size-11 items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground",
                pageTreeRadiusClassName(radius, "pill"),
              )}
            >
              <FileText className="size-5" />
            </span>
            <div>
              <p className="font-medium text-foreground">No pages yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first page to get started.
              </p>
            </div>
            {onCreatePage ? (
              <Button variant="outline" size="sm" onClick={() => onCreatePage()}>
                <Plus data-icon="inline-start" />
                New Page
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col">
            {tree.map((node) => (
              <PageTreeNode
                key={node.id}
                node={node}
                parentField={parentField}
                titleField={titleField}
                iconField={iconField}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                onPageClick={onPageClick}
                onCreatePage={onCreatePage}
                density={density}
                radius={radius}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PageTreeNode({
  node,
  parentField,
  titleField,
  iconField,
  selectedId,
  expandedIds,
  onToggleExpand,
  onPageClick,
  onCreatePage,
  density,
  radius,
}: {
  node: TreeNode
  parentField: string
  titleField: string
  iconField?: string
  selectedId?: string
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onPageClick?: (record: Record<string, unknown>) => void
  onCreatePage?: (parentId?: string) => void
  density: LemmaPageTreeDensity
  radius: LemmaPageTreeRadius
}) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = node.id === selectedId
  const icon = iconField ? (node.record[iconField] as string | null | undefined) : undefined
  const titleText = String(node.record[titleField] ?? "Untitled")

  return (
    <div>
      <div
        className={cn(
          "group flex items-center cursor-pointer transition-colors",
          rowClassName(density),
          isSelected && "bg-primary/10 border-l-2 border-primary",
          !isSelected && "hover:bg-muted/50",
        )}
        onClick={() => onPageClick?.(node.record)}
      >
        {hasChildren ? (
          <button
            type="button"
            className={cn(
              "flex shrink-0 items-center justify-center p-0.5 transition-colors hover:bg-muted/80",
              pageTreeRadiusClassName(radius, "control"),
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand(node.id)
            }}
          >
            {isExpanded ? (
              <ChevronDown className={chevronSize(density)} />
            ) : (
              <ChevronRight className={chevronSize(density)} />
            )}
          </button>
        ) : (
          <span className={spacerClassName(density)} />
        )}
        {icon ? (
          <span className={cn("shrink-0 leading-none", iconSize(density))}>{icon}</span>
        ) : (
          <FileText className={cn("shrink-0 text-muted-foreground", iconSize(density))} />
        )}
        <span
          className={cn(
            "flex-1 truncate",
            titleSize(density),
            isSelected ? "font-medium text-foreground" : "text-foreground/90",
          )}
        >
          {titleText}
        </span>
        {onCreatePage ? (
          <button
            type="button"
            className={cn(
              "shrink-0 p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted/80",
              pageTreeRadiusClassName(radius, "control"),
            )}
            onClick={(e) => {
              e.stopPropagation()
              onCreatePage(node.id)
            }}
          >
            <Plus className={plusSize(density)} />
          </button>
        ) : null}
      </div>
      {hasChildren && isExpanded ? (
        <div className={indentClassName(density)}>
          {node.children.map((child) => (
            <PageTreeNode
              key={child.id}
              node={child}
              parentField={parentField}
              titleField={titleField}
              iconField={iconField}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onPageClick={onPageClick}
              onCreatePage={onCreatePage}
              density={density}
              radius={radius}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function buildTree(
  records: Record<string, unknown>[],
  parentField: string,
  titleField: string,
): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const record of records) {
    const id = record["id"]
    if (id == null) continue
    const idStr = String(id)
    nodeMap.set(idStr, { id: idStr, record, children: [] })
  }

  for (const record of records) {
    const id = record["id"]
    if (id == null) continue
    const idStr = String(id)
    const node = nodeMap.get(idStr)
    if (!node) continue

    const parentId = record[parentField]
    if (parentId == null || parentId === "") {
      roots.push(node)
    } else {
      const parentStr = String(parentId)
      const parentNode = nodeMap.get(parentStr)
      if (parentNode && parentStr !== idStr) {
        parentNode.children.push(node)
      } else {
        roots.push(node)
      }
    }
  }

  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) =>
      String(a.record[titleField] ?? "").localeCompare(String(b.record[titleField] ?? ""))
    )
    for (const node of nodes) {
      sortNodes(node.children)
    }
    return nodes
  }

  return sortNodes(roots)
}

function rootClassName(appearance: LemmaPageTreeAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

function headerClassName(appearance: LemmaPageTreeAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

function headerPaddingClassName(density: LemmaPageTreeDensity) {
  if (density === "compact") return "px-3 py-2"
  if (density === "spacious") return "px-5 py-4"
  return "px-4 py-3"
}

function contentPaddingClassName(density: LemmaPageTreeDensity) {
  if (density === "compact") return "p-1"
  if (density === "spacious") return "p-3"
  return "p-2"
}

function rowClassName(density: LemmaPageTreeDensity) {
  if (density === "compact") return "py-1 px-2 gap-1"
  if (density === "spacious") return "py-2.5 px-4 gap-2"
  return "py-1.5 px-3 gap-1.5"
}

function indentClassName(density: LemmaPageTreeDensity) {
  if (density === "compact") return "pl-4"
  if (density === "spacious") return "pl-8"
  return "pl-6"
}

function indentPx(density: LemmaPageTreeDensity) {
  if (density === "compact") return 16
  if (density === "spacious") return 32
  return 24
}

function chevronSize(density: LemmaPageTreeDensity) {
  if (density === "compact") return "size-3"
  if (density === "spacious") return "size-4"
  return "size-3.5"
}

function spacerClassName(density: LemmaPageTreeDensity) {
  if (density === "compact") return "w-4 shrink-0"
  if (density === "spacious") return "w-6 shrink-0"
  return "w-5 shrink-0"
}

function iconSize(density: LemmaPageTreeDensity) {
  if (density === "compact") return "text-xs"
  if (density === "spacious") return "text-base"
  return "text-sm"
}

function titleSize(density: LemmaPageTreeDensity) {
  if (density === "compact") return "text-xs"
  return "text-sm"
}

function plusSize(density: LemmaPageTreeDensity) {
  if (density === "compact") return "size-2.5"
  if (density === "spacious") return "size-3.5"
  return "size-3"
}
