"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, User, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { useMembers } from "lemma-sdk/react"
import type { LemmaClient, PodMember } from "lemma-sdk"
import { cn } from "@/lib/utils"

export type LemmaMemberAppearance = "default" | "minimal" | "borderless" | "contained"
export type LemmaMemberDensity = "compact" | "comfortable" | "spacious"
export type LemmaMemberRadius = "none" | "sm" | "md" | "lg" | "xl"
export type LemmaMemberChipSize = "sm" | "md" | "lg"

export interface LemmaMemberChipProps {
  member?: PodMember | null
  userId?: string | null
  label?: React.ReactNode
  email?: string | null
  role?: React.ReactNode
  avatarUrl?: string | null
  size?: LemmaMemberChipSize
  appearance?: LemmaMemberAppearance
  radius?: LemmaMemberRadius
  className?: string
}

export interface LemmaAvatarGroupProps {
  members: Array<PodMember | null | undefined>
  max?: number
  size?: LemmaMemberChipSize
  radius?: LemmaMemberRadius
  className?: string
}

export interface LemmaMemberSelectProps {
  client: LemmaClient
  podId?: string
  value?: string | null
  onValueChange?: (userId: string | null, member: PodMember | null) => void
  enabled?: boolean
  placeholder?: string
  searchPlaceholder?: string
  clearable?: boolean
  appearance?: LemmaMemberAppearance
  density?: LemmaMemberDensity
  radius?: LemmaMemberRadius
  className?: string
}

export interface LemmaUserFieldProps {
  client: LemmaClient
  podId?: string
  userId?: string | null
  enabled?: boolean
  fallback?: React.ReactNode
  appearance?: LemmaMemberAppearance
  radius?: LemmaMemberRadius
  size?: LemmaMemberChipSize
  className?: string
}

export function LemmaMemberChip({
  member,
  userId,
  label,
  email,
  role,
  avatarUrl,
  size = "md",
  appearance = "default",
  radius = "lg",
  className,
}: LemmaMemberChipProps) {
  const name = label ?? memberLabel(member) ?? userId ?? "Unknown user"
  const resolvedEmail = email ?? member?.user_email
  const resolvedRole = role ?? member?.role
  const initials = getInitials(String(name))

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2 border font-medium", chipClassName(appearance), chipSizeClassName(size), radiusClassName(radius, "pill"), className)}>
      <span className={cn("flex shrink-0 items-center justify-center overflow-hidden bg-muted text-muted-foreground", avatarSizeClassName(size), radiusClassName(radius, "pill"))}>
        {avatarUrl ? <img src={avatarUrl} alt={String(name)} className="size-full object-cover" /> : <span>{initials}</span>}
      </span>
      <span className="min-w-0">
        <span className="block truncate">{name}</span>
        {resolvedEmail && size !== "sm" ? <span className="block truncate text-[10px] font-normal text-muted-foreground">{resolvedEmail}</span> : null}
      </span>
      {resolvedRole ? <Badge variant="secondary" className="shrink-0 text-[10px]">{resolvedRole}</Badge> : null}
    </span>
  )
}

export function LemmaAvatarGroup({
  members,
  max = 4,
  size = "md",
  radius = "lg",
  className,
}: LemmaAvatarGroupProps) {
  const visibleMembers = members.filter(Boolean).slice(0, max) as PodMember[]
  const extraCount = Math.max(0, members.filter(Boolean).length - visibleMembers.length)

  return (
    <div className={cn("flex items-center", className)}>
      {visibleMembers.map((member, index) => (
        <span
          key={member.user_id}
          title={memberLabel(member)}
          className={cn(
            "flex shrink-0 items-center justify-center border-2 border-background bg-muted text-muted-foreground ring-1 ring-border/50",
            avatarSizeClassName(size),
            radiusClassName(radius, "pill"),
            index > 0 ? "-ml-2" : null,
          )}
        >
          {getInitials(memberLabel(member))}
        </span>
      ))}
      {extraCount > 0 ? (
        <span className={cn("-ml-2 flex shrink-0 items-center justify-center border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground ring-1 ring-border/50", avatarSizeClassName(size), radiusClassName(radius, "pill"))}>
          +{extraCount}
        </span>
      ) : null}
    </div>
  )
}

