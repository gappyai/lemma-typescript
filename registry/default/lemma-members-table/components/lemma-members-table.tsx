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
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardHeader>
        <DataWorkspaceHeader
          actions={!members ? (
            <Button
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
            <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
              {rows.length} member{rows.length === 1 ? "" : "s"}
            </Badge>
          )}
          title={title}
        />
      </CardHeader>
      <CardContent>
        {state.error && !members ? (
          <DataWorkspaceState className="mb-4" description={state.error.message} tone="danger" />
        ) : null}
        {rows.length === 0 ? (
          <DataWorkspaceState description="No members loaded." heading="Waiting for collaborators" />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="border-b px-4 py-3 text-sm font-medium text-muted-foreground">Name</TableHead>
                  <TableHead className="border-b px-4 py-3 text-sm font-medium text-muted-foreground">Email</TableHead>
                  <TableHead className="border-b px-4 py-3 text-sm font-medium text-muted-foreground">Role</TableHead>
                  <TableHead className="border-b px-4 py-3 text-sm font-medium text-muted-foreground">User ID</TableHead>
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
                      <Badge className={cn("rounded-full border px-2 py-0.5 text-xs", dataWorkspaceMetaBadgeClassName("default"))} variant="outline">
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
