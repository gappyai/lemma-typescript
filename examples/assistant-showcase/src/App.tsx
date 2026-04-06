import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AvailableModels, type ConversationModel } from "lemma-sdk";
import type { AssistantRadiusScale } from "lemma-sdk/react";
import {
  AssistantComposer,
  AssistantConversationList,
  AssistantEmbedded,
  AssistantExperienceView,
  AssistantHeader,
  AssistantMessageViewport,
  AssistantModelPicker,
  AssistantPendingFileChip,
  AssistantShellLayout,
  AssistantStatusPill,
  AssistantThemeScope,
  AuthGuard,
  MessageGroup,
  PlanSummaryStrip,
  ThinkingIndicator,
  buildDisplayMessageRows,
  getActiveToolBanner,
  latestPlanSummary,
  useAssistantController,
} from "lemma-sdk/react";
import { getClient, getShowcaseConfig } from "./lib/client.ts";

type PreviewMode = "assistant" | "embedded" | "chrome";
type ThemeMode = "light" | "dark";

interface PreviewConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  placeholder: string;
  showConversationList: boolean;
  showModelPicker: boolean;
  showNewConversationButton: boolean;
  radius: AssistantRadiusScale;
  controlDraft: boolean;
  draft: string;
  useCustomEmptyState: boolean;
  useCustomConversationLabel: boolean;
  useCustomMessageRenderer: boolean;
  useCustomPresentedFileRenderer: boolean;
  useCustomToolRenderer: boolean;
}

interface ThemeConfig {
  bgCanvas: string;
  bgSurface: string;
  bgSubtle: string;
  borderDefault: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  brandPrimary: string;
  brandSecondary: string;
  brandAccent: string;
  brandGlow: string;
}

const SHOWCASE_CONFIG = getShowcaseConfig();

function isConfigured(value: string): boolean {
  return value.trim().length > 0;
}

function getPendingFileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function LoadingScreen() {
  return <p>Checking auth…</p>;
}

function buildThemeConfig(mode: ThemeMode): ThemeConfig {
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
    };
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
  };
}

