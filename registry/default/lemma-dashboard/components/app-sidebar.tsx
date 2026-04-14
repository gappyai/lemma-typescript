"use client"

import * as React from "react"
import { Bot, Code2, Database, GitBranch, HelpCircle, LayoutDashboard, Search, Settings } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export interface LemmaNavGroup {
  label?: string
  items: Array<{
    title: string
    href?: string
    icon?: React.ReactNode
    isActive?: boolean
    onClick?: () => void
  }>
}

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  brand?: React.ReactNode
  brandSublabel?: string
  navGroups?: LemmaNavGroup[]
  secondaryItems?: Array<{
    title: string
    href?: string
    icon?: React.ReactNode
  }>
  footer?: React.ReactNode
  activeHref?: string
  onNavigate?: (href: string) => void
}

const defaultNavGroups: LemmaNavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/", icon: <LayoutDashboard className="size-4" /> },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Resources", href: "/resources", icon: <Database className="size-4" /> },
      { title: "Agents", href: "/agents", icon: <Bot className="size-4" /> },
      { title: "Functions", href: "/functions", icon: <Code2 className="size-4" /> },
      { title: "Workflows", href: "/workflows", icon: <GitBranch className="size-4" /> },
    ],
  },
]

const defaultSecondaryItems = [
  { title: "Settings", href: "#", icon: <Settings className="size-4" /> },
  { title: "Get Help", href: "#", icon: <HelpCircle className="size-4" /> },
  { title: "Search", href: "#", icon: <Search className="size-4" /> },
]

export function AppSidebar({
  brand,
  brandSublabel,
  navGroups = defaultNavGroups,
  secondaryItems = defaultSecondaryItems,
  footer,
  activeHref,
  onNavigate,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Database className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{brand ?? "Lemma"}</span>
                  <span className="truncate text-xs text-muted-foreground">{brandSublabel ?? "Data Platform"}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label ?? group.items[0]?.title}>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeHref === item.href}
                      onClick={item.onClick ?? (item.href ? () => onNavigate?.(item.href) : undefined)}
                      tooltip={item.title}
                    >
                      <a href={item.href ?? "#"}>
                        {item.icon}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.href ?? "#"}>
                      {item.icon}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
      <SidebarRail />
    </Sidebar>
  )
}
