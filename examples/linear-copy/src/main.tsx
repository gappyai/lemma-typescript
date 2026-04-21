import React from "react";
import ReactDOM from "react-dom/client";
import {
  HashRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  FileText,
  GitBranch,
  Plus,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { LemmaClient, type RecordFilter } from "lemma-sdk";
import { AuthGuard, useAssistantController, useRecord } from "lemma-sdk/react";
import { AssistantExperienceView } from "@/components/lemma/assistant/assistant-experience";
import { LemmaActionSurface } from "@/components/lemma/lemma-action-surface";
import { LemmaDetailPanel } from "@/components/lemma/lemma-detail-panel";
import { LemmaFileBrowser } from "@/components/lemma/lemma-file-browser";
import { LemmaGlobalSearch } from "@/components/lemma/lemma-global-search";
import { LemmaInsights, type ChartCardDef, type StatCardDef } from "@/components/lemma/lemma-insights";
import { LemmaMembers } from "@/components/lemma/lemma-members";
import { LemmaRecordForm } from "@/components/lemma/lemma-record-form";
import { LemmaRecordsView } from "@/components/lemma/lemma-records-view";
import { LemmaStatusFlow } from "@/components/lemma/lemma-status-flow";
import { LemmaWorkflowRunner } from "@/components/lemma/lemma-workflow-runner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
  import.meta.env.VITE_LINEAR_COPY_POD_ID ||
  browserStorage?.getItem("lemma_pod_id") ||
  "019daa7d-ad11-7039-a95f-5443203c7083";
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
  "linear-pm";
const WORKFLOW_NAME =
  import.meta.env.VITE_LEMMA_WORKFLOW_NAME ||
  "cycle-planning";
const AGENT_NAME =
  import.meta.env.VITE_LEMMA_AGENT_NAME ||
  "delivery-researcher";

const client = new LemmaClient({
  podId: POD_ID,
  apiUrl: API_URL,
  authUrl: AUTH_URL,
});

const ISSUE_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
];

const SYSTEM_FIELDS = ["id", "created_at", "updated_at"];

const NAV_ITEMS = [
  { to: "/issues", label: "Issues", icon: Target },
  { to: "/planning", label: "Planning", icon: GitBranch },
  { to: "/roadmap", label: "Roadmap", icon: BarChart3 },
  { to: "/delivery", label: "Delivery Ops", icon: Sparkles },
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/team", label: "Team", icon: Users },
] as const;

function hashPath(path: string) {
  return path.startsWith("#") ? path : `#${path}`;
}

function recordHashPath(basePath: string, record: Record<string, unknown>) {
  if (record.id == null) return hashPath(basePath);
  return hashPath(`${basePath}/${encodeURIComponent(String(record.id))}`);
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

function normalizeIssueStatus(value: unknown) {
  const status = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ISSUE_STATUSES.includes(status) ? status : ISSUE_STATUSES[0];
}

function issueTitle(record: Record<string, unknown> | null | undefined) {
  if (!record) return "Issue detail";
  const title = typeof record.title === "string" ? record.title : "";
  const identifier = typeof record.identifier === "string" ? record.identifier : "";
  return title ? `${identifier ? `${identifier} · ` : ""}${title}` : "Issue detail";
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
      description: "Live grouping from the backing Linear-style pod.",
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
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_35%),linear-gradient(180deg,var(--background),color-mix(in_oklab,var(--background)_93%,var(--card)))]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-r border-border/60 bg-card/60 backdrop-blur">
          <Sidebar />
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 md:px-6">
              <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Delivery Workspace
                  </p>
                  <h1 className="text-xl font-semibold text-foreground">
                    Linear Copy
                  </h1>
                  <p className="max-w-3xl text-sm text-muted-foreground">
                    A route-native product delivery desk for issues, planning, roadmaps, workflows, and agent-driven analysis.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <LemmaGlobalSearch
                    client={client}
                    podId={POD_ID}
                    enabled={Boolean(POD_ID)}
                    triggerLabel="Search delivery"
                    tables={[
                      {
                        tableName: "issues",
                        label: "Issues",
                        searchFields: ["identifier", "title", "status", "priority", "project_slug", "cycle_name"],
                        displayField: "title",
                        subtitleField: "status",
                        href: (record) => recordHashPath("/issues", record),
                      },
                      {
                        tableName: "projects",
                        label: "Projects",
                        searchFields: ["name", "slug", "summary", "status"],
                        displayField: "name",
                        subtitleField: "status",
                        href: () => hashPath("/planning"),
                      },
                      {
                        tableName: "cycles",
                        label: "Cycles",
                        searchFields: ["name", "goal", "status"],
                        displayField: "name",
                        subtitleField: "status",
                        href: () => hashPath("/planning"),
                      },
                    ]}
                    files={{
                      enabled: Boolean(POD_ID),
                      label: "Roadmaps",
                      href: (result) => hashPath(`/roadmap?path=${encodeURIComponent(result.path)}`),
                    }}
                    assistant={{
                      assistantName: ASSISTANT_NAME,
                      label: "Ask linear pm",
                    }}
                    appearance="minimal"
                    density="compact"
                  />
                  <Link
                    to="/issues/new"
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    <Plus data-icon="inline-start" />
                    New issue
                  </Link>
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
                      Set `VITE_LEMMA_POD_ID` or `VITE_LINEAR_COPY_POD_ID` to use this desk.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : null}

              <Routes>
                <Route path="/" element={<Navigate to="/issues" replace />} />
                <Route path="/issues" element={<IssuesPage />} />
                <Route path="/issues/new" element={<NewIssuePage />} />
                <Route path="/issues/:recordId" element={<IssueDetailPage />} />
                <Route path="/planning" element={<PlanningPage />} />
                <Route path="/roadmap" element={<RoadmapPage />} />
                <Route path="/delivery" element={<DeliveryPage />} />
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
          <GitBranch className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            Linear Copy
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
            This desk expects live issue, cycle, workflow, assistant, and agent resources.
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
            <span className="text-muted-foreground">Assistant</span>
            <p className="truncate font-mono text-[11px] text-foreground">
              {ASSISTANT_NAME}
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

