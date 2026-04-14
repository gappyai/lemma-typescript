"use client"

import * as React from "react"
import type { LemmaClient, PodMember } from "lemma-sdk"
import { useMembers } from "lemma-sdk/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DataWorkspaceHeader,
  DataWorkspaceState,
} from "@/components/lemma/registry-data-workspace"
import { cn } from "@/lib/utils"

export interface LemmaMemberPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  client: LemmaClient
  podId?: string
  members?: PodMember[]
  value?: string
  onValueChange?: (userId: string) => void
  title?: string
  description?: string
}

export const LemmaMemberPicker = React.forwardRef<HTMLDivElement, LemmaMemberPickerProps>(
  ({
    client,
    podId,
    members,
    value,
    onValueChange,
    title = "Member Picker",
    description = "Select a pod member by user ID.",
    className,
    ...props
  }, ref) => {
  const state = useMembers({
    client,
    podId,
    enabled: !members,
  })
  const rows = members ?? state.members

  const selector = (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="min-w-[240px]">
        <SelectValue placeholder={state.isLoading ? "Loading members\u2026" : "Select a member"} />
      </SelectTrigger>
      <SelectContent>
        {rows.map((member) => (
          <SelectItem key={member.user_id} value={member.user_id}>
            {member.user_name || member.user_email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props}>
      <CardHeader className="p-6">
        <DataWorkspaceHeader actions={selector} description={description} title={title} />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {state.error && !members ? (
          <DataWorkspaceState description={state.error.message} heading="Failed to load members" tone="danger" />
        ) : null}
      </CardContent>
    </div>
  )
})
LemmaMemberPicker.displayName = "LemmaMemberPicker"
