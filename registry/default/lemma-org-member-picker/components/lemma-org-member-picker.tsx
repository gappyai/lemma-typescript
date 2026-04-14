"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useOrganizationMembers } from "lemma-sdk/react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DATA_PANEL_CARD_CLASS_NAME,
  DATA_PANEL_HEADER_CLASS_NAME,
  DATA_PANEL_CONTENT_CLASS_NAME,
  DATA_INPUT_CLASS_NAME,
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
      <SelectTrigger className={cn(DATA_INPUT_CLASS_NAME, "min-w-[240px]")}>
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
    <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
      <div className={DATA_PANEL_HEADER_CLASS_NAME}>
        <DataWorkspaceHeader actions={selector} description={description} title={title} />
      </div>
      <div className={DATA_PANEL_CONTENT_CLASS_NAME}>
        {state.error ? (
          <DataWorkspaceState description={state.error.message} heading="Failed to load members" tone="danger" />
        ) : null}
      </div>
    </div>
  )
})
LemmaOrgMemberPicker.displayName = "LemmaOrgMemberPicker"
