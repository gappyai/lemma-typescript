import React, { useMemo } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  CheckSquare,
  FileText,
  Files,
  GitBranch,
  Inbox,
  Layers3,
  Search,
} from "lucide-react";
import { LemmaClient, type RecordFilter } from "lemma-sdk";
import { useAssistantController } from "lemma-sdk/react";
import { AssistantExperienceView } from "@/components/lemma/assistant/assistant-experience";
import { LemmaActionSurface } from "@/components/lemma/lemma-action-surface";
import { LemmaDocumentWorkspace } from "@/components/lemma/lemma-document-workspace";
import { LemmaFileBrowser } from "@/components/lemma/lemma-file-browser";
import { LemmaGlobalSearch } from "@/components/lemma/lemma-global-search";
import { LemmaInsights, type ChartCardDef, type StatCardDef } from "@/components/lemma/lemma-insights";
import { LemmaPageTree } from "@/components/lemma/lemma-page-tree";
import { LemmaRecordsView } from "@/components/lemma/lemma-records-view";
import { LemmaWorkflowRunner } from "@/components/lemma/lemma-workflow-runner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import "@/index.css";
import "@/styles/lemma-records-view.css";

const browserStorage =
  typeof window !== "undefined" ? window.localStorage : null;

const API_URL =
  import.meta.env.VITE_LEMMA_API_URL ||
  browserStorage?.getItem("lemma_api_url") ||
  "https://api.asur.work";
const AUTH_URL =
  import.meta.env.VITE_LEMMA_AUTH_URL ||
  browserStorage?.getItem("lemma_auth_url") ||
  "https://auth.asur.work";

const RECIPE_DEFS = [
  {
    slug: "issue-tracker",
    title: "Issue Tracker",
    path: "/issue-tracker",
    podId: import.meta.env.VITE_ISSUE_TRACKER_POD_ID || "019daa51-1be6-71bc-ac34-7da96cd10c6a",
    description: "Linear-style issue queue with status-driven execution and assistant help.",
    icon: Layers3,
    accent: "from-rose-500/25 via-orange-500/10 to-background",
  },
  {
    slug: "triage-inbox",
    title: "Triage Inbox",
    path: "/triage-inbox",
    podId: import.meta.env.VITE_TRIAGE_INBOX_POD_ID || "019daa51-6b9c-71d2-8a70-46da8604fc07",
    description: "Shared intake queue for mixed inbound work and fast operator routing.",
    icon: Inbox,
    accent: "from-sky-500/25 via-cyan-500/10 to-background",
  },
  {
    slug: "approval-workflow",
    title: "Approval Workflow",
    path: "/approval-workflow",
    podId: import.meta.env.VITE_APPROVAL_WORKFLOW_POD_ID || "019daa51-8b1c-715e-ae6c-de43dd804e1d",
    description: "Review queue paired with workflow launch and run visibility.",
    icon: CheckSquare,
    accent: "from-emerald-500/25 via-lime-500/10 to-background",
  },
  {
    slug: "docs-workspace-os",
    title: "Docs Workspace OS",
    path: "/docs-workspace-os",
    podId: import.meta.env.VITE_DOCS_WORKSPACE_POD_ID || "019daa51-ae00-7387-9942-3f50ef6a9d06",
    description: "Document tree, pod-file workspace, and knowledge assistant in one shell.",
    icon: FileText,
    accent: "from-violet-500/25 via-fuchsia-500/10 to-background",
  },
  {
    slug: "notion-copy",
    title: "Notion Copy",
    path: "/notion-copy",
    podId: import.meta.env.VITE_NOTION_COPY_POD_ID || "019daa7d-7521-7239-bdc4-c4ecc9faf2f8",
    description: "Wiki, database-style tasks, files, search, and assistant help in a Notion-shaped workspace.",
    icon: BookOpen,
    accent: "from-amber-500/25 via-yellow-500/10 to-background",
  },
  {
    slug: "linear-copy",
    title: "Linear Copy",
    path: "/linear-copy",
    podId: import.meta.env.VITE_LINEAR_COPY_POD_ID || "019daa7d-ad11-7039-a95f-5443203c7083",
    description: "Issues, projects, cycles, roadmaps, and workflow-backed planning in a Linear-shaped desk.",
    icon: GitBranch,
    accent: "from-cyan-500/25 via-blue-500/10 to-background",
  },
] as const;

