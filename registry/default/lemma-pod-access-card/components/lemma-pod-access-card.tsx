"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { usePodAccess } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DATA_PANEL_SECTION_CLASS_NAME,
  DATA_SUBTLE_ACTION_CLASS_NAME,
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
      className={DATA_SUBTLE_ACTION_CLASS_NAME}
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
    <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
      <div className={DATA_PANEL_HEADER_CLASS_NAME}>
        <DataWorkspaceHeader actions={actions} description={description} title={title} />
      </div>
      <div className={DATA_PANEL_CONTENT_CLASS_NAME}>
        <div className="flex flex-col gap-4">
          {access.error ? (
            <DataWorkspaceState description={access.error.message} heading="Access check failed" tone="danger" />
          ) : null}
          <div className={cn(DATA_PANEL_SECTION_CLASS_NAME, "p-4 text-sm")}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Status</div>
            <div className="font-medium">{access.status}</div>
          </div>
          {access.member ? (
            <div className={cn(DATA_PANEL_SECTION_CLASS_NAME, "p-4 text-sm")}>
              <div className="font-medium">{access.member.user_name || access.member.user_email}</div>
              <div className="text-muted-foreground">{access.member.role}</div>
            </div>
          ) : null}
          {access.status === "missing" ? (
            <Button
              className="rounded-xl"
              disabled={access.isRequestingAccess}
              onClick={() => {
                void access.requestAccess()
              }}
            >
              {access.isRequestingAccess ? "Requesting\u2026" : "Request access"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
})
LemmaPodAccessCard.displayName = "LemmaPodAccessCard"
