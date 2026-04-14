import { useCallback, useEffect, useMemo, useState } from "react";
import type { Workflow } from "lemma-sdk";
import { getClient } from "@/lib/client";
import {
  LemmaWorkflowStartForm,
  LemmaWorkflowHistory,
} from "@/components/lemma/registry-default";
import {
  applyResourceTheme,
  buildChartPaletteColors,
  themePresets,
  radiusProfiles,
  chartPalettes,
  type ThemePreset,
  type RadiusProfile,
  type ChartPalette,
} from "@/lib/themes";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function resourceLabel<T extends { name?: string; title?: string | null; id?: string }>(resource: T): string {
  return resource.name ?? resource.title ?? resource.id ?? "Untitled";
}

interface WorkflowsPageProps {
  podId: string | null;
}

export function WorkflowsPage({ podId }: WorkflowsPageProps) {
  const client = getClient();

  const [darkMode, setDarkMode] = useState(false);
  const [themePreset, setThemePreset] = useState<ThemePreset>("slate");
  const [radiusProfile, setRadiusProfile] = useState<RadiusProfile>("rounded");
  const [chartPalette, setChartPalette] = useState<ChartPalette>("balanced");

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedWorkflowName, setSelectedWorkflowName] = useState("");
  const [lastWorkflowRun, setLastWorkflowRun] = useState<Record<string, unknown> | null>(null);

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.name === selectedWorkflowName) ?? null,
    [selectedWorkflowName, workflows],
  );

  const loadWorkflows = useCallback(async () => {
    if (!podId) {
      setWorkflows([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const scopedClient = client.withPod(podId);
      const response = await scopedClient.workflows.list({ limit: 100 });
      const items = response.items ?? [];
      setWorkflows(items);
      setSelectedWorkflowName((current) => (
        current && items.some((w) => w.name === current)
          ? current
          : (items[0]?.name ?? "")
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflows.");
    } finally {
      setIsLoading(false);
    }
  }, [podId, client]);

  useEffect(() => {
    void loadWorkflows();
  }, [loadWorkflows]);

  const themeStyle = useMemo(
    () => applyResourceTheme(themePreset, radiusProfile, darkMode, false, chartPalette),
    [themePreset, radiusProfile, darkMode, chartPalette],
  );

  const activeTheme = themePresets[themePreset][darkMode ? "dark" : "light"];
  const chartColors = useMemo(
    () => buildChartPaletteColors(activeTheme, chartPalette),
    [activeTheme, chartPalette],
  );

  if (!podId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Pod Required</CardTitle>
            <CardDescription>Enter a pod ID to load workflows.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn("resource-playground-theme", darkMode && "dark")}
      data-mode={darkMode ? "dark" : "light"}
      style={themeStyle}
    >
      <div className="grid gap-6 p-6 max-w-[960px] mx-auto">
        <div className="grid gap-1">
          <Badge variant="secondary" className="w-fit text-xs">Workflows</Badge>
          <h2 className="text-2xl font-semibold tracking-tight">Workflow Playground</h2>
          <p className="text-sm text-[color:var(--resource-muted)]">
            Select a workflow, launch it with a schema-aware form, and inspect run history.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">Workflow</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="workflow-select">Select workflow</Label>
                <Select value={selectedWorkflowName} onValueChange={setSelectedWorkflowName}>
                  <SelectTrigger id="workflow-select">
                    <SelectValue placeholder={isLoading ? "Loading…" : "Select a workflow"} />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map((workflow) => (
                      <SelectItem key={workflow.name} value={workflow.name}>
                        {resourceLabel(workflow)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error ? (
                  <p className="text-xs text-[color:var(--resource-danger)]">{error}</p>
                ) : null}
                <p className="text-xs text-[color:var(--resource-muted)]">
                  {selectedWorkflow
                    ? `Start type: ${selectedWorkflow.start?.type ?? "MANUAL"}`
                    : "Choose a workflow to expose its start form."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">Display</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label>Dark mode</Label>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              <div className="grid gap-2">
                <Label>Base tone</Label>
                <Select value={themePreset} onValueChange={(v) => setThemePreset(v as ThemePreset)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(themePresets) as Array<[ThemePreset, typeof themePresets[ThemePreset]]>).map(([value, preset]) => (
                      <SelectItem key={value} value={value}>{preset.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {chartColors.map((swatch, index) => (
                  <div
                    key={`${swatch}-${index}`}
                    className="h-8 rounded-md border border-border/60"
                    style={{ background: swatch }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedWorkflowName ? (
          <LemmaWorkflowStartForm
            client={client}
            description={
              selectedWorkflow
                ? `Workflow start type: ${selectedWorkflow.start?.type ?? "MANUAL"}.`
                : "Select a workflow to render its launch form."
            }
            onStarted={(run) => setLastWorkflowRun(run as unknown as Record<string, unknown>)}
            podId={podId}
            submitLabel="Start selected workflow"
            title={selectedWorkflow ? `Launcher: ${selectedWorkflow.name}` : "Workflow Launcher"}
            workflowName={selectedWorkflowName}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Workflow Launcher</CardTitle>
              <CardDescription>Select a workflow to render its launch form.</CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Workflow Result</CardTitle>
            <CardDescription>Latest run started from the workflow form.</CardDescription>
          </CardHeader>
          <CardContent>
            {lastWorkflowRun ? (
              <pre className="resource-playground-pre">{safeJson(lastWorkflowRun)}</pre>
            ) : (
              <p className="text-sm text-[color:var(--resource-muted)]">Start a workflow to inspect the run payload here.</p>
            )}
          </CardContent>
        </Card>

        {selectedWorkflowName ? (
          <LemmaWorkflowHistory
            client={client}
            description="Recent workflow runs loaded through the history registry component."
            podId={podId}
            workflowName={selectedWorkflowName}
          />
        ) : null}
      </div>
    </div>
  );
}