function IssuesPage() {
  return (
    <PageFrame
      title="Issues"
      description="The main operator loop: scan issues, open route-native detail pages, and create new work from the same desk."
      actions={
        <>
          <Badge variant="secondary">Linear view</Badge>
          <Badge variant="outline">Route detail</Badge>
        </>
      }
    >
      <LemmaRecordsView
        client={client}
        podId={POD_ID}
        tableName="issues"
        preset="issues"
        defaultView="linear"
        detailMode="page"
        createMode="page"
        createRoute={hashPath("/issues/new")}
        detailRoute={(record) => recordHashPath("/issues", record)}
        hiddenFields={SYSTEM_FIELDS}
        appearance="minimal"
        density="compact"
        title="Active issues"
        className="min-h-[48rem]"
      />
    </PageFrame>
  );
}

function NewIssuePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectSlug = searchParams.get("project");

  return (
    <PageFrame
      title="New issue"
      description="Create a new issue as a first-class route instead of a cramped overlay."
      actions={
        <Badge variant="outline">
          {projectSlug ? `Project: ${projectSlug}` : "Direct create"}
        </Badge>
      }
    >
      <div className="max-w-4xl">
        <LemmaRecordForm
          client={client}
          podId={POD_ID}
          tableName="issues"
          mode="inline"
          hiddenFields={SYSTEM_FIELDS}
          fieldOrder={[
            "identifier",
            "title",
            "description",
            "priority",
            "status",
            "team",
            "project_slug",
            "cycle_name",
            "estimate",
          ]}
          fieldGroups={[
            {
              label: "Summary",
              fields: ["identifier", "title", "description", "priority", "status"],
            },
            {
              label: "Planning",
              fields: ["team", "project_slug", "cycle_name", "estimate"],
            },
          ]}
          initialValues={projectSlug ? { project_slug: projectSlug } : undefined}
          appearance="minimal"
          density="compact"
          onSuccess={(record) => {
            if (record.id != null) {
              navigate(`/issues/${String(record.id)}`);
            } else {
              navigate("/issues");
            }
          }}
        />
      </div>
    </PageFrame>
  );
}

function IssueDetailPage() {
  const params = useParams();
  const recordId = params.recordId ?? "";
  const issueState = useRecord({
    client,
    podId: POD_ID,
    tableName: "issues",
    recordId,
    enabled: Boolean(POD_ID && recordId),
  });

  return (
    <PageFrame
      title={issueTitle(issueState.record)}
      description="Route-native detail surface for issue planning and status movement."
      actions={
        <Link
          to="/issues"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to issues
        </Link>
      }
    >
      <div className="grid gap-4">
        {issueState.record ? (
          <LemmaStatusFlow
            client={client}
            podId={POD_ID}
            tableName="issues"
            recordId={recordId}
            currentStatus={String(issueState.record.status ?? ISSUE_STATUSES[0])}
            statuses={ISSUE_STATUSES}
            appearance="minimal"
            density="compact"
          />
        ) : null}

        <LemmaDetailPanel
          client={client}
          podId={POD_ID}
          tableName="issues"
          recordId={recordId}
          enabled={Boolean(POD_ID && recordId)}
          mode="editable"
          variant="workspace"
          fieldGroups={[
            {
              label: "Summary",
              fields: ["identifier", "title", "status", "priority", "team"],
            },
            {
              label: "Planning",
              fields: ["project_slug", "cycle_name", "estimate", "description"],
            },
          ]}
          detailTabs={["details", "files"]}
          appearance="minimal"
          density="compact"
          className="min-h-[40rem]"
        />
      </div>
    </PageFrame>
  );
}

