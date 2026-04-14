import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { AvailableModels, type ConversationModel } from "lemma-sdk";
import { cn } from "@/lib/utils";
import type {
  AssistantMessagePart,
  AssistantRenderableMessage,
  AssistantToolInvocation,
} from "lemma-sdk/react";
import type {
  AssistantControllerView,
  AssistantConversationRenderArgs,
  AssistantExperienceCustomizationProps,
  AssistantMessageRenderArgs,
  AssistantPendingFileRenderArgs,
  AssistantPresentedFileRenderArgs,
  AssistantToolRenderArgs,
  EmptyStateSuggestion,
} from "./assistant-types.js";
import {
  AssistantAskOverlay,
  AssistantComposer,
  AssistantHeader,
  AssistantMessageViewport,
  AssistantModelPicker,
  AssistantStatusPill,
  type AssistantSurfaceTone,
} from "./assistant-chrome.js";

type ToolCardArgs = Record<string, unknown>;
type ToolCardResult = Record<string, unknown> & {
  success?: boolean;
  resourceType?: string;
  resourceId?: string;
  error?: string;
};

type PlanStatus = "pending" | "in_progress" | "completed";

export interface PlanStepState {
  step: string;
  status: PlanStatus;
}

export interface PlanSummaryState {
  steps: PlanStepState[];
  completedCount: number;
  inProgressCount: number;
  running: boolean;
  activeStep?: string;
}

type AskQuestionType = "single_select" | "multi_select" | "rank_priorities";

export interface AskUserInputQuestion {
  question: string;
  options: string[];
  type: AskQuestionType;
}

export interface PendingAskUserInput {
  toolCallId: string;
  messageIndex: number;
  questions: AskUserInputQuestion[];
}

interface ShowWidgetPayload {
  title?: string;
  widgetCode: string;
  loadingMessages: string[];
}

export interface DisplayMessageRow {
  id: string;
  message: AssistantRenderableMessage;
  sourceIndexes: number[];
}

export interface ActiveToolBanner {
  summary: string;
  activeCount: number;
}

export type AssistantChromeStyle = "elevated" | "subtle" | "flat";
export type AssistantStatusPlacement = "inline" | "composer" | "none";
export type AssistantRadiusScale = "theme" | "none" | "sm" | "md" | "lg" | "xl";

export interface AssistantExperienceViewProps extends AssistantExperienceCustomizationProps {
  controller: AssistantControllerView;
  chromeStyle?: AssistantChromeStyle;
  statusPlacement?: AssistantStatusPlacement;
  radius?: AssistantRadiusScale;
  showModelPicker?: boolean;
  showNewConversationButton?: boolean;
  onNavigateResource?: (resourceType: string, resourceId: string, meta?: Record<string, unknown>) => void;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function truncateLabel(value: string, max = 72): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function fileNameFromPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || normalized;
}

function formatMessageTimestamp(createdAt?: Date): { text: string; dateTime: string } | null {
  if (!(createdAt instanceof Date) || Number.isNaN(createdAt.getTime())) return null;

  return {
    text: new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(createdAt),
    dateTime: createdAt.toISOString(),
  };
}

function thinkingLabelsFromSummary(summary?: string): string[] {
  const normalized = summary?.toLowerCase() || "";

  if (normalized.includes("search") || normalized.includes("find") || normalized.includes("query")) {
    return ["Searching…", "Working on it…", "Checking results…"];
  }
  if (normalized.includes("plan") || normalized.includes("step")) {
    return ["Planning next steps…", "Working on it…", "Organizing tasks…"];
  }
  if (normalized.includes("run") || normalized.includes("command") || normalized.includes("exec")) {
    return ["Running checks…", "Working on it…", "Inspecting output…"];
  }
  if (normalized.includes("file") || normalized.includes("present")) {
    return ["Preparing files…", "Working on it…", "Finalizing output…"];
  }

  return ["Working on it…", "Thinking…", "Preparing response…"];
}

function toolInvocationKey(tool: AssistantToolInvocation): string {
  return `${tool.toolCallId}:${tool.state}`;
}

export function dedupToolInvocations(message: AssistantRenderableMessage): AssistantToolInvocation[] {
  const invocations: AssistantToolInvocation[] = [];
  const seen = new Set<string>();

  (message.parts || []).forEach((part) => {
    if (part.type !== "tool") return;
    const key = toolInvocationKey(part.toolInvocation);
    if (seen.has(key)) return;
    seen.add(key);
    invocations.push(part.toolInvocation);
  });

  (message.toolInvocations || []).forEach((invocation) => {
    const key = toolInvocationKey(invocation);
    if (seen.has(key)) return;
    seen.add(key);
    invocations.push(invocation);
  });

  return invocations;
}

function normalizePlanStatus(rawStatus: unknown): PlanStatus {
  const status = typeof rawStatus === "string" ? rawStatus.trim().toLowerCase() : "";
  if (status === "completed" || status === "complete" || status === "done") return "completed";
  if (status === "in_progress" || status === "in-progress" || status === "running" || status === "active") return "in_progress";
  return "pending";
}

function parsePlanSteps(value: unknown): PlanStepState[] {
  const entries = asArray(value);
  return entries
    .map((entry, index) => {
      const obj = asRecord(entry);
      const step = asString(obj.step) || asString(obj.title) || `Step ${index + 1}`;
      if (!step) return null;
      return {
        step,
        status: normalizePlanStatus(obj.status),
      };
    })
    .filter((entry): entry is PlanStepState => entry !== null);
}

export function latestPlanSummary(messages: AssistantRenderableMessage[]): PlanSummaryState | null {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const invocations = dedupToolInvocations(messages[messageIndex]);
    for (let invocationIndex = invocations.length - 1; invocationIndex >= 0; invocationIndex -= 1) {
      const invocation = invocations[invocationIndex];
      if (invocation.toolName.toLowerCase() !== "update_plan") continue;

      const argsObj = asRecord(invocation.args);
      let steps = parsePlanSteps(argsObj.plan);

      if (steps.length === 0) {
        const resultObj = asRecord(invocation.result);
        const outputObj = asRecord(resultObj.output);
        steps = parsePlanSteps(outputObj.plan ?? resultObj.plan);
      }

      if (steps.length === 0) continue;

      const completedCount = steps.filter((step) => step.status === "completed").length;
      const inProgressCount = steps.filter((step) => step.status === "in_progress").length;
      const activeStep = steps.find((step) => step.status === "in_progress")?.step;
      const running = invocation.state !== "result" || inProgressCount > 0;

      return {
        steps,
        completedCount,
        inProgressCount,
        running,
        activeStep,
      };
    }
  }

  return null;
}

function normalizeQuestionType(value: unknown): AskQuestionType {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "multi_select") return "multi_select";
  if (normalized === "rank_priorities") return "rank_priorities";
  return "single_select";
}

function parseAskUserInputQuestions(value: unknown): AskUserInputQuestion[] {
  return asArray(value)
    .map((entry) => {
      const obj = asRecord(entry);
      const question = asString(obj.question);
      const options = asArray(obj.options)
        .map((option) => (typeof option === "string" ? option.trim() : ""))
        .filter((option): option is string => option.length > 0)
        .slice(0, 4);

      if (!question || options.length < 2) {
        return null;
      }

      return {
        question,
        options,
        type: normalizeQuestionType(obj.type),
      };
    })
    .filter((entry): entry is AskUserInputQuestion => entry !== null)
    .slice(0, 3);
}

function extractAskUserInputQuestionsFromInvocation(invocation: AssistantToolInvocation): AskUserInputQuestion[] {
  if (invocation.toolName.toLowerCase() !== "ask_user_input") return [];
  const args = asRecord(invocation.args);
  const result = asRecord(invocation.result);
  const output = asRecord(result.output);

  const fromArgs = parseAskUserInputQuestions(args.questions);
  if (fromArgs.length > 0) return fromArgs;
  const fromResult = parseAskUserInputQuestions(result.questions);
  if (fromResult.length > 0) return fromResult;
  return parseAskUserInputQuestions(output.questions);
}

export function findPendingAskUserInput(messages: AssistantRenderableMessage[]): PendingAskUserInput | null {
  let latestUserMessageIndex = -1;
  messages.forEach((message, index) => {
    if (message.role === "user") {
      latestUserMessageIndex = index;
    }
  });

  let pending: PendingAskUserInput | undefined;
  messages.forEach((message, messageIndex) => {
    if (message.role !== "assistant") return;

    const invocations = dedupToolInvocations(message);
    invocations.forEach((invocation) => {
      const questions = extractAskUserInputQuestionsFromInvocation(invocation);
      if (questions.length === 0) return;
      pending = {
        toolCallId: invocation.toolCallId || `${message.id}-ask-user-input`,
        messageIndex,
        questions,
      };
    });
  });

  if (!pending || latestUserMessageIndex > pending.messageIndex) {
    return null;
  }
  return pending;
}

export function formatAskUserInputAnswers(questions: AskUserInputQuestion[], answers: string[][]): string {
  const rows: string[] = [];
  questions.forEach((question, index) => {
    const answer = answers[index] || [];
    if (answer.length === 0) return;
    const answerText = question.type === "rank_priorities"
      ? answer.join(" > ")
      : answer.join(", ");
    rows.push(`Q: ${question.question}`);
    rows.push(`A: ${answerText}`);
    rows.push("");
  });
  return rows.join("\n").trim();
}

