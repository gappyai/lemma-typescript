"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export interface SiteHeaderProps {
  breadcrumb?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function SiteHeader({ breadcrumb, actions, className }: SiteHeaderProps) {
  return (
    <header className={cn("flex shrink-0 items-center gap-2 border-b px-4 py-2 lg:px-6", className)}>
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
      {breadcrumb ? <div className="min-w-0 flex-1">{breadcrumb}</div> : <div className="flex-1" />}
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}