function buildThemeCss(theme: ThemeConfig): string {
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
  `;
}

function buildPreviewConfig(): PreviewConfig {
  return {
    enabled: true,
    title: "Lemma Assistant Preview",
    subtitle: "Testing the exported assistant components.",
    placeholder: "Message Lemma Assistant",
    showConversationList: true,
    showModelPicker: true,
    showNewConversationButton: true,
    radius: "md",
    controlDraft: false,
    draft: "Help me understand what this assistant can do.",
    useCustomEmptyState: false,
    useCustomConversationLabel: false,
    useCustomMessageRenderer: false,
    useCustomPresentedFileRenderer: false,
    useCustomToolRenderer: false,
  };
}

function PreviewControls({
  config,
  onChange,
}: {
  config: PreviewConfig;
  onChange: (next: PreviewConfig) => void;
}) {
  return (
    <fieldset>
      <legend>Component props</legend>

      <p>
        These controls drive the props and renderer hooks exposed by the assistant components in
        {" "}
        <code>lemma-sdk/react</code>.
      </p>

      <label>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(event) => onChange({ ...config, enabled: event.target.checked })}
        />
        {" "}
        enabled
      </label>
      <br />

      <label>
        <input
          type="checkbox"
          checked={config.showConversationList}
          onChange={(event) => onChange({ ...config, showConversationList: event.target.checked })}
        />
        {" "}
        showConversationList
      </label>
      <br />

      <label>
        <input
          type="checkbox"
          checked={config.showModelPicker}
          onChange={(event) => onChange({ ...config, showModelPicker: event.target.checked })}
        />
        {" "}
        showModelPicker
      </label>
      <br />

      <label>
        <input
          type="checkbox"
          checked={config.showNewConversationButton}
          onChange={(event) => onChange({ ...config, showNewConversationButton: event.target.checked })}
        />
        {" "}
        showNewConversationButton
      </label>
      <br />

      <label htmlFor="component-radius">radius</label>
      <br />
      <select
        id="component-radius"
        value={config.radius}
        onChange={(event) => onChange({ ...config, radius: event.target.value as AssistantRadiusScale })}
      >
        <option value="none">none</option>
        <option value="sm">sm</option>
        <option value="md">md</option>
        <option value="lg">lg</option>
        <option value="xl">xl</option>
      </select>
      <br />
      <br />

      <label>
        <input
          type="checkbox"
          checked={config.controlDraft}
          onChange={(event) => onChange({ ...config, controlDraft: event.target.checked })}
        />
        {" "}
        control draft
      </label>
      <br />

      <label>
        <input
          type="checkbox"
          checked={config.useCustomEmptyState}
          onChange={(event) => onChange({ ...config, useCustomEmptyState: event.target.checked })}
        />
        {" "}
        custom emptyState
      </label>
      <br />

      <label>
        <input
          type="checkbox"
          checked={config.useCustomConversationLabel}
          onChange={(event) => onChange({ ...config, useCustomConversationLabel: event.target.checked })}
        />
        {" "}
        custom renderConversationLabel
      </label>
      <br />

      <label>
        <input
          type="checkbox"
          checked={config.useCustomMessageRenderer}
          onChange={(event) => onChange({ ...config, useCustomMessageRenderer: event.target.checked })}
        />
        {" "}
        custom renderMessageContent
      </label>
      <br />

      <label>
        <input
          type="checkbox"
          checked={config.useCustomPresentedFileRenderer}
          onChange={(event) => onChange({ ...config, useCustomPresentedFileRenderer: event.target.checked })}
        />
        {" "}
        custom renderPresentedFile
      </label>
      <br />

      <label>
        <input
          type="checkbox"
          checked={config.useCustomToolRenderer}
          onChange={(event) => onChange({ ...config, useCustomToolRenderer: event.target.checked })}
        />
        {" "}
        custom renderToolInvocation
      </label>
      <br />
      <br />

      <label htmlFor="component-title">title</label>
      <br />
      <input
        id="component-title"
        type="text"
        value={config.title}
        onChange={(event) => onChange({ ...config, title: event.target.value })}
        style={{ width: "100%", maxWidth: 720 }}
      />
      <br />
      <br />

      <label htmlFor="component-subtitle">subtitle</label>
      <br />
      <input
        id="component-subtitle"
        type="text"
        value={config.subtitle}
        onChange={(event) => onChange({ ...config, subtitle: event.target.value })}
        style={{ width: "100%", maxWidth: 720 }}
      />
      <br />
      <br />

      <label htmlFor="component-placeholder">placeholder</label>
      <br />
      <input
        id="component-placeholder"
        type="text"
        value={config.placeholder}
        onChange={(event) => onChange({ ...config, placeholder: event.target.value })}
        style={{ width: "100%", maxWidth: 720 }}
      />
      <br />
      <br />

      <label htmlFor="component-draft">controlled draft value</label>
      <br />
      <textarea
        id="component-draft"
        value={config.draft}
        onChange={(event) => onChange({ ...config, draft: event.target.value })}
        rows={3}
        style={{ width: "100%", maxWidth: 720, resize: "vertical" }}
      />
    </fieldset>
  );
}

function ThemeControls({
  themeMode,
  theme,
  onModeChange,
  onChange,
  onReset,
}: {
  themeMode: ThemeMode;
  theme: ThemeConfig;
  onModeChange: (mode: ThemeMode) => void;
  onChange: (next: ThemeConfig) => void;
  onReset: () => void;
}) {
  return (
    <fieldset>
      <legend>Theme</legend>

      <p>
        These controls override the SDK assistant CSS variables used by
        {" "}
        <code>AssistantThemeScope</code>.
      </p>

      <label htmlFor="theme-mode">color-scheme</label>
      <br />
      <select
        id="theme-mode"
        value={themeMode}
        onChange={(event) => onModeChange(event.target.value as ThemeMode)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <button type="button" onClick={onReset} style={{ marginLeft: 8 }}>
        Reset theme preset
      </button>

      <br />
      <br />

      <label htmlFor="theme-bg-canvas">--bg-canvas</label>
      <br />
      <input
        id="theme-bg-canvas"
        type="color"
        value={theme.bgCanvas}
        onChange={(event) => onChange({ ...theme, bgCanvas: event.target.value })}
      />
      <br />
      <br />

      <label htmlFor="theme-bg-surface">--bg-surface</label>
      <br />
      <input
        id="theme-bg-surface"
        type="color"
        value={theme.bgSurface}
        onChange={(event) => onChange({ ...theme, bgSurface: event.target.value })}
      />
      <br />
      <br />

      <label htmlFor="theme-bg-subtle">--bg-subtle</label>
      <br />
      <input
        id="theme-bg-subtle"
        type="color"
        value={theme.bgSubtle}
        onChange={(event) => onChange({ ...theme, bgSubtle: event.target.value })}
      />
      <br />
      <br />

      <label htmlFor="theme-border-default">--border-default</label>
      <br />
      <input
        id="theme-border-default"
        type="color"
        value={theme.borderDefault}
        onChange={(event) => onChange({ ...theme, borderDefault: event.target.value })}
      />
      <br />
      <br />

      <label htmlFor="theme-text-primary">--text-primary</label>
      <br />
      <input
        id="theme-text-primary"
        type="color"
        value={theme.textPrimary}
        onChange={(event) => onChange({ ...theme, textPrimary: event.target.value })}
      />
      <br />
      <br />

      <label htmlFor="theme-text-secondary">--text-secondary</label>
      <br />
      <input
        id="theme-text-secondary"
        type="color"
        value={theme.textSecondary}
        onChange={(event) => onChange({ ...theme, textSecondary: event.target.value })}
      />
      <br />
      <br />

      <label htmlFor="theme-text-tertiary">--text-tertiary</label>
      <br />
      <input
        id="theme-text-tertiary"
        type="color"
        value={theme.textTertiary}
        onChange={(event) => onChange({ ...theme, textTertiary: event.target.value })}
      />
      <br />
      <br />

      <label htmlFor="theme-brand-primary">--brand-primary</label>
      <br />
      <input
        id="theme-brand-primary"
        type="color"
        value={theme.brandPrimary}
        onChange={(event) => onChange({ ...theme, brandPrimary: event.target.value })}
      />
      <br />
      <br />

      <label htmlFor="theme-brand-secondary">--brand-secondary</label>
      <br />
      <input
        id="theme-brand-secondary"
        type="color"
        value={theme.brandSecondary}
        onChange={(event) => onChange({ ...theme, brandSecondary: event.target.value })}
      />
      <br />
      <br />

      <label htmlFor="theme-brand-accent">--brand-accent</label>
      <br />
      <input
        id="theme-brand-accent"
        type="color"
        value={theme.brandAccent}
        onChange={(event) => onChange({ ...theme, brandAccent: event.target.value })}
      />
      <br />
      <br />

      <label htmlFor="theme-brand-glow">--brand-glow</label>
      <br />
      <input
        id="theme-brand-glow"
        type="color"
        value={theme.brandGlow}
        onChange={(event) => onChange({ ...theme, brandGlow: event.target.value })}
      />
    </fieldset>
  );
}

function ShowcaseChrome({
  podId,
  assistantName,
  organizationId,
  config,
}: {
  podId: string;
  assistantName: string;
  organizationId?: string;
  config: PreviewConfig;
}) {
  const controller = useAssistantController({
    client: getClient(),
    podId,
    assistantName,
    organizationId: organizationId || undefined,
    enabled: config.enabled,
  });
  const [draft, setDraft] = useState("");
  const [planHidden, setPlanHidden] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const emptyState = config.useCustomEmptyState
    ? (
      <div>
        <p>Custom empty state from the showcase app.</p>
        <p>This helps test the <code>emptyState</code> prop without changing the SDK.</p>
      </div>
    )
    : null;
  const renderConversationLabel = config.useCustomConversationLabel
    ? ({ conversation, isActive }: { conversation: { id: string; title?: string | null }; isActive: boolean }) => (
      <span>{isActive ? "[active] " : ""}{conversation.title || conversation.id}</span>
    )
    : undefined;
  const renderMessageContent = config.useCustomMessageRenderer
    ? ({ message }: { message: { content: string } }) => (
      <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{message.content || "(no text content)"}</pre>
    )
    : ({ message }: { message: { content: string } }) => <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>;
  const renderPresentedFile = config.useCustomPresentedFileRenderer
    ? ({ filepath }: { filepath: string }) => (
      <div>
        <strong>Presented file</strong>
        <div>{filepath}</div>
      </div>
    )
    : undefined;
  const renderToolInvocation = config.useCustomToolRenderer
    ? ({ invocation }: { invocation: { toolName: string; state: string; args: Record<string, unknown>; result?: Record<string, unknown> } }) => (
      <details>
        <summary>{invocation.toolName} [{invocation.state}]</summary>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify({
          args: invocation.args,
          result: invocation.result,
        }, null, 2)}</pre>
      </details>
    )
    : undefined;

  const status = controller.error
    ? <AssistantStatusPill label={controller.error} />
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || controller.isLoading || controller.isActiveConversationRunning) {
      return;
    }

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
    <AssistantThemeScope theme={themeMode}>
      <div style={{ height: "70vh", minHeight: 640 }}>
        <AssistantShellLayout
          sidebarVisible={config.showConversationList}
          sidebar={config.showConversationList ? (
            <AssistantConversationList
              conversations={controller.conversations}
              activeConversationId={controller.activeConversationId}
              onSelectConversation={(conversationId) => controller.selectConversation(conversationId)}
              onNewConversation={() => controller.selectConversation(null)}
              renderConversationLabel={renderConversationLabel}
            />
          ) : undefined}
          main={(
            <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
              <AssistantHeader
                title={config.title}
                subtitle={config.subtitle}
                controls={(
                  <>
                    <AssistantModelPicker
                      value={controller.conversationModel}
                      options={availableModels}
                      getOptionLabel={(model) => availableModelLabels.get(model) ?? model}
                      onChange={(model) => void controller.setConversationModel(model)}
                    />
                    <button
                      type="button"
                      onClick={() => controller.selectConversation(null)}
                    >
                      New conversation
                    </button>
                    <button
                      type="button"
                      onClick={() => controller.stop()}
                      disabled={!controller.isActiveConversationRunning}
                    >
                      Stop
                    </button>
                  </>
                )}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minHeight: 0 }}>
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
                    <label htmlFor="chrome-composer">Message</label>
                    <textarea
                      id="chrome-composer"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={4}
                      placeholder={config.placeholder}
                      style={{ display: "block", width: "100%", resize: "vertical" }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={controller.isUploadingFiles}
                      >
                        Attach files
                      </button>
                      <button
                        type="submit"
                        disabled={controller.isLoading || controller.isActiveConversationRunning || draft.trim().length === 0}
                      >
                        Send
                      </button>
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
  );
}

function ShowcaseBody() {
  const [mode, setMode] = useState<PreviewMode>("assistant");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => buildThemeConfig("light"));
  const [previewConfig, setPreviewConfig] = useState<PreviewConfig>(() => buildPreviewConfig());
  const controller = useAssistantController({
    client: getClient(),
    podId: SHOWCASE_CONFIG.podId || undefined,
    assistantName: SHOWCASE_CONFIG.assistantName || undefined,
    organizationId: SHOWCASE_CONFIG.organizationId || undefined,
    enabled: isConfigured(SHOWCASE_CONFIG.podId) && isConfigured(SHOWCASE_CONFIG.assistantName) && previewConfig.enabled,
  });

  const hasRequiredConfig = isConfigured(SHOWCASE_CONFIG.podId) && isConfigured(SHOWCASE_CONFIG.assistantName);
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
      <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{message.content || "(no text content)"}</pre>
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
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify({
          args: invocation.args,
          result: invocation.result,
        }, null, 2)}</pre>
      </details>
    )
    : undefined;
  const controlledDraftProps = previewConfig.controlDraft
    ? {
      draft: previewConfig.draft,
      onDraftChange: (value: string) => setPreviewConfig((current) => ({ ...current, draft: value })),
    }
    : {};
  const themeCss = useMemo(() => buildThemeCss(themeConfig), [themeConfig]);

  return (
    <main style={{ padding: 24 }}>
      <style>{themeCss}</style>
      <h1>Lemma Assistant Showcase</h1>
    



      {!hasRequiredConfig ? (
        <p>Set both <code>VITE_LEMMA_POD_ID</code> and <code>VITE_LEMMA_ASSISTANT_NAME</code> in <code>.env</code> to enable the previews.</p>
      ) : null}

      <label htmlFor="preview-mode">Preview</label>
      <select
        id="preview-mode"
        value={mode}
        onChange={(event) => setMode(event.target.value as PreviewMode)}
        disabled={!hasRequiredConfig}
      >
        <option value="assistant">Assistant experience view</option>
        <option value="embedded">Assistant embedded wrapper</option>
        <option value="chrome">Assistant chrome primitives</option>
      </select>

      <hr />

      <ThemeControls
        themeMode={themeMode}
        theme={themeConfig}
        onModeChange={(mode) => {
          setThemeMode(mode);
          setThemeConfig(buildThemeConfig(mode));
        }}
        onChange={setThemeConfig}
        onReset={() => setThemeConfig(buildThemeConfig(themeMode))}
      />

      <hr />

      <PreviewControls config={previewConfig} onChange={setPreviewConfig} />

      <hr />

      {hasRequiredConfig && mode === "assistant" ? (
        <AssistantThemeScope theme={themeMode}>
          <div style={{ height: "70vh", minHeight: 640 }}>
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
      ) : null}

      {hasRequiredConfig && mode === "embedded" ? (
        <div style={{ height: "70vh", minHeight: 640 }}>
          <AssistantEmbedded
            theme={themeMode}
            client={getClient()}
            podId={SHOWCASE_CONFIG.podId}
            assistantName={SHOWCASE_CONFIG.assistantName}
            organizationId={SHOWCASE_CONFIG.organizationId || undefined}
            enabled={previewConfig.enabled}
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
      ) : null}

      {hasRequiredConfig && mode === "chrome" ? (
        <ShowcaseChrome
          podId={SHOWCASE_CONFIG.podId}
          assistantName={SHOWCASE_CONFIG.assistantName}
          organizationId={SHOWCASE_CONFIG.organizationId}
          config={previewConfig}
        />
      ) : null}
    </main>
  );
}

export default function App() {
  return (
    <AuthGuard client={getClient()} loadingFallback={<LoadingScreen />}>
      <ShowcaseBody />
    </AuthGuard>
  );
}
