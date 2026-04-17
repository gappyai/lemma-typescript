export type LemmaDiffViewerAppearance = "default" | "borderless" | "minimal" | "contained"
export type LemmaDiffViewerDensity = "compact" | "comfortable" | "spacious"
export type LemmaDiffViewerRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full"

const RADIUS_MAP: Record<LemmaDiffViewerRadius, Record<string, string>> = {
  none: { surface: "rounded-none", control: "rounded-none", pill: "rounded-none", overlay: "rounded-none" },
  sm:   { surface: "rounded-sm", control: "rounded-sm", pill: "rounded-full", overlay: "rounded-sm" },
  md:   { surface: "rounded-md", control: "rounded-md", pill: "rounded-full", overlay: "rounded-md" },
  lg:   { surface: "rounded-lg", control: "rounded-md", pill: "rounded-full", overlay: "rounded-lg" },
  xl:   { surface: "rounded-xl", control: "rounded-lg", pill: "rounded-full", overlay: "rounded-xl" },
  "2xl": { surface: "rounded-2xl", control: "rounded-xl", pill: "rounded-full", overlay: "rounded-2xl" },
  "3xl": { surface: "rounded-3xl", control: "rounded-2xl", pill: "rounded-full", overlay: "rounded-3xl" },
  full: { surface: "rounded-3xl", control: "rounded-full", pill: "rounded-full", overlay: "rounded-3xl" },
}

export function diffViewerRadiusClassName(
  radius: LemmaDiffViewerRadius,
  kind: "surface" | "control" | "pill" | "overlay",
): string {
  return RADIUS_MAP[radius]?.[kind] ?? RADIUS_MAP.lg[kind]
}

export function diffViewerRootClassName(appearance: LemmaDiffViewerAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

export function diffViewerHeaderClassName(appearance: LemmaDiffViewerAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

export function diffViewerToolbarClassName(density: LemmaDiffViewerDensity) {
  if (density === "compact") return "gap-2 px-3 py-2"
  if (density === "spacious") return "gap-4 px-5 py-4"
  return "gap-3 px-4 py-3"
}

export function diffViewerContentClassName(density: LemmaDiffViewerDensity) {
  if (density === "compact") return "p-1"
  if (density === "spacious") return "p-4"
  return "p-2"
}

export function diffViewerBodyClassName(appearance: LemmaDiffViewerAppearance) {
  if (appearance === "borderless" || appearance === "minimal") return "bg-transparent"
  if (appearance === "contained") return "bg-card"
  return "bg-background"
}
