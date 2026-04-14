"use client"

import * as React from "react"
import type { LemmaClient, PodMember } from "lemma-sdk"
import { useMembers } from "lemma-sdk/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_SUBTLE_ACTION_CLASS_NAME,
  DATA_TABLE_FRAME_CLASS_NAME,
  DataWorkspaceHeader,
  DataWorkspaceState,
  dataWorkspaceMetaBadgeClassName,
  dataWorkspaceRowClassName,
} from "@/components/lemma/registry-data-workspace"

export interface LemmaMembersTableProps extends React.HTMLAttributes<HTMLDivElement> {
  client: LemmaClient
  podId?: string
  members?: PodMember[]
  title?: string
  description?: string
}

export const LemmaMembersTable = React.forwardRef<HTMLDivElement, LemmaMembersTableProps>(
  ({
    client,
    podId,
    members,
    title = "Members",
    description = "Pod collaborators and roles.",
    className,
    ...props
  }, ref) => {
  const state = useMembers({
    client,
    podId,
    enabled: !members,
  })
  const rows = members ?? state.members

  return (
    <Card ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
      <CardHeader className={DATA_PANEL_HEADER_CLASS_NAME}>
        <DataWorkspaceHeader
          actions={!members ? (
            <Button
              className={DATA_SUBTLE_ACTION_CLASS_NAME}
              disabled={state.isLoading}
              onClick={() => {
                void state.refresh()
              }}
              type="button"
              variant="ghost"
            >
              {state.isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          ) : null}
          description={description}
          eyebrow="Access"
          meta={(
            <Badge className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em]", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
              {rows.length} member{rows.length === 1 ? "" : "s"}
            </Badge>
          )}
          title={title}
        />
      </CardHeader>
      <CardContent className={DATA_PANEL_CONTENT_CLASS_NAME}>
        {state.error && !members ? (
          <DataWorkspaceState className="mb-4" description={state.error.message} tone="danger" />
        ) : null}
        {rows.length === 0 ? (
          <DataWorkspaceState description="No members loaded." heading="Waiting for collaborators" />
        ) : (
          <div className={DATA_TABLE_FRAME_CLASS_NAME}>
            <Table>
              <TableHeader className="bg-muted/[0.3]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="border-b border-border/60 px-4 py-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">Name</TableHead>
                  <TableHead className="border-b border-border/60 px-4 py-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">Email</TableHead>
                  <TableHead className="border-b border-border/60 px-4 py-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">Role</TableHead>
                  <TableHead className="border-b border-border/60 px-4 py-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">User ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((member) => (
                  <TableRow key={member.user_id} className={dataWorkspaceRowClassName()}>
                    <TableCell className="px-4 py-3">
                      <div className="font-medium text-foreground">{member.user_name ?? "Unnamed"}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">{member.user_email}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em]", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">{member.user_id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
LemmaMembersTable.displayName = "LemmaMembersTable"