export function LemmaMemberSelect({
  client,
  podId,
  value,
  onValueChange,
  enabled = true,
  placeholder = "Select member",
  searchPlaceholder = "Search members...",
  clearable = true,
  appearance = "default",
  density = "comfortable",
  radius = "lg",
  className,
}: LemmaMemberSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const membersState = useMembers({ client, podId, enabled })
  const selectedMember = React.useMemo(
    () => membersState.members.find((member) => member.user_id === value) ?? null,
    [membersState.members, value],
  )
  const filteredMembers = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return membersState.members
    return membersState.members.filter((member) => {
      const haystack = [member.user_name, member.user_email, member.user_id, member.role].filter(Boolean).join(" ").toLowerCase()
      return haystack.includes(needle)
    })
  }, [membersState.members, query])

  const selectMember = React.useCallback((member: PodMember | null) => {
    onValueChange?.(member?.user_id ?? null, member)
    setOpen(false)
    setQuery("")
  }, [onValueChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className={cn(
          "inline-flex min-w-52 items-center justify-between gap-3 border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
          appearance === "minimal" || appearance === "borderless" ? "border-transparent bg-transparent hover:bg-muted" : "border-border bg-background hover:bg-muted",
          triggerClassName(appearance, density, radius),
          className,
        )}
        disabled={!enabled}
      >
        <span className="min-w-0 flex-1 text-left">
          {selectedMember ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className={cn("flex shrink-0 items-center justify-center bg-muted text-[10px] text-muted-foreground", radiusClassName(radius, "pill"), "size-5")}>
                {getInitials(memberLabel(selectedMember))}
              </span>
              <span className="truncate">{memberLabel(selectedMember)}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-72 p-0", popoverClassName(appearance, radius))}>
        <div className="border-b border-border/40 p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className={cn("h-8 pl-8 text-xs", radiusClassName(radius, "control"))}
            />
          </div>
        </div>

        <div className="max-h-72 overflow-auto p-1">
          {membersState.isLoading ? (
            <div className="flex flex-col gap-2 p-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Skeleton className="size-7 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : membersState.error ? (
            <div className="p-3 text-sm text-destructive">{membersState.error.message}</div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex min-h-24 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <User className="size-5" />
              No members found
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {clearable && value ? (
                <button
                  type="button"
                  className={cn("flex w-full items-center gap-2 px-2 py-2 text-left text-sm text-muted-foreground hover:bg-muted/45", radiusClassName(radius, "control"))}
                  onClick={() => selectMember(null)}
                >
                  <X className="size-4" />
                  Clear selection
                </button>
              ) : null}
              {filteredMembers.map((member) => {
                const selected = member.user_id === value
                return (
                  <button
                    key={member.user_id}
                    type="button"
                    className={cn("flex w-full items-center gap-2 px-2 py-2 text-left text-sm hover:bg-muted/45", radiusClassName(radius, "control"), selected ? "bg-muted/60" : null)}
                    onClick={() => selectMember(member)}
                  >
                    <span className={cn("flex size-7 shrink-0 items-center justify-center bg-muted text-xs text-muted-foreground", radiusClassName(radius, "pill"))}>
                      {getInitials(memberLabel(member))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{memberLabel(member)}</span>
                      <span className="block truncate text-xs text-muted-foreground">{member.user_email}</span>
                    </span>
                    {selected ? <Check className="size-4 text-primary" /> : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function LemmaUserField({
  client,
  podId,
  userId,
  enabled = true,
  fallback,
  appearance = "default",
  radius = "lg",
  size = "md",
  className,
}: LemmaUserFieldProps) {
  const membersState = useMembers({ client, podId, enabled: enabled && !!userId })
  const member = React.useMemo(
    () => membersState.members.find((candidate) => candidate.user_id === userId) ?? null,
    [membersState.members, userId],
  )

  if (!userId) return <>{fallback ?? <span className="text-muted-foreground">Unassigned</span>}</>
  if (membersState.isLoading) return <Skeleton className="h-7 w-28 rounded-full" />

  return (
    <LemmaMemberChip
      member={member}
      userId={userId}
      label={member ? undefined : fallback ?? shortId(userId)}
      appearance={appearance}
      radius={radius}
      size={size}
      className={className}
    />
  )
}

export function memberLabel(member?: PodMember | null) {
  if (!member) return ""
  return member.user_name || member.user_email || member.user_id
}

function getInitials(value: string) {
  const parts = value.trim().split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function shortId(value: string) {
  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value
}

function chipClassName(appearance: LemmaMemberAppearance) {
  if (appearance === "minimal") return "border-transparent bg-muted/35 text-foreground"
  if (appearance === "borderless") return "border-transparent bg-transparent text-foreground"
  if (appearance === "contained") return "border-border/60 bg-card text-card-foreground"
  return "border-border/50 bg-background text-foreground"
}

function chipSizeClassName(size: LemmaMemberChipSize) {
  if (size === "sm") return "h-6 max-w-44 px-1.5 text-xs"
  if (size === "lg") return "min-h-10 max-w-72 px-2.5 py-1.5 text-sm"
  return "h-8 max-w-60 px-2 text-xs"
}

function avatarSizeClassName(size: LemmaMemberChipSize) {
  if (size === "sm") return "size-4 text-[9px]"
  if (size === "lg") return "size-8 text-sm"
  return "size-6 text-xs"
}

function triggerClassName(
  appearance: LemmaMemberAppearance,
  density: LemmaMemberDensity,
  radius: LemmaMemberRadius,
) {
  return cn(
    density === "compact" ? "h-8 px-2 text-xs" : density === "spacious" ? "h-11 px-3 text-sm" : "h-9 px-2.5 text-sm",
    radiusClassName(radius, "control"),
    appearance === "minimal" ? "border-transparent bg-transparent shadow-none hover:bg-muted/40" : null,
    appearance === "borderless" ? "border-transparent bg-transparent shadow-none" : null,
    appearance === "contained" ? "border-border/70 bg-card" : null,
  )
}

function popoverClassName(appearance: LemmaMemberAppearance, radius: LemmaMemberRadius) {
  return cn(
    radiusClassName(radius, "surface"),
    appearance === "minimal" ? "border-transparent bg-background/95 shadow-none ring-1 ring-border/15" : null,
    appearance === "borderless" ? "border-transparent shadow-2xl ring-0" : null,
    appearance === "contained" ? "border-border/80 bg-card shadow-xl" : null,
  )
}

function radiusClassName(radius: LemmaMemberRadius, target: "surface" | "control" | "pill") {
  if (radius === "none") return "rounded-none"
  if (radius === "sm") return target === "surface" ? "rounded-md" : "rounded-sm"
  if (radius === "md") return target === "surface" ? "rounded-lg" : "rounded-md"
  if (radius === "xl") return target === "pill" ? "rounded-full" : target === "control" ? "rounded-xl" : "rounded-2xl"
  return target === "pill" ? "rounded-full" : target === "control" ? "rounded-lg" : "rounded-xl"
}
