import * as React from "react"
import { AuthGuard } from "lemma-sdk/react"
import { AppLayout } from "@/components/layout/AppLayout"
import { TopBar } from "@/components/layout/TopBar"
import { AssistantExperiencePage } from "@/pages/assistant/AssistantExperiencePage"
import { AssistantEmbeddedPage } from "@/pages/assistant/AssistantEmbeddedPage"
import { AssistantChromePage } from "@/pages/assistant/AssistantChromePage"
import { RecordsPage } from "@/pages/resources/RecordsPage"
import { WorkflowsPage } from "@/pages/resources/WorkflowsPage"
import { AgentsPage } from "@/pages/resources/AgentsPage"
import { FunctionsPage } from "@/pages/resources/FunctionsPage"
import { ThemeMixerPage } from "@/pages/playground/ThemeMixerPage"
import { ShadcnExplorerPage } from "@/pages/playground/ShadcnExplorerPage"
import { StyleTokensPage } from "@/pages/playground/StyleTokensPage"
import { getClient, getShowcaseConfig } from "@/lib/client"

interface PageEntry {
  title: string
  description: string
  component: React.ComponentType<{ podId: string | null }>
}

const PAGES: Record<string, PageEntry> = {
  "/assistant/experience": { title: "Full Experience", description: "Complete assistant UI with all features", component: AssistantExperiencePage },
  "/assistant/embedded": { title: "Embedded", description: "Self-contained embeddable assistant", component: AssistantEmbeddedPage },
  "/assistant/chrome": { title: "Chrome Primitives", description: "Build your own assistant UI from primitives", component: AssistantChromePage },
  "/resources/records": { title: "Records Workspace", description: "Browse, filter, and edit records", component: RecordsPage },
  "/resources/workflows": { title: "Workflows", description: "Launch and monitor workflow runs", component: WorkflowsPage },
  "/resources/agents": { title: "Agents", description: "Run agents and view outputs", component: AgentsPage },
  "/resources/functions": { title: "Functions", description: "Execute functions and view results", component: FunctionsPage },
  "/playground/theme": { title: "Theme Mixer", description: "Customize and preview themes", component: ThemeMixerPage },
  "/playground/shadcn": { title: "shadcn Explorer", description: "Explore and compose shadcn components", component: ShadcnExplorerPage },
  "/playground/tokens": { title: "Style Tokens", description: "Visual CSS variable explorer", component: StyleTokensPage },
}

function LoadingScreen() {
  return <p>Checking auth…</p>
}

export default function App() {
  const [activeSection, setActiveSection] = React.useState("/assistant/experience")
  const [podId, setPodId] = React.useState<string | null>(() => getShowcaseConfig().podId || null)
  const [isDark, setIsDark] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const page = PAGES[activeSection]
  const PageComponent = page?.component

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  return (
    <AuthGuard client={getClient()} loadingFallback={<LoadingScreen />}>
      <AppLayout
        activeSection={activeSection}
        onNavigate={setActiveSection}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      >
        <TopBar
          section={activeSection}
          title={page?.title ?? ""}
          description={page?.description ?? ""}
          isDark={isDark}
          onDarkModeChange={setIsDark}
          podId={podId}
          onPodIdChange={setPodId}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />
        {PageComponent ? <PageComponent podId={podId} /> : (
          <div className="flex items-center justify-center p-6 py-20 text-muted-foreground">
            Select a section from the sidebar
          </div>
        )}
      </AppLayout>
    </AuthGuard>
  )
}
