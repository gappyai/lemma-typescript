import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Bug, Bot, BarChart3 } from "lucide-react";
import { LemmaClient } from "lemma-sdk";
import { useAssistantController } from "lemma-sdk/react";
import { AssistantExperienceView } from "@/components/lemma/assistant/assistant-experience";
import { LemmaActivityFeed } from "@/components/lemma/lemma-activity-feed";
import { LemmaComments } from "@/components/lemma/lemma-comments";
import { LemmaDetailPanel } from "@/components/lemma/lemma-detail-panel";
import { LemmaInsights } from "@/components/lemma/lemma-insights";
import { LemmaRecordsView } from "@/components/lemma/lemma-records-view";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "@/styles/lemma-records-view.css";

const podId = import.meta.env.VITE_LEMMA_POD_ID;
const assistantName = import.meta.env.VITE_LEMMA_ASSISTANT_NAME ?? "issue-copilot";

const client = new LemmaClient({ podId });

const navItems = [
  { to: "/issues", label: "Issues", icon: Bug },
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/reports", label: "Reports", icon: BarChart3 },
] as const;

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-muted/30 p-4">
        <div className="mb-6">
          <div className="text-sm font-medium text-muted-foreground">Recipe Desk</div>
          <h1 className="text-lg font-semibold">Issue Tracker</h1>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function IssuesPage() {
  return (
    <div className="grid min-h-screen grid-cols-[minmax(0,1fr)_420px]">
      <LemmaRecordsView
        client={client}
        podId={podId}
        tableName="issues"
        preset="issues"
        defaultView="linear"
        detailMode="inline"
        createMode="sheet"
        hiddenFields={["id", "created_at", "updated_at"]}
        appearance="minimal"
        density="compact"
      />
      <div className="border-l border-border">
        <LemmaDetailPanel
          client={client}
          podId={podId}
          tableName="issues"
          appearance="minimal"
          density="compact"
        />
      </div>
    </div>
  );
}

function AssistantPage() {
  const controller = useAssistantController({
    client,
    assistantName,
  });

  return (
    <div className="h-screen">
      <AssistantExperienceView controller={controller} mode="page" appearance="minimal" density="compact" />
    </div>
  );
}

function ReportsPage() {
  return (
    <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <LemmaInsights
        client={client}
        podId={podId}
        title="Delivery Health"
        description="Use this as the high-signal reporting route for engineering operations."
        appearance="contained"
        density="comfortable"
      />
      <div className="grid gap-6">
        <LemmaActivityFeed
          client={client}
          podId={podId}
          title="Recent Activity"
          sources={[{ tableName: "issues", timestampField: "updated_at", descriptionField: "title" }]}
          appearance="contained"
          density="compact"
        />
        <LemmaComments
          client={client}
          podId={podId}
          tableName="issues"
          foreignKey="issue_id"
          appearance="contained"
          density="compact"
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/issues" replace />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
