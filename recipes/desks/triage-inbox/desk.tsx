import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Inbox, Bot, BarChart3 } from "lucide-react";
import { LemmaClient } from "lemma-sdk";
import { useAssistantController } from "lemma-sdk/react";
import { AssistantExperienceView } from "@/components/lemma/assistant/assistant-experience";
import { LemmaActionSurface } from "@/components/lemma/lemma-action-surface";
import { LemmaGlobalSearch } from "@/components/lemma/lemma-global-search";
import { LemmaInsights } from "@/components/lemma/lemma-insights";
import { LemmaRecordsView } from "@/components/lemma/lemma-records-view";
import { cn } from "@/lib/utils";
import "@/styles/lemma-records-view.css";

const podId = import.meta.env.VITE_LEMMA_POD_ID;
const assistantName = import.meta.env.VITE_LEMMA_ASSISTANT_NAME ?? "triage-assistant";

const client = new LemmaClient({ podId });

const navItems = [
  { to: "/queue", label: "Queue", icon: Inbox },
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/insights", label: "Insights", icon: BarChart3 },
] as const;

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-muted/30 p-4">
        <div className="mb-6">
          <div className="text-sm font-medium text-muted-foreground">Recipe Desk</div>
          <h1 className="text-lg font-semibold">Triage Inbox</h1>
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

function QueuePage() {
  return (
    <div className="grid gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LemmaGlobalSearch
          client={client}
          podId={podId}
          tables={[
            {
              tableName: "triage_items",
              label: "Inbox",
              searchFields: ["identifier", "subject", "summary", "status", "priority"],
              displayField: "subject",
              subtitleField: "status",
            },
          ]}
          assistant={{ assistantName, label: "Ask Triage" }}
          appearance="minimal"
          density="compact"
        />
        <LemmaActionSurface
          client={client}
          podId={podId}
          title="Escalate with assistant"
          description="Use an agent-backed action when an item needs operator help beyond a quick status update."
          variant="button"
          action={{
            kind: "agent",
            agentName: "triage-assistant",
            label: "Escalate item",
            description: "Start a guided triage session.",
          }}
          appearance="contained"
          density="compact"
        />
      </div>
      <LemmaRecordsView
        client={client}
        podId={podId}
        tableName="triage_items"
        preset="triage"
        defaultView="list"
        detailMode="sheet"
        createMode="sheet"
        hiddenFields={["id", "created_at", "updated_at"]}
        appearance="minimal"
        density="compact"
      />
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

function InsightsPage() {
  return (
    <div className="p-6">
      <LemmaInsights
        client={client}
        podId={podId}
        title="Inbox Health"
        description="Use this route for volume, SLA, and queue-shape reporting."
        appearance="contained"
        density="comfortable"
      />
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/queue" replace />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/insights" element={<InsightsPage />} />
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
