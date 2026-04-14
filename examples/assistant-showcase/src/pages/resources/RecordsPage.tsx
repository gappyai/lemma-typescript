import { useMemo, useState } from "react";
import { useTables } from "lemma-sdk/react";
import {
  LemmaRecordsPage,
  LemmaTablePicker,
} from "@/components/lemma/registry-default";
import { getClient } from "@/lib/client";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface RecordsPageProps {
  podId: string | null;
}

export function RecordsPage({ podId }: RecordsPageProps) {
  const client = getClient();
  const [selectedTableName, setSelectedTableName] = useState("");

  const [themeCollapsed, setThemeCollapsed] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [themePreset, setThemePreset] = useState<ThemePreset>("slate");
  const [radiusProfile, setRadiusProfile] = useState<RadiusProfile>("rounded");
  const [chartPalette, setChartPalette] = useState<ChartPalette>("balanced");
  const [highContrast, setHighContrast] = useState(false);

  const tablesState = useTables({
    client,
    podId: podId || undefined,
    enabled: !!podId,
    limit: 100,
  });

  const selectedTable = useMemo(
    () => tablesState.tables.find((table) => table.name === selectedTableName) ?? null,
    [selectedTableName, tablesState.tables],
  );

  useMemo(() => {
    if (tablesState.tables.length > 0 && !selectedTableName) {
      setSelectedTableName(tablesState.tables[0].name);
    }
  }, [tablesState.tables, selectedTableName]);

  const themeStyle = useMemo(
    () => applyResourceTheme(themePreset, radiusProfile, darkMode, highContrast, chartPalette),
    [themePreset, radiusProfile, darkMode, highContrast, chartPalette],
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
            <CardDescription>Enter a pod ID to load tables and browse records.</CardDescription>
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
      <div className="grid gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="grid gap-1">
            <Badge variant="secondary" className="w-fit text-xs">Records</Badge>
            <h2 className="text-2xl font-semibold tracking-tight">Records Workspace</h2>
            <p className="text-sm text-[color:var(--resource-muted)]">
              Browse, filter, inspect, and edit rows in your datastore tables.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setThemeCollapsed(!themeCollapsed)}
          >
            {themeCollapsed ? "Show Theme" : "Hide Theme"}
          </Button>
        </div>

        <div className="grid gap-2">
          <LemmaTablePicker
            client={client}
            podId={podId}
            value={selectedTableName}
            onValueChange={setSelectedTableName}
            tables={tablesState.tables}
            isLoading={tablesState.isLoading}
            error={tablesState.error}
            onRefresh={() => void tablesState.refresh()}
            title="Table"
            description="Select a table to open its records workspace."
          />
        </div>

        {!themeCollapsed ? (
          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">Theme Controls</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label>Dark mode</Label>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>High contrast</Label>
                  <Switch checked={highContrast} onCheckedChange={setHighContrast} />
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
              </div>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Corner profile</Label>
                  <Select value={radiusProfile} onValueChange={(v) => setRadiusProfile(v as RadiusProfile)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(radiusProfiles) as Array<[RadiusProfile, typeof radiusProfiles[RadiusProfile]]>).map(([value, profile]) => (
                        <SelectItem key={value} value={value}>{profile.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Chart palette</Label>
                  <Select value={chartPalette} onValueChange={(v) => setChartPalette(v as ChartPalette)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(chartPalettes) as Array<[ChartPalette, typeof chartPalettes[ChartPalette]]>).map(([value, palette]) => (
                        <SelectItem key={value} value={value}>{palette.label}</SelectItem>
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
              </div>
            </CardContent>
          </Card>
        ) : null}

        <LemmaRecordsPage
          client={client}
          description={
            selectedTable
              ? `Browse, filter, inspect, edit, and relate rows in ${selectedTable.name}.`
              : "Pick a table to explore it with the full records registry block."
          }
          isLoadingTables={tablesState.isLoading}
          onRefreshTables={() => void tablesState.refresh()}
          podId={podId}
          recordLimit={25}
          tables={tablesState.tables}
          tablesError={tablesState.error}
          tableName={selectedTableName}
          title={selectedTable ? `Records: ${selectedTable.name}` : "Records Workspace"}
          onTableNameChange={setSelectedTableName}
        />
      </div>
    </div>
  );
}