function PlanningPage() {
  return (
    <PageFrame
      title="Planning"
      description="Projects and cycles belong in dedicated planning routes, not buried under the issue list."
      actions={
        <>
          <Badge variant="secondary">projects</Badge>
          <Badge variant="outline">cycles</Badge>
        </>
      }
    >
      <div className="grid gap-6">
        <LemmaInsights
          client={client}
          podId={POD_ID}
          stats={recipeStats("issues", "status", "in_progress", "in_review")}
          charts={recipeChart("issues", "project_slug", "Issues by Project")}
          columns={3}
          appearance="contained"
          density="compact"
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <LemmaRecordsView
            client={client}
            podId={POD_ID}
            tableName="projects"
            defaultView="list"
            detailMode="sheet"
            createMode="sheet"
            hiddenFields={SYSTEM_FIELDS}
            appearance="minimal"
            density="compact"
            title="Projects"
            className="min-h-[36rem]"
          />
          <LemmaRecordsView
            client={client}
            podId={POD_ID}
            tableName="cycles"
            defaultView="list"
            detailMode="sheet"
            createMode="sheet"
            hiddenFields={SYSTEM_FIELDS}
            appearance="minimal"
            density="compact"
            title="Cycles"
            className="min-h-[36rem]"
          />
        </div>
      </div>
    </PageFrame>
  );
}

function RoadmapPage() {
  const [searchParams] = useSearchParams();
  const selectedPath = searchParams.get("path");
  const initialPath = selectedPath
    ? decodeURIComponent(selectedPath)
    : "/roadmaps";

  return (
    <PageFrame
      title="Roadmap"
      description="Roadmaps and cycle briefs live in their own route alongside delivery reporting."
      actions={<Badge variant="secondary">{initialPath}</Badge>}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <LemmaFileBrowser
          client={client}
          podId={POD_ID}
          initialPath={initialPath}
          appearance="minimal"
          density="compact"
          title="Roadmap files"
          className="min-h-[44rem]"
        />
        <LemmaInsights
          client={client}
          podId={POD_ID}
          stats={recipeStats("issues", "status", "in_progress", "in_review")}
          charts={recipeChart("issues", "team", "Issues by Team")}
          columns={3}
          appearance="contained"
          density="compact"
        />
      </div>
    </PageFrame>
  );
}

function DeliveryPage() {
  const [workflowInputText, setWorkflowInputText] = React.useState("{\n  \"source\": \"linear-desk\"\n}");
  const [agentInputText, setAgentInputText] = React.useState("{\n  \"question\": \"Where is delivery risk highest for the next cycle?\",\n  \"cycle_name\": \"Cycle 19\"\n}");
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
      title="Delivery Ops"
      description="Launch planning flows, run background delivery analysis, and inspect workflow progress from one route."
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
              <CardTitle>Cycle planning workflow</CardTitle>
              <CardDescription>
                Start a planning run from a dedicated operations route.
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
                    The workflow itself collects planning input through its first form step.
                  </p>
                )}
              </div>

              <LemmaActionSurface
                client={client}
                podId={POD_ID}
                action={{
                  kind: "workflow",
                  workflowName: WORKFLOW_NAME,
                  label: "Start cycle planning",
                  description: "Launch the manual planning workflow.",
                  input: parsedWorkflowInput.value,
                  runningLabels: ["Starting…", "Planning…", "Waiting…"],
                }}
                title="Cycle planning"
                description="Full panel treatment for workflow launches and progress."
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
              <CardTitle>Delivery research agent</CardTitle>
              <CardDescription>
                Run background risk analysis outside the main issue queue.
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
                    Use the agent for judgment-heavy planning questions and risk summaries.
                  </p>
                )}
              </div>

              <LemmaActionSurface
                client={client}
                podId={POD_ID}
                action={{
                  kind: "agent",
                  agentName: AGENT_NAME,
                  label: "Run delivery analyst",
                  description: "Analyze risks across issues, cycles, and projects.",
                  input: parsedAgentInput.value,
                  runningLabels: ["Starting…", "Thinking…", "Reviewing…"],
                }}
                title="Delivery analyst"
                description="Dedicated agent execution surface with inspectable task output."
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
              Keep planning runs visible from the same route where they are launched.
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

function AssistantPage() {
  const controller = useAssistantController({
    client,
    assistantName: ASSISTANT_NAME,
    enabled: Boolean(POD_ID && ASSISTANT_NAME),
  });

  return (
    <PageFrame
      title="Assistant"
      description="A full PM/copilot route for project, cycle, and issue questions."
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
      description="Pod members stay inside the desk shell so access work remains part of delivery operations."
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
        title="Delivery members"
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
          Use the left navigation to jump back into the Linear desk.
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
