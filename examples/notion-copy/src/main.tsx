import React from "react";
import ReactDOM from "react-dom/client";
import {
  HashRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  BookOpen,
  Bot,
  Database,
  FileText,
  GitBranch,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { LemmaClient, type RecordFilter } from "lemma-sdk";
import { AuthGuard, useAssistantController } from "lemma-sdk/react";
import { AssistantExperienceView } from "@/components/lemma/assistant/assistant-experience";
import { LemmaActionSurface } from "@/components/lemma/lemma-action-surface";
import { LemmaDocumentWorkspace } from "@/components/lemma/lemma-document-workspace";
import { LemmaFileBrowser } from "@/components/lemma/lemma-file-browser";
import { LemmaGlobalSearch } from "@/components/lemma/lemma-global-search";
import { LemmaInsights, type ChartCardDef, type StatCardDef } from "@/components/lemma/lemma-insights";
import { LemmaMembers } from "@/components/lemma/lemma-members";
import { LemmaPageTree } from "@/components/lemma/lemma-page-tree";
import { LemmaRecordsView } from "@/components/lemma/lemma-records-view";
import { LemmaWorkflowRunner } from "@/components/lemma/lemma-workflow-runner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import "@/index.css";
import "@/styles/lemma-records-view.css";

const browserStorage =
  typeof window !== "undefined" ? window.localStorage : null;

const POD_ID =
  import.meta.env.VITE_LEMMA_POD_ID ||
  import.meta.env.VITE_NOTION_COPY_POD_ID ||
  browserStorage?.getItem("lemma_pod_id") ||
  "019daa7d-7521-7239-bdc4-c4ecc9faf2f8";
const ORGANIZATION_ID =
  import.meta.env.VITE_LEMMA_ORGANIZATION_ID ||
  browserStorage?.getItem("lemma_organization_id") ||
  "";
const API_URL =
  import.meta.env.VITE_LEMMA_API_URL ||
  browserStorage?.getItem("lemma_api_url") ||
  "https://api.asur.work";
const AUTH_URL =
  import.meta.env.VITE_LEMMA_AUTH_URL ||
  browserStorage?.getItem("lemma_auth_url") ||
  "https://auth.asur.work";
const ASSISTANT_NAME =
  import.meta.env.VITE_LEMMA_ASSISTANT_NAME ||
  "notion-guide";
const WORKFLOW_NAME =
  import.meta.env.VITE_LEMMA_WORKFLOW_NAME ||
  "page-publish-review";
const AGENT_NAME =
  import.meta.env.VITE_LEMMA_AGENT_NAME ||
  "workspace-librarian";

const client = new LemmaClient({
  podId: POD_ID,
  apiUrl: API_URL,
  authUrl: AUTH_URL,
});

const NAV_ITEMS = [
  { to: "/wiki", label: "Wiki", icon: BookOpen },
  { to: "/database", label: "Database", icon: Database },
  { to: "/reviews", label: "Reviews", icon: GitBranch },
  { to: "/files", label: "Files", icon: FileText },
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/team", label: "Team", icon: Users },
] as const;

const SYSTEM_FIELDS = ["id", "created_at", "updated_at"];

function hashPath(path: string) {
  return path.startsWith("#") ? path : `#${path}`;
}

function parseJsonObject(value: string): {
  value: Record<string, unknown>;
  error: string | null;
} {
  const trimmed = value.trim();
  if (!trimmed) return { value: {}, error: null };
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { value: {}, error: "Input must be a JSON object." };
    }
    return { value: parsed as Record<string, unknown>, error: null };
  } catch (error) {
    return {
      value: {},
      error: error instanceof Error ? error.message : "Invalid JSON input.",
    };
  }
}

function appNavClassName(isActive: boolean) {
  return cn(
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-primary/10 font-medium text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );
}

function pageMeta(pathname: string) {
  if (pathname.startsWith("/database")) {
    return {
      eyebrow: "Workspace Database",
      title: "Connected knowledge and task operations",
      description:
        "Manage database-style workspace tasks without leaving the same Notion-shaped desk.",
    };
  }
  if (pathname.startsWith("/reviews")) {
    return {
      eyebrow: "Reviews",
      title: "Workflow and agent operations",
      description:
        "Launch publish review flows, run background workspace analysis, and inspect active workflow runs.",
    };
  }
  if (pathname.startsWith("/files")) {
    return {
      eyebrow: "Workspace Files",
      title: "Templates, notes, and wiki assets",
      description:
        "Browse pod files directly so docs work stays connected to the knowledge base.",
    };
  }
  if (pathname.startsWith("/assistant")) {
    return {
      eyebrow: "Assistant",
      title: "Knowledge guide",
      description:
        "A full assistant route for navigating documents, summarizing content, and answering workspace questions.",
    };
  }
  if (pathname.startsWith("/team")) {
    return {
      eyebrow: "Team",
      title: "Workspace members",
      description:
        "Manage pod membership and access from the same desk shell.",
    };
  }
  return {
    eyebrow: "Wiki",
    title: "Structured docs and publish review in one desk",
    description:
      "The primary operating loop is the wiki itself: navigate documents, author docs, and move content through publish review.",
  };
}

