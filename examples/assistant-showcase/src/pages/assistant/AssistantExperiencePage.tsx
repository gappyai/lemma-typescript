import { useMemo, useState } from "react";
import type { AssistantRadiusScale } from "@/components/lemma/assistant/index.ts";
import {
  AssistantExperienceView,
  AssistantThemeScope,
} from "@/components/lemma/assistant/index.ts";
import { useAssistantController } from "lemma-sdk/react";
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
import { PreviewConfig, defaultPreviewConfig } from "@/lib/showcase-config";

const RADIUS_OPTIONS: { value: AssistantRadiusScale; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

interface AssistantExperiencePageProps {
  podId: string | null;
}

export function AssistantExperiencePage({ podId }: AssistantExperiencePageProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => buildAssistantThemeConfig("light"));
  const [previewConfig, setPreviewConfig] = useState<PreviewConfig>(() => defaultPreviewConfig());

  const config = getShowcaseConfig();
  const assistantName = config.assistantName || undefined;
  const organizationId = config.organizationId || undefined;

  const controller = useAssistantController({
    client: getClient(),
    podId: podId || undefined,
    assistantName,
    organizationId,
    enabled: !!podId && !!assistantName && previewConfig.enabled,
  });

  const themeCss = useMemo(() => buildAssistantThemeCSS(themeConfig), [themeConfig]);

  const emptyState = previewConfig.useCustomEmptyState
    ? (
      <div>
        <p>Custom empty state from the showcase app.</p>
        <p>This is passed through the exported assistant component props.</p>
      </div>
    )
    : undefined;

  const renderConversationLabel = previewConfig.useCustomConversationLabel
    ? ({ conversation, isActive }: { conversation: { id: string; title?: string | null }; isActive: boolean }) => (
      <span>{isActive ? "[active] " : ""}{conversation.title || conversation.id}</span>
    )
    : undefined;

  const renderMessageContent = previewConfig.useCustomMessageRenderer
    ? ({ message }: { message: { content: string } }) => (
      <pre className="whitespace-pre-wrap m-0">{message.content || "(no text content)"}</pre>
    )
    : undefined;

  const renderPresentedFile = previewConfig.useCustomPresentedFileRenderer
    ? ({ filepath }: { filepath: string }) => (
      <div>
        <strong>Presented file</strong>
        <div>{filepath}</div>
      </div>
    )
    : undefined;

  const renderToolInvocation = previewConfig.useCustomToolRenderer
    ? ({ invocation }: { invocation: { toolName: string; state: string; args: Record<string, unknown>; result?: Record<string, unknown> } }) => (
      <details>
        <summary>{invocation.toolName} [{invocation.state}]</summary>
        <pre className="whitespace-pre-wrap">{JSON.stringify({ args: invocation.args, result: invocation.result }, null, 2)}</pre>
      </details>
    )
    : undefined;

  const controlledDraftProps = previewConfig.controlDraft
    ? {
        draft: previewConfig.draft,
        onDraftChange: (value: string) => setPreviewConfig((current) => ({ ...current, draft: value })),
      }
    : {};

  const hasConfig = !!podId && !!assistantName;

  return (
    <div className="flex gap-6 p-6">
      <style>{themeCss}</style>

      <div className="flex-1 min-w-0 basis-[70%]">
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
          <AssistantThemeScope theme={themeMode}>
            <div className="h-[70vh] min-h-[640px]">
              <AssistantExperienceView
                controller={controller}
                title={previewConfig.title}
                subtitle={previewConfig.subtitle}
                placeholder={previewConfig.placeholder}
                emptyState={emptyState}
                showConversationList={previewConfig.showConversationList}
                showModelPicker={previewConfig.showModelPicker}
                showNewConversationButton={previewConfig.showNewConversationButton}
                radius={previewConfig.radius}
                renderConversationLabel={renderConversationLabel}
                renderMessageContent={renderMessageContent}
                renderPresentedFile={renderPresentedFile}
                renderToolInvocation={renderToolInvocation}
                {...controlledDraftProps}
              />
            </div>
          </AssistantThemeScope>
        )}
      </div>

      <aside className="w-[320px] shrink-0">
        <div className="grid gap-4 sticky top-24">
          <Card>
            <CardHeader className="gap-2">
              <Badge variant="secondary" className="w-fit text-xs">Preview</Badge>
              <CardTitle className="text-base">Preview Settings</CardTitle>
              <CardDescription>Control the props and renderers exposed by AssistantExperienceView.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="preview-enabled">Enabled</Label>
                <Switch
                  id="preview-enabled"
                  checked={previewConfig.enabled}
                  onCheckedChange={(checked) => setPreviewConfig((c) => ({ ...c, enabled: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="preview-conversation-list">showConversationList</Label>
                <Switch
                  id="preview-conversation-list"
                  checked={previewConfig.showConversationList}
                  onCheckedChange={(checked) => setPreviewConfig((c) => ({ ...c, showConversationList: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="preview-model-picker">showModelPicker</Label>
                <Switch
                  id="preview-model-picker"
                  checked={previewConfig.showModelPicker}
                  onCheckedChange={(checked) => setPreviewConfig((c) => ({ ...c, showModelPicker: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="preview-new-conversation">showNewConversationButton</Label>
                <Switch
                  id="preview-new-conversation"
                  checked={previewConfig.showNewConversationButton}
                  onCheckedChange={(checked) => setPreviewConfig((c) => ({ ...c, showNewConversationButton: checked }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preview-radius">Radius</Label>
                <Select
                  value={previewConfig.radius}
                  onValueChange={(value) => setPreviewConfig((c) => ({ ...c, radius: value as AssistantRadiusScale }))}
                >
                  <SelectTrigger id="preview-radius">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RADIUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">Content</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="preview-title">Title</Label>
                <Input
                  id="preview-title"
                  value={previewConfig.title}
                  onChange={(e) => setPreviewConfig((c) => ({ ...c, title: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preview-subtitle">Subtitle</Label>
                <Input
                  id="preview-subtitle"
                  value={previewConfig.subtitle}
                  onChange={(e) => setPreviewConfig((c) => ({ ...c, subtitle: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preview-placeholder">Placeholder</Label>
                <Input
                  id="preview-placeholder"
                  value={previewConfig.placeholder}
                  onChange={(e) => setPreviewConfig((c) => ({ ...c, placeholder: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">Custom Renderers</CardTitle>
              <CardDescription>Toggle custom renderer overrides for the assistant view.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-empty-state">emptyState</Label>
                <Switch
                  id="custom-empty-state"
                  checked={previewConfig.useCustomEmptyState}
                  onCheckedChange={(checked) => setPreviewConfig((c) => ({ ...c, useCustomEmptyState: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-conversation-label">renderConversationLabel</Label>
                <Switch
                  id="custom-conversation-label"
                  checked={previewConfig.useCustomConversationLabel}
                  onCheckedChange={(checked) => setPreviewConfig((c) => ({ ...c, useCustomConversationLabel: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-message-renderer">renderMessageContent</Label>
                <Switch
                  id="custom-message-renderer"
                  checked={previewConfig.useCustomMessageRenderer}
                  onCheckedChange={(checked) => setPreviewConfig((c) => ({ ...c, useCustomMessageRenderer: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-presented-file">renderPresentedFile</Label>
                <Switch
                  id="custom-presented-file"
                  checked={previewConfig.useCustomPresentedFileRenderer}
                  onCheckedChange={(checked) => setPreviewConfig((c) => ({ ...c, useCustomPresentedFileRenderer: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-tool-renderer">renderToolInvocation</Label>
                <Switch
                  id="custom-tool-renderer"
                  checked={previewConfig.useCustomToolRenderer}
                  onCheckedChange={(checked) => setPreviewConfig((c) => ({ ...c, useCustomToolRenderer: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">Theme</CardTitle>
              <CardDescription>Override the CSS variables used by AssistantThemeScope.</CardDescription>
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
              <Separator />
              <div className="grid gap-3">
                {(Object.entries(themeConfig) as Array<[keyof ThemeConfig, string]>).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[1fr_40px] items-center gap-2">
                    <Label className="font-mono text-xs">--{key.replace(/([A-Z])/g, "-$1").toLowerCase()}</Label>
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => setThemeConfig((c) => ({ ...c, [key]: e.target.value }))}
                      className="h-8 w-8 cursor-pointer rounded border border-border p-0.5"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </aside>
    </div>
  );
}
