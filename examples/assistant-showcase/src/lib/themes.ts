import type { CSSProperties } from "react"

export type ThemeMode = "light" | "dark"

export type ThemePreset = "stone" | "slate" | "moss" | "sunset"

export type RadiusProfile = "tight" | "rounded" | "pillowy"

export type ChartPalette = "balanced" | "warm" | "cool"

export type FontScale = "default" | "compact" | "spacious"

export interface ThemeConfig {
  bgCanvas: string
  bgSurface: string
  bgSubtle: string
  borderDefault: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  brandPrimary: string
  brandSecondary: string
  brandAccent: string
  brandGlow: string
}

export interface ThemeTokens {
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

export interface ThemePresetDefinition {
  label: string
  description: string
  light: ThemeTokens
  dark: ThemeTokens
}

export interface RadiusProfileDefinition {
  label: string
  description: string
  sm: string
  md: string
  lg: string
}

export interface ChartPaletteDefinition {
  label: string
  description: string
}

export const themePresets: Record<ThemePreset, ThemePresetDefinition> = {
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
      accentStrong: "#1d2837",
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

export const radiusProfiles: Record<RadiusProfile, RadiusProfileDefinition> = {
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

export const chartPalettes: Record<ChartPalette, ChartPaletteDefinition> = {
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

export interface FontScaleDefinition {
  label: string
  description: string
  value: string
}

export const fontScales: Record<FontScale, FontScaleDefinition> = {
  default: {
    label: "Default",
    description: "Standard shadcn sizing",
    value: "1",
  },
  compact: {
    label: "Compact",
    description: "Tighter spacing for data-dense layouts",
    value: "0.9",
  },
  spacious: {
    label: "Spacious",
    description: "More room for readability",
    value: "1.1",
  },
}

export const COLOR_OVERRIDE_KEYS: Array<{ key: keyof ThemeTokens; label: string; cssVar: string }> = [
  { key: "canvas", label: "Background", cssVar: "--background" },
  { key: "text", label: "Foreground", cssVar: "--foreground" },
  { key: "accent", label: "Primary", cssVar: "--primary" },
  { key: "surfaceAlt", label: "Secondary", cssVar: "--secondary" },
  { key: "muted", label: "Muted", cssVar: "--muted-foreground" },
  { key: "accentSoft", label: "Accent", cssVar: "--accent" },
  { key: "danger", label: "Destructive", cssVar: "--destructive" },
  { key: "border", label: "Border", cssVar: "--border" },
]

export function buildAssistantThemeConfig(mode: ThemeMode): ThemeConfig {
  if (mode === "dark") {
    return {
      bgCanvas: "#14181c",
      bgSurface: "#1b2127",
      bgSubtle: "#242b33",
      borderDefault: "#39424d",
      textPrimary: "#f4efe6",
      textSecondary: "#d3c9b9",
      textTertiary: "#9e9688",
      brandPrimary: "#f4efe6",
      brandSecondary: "#7da96b",
      brandAccent: "#e4a74a",
      brandGlow: "#3a3226",
    }
  }

  return {
    bgCanvas: "#f6f2ea",
    bgSurface: "#fffdf9",
    bgSubtle: "#f1ebde",
    borderDefault: "#ddd2bb",
    textPrimary: "#241f16",
    textSecondary: "#5c5344",
    textTertiary: "#8a7f6f",
    brandPrimary: "#202418",
    brandSecondary: "#6e8c56",
    brandAccent: "#c78a2c",
    brandGlow: "#efe3c7",
  }
}

export function buildAssistantThemeCSS(theme: ThemeConfig): string {
  return `
    .lemma-assistant-theme {
      --bg-canvas: ${theme.bgCanvas};
      --bg-surface: ${theme.bgSurface};
      --bg-subtle: ${theme.bgSubtle};
      --border-default: ${theme.borderDefault};
      --text-primary: ${theme.textPrimary};
      --text-secondary: ${theme.textSecondary};
      --text-tertiary: ${theme.textTertiary};
      --brand-primary: ${theme.brandPrimary};
      --brand-secondary: ${theme.brandSecondary};
      --brand-accent: ${theme.brandAccent};
      --brand-glow: ${theme.brandGlow};
    }
  `
}

export function buildChartPaletteColors(theme: ThemeTokens, chartPreset: ChartPalette): string[] {
  if (chartPreset === "warm") {
    return [theme.warning, theme.accent, theme.danger, theme.badgeText, theme.success]
  }

  if (chartPreset === "cool") {
    return [theme.ring, theme.success, theme.accent, theme.mutedStrong, theme.warning]
  }

  return [theme.accent, theme.success, theme.warning, theme.ring, theme.danger]
}

export function applyResourceTheme(
  preset: ThemePreset,
  radiusProfile: RadiusProfile,
  darkMode: boolean,
  highContrast?: boolean,
  chartPreset?: ChartPalette,
): CSSProperties {
  const mode = darkMode ? "dark" : "light"
  const theme = themePresets[preset][mode]
  const radiusScale = radiusProfiles[radiusProfile]
  const resolvedChartPreset = chartPreset ?? "balanced"
  const chartPalette = buildChartPaletteColors(theme, resolvedChartPreset)
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
