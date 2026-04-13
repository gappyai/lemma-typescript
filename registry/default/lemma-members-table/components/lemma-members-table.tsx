"use client"

import type { LemmaClient, PodMember } from "lemma-sdk"
import { useMembers } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface LemmaMembersTableProps {
  client: LemmaClient
  podId?: string
  members?: PodMember[]
  title?: string
  description?: string
}

export function LemmaMembersTable({
  client,
  podId,
  members,
  title = "Members",
  description = "Pod collaborators and roles.",
}: LemmaMembersTableProps) {
  const state = useMembers({
    client,
    podId,
    enabled: !members,
  })
  const rows = members ?? state.members

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {!members ? (
            <Button
              disabled={state.isLoading}
              onClick={() => {
                void state.refresh()
              }}
              variant="outline"
            >
              {state.isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {state.error && !members ? (
          <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error.message}
          </div>
        ) : null}
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-6 text-sm text-muted-foreground">
            No members loaded.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">User ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((member) => (
                  <tr key={member.user_id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{member.user_name ?? "Unnamed"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{member.user_email}</td>
                    <td className="px-3 py-2">{member.role}</td>
                    <td className="px-3 py-2 text-muted-foreground">{member.user_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
