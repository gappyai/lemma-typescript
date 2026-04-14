"use client"

import * as React from "react"
import type { LemmaClient, PodMember } from "lemma-sdk"
import { useMembers } from "lemma-sdk/react"
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
      <SelectTrigger className={cn(DATA_INPUT_CLASS_NAME, "min-w-[240px]")}>
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
    <div ref={ref} className={cn(DATA_PANEL_CARD_CLASS_NAME, className)} {...props}>
      <div className={DATA_PANEL_HEADER_CLASS_NAME}>
        <DataWorkspaceHeader actions={selector} description={description} title={title} />
      </div>
      <div className={DATA_PANEL_CONTENT_CLASS_NAME}>
        {state.error && !members ? (
          <DataWorkspaceState description={state.error.message} heading="Failed to load members" tone="danger" />
        ) : null}
      </div>
    </div>
  )
})
LemmaMemberPicker.displayName = "LemmaMemberPicker"