type RecipeSlug = (typeof RECIPE_DEFS)[number]["slug"];

const clientCache = new Map<string, LemmaClient>();

function getClient(podId: string) {
  const cached = clientCache.get(podId);
  if (cached) return cached;
  const client = new LemmaClient({ podId, apiUrl: API_URL, authUrl: AUTH_URL });
  clientCache.set(podId, client);
  return client;
}

function appNavClassName(isActive: boolean) {
  return cn(
    "rounded-full border px-3 py-1.5 text-sm transition-colors",
    isActive
      ? "border-foreground bg-foreground text-background"
      : "border-border bg-background/70 text-muted-foreground hover:border-foreground/20 hover:text-foreground",
  );
}

function recipeStats(table: string, statusField: string, openValue: string, reviewValue?: string): StatCardDef[] {
  const openFilter: RecordFilter[] = [{ field: statusField, op: "=", value: openValue }];
  const reviewFilter: RecordFilter[] | undefined = reviewValue
    ? [{ field: statusField, op: "=", value: reviewValue }]
    : undefined;

  return [
    { title: "Total", source: { type: "count", table } },
    { title: "Open", source: { type: "count", table, filters: openFilter } },
    ...(reviewFilter ? [{ title: "Reviewing", source: { type: "count", table, filters: reviewFilter } as StatCardDef["source"] }] : []),
  ];
}

