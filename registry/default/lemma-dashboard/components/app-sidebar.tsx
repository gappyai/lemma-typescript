"use client"

import * as React from "react"
import { Bot, Code2, Database, GitBranch, LayoutDashboard, Settings, HelpCircle } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar"

export interface LemmaNavGroup {
  label: string
  items: Array<{
    title: string
    href?: string
    icon: React.ReactNode
    isActive?: boolean
    onClick?: () => void
  }>
}

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  brand?: React.ReactNode
  navGroups?: LemmaNavGroup[]
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

export function AppSidebar({
  brand,
  navGroups = defaultNavGroups,
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
              <div className="flex items-center gap-2.5 px-1">
                <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
                  <Database className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">{brand ?? "Lemma"}</span>
                  <span className="text-[11px] text-muted-foreground">Data Platform</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeHref === item.href}
                      onClick={item.onClick ?? (item.href ? () => onNavigate?.(item.href) : undefined)}
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
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#">
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#">
                    <HelpCircle className="size-4" />
                    <span>Get Help</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
      <SidebarRail />
    </Sidebar>
  )
}
