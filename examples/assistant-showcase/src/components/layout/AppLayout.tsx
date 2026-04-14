import { useState, type ReactNode } from "react"
import { AppSidebar } from "./AppSidebar"

interface AppLayoutProps {
  children: ReactNode
  activeSection: string
  onNavigate: (section: string) => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function AppLayout({ children, activeSection, onNavigate, mobileOpen = false, onMobileClose }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:flex">
        <AppSidebar
          activeSection={activeSection}
          onNavigate={onNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          <div className="relative z-10 h-full w-[280px]">
            <AppSidebar
              activeSection={activeSection}
              onNavigate={(section) => {
                onNavigate(section)
                onMobileClose?.()
              }}
              onToggleCollapse={() => onMobileClose?.()}
            />
          </div>
        </div>
      ) : null}

      <main className="flex-1 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  )
}
