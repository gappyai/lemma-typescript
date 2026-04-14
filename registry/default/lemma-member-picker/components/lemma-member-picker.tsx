"use client"

import * as React from "react"
import type { LemmaClient, PodMember } from "lemma-sdk"
import { useMembers } from "lemma-sdk/react"
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

  return (
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {state.error && !members ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error.message}
          </div>
        ) : null}
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder={state.isLoading ? "Loading members..." : "Select a member"} />
          </SelectTrigger>
          <SelectContent>
            {rows.map((member) => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {member.user_name || member.user_email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
})
LemmaMemberPicker.displayName = "LemmaMemberPicker"
