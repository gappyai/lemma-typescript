export type LemmaScheduleViewAppearance = "default" | "borderless" | "minimal" | "contained"
export type LemmaScheduleViewDensity = "compact" | "comfortable" | "spacious"
export type LemmaScheduleViewRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full"

const RADIUS_MAP: Record<LemmaScheduleViewRadius, Record<string, string>> = {
  none: { surface: "rounded-none", control: "rounded-none", pill: "rounded-none", overlay: "rounded-none" },
  sm:   { surface: "rounded-sm", control: "rounded-sm", pill: "rounded-full", overlay: "rounded-sm" },
  md:   { surface: "rounded-md", control: "rounded-md", pill: "rounded-full", overlay: "rounded-md" },
  lg:   { surface: "rounded-lg", control: "rounded-md", pill: "rounded-full", overlay: "rounded-lg" },
  xl:   { surface: "rounded-xl", control: "rounded-lg", pill: "rounded-full", overlay: "rounded-xl" },
  "2xl": { surface: "rounded-2xl", control: "rounded-xl", pill: "rounded-full", overlay: "rounded-2xl" },
  "3xl": { surface: "rounded-3xl", control: "rounded-2xl", pill: "rounded-full", overlay: "rounded-3xl" },
  full: { surface: "rounded-3xl", control: "rounded-full", pill: "rounded-full", overlay: "rounded-3xl" },
}

export function scheduleViewRadiusClassName(
  radius: LemmaScheduleViewRadius,
  kind: "surface" | "control" | "pill" | "overlay",
): string {
  return RADIUS_MAP[radius]?.[kind] ?? RADIUS_MAP.lg[kind]
}

export function scheduleViewRootClassName(appearance: LemmaScheduleViewAppearance) {
  if (appearance === "contained") return "bg-card"
  if (appearance === "minimal" || appearance === "borderless") return "bg-transparent"
  return "bg-background"
}

export function scheduleViewHeaderClassName(appearance: LemmaScheduleViewAppearance) {
  if (appearance === "borderless") return "bg-transparent"
  if (appearance === "minimal") return "border-b border-border/15 bg-transparent"
  if (appearance === "contained") return "border-b border-border/60 bg-card"
  return "border-b border-border/40 bg-card/95"
}

export function scheduleViewToolbarClassName(density: LemmaScheduleViewDensity) {
  if (density === "compact") return "gap-2 px-3 py-2"
  if (density === "spacious") return "gap-4 px-5 py-4"
  return "gap-3 px-4 py-3"
}

export function scheduleViewContentClassName(density: LemmaScheduleViewDensity) {
  if (density === "compact") return "p-2"
  if (density === "spacious") return "p-5"
  return "p-4"
}

export function scheduleViewPixelsPerSlot(density: LemmaScheduleViewDensity) {
  if (density === "compact") return 24
  if (density === "spacious") return 48
  return 36
}

export function scheduleViewTimeLabelClassName(density: LemmaScheduleViewDensity) {
  if (density === "compact") return "text-[10px] py-0.5"
  if (density === "spacious") return "text-xs py-1.5"
  return "text-[11px] py-1"
}

export function scheduleViewGridBorderClassName(appearance: LemmaScheduleViewAppearance) {
  if (appearance === "borderless" || appearance === "minimal") return "border-border/10"
  return "border-border/30"
}

export function scheduleViewEventTextClassName(density: LemmaScheduleViewDensity) {
  if (density === "compact") return "text-[9px]"
  if (density === "spacious") return "text-xs"
  return "text-[10px]"
}