function recipeStats(table: string, statusField: string, openValue: string, reviewValue?: string): StatCardDef[] {
  const openFilter: RecordFilter[] = [{ field: statusField, op: "=", value: openValue }];
  const reviewFilter: RecordFilter[] | undefined = reviewValue
    ? [{ field: statusField, op: "=", value: reviewValue }]
    : undefined;

  return [
    { title: "Total", source: { type: "count", table } },
    { title: "Open", source: { type: "count", table, filters: openFilter } },
    ...(reviewFilter
      ? [{ title: "Reviewing", source: { type: "count", table, filters: reviewFilter } as StatCardDef["source"] }]
      : []),
  ];
}

function recipeChart(table: string, category: string, title: string): ChartCardDef[] {
  return [
    {
      title,
      description: "Live grouping from the backing Notion-style pod.",
      source: {
        type: "bar",
        table,
        category,
        aggregate: "count",
        sortBy: "value",
        order: "desc",
        limit: 8,
      },
      height: 260,
    },
  ];
}

function AppShell() {
  const location = useLocation();
  const meta = pageMeta(location.pathname);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.12),transparent_35%),linear-gradient(180deg,var(--background),color-mix(in_oklab,var(--background)_93%,var(--card)))]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-r border-border/60 bg-card/60 backdrop-blur">
          <Sidebar />
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 md:px-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {meta.eyebrow}
                </p>
                <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">
                      {meta.title}
                    </h1>
                    <p className="max-w-3xl text-sm text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <LemmaGlobalSearch
                      client={client}
                      podId={POD_ID}
                      enabled={Boolean(POD_ID)}
                      triggerLabel="Search workspace"
                      tables={[
                        {
                          tableName: "workspace_tasks",
                          label: "Tasks",
                          searchFields: ["identifier", "title", "database_name", "page_slug", "status"],
                          displayField: "title",
                          subtitleField: "status",
                          href: () => hashPath("/database"),
                        },
                      ]}
                      files={{
                        enabled: Boolean(POD_ID),
                        label: "Workspace docs",
                        href: (result) => hashPath(`/files?path=${encodeURIComponent(result.path)}`),
                      }}
                      assistant={{
                        assistantName: ASSISTANT_NAME,
                        label: "Ask notion guide",
                      }}
                      appearance="minimal"
                      density="compact"
                    />
                    <Badge variant="secondary">{ASSISTANT_NAME}</Badge>
                    <Badge variant="outline">{WORKFLOW_NAME}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
              {!POD_ID ? (
                <Card className="border-amber-500/30 bg-amber-500/10">
                  <CardHeader>
                    <CardTitle className="text-base">Pod connection missing</CardTitle>
                    <CardDescription>
                      Set `VITE_LEMMA_POD_ID` or `VITE_NOTION_COPY_POD_ID` to use this desk.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : null}

              <Routes>
                <Route path="/" element={<Navigate to="/wiki" replace />} />
                <Route path="/wiki" element={<WikiPage />} />
                <Route path="/database" element={<DatabasePage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
                <Route path="/files" element={<FilesPage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <div className="flex h-full flex-col gap-6 p-4 md:p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            Notion Copy
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Full Lemma desk example
          </p>
        </div>
      </div>

      <nav className="grid gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => appNavClassName(isActive)}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <Separator />

      <Card className="border-border/60 bg-background/70 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Runtime</CardTitle>
          <CardDescription>
            This desk expects the live Notion-style pod, workflow, assistant, and agent resources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground">Pod</span>
            <p className="truncate font-mono text-[11px] text-foreground">
              {POD_ID || "unset"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Workflow</span>
            <p className="truncate font-mono text-[11px] text-foreground">
              {WORKFLOW_NAME}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Agent</span>
            <p className="truncate font-mono text-[11px] text-foreground">
              {AGENT_NAME}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">API</span>
            <p className="truncate font-mono text-[11px] text-foreground">
              {API_URL}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PageFrame({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-col gap-3 border-b border-border/60 px-1 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function WikiPage() {
  return (
    <PageFrame
      title="Wiki"
      description="Drive the desk from the document tree, keep authoring in the center, and push content into review from the same workspace."
      actions={
        <>
          <Badge variant="secondary">Document tree</Badge>
          <Badge variant="outline">Publish workflow</Badge>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <Card className="overflow-hidden border-border/70 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Workspace Documents</CardTitle>
            <CardDescription>
              Notion-like navigation driven by the pod file tree.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[44rem] p-0">
            <LemmaPageTree
              client={client}
              podId={POD_ID}
              rootPath="/"
              appearance="minimal"
              density="compact"
              title=""
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/70 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Document Workspace</CardTitle>
            <CardDescription>
              The main writing surface for the current workspace document.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[44rem] p-0">
            <LemmaDocumentWorkspace
              client={client}
              podId={POD_ID}
              mode="page"
              intent="create"
              file={{
                defaultDirectoryPath: "/",
                defaultFileName: "company-home.lemma-doc.json",
                showBreadcrumbs: true,
                showMetadata: true,
              }}
              defaultTitle="Company Home"
              defaultSummary="Team workspace entry document with policies, specs, and operational handbooks."
              appearance="minimal"
              density="comfortable"
            />
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="overflow-hidden border-border/70 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Document Library</CardTitle>
              <CardDescription>
                Keep workspace documents and supporting assets visible beside the editor.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[26rem] p-0">
              <LemmaFileBrowser
                client={client}
                podId={POD_ID}
                initialPath="/"
                appearance="minimal"
                density="compact"
                title=""
              />
            </CardContent>
          </Card>

          <LemmaActionSurface
            client={client}
            podId={POD_ID}
            title="Start publish review"
            description="Kick off the publish review workflow from the wiki route."
            variant="panel"
            progressSurface="modal"
            autoOpenProgress
            action={{
              kind: "workflow",
              workflowName: WORKFLOW_NAME,
              label: "Start review",
              description: "Launch a manual publish review flow.",
            }}
            appearance="contained"
            density="compact"
          />
        </div>
      </div>
    </PageFrame>
  );
}

function DatabasePage() {
  return (
    <PageFrame
      title="Database"
      description="A dedicated database route for task tracking, saved-work style grouping, and operational visibility."
      actions={
        <>
          <Badge variant="secondary">workspace_tasks</Badge>
          <Badge variant="outline">Grouped view</Badge>
        </>
      }
    >
      <div className="grid gap-6">
        <LemmaInsights
          client={client}
          podId={POD_ID}
          stats={recipeStats("workspace_tasks", "status", "in_progress", "blocked")}
          charts={recipeChart("workspace_tasks", "database_name", "Tasks by Database")}
          columns={3}
          appearance="contained"
          density="compact"
        />

        <LemmaRecordsView
          client={client}
          podId={POD_ID}
          tableName="workspace_tasks"
          defaultView="grouped"
          detailMode="sheet"
          createMode="sheet"
          hiddenFields={SYSTEM_FIELDS}
          appearance="minimal"
          density="compact"
          title="Workspace Tasks"
        />
      </div>
    </PageFrame>
  );
}

function ReviewsPage() {
  const [workflowInputText, setWorkflowInputText] = React.useState("{\n  \"source\": \"notion-desk\"\n}");
  const [agentInputText, setAgentInputText] = React.useState("{\n  \"question\": \"Summarize what should be published next.\",\n  \"page_slug\": \"weekly-staff-notes\"\n}");
  const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null);

  const parsedWorkflowInput = React.useMemo(
    () => parseJsonObject(workflowInputText),
    [workflowInputText],
  );
  const parsedAgentInput = React.useMemo(
    () => parseJsonObject(agentInputText),
    [agentInputText],
  );

  return (
    <PageFrame
      title="Reviews"
      description="This is the operations route for long-running publish flows and background workspace analysis."
      actions={
        <>
          <Badge variant="secondary">{WORKFLOW_NAME}</Badge>
          <Badge variant="outline">{AGENT_NAME}</Badge>
        </>
      }
    >
      <div className="grid gap-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Publish workflow</CardTitle>
              <CardDescription>
                Start review runs from a dedicated route instead of a tiny embedded action block.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Workflow input JSON
                </label>
                <Textarea
                  value={workflowInputText}
                  onChange={(event) => setWorkflowInputText(event.target.value)}
                  rows={8}
                />
                {parsedWorkflowInput.error ? (
                  <p className="text-xs text-destructive">{parsedWorkflowInput.error}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    The workflow itself begins with a form, so this payload is only for surrounding desk context.
                  </p>
                )}
              </div>

              <LemmaActionSurface
                client={client}
                podId={POD_ID}
                action={{
                  kind: "workflow",
                  workflowName: WORKFLOW_NAME,
                  label: "Run publish review",
                  description: "Launch the manual publish review flow.",
                  input: parsedWorkflowInput.value,
                  runningLabels: ["Starting…", "Reviewing…", "Waiting…"],
                }}
                title="Publish review action"
                description="Use the full panel treatment for review launches."
                variant="panel"
                progressSurface="modal"
                autoOpenProgress
                enabled={Boolean(POD_ID && !parsedWorkflowInput.error)}
                onExecutionIdChange={setSelectedRunId}
                appearance="contained"
                density="compact"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspace agent</CardTitle>
              <CardDescription>
                Background analysis belongs here as an agent run, not inside the main editor surface.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Agent input JSON
                </label>
                <Textarea
                  value={agentInputText}
                  onChange={(event) => setAgentInputText(event.target.value)}
                  rows={8}
                />
                {parsedAgentInput.error ? (
                  <p className="text-xs text-destructive">{parsedAgentInput.error}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This agent route is intended for longer workspace analysis and knowledge cleanup suggestions.
                  </p>
                )}
              </div>

              <LemmaActionSurface
                client={client}
                podId={POD_ID}
                action={{
                  kind: "agent",
                  agentName: AGENT_NAME,
                  label: "Run workspace analyst",
                  description: "Analyze the current workspace question in the background.",
                  input: parsedAgentInput.value,
                  runningLabels: ["Starting…", "Thinking…", "Compiling…"],
                }}
                title="Workspace analyst"
                description="Dedicated agent execution surface with inspectable messages."
                variant="panel"
                progressSurface="modal"
                autoOpenProgress
                enabled={Boolean(POD_ID && !parsedAgentInput.error)}
                appearance="contained"
                density="compact"
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workflow runner</CardTitle>
            <CardDescription>
              Inspect publish-review runs from the same route where they are started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LemmaWorkflowRunner
              client={client}
              podId={POD_ID}
              enabled={Boolean(POD_ID)}
              workflowName={WORKFLOW_NAME}
              runId={selectedRunId ?? undefined}
              title={WORKFLOW_NAME}
              appearance="contained"
              density="compact"
              className="min-h-[40rem]"
            />
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}

function FilesPage() {
  const [searchParams] = useSearchParams();
  const selectedPath = searchParams.get("path");
  const initialPath = selectedPath
    ? decodeURIComponent(selectedPath)
    : "/";

  return (
    <PageFrame
      title="Files"
      description="Templates, meeting notes, and wiki assets live in a dedicated files route instead of a cramped side panel."
      actions={<Badge variant="secondary">{initialPath}</Badge>}
    >
      <LemmaFileBrowser
        client={client}
        podId={POD_ID}
        initialPath={initialPath}
        appearance="minimal"
        density="compact"
        title="Workspace files"
        className="min-h-[44rem]"
      />
    </PageFrame>
  );
}

function AssistantPage() {
  const controller = useAssistantController({
    client,
    assistantName: ASSISTANT_NAME,
    enabled: Boolean(POD_ID && ASSISTANT_NAME),
  });

  return (
    <PageFrame
      title="Assistant"
      description="A full assistant route for search, synthesis, and guided actions across the workspace."
      actions={<Badge variant="secondary">{ASSISTANT_NAME}</Badge>}
    >
      <div className="min-h-[44rem] overflow-hidden rounded-2xl border border-border/70 bg-card/80">
        <AssistantExperienceView
          controller={controller}
          mode="page"
          appearance="minimal"
          density="compact"
          showConversationList
        />
      </div>
    </PageFrame>
  );
}

function TeamPage() {
  return (
    <PageFrame
      title="Team"
      description="Pod members stay inside the desk so access work does not need a separate admin shell."
      actions={
        ORGANIZATION_ID ? (
          <Badge variant="secondary">Org add flow enabled</Badge>
        ) : (
          <Badge variant="outline">Set `VITE_LEMMA_ORGANIZATION_ID` to add org members</Badge>
        )
      }
    >
      <LemmaMembers
        client={client}
        podId={POD_ID}
        organizationId={ORGANIZATION_ID || undefined}
        enabled={Boolean(POD_ID)}
        allowAdd={Boolean(ORGANIZATION_ID)}
        title="Workspace members"
        description="Manage pod members from the desk shell."
        appearance="minimal"
        density="compact"
        className="min-h-[42rem]"
      />
    </PageFrame>
  );
}

function NotFoundPage() {
  return (
    <Card className="flex min-h-[28rem] items-center justify-center border-dashed border-border/60 bg-card/60 shadow-none">
      <CardContent className="max-w-md space-y-2 text-center">
        <CardTitle className="text-lg">Page not found</CardTitle>
        <CardDescription>
          Use the left navigation to jump back into the Notion desk.
        </CardDescription>
      </CardContent>
    </Card>
  );
}

function App() {
  return (
    <HashRouter>
      <AuthGuard client={client}>
        <AppShell />
      </AuthGuard>
    </HashRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
