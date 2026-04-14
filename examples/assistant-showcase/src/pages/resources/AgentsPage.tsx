import { useCallback, useEffect, useMemo, useState } from "react";
import type { Agent, JsonSchemaLike } from "lemma-sdk";
import { useAgentRun } from "lemma-sdk/react";
import { getClient } from "@/lib/client";
import {
  LemmaSchemaForm,
  LemmaAgentMessages,
  LemmaAgentOutputCard,
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
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AgentsPageProps {
  podId: string | null;
}

export function AgentsPage({ podId }: AgentsPageProps) {
  const client = getClient();

  const [darkMode, setDarkMode] = useState(false);
  const [themePreset, setThemePreset] = useState<ThemePreset>("slate");
  const [radiusProfile, setRadiusProfile] = useState<RadiusProfile>("rounded");
  const [chartPalette, setChartPalette] = useState<ChartPalette>("balanced");

  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAgentName, setSelectedAgentName] = useState("");
  const [agentWaitingInput, setAgentWaitingInput] = useState("");
  const [agentWaitingInputError, setAgentWaitingInputError] = useState<string | null>(null);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.name === selectedAgentName) ?? null,
    [agents, selectedAgentName],
  );

  const agentInputSchema = useMemo(
    () => (selectedAgent?.input_schema ?? null) as JsonSchemaLike | null,
    [selectedAgent],
  );

  const agentRun = useAgentRun({
    client,
    podId: podId || undefined,
    agentName: selectedAgentName || undefined,
    autoConnect: true,
    autoConnectOnStart: true,
  });

  const loadAgents = useCallback(async () => {
    if (!podId) {
      setAgents([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const scopedClient = client.withPod(podId);
      const response = await scopedClient.agents.list({ limit: 100 });
      const items = response.items ?? [];
      setAgents(items);
      setSelectedAgentName((current) => (
        current && items.some((a) => a.name === current)
          ? current
          : (items[0]?.name ?? "")
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agents.");
    } finally {
      setIsLoading(false);
    }
  }, [podId, client]);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  const handleAgentWaitingInputSubmit = useCallback(async () => {
    setAgentWaitingInputError(null);
    try {
      await agentRun.submitInput(agentWaitingInput);
      setAgentWaitingInput("");
    } catch (err) {
      setAgentWaitingInputError(err instanceof Error ? err.message : "Failed to submit follow-up input.");
    }
  }, [agentRun, agentWaitingInput]);

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
            <CardDescription>Enter a pod ID to load agents.</CardDescription>
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
          <Badge variant="secondary" className="w-fit text-xs">Agents</Badge>
          <h2 className="text-2xl font-semibold tracking-tight">Agent Playground</h2>
          <p className="text-sm text-[color:var(--resource-muted)]">
            Select an agent, provide schema-aware input, and monitor the live run with status, messages, and output.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">Agent</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="agent-select">Select agent</Label>
                <Select value={selectedAgentName} onValueChange={setSelectedAgentName}>
                  <SelectTrigger id="agent-select">
                    <SelectValue placeholder={isLoading ? "Loading…" : "Select an agent"} />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.name} value={agent.name}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error ? (
                  <p className="text-xs text-[color:var(--resource-danger)]">{error}</p>
                ) : null}
                <p className="text-xs text-[color:var(--resource-muted)]">
                  {selectedAgent
                    ? `${Object.keys(selectedAgent.input_schema ?? {}).length} schema keys`
                    : "Pick an agent to render its input schema and run it live."}
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

        {selectedAgent && agentInputSchema ? (
          <LemmaSchemaForm
            description="Schema-aware input form bound to the selected agent."
            onSubmit={async (data) => {
              await agentRun.start(data);
            }}
            schema={agentInputSchema}
            submitLabel="Run selected agent"
            title={`Agent Input Form: ${selectedAgent.name}`}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Agent Input Form</CardTitle>
              <CardDescription>Select an agent to render its input schema.</CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Agent Run</CardTitle>
            <CardDescription>Live status, follow-up input, and final output from useAgentRun.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="resource-playground-status-card">
                <div className="text-xs uppercase tracking-[0.16em] text-[color:var(--resource-subtle)]">Status</div>
                <div className="mt-2 text-sm font-semibold text-[color:var(--resource-text)]">{agentRun.status ?? "idle"}</div>
              </div>
              <div className="resource-playground-status-card">
                <div className="text-xs uppercase tracking-[0.16em] text-[color:var(--resource-subtle)]">Task ID</div>
                <div className="mt-2 truncate text-sm font-semibold text-[color:var(--resource-text)]">{agentRun.taskId ?? "none"}</div>
              </div>
            </div>

            {agentRun.error ? (
              <div className="resource-playground-error">{agentRun.error.message}</div>
            ) : null}

            {agentRun.isWaitingForInput ? (
              <div className="grid gap-2">
                <Label htmlFor="agent-waiting-input">Follow-up Input</Label>
                <Textarea
                  id="agent-waiting-input"
                  onChange={(event) => setAgentWaitingInput(event.target.value)}
                  placeholder="Respond to the waiting task here…"
                  rows={4}
                  value={agentWaitingInput}
                />
                {agentWaitingInputError ? (
                  <div className="resource-playground-error">{agentWaitingInputError}</div>
                ) : null}
                <Button onClick={() => void handleAgentWaitingInputSubmit()}>
                  Submit Follow-up
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <LemmaAgentOutputCard
          task={agentRun.task ?? null}
          output={agentRun.finalOutput ?? agentRun.output ?? null}
          title="Agent Output"
          description="Inspect the latest structured output from the selected task."
          emptyText="Run an agent to inspect output here."
        />

        <LemmaAgentMessages
          client={client}
          podId={podId}
          taskId={agentRun.taskId ?? null}
          title="Agent Messages"
          description="Task messages streamed from the selected agent run."
        />
      </div>
    </div>
  );
}