function normalizeFilepaths(value: unknown): string[] {
  return asArray(value)
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((path): path is string => path.length > 0);
}

export function extractPresentFilePathsFromInvocation(invocation: AssistantToolInvocation): string[] {
  if (invocation.toolName.toLowerCase() !== "present_files") return [];
  const args = asRecord(invocation.args);
  const result = asRecord(invocation.result);
  const output = asRecord(result.output);

  const fromArgs = [
    normalizeFilepaths(args.filepaths),
    normalizeFilepaths(args.file_paths),
    normalizeFilepaths(args.paths),
  ].find((entries) => entries.length > 0) || [];

  if (fromArgs.length > 0) return fromArgs;

  return [
    normalizeFilepaths(result.filepaths),
    normalizeFilepaths(result.file_paths),
    normalizeFilepaths(output.filepaths),
    normalizeFilepaths(output.file_paths),
  ].find((entries) => entries.length > 0) || [];
}

function formatCommandPreview(cmd: string): string {
  const compact = cmd.replace(/\s+/g, " ").trim();
  return truncateLabel(compact, 64);
}

function formatDurationCompact(durationMs: number): string {
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${totalSeconds}s`;
  if (seconds <= 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

function primaryToolArgs(args: ToolCardArgs): ToolCardArgs {
  const request = asRecord(args.request);
  if (Object.keys(request).length > 0) return request;

  const waitConfig = asRecord(args.wait_config);
  if (Object.keys(waitConfig).length > 0) return waitConfig;

  return args;
}

function toolArg(args: ToolCardArgs, key: string): unknown {
  const direct = args[key];
  if (typeof direct !== "undefined") return direct;
  return primaryToolArgs(args)[key];
}

function formatToolDisplayName(toolName: string): string {
  return toolName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function commentLabelFromArgs(args: ToolCardArgs): string | null {
  const comment = asString(toolArg(args, "comment"));
  return comment ? truncateLabel(comment, 72) : null;
}

function toolCallPrimaryLabel(toolName: string, args: ToolCardArgs): string {
  return commentLabelFromArgs(args) || formatToolDisplayName(toolName);
}

function formatActiveToolSummary(toolName: string, args: ToolCardArgs): string {
  const lowerName = toolName.toLowerCase();
  const comment = commentLabelFromArgs(args);

  if (lowerName === "exec_command") {
    if (comment) return `Running ${comment}`;
    const cmd = asString(toolArg(args, "cmd"));
    return cmd ? `Running ${formatCommandPreview(cmd)}` : "Running command";
  }

  if (lowerName === "ask_user_input") {
    const questions = parseAskUserInputQuestions(toolArg(args, "questions"));
    return questions.length > 0
      ? `Waiting for user input (${questions.length} question${questions.length === 1 ? "" : "s"})`
      : "Waiting for user input";
  }

  if (lowerName === "present_files") {
    const filepaths = extractPresentFilePathsFromInvocation({
      toolCallId: "",
      toolName,
      args,
      state: "call",
    });
    return filepaths.length > 0
      ? `Presenting ${filepaths.length} file${filepaths.length === 1 ? "" : "s"}`
      : "Presenting files";
  }

  if (lowerName === "update_plan") {
    const plan = asArray(toolArg(args, "plan"));
    return `Updating plan (${plan.length} step${plan.length === 1 ? "" : "s"})`;
  }

  if (comment) return `Running ${comment}`;

  return `Running ${formatToolDisplayName(toolName)}`;
}

function formatToolResultSummary(toolName: string, args: ToolCardArgs, result: ToolCardResult): string | null {
  const lowerName = toolName.toLowerCase();

  if (lowerName === "present_files") {
    const filepaths = extractPresentFilePathsFromInvocation({
      toolCallId: "",
      toolName,
      args,
      state: "result",
      result,
    });
    if (filepaths.length > 0) {
      return `Presented ${filepaths.length} file${filepaths.length === 1 ? "" : "s"}`;
    }
  }

  if (lowerName === "update_plan") {
    const plan = asArray(toolArg(args, "plan"));
    const completed = plan.filter((step) => asRecord(step).status === "completed").length;
    if (plan.length > 0) {
      return `${completed}/${plan.length} complete`;
    }
  }

  const rawMessage = asString(result.message);
  if (rawMessage) return truncateLabel(rawMessage, 90);

  if (typeof result.error === "string" && result.error.trim()) {
    return truncateLabel(result.error.trim(), 90);
  }

  if (typeof result.resourceType === "string" && typeof result.resourceId === "string") {
    return `Created ${result.resourceType}`;
  }

  return null;
}

function hasMeaningfulTextPart(message: AssistantRenderableMessage): boolean {
  return (message.parts || []).some((part) => part.type === "text" && part.text.trim().length > 0);
}

function isShowWidgetToolName(toolName: string): boolean {
  const normalized = toolName.trim().toLowerCase();
  return normalized === "visualize:show_widget"
    || normalized === "visualize.show_widget"
    || normalized === "show_widget"
    || normalized === "render_widget";
}

function isCollapsibleAssistantMessage(message: AssistantRenderableMessage): boolean {
  if (message.role !== "assistant") return false;
  const hasTools = (message.toolInvocations?.length || 0) > 0 || (message.parts || []).some((part) => part.type === "tool");
  const hasReasoning = (message.parts || []).some((part) => part.type === "reasoning" && part.text.trim().length > 0);
  if (!hasTools && !hasReasoning) return false;
  return !hasMeaningfulTextPart(message) && (!message.content || message.content.trim().length === 0);
}

export function buildDisplayMessageRows(messages: AssistantRenderableMessage[]): DisplayMessageRow[] {
  const rows: DisplayMessageRow[] = [];

  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    if (!isCollapsibleAssistantMessage(message)) {
      rows.push({
        id: message.id,
        message,
        sourceIndexes: [i],
      });
      continue;
    }

    const cluster: AssistantRenderableMessage[] = [message];
    const sourceIndexes = [i];
    let j = i + 1;
    while (j < messages.length && isCollapsibleAssistantMessage(messages[j])) {
      cluster.push(messages[j]);
      sourceIndexes.push(j);
      j += 1;
    }

    if (cluster.length === 1) {
      rows.push({
        id: message.id,
        message,
        sourceIndexes,
      });
      i = j - 1;
      continue;
    }

    const mergedParts: AssistantMessagePart[] = [];
    const mergedToolInvocations: NonNullable<AssistantRenderableMessage["toolInvocations"]> = [];
    cluster.forEach((entry) => {
      if (entry.parts?.length) {
        mergedParts.push(...entry.parts);
      }
      if (entry.toolInvocations?.length) {
        mergedToolInvocations.push(...entry.toolInvocations);
      }
    });

    rows.push({
      id: `tool-cluster-${cluster[0].id}`,
      message: {
        id: `tool-cluster-${cluster[0].id}`,
        role: "assistant",
        content: "",
        parts: mergedParts,
        toolInvocations: mergedToolInvocations,
        createdAt: cluster[cluster.length - 1]?.createdAt ?? cluster[0]?.createdAt,
      },
      sourceIndexes,
    });

    i = j - 1;
  }

  return rows;
}

export function getActiveToolBanner(messages: AssistantRenderableMessage[]): ActiveToolBanner | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role !== "assistant") continue;

    const activeInvocations = dedupToolInvocations(message).filter((invocation) => invocation.state !== "result");
    if (activeInvocations.length === 0) continue;

    const currentInvocation = activeInvocations[activeInvocations.length - 1];
    return {
      summary: formatActiveToolSummary(currentInvocation.toolName, currentInvocation.args),
      activeCount: activeInvocations.length,
    };
  }

  return null;
}

function extractShowWidgetPayloadFromRecord(value: unknown): ShowWidgetPayload | null {
  const record = asRecord(value);
  const widgetCode = asString(record.widget_code);
  if (!widgetCode) {
    return null;
  }

  const loadingMessages = asArray(record.loading_messages)
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry): entry is string => entry.length > 0)
    .slice(0, 4);

  return {
    title: asString(record.title),
    widgetCode,
    loadingMessages,
  };
}

function extractShowWidgetPayload(args: ToolCardArgs, result?: ToolCardResult): ShowWidgetPayload | null {
  const fromArgs = extractShowWidgetPayloadFromRecord(args);
  if (fromArgs) return fromArgs;

  const resultObject = asRecord(result);
  const outputObject = asRecord(resultObject.output);
  const dataObject = asRecord(resultObject.data);
  return extractShowWidgetPayloadFromRecord(outputObject)
    || extractShowWidgetPayloadFromRecord(dataObject)
    || extractShowWidgetPayloadFromRecord(resultObject);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildWidgetIframeDocument(toolCallId: string, payload: ShowWidgetPayload): string {
  const widgetCode = payload.widgetCode.trim();
  const isSvg = /^<svg[\s>]/i.test(widgetCode);
  const safeToolCallId = JSON.stringify(toolCallId);
  const safeTitle = escapeHtml(payload.title || "Widget");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; width: 100%; background: transparent; color: #0f172a; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .widget-svg-root { width: 100%; display: flex; justify-content: center; align-items: flex-start; overflow: visible; }
    .widget-svg-root > svg { width: 100%; max-width: 100%; height: auto; }
  </style>
  <script>
    (function () {
      var toolCallId = ${safeToolCallId};
      function computeHeight() {
        var doc = document.documentElement;
        var body = document.body;
        return Math.max(
          doc ? doc.scrollHeight : 0,
          body ? body.scrollHeight : 0,
          120
        );
      }
      function reportHeight() {
        parent.postMessage({ type: 'lemma-widget-height', height: Math.max(120, Math.ceil(computeHeight())), toolCallId: toolCallId }, '*');
      }
      window.sendPrompt = function (text) {
        var message = typeof text === 'string' ? text.trim() : '';
        if (!message) return;
        parent.postMessage({ type: 'lemma-widget-send-prompt', text: message, toolCallId: toolCallId }, '*');
      };
      window.addEventListener('load', function () {
        reportHeight();
        setTimeout(reportHeight, 50);
      });
      window.addEventListener('resize', reportHeight);
      if (typeof MutationObserver !== 'undefined' && document.documentElement) {
        var observer = new MutationObserver(reportHeight);
        observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
      }
    })();
  </script>
</head>
<body aria-label="${safeTitle}">
${isSvg ? `<div class="widget-svg-root">${widgetCode}</div>` : widgetCode}
</body>
</html>`;
}

