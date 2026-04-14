"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { usePodAccess } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DataWorkspaceHeader,
  DataWorkspaceState,
} from "@/components/lemma/registry-data-workspace"
import { cn } from "@/lib/utils"

export interface LemmaPodAccessCardProps extends React.HTMLAttributes<HTMLDivElement> {
  client: LemmaClient
  podId?: string
  title?: string
  description?: string
}

export const LemmaPodAccessCard = React.forwardRef<HTMLDivElement, LemmaPodAccessCardProps>(
  ({
    client,
    podId,
    title = "Pod Access",
    description = "Check current user membership and request access when needed.",
    className,
    ...props
  }, ref) => {
  const access = usePodAccess({
    client,
    podId,
    enabled: !!(podId ?? client.podId),
  })

  const actions = (
    <Button
      disabled={access.isLoading}
      onClick={() => {
        void access.refresh()
      }}
      type="button"
      variant="outline"
    >
      {access.isLoading ? "Checking\u2026" : "Refresh"}
    </Button>
  )

  return (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props}>
      <CardHeader className="p-6">
        <DataWorkspaceHeader actions={actions} description={description} title={title} />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex flex-col gap-4">
          {access.error ? (
            <DataWorkspaceState description={access.error.message} heading="Access check failed" tone="danger" />
          ) : null}
          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Status</div>
            <div className="font-medium">{access.status}</div>
          </div>
          {access.member ? (
            <div className="rounded-lg border bg-muted/50 p-4 text-sm">
              <div className="font-medium">{access.member.user_name || access.member.user_email}</div>
              <div className="text-muted-foreground">{access.member.role}</div>
            </div>
          ) : null}
          {access.status === "missing" ? (
            <Button
              disabled={access.isRequestingAccess}
              onClick={() => {
                void access.requestAccess()
              }}
            >
              {access.isRequestingAccess ? "Requesting\u2026" : "Request access"}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </div>
  )
})
LemmaPodAccessCard.displayName = "LemmaPodAccessCard"