function recipeChart(table: string, category: string, title: string): ChartCardDef[] {
  return [
    {
      title,
      description: "Live grouping from the backing recipe pod.",
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

function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Lemma Recipe Packs
            </div>
            <h1 className="text-lg font-semibold">Live Desk Recipes</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            <NavLink to="/" className={({ isActive }) => appNavClassName(isActive)}>
              Home
            </NavLink>
            {RECIPE_DEFS.map((recipe) => (
              <NavLink key={recipe.slug} to={recipe.path} className={({ isActive }) => appNavClassName(isActive)}>
                {recipe.title}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function HomePage() {
  return (
    <div className="mx-auto max-w-[1600px] px-5 py-8">
      <div className="mb-8 max-w-3xl">
        <Badge variant="outline" className="mb-3">Runnable Example App</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">Desk recipes, rendered against live pods</h2>
        <p className="mt-3 text-base text-muted-foreground">
          Each route below is a real React surface using the Lemma registry install target from
          `examples/inbox-crm`, backed by a provisioned pod for that workflow shape.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {RECIPE_DEFS.map((recipe) => (
          <Card key={recipe.slug} className="overflow-hidden border-border/70 bg-card/80">
            <div className={cn("h-32 border-b border-border/70 bg-gradient-to-br", recipe.accent)} />
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <recipe.icon className="size-5" />
                    {recipe.title}
                  </CardTitle>
                  <CardDescription className="mt-2">{recipe.description}</CardDescription>
                </div>
                <Badge variant="secondary">{recipe.slug}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                <div>Live pod</div>
                <div className="font-mono text-[11px] text-foreground">{recipe.podId}</div>
              </div>
              <NavLink to={recipe.path}>
                <Button size="sm">
                  Open recipe
                  <ArrowRight className="size-4" />
                </Button>
              </NavLink>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PageSectionHeader({
  icon: Icon,
  title,
  description,
  podId,
}: {
  icon: typeof Layers3;
  title: string;
  description: string;
  podId: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 px-6 py-5">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="size-4" />
          {title}
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge variant="outline" className="font-mono text-[11px]">{podId}</Badge>
    </div>
  );
}

function RecipeSurface({
  title,
  description,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border/70 bg-background/80", className)}>
      <div className="border-b border-border/70 px-5 py-4">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className={cn("min-h-0", bodyClassName)}>{children}</div>
    </section>
  );
}

function IssueTrackerRecipe() {
  const recipe = RECIPE_DEFS.find((item) => item.slug === "issue-tracker")!;
  const client = useMemo(() => getClient(recipe.podId), [recipe.podId]);
  const controller = useAssistantController({ client, assistantName: "issue-copilot" });

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-sm">
        <PageSectionHeader
          icon={Layers3}
          title="Issue Tracker"
          description="A high-throughput engineering queue with search, embedded assistant help, and live reporting from the issue pod."
          podId={recipe.podId}
        />
        <div className="grid gap-5 p-5">
          <section className="overflow-hidden rounded-2xl border border-border/70 bg-background/80 p-4">
            <div className="mb-4">
              <LemmaGlobalSearch
                client={client}
                podId={recipe.podId}
                tables={[
                  {
                    tableName: "issues",
                    label: "Issues",
                    searchFields: ["identifier", "title", "description", "status", "priority", "team"],
                    displayField: "title",
                    subtitleField: "status",
                  },
                ]}
                assistant={{ assistantName: "issue-copilot", label: "Ask issue copilot" }}
                triggerLabel="Search issues"
                appearance="minimal"
                density="compact"
              />
            </div>
            <LemmaRecordsView
              client={client}
              podId={recipe.podId}
              tableName="issues"
              preset="issues"
              defaultView="linear"
              detailMode="sheet"
              createMode="sheet"
              hiddenFields={["id", "created_at", "updated_at"]}
              appearance="minimal"
              density="compact"
              title="Active Queue"
            />
          </section>
          <div className="grid gap-5 xl:grid-cols-2">
            <RecipeSurface
              title="Issue Copilot"
              description="Keep the assistant beside the queue, but wide enough for conversation, citations, and file output."
              bodyClassName="min-h-[420px]"
            >
              <AssistantExperienceView
                controller={controller}
                mode="embedded"
                appearance="minimal"
                density="compact"
                showConversationList={false}
              />
            </RecipeSurface>
            <RecipeSurface
              title="Queue Health"
              description="Status distribution and current workload from the live issue table."
              bodyClassName="overflow-auto p-4"
            >
              <LemmaInsights
                client={client}
                podId={recipe.podId}
                stats={recipeStats("issues", "status", "in_progress", "in_review")}
                charts={recipeChart("issues", "status", "Issues by Status")}
                columns={3}
                appearance="minimal"
                density="compact"
              />
            </RecipeSurface>
          </div>
        </div>
      </div>
    </div>
  );
}

function TriageInboxRecipe() {
  const recipe = RECIPE_DEFS.find((item) => item.slug === "triage-inbox")!;
  const client = useMemo(() => getClient(recipe.podId), [recipe.podId]);

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-sm">
        <PageSectionHeader
          icon={Inbox}
          title="Triage Inbox"
          description="Shared intake desk with search-first scanning, queue management, and quick action launching."
          podId={recipe.podId}
        />
        <div className="grid gap-5 p-5">
          <section className="overflow-hidden rounded-2xl border border-border/70 bg-background/80 p-4">
            <div className="mb-4">
              <LemmaGlobalSearch
                client={client}
                podId={recipe.podId}
                tables={[
                  {
                    tableName: "triage_items",
                    label: "Inbox",
                    searchFields: ["identifier", "subject", "summary", "source", "status", "priority"],
                    displayField: "subject",
                    subtitleField: "status",
                  },
                ]}
                assistant={{ assistantName: "triage-assistant", label: "Ask triage assistant" }}
                triggerLabel="Search inbox"
                appearance="minimal"
                density="compact"
              />
            </div>
            <LemmaRecordsView
              client={client}
              podId={recipe.podId}
              tableName="triage_items"
              preset="triage"
              defaultView="list"
              detailMode="sheet"
              createMode="sheet"
              hiddenFields={["id", "created_at", "updated_at"]}
              appearance="minimal"
              density="compact"
              title="Intake Queue"
            />
          </section>
          <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <RecipeSurface
              title="Operator Quick Action"
              description="A short, high-signal action surface for the queue instead of a full side rail."
              bodyClassName="p-4"
            >
              <LemmaActionSurface
                client={client}
                podId={recipe.podId}
                title="Run triage checklist"
                description="Demonstrates the action surface inside the recipe shell."
                variant="panel"
                progressSurface="inline"
                action={{
                  kind: "direct",
                  label: "Run triage checklist",
                  description: "Walk through the standard intake pass for the current queue.",
                  successLabel: "Checklist complete",
                  run: async () => {
                    await new Promise((resolve) => setTimeout(resolve, 600));
                    return { ok: true };
                  },
                }}
                appearance="contained"
                density="compact"
              />
            </RecipeSurface>
            <RecipeSurface
              title="Intake Mix"
              description="Charts get the width they need, so source distribution is readable instead of cramped."
              bodyClassName="overflow-auto p-4"
            >
              <LemmaInsights
                client={client}
                podId={recipe.podId}
                stats={recipeStats("triage_items", "status", "new", "reviewing")}
                charts={recipeChart("triage_items", "source", "Items by Source")}
                columns={3}
                appearance="contained"
                density="compact"
              />
            </RecipeSurface>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApprovalWorkflowRecipe() {
  const recipe = RECIPE_DEFS.find((item) => item.slug === "approval-workflow")!;
  const client = useMemo(() => getClient(recipe.podId), [recipe.podId]);

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-sm">
        <PageSectionHeader
          icon={CheckSquare}
          title="Approval Workflow"
          description="Review queue with a real workflow-backed action and a workflow runner pane for live runs."
          podId={recipe.podId}
        />
        <div className="grid gap-5 p-5">
          <section className="overflow-hidden rounded-2xl border border-border/70 bg-background/80 p-4">
            <LemmaRecordsView
              client={client}
              podId={recipe.podId}
              tableName="approval_requests"
              defaultView="list"
              detailMode="sheet"
              createMode="sheet"
              hiddenFields={["id", "created_at", "updated_at"]}
              appearance="minimal"
              density="compact"
              title="Pending Reviews"
            />
          </section>
          <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <RecipeSurface
              title="Approval Flow"
              description="Launch the real workflow from the same screen where the operator reviews requests."
              bodyClassName="p-4"
            >
              <LemmaActionSurface
                client={client}
                podId={recipe.podId}
                title="Start approval decision"
                description="Start the live workflow installed for this recipe pod."
                variant="panel"
                action={{
                  kind: "workflow",
                  workflowName: "approval-decision",
                  label: "Start approval decision",
                  description: "Launch the manual approval workflow.",
                }}
                appearance="contained"
                density="compact"
              />
            </RecipeSurface>
            <RecipeSurface
              title="Workflow Runs"
              description="Run status stays visible without compressing the review queue."
              bodyClassName="min-h-[420px] overflow-auto p-4"
            >
              <LemmaWorkflowRunner
                client={client}
                podId={recipe.podId}
                workflowName="approval-decision"
                appearance="contained"
                density="compact"
              />
            </RecipeSurface>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocsWorkspaceRecipe() {
  const recipe = RECIPE_DEFS.find((item) => item.slug === "docs-workspace-os")!;
  const client = useMemo(() => getClient(recipe.podId), [recipe.podId]);
  const controller = useAssistantController({ client, assistantName: "knowledge-guide" });

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-sm">
        <PageSectionHeader
          icon={FileText}
          title="Docs Workspace OS"
          description="Document tree, pod-file browsing, document authoring, and a knowledge assistant in one desk."
          podId={recipe.podId}
        />
        <div className="grid gap-5 p-5">
          <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
            <RecipeSurface
              title="Workspace Documents"
              description="The document tree stays visible as the navigation spine for the workspace."
              bodyClassName="min-h-[720px]"
            >
              <LemmaPageTree
                client={client}
                podId={recipe.podId}
                rootPath="/"
                appearance="minimal"
                density="compact"
              />
            </RecipeSurface>
            <RecipeSurface
              title="Document Workspace"
              description="Author and preview the canonical workspace document without competing side panels."
              bodyClassName="min-h-[720px]"
            >
              <LemmaDocumentWorkspace
                client={client}
                podId={recipe.podId}
                mode="page"
                intent="create"
                file={{
                  defaultDirectoryPath: "/",
                  defaultFileName: "workspace-home.lemma-doc.json",
                  showBreadcrumbs: true,
                  showMetadata: true,
                }}
                defaultTitle="Workspace Home"
                defaultSummary="Use this surface to shape the canonical docs workspace recipe."
                appearance="minimal"
                density="comfortable"
              />
            </RecipeSurface>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <RecipeSurface
              title="Workspace Files"
              description="File browsing moves into its own band so browsing and uploads do not crowd the editor."
              bodyClassName="min-h-[420px]"
            >
              <LemmaFileBrowser
                client={client}
                podId={recipe.podId}
                initialPath="/"
                appearance="minimal"
                density="compact"
              />
            </RecipeSurface>
            <RecipeSurface
              title="Knowledge Guide"
              description="The assistant now gets a full panel for longer answers, handoffs, and attachments."
              bodyClassName="min-h-[420px]"
            >
              <AssistantExperienceView
                controller={controller}
                mode="embedded"
                appearance="minimal"
                density="compact"
                showConversationList={false}
              />
            </RecipeSurface>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotionCopyRecipe() {
  const recipe = RECIPE_DEFS.find((item) => item.slug === "notion-copy")!;
  const client = useMemo(() => getClient(recipe.podId), [recipe.podId]);
  const controller = useAssistantController({ client, assistantName: "notion-guide" });

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-sm">
        <PageSectionHeader
          icon={BookOpen}
          title="Notion Copy"
          description="A connected workspace with wiki documents, a database-style task lane, file navigation, search, publishing flow, and an AI guide."
          podId={recipe.podId}
        />
        <div className="grid gap-5 p-5">
          <section className="overflow-hidden rounded-2xl border border-border/70 bg-background/80 p-4">
            <LemmaGlobalSearch
              client={client}
              podId={recipe.podId}
              tables={[
                {
                  tableName: "workspace_tasks",
                  label: "Workspace Tasks",
                  searchFields: ["identifier", "title", "database_name", "page_slug", "status"],
                  displayField: "title",
                  subtitleField: "status",
                },
              ]}
              files={{
                enabled: true,
                label: "Workspace docs",
              }}
              assistant={{ assistantName: "notion-guide", label: "Ask notion guide" }}
              triggerLabel="Search workspace"
              appearance="minimal"
              density="compact"
            />
          </section>

          <Tabs defaultValue="wiki" className="gap-5">
            <TabsList variant="line" className="w-full justify-start gap-2 overflow-x-auto rounded-none border-b border-border/70 p-0 pb-2">
              <TabsTrigger value="wiki">Wiki</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="wiki">
              <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
                <RecipeSurface
                  title="Workspace Documents"
                  description="A file-native document tree for the workspace spine, similar to a Notion sidebar."
                  bodyClassName="min-h-[720px]"
                >
                  <LemmaPageTree
                    client={client}
                    podId={recipe.podId}
                    rootPath="/"
                    appearance="minimal"
                    density="compact"
                  />
                </RecipeSurface>
                <RecipeSurface
                  title="Wiki Page"
                  description="The primary editing and preview surface for the current workspace page."
                  bodyClassName="min-h-[720px]"
                >
                  <LemmaDocumentWorkspace
                    client={client}
                    podId={recipe.podId}
                    mode="page"
                    intent="create"
                    file={{
                      defaultDirectoryPath: "/",
                      defaultFileName: "company-home.lemma-doc.json",
                      showBreadcrumbs: true,
                      showMetadata: true,
                    }}
                    defaultTitle="Company Home"
                    defaultSummary="Team workspace entry page with policies, handbooks, and specs."
                    appearance="minimal"
                    density="comfortable"
                  />
                </RecipeSurface>
              </div>
            </TabsContent>

            <TabsContent value="database">
              <RecipeSurface
                title="Workspace Database"
                description="A lightweight Notion-style database view over the shared task table."
                bodyClassName="p-4"
              >
                <LemmaRecordsView
                  client={client}
                  podId={recipe.podId}
                  tableName="workspace_tasks"
                  defaultView="grouped"
                  detailMode="sheet"
                  createMode="sheet"
                  hiddenFields={["id", "created_at", "updated_at"]}
                  appearance="minimal"
                  density="compact"
                  title="Workspace Tasks"
                />
              </RecipeSurface>
            </TabsContent>

            <TabsContent value="files">
              <RecipeSurface
                title="Workspace Files"
                description="Templates, wiki assets, and meeting note storage in the pod file namespace."
                bodyClassName="min-h-[520px]"
              >
                <LemmaFileBrowser
                  client={client}
                  podId={recipe.podId}
                  initialPath="/"
                  appearance="minimal"
                  density="compact"
                />
              </RecipeSurface>
            </TabsContent>
          </Tabs>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <RecipeSurface
              title="Knowledge Guide"
              description="A full assistant panel for summarizing documents, suggesting links, and navigating the workspace."
              bodyClassName="min-h-[460px]"
            >
              <AssistantExperienceView
                controller={controller}
                mode="embedded"
                appearance="minimal"
                density="compact"
                showConversationList={false}
              />
            </RecipeSurface>
            <div className="grid gap-5">
              <RecipeSurface
                title="Publishing Flow"
                description="A workflow-backed publish handoff that mirrors review actions you would expect in a mature workspace."
                bodyClassName="p-4"
              >
                <LemmaActionSurface
                  client={client}
                  podId={recipe.podId}
                  title="Start publish review"
                  description="Collect a publish decision for a page before it moves forward."
                  variant="panel"
                  action={{
                    kind: "workflow",
                    workflowName: "page-publish-review",
                    label: "Start publish review",
                    description: "Launch the manual publish review workflow.",
                  }}
                  appearance="contained"
                  density="compact"
                />
              </RecipeSurface>
              <RecipeSurface
                title="Publish Runs"
                description="Review publish handoff runs without leaving the workspace."
                bodyClassName="min-h-[260px] overflow-auto p-4"
              >
                <LemmaWorkflowRunner
                  client={client}
                  podId={recipe.podId}
                  workflowName="page-publish-review"
                  appearance="contained"
                  density="compact"
                />
              </RecipeSurface>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinearCopyRecipe() {
  const recipe = RECIPE_DEFS.find((item) => item.slug === "linear-copy")!;
  const client = useMemo(() => getClient(recipe.podId), [recipe.podId]);
  const controller = useAssistantController({ client, assistantName: "linear-pm" });

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-sm">
        <PageSectionHeader
          icon={GitBranch}
          title="Linear Copy"
          description="A product delivery desk with issue triage, project and cycle context, roadmap files, planning workflows, and an AI copilot."
          podId={recipe.podId}
        />
        <div className="grid gap-5 p-5">
          <section className="overflow-hidden rounded-2xl border border-border/70 bg-background/80 p-4">
            <LemmaGlobalSearch
              client={client}
              podId={recipe.podId}
              tables={[
                {
                  tableName: "issues",
                  label: "Issues",
                  searchFields: ["identifier", "title", "description", "status", "priority", "project_slug", "cycle_name"],
                  displayField: "title",
                  subtitleField: "status",
                },
                {
                  tableName: "projects",
                  label: "Projects",
                  searchFields: ["name", "slug", "summary", "status"],
                  displayField: "name",
                  subtitleField: "status",
                },
                {
                  tableName: "cycles",
                  label: "Cycles",
                  searchFields: ["name", "goal", "status"],
                  displayField: "name",
                  subtitleField: "status",
                },
              ]}
              assistant={{ assistantName: "linear-pm", label: "Ask linear pm" }}
              triggerLabel="Search delivery workspace"
              appearance="minimal"
              density="compact"
            />
          </section>

          <Tabs defaultValue="issues" className="gap-5">
            <TabsList variant="line" className="w-full justify-start gap-2 overflow-x-auto rounded-none border-b border-border/70 p-0 pb-2">
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="planning">Projects & Cycles</TabsTrigger>
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            </TabsList>

            <TabsContent value="issues">
              <RecipeSurface
                title="Issue Queue"
                description="The main Linear-style work loop with issue triage, prioritization, and sheet detail."
                bodyClassName="p-4"
              >
                <LemmaRecordsView
                  client={client}
                  podId={recipe.podId}
                  tableName="issues"
                  preset="issues"
                  defaultView="linear"
                  detailMode="sheet"
                  createMode="sheet"
                  hiddenFields={["id", "created_at", "updated_at"]}
                  appearance="minimal"
                  density="compact"
                  title="Active Issues"
                />
              </RecipeSurface>
            </TabsContent>

            <TabsContent value="planning">
              <div className="grid gap-5 xl:grid-cols-2">
                <RecipeSurface
                  title="Projects"
                  description="Initiatives with status and target date context."
                  bodyClassName="p-4"
                >
                  <LemmaRecordsView
                    client={client}
                    podId={recipe.podId}
                    tableName="projects"
                    defaultView="list"
                    detailMode="sheet"
                    createMode="sheet"
                    hiddenFields={["id", "created_at", "updated_at"]}
                    appearance="minimal"
                    density="compact"
                    title="Projects"
                  />
                </RecipeSurface>
                <RecipeSurface
                  title="Cycles"
                  description="Current and upcoming cycle definitions with delivery goals."
                  bodyClassName="p-4"
                >
                  <LemmaRecordsView
                    client={client}
                    podId={recipe.podId}
                    tableName="cycles"
                    defaultView="list"
                    detailMode="sheet"
                    createMode="sheet"
                    hiddenFields={["id", "created_at", "updated_at"]}
                    appearance="minimal"
                    density="compact"
                    title="Cycles"
                  />
                </RecipeSurface>
              </div>
            </TabsContent>

            <TabsContent value="roadmap">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                <RecipeSurface
                  title="Roadmap Files"
                  description="Quarterly plans and cycle briefs live in the same desk instead of a disconnected file store."
                  bodyClassName="min-h-[520px]"
                >
                  <LemmaFileBrowser
                    client={client}
                    podId={recipe.podId}
                    initialPath="/roadmaps"
                    appearance="minimal"
                    density="compact"
                  />
                </RecipeSurface>
                <RecipeSurface
                  title="Delivery Health"
                  description="Status and team mix from the live issue table."
                  bodyClassName="overflow-auto p-4"
                >
                  <LemmaInsights
                    client={client}
                    podId={recipe.podId}
                    stats={recipeStats("issues", "status", "in_progress", "in_review")}
                    charts={recipeChart("issues", "team", "Issues by Team")}
                    columns={3}
                    appearance="contained"
                    density="compact"
                  />
                </RecipeSurface>
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <RecipeSurface
              title="Linear PM"
              description="Assistant sidecar for delivery summaries, project risk, and planning prep."
              bodyClassName="min-h-[460px]"
            >
              <AssistantExperienceView
                controller={controller}
                mode="embedded"
                appearance="minimal"
                density="compact"
                showConversationList={false}
              />
            </RecipeSurface>
            <div className="grid gap-5">
              <RecipeSurface
                title="Cycle Planning"
                description="Launch the planning workflow from the same desk where issues and cycles already live."
                bodyClassName="p-4"
              >
                <LemmaActionSurface
                  client={client}
                  podId={recipe.podId}
                  title="Start cycle planning"
                  description="Collect cycle focus and ship timing for the next planning pass."
                  variant="panel"
                  action={{
                    kind: "workflow",
                    workflowName: "cycle-planning",
                    label: "Start cycle planning",
                    description: "Launch the manual cycle planning workflow.",
                  }}
                  appearance="contained"
                  density="compact"
                />
              </RecipeSurface>
              <RecipeSurface
                title="Planning Runs"
                description="Keep run history visible for the current planning sequence."
                bodyClassName="min-h-[260px] overflow-auto p-4"
              >
                <LemmaWorkflowRunner
                  client={client}
                  podId={recipe.podId}
                  workflowName="cycle-planning"
                  appearance="contained"
                  density="compact"
                />
              </RecipeSurface>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AppFrame>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/issue-tracker" element={<IssueTrackerRecipe />} />
          <Route path="/triage-inbox" element={<TriageInboxRecipe />} />
          <Route path="/approval-workflow" element={<ApprovalWorkflowRecipe />} />
          <Route path="/docs-workspace-os" element={<DocsWorkspaceRecipe />} />
          <Route path="/notion-copy" element={<NotionCopyRecipe />} />
          <Route path="/linear-copy" element={<LinearCopyRecipe />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppFrame>
    </HashRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
