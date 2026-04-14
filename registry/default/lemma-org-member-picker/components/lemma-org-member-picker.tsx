"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useOrganizationMembers } from "lemma-sdk/react"
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

export interface LemmaOrgMemberPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  client: LemmaClient
  organizationId: string
  value?: string
  onValueChange?: (userId: string) => void
  title?: string
  description?: string
}

export const LemmaOrgMemberPicker = React.forwardRef<HTMLDivElement, LemmaOrgMemberPickerProps>(
  ({
    client,
    organizationId,
    value,
    onValueChange,
    title = "Organization Member Picker",
    description = "Select an organization member by user ID.",
    className,
    ...props
  }, ref) => {
  const state = useOrganizationMembers({
    client,
    organizationId,
    enabled: organizationId.trim().length > 0,
  })

  const selector = (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="min-w-[240px]">
        <SelectValue placeholder={state.isLoading ? "Loading members\u2026" : "Select a member"} />
      </SelectTrigger>
      <SelectContent>
        {state.members.map((member) => (
          <SelectItem key={member.user_id} value={member.user_id}>
            {member.user?.first_name || member.user?.email || member.user_id}
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
        {state.error ? (
          <DataWorkspaceState description={state.error.message} heading="Failed to load members" tone="danger" />
        ) : null}
      </CardContent>
    </div>
  )
})
LemmaOrgMemberPicker.displayName = "LemmaOrgMemberPicker"
