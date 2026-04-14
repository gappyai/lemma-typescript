"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { usePodAccess } from "lemma-sdk/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

  return (
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {access.error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {access.error.message}
          </div>
        ) : null}
        <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
          <div className="text-muted-foreground">Status</div>
          <div className="font-medium">{access.status}</div>
        </div>
        {access.member ? (
          <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
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
            {access.isRequestingAccess ? "Requesting..." : "Request access"}
          </Button>
        ) : null}
        <Button
          disabled={access.isLoading}
          onClick={() => {
            void access.refresh()
          }}
          variant="outline"
        >
          {access.isLoading ? "Checking..." : "Refresh"}
        </Button>
      </CardContent>
    </Card>
  )
})
LemmaPodAccessCard.displayName = "LemmaPodAccessCard"
