import { useEffect, useState } from "react"
import { Menu, Moon, Sun } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

interface TopBarProps {
  section: string
  title: string
  description: string
  isDark: boolean
  onDarkModeChange: (dark: boolean) => void
  podId: string | null
  onPodIdChange: (id: string | null) => void
  onMobileMenuToggle?: () => void
}

function sectionGroup(route: string): string {
  if (route.startsWith("/assistant")) return "Assistant"
  if (route.startsWith("/resources")) return "Resources"
  if (route.startsWith("/playground")) return "Playground"
  return ""
}

export function TopBar({
  section,
  title,
  description,
  isDark,
  onDarkModeChange,
  podId,
  onPodIdChange,
  onMobileMenuToggle,
}: TopBarProps) {
  const group = sectionGroup(section)
  const [podDraft, setPodDraft] = useState(podId ?? "")

  useEffect(() => {
    setPodDraft(podId ?? "")
  }, [podId])

  return (
    <div className="flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6 py-3">
      <div className="flex items-center gap-2 min-w-0">
        {group ? (
          <>
            <Badge variant="outline" className="text-[11px] font-normal shrink-0">{group}</Badge>
            <span className="text-muted-foreground/50 shrink-0">/</span>
          </>
        ) : null}
        <span className="text-sm font-medium truncate">{title}</span>
        {description ? (
          <span className="text-xs text-muted-foreground ml-1 hidden lg:inline truncate">{description}</span>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <Input
            className="h-7 w-[180px] text-xs"
            placeholder="pod_..."
            value={podDraft}
            onChange={(e) => setPodDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onPodIdChange(podDraft.trim() || null)
            }}
            onBlur={() => {
              const next = podDraft.trim() || null
              if (next !== podId) onPodIdChange(next)
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Sun className="size-3.5 text-muted-foreground" />
          <Switch
            size="sm"
            checked={isDark}
            onCheckedChange={(checked) => onDarkModeChange(checked === true)}
          />
          <Moon className="size-3.5 text-muted-foreground" />
        </div>

        {onMobileMenuToggle ? (
          <>
            <Separator orientation="vertical" className="h-4" />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onMobileMenuToggle}
              className="md:hidden"
            >
              <Menu className="size-4" />
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}