function useControllableDraft(
  controlledValue: string | undefined,
  onChange: ((value: string) => void) | undefined,
): [string, (value: string) => void] {
  const [uncontrolledValue, setUncontrolledValue] = useState("");
  const isControlled = typeof controlledValue === "string";

  const setValue = useCallback((nextValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(nextValue);
    }
    onChange?.(nextValue);
  }, [isControlled, onChange]);

  return [isControlled ? controlledValue : uncontrolledValue, setValue];
}

function defaultConversationLabel({ conversation }: AssistantConversationRenderArgs): ReactNode {
  return conversation.title || "Untitled conversation";
}

const markdownComponents: Components = {
  a: ({ node: _node, ...props }) => (
    <a
      {...props}
      target={props.target || "_blank"}
      rel={props.rel || "noreferrer noopener"}
    />
  ),
};

function defaultMessageContent({ message }: AssistantMessageRenderArgs): ReactNode {
  return (
    <div className="lemma-assistant-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={markdownComponents}
      >
        {message.content}
      </ReactMarkdown>
    </div>
  );
}

function defaultPresentedFile({ filepath }: AssistantPresentedFileRenderArgs): ReactNode {
  return (
    <div className="lemma-assistant-presented-file-card">
      <div className="lemma-assistant-presented-file-name">{fileNameFromPath(filepath)}</div>
      <div className="lemma-assistant-presented-file-path">{filepath}</div>
    </div>
  );
}

function defaultPendingFile({ file, remove }: AssistantPendingFileRenderArgs): ReactNode {
  return (
    <span className="lemma-assistant-pending-file-chip">
      <span className="lemma-assistant-pending-file-chip-label">{file.name}</span>
      <button
        type="button"
        onClick={remove}
        className="lemma-assistant-pending-file-chip-remove"
        title="Remove file"
      >
        ×
      </button>
    </span>
  );
}

