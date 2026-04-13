"use client"

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

export interface LemmaMemberPickerProps {
  client: LemmaClient
  podId?: string
  members?: PodMember[]
  value?: string
  onValueChange?: (userId: string) => void
  title?: string
  description?: string
}

export function LemmaMemberPicker({
  client,
  podId,
  members,
  value,
  onValueChange,
  title = "Member Picker",
  description = "Select a pod member by user ID.",
}: LemmaMemberPickerProps) {
  const state = useMembers({
    client,
    podId,
    enabled: !members,
  })
  const rows = members ?? state.members

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {state.error && !members ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
}
