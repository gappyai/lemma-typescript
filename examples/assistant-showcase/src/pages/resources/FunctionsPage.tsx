import { useCallback, useEffect, useMemo, useState } from "react";
import { getClient } from "@/lib/client";
import {
  LemmaFunctionRunPanel,
  LemmaFunctionRunHistory,
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

interface FunctionSummary {
  name: string;
  input_schema?: Record<string, unknown> | null;
}

interface FunctionsPageProps {
  podId: string | null;
}

export function FunctionsPage({ podId }: FunctionsPageProps) {
  const client = getClient();

  const [darkMode, setDarkMode] = useState(false);
  const [themePreset, setThemePreset] = useState<ThemePreset>("slate");
  const [radiusProfile, setRadiusProfile] = useState<RadiusProfile>("rounded");
  const [chartPalette, setChartPalette] = useState<ChartPalette>("balanced");

  const [functions, setFunctions] = useState<FunctionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFunctionName, setSelectedFunctionName] = useState("");

  const loadFunctions = useCallback(async () => {
    if (!podId) {
      setFunctions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const scopedClient = client.withPod(podId);
      const response = await scopedClient.functions.list({ limit: 100 });
      const items = (response.items ?? []) as unknown as FunctionSummary[];
      setFunctions(items);
      setSelectedFunctionName((current) => (
        current && items.some((f) => f.name === current)
          ? current
          : (items[0]?.name ?? "")
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load functions.");
    } finally {
      setIsLoading(false);
    }
  }, [podId, client]);

  useEffect(() => {
    void loadFunctions();
  }, [loadFunctions]);

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
            <CardDescription>Enter a pod ID to load functions.</CardDescription>
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
          <Badge variant="secondary" className="w-fit text-xs">Functions</Badge>
          <h2 className="text-2xl font-semibold tracking-tight">Function Playground</h2>
          <p className="text-sm text-[color:var(--resource-muted)]">
            Select a function, run it with schema-aware input, and inspect recent run history.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">Function</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="function-select">Select function</Label>
                <Select value={selectedFunctionName} onValueChange={setSelectedFunctionName}>
                  <SelectTrigger id="function-select">
                    <SelectValue placeholder={isLoading ? "Loading…" : "Select a function"} />
                  </SelectTrigger>
                  <SelectContent>
                    {functions.map((fn) => (
                      <SelectItem key={fn.name} value={fn.name}>
                        {fn.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error ? (
                  <p className="text-xs text-[color:var(--resource-danger)]">{error}</p>
                ) : null}
                <p className="text-xs text-[color:var(--resource-muted)]">
                  {selectedFunctionName
                    ? `${Object.keys(functions.find((f) => f.name === selectedFunctionName)?.input_schema ?? {}).length} schema keys`
                    : "Pick a function to run it with schema-aware input."}
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

        {selectedFunctionName ? (
          <LemmaFunctionRunPanel
            client={client}
            podId={podId}
            functionName={selectedFunctionName}
            title={`Function Runner: ${selectedFunctionName}`}
            description="Run the selected function and inspect status plus output."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Function Runner</CardTitle>
              <CardDescription>Select a function to run it with schema-aware input.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {selectedFunctionName ? (
          <LemmaFunctionRunHistory
            client={client}
            podId={podId}
            functionName={selectedFunctionName}
            title="Run History"
            description="Recent runs for the selected function."
          />
        ) : null}
      </div>
    </div>
  );
}