export function PlanSummaryStrip({ plan, onHide }: { plan: PlanSummaryState; onHide: () => void }) {
  const [showAll, setShowAll] = useState(false);
  const visibleSteps = showAll ? plan.steps : plan.steps.slice(0, 5);
  const hiddenCount = Math.max(0, plan.steps.length - visibleSteps.length);

  return (
    <div className="lemma-assistant-plan-strip">
      <div className="lemma-assistant-plan-strip-header">
        <div className="lemma-assistant-plan-strip-summary">
          <span className="lemma-assistant-plan-strip-title">Task plan</span>
          <span className="lemma-assistant-plan-strip-count">
            {plan.completedCount}/{plan.steps.length} complete
          </span>
          {plan.inProgressCount > 0 ? (
            <span className="lemma-assistant-plan-strip-active">
              {plan.inProgressCount} active
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onHide}
          className="lemma-assistant-plan-strip-hide"
        >
          Hide
        </button>
      </div>

      {plan.activeStep ? (
        <div className="lemma-assistant-plan-strip-current" title={plan.activeStep}>
          {plan.running ? "Running:" : "Current:"} {plan.activeStep}
        </div>
      ) : null}

      <div className="lemma-assistant-plan-strip-steps">
        {visibleSteps.map((step, index) => (
          <div
            key={`${step.step}-${index}`}
            className="lemma-assistant-plan-strip-step"
            data-status={step.status}
          >
            <span className={cn(
              "lemma-assistant-plan-strip-step-dot",
              step.status === "completed" && "lemma-assistant-plan-strip-step-dot-completed",
              step.status === "in_progress" && "lemma-assistant-plan-strip-step-dot-in-progress",
              step.status === "pending" && "lemma-assistant-plan-strip-step-dot-pending",
            )} />
            <span className={cn(
              "lemma-assistant-plan-strip-step-label",
              step.status === "completed" && "lemma-assistant-plan-strip-step-label-completed",
              step.status === "in_progress" && "lemma-assistant-plan-strip-step-label-in-progress",
              step.status === "pending" && "lemma-assistant-plan-strip-step-label-pending",
            )}>
              {step.step}
            </span>
          </div>
        ))}
        {plan.steps.length > 5 ? (
          <div className="lemma-assistant-plan-strip-footer">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="lemma-assistant-plan-strip-toggle"
            >
              {showAll ? "Show less" : `See all ${plan.steps.length} steps`}
            </button>
            {!showAll && hiddenCount > 0 ? (
              <span className="lemma-assistant-plan-strip-hidden-count">+{hiddenCount} more</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export interface ThinkingIndicatorProps {
  activeToolSummary?: string;
  labels?: string[];
}

function resolvedThinkingLabels(labels?: string[], activeToolSummary?: string): string[] {
  if (labels && labels.length > 0) return labels;
  return thinkingLabelsFromSummary(activeToolSummary);
}

export function ThinkingIndicator({
  activeToolSummary,
  labels,
}: ThinkingIndicatorProps = {}) {
  const [show, setShow] = useState(false);
  const labelOptions = useMemo(
    () => resolvedThinkingLabels(labels, activeToolSummary),
    [labels, activeToolSummary],
  );
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setLabelIndex(0);
  }, [labelOptions]);

  useEffect(() => {
    if (!show || labelOptions.length < 2) return;
    const interval = window.setInterval(() => {
      setLabelIndex((prev) => (prev + 1) % labelOptions.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [show, labelOptions]);

  if (!show) return null;

  return (
    <div className="lemma-assistant-thinking" role="status" aria-live="polite" aria-label="Generating response">
      <div className="lemma-assistant-thinking-label">
        <span className="lemma-assistant-thinking-dot" />
        <span className="lemma-assistant-thinking-text">
          {labelOptions[labelIndex] || "Working on it…"}
        </span>
      </div>
    </div>
  );
}

export interface EmptyStateProps {
  onSendMessage: (msg: string) => void;
  suggestions?: EmptyStateSuggestion[];
}

export const DEFAULT_EMPTY_STATE_SUGGESTIONS: EmptyStateSuggestion[] = [
  { text: "Help me get started", icon: "→" },
  { text: "Summarize this for me", icon: "✦" },
  { text: "Help me draft a reply", icon: "✎" },
  { text: "Brainstorm next steps", icon: "⋯" },
];

function LemmaMarkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 2.5 16.25 5v4.85c0 4.25-2.55 7.05-6.25 8.15-3.7-1.1-6.25-3.9-6.25-8.15V5L10 2.5Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="m7.1 10.1 1.8 1.8 4-4.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EmptyState({
  onSendMessage,
  suggestions = DEFAULT_EMPTY_STATE_SUGGESTIONS,
}: EmptyStateProps) {

  return (
    <div className="lemma-assistant-empty-state">
      <div className="lemma-assistant-empty-state-hero">
        <div className="lemma-assistant-empty-state-badge">
          <LemmaMarkIcon className="lemma-assistant-empty-state-badge-icon" />
        </div>
        <h4 className="lemma-assistant-empty-state-title">How can I help?</h4>
        <p className="lemma-assistant-empty-state-copy">
          Ask a question, share context, or start with one of these prompts.
        </p>
      </div>

      <div className="lemma-assistant-empty-state-suggestions">
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.text}-${index}`}
            onClick={() => onSendMessage(suggestion.text)}
            className="lemma-assistant-empty-state-suggestion"
          >
            {suggestion.icon ? (
              <span className="lemma-assistant-empty-state-suggestion-icon">{suggestion.icon}</span>
            ) : null}
            <span className="lemma-assistant-empty-state-suggestion-text">{suggestion.text}</span>
            <span className="lemma-assistant-empty-state-suggestion-arrow">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReasoningPartCard({
  text,
  isStreaming,
  durationMs,
}: {
  text: string;
  isStreaming: boolean;
  durationMs?: number;
}) {
  return (
    <details className="lemma-assistant-reasoning" open={isStreaming}>
      <summary className="lemma-assistant-reasoning-summary">
        {/* <span className="lemma-assistant-reasoning-caret">›</span> */}
        <span className={cn(
          "lemma-assistant-reasoning-label",
          isStreaming && "lemma-assistant-reasoning-label-streaming",
        )}>
          {isStreaming ? "Thinking" : `Thought${durationMs ? ` · ${Math.max(1, Math.round(durationMs / 1000))}s` : ""}`}
        </span>
      </summary>
      <div className="lemma-assistant-reasoning-body">
        <pre className="lemma-assistant-reasoning-text">{text}</pre>
      </div>
    </details>
  );
}

function PresentFilesCard({
  filepaths,
  conversationId,
  renderPresentedFile,
}: {
  filepaths: string[];
  conversationId?: string | null;
  renderPresentedFile?: (args: AssistantPresentedFileRenderArgs) => ReactNode;
}) {
  const fakeMessage: AssistantRenderableMessage = {
    id: "present-files",
    role: "assistant",
    content: "",
  };
  const fakeInvocation: AssistantToolInvocation = {
    toolCallId: "present-files",
    toolName: "present_files",
    args: { filepaths },
    state: "result",
  };

  return (
    <div className="lemma-assistant-presented-files">
      {filepaths.map((filepath) => (
        <div key={`present-file-${filepath}`} className="lemma-assistant-presented-file">
          {(renderPresentedFile || defaultPresentedFile)({
            filepath,
            activeConversationId: conversationId ?? null,
            invocation: fakeInvocation,
            message: fakeMessage,
          })}
        </div>
      ))}
    </div>
  );
}

function formatToolDetailValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "undefined") return "undefined";

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length <= 160 ? trimmed : `${trimmed.slice(0, 157)}...`;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const primitives = value.filter((entry) => (
      typeof entry === "string"
      || typeof entry === "number"
      || typeof entry === "boolean"
      || entry === null
    ));

    if (primitives.length === value.length) {
      const preview = primitives
        .slice(0, 4)
        .map((entry) => (typeof entry === "string" ? `"${entry}"` : String(entry)))
        .join(", ");
      return `[${preview}${value.length > 4 ? ", ..." : ""}]`;
    }

    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  const record = asRecord(value);
  const keys = Object.keys(record);
  if (keys.length === 0) return "{}";
  const preview = keys.slice(0, 4).join(", ");
  return `{ ${preview}${keys.length > 4 ? ", ..." : ""} }`;
}

function humanizeKey(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isToolPayloadValueMeaningful(value: unknown): boolean {
  if (value === null || typeof value === "undefined") return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(asRecord(value)).length > 0;
  return true;
}

function summarizeToolPayload(
  payload: Record<string, unknown>,
  options?: { excludeKeys?: string[] },
): Array<{ key: string; value: string }> {
  const excluded = new Set((options?.excludeKeys || []).map((key) => key.toLowerCase()));

  return Object.entries(payload)
    .filter(([key, value]) => !excluded.has(key.toLowerCase()) && isToolPayloadValueMeaningful(value))
    .slice(0, 8)
    .map(([key, value]) => ({
      key,
      value: formatToolDetailValue(value),
    }));
}

function countSummarizablePayloadEntries(
  payload: Record<string, unknown>,
  options?: { excludeKeys?: string[] },
): number {
  const excluded = new Set((options?.excludeKeys || []).map((key) => key.toLowerCase()));
  return Object.entries(payload)
    .filter(([key, value]) => !excluded.has(key.toLowerCase()) && isToolPayloadValueMeaningful(value))
    .length;
}

function pickPreferredEntries(
  entries: Array<{ key: string; value: string }>,
  preferredKeys: string[],
  max: number,
): Array<{ key: string; value: string }> {
  const preferredSet = new Set(preferredKeys.map((key) => key.toLowerCase()));
  const preferred = entries.filter((entry) => preferredSet.has(entry.key.toLowerCase()));
  const rest = entries.filter((entry) => !preferredSet.has(entry.key.toLowerCase()));
  return [...preferred, ...rest].slice(0, max);
}

function ToolDetailsPanel({
  toolName,
  args,
  state,
  result,
  onNavigateResource,
  renderToolInvocation,
  message,
  activeConversationId,
}: {
  toolName: string;
  args: ToolCardArgs;
  state: string;
  result?: ToolCardResult;
  onNavigateResource?: (resourceType: string, resourceId: string, meta?: Record<string, unknown>) => void;
  renderToolInvocation?: (args: AssistantToolRenderArgs) => ReactNode;
  message: AssistantRenderableMessage;
  activeConversationId: string | null;
}) {
  const resultData = result || {};
  const primaryLabel = toolCallPrimaryLabel(toolName, args);
  const hasCommentLabel = !!commentLabelFromArgs(args);
  const toolDisplayName = formatToolDisplayName(toolName);
  const canNavigate =
    state === "result"
    && resultData.success !== false
    && typeof resultData.resourceType === "string"
    && typeof resultData.resourceId === "string";
  const summaryOptions = {
    input: { excludeKeys: ["comment", "request", "wait_config"] },
    output: { excludeKeys: ["success", "completed"] },
  };
  const inputEntries = summarizeToolPayload(args, summaryOptions.input);
  const outputEntries = summarizeToolPayload(resultData, summaryOptions.output);
  const inputHighlights = pickPreferredEntries(inputEntries, [
    "cmd",
    "query",
    "path",
    "filepath",
    "filepaths",
    "table",
    "resource_type",
    "resourceType",
    "resource_id",
    "resourceId",
  ], 3);
  const outputHighlights = pickPreferredEntries(outputEntries, [
    "message",
    "stdout",
    "stderr",
    "error",
    "resource_type",
    "resourceType",
    "resource_id",
    "resourceId",
    "exit_code",
    "session_id",
  ], 3);
  const detailRows = [
    {
      label: "Tool",
      value: hasCommentLabel ? `${toolDisplayName} (${toolName})` : toolDisplayName,
    },
    ...inputHighlights.map((entry) => ({
      label: humanizeKey(entry.key),
      value: entry.value,
    })),
    ...outputHighlights.map((entry) => ({
      label: humanizeKey(entry.key),
      value: entry.value,
    })),
  ].slice(0, 8);
  const hiddenInputCount = Math.max(0, countSummarizablePayloadEntries(args, summaryOptions.input) - inputEntries.length);
  const hiddenOutputCount = Math.max(0, countSummarizablePayloadEntries(resultData, summaryOptions.output) - outputEntries.length);

  if (renderToolInvocation) {
    return (
      <div className="lemma-assistant-tool-details-panel lemma-assistant-tool-details-panel-custom">
        {renderToolInvocation({
          invocation: {
            toolCallId: "detail-tool",
            toolName,
            args,
            state: state === "result" ? "result" : "call",
            ...(result ? { result } : {}),
          },
          message,
          activeConversationId,
        })}
      </div>
    );
  }

  return (
    <div className="lemma-assistant-tool-details-panel">
      <div className="lemma-assistant-tool-details-header">
        <div className="lemma-assistant-tool-details-heading">
          <div className="lemma-assistant-tool-details-title">{primaryLabel}</div>
          {hasCommentLabel ? (
            <div className="lemma-assistant-tool-details-meta">{toolDisplayName}</div>
          ) : null}
        </div>
        {canNavigate && onNavigateResource ? (
          <button
            type="button"
            onClick={() => onNavigateResource(resultData.resourceType as string, resultData.resourceId as string, resultData)}
            className="lemma-assistant-tool-details-link"
          >
            Open
          </button>
        ) : null}
      </div>
      <div className="lemma-assistant-tool-details-stack">
        <div className="lemma-assistant-tool-details-section">
          <dl className="lemma-assistant-tool-details-list">
            {detailRows.map((row, index) => (
              <div key={`${row.label}-${index}`} className="lemma-assistant-tool-details-list-item">
                <dt className="lemma-assistant-tool-details-key">{row.label}</dt>
                <dd className="lemma-assistant-tool-details-value">{row.value}</dd>
              </div>
            ))}
          </dl>
          {hiddenInputCount > 0 ? (
            <div className="lemma-assistant-tool-details-more">+{hiddenInputCount} more input field{hiddenInputCount === 1 ? "" : "s"}</div>
          ) : null}
          {hiddenOutputCount > 0 ? (
            <div className="lemma-assistant-tool-details-more">+{hiddenOutputCount} more output field{hiddenOutputCount === 1 ? "" : "s"}</div>
          ) : null}
          <div className="lemma-assistant-tool-details-raw-row">
            <details className="lemma-assistant-tool-details-raw">
              <summary className="lemma-assistant-tool-details-raw-summary">Raw input JSON</summary>
              <div className="lemma-assistant-tool-details-code">
                <pre className="lemma-assistant-tool-details-code-text">{JSON.stringify(args, null, 2)}</pre>
              </div>
            </details>
            {Object.keys(resultData).length > 0 ? (
              <details className="lemma-assistant-tool-details-raw">
                <summary className="lemma-assistant-tool-details-raw-summary">Raw output JSON</summary>
                <div className="lemma-assistant-tool-details-code">
                  <pre className="lemma-assistant-tool-details-code-text">
                    {JSON.stringify(resultData, null, 2)}
                  </pre>
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineToolCall({
  invocation,
  isSelected,
  onClick,
  showStem = true,
}: {
  invocation: AssistantToolInvocation;
  isSelected: boolean;
  onClick: () => void;
  showStem?: boolean;
}) {
  const resultData = (invocation.result || {}) as ToolCardResult;
  const isExecuting = invocation.state !== "result";
  const isComplete = invocation.state === "result" && resultData.success !== false;
  const isFailed = invocation.state === "result" && resultData.success === false;
  const primaryLabel = toolCallPrimaryLabel(invocation.toolName, invocation.args);
  const statusLabel = isExecuting ? "Working" : isFailed ? "Failed" : "Done";
  const toolMeta = isExecuting ? `${invocation.toolName} · running` : invocation.toolName;
  const summary = isExecuting
    ? "Running"
    : isFailed
      ? (typeof resultData.error === "string" ? resultData.error : "Tool failed")
      : (formatToolResultSummary(invocation.toolName, invocation.args, resultData) || "Completed");
  const showSummary = summary !== "Completed";

  return (
    <button
      type="button"
      onClick={onClick}
      className="lemma-assistant-inline-tool-call"
      data-state={isExecuting ? "executing" : isComplete ? "complete" : isFailed ? "failed" : "idle"}
      data-selected={isSelected ? "true" : "false"}
    >
      <span className="lemma-assistant-inline-tool-call-rail" aria-hidden="true">
        <span className="lemma-assistant-inline-tool-call-node" />
        {showStem ? <span className="lemma-assistant-inline-tool-call-stem" /> : null}
      </span>
      <span className="lemma-assistant-inline-tool-call-main">
        <span className="lemma-assistant-inline-tool-call-head">
          <span className="lemma-assistant-inline-tool-call-name">{primaryLabel}</span>
          <span className="lemma-assistant-inline-tool-call-status">{statusLabel}</span>
          <span className="lemma-assistant-inline-tool-call-caret">{isSelected ? "⌄" : "›"}</span>
        </span>
        <span className="lemma-assistant-inline-tool-call-meta">{toolMeta}</span>
        {showSummary ? <span className="lemma-assistant-inline-tool-call-summary">{summary}</span> : null}
      </span>
    </button>
  );
}

function ToolActivityRollup({
  detailParts,
  onNavigateResource,
  renderToolInvocation,
  message,
  activeConversationId,
}: {
  detailParts: Array<
    Extract<AssistantMessagePart, { type: "tool" }>
    | Extract<AssistantMessagePart, { type: "reasoning" }>
  >;
  onNavigateResource?: (resourceType: string, resourceId: string, meta?: Record<string, unknown>) => void;
  renderToolInvocation?: (args: AssistantToolRenderArgs) => ReactNode;
  message: AssistantRenderableMessage;
  activeConversationId: string | null;
}) {
  const [activeToolCallId, setActiveToolCallId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const toolParts = detailParts.filter((part): part is Extract<AssistantMessagePart, { type: "tool" }> => part.type === "tool");
  const reasoningParts = detailParts.filter((part): part is Extract<AssistantMessagePart, { type: "reasoning" }> => part.type === "reasoning");
  const totalThoughtDurationMs = reasoningParts.reduce((total, part) => total + (part.durationMs ?? 0), 0);
  const shouldCollapse = detailParts.length > 1;

  const activeInvocation = [...toolParts]
    .reverse()
    .find((part) => part.toolInvocation.state !== "result")
    ?.toolInvocation;
  const failedCount = toolParts.filter((part) => (
    part.toolInvocation.state === "result" && part.toolInvocation.result?.success === false
  )).length;
  const isWorking = !!activeInvocation || reasoningParts.some((part) => part.state === "streaming");
  const isSingleDetail = detailParts.length === 1;
  const completionSummary = toolParts.length > 0
    ? `Completed ${toolParts.length} tool${toolParts.length === 1 ? "" : "s"}`
    : totalThoughtDurationMs > 0
      ? `Thought for ${formatDurationCompact(totalThoughtDurationMs)}`
      : "Completed";
  const summary = activeInvocation
    ? formatActiveToolSummary(activeInvocation.toolName, activeInvocation.args)
    : isWorking
      ? "Working on it…"
      : `${completionSummary}${failedCount > 0 ? ` · ${failedCount} failed` : ""}`;
  const collapsedSummary = isWorking
    ? summary
    : `${totalThoughtDurationMs > 0
      ? `Worked for ${formatDurationCompact(totalThoughtDurationMs)}`
      : `Worked through ${detailParts.length} step${detailParts.length === 1 ? "" : "s"}`}${failedCount > 0 ? ` · ${failedCount} failed` : ""}`;

  return (
    <div className="lemma-assistant-tool-rollup" data-single={isSingleDetail ? "true" : "false"}>
      {shouldCollapse ? (
        <button
          type="button"
          className="lemma-assistant-tool-rollup-banner"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Hide tool activity details" : "Show tool activity details"}
        >
          <span className="lemma-assistant-tool-rollup-banner-line" aria-hidden="true" />
          <span className="lemma-assistant-tool-rollup-banner-copy">
            {isWorking ? <span className="lemma-assistant-tool-rollup-dot" aria-hidden="true" /> : null}
            <span className={cn(
              "lemma-assistant-tool-rollup-banner-label",
              isWorking && "lemma-assistant-tool-rollup-banner-label-working",
            )}>
              {collapsedSummary}
            </span>
            <span
              className="lemma-assistant-tool-rollup-banner-caret"
              data-expanded={isExpanded ? "true" : "false"}
              aria-hidden="true"
            >
              ›
            </span>
          </span>
          <span className="lemma-assistant-tool-rollup-banner-line" aria-hidden="true" />
        </button>
      ) : (
        !isSingleDetail ? (
          <div className="lemma-assistant-tool-rollup-header">
            {isWorking ? <span className="lemma-assistant-tool-rollup-dot" /> : null}
            <span className={cn(
              "lemma-assistant-tool-rollup-summary",
              isWorking && "lemma-assistant-tool-rollup-summary-working",
            )}>{summary}</span>
          </div>
        ) : null
      )}

      {!shouldCollapse || isExpanded ? (
        <div className={cn(
          "lemma-assistant-tool-rollup-details",
          isSingleDetail && "lemma-assistant-tool-rollup-details-single",
        )}>
          {detailParts.map((part, partIndex) => {
            if (part.type === "reasoning") {
              return (
                <div
                  key={`thinking-${part.id}`}
                  className="lemma-assistant-tool-rollup-thinking"
                >
                  <div className="lemma-assistant-tool-rollup-thinking-title">
                    {part.state === "streaming"
                      ? "Internal note"
                      : `Internal note${part.durationMs ? ` · ${formatDurationCompact(part.durationMs)}` : ""}`}
                  </div>
                  <pre className="lemma-assistant-tool-rollup-thinking-text">
                    {part.text}
                  </pre>
                </div>
              );
            }

            const invocation = part.toolInvocation;
            const isSelected = activeToolCallId === invocation.toolCallId;
            return (
              <div key={part.id} className="lemma-assistant-tool-rollup-item">
                <InlineToolCall
                  invocation={invocation}
                  isSelected={isSelected}
                  showStem={partIndex < detailParts.length - 1}
                  onClick={() => setActiveToolCallId((prev) => (prev === invocation.toolCallId ? null : invocation.toolCallId))}
                />
                {isSelected ? (
                  <ToolDetailsPanel
                    toolName={invocation.toolName}
                    args={invocation.args}
                    state={invocation.state}
                    result={invocation.result}
                    onNavigateResource={onNavigateResource}
                    renderToolInvocation={renderToolInvocation}
                    message={message}
                    activeConversationId={activeConversationId}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ShowWidgetToolCard({
  invocation,
  onSendPrompt,
}: {
  invocation: AssistantToolInvocation;
  onSendPrompt: (text: string) => void | Promise<void>;
}) {
  const resultData = (invocation.result || {}) as ToolCardResult;
  const payload = extractShowWidgetPayload(invocation.args, resultData);
  const displayName = payload?.title || formatToolDisplayName(invocation.toolName);
  const hasResultData = Object.keys(resultData).length > 0;
  const isExecuting = invocation.state !== "result" && !hasResultData;
  const isFailed = resultData.success === false || (!isExecuting && typeof resultData.error === "string" && resultData.error.length > 0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(220);
  const iframeDocument = useMemo(
    () => (payload ? buildWidgetIframeDocument(invocation.toolCallId, payload) : ""),
    [invocation.toolCallId, payload],
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      const data = asRecord(event.data);
      const messageType = asString(data.type);
      if (!messageType) return;

      if (messageType === "lemma-widget-send-prompt") {
        const text = asString(data.text);
        if (!text) return;
        void onSendPrompt(text);
        return;
      }

      if (messageType === "lemma-widget-height") {
        const rawHeight = typeof data.height === "number" ? data.height : Number(data.height);
        if (!Number.isFinite(rawHeight)) return;
        setHeight(Math.max(120, Math.min(2400, Math.round(rawHeight))));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onSendPrompt]);

  return (
    <div className="lemma-assistant-widget-card">
      <div className="lemma-assistant-widget-card-header">
        <div className="lemma-assistant-widget-card-title">{displayName}</div>
        <span className={cn(
          "lemma-assistant-widget-card-badge",
          isExecuting && "lemma-assistant-widget-card-badge-rendering",
          isFailed && "lemma-assistant-widget-card-badge-failed",
          !isExecuting && !isFailed && "lemma-assistant-widget-card-badge-ready",
        )}>
          {isExecuting ? "Rendering" : isFailed ? "Failed" : "Ready"}
        </span>
      </div>

      {isFailed ? (
        <p className="lemma-assistant-widget-card-error">
          {typeof resultData.error === "string" && resultData.error.length > 0
            ? resultData.error
            : "Failed to render widget."}
        </p>
      ) : null}

      {!isFailed && payload ? (
        <iframe
          ref={iframeRef}
          title={displayName}
          srcDoc={iframeDocument}
          sandbox="allow-scripts allow-forms allow-popups allow-downloads"
          height={height}
          className="lemma-assistant-widget-card-frame"
        />
      ) : null}

      {!isFailed && !payload ? (
        <p className="lemma-assistant-widget-card-missing">
          Widget output is missing `widget_code`.
        </p>
      ) : null}
    </div>
  );
}

export function MessageGroup({
  message,
  conversationId,
  onNavigateResource,
  onWidgetSendPrompt,
  isStreaming,
  showAssistantHeader,
  renderMessageContent,
  renderPresentedFile,
  renderToolInvocation,
}: {
  message: AssistantRenderableMessage;
  conversationId?: string | null;
  onNavigateResource?: (resourceType: string, resourceId: string, meta?: Record<string, unknown>) => void;
  onWidgetSendPrompt: (text: string) => void | Promise<void>;
  isStreaming: boolean;
  showAssistantHeader: boolean;
  renderMessageContent: (args: AssistantMessageRenderArgs) => ReactNode;
  renderPresentedFile?: (args: AssistantPresentedFileRenderArgs) => ReactNode;
  renderToolInvocation?: (args: AssistantToolRenderArgs) => ReactNode;
}) {
  type ToolPart = Extract<AssistantMessagePart, { type: "tool" }>;
  type ReasoningPart = Extract<AssistantMessagePart, { type: "reasoning" }>;
  type NonToolPart = Exclude<AssistantMessagePart, { type: "tool" }>;
  type MessageRenderBlock =
    | { id: string; kind: "content"; part: NonToolPart }
    | { id: string; kind: "widget"; toolPart: ToolPart }
    | { id: string; kind: "tools"; toolParts: ToolPart[] };

  const orderedParts: AssistantMessagePart[] = message.parts && message.parts.length > 0
    ? message.parts
    : [
      ...(message.content?.trim()
        ? [{ id: `${message.id}-fallback-text`, type: "text", text: message.content } as AssistantMessagePart]
        : []),
      ...((message.toolInvocations || []).map((tool, index) => ({
        id: `${tool.toolCallId || message.id}-fallback-tool-${index}`,
        type: "tool",
        toolInvocation: tool,
      } as AssistantMessagePart))),
    ];

  const toolParts = orderedParts.filter((part): part is ToolPart => part.type === "tool");
  const groupedToolParts = toolParts.filter((part) => !isShowWidgetToolName(part.toolInvocation.toolName));
  const reasoningParts = orderedParts.filter((part): part is ReasoningPart => part.type === "reasoning");
  const presentableFilepaths = Array.from(new Set(
    groupedToolParts.flatMap((part) => extractPresentFilePathsFromInvocation(part.toolInvocation)),
  ));
  const rollupOrderedParts = orderedParts.filter((part): part is ToolPart | ReasoningPart => (
    part.type === "reasoning" || (part.type === "tool" && !isShowWidgetToolName(part.toolInvocation.toolName))
  ));
  const blocks: MessageRenderBlock[] = [];

  orderedParts.forEach((part) => {
    if (part.type === "tool") {
      if (isShowWidgetToolName(part.toolInvocation.toolName)) {
        blocks.push({
          id: `${part.id}-widget`,
          kind: "widget",
          toolPart: part,
        });
        return;
      }

      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock?.kind === "tools") {
        lastBlock.toolParts.push(part);
      } else {
        blocks.push({
          id: `${part.id}-tools`,
          kind: "tools",
          toolParts: [part],
        });
      }
      return;
    }

    blocks.push({
      id: part.id,
      kind: "content",
      part,
    });
  });

  const nonToolParts = orderedParts.filter((part): part is NonToolPart => part.type !== "tool");
  const firstToolsBlockId = blocks.find((block) => block.kind === "tools")?.id;
  const hasTextParts = orderedParts.some((part) => part.type === "text" && part.text.trim().length > 0);
  const foldReasoningIntoToolRollup = groupedToolParts.length > 0 && reasoningParts.length > 0 && !hasTextParts;
  const lastTextPartId = [...nonToolParts]
    .reverse()
    .find((part) => part.type === "text" && part.text.trim().length > 0)
    ?.id;
  const messageTimestamp = formatMessageTimestamp(message.createdAt);

  if (message.role === "user") {
    return (
      <div className="lemma-assistant-message lemma-assistant-message-user">
        <div className="lemma-assistant-message-user-bubble">
          {renderMessageContent({
            message: {
              ...message,
              content: message.content,
              parts: undefined,
              toolInvocations: undefined,
            },
          })}
        </div>
        {messageTimestamp ? (
          <time
            className="lemma-assistant-message-timestamp lemma-assistant-message-timestamp-user"
            dateTime={messageTimestamp.dateTime}
          >
            {messageTimestamp.text}
          </time>
        ) : null}
      </div>
    );
  }

  return (
    <div className="lemma-assistant-message lemma-assistant-message-assistant">
      {showAssistantHeader ? (
        <div className="lemma-assistant-message-header">
          <span className="lemma-assistant-message-header-dot" />
          Lemma
        </div>
      ) : null}

      <div className="lemma-assistant-message-body">
        {blocks.map((block) => {
          if (block.kind === "tools") {
            if (foldReasoningIntoToolRollup && block.id !== firstToolsBlockId) {
              return null;
            }

            return (
              <ToolActivityRollup
                key={block.id}
                detailParts={
                  foldReasoningIntoToolRollup && block.id === firstToolsBlockId
                    ? rollupOrderedParts
                    : block.toolParts
                }
                onNavigateResource={onNavigateResource}
                renderToolInvocation={renderToolInvocation}
                message={message}
                activeConversationId={conversationId ?? null}
              />
            );
          }

          if (block.kind === "widget") {
            return (
              <ShowWidgetToolCard
                key={block.id}
                invocation={block.toolPart.toolInvocation}
                onSendPrompt={onWidgetSendPrompt}
              />
            );
          }

          const part = block.part;
          if (part.type === "text") {
            const trimmedText = part.text.trim();
            if (trimmedText.length === 0) {
              return null;
            }

            return (
              <div key={part.id} className="lemma-assistant-message-text">
                {renderMessageContent({
                  message: {
                    ...message,
                    content: trimmedText + (isStreaming && part.id === lastTextPartId ? " ▍" : ""),
                    parts: undefined,
                    toolInvocations: undefined,
                  },
                })}
              </div>
            );
          }

          if (part.type === "reasoning") {
            if (foldReasoningIntoToolRollup) {
              return null;
            }

            return (
              <ReasoningPartCard
                key={part.id}
                text={part.text}
                isStreaming={part.state === "streaming"}
                durationMs={part.durationMs}
              />
            );
          }

          return null;
        })}

        {presentableFilepaths.length > 0 ? (
          <PresentFilesCard
            filepaths={presentableFilepaths}
            conversationId={conversationId}
            renderPresentedFile={renderPresentedFile}
          />
        ) : null}
      </div>
    </div>
  );
}

export function AssistantExperienceView({
  controller,
  title = "Lemma Assistant",
  subtitle = "Ask across your workspace and organization.",
  badge,
  placeholder = "Message Lemma Assistant",
  emptyState,
  emptyStateSuggestions,
  draft: controlledDraft,
  onDraftChange,
  showConversationList = false,
  chromeStyle = "subtle",
  statusPlacement = "inline",
  radius = "theme",
  showModelPicker = false,
  showNewConversationButton = true,
  onNavigateResource,
  renderConversationLabel = defaultConversationLabel,
  renderMessageContent = defaultMessageContent,
  renderPresentedFile,
  renderPendingFile = defaultPendingFile,
  renderToolInvocation,
}: AssistantExperienceViewProps) {
  const [draft, setDraft] = useControllableDraft(controlledDraft, onDraftChange);
  const [isPlanHidden, setIsPlanHidden] = useState(false);
  const [dismissedAskToolCallIds, setDismissedAskToolCallIds] = useState<string[]>([]);
  const [askOverlayState, setAskOverlayState] = useState<{
    toolCallId: string;
    currentQuestionIndex: number;
    answers: string[][];
  } | null>(null);
  const [isUpdatingModel, setIsUpdatingModel] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [thinkingLabelIndex, setThinkingLabelIndex] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const isPinnedToBottomRef = useRef(true);
  const loadingOlderFromScrollRef = useRef(false);
  const isConversationBusy = controller.isLoading || controller.isActiveConversationRunning;

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

  const resizeComposer = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const minHeight = 48;
    const maxHeight = 220;

    textarea.style.height = "auto";
    const nextHeight = Math.min(maxHeight, Math.max(minHeight, textarea.scrollHeight));
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
    const anchor = bottomAnchorRef.current;
    if (anchor) {
      anchor.scrollIntoView({
        block: "end",
        behavior,
      });
      isPinnedToBottomRef.current = true;
      setShowScrollToBottom(false);
      return;
    }

    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });
    isPinnedToBottomRef.current = true;
    setShowScrollToBottom(false);
  }, []);

  const updatePinnedState = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isPinned = distanceFromBottom <= 112;
    isPinnedToBottomRef.current = isPinned;
    setShowScrollToBottom((prev) => (prev === !isPinned ? prev : !isPinned));

    if (el.scrollTop > 48) return;
    if (!controller.hasOlderMessages || controller.isLoadingMessages || controller.isLoadingOlderMessages || loadingOlderFromScrollRef.current) return;

    const previousScrollTop = el.scrollTop;
    const previousScrollHeight = el.scrollHeight;
    loadingOlderFromScrollRef.current = true;

    void controller.loadOlderMessages()
      .then((didLoad) => {
        if (!didLoad) return;
        requestAnimationFrame(() => {
          const nextEl = messagesContainerRef.current;
          if (!nextEl) return;
          nextEl.scrollTop = previousScrollTop + (nextEl.scrollHeight - previousScrollHeight);
        });
      })
      .finally(() => {
        loadingOlderFromScrollRef.current = false;
      });
  }, [
    controller,
  ]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    if (isPinnedToBottomRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToLatest(isConversationBusy ? "auto" : "smooth");
        });
      });
    }
  }, [controller.messages, isConversationBusy, scrollToLatest]);

  useEffect(() => {
    isPinnedToBottomRef.current = true;
    setShowScrollToBottom(false);
    requestAnimationFrame(() => {
      scrollToLatest("auto");
      inputRef.current?.focus();
    });
  }, [controller.activeConversationId, scrollToLatest]);

  useEffect(() => {
    resizeComposer();
  }, [draft, resizeComposer]);

  const displayMessageRows = useMemo(() => buildDisplayMessageRows(controller.messages), [controller.messages]);
  const activeToolBanner = useMemo(() => getActiveToolBanner(controller.messages), [controller.messages]);
  const thinkingLabels = useMemo(
    () => thinkingLabelsFromSummary(activeToolBanner?.summary),
    [activeToolBanner?.summary],
  );
  const planSummary = useMemo(() => latestPlanSummary(controller.messages), [controller.messages]);
  const pendingAskUserInput = useMemo(() => {
    const pending = findPendingAskUserInput(controller.messages);
    if (!pending) return null;
    if (dismissedAskToolCallIds.includes(pending.toolCallId)) return null;
    return pending;
  }, [controller.messages, dismissedAskToolCallIds]);
  const effectiveAskOverlayState = useMemo(() => {
    if (!pendingAskUserInput) return null;
    if (askOverlayState && askOverlayState.toolCallId === pendingAskUserInput.toolCallId) {
      return askOverlayState;
    }
    return {
      toolCallId: pendingAskUserInput.toolCallId,
      currentQuestionIndex: 0,
      answers: pendingAskUserInput.questions.map(() => []),
    };
  }, [askOverlayState, pendingAskUserInput]);

  const lastMessageHasContent = useMemo(() => {
    if (controller.messages.length === 0) return false;
    const lastMsg = controller.messages[controller.messages.length - 1];
    if (lastMsg.role !== "assistant") return false;
    const hasText = (lastMsg.parts || []).some((part) => part.type === "text" && part.text.trim().length > 0);
    const hasTools = (lastMsg.toolInvocations?.length || 0) > 0 || (lastMsg.parts || []).some((part) => part.type === "tool");
    return hasText || hasTools;
  }, [controller.messages]);

  useEffect(() => {
    setThinkingLabelIndex(0);
  }, [activeToolBanner?.summary, isConversationBusy]);

  useEffect(() => {
    if (!isConversationBusy || thinkingLabels.length < 2) return;

    const interval = window.setInterval(() => {
      setThinkingLabelIndex((prev) => (prev + 1) % thinkingLabels.length);
    }, 1700);

    return () => clearInterval(interval);
  }, [isConversationBusy, thinkingLabels]);

  const dismissAskOverlay = useCallback((toolCallId: string) => {
    setDismissedAskToolCallIds((prev) => (prev.includes(toolCallId) ? prev : [...prev, toolCallId]));
    setAskOverlayState(null);
  }, []);

  const commitAskAnswersToComposer = useCallback((toolCallId: string, answers: string[][]) => {
    if (!pendingAskUserInput || pendingAskUserInput.toolCallId !== toolCallId) return;
    const formatted = formatAskUserInputAnswers(pendingAskUserInput.questions, answers);
    if (formatted.length > 0) {
      const nextDraft = draft.trim().length > 0 ? `${draft.trim()}\n\n${formatted}` : formatted;
      setDraft(nextDraft);
    }
    dismissAskOverlay(toolCallId);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [dismissAskOverlay, draft, pendingAskUserInput, setDraft]);

  const updateAskAnswer = useCallback((option: string) => {
    if (!pendingAskUserInput || !effectiveAskOverlayState) return;
    if (effectiveAskOverlayState.toolCallId !== pendingAskUserInput.toolCallId) return;

    const questionIndex = effectiveAskOverlayState.currentQuestionIndex;
    const question = pendingAskUserInput.questions[questionIndex];
    if (!question) return;

    const nextAnswers = effectiveAskOverlayState.answers.map((answers) => [...answers]);
    const currentAnswers = nextAnswers[questionIndex] || [];

    if (question.type === "single_select") {
      nextAnswers[questionIndex] = [option];
      if (questionIndex >= pendingAskUserInput.questions.length - 1) {
        commitAskAnswersToComposer(effectiveAskOverlayState.toolCallId, nextAnswers);
        return;
      }
      setAskOverlayState({
        ...effectiveAskOverlayState,
        answers: nextAnswers,
        currentQuestionIndex: questionIndex + 1,
      });
      return;
    }

    nextAnswers[questionIndex] = currentAnswers.includes(option)
      ? currentAnswers.filter((entry) => entry !== option)
      : [...currentAnswers, option];

    setAskOverlayState({
      ...effectiveAskOverlayState,
      answers: nextAnswers,
    });
  }, [commitAskAnswersToComposer, effectiveAskOverlayState, pendingAskUserInput]);

  const continueAskQuestions = useCallback(() => {
    if (!pendingAskUserInput || !effectiveAskOverlayState) return;
    if (effectiveAskOverlayState.toolCallId !== pendingAskUserInput.toolCallId) return;

    const questionIndex = effectiveAskOverlayState.currentQuestionIndex;
    const answers = effectiveAskOverlayState.answers[questionIndex] || [];
    if (answers.length === 0) return;

    if (questionIndex >= pendingAskUserInput.questions.length - 1) {
      commitAskAnswersToComposer(effectiveAskOverlayState.toolCallId, effectiveAskOverlayState.answers);
      return;
    }

    setAskOverlayState({
      ...effectiveAskOverlayState,
      currentQuestionIndex: questionIndex + 1,
    });
  }, [commitAskAnswersToComposer, effectiveAskOverlayState, pendingAskUserInput]);

  const handleSubmit = useCallback(async () => {
    if (!draft.trim() || isConversationBusy) return;
    const message = draft.trim();
    setDraft("");
    scrollToLatest("smooth");
    await controller.sendMessage(message);
  }, [controller, draft, isConversationBusy, scrollToLatest, setDraft]);

  const handleWidgetSendPrompt = useCallback(async (prompt: string) => {
    const message = prompt.trim();
    if (!message) return;

    if (isConversationBusy) {
      setDraft(message);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return;
    }

    scrollToLatest("smooth");
    await controller.sendMessage(message);
  }, [controller, isConversationBusy, scrollToLatest, setDraft]);

  const handleSuggestionSend = useCallback(async (suggestion: string) => {
    const message = suggestion.trim();
    if (!message || isConversationBusy) return;
    scrollToLatest("smooth");
    await controller.sendMessage(message);
  }, [controller, isConversationBusy, scrollToLatest]);

  const handleUploadSelection = useCallback(async (files: FileList | null) => {
    const selectedFiles = files ? Array.from(files) : [];
    if (selectedFiles.length === 0) return;

    try {
      await controller.uploadFiles(selectedFiles, { deferUntilSend: true });
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [controller]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }, [handleSubmit]);

  const handleModelChange = useCallback(async (nextModel: string | null) => {
    if (isUpdatingModel) return;
    setIsUpdatingModel(true);
    try {
      await controller.setConversationModel(nextModel);
    } finally {
      setIsUpdatingModel(false);
    }
  }, [controller, isUpdatingModel]);

  const activeAskQuestion = pendingAskUserInput
    && effectiveAskOverlayState
    && effectiveAskOverlayState.toolCallId === pendingAskUserInput.toolCallId
    ? pendingAskUserInput.questions[effectiveAskOverlayState.currentQuestionIndex]
    : null;
  const activeAskAnswers = activeAskQuestion && effectiveAskOverlayState
    ? effectiveAskOverlayState.answers[effectiveAskOverlayState.currentQuestionIndex] || []
    : [];
  const canContinueAsk = activeAskAnswers.length > 0;
  const liveStatusLabel = thinkingLabels[thinkingLabelIndex] || "Working on it…";
  const headerTone: AssistantSurfaceTone = chromeStyle === "elevated" ? "default" : chromeStyle === "flat" ? "flat" : "subtle";
  const composerTone: AssistantSurfaceTone = chromeStyle === "flat" ? "flat" : chromeStyle === "subtle" ? "subtle" : "default";
  const showInlineStatus = statusPlacement === "inline" && isConversationBusy;
  const showComposerStatus = statusPlacement === "composer" && isConversationBusy;
  const resolvedHeaderBadge = badge === undefined
    ? <LemmaMarkIcon className="lemma-assistant-experience-header-badge-icon" />
    : badge;

  return (
    <div
      className="lemma-assistant-experience"
      data-chrome-style={chromeStyle}
      data-status-placement={statusPlacement}
      data-radius={radius}
      data-show-model-picker={showModelPicker ? "true" : "false"}
      data-busy={isConversationBusy ? "true" : "false"}
      data-has-plan={planSummary ? "true" : "false"}
      data-has-pending-files={controller.pendingFiles.length > 0 ? "true" : "false"}
      data-show-conversation-list={showConversationList ? "true" : "false"}
    >
      {showConversationList ? (
        <aside className="lemma-assistant-experience-sidebar">
          <div className="lemma-assistant-experience-sidebar-header">
            <div className="lemma-assistant-experience-sidebar-header-row">
              <div className="lemma-assistant-experience-sidebar-copy">
                <div className="lemma-assistant-experience-sidebar-title">Conversations</div>
                <div className="lemma-assistant-experience-sidebar-meta">
                  {controller.conversations.length} total
                </div>
              </div>
              {showNewConversationButton ? (
                <button
                  type="button"
                  onClick={controller.clearMessages}
                  className="lemma-assistant-experience-sidebar-new"
                >
                  New
                </button>
              ) : null}
            </div>
          </div>
          <div className="lemma-assistant-experience-sidebar-items">
            {controller.conversations.map((conversation) => {
              const isActive = conversation.id === controller.activeConversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => controller.selectConversation(conversation.id)}
                  className={cn(
                    "lemma-assistant-experience-sidebar-item",
                    isActive && "lemma-assistant-experience-sidebar-item-active",
                  )}
                >
                  <div className="lemma-assistant-experience-sidebar-item-title">
                    {renderConversationLabel({ conversation, isActive })}
                  </div>
                  <div className="lemma-assistant-experience-sidebar-item-status">
                    {(conversation.status || "waiting").toLowerCase()}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      ) : null}

      <div className="lemma-assistant-experience-main">
        <div className="lemma-assistant-experience-card">
          <AssistantHeader
            className="lemma-assistant-experience-header"
            tone={headerTone}
            title={title}
            subtitle={subtitle}
            badge={resolvedHeaderBadge}
            controls={showModelPicker || showNewConversationButton ? (
              <>
                {showModelPicker ? (
                  <AssistantModelPicker
                    value={controller.conversationModel}
                    options={availableModels}
                    getOptionLabel={(model) => availableModelLabels.get(model) ?? model}
                    onChange={(nextModel) => { void handleModelChange(nextModel); }}
                    disabled={isConversationBusy || isUpdatingModel}
                    autoLabel="Auto"
                    className="lemma-assistant-experience-model-picker"
                  />
                ) : null}
                {showNewConversationButton ? (
                  <button
                    type="button"
                    onClick={controller.clearMessages}
                    title="New conversation"
                    className="lemma-assistant-experience-new"
                  >
                    ↺
                  </button>
                ) : null}
              </>
            ) : undefined}
          />

          <AssistantMessageViewport
            className="lemma-assistant-experience-viewport"
            ref={messagesContainerRef}
            onScroll={updatePinnedState}
          >
            <div className="lemma-assistant-experience-live-region" aria-live="polite" aria-atomic="false">
            {controller.messages.length === 0 && !isConversationBusy ? (
              emptyState || (
                <EmptyState
                  onSendMessage={(message) => { void handleSuggestionSend(message); }}
                  suggestions={emptyStateSuggestions}
                />
              )
            ) : null}

            {(controller.isLoadingMessages && controller.messages.length === 0) ? (
              <div className="lemma-assistant-experience-loading">
                <span className="lemma-assistant-experience-loading-text">Loading…</span>
              </div>
            ) : null}

            {(controller.isLoadingOlderMessages && controller.messages.length > 0) ? (
              <div className="lemma-assistant-experience-loading-older">
                <span className="lemma-assistant-experience-loading-older-text">Loading older…</span>
              </div>
            ) : null}

            {displayMessageRows.map((row, index) => {
              const previousRow = index > 0 ? displayMessageRows[index - 1] : null;
              const showAssistantHeader =
                row.message.role !== "assistant"
                  ? false
                  : previousRow?.message.role !== "assistant";
              const includesLastRawMessage = row.sourceIndexes.includes(controller.messages.length - 1);

              return (
                <MessageGroup
                  key={row.id || index}
                  message={row.message}
                  onNavigateResource={onNavigateResource}
                  onWidgetSendPrompt={handleWidgetSendPrompt}
                  conversationId={controller.activeConversationId}
                  isStreaming={isConversationBusy && includesLastRawMessage && row.message.role === "assistant"}
                  showAssistantHeader={showAssistantHeader}
                  renderMessageContent={renderMessageContent}
                  renderPresentedFile={renderPresentedFile}
                  renderToolInvocation={renderToolInvocation}
                />
              );
            })}

            {showInlineStatus ? (
              <div className="lemma-assistant-experience-inline-status">
                <div
                  className="lemma-assistant-experience-inline-status-pill"
                  data-has-content={lastMessageHasContent ? "true" : "false"}
                >
                  <AssistantStatusPill
                    label={liveStatusLabel}
                    subtle={lastMessageHasContent}
                  />
                </div>
              </div>
            ) : null}

            {controller.error ? (
              <div className="lemma-assistant-experience-error">
                <div>
                  <p className="lemma-assistant-experience-error-title">Something went wrong</p>
                  <p className="lemma-assistant-experience-error-copy">
                    {controller.error instanceof Error ? controller.error.message : String(controller.error)}
                  </p>
                </div>
              </div>
            ) : null}

            {showScrollToBottom ? (
              <button
                type="button"
                onClick={() => scrollToLatest("smooth")}
                className="lemma-assistant-scroll-to-bottom"
                aria-label="Scroll to latest messages"
                title="Scroll to latest messages"
              >
                ↓
              </button>
            ) : null}
            {(controller.messages.length > 0 || isConversationBusy || !!controller.error) ? (
              <div aria-hidden="true" className="lemma-assistant-experience-bottom-spacer" />
            ) : null}
            <div ref={bottomAnchorRef} aria-hidden="true" className="lemma-assistant-experience-bottom-anchor" />
            </div>
          </AssistantMessageViewport>
        </div>

        <AssistantComposer
          className="lemma-assistant-experience-composer"
          tone={composerTone}
          floating={planSummary ? (
            isPlanHidden ? (
              <button
                type="button"
                onClick={() => setIsPlanHidden(false)}
                className="lemma-assistant-experience-plan-button"
              >
                Show plan ({planSummary.completedCount}/{planSummary.steps.length})
              </button>
            ) : (
              <PlanSummaryStrip
                plan={planSummary}
                onHide={() => setIsPlanHidden(true)}
              />
            )
          ) : undefined}
          status={showComposerStatus ? (
            <AssistantStatusPill label={liveStatusLabel} subtle />
          ) : undefined}
          pendingFiles={controller.pendingFiles.length > 0 ? (
            <>
              {controller.pendingFiles.map((file) => {
                const fileKey = `${file.name}:${file.size}:${file.lastModified}`;
                return (
                  <div key={fileKey}>
                    {renderPendingFile({
                      file,
                      remove: () => controller.removePendingFile(fileKey),
                    })}
                  </div>
                );
              })}
            </>
          ) : undefined}
        >
          {activeAskQuestion && effectiveAskOverlayState && pendingAskUserInput ? (
            <AssistantAskOverlay
              questionNumber={effectiveAskOverlayState.currentQuestionIndex + 1}
              totalQuestions={pendingAskUserInput.questions.length}
              question={activeAskQuestion.question}
              options={activeAskQuestion.options}
              selectedOptions={activeAskAnswers}
              canContinue={canContinueAsk}
              continueLabel={effectiveAskOverlayState.currentQuestionIndex >= pendingAskUserInput.questions.length - 1 ? "Use answers" : "Continue"}
              onSelectOption={updateAskAnswer}
              onContinue={activeAskQuestion.type !== "single_select" || pendingAskUserInput.questions.length > 1 ? continueAskQuestions : undefined}
              onSkip={() => dismissAskOverlay(effectiveAskOverlayState.toolCallId)}
              mode={activeAskQuestion.type}
            />
          ) : (
            <div className="lemma-assistant-experience-composer-body">
              <div className="lemma-assistant-experience-input-row">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="lemma-assistant-experience-file-input"
                  onChange={(event) => { void handleUploadSelection(event.target.files); }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isConversationBusy || controller.isUploadingFiles}
                  className="lemma-assistant-experience-upload"
                  data-disabled={isConversationBusy || controller.isUploadingFiles ? "true" : "false"}
                  title="Upload files"
                >
                  {controller.isUploadingFiles ? "…" : "＋"}
                </button>
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="lemma-assistant-experience-textarea"
                  rows={1}
                  disabled={isConversationBusy}
                />
                <div className="lemma-assistant-experience-send-wrap">
                  <button
                    onClick={isConversationBusy ? controller.stop : () => { void handleSubmit(); }}
                    disabled={!isConversationBusy && !draft.trim()}
                    className="lemma-assistant-experience-send"
                    data-state={isConversationBusy ? "busy" : draft.trim() ? "ready" : "idle"}
                    aria-label={isConversationBusy ? "Stop generating" : "Send message"}
                    title={isConversationBusy ? "Stop generating" : "Send message"}
                  >
                    {isConversationBusy ? "■" : "→"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </AssistantComposer>
      </div>
    </div>
  );
}
