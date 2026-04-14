import { useMemo, useState } from "react";
import type { AssistantRadiusScale } from "@/components/lemma/assistant/index.ts";
import { AssistantEmbedded } from "@/components/lemma/assistant/index.ts";
import { getClient, getShowcaseConfig } from "@/lib/client";
import {
  buildAssistantThemeConfig,
  buildAssistantThemeCSS,
  type ThemeConfig,
  type ThemeMode,
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

const RADIUS_OPTIONS: { value: AssistantRadiusScale; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

const EMBEDDED_CODE_SNIPPET = `<AssistantEmbedded
  theme="light"
  client={client}
  podId="pod_..."
  assistantName="my-assistant"
  title="My Assistant"
  placeholder="Ask anything…"
  radius="md"
/>`;

interface AssistantEmbeddedPageProps {
  podId: string | null;
}

export function AssistantEmbeddedPage({ podId }: AssistantEmbeddedPageProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => buildAssistantThemeConfig("light"));
  const [enabled, setEnabled] = useState(true);
  const [title, setTitle] = useState("Lemma Assistant Preview");
  const [subtitle, setSubtitle] = useState("Self-contained assistant wrapper.");
  const [placeholder, setPlaceholder] = useState("Message Lemma Assistant");
  const [radius, setRadius] = useState<AssistantRadiusScale>("sm");
  const [showConversationList, setShowConversationList] = useState(true);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showNewConversationButton, setShowNewConversationButton] = useState(true);

  const config = getShowcaseConfig();
  const assistantName = config.assistantName || undefined;
  const organizationId = config.organizationId || undefined;
  const hasConfig = !!podId && !!assistantName;

  const themeCss = useMemo(() => buildAssistantThemeCSS(themeConfig), [themeConfig]);

  return (
    <div className="grid gap-6 p-6 max-w-[960px] mx-auto">
      <style>{themeCss}</style>

      <Card>
        <CardHeader className="gap-2">
          <Badge variant="secondary" className="w-fit text-xs">Embedded</Badge>
          <CardTitle>AssistantEmbedded</CardTitle>
          <CardDescription>
            A self-contained assistant wrapper that manages its own controller, theme scope, and layout internally.
            Drop it into any page with just a client, pod ID, and assistant name — no manual composition required.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">Theme and Display</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Color scheme</Label>
            <div className="flex items-center gap-3">
              <Select
                value={themeMode}
                onValueChange={(value) => {
                  const mode = value as ThemeMode;
                  setThemeMode(mode);
                  setThemeConfig(buildAssistantThemeConfig(mode));
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setThemeConfig(buildAssistantThemeConfig(themeMode))}
              >
                Reset
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Enabled</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="grid gap-2">
            <Label>Radius</Label>
            <Select value={radius} onValueChange={(v) => setRadius(v as AssistantRadiusScale)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="embedded-title">Title</Label>
              <Input id="embedded-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="embedded-subtitle">Subtitle</Label>
              <Input id="embedded-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="embedded-placeholder">Placeholder</Label>
              <Input id="embedded-placeholder" value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label>showConversationList</Label>
            <Switch checked={showConversationList} onCheckedChange={setShowConversationList} />
          </div>
          <div className="flex items-center justify-between">
            <Label>showModelPicker</Label>
            <Switch checked={showModelPicker} onCheckedChange={setShowModelPicker} />
          </div>
          <div className="flex items-center justify-between">
            <Label>showNewConversationButton</Label>
            <Switch checked={showNewConversationButton} onCheckedChange={setShowNewConversationButton} />
          </div>
        </CardContent>
      </Card>

      {!hasConfig ? (
        <Card>
          <CardHeader>
            <CardTitle>Configuration Required</CardTitle>
            <CardDescription>
              Set both <code>VITE_LEMMA_POD_ID</code> and <code>VITE_LEMMA_ASSISTANT_NAME</code> in <code>.env</code> to enable the preview.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="h-[70vh] min-h-[640px]">
          <AssistantEmbedded
            theme={themeMode}
            client={getClient()}
            podId={podId!}
            assistantName={assistantName!}
            organizationId={organizationId}
            enabled={enabled}
            title={title}
            subtitle={subtitle}
            placeholder={placeholder}
            showConversationList={showConversationList}
            showModelPicker={showModelPicker}
            showNewConversationButton={showNewConversationButton}
            radius={radius}
          />
        </div>
      )}

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">Integration Code</CardTitle>
          <CardDescription>Minimal code to embed an assistant in your app.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg border bg-muted p-4 text-sm overflow-x-auto font-mono">
            {EMBEDDED_CODE_SNIPPET}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
