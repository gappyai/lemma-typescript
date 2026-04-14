import { useMemo, useState, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import {
  ThemeMode,
  ThemePreset,
  RadiusProfile,
  ChartPalette,
  FontScale,
  ThemeTokens,
  themePresets,
  radiusProfiles,
  chartPalettes,
  fontScales,
  COLOR_OVERRIDE_KEYS,
  buildChartPaletteColors,
  applyResourceTheme,
} from "@/lib/themes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface ThemeMixerPageProps {
  podId: string | null
}

export function ThemeMixerPage({ podId }: ThemeMixerPageProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light")
  const [themePreset, setThemePreset] = useState<ThemePreset>("slate")
  const [themeRadius, setThemeRadius] = useState<RadiusProfile>("rounded")
  const [chartPreset, setChartPreset] = useState<ChartPalette>("balanced")
  const [fontScale, setFontScale] = useState<FontScale>("default")
  const [highContrast, setHighContrast] = useState(false)
  const [colorOverrides, setColorOverrides] = useState<Partial<ThemeTokens>>({})

  const activeTheme = themePresets[themePreset][themeMode]
  const mergedTheme: ThemeTokens = { ...activeTheme, ...colorOverrides }

  const themeStyle = useMemo(
    () => ({
      ...applyResourceTheme(themePreset, themeRadius, themeMode === "dark", highContrast, chartPreset),
      ...Object.fromEntries(
        Object.entries(colorOverrides).filter(([, v]) => v != null).map(([k, v]) => {
          const override = COLOR_OVERRIDE_KEYS.find((o) => o.key === k)
          return override ? [override.cssVar, v] : []
        })
      ),
      "--font-scale": fontScales[fontScale].value,
    } as CSSProperties),
    [themePreset, themeRadius, themeMode, highContrast, chartPreset, colorOverrides, fontScale],
  )

  const chartPalette = useMemo(
    () => buildChartPaletteColors(mergedTheme, chartPreset),
    [mergedTheme, chartPreset],
  )

  const handleColorChange = (key: keyof ThemeTokens, value: string) => {
    setColorOverrides((prev) => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setColorOverrides({})
  }

  return (
    <div
      className={cn(themeMode === "dark" && "dark")}
      style={themeStyle}
    >
      <div className="grid h-full gap-6 p-6 lg:grid-cols-[3fr_2fr]">
        <div className="min-w-0 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Theme Mixer</h1>
            <p className="text-sm text-muted-foreground">Live preview of shadcn components with your custom theme applied.</p>
          </div>

          <div
            className="space-y-6 rounded-[var(--radius-xl)] border border-border bg-background p-6"
            style={{ fontSize: `calc(1rem * var(--font-scale, 1))` } as CSSProperties}
          >
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Buttons</h2>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Primary sm</Button>
                  <Button size="sm" variant="secondary">Secondary sm</Button>
                  <Button size="sm" variant="outline">Outline sm</Button>
                  <Button size="sm" variant="destructive">Destructive sm</Button>
                  <Button size="sm" variant="ghost">Ghost sm</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="lg">Primary lg</Button>
                  <Button size="lg" variant="secondary">Secondary lg</Button>
                  <Button size="lg" variant="outline">Outline lg</Button>
                  <Button size="lg" variant="destructive">Destructive lg</Button>
                  <Button size="lg" variant="ghost">Ghost lg</Button>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Badges</h2>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Card</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Sample Card</CardTitle>
                  <CardDescription>This card reflects your current theme tokens in real time.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Card content area with foreground and muted text colors driven by CSS variables.</p>
                </CardContent>
              </Card>
            </section>

            <Separator />

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Inputs</h2>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="mixer-input">Label</Label>
                    <Input id="mixer-input" placeholder="Type something..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mixer-textarea">Textarea</Label>
                    <Textarea id="mixer-textarea" placeholder="Write here..." rows={3} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Controls</h2>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Select</Label>
                    <Select defaultValue="a">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a">Option A</SelectItem>
                        <SelectItem value="b">Option B</SelectItem>
                        <SelectItem value="c">Option C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="mixer-switch" />
                    <Label htmlFor="mixer-switch">Toggle setting</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="mixer-checkbox" />
                    <Label htmlFor="mixer-checkbox">Accept terms</Label>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Chart Palette</h2>
              <div className="grid grid-cols-5 gap-2">
                {chartPalette.map((swatch, i) => (
                  <div
                    key={`${swatch}-${i}`}
                    className="h-10 rounded-[var(--radius-md)] border border-border/60"
                    style={{ background: swatch }}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Base Theme</CardTitle>
              <CardDescription>Choose a preset, toggle dark mode, or enable high contrast.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Base tone</Label>
                <Select value={themePreset} onValueChange={(v) => setThemePreset(v as ThemePreset)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(themePresets) as Array<[ThemePreset, typeof themePresets[ThemePreset]]>).map(([value, preset]) => (
                      <SelectItem key={value} value={value}>{preset.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-muted/50 px-3 py-2.5">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-foreground">Dark mode</div>
                </div>
                <Switch
                  checked={themeMode === "dark"}
                  onCheckedChange={(checked) => setThemeMode(checked ? "dark" : "light")}
                />
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-muted/50 px-3 py-2.5">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-foreground">High contrast</div>
                </div>
                <Switch
                  checked={highContrast}
                  onCheckedChange={(checked) => setHighContrast(checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography & Spacing</CardTitle>
              <CardDescription>Adjust corner profiles, chart palettes, and font scale.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Corner profile</Label>
                <Select value={themeRadius} onValueChange={(v) => setThemeRadius(v as RadiusProfile)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(radiusProfiles) as Array<[RadiusProfile, typeof radiusProfiles[RadiusProfile]]>).map(([value, opt]) => (
                      <SelectItem key={value} value={value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Chart palette</Label>
                <Select value={chartPreset} onValueChange={(v) => setChartPreset(v as ChartPalette)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(chartPalettes) as Array<[ChartPalette, typeof chartPalettes[ChartPalette]]>).map(([value, opt]) => (
                      <SelectItem key={value} value={value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Font scale</Label>
                <Select value={fontScale} onValueChange={(v) => setFontScale(v as FontScale)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(fontScales) as Array<[FontScale, typeof fontScales[FontScale]]>).map(([value, opt]) => (
                      <SelectItem key={value} value={value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Color Overrides</CardTitle>
              <CardDescription>Override individual tokens. Reset returns to the preset defaults.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {COLOR_OVERRIDE_KEYS.map(({ key, label }) => {
                const current = colorOverrides[key] ?? mergedTheme[key]
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 shrink-0 rounded-[var(--radius-sm)] border border-border"
                      style={{ background: current }}
                    >
                      <input
                        type="color"
                        value={current.startsWith("#") ? current : "#000000"}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="h-full w-full cursor-pointer opacity-0"
                      />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="text-sm font-medium text-foreground">{label}</div>
                      <div className="text-xs text-muted-foreground">{current}</div>
                    </div>
                  </div>
                )
              })}
              <Button variant="outline" className="w-full" onClick={handleReset}>
                Reset to Preset
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
