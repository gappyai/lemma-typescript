"use client"

import * as React from "react"
import type { LemmaClient } from "lemma-sdk"
import { useOrganizationMembers } from "lemma-sdk/react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

  return (
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {state.error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error.message}
          </div>
        ) : null}
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder={state.isLoading ? "Loading members..." : "Select a member"} />
          </SelectTrigger>
          <SelectContent>
            {state.members.map((member) => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {member.user?.first_name || member.user?.email || member.user_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
})
LemmaOrgMemberPicker.displayName = "LemmaOrgMemberPicker"
