import { useMemo, useState, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import {
  ThemeMode,
  ThemePreset,
  RadiusProfile,
  ThemeTokens,
  themePresets,
  radiusProfiles,
  applyResourceTheme,
} from "@/lib/themes"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface ColorTokenEntry {
  key: keyof ThemeTokens
  label: string
  cssVar: string
  category: string
}

const COLOR_TOKENS: ColorTokenEntry[] = [
  { key: "canvas", label: "Background", cssVar: "--background", category: "colors" },
  { key: "text", label: "Foreground", cssVar: "--foreground", category: "colors" },
  { key: "surface", label: "Card", cssVar: "--card", category: "colors" },
  { key: "text", label: "Card Foreground", cssVar: "--card-foreground", category: "colors" },
  { key: "surface", label: "Popover", cssVar: "--popover", category: "colors" },
  { key: "text", label: "Popover Foreground", cssVar: "--popover-foreground", category: "colors" },
  { key: "accent", label: "Primary", cssVar: "--primary", category: "colors" },
  { key: "accentForeground", label: "Primary Foreground", cssVar: "--primary-foreground", category: "colors" },
  { key: "surfaceAlt", label: "Secondary", cssVar: "--secondary", category: "colors" },
  { key: "muted", label: "Muted Foreground", cssVar: "--muted-foreground", category: "colors" },
  { key: "accentSoft", label: "Accent", cssVar: "--accent", category: "colors" },
  { key: "danger", label: "Destructive", cssVar: "--destructive", category: "colors" },
  { key: "border", label: "Border", cssVar: "--border", category: "colors" },
  { key: "input", label: "Input", cssVar: "--input", category: "colors" },
  { key: "ring", label: "Ring", cssVar: "--ring", category: "colors" },
]

const COLOR_GROUP_ORDER = [
  "Background",
  "Foreground",
  "Card",
  "Card Foreground",
  "Popover",
  "Popover Foreground",
  "Primary",
  "Primary Foreground",
  "Secondary",
  "Muted Foreground",
  "Accent",
  "Destructive",
  "Border",
  "Input",
  "Ring",
]

interface RadiusTokenEntry {
  key: string
  label: string
  cssVar: string
  profileKey: "sm" | "md" | "lg"
}

const RADIUS_TOKENS: RadiusTokenEntry[] = [
  { key: "sm", label: "Small", cssVar: "--resource-radius-sm", profileKey: "sm" },
  { key: "md", label: "Medium", cssVar: "--radius", profileKey: "md" },
  { key: "lg", label: "Large", cssVar: "--resource-radius-lg", profileKey: "lg" },
]

const TYPOGRAPHY_SAMPLES = [
  { label: "font-sans", css: "font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif)" },
  { label: "font-mono", css: "font-family: var(--font-mono, ui-monospace, monospace)" },
]

interface StyleTokensPageProps {
  podId: string | null
}

export function StyleTokensPage({ podId }: StyleTokensPageProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light")
  const [themePreset, setThemePreset] = useState<ThemePreset>("slate")
  const [themeRadius, setThemeRadius] = useState<RadiusProfile>("rounded")

  const activeTheme = themePresets[themePreset][themeMode]

  const themeStyle = useMemo(
    () => applyResourceTheme(themePreset, themeRadius, themeMode === "dark", false, "balanced"),
    [themePreset, themeRadius, themeMode],
  )

  const resolvedColors = useMemo(() => {
    return COLOR_TOKENS.map((token) => ({
      ...token,
      resolvedValue: activeTheme[token.key],
    }))
  }, [activeTheme])

  const radiusValues = useMemo(() => {
    const profile = radiusProfiles[themeRadius]
    return RADIUS_TOKENS.map((t) => ({
      ...t,
      value: profile[t.profileKey],
    }))
  }, [themeRadius])

  return (
    <div
      className={cn(themeMode === "dark" && "dark")}
      style={themeStyle}
    >
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Style Tokens</h1>
            <p className="text-sm text-muted-foreground">Visual CSS variable explorer for shadcn design tokens.</p>
          </div>
          <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-2">
              <Switch
                checked={themeMode === "dark"}
                onCheckedChange={(checked) => setThemeMode(checked ? "dark" : "light")}
              />
              <Label className="text-sm">{themeMode === "dark" ? "Dark" : "Light"}</Label>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle>Token Categories</CardTitle>
                <CardDescription>Browse design token groups.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {[
                  { id: "colors", label: "Colors", count: COLOR_TOKENS.length },
                  { id: "spacing", label: "Spacing & Radius", count: RADIUS_TOKENS.length },
                  { id: "typography", label: "Typography", count: TYPOGRAPHY_SAMPLES.length },
                ].map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 transition-colors hover:bg-muted"
                  >
                    <span className="text-sm font-medium text-foreground">{cat.label}</span>
                    <Badge variant="secondary">{cat.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Radius Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(Object.entries(radiusProfiles) as Array<[RadiusProfile, typeof radiusProfiles[RadiusProfile]]>).map(([value, opt]) => (
                  <button
                    key={value}
                    className={cn(
                      "w-full rounded-[var(--radius-md)] border px-3 py-2 text-left transition-colors",
                      themeRadius === value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted",
                    )}
                    onClick={() => setThemeRadius(value)}
                    type="button"
                  >
                    <div className="text-sm font-medium text-foreground">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.description}</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Colors</CardTitle>
                <CardDescription>Color tokens with swatches and computed values.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {resolvedColors.map((token, i) => (
                    <div
                      key={`${token.label}-${i}`}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border p-3"
                    >
                      <div
                        className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] border border-border/60"
                        style={{ background: token.resolvedValue }}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-sm font-medium text-foreground">{token.label}</div>
                        <Badge variant="outline" className="text-[10px] font-mono">{token.cssVar}</Badge>
                        <div className="text-xs text-muted-foreground truncate">{token.resolvedValue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spacing & Radius</CardTitle>
                <CardDescription>Border-radius values for the current corner profile.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  {radiusValues.map((token) => (
                    <div
                      key={token.key}
                      className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-border p-4"
                    >
                      <div
                        className="h-16 w-16 border-2 border-primary bg-primary/10"
                        style={{ borderRadius: token.value } as CSSProperties}
                      />
                      <div className="text-sm font-medium text-foreground">{token.label}</div>
                      <Badge variant="outline" className="font-mono text-[10px]">{token.cssVar}</Badge>
                      <div className="text-xs text-muted-foreground">{token.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Font family and size samples.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {TYPOGRAPHY_SAMPLES.map((sample) => (
                    <div
                      key={sample.label}
                      className="space-y-2 rounded-[var(--radius-md)] border border-border p-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{sample.label}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">{sample.label}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p style={{ cssText: sample.css } as CSSProperties} className="text-2xl font-semibold text-foreground">
                          Aa Bb Cc
                        </p>
                        <p style={{ cssText: sample.css } as CSSProperties} className="text-sm text-muted-foreground">
                          The quick brown fox jumps over the lazy dog.
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="space-y-2 rounded-[var(--radius-md)] border border-border p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">Size Scale</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">text-xs — 0.75rem</p>
                      <p className="text-sm text-muted-foreground">text-sm — 0.875rem</p>
                      <p className="text-base text-foreground">text-base — 1rem</p>
                      <p className="text-lg font-medium text-foreground">text-lg — 1.125rem</p>
                      <p className="text-xl font-semibold text-foreground">text-xl — 1.25rem</p>
                      <p className="text-2xl font-bold text-foreground">text-2xl — 1.5rem</p>
                    </div>
                  </div>
                  <div className="space-y-2 rounded-[var(--radius-md)] border border-border p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">Weight Scale</span>
                    </div>
                    <div className="space-y-2">
                      <p className="font-light text-foreground">font-light — 300</p>
                      <p className="font-normal text-foreground">font-normal — 400</p>
                      <p className="font-medium text-foreground">font-medium — 500</p>
                      <p className="font-semibold text-foreground">font-semibold — 600</p>
                      <p className="font-bold text-foreground">font-bold — 700</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
