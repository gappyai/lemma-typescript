import { useState } from "react"
import {
  MessageSquare,
  Database,
  Palette,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  label: string
  route: string
}

interface NavSection {
  id: string
  label: string
  icon: React.ReactNode
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    id: "assistant",
    label: "Assistant",
    icon: <MessageSquare className="size-3.5" />,
    items: [
      { label: "Full Experience", route: "/assistant/experience" },
      { label: "Embedded", route: "/assistant/embedded" },
      { label: "Chrome Primitives", route: "/assistant/chrome" },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    icon: <Database className="size-3.5" />,
    items: [
      { label: "Records Workspace", route: "/resources/records" },
      { label: "Workflows", route: "/resources/workflows" },
      { label: "Agents", route: "/resources/agents" },
      { label: "Functions", route: "/resources/functions" },
    ],
  },
  {
    id: "playground",
    label: "Playground",
    icon: <Palette className="size-3.5" />,
    items: [
      { label: "Theme Mixer", route: "/playground/theme" },
      { label: "shadcn Explorer", route: "/playground/shadcn" },
      { label: "Style Tokens", route: "/playground/tokens" },
    ],
  },
]

interface AppSidebarProps {
  activeSection: string
  onNavigate: (section: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function AppSidebar({
  activeSection,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: AppSidebarProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  function toggleSection(sectionId: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-background transition-[width] duration-200 ease-in-out",
        collapsed ? "w-0 overflow-hidden" : "w-[280px]",
      )}
    >
      <div className="flex items-center justify-between px-4 py-5">
        <div className="grid gap-0.5">
          <div className="text-lg font-semibold tracking-tight">Lemma</div>
          <div className="text-xs text-muted-foreground">Component Showcase</div>
        </div>
        {onToggleCollapse ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
          >
            <PanelLeftClose className="size-4" />
          </Button>
        ) : null}
      </div>

      <Separator />

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="grid gap-1">
          {navSections.map((section) => (
            <div key={section.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                {section.icon}
                <span className="flex-1 text-left">{section.label}</span>
                {collapsedSections.has(section.id) ? (
                  <ChevronRight className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>

              {!collapsedSections.has(section.id) ? (
                <div className="grid gap-0.5 pb-1">
                  {section.items.map((item) => {
                    const isActive = activeSection === item.route
                    return (
                      <Button
                        key={item.route}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-full justify-start gap-2 px-2 font-normal",
                          isActive && "bg-muted font-medium border-l-2 border-l-primary rounded-l-none",
                        )}
                        onClick={() => onNavigate(item.route)}
                      >
                        {item.label}
                      </Button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </nav>

      <Separator />

      <div className="px-3 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">v0.1</Badge>
          <span className="text-[11px] text-muted-foreground">Lemma SDK Showcase</span>
        </div>
      </div>
    </aside>
  )
}

export function MobileSidebarTrigger({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onToggleCollapse}
    >
      <PanelLeft className="size-4" />
    </Button>
  )
}
