import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AvailableModels, type ConversationModel } from "lemma-sdk";
import {
  useAssistantController,
} from "lemma-sdk/react";
import {
  AssistantComposer,
  AssistantConversationList,
  AssistantHeader,
  AssistantMessageViewport,
  AssistantModelPicker,
  AssistantPendingFileChip,
  AssistantRadiusScale,
  AssistantShellLayout,
  AssistantStatusPill,
  AssistantThemeScope,
  MessageGroup,
  PlanSummaryStrip,
  ThinkingIndicator,
  buildDisplayMessageRows,
  getActiveToolBanner,
  latestPlanSummary,
} from "@/components/lemma/assistant/index.ts";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PreviewConfig, defaultPreviewConfig } from "@/lib/showcase-config";

const RADIUS_OPTIONS: { value: AssistantRadiusScale; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

const CHROME_PRIMITIVES = [
  "AssistantShellLayout",
  "AssistantHeader",
  "AssistantConversationList",
  "AssistantMessageViewport",
  "AssistantComposer",
  "AssistantStatusPill",
  "AssistantModelPicker",
  "AssistantPendingFileChip",
  "MessageGroup",
  "ThinkingIndicator",
  "PlanSummaryStrip",
];

function getPendingFileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

interface AssistantChromePageProps {
  podId: string | null;
}

export function AssistantChromePage({ podId }: AssistantChromePageProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => buildAssistantThemeConfig("light"));
  const [previewConfig, setPreviewConfig] = useState<PreviewConfig>(() => defaultPreviewConfig());
  const [draft, setDraft] = useState("");
  const [planHidden, setPlanHidden] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = getShowcaseConfig();
  const assistantName = config.assistantName || undefined;
  const organizationId = config.organizationId || undefined;
  const hasConfig = !!podId && !!assistantName;

  const controller = useAssistantController({
    client: getClient(),
    podId: podId || undefined,
    assistantName,
    organizationId,
    enabled: hasConfig && previewConfig.enabled,
  });

  const rows = useMemo(() => buildDisplayMessageRows(controller.messages), [controller.messages]);
  const plan = useMemo(() => latestPlanSummary(controller.messages), [controller.messages]);
  const activeToolBanner = useMemo(() => getActiveToolBanner(controller.messages), [controller.messages]);
  const availableModels = useMemo(
    () => {
      const dynamicModels = controller.availableModels
        .map((model) => model.id as ConversationModel)
        .filter((model) => model.trim().length > 0);
      return dynamicModels.length > 0
        ? dynamicModels
        : (Object.values(AvailableModels) as ConversationModel[]);
    },
    [controller.availableModels],
  );
  const availableModelLabels = useMemo(
    () => new Map(controller.availableModels.map((model) => [model.id, model.name])),
    [controller.availableModels],
  );

  const emptyState = previewConfig.useCustomEmptyState
    ? (
      <div>
        <p>Custom empty state from the showcase app.</p>
        <p>This helps test the <code>emptyState</code> prop without changing the SDK.</p>
      </div>
    )
    : null;

  const renderConversationLabel = previewConfig.useCustomConversationLabel
    ? ({ conversation, isActive }: { conversation: { id: string; title?: string | null }; isActive: boolean }) => (
      <span>{isActive ? "[active] " : ""}{conversation.title || conversation.id}</span>
    )
    : undefined;

  const renderMessageContent = previewConfig.useCustomMessageRenderer
    ? ({ message }: { message: { content: string } }) => (
      <pre className="whitespace-pre-wrap m-0">{message.content || "(no text content)"}</pre>
    )
    : ({ message }: { message: { content: string } }) => <div className="whitespace-pre-wrap">{message.content}</div>;

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

  const status = controller.error
    ? <AssistantStatusPill label={typeof controller.error === 'object' && controller.error !== null ? (controller.error as Error).message : controller.error} />
    : activeToolBanner
      ? (
        <AssistantStatusPill
          label={activeToolBanner.activeCount > 1
            ? `${activeToolBanner.summary} (${activeToolBanner.activeCount} active)`
            : activeToolBanner.summary}
        />
      )
      : controller.isUploadingFiles
        ? <AssistantStatusPill label="Uploading files…" subtle />
        : null;

  const themeCss = useMemo(() => buildAssistantThemeCSS(themeConfig), [themeConfig]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || controller.isLoading || controller.isActiveConversationRunning) return;
    setDraft("");
    await controller.sendMessage(message);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    await controller.uploadFiles(files, { deferUntilSend: true });
    event.target.value = "";
  }

  return (
    <div className="grid gap-6 p-6 xl:grid-cols-[1fr_320px]">
      <style>{themeCss}</style>

      <div className="min-w-0">
        <div className="grid gap-4 mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Chrome Primitives — Build Your Own Assistant UI</h2>
          <p className="text-sm text-muted-foreground max-w-[72ch]">
            Compose the assistant from low-level primitives: shell layout, header, conversation list, message viewport, composer, and status pill.
            This gives you full control over layout and rendering.
          </p>
        </div>

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
              <AssistantShellLayout
                sidebarVisible={previewConfig.showConversationList}
                sidebar={previewConfig.showConversationList ? (
                  <AssistantConversationList
                    conversations={controller.conversations}
                    activeConversationId={controller.activeConversationId}
                    onSelectConversation={(conversationId) => controller.selectConversation(conversationId)}
                    onNewConversation={() => controller.selectConversation(null)}
                    renderConversationLabel={renderConversationLabel}
                  />
                ) : undefined}
                main={(
                  <div className="flex flex-col gap-3 h-full min-h-0">
                    <AssistantHeader
                      title={previewConfig.title}
                      subtitle={previewConfig.subtitle}
                      controls={(
                        <>
                          <AssistantModelPicker
                            value={controller.conversationModel}
                            options={availableModels}
                            getOptionLabel={(model) => availableModelLabels.get(model) ?? model}
                            onChange={(model) => void controller.setConversationModel(model)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => controller.selectConversation(null)}
                          >
                            New conversation
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => controller.stop()}
                            disabled={!controller.isActiveConversationRunning}
                          >
                            Stop
                          </Button>
                        </>
                      )}
                    />

                    <div className="flex flex-col gap-3 flex-1 min-h-0">
                      {!planHidden && plan ? (
                        <PlanSummaryStrip plan={plan} onHide={() => setPlanHidden(true)} />
                      ) : null}

                      <AssistantMessageViewport>
                        {rows.length === 0
                          ? (emptyState || <p>Send a message to start a conversation.</p>)
                          : null}
                        {rows.map((row, index) => (
                          <MessageGroup
                            key={row.id}
                            message={row.message}
                            conversationId={controller.activeConversationId}
                            onWidgetSendPrompt={(text) => controller.sendMessage(text)}
                            isStreaming={
                              controller.isActiveConversationRunning
                              && row.sourceIndexes.includes(controller.messages.length - 1)
                            }
                            showAssistantHeader={index === 0 || rows[index - 1]?.message.role !== "assistant"}
                            renderMessageContent={renderMessageContent}
                            renderPresentedFile={renderPresentedFile}
                            renderToolInvocation={renderToolInvocation}
                          />
                        ))}
                        {controller.isActiveConversationRunning ? <ThinkingIndicator /> : null}
                      </AssistantMessageViewport>

                      <AssistantComposer
                        status={status}
                        pendingFiles={controller.pendingFiles.map((file) => (
                          <AssistantPendingFileChip
                            key={getPendingFileKey(file)}
                            label={file.name}
                            onRemove={() => controller.removePendingFile(getPendingFileKey(file))}
                          />
                        ))}
                      >
                        <form onSubmit={handleSubmit}>
                          <Label htmlFor="chrome-composer" className="sr-only">Message</Label>
                          <Textarea
                            id="chrome-composer"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            rows={4}
                            placeholder={previewConfig.placeholder}
                            className="resize-y"
                          />
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={controller.isUploadingFiles}
                            >
                              Attach files
                            </Button>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={controller.isLoading || controller.isActiveConversationRunning || draft.trim().length === 0}
                            >
                              Send
                            </Button>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            hidden
                            onChange={handleFileChange}
                          />
                        </form>
                      </AssistantComposer>
                    </div>
                  </div>
                )}
              />
            </div>
          </AssistantThemeScope>
        )}
      </div>

      <aside className="min-w-0">
        <div className="grid gap-4 xl:sticky xl:top-24">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">Primitives in Use</CardTitle>
              <CardDescription>Components composed to build this assistant UI.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {CHROME_PRIMITIVES.map((name) => (
                <Badge key={name} variant="secondary">{name}</Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">Preview Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label>Enabled</Label>
                <Switch
                  checked={previewConfig.enabled}
                  onCheckedChange={(checked) => setPreviewConfig((c) => ({ ...c, enabled: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>showConversationList</Label>
                <Switch
                  checked={previewConfig.showConversationList}
                  onCheckedChange={(checked) => setPreviewConfig((c) => ({ ...c, showConversationList: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>showModelPicker</Label>
                <Switch
                  checked={previewConfig.showModelPicker}
                  onCheckedChange={(checked) => setPreviewConfig((c) => ({ ...c, showModelPicker: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>showNewConversationButton</Label>
                <Switch
                  checked={previewConfig.showNewConversationButton}
                  onCheckedChange={(checked) => setPreviewConfig((c) => ({ ...c, showNewConversationButton: checked }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Radius</Label>
                <Select
                  value={previewConfig.radius}
                  onValueChange={(value) => setPreviewConfig((c) => ({ ...c, radius: value as AssistantRadiusScale }))}
                >
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
              <div className="grid gap-2">
                <Label htmlFor="chrome-title">Title</Label>
                <Input id="chrome-title" value={previewConfig.title} onChange={(e) => setPreviewConfig((c) => ({ ...c, title: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="chrome-subtitle">Subtitle</Label>
                <Input id="chrome-subtitle" value={previewConfig.subtitle} onChange={(e) => setPreviewConfig((c) => ({ ...c, subtitle: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="chrome-placeholder">Placeholder</Label>
                <Input id="chrome-placeholder" value={previewConfig.placeholder} onChange={(e) => setPreviewConfig((c) => ({ ...c, placeholder: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">Custom Renderers</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label>emptyState</Label>
                <Switch checked={previewConfig.useCustomEmptyState} onCheckedChange={(c) => setPreviewConfig((p) => ({ ...p, useCustomEmptyState: c }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>renderConversationLabel</Label>
                <Switch checked={previewConfig.useCustomConversationLabel} onCheckedChange={(c) => setPreviewConfig((p) => ({ ...p, useCustomConversationLabel: c }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>renderMessageContent</Label>
                <Switch checked={previewConfig.useCustomMessageRenderer} onCheckedChange={(c) => setPreviewConfig((p) => ({ ...p, useCustomMessageRenderer: c }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>renderPresentedFile</Label>
                <Switch checked={previewConfig.useCustomPresentedFileRenderer} onCheckedChange={(c) => setPreviewConfig((p) => ({ ...p, useCustomPresentedFileRenderer: c }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>renderToolInvocation</Label>
                <Switch checked={previewConfig.useCustomToolRenderer} onCheckedChange={(c) => setPreviewConfig((p) => ({ ...p, useCustomToolRenderer: c }))} />
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
