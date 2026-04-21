import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Bot, FileText, Files } from "lucide-react";
import { LemmaClient } from "lemma-sdk";
import { useAssistantController } from "lemma-sdk/react";
import { AssistantExperienceView } from "@/components/lemma/assistant/assistant-experience";
import { LemmaDocumentWorkspace } from "@/components/lemma/lemma-document-workspace";
import { LemmaFileBrowser } from "@/components/lemma/lemma-file-browser";
import { LemmaPageTree } from "@/components/lemma/lemma-page-tree";
import { cn } from "@/lib/utils";

const podId = import.meta.env.VITE_LEMMA_POD_ID;
const assistantName = import.meta.env.VITE_LEMMA_ASSISTANT_NAME ?? "knowledge-guide";

const client = new LemmaClient({ podId });

const navItems = [
  { to: "/pages", label: "Pages", icon: FileText },
  { to: "/files", label: "Files", icon: Files },
  { to: "/assistant", label: "Assistant", icon: Bot },
] as const;

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-muted/30 p-4">
        <div className="mb-6">
          <div className="text-sm font-medium text-muted-foreground">Recipe Desk</div>
          <h1 className="text-lg font-semibold">Docs Workspace OS</h1>
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

function PagesPage() {
  const navigate = useNavigate();

  return (
    <div className="grid h-screen grid-cols-[320px_minmax(0,1fr)]">
      <div className="border-r border-border">
        <LemmaPageTree
          client={client}
          podId={podId}
          tableName="pages"
          parentField="parent_page_id"
          titleField="title"
          appearance="minimal"
          density="compact"
          onPageClick={(record) => {
            const filePath = typeof record.file_path === "string" ? record.file_path : null;
            if (filePath) {
              navigate(`/files?path=${encodeURIComponent(filePath)}`);
            }
          }}
        />
      </div>
      <LemmaDocumentWorkspace
        client={client}
        podId={podId}
        mode="page"
        intent="read"
        file={{ path: "/workspace/home.lemma-doc.json" }}
        appearance="minimal"
        density="comfortable"
      />
    </div>
  );
}

function FilesPage() {
  return (
    <div className="grid h-screen grid-cols-[360px_minmax(0,1fr)]">
      <div className="border-r border-border">
        <LemmaFileBrowser
          client={client}
          podId={podId}
          initialPath="/workspace"
          appearance="minimal"
          density="compact"
        />
      </div>
      <LemmaDocumentWorkspace
        client={client}
        podId={podId}
        mode="page"
        intent="read"
        file={{ path: "/workspace/home.lemma-doc.json" }}
        appearance="minimal"
        density="comfortable"
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

function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/pages" replace />} />
          <Route path="/pages" element={<PagesPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
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
