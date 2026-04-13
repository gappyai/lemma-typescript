import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react"
import type {
  Agent,
  JsonSchemaLike,
  Workflow,
} from "lemma-sdk"
import {
  useAgentRun,
  useMembers,
  useTables,
} from "lemma-sdk/react"
import { LemmaRecordsPage } from "@/components/lemma/lemma-records-page"
import { LemmaSchemaForm } from "@/components/lemma/lemma-schema-form"
import { LemmaWorkflowStartForm } from "@/components/lemma/lemma-workflow-start-form"
import { getClient, getShowcaseConfig } from "./lib/client.ts"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import showcaseComponentsConfig from "../components.json"

const SHOWCASE_CONFIG = getShowcaseConfig()

type ResourceThemeMode = "light" | "dark"
type ResourceThemePreset = "stone" | "slate" | "moss" | "sunset"
type ResourceThemeRadius = "tight" | "rounded" | "pillowy"
type ResourceChartPreset = "balanced" | "warm" | "cool"

interface ResourceThemeTokens {
  canvas: string
  canvasGlow: string
  surface: string
  surfaceAlt: string
  border: string
  borderStrong: string
  text: string
  muted: string
  mutedStrong: string
  subtle: string
  accent: string
  accentForeground: string
  accentStrong: string
  accentSoft: string
  ring: string
  input: string
  tableHeader: string
  tableRowHover: string
  tableRowSelected: string
  badge: string
  badgeText: string
  danger: string
  dangerSoft: string
  dangerBorder: string
  success: string
  warning: string
  shadow: string
  shadowLg: string
}

interface ResourceThemePresetDefinition {
  label: string
  description: string
  light: ResourceThemeTokens
  dark: ResourceThemeTokens
}

