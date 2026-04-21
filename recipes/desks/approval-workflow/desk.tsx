import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { CheckSquare, GitBranch } from "lucide-react";
import { LemmaClient } from "lemma-sdk";
import { LemmaActionSurface } from "@/components/lemma/lemma-action-surface";
import { LemmaComments } from "@/components/lemma/lemma-comments";
import { LemmaRecordsView } from "@/components/lemma/lemma-records-view";
import { LemmaWorkflowRunner } from "@/components/lemma/lemma-workflow-runner";
import { cn } from "@/lib/utils";
import "@/styles/lemma-records-view.css";

const podId = import.meta.env.VITE_LEMMA_POD_ID;
const workflowName = import.meta.env.VITE_LEMMA_WORKFLOW_NAME ?? "approval-decision";

const client = new LemmaClient({ podId });

const navItems = [
  { to: "/approvals", label: "Approvals", icon: CheckSquare },
  { to: "/workflow", label: "Workflow", icon: GitBranch },
] as const;

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-muted/30 p-4">
        <div className="mb-6">
          <div className="text-sm font-medium text-muted-foreground">Recipe Desk</div>
          <h1 className="text-lg font-semibold">Approval Workflow</h1>
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

function ApprovalsPage() {
  return (
    <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <LemmaRecordsView
        client={client}
        podId={podId}
        tableName="approval_requests"
        defaultView="list"
        detailMode="sheet"
        createMode="sheet"
        hiddenFields={["id", "created_at", "updated_at"]}
        appearance="minimal"
        density="compact"
      />
      <div className="grid gap-6">
        <LemmaActionSurface
          client={client}
          podId={podId}
          title="Run approval flow"
          description="This is the review action surface for reviewers working the queue."
          variant="panel"
          action={{
            kind: "workflow",
            workflowName,
            label: "Start decision flow",
            description: "Launch the approval-decision workflow for the selected request.",
          }}
          appearance="contained"
          density="compact"
        />
        <LemmaComments
          client={client}
          podId={podId}
          tableName="approval_requests"
          foreignKey="approval_request_id"
          appearance="contained"
          density="compact"
        />
      </div>
    </div>
  );
}

function WorkflowPage() {
  return (
    <div className="p-6">
      <LemmaWorkflowRunner
        client={client}
        podId={podId}
        workflowName={workflowName}
        title="Approval Runs"
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
          <Route path="/" element={<Navigate to="/approvals" replace />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/workflow" element={<WorkflowPage />} />
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
