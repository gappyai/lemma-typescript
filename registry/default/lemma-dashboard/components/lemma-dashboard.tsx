"use client"

import * as React from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar, type LemmaNavGroup } from "@/components/lemma/app-sidebar"
import { SiteHeader } from "@/components/lemma/site-header"
import { SectionCards } from "@/components/lemma/section-cards"

export interface LemmaDashboardProps extends React.HTMLAttributes<HTMLDivElement> {
  brand?: React.ReactNode
  brandSublabel?: string
  activeHref?: string
  navGroups?: LemmaNavGroup[]
  secondaryItems?: Array<{
    title: string
    href?: string
    icon?: React.ReactNode
  }>
  footer?: React.ReactNode
  headerBreadcrumb?: React.ReactNode
  headerActions?: React.ReactNode
  cards?: Array<{
    title: string
    value: React.ReactNode
    description?: string
    icon?: React.ReactNode
    badge?: React.ReactNode
  }>
  children?: React.ReactNode
}

export function LemmaDashboard({
  brand,
  brandSublabel,
  activeHref,
  navGroups,
  secondaryItems,
  footer,
  headerBreadcrumb,
  headerActions,
  cards,
  children,
  className,
  ...props
}: LemmaDashboardProps) {
  return (
    <div className={className} {...props}>
      <SidebarProvider>
        <AppSidebar
          activeHref={activeHref}
          brand={brand}
          brandSublabel={brandSublabel}
          navGroups={navGroups}
          secondaryItems={secondaryItems}
          footer={footer}
        />
        <SidebarInset>
          <SiteHeader actions={headerActions} breadcrumb={headerBreadcrumb} />
          <div className="flex min-h-0 flex-1 flex-col overflow-auto">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {cards ? <SectionCards cards={cards} /> : null}
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