const RESOURCE_THEME_PRESETS: Record<ResourceThemePreset, ResourceThemePresetDefinition> = {
  stone: {
    label: "Stone",
    description: "Warm neutral workspace",
    light: {
      canvas: "#f7f4ed",
      canvasGlow: "#efe3c7",
      surface: "#fffdf9",
      surfaceAlt: "#faf6ee",
      border: "#ddd2bb",
      borderStrong: "#d9cfbb",
      text: "#241f16",
      muted: "#6a604f",
      mutedStrong: "#5f5648",
      subtle: "#8f8575",
      accent: "#202418",
      accentForeground: "#f6f2ea",
      accentStrong: "#2e3325",
      accentSoft: "#efe7d6",
      ring: "#6e8c56",
      input: "#ffffff",
      tableHeader: "#faf6ee",
      tableRowHover: "#faf6ee",
      tableRowSelected: "#f5efe4",
      badge: "#efe7d6",
      badgeText: "#5f5648",
      danger: "#b34a3c",
      dangerSoft: "#f8e5e2",
      dangerBorder: "#e6bbb5",
      success: "#6e8c56",
      warning: "#c78a2c",
      shadow: "rgba(36, 31, 22, 0.08)",
      shadowLg: "rgba(36, 31, 22, 0.14)",
    },
    dark: {
      canvas: "#16181c",
      canvasGlow: "#2b241b",
      surface: "#1d2126",
      surfaceAlt: "#252a31",
      border: "#363d46",
      borderStrong: "#434b56",
      text: "#f4efe6",
      muted: "#c6bbab",
      mutedStrong: "#d7cdbf",
      subtle: "#978e80",
      accent: "#f4efe6",
      accentForeground: "#16181c",
      accentStrong: "#e7dece",
      accentSoft: "#2b3138",
      ring: "#90b979",
      input: "#22272e",
      tableHeader: "#252a31",
      tableRowHover: "#262d35",
      tableRowSelected: "#2f3740",
      badge: "#2a3038",
      badgeText: "#d7cdbf",
      danger: "#f08a7c",
      dangerSoft: "#3b2524",
      dangerBorder: "#69403b",
      success: "#90b979",
      warning: "#f2b75b",
      shadow: "rgba(0, 0, 0, 0.32)",
      shadowLg: "rgba(0, 0, 0, 0.48)",
    },
  },
  slate: {
    label: "Slate",
    description: "Shadcn-esque cool neutral",
    light: {
      canvas: "#f8fafc",
      canvasGlow: "#dbe7f5",
      surface: "#ffffff",
      surfaceAlt: "#f8fafc",
      border: "#dbe2ea",
      borderStrong: "#c6d0db",
      text: "#111827",
      muted: "#526071",
      mutedStrong: "#3d4b5c",
      subtle: "#7b8794",
      accent: "#0f172a",
      accentForeground: "#f8fafc",
      accentStrong: "#1d283b",
      accentSoft: "#edf2f7",
      ring: "#334155",
      input: "#ffffff",
      tableHeader: "#f8fafc",
      tableRowHover: "#f8fafc",
      tableRowSelected: "#eef2f7",
      badge: "#edf2f7",
      badgeText: "#526071",
      danger: "#d9485f",
      dangerSoft: "#fdebed",
      dangerBorder: "#f4c7cf",
      success: "#256c5a",
      warning: "#b7791f",
      shadow: "rgba(15, 23, 42, 0.08)",
      shadowLg: "rgba(15, 23, 42, 0.14)",
    },
    dark: {
      canvas: "#020817",
      canvasGlow: "#13263d",
      surface: "#0f172a",
      surfaceAlt: "#162032",
      border: "#273449",
      borderStrong: "#344155",
      text: "#e2e8f0",
      muted: "#a0aec0",
      mutedStrong: "#c0c9d6",
      subtle: "#708094",
      accent: "#e2e8f0",
      accentForeground: "#020817",
      accentStrong: "#ced8e4",
      accentSoft: "#182132",
      ring: "#94a3b8",
      input: "#111b2e",
      tableHeader: "#162032",
      tableRowHover: "#18253a",
      tableRowSelected: "#21304a",
      badge: "#182132",
      badgeText: "#c0c9d6",
      danger: "#fb7185",
      dangerSoft: "#351822",
      dangerBorder: "#673445",
      success: "#5eead4",
      warning: "#fbbf24",
      shadow: "rgba(0, 0, 0, 0.38)",
      shadowLg: "rgba(0, 0, 0, 0.52)",
    },
  },
  moss: {
    label: "Moss",
    description: "Earthy product demo palette",
    light: {
      canvas: "#f4f8f1",
      canvasGlow: "#d9ead3",
      surface: "#fcfefb",
      surfaceAlt: "#f2f7ee",
      border: "#cddbc4",
      borderStrong: "#bfd2b3",
      text: "#1f2c1d",
      muted: "#5a6956",
      mutedStrong: "#42523f",
      subtle: "#7e8d79",
      accent: "#31553c",
      accentForeground: "#f4fbf5",
      accentStrong: "#3c6648",
      accentSoft: "#e5efe1",
      ring: "#4f7d57",
      input: "#ffffff",
      tableHeader: "#f2f7ee",
      tableRowHover: "#edf5e9",
      tableRowSelected: "#e3eedc",
      badge: "#e5efe1",
      badgeText: "#42523f",
      danger: "#b14f47",
      dangerSoft: "#f7e3e1",
      dangerBorder: "#e3beb9",
      success: "#4f7d57",
      warning: "#b88a2d",
      shadow: "rgba(31, 44, 29, 0.08)",
      shadowLg: "rgba(31, 44, 29, 0.15)",
    },
    dark: {
      canvas: "#0d1511",
      canvasGlow: "#173525",
      surface: "#14201a",
      surfaceAlt: "#1a2a22",
      border: "#274235",
      borderStrong: "#325240",
      text: "#e5f1e6",
      muted: "#a9bea8",
      mutedStrong: "#c7d9c6",
      subtle: "#7a907a",
      accent: "#8fc29a",
      accentForeground: "#0d1511",
      accentStrong: "#a2d1ac",
      accentSoft: "#203127",
      ring: "#8fc29a",
      input: "#17251e",
      tableHeader: "#1a2a22",
      tableRowHover: "#203127",
      tableRowSelected: "#274235",
      badge: "#203127",
      badgeText: "#c7d9c6",
      danger: "#f18c80",
      dangerSoft: "#36211f",
      dangerBorder: "#6d403b",
      success: "#8fc29a",
      warning: "#f4c15d",
      shadow: "rgba(0, 0, 0, 0.34)",
      shadowLg: "rgba(0, 0, 0, 0.48)",
    },
  },
  sunset: {
    label: "Sunset",
    description: "Amber and terracotta accents",
    light: {
      canvas: "#fff8f2",
      canvasGlow: "#fdd8bd",
      surface: "#fffdfb",
      surfaceAlt: "#fff4ea",
      border: "#f1d2ba",
      borderStrong: "#e7c1a6",
      text: "#3b2418",
      muted: "#7d5a49",
      mutedStrong: "#694838",
      subtle: "#9d7864",
      accent: "#9e4b33",
      accentForeground: "#fff7f3",
      accentStrong: "#b2573a",
      accentSoft: "#fde8da",
      ring: "#cf7c3c",
      input: "#ffffff",
      tableHeader: "#fff4ea",
      tableRowHover: "#fff1e4",
      tableRowSelected: "#fee6d4",
      badge: "#fde8da",
      badgeText: "#694838",
      danger: "#c24134",
      dangerSoft: "#fde6e1",
      dangerBorder: "#f0c0b7",
      success: "#8a6a2f",
      warning: "#cf7c3c",
      shadow: "rgba(59, 36, 24, 0.09)",
      shadowLg: "rgba(59, 36, 24, 0.16)",
    },
    dark: {
      canvas: "#1c120e",
      canvasGlow: "#4b2418",
      surface: "#271916",
      surfaceAlt: "#341f1a",
      border: "#59382f",
      borderStrong: "#6d4539",
      text: "#fdeee7",
      muted: "#d2b0a3",
      mutedStrong: "#e6c7bb",
      subtle: "#b88a7c",
      accent: "#f2b178",
      accentForeground: "#271916",
      accentStrong: "#f6c08e",
      accentSoft: "#3b241e",
      ring: "#f2b178",
      input: "#301e1a",
      tableHeader: "#341f1a",
      tableRowHover: "#3b241e",
      tableRowSelected: "#4c2d25",
      badge: "#3b241e",
      badgeText: "#e6c7bb",
      danger: "#ff9b88",
      dangerSoft: "#41231f",
      dangerBorder: "#7b433a",
      success: "#f2c572",
      warning: "#f2b178",
      shadow: "rgba(0, 0, 0, 0.34)",
      shadowLg: "rgba(0, 0, 0, 0.5)",
    },
  },
}

const RESOURCE_RADIUS_OPTIONS: Record<ResourceThemeRadius, { label: string; description: string; sm: string; md: string; lg: string }> = {
  tight: {
    label: "Tight",
    description: "Sharper shadcn-style corners",
    sm: "0.55rem",
    md: "0.9rem",
    lg: "1.2rem",
  },
  rounded: {
    label: "Rounded",
    description: "Balanced default corners",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
  },
  pillowy: {
    label: "Pillowy",
    description: "Soft showcase mode",
    sm: "0.95rem",
    md: "1.25rem",
    lg: "1.75rem",
  },
}

const RESOURCE_CHART_PRESETS: Record<ResourceChartPreset, { label: string; description: string }> = {
  balanced: {
    label: "Balanced",
    description: "Accent, success, warning, and error stay evenly weighted.",
  },
  warm: {
    label: "Warm",
    description: "Push charts toward amber and terracotta accents.",
  },
  cool: {
    label: "Cool",
    description: "Lean into ring, success, and muted cool tones.",
  },
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function resourceLabel<T extends { name?: string; title?: string | null; id?: string }>(resource: T): string {
  return resource.name ?? resource.title ?? resource.id ?? "Untitled"
}

function buildChartPalette(theme: ResourceThemeTokens, chartPreset: ResourceChartPreset): string[] {
  if (chartPreset === "warm") {
    return [theme.warning, theme.accent, theme.danger, theme.badgeText, theme.success]
  }

  if (chartPreset === "cool") {
    return [theme.ring, theme.success, theme.accent, theme.mutedStrong, theme.warning]
  }

  return [theme.accent, theme.success, theme.warning, theme.ring, theme.danger]
}

function buildResourceThemeStyle(
  theme: ResourceThemeTokens,
  radius: ResourceThemeRadius,
  chartPreset: ResourceChartPreset,
  highContrast: boolean,
): CSSProperties {
  const radiusScale = RESOURCE_RADIUS_OPTIONS[radius]
  const chartPalette = buildChartPalette(theme, chartPreset)
  const resolvedBorder = highContrast ? theme.borderStrong : theme.border
  const resolvedInputBorder = highContrast ? theme.borderStrong : theme.borderStrong
  const resolvedRing = highContrast ? theme.accent : theme.ring

  return {
    "--resource-canvas": theme.canvas,
    "--resource-canvas-glow": theme.canvasGlow,
    "--resource-surface": theme.surface,
    "--resource-surface-alt": theme.surfaceAlt,
    "--resource-border": resolvedBorder,
    "--resource-border-strong": theme.borderStrong,
    "--resource-text": theme.text,
    "--resource-muted": theme.muted,
    "--resource-muted-strong": theme.mutedStrong,
    "--resource-subtle": theme.subtle,
    "--resource-accent": theme.accent,
    "--resource-accent-foreground": theme.accentForeground,
    "--resource-accent-strong": theme.accentStrong,
    "--resource-accent-soft": theme.accentSoft,
    "--resource-ring": resolvedRing,
    "--resource-input": theme.input,
    "--resource-table-header": theme.tableHeader,
    "--resource-table-row-hover": theme.tableRowHover,
    "--resource-table-row-selected": theme.tableRowSelected,
    "--resource-badge": theme.badge,
    "--resource-badge-text": theme.badgeText,
    "--resource-danger": theme.danger,
    "--resource-danger-soft": theme.dangerSoft,
    "--resource-danger-border": theme.dangerBorder,
    "--resource-success": theme.success,
    "--resource-warning": theme.warning,
    "--resource-shadow": theme.shadow,
    "--resource-shadow-lg": theme.shadowLg,
    "--resource-radius-sm": radiusScale.sm,
    "--resource-radius-md": radiusScale.md,
    "--resource-radius-lg": radiusScale.lg,
    "--background": theme.canvas,
    "--foreground": theme.text,
    "--card": theme.surface,
    "--card-foreground": theme.text,
    "--popover": theme.surface,
    "--popover-foreground": theme.text,
    "--primary": theme.accent,
    "--primary-foreground": theme.accentForeground,
    "--secondary": theme.surfaceAlt,
    "--secondary-foreground": theme.text,
    "--muted": theme.surfaceAlt,
    "--muted-foreground": theme.muted,
    "--accent": theme.accentSoft,
    "--accent-foreground": theme.text,
    "--destructive": theme.danger,
    "--border": resolvedBorder,
    "--input": resolvedInputBorder,
    "--ring": resolvedRing,
    "--chart-1": chartPalette[0],
    "--chart-2": chartPalette[1],
    "--chart-3": chartPalette[2],
    "--chart-4": chartPalette[3],
    "--chart-5": chartPalette[4],
    "--radius": radiusScale.md,
    "--sidebar": theme.surface,
    "--sidebar-foreground": theme.text,
    "--sidebar-primary": theme.accent,
    "--sidebar-primary-foreground": theme.accentForeground,
    "--sidebar-accent": theme.accentSoft,
    "--sidebar-accent-foreground": theme.text,
    "--sidebar-border": resolvedBorder,
    "--sidebar-ring": resolvedRing,
  } as CSSProperties
}

function LoadingHint({ text }: { text: string }) {
  return <p className="text-sm text-[color:var(--resource-muted)]">{text}</p>
}

function SummaryCard({
  eyebrow,
  value,
  detail,
}: {
  eyebrow: string
  value: string
  detail: string
}) {
  return (
    <Card className="h-full shadow-[0_24px_60px_-42px_var(--resource-shadow-lg)]">
      <CardContent className="grid gap-3 p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--resource-subtle)]">
          {eyebrow}
        </div>
        <div className="text-3xl font-semibold text-[color:var(--resource-text)]">{value}</div>
        <div className="text-sm leading-6 text-[color:var(--resource-muted)]">{detail}</div>
      </CardContent>
    </Card>
  )
}

function ThemePresetButton({
  active,
  description,
  label,
  swatches,
  onClick,
}: {
  active: boolean
  description: string
  label: string
  swatches: string[]
  onClick: () => void
}) {
  return (
    <button
      className={cn("resource-playground-option", active && "resource-playground-option--active")}
      onClick={onClick}
      type="button"
    >
      <div className="grid gap-1">
        <div className="text-sm font-semibold text-[color:var(--resource-text)]">{label}</div>
        <div className="text-xs leading-5 text-[color:var(--resource-muted)]">{description}</div>
      </div>
      <div className="flex items-center gap-2">
        {swatches.map((swatch) => (
          <span
            key={swatch}
            className="resource-playground-swatch"
            style={{ background: swatch }}
          />
        ))}
      </div>
    </button>
  )
}

export function ResourcePlayground() {
  const client = getClient()
  const [activePodId, setActivePodId] = useState(SHOWCASE_CONFIG.podId)
  const [podIdDraft, setPodIdDraft] = useState(SHOWCASE_CONFIG.podId)
  const [themeMode, setThemeMode] = useState<ResourceThemeMode>("light")
  const [themePreset, setThemePreset] = useState<ResourceThemePreset>("slate")
  const [themeRadius, setThemeRadius] = useState<ResourceThemeRadius>("rounded")
  const [chartPreset, setChartPreset] = useState<ResourceChartPreset>("balanced")
  const [highContrast, setHighContrast] = useState(false)

  const [agents, setAgents] = useState<Agent[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)

  const [selectedTableName, setSelectedTableName] = useState("")
  const [selectedAgentName, setSelectedAgentName] = useState("")
  const [selectedWorkflowName, setSelectedWorkflowName] = useState("")

  const [lastWorkflowRun, setLastWorkflowRun] = useState<Record<string, unknown> | null>(null)
  const [agentWaitingInput, setAgentWaitingInput] = useState("")
  const [agentWaitingInputError, setAgentWaitingInputError] = useState<string | null>(null)

  const tablesState = useTables({
    client,
    podId: activePodId || undefined,
    enabled: !!activePodId,
    limit: 100,
  })

  const selectedTable = useMemo(
    () => tablesState.tables.find((table) => table.name === selectedTableName) ?? null,
    [selectedTableName, tablesState.tables],
  )
  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.name === selectedAgentName) ?? null,
    [agents, selectedAgentName],
  )
  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.name === selectedWorkflowName) ?? null,
    [selectedWorkflowName, workflows],
  )

  const members = useMembers({
    client,
    podId: activePodId || undefined,
    enabled: !!activePodId,
  })

  const agentRun = useAgentRun({
    client,
    podId: activePodId || undefined,
    agentName: selectedAgentName || undefined,
    autoConnect: true,
    autoConnectOnStart: true,
  })

  const loadCatalog = useCallback(async () => {
    if (!activePodId) {
      setAgents([])
      setWorkflows([])
      return
    }

    setIsCatalogLoading(true)
    setCatalogError(null)

    try {
      const scopedClient = client.withPod(activePodId)
      const [agentsResponse, workflowsResponse] = await Promise.all([
        scopedClient.agents.list({ limit: 100 }),
        scopedClient.workflows.list({ limit: 100 }),
      ])

      const nextAgents = agentsResponse.items ?? []
      const nextWorkflows = workflowsResponse.items ?? []

      setAgents(nextAgents)
      setWorkflows(nextWorkflows)
      setSelectedAgentName((current) => (
        current && nextAgents.some((agent) => agent.name === current)
          ? current
          : (nextAgents[0]?.name ?? "")
      ))
      setSelectedWorkflowName((current) => (
        current && nextWorkflows.some((workflow) => workflow.name === current)
          ? current
          : (nextWorkflows[0]?.name ?? "")
      ))
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Failed to load pod resources.")
    } finally {
      setIsCatalogLoading(false)
    }
  }, [activePodId, client])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    setSelectedTableName((current) => (
      current && tablesState.tables.some((table) => table.name === current)
        ? current
        : (tablesState.tables[0]?.name ?? "")
    ))
  }, [tablesState.tables])

  const handleAgentWaitingInputSubmit = useCallback(async () => {
    setAgentWaitingInputError(null)
    try {
      await agentRun.submitInput(agentWaitingInput)
      setAgentWaitingInput("")
    } catch (error) {
      setAgentWaitingInputError(error instanceof Error ? error.message : "Failed to submit follow-up input.")
    }
  }, [agentRun, agentWaitingInput])

  const agentInputSchema = useMemo(
    () => (selectedAgent?.input_schema ?? null) as JsonSchemaLike | null,
    [selectedAgent],
  )

  const activeTheme = RESOURCE_THEME_PRESETS[themePreset][themeMode]
  const chartPalette = useMemo(
    () => buildChartPalette(activeTheme, chartPreset),
    [activeTheme, chartPreset],
  )
  const themeStyle = useMemo(
    () => buildResourceThemeStyle(activeTheme, themeRadius, chartPreset, highContrast),
    [activeTheme, chartPreset, highContrast, themeRadius],
  )
  const presetEntries = useMemo(
    () => Object.entries(RESOURCE_THEME_PRESETS) as Array<[ResourceThemePreset, ResourceThemePresetDefinition]>,
    [],
  )
  const memberPreview = members.members.slice(0, 4)
  const summaryCards = [
    {
      eyebrow: "Tables",
      value: tablesState.isLoading ? "…" : String(tablesState.tables.length),
      detail: selectedTable
        ? `${selectedTable.columns.length} columns in ${selectedTable.name}`
        : "Pick a table to open the records workspace.",
    },
    {
      eyebrow: "Agents",
      value: isCatalogLoading ? "…" : String(agents.length),
      detail: selectedAgent
        ? `${Object.keys(selectedAgent.input_schema ?? {}).length} input keys in ${selectedAgent.name}`
        : "Select an agent to render its input schema.",
    },
    {
      eyebrow: "Workflows",
      value: isCatalogLoading ? "…" : String(workflows.length),
      detail: selectedWorkflow
        ? `Start type: ${selectedWorkflow.start?.type ?? "MANUAL"}`
        : "Choose a workflow and launch it from the live form.",
    },
    {
      eyebrow: "Members",
      value: members.isLoading ? "…" : String(members.members.length),
      detail: members.members.length > 0
        ? `${members.members[0]?.user_name || members.members[0]?.user_email} + ${Math.max(members.members.length - 1, 0)} more`
        : "Pod collaborators show up here once resources load.",
    },
  ]

  return (
      <div
      className={cn("resource-playground-theme", themeMode === "dark" && "dark")}
      data-mode={themeMode}
      style={themeStyle}
    >
      <div className="resource-playground-shell mx-auto grid max-w-[1600px] gap-6 px-4 pb-12 pt-6 sm:px-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <div className="grid gap-6 xl:sticky xl:top-24">
            <Card className="overflow-hidden shadow-[0_28px_80px_-48px_var(--resource-shadow-lg)]">
              <CardHeader className="resource-playground-card-header gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--resource-subtle)]">
                  Theme Mixer
                </p>
                <CardTitle className="text-xl">Shadcn-style surface controls</CardTitle>
                <CardDescription>
                  Use the real shadcn primitives below while swapping runtime tokens, chart palettes, and contrast
                  controls for this resource workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-2">
                  <Label>Base tone</Label>
                  <div className="grid gap-2">
                    {presetEntries.map(([value, preset]) => (
                      <ThemePresetButton
                        key={value}
                        active={themePreset === value}
                        description={preset.description}
                        label={preset.label}
                        onClick={() => setThemePreset(value)}
                        swatches={[
                          preset[themeMode].accent,
                          preset[themeMode].surfaceAlt,
                          preset[themeMode].ring,
                        ]}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Experience toggles</Label>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between rounded-[calc(var(--resource-radius-md)-0.2rem)] border border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-2.5">
                      <div className="grid gap-0.5">
                        <div className="text-sm font-semibold text-[color:var(--resource-text)]">Dark mode</div>
                        <div className="text-xs leading-5 text-[color:var(--resource-muted)]">Flip the full shadcn token stack, not just the page background.</div>
                      </div>
                      <Switch
                        checked={themeMode === "dark"}
                        onCheckedChange={(checked) => setThemeMode(checked === true ? "dark" : "light")}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-[calc(var(--resource-radius-md)-0.2rem)] border border-[color:var(--resource-border)] bg-[var(--resource-surface-alt)] px-3 py-2.5">
                      <div className="grid gap-0.5">
                        <div className="text-sm font-semibold text-[color:var(--resource-text)]">High contrast</div>
                        <div className="text-xs leading-5 text-[color:var(--resource-muted)]">Strengthen borders and focus color for denser data views.</div>
                      </div>
                      <Switch
                        checked={highContrast}
                        onCheckedChange={(checked) => setHighContrast(checked === true)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Corner profile</Label>
                  <div className="grid gap-2">
                    {(Object.entries(RESOURCE_RADIUS_OPTIONS) as Array<[ResourceThemeRadius, typeof RESOURCE_RADIUS_OPTIONS[ResourceThemeRadius]]>).map(([value, option]) => (
                      <button
                        key={value}
                        className={cn("resource-playground-option", themeRadius === value && "resource-playground-option--active")}
                        onClick={() => setThemeRadius(value)}
                        type="button"
                      >
                        <div className="grid gap-1">
                          <div className="text-sm font-semibold text-[color:var(--resource-text)]">{option.label}</div>
                          <div className="text-xs leading-5 text-[color:var(--resource-muted)]">{option.description}</div>
                        </div>
                        <div className="rounded-[999px] border border-[color:var(--resource-border-strong)] bg-[var(--resource-surface-alt)] px-2 py-1 text-[11px] font-medium text-[color:var(--resource-muted-strong)]">
                          {option.md}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Chart palette</Label>
                  <div className="grid gap-2">
                    {(Object.entries(RESOURCE_CHART_PRESETS) as Array<[ResourceChartPreset, typeof RESOURCE_CHART_PRESETS[ResourceChartPreset]]>).map(([value, option]) => (
                      <button
                        key={value}
                        className={cn("resource-playground-option", chartPreset === value && "resource-playground-option--active")}
                        onClick={() => setChartPreset(value)}
                        type="button"
                      >
                        <div className="grid gap-1">
                          <div className="text-sm font-semibold text-[color:var(--resource-text)]">{option.label}</div>
                          <div className="text-xs leading-5 text-[color:var(--resource-muted)]">{option.description}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {buildChartPalette(activeTheme, value).map((swatch) => (
                            <span
                              key={`${value}-${swatch}`}
                              className="resource-playground-swatch"
                              style={{ background: swatch }}
                            />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid gap-3 rounded-[var(--resource-radius-md)] border border-[color:var(--resource-border)] bg-[var(--resource-surface)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{showcaseComponentsConfig.style}</Badge>
                    <Badge variant="outline">Base {showcaseComponentsConfig.tailwind.baseColor}</Badge>
                    <Badge variant="outline">{showcaseComponentsConfig.iconLibrary} icons</Badge>
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-semibold text-[color:var(--resource-text)]">Live shadcn preview</div>
                    <div className="text-xs leading-5 text-[color:var(--resource-muted)]">
                      The same runtime token layer now drives the real shadcn button, badge, input, switch, and card styles.
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">Primary</Button>
                    <Button size="sm" variant="outline">Outline</Button>
                    <Badge>Accent</Badge>
                    <Badge variant="outline">Surface</Badge>
                  </div>
                  <Input readOnly value={`${RESOURCE_THEME_PRESETS[themePreset].label} / ${chartPreset} / ${themeRadius}`} />
                  <div className="grid grid-cols-5 gap-2">
                    {chartPalette.map((swatch, index) => (
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

            <Card className="shadow-[0_24px_72px_-52px_var(--resource-shadow-lg)]">
              <CardHeader className="gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--resource-subtle)]">
                  Workspace Controls
                </p>
                <CardTitle>Pod and resource selectors</CardTitle>
                <CardDescription>
                  Keep the navigation controls anchored while the records workspace gets room to breathe.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="resource-pod-id">Pod ID</Label>
                  <Input
                    id="resource-pod-id"
                    onChange={(event) => setPodIdDraft(event.target.value)}
                    placeholder="pod_..."
                    value={podIdDraft}
                  />
                  <Button
                    className="w-full"
                    onClick={() => setActivePodId(podIdDraft.trim())}
                  >
                    Load Resources
                  </Button>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="selected-table">Table</Label>
                  <Select value={selectedTableName} onValueChange={setSelectedTableName}>
                    <SelectTrigger id="selected-table">
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tablesState.tables.map((table) => (
                        <SelectItem key={table.name} value={table.name}>
                          {table.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs leading-5 text-[color:var(--resource-muted)]">
                    {selectedTable
                      ? `${selectedTable.columns.length} columns available`
                      : "Choose the table that should drive the records workspace."}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="selected-agent">Agent</Label>
                  <Select value={selectedAgentName} onValueChange={setSelectedAgentName}>
                    <SelectTrigger id="selected-agent">
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.name} value={agent.name}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs leading-5 text-[color:var(--resource-muted)]">
                    {selectedAgent
                      ? `${Object.keys(selectedAgent.input_schema ?? {}).length} schema keys`
                      : "Pick an agent to render its schema and run it live."}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="selected-workflow">Workflow</Label>
                  <Select value={selectedWorkflowName} onValueChange={setSelectedWorkflowName}>
                    <SelectTrigger id="selected-workflow">
                      <SelectValue placeholder="Select a workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflows.map((workflow) => (
                        <SelectItem key={workflow.name} value={workflow.name}>
                          {resourceLabel(workflow)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs leading-5 text-[color:var(--resource-muted)]">
                    {selectedWorkflow
                      ? `Launch mode: ${selectedWorkflow.start?.type ?? "MANUAL"}`
                      : "Choose a workflow to expose its start form on the right."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--resource-subtle)]">
                  Members Snapshot
                </p>
                <CardTitle>Pod collaborators</CardTitle>
                <CardDescription>The first few members stay visible while you work through tables and forms.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {members.error ? (
                  <div className="resource-playground-error">{members.error.message}</div>
                ) : members.isLoading ? (
                  <LoadingHint text="Loading members…" />
                ) : memberPreview.length === 0 ? (
                  <LoadingHint text="No members found for this pod." />
                ) : (
                  memberPreview.map((member) => (
                    <div key={member.user_id} className="resource-playground-member-card">
                      <div className="font-medium text-[color:var(--resource-text)]">{member.user_name || member.user_email}</div>
                      <div className="text-xs text-[color:var(--resource-muted)]">{member.role}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </aside>

        <div className="grid min-w-0 gap-6">
          <section className="resource-playground-hero">
            <div className="grid gap-3">
              <Badge className="resource-playground-pill">Resource Playground</Badge>
              <div className="grid gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--resource-text)] sm:text-4xl">
                  Give every resource block enough room to breathe
                </h1>
                <p className="max-w-[72ch] text-sm leading-7 text-[color:var(--resource-muted)] sm:text-base">
                  This view now behaves like a proper workbench: the navigation stays pinned, the data-heavy cards are
                  constrained with `min-w-0` and scrollable shells, and the whole page can be restyled through a token
                  mixer inspired by shadcn’s theme tooling.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="resource-playground-pill" variant="secondary">
                {activePodId ? `Pod ${activePodId}` : "No pod loaded"}
              </Badge>
              <Badge className="resource-playground-pill" variant="secondary">
                {RESOURCE_THEME_PRESETS[themePreset].label} / {themeMode}
              </Badge>
              <Badge className="resource-playground-pill" variant="secondary">
                {RESOURCE_RADIUS_OPTIONS[themeRadius].label} corners
              </Badge>
              <Badge className="resource-playground-pill" variant="outline">
                Charts: {RESOURCE_CHART_PRESETS[chartPreset].label}
              </Badge>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {summaryCards.map((card) => (
              <SummaryCard
                detail={card.detail}
                eyebrow={card.eyebrow}
                key={card.eyebrow}
                value={card.value}
              />
            ))}
          </section>

          {catalogError ? (
            <Card>
              <CardHeader>
                <CardTitle>Catalog Error</CardTitle>
                <CardDescription>{catalogError}</CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {!activePodId ? (
            <Card>
              <CardHeader>
                <CardTitle>Pod Required</CardTitle>
                <CardDescription>Enter a pod ID in the sidebar to load tables, agents, workflows, and members.</CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {activePodId ? (
            <section className="grid min-w-0 items-start gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
              <div className="grid min-w-0 gap-6">
                <LemmaRecordsPage
                  client={client}
                  description={
                    selectedTable
                      ? `Browse, filter, inspect, edit, and relate rows in ${selectedTable.name}.`
                      : "Pick a table to explore it with the full records registry block."
                  }
                  isLoadingTables={tablesState.isLoading}
                  onRefreshTables={() => {
                    void tablesState.refresh()
                  }}
                  podId={activePodId}
                  recordLimit={25}
                  tables={tablesState.tables}
                  tablesError={tablesState.error}
                  tableName={selectedTableName}
                  title={selectedTable ? `Records Workspace: ${selectedTable.name}` : "Records Workspace"}
                  onTableNameChange={setSelectedTableName}
                />
              </div>

              <div className="grid min-w-0 gap-6">
                {selectedWorkflowName ? (
                  <LemmaWorkflowStartForm
                    client={client}
                    description={
                      selectedWorkflow
                        ? `Workflow start type: ${selectedWorkflow.start?.type ?? "MANUAL"}.`
                        : "Select a workflow to render its launch form."
                    }
                    onStarted={(run) => setLastWorkflowRun(run)}
                    podId={activePodId}
                    submitLabel="Start selected workflow"
                    title={selectedWorkflow ? `Workflow Launcher: ${selectedWorkflow.name}` : "Workflow Launcher"}
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
                    <CardDescription>Latest run started from the registry workflow form.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {lastWorkflowRun ? (
                      <pre className="resource-playground-pre">
                        {safeJson(lastWorkflowRun)}
                      </pre>
                    ) : (
                      <LoadingHint text="Start a workflow to inspect the run payload here." />
                    )}
                  </CardContent>
                </Card>

                {selectedAgent && agentInputSchema ? (
                  <LemmaSchemaForm
                    description="This is the generic registry schema form bound to the selected agent input schema."
                    onSubmit={async (data) => {
                      await agentRun.start(data)
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
                    <CardDescription>Live status, follow-up input, and final output from `useAgentRun`.</CardDescription>
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

                    <div className="grid gap-2">
                      <Label>Final Output</Label>
                      <pre className="resource-playground-pre">
                        {safeJson(agentRun.finalOutput ?? agentRun.output ?? {})}
                      </pre>
                    </div>

                    <div className="grid gap-2">
                      <Label>Messages</Label>
                      <pre className="resource-playground-pre max-h-[320px] overflow-auto">
                        {safeJson(agentRun.messages)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
