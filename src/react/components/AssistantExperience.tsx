import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AvailableModels, type ConversationModel } from "../../types.js";
import type {
  AssistantMessagePart,
  AssistantRenderableMessage,
  AssistantToolInvocation,
} from "../useAssistantController.js";
import type {
  AssistantControllerView,
  AssistantConversationRenderArgs,
  AssistantMessageRenderArgs,
  AssistantPendingFileRenderArgs,
  AssistantPresentedFileRenderArgs,
  AssistantToolRenderArgs,
} from "./assistant-types.js";
import {
  AssistantAskOverlay,
  AssistantMessageViewport,
} from "./AssistantChrome.js";

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

export interface AssistantExperienceViewProps {
  controller: AssistantControllerView;
  title?: ReactNode;
  subtitle?: ReactNode;
  placeholder?: string;
  emptyState?: ReactNode;
  draft?: string;
  onDraftChange?: (value: string) => void;
  showConversationList?: boolean;
  onNavigateResource?: (resourceType: string, resourceId: string, meta?: Record<string, unknown>) => void;
  renderConversationLabel?: (args: AssistantConversationRenderArgs) => ReactNode;
  renderMessageContent?: (args: AssistantMessageRenderArgs) => ReactNode;
  renderPresentedFile?: (args: AssistantPresentedFileRenderArgs) => ReactNode;
  renderPendingFile?: (args: AssistantPendingFileRenderArgs) => ReactNode;
  renderToolInvocation?: (args: AssistantToolRenderArgs) => ReactNode;
}

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
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

function formatActiveToolSummary(toolName: string, args: ToolCardArgs): string {
  const lowerName = toolName.toLowerCase();

  if (lowerName === "exec_command") {
    const comment = commentLabelFromArgs(args);
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

function defaultMessageContent({ message }: AssistantMessageRenderArgs): ReactNode {
  return <div className="whitespace-pre-wrap">{message.content}</div>;
}

function defaultPresentedFile({ filepath }: AssistantPresentedFileRenderArgs): ReactNode {
  return (
    <div className="rounded-2xl border border-[color:color-mix(in_srgb,_var(--border-default)_78%,_transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg-surface)_96%,transparent),color-mix(in_srgb,var(--bg-canvas)_76%,transparent))] px-3 py-2.5">
      <div className="text-[14px] font-medium text-[var(--text-primary)]">{fileNameFromPath(filepath)}</div>
      <div className="mt-1 text-[12px] text-[var(--text-tertiary)]">{filepath}</div>
    </div>
  );
}

function defaultPendingFile({ file, remove }: AssistantPendingFileRenderArgs): ReactNode {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[var(--bg-subtle)] px-2 py-1 text-[11px] text-[var(--text-secondary)]">
      <span className="truncate max-w-[180px]">{file.name}</span>
      <button
        type="button"
        onClick={remove}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-[var(--bg-canvas)]"
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
    <div className="rounded-xl border border-[color:color-mix(in_srgb,_var(--brand-primary)_24%,_var(--border-subtle))] bg-[color:color-mix(in_srgb,_var(--brand-glow)_18%,_var(--bg-surface))] px-3 py-2.5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2">
          <span className="text-[12px] font-semibold text-[var(--text-primary)]">Task plan</span>
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {plan.completedCount}/{plan.steps.length} complete
          </span>
          {plan.inProgressCount > 0 ? (
            <span className="rounded-full bg-[color:color-mix(in_srgb,_var(--brand-primary)_16%,_transparent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--brand-primary)]">
              {plan.inProgressCount} active
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onHide}
          className="text-[11px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Hide
        </button>
      </div>

      {plan.activeStep ? (
        <div className="mt-1.5 truncate text-[11px] text-[var(--text-secondary)]" title={plan.activeStep}>
          {plan.running ? "Running:" : "Current:"} {plan.activeStep}
        </div>
      ) : null}

      <div className="mt-2 space-y-1">
        {visibleSteps.map((step, index) => (
          <div key={`${step.step}-${index}`} className="flex items-start gap-2 text-[11px]">
            <span className={cx(
              "mt-1 inline-block h-2 w-2 shrink-0 rounded-full",
              step.status === "completed" && "bg-[var(--state-success)]",
              step.status === "in_progress" && "bg-[var(--brand-primary)]",
              step.status === "pending" && "bg-[var(--border-default)]",
            )} />
            <span className={cx(
              "leading-5",
              step.status === "completed" && "text-[var(--text-tertiary)] line-through",
              step.status === "in_progress" && "text-[var(--brand-primary)] font-medium",
              step.status === "pending" && "text-[var(--text-secondary)]",
            )}>
              {step.step}
            </span>
          </div>
        ))}
        {plan.steps.length > 5 ? (
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="text-[10px] font-medium text-[var(--brand-primary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {showAll ? "Show less" : `See all ${plan.steps.length} steps`}
            </button>
            {!showAll && hiddenCount > 0 ? (
              <span className="text-[10px] text-[var(--text-tertiary)]">+{hiddenCount} more</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ThinkingIndicator() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 350);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="px-1 animate-in fade-in duration-300">
      <div className="inline-flex items-center gap-2.5 text-[12px] leading-5 text-[var(--text-tertiary)]">
        <span className="inline-flex h-2 w-2 rounded-full bg-[var(--brand-accent)]" />
        <span className="font-semibold text-transparent bg-clip-text bg-[linear-gradient(110deg,var(--text-secondary),35%,var(--brand-accent),50%,var(--text-secondary),65%)] bg-[length:250%_100%] animate-pulse">
          Thinking...
        </span>
      </div>
    </div>
  );
}

export function EmptyState({ onSendMessage }: { onSendMessage: (msg: string) => void }) {
  const suggestions = [
    { text: "Create an agent that summarizes documents", icon: "🤖" },
    { text: "Add a table for tracking leads", icon: "📊" },
    { text: "Create a full React desk page for an executive dashboard", icon: "🧩" },
    { text: "Create a flow to process emails", icon: "⚡" },
  ];

  return (
    <div className="text-center py-5 px-2">
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-secondary))] shadow-[var(--shadow-xs)]">
          <span className="text-[var(--text-on-brand)] text-lg">✨</span>
        </div>
        <h4 className="font-semibold text-[var(--text-primary)] text-[15px]">What can I help you build?</h4>
        <p className="text-[13px] text-[var(--text-tertiary)] mt-1.5 max-w-sm leading-relaxed">
          I can create agents, set up data stores, build pages, and automate workflows for your pod.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-[500px] mx-auto">
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.text}-${index}`}
            onClick={() => onSendMessage(suggestion.text)}
            className="text-left px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)] hover:border-[color:color-mix(in_srgb,_var(--brand-accent)_52%,_var(--border-subtle))] hover:bg-[color:color-mix(in_srgb,_var(--brand-glow)_72%,_var(--bg-surface))] hover:text-[var(--text-primary)] transition-all duration-200 flex items-center gap-2.5 group"
          >
            <span className="text-base opacity-70 group-hover:opacity-100 transition-opacity">{suggestion.icon}</span>
            <span className="flex-1 leading-snug">{suggestion.text}</span>
            <span className="text-[var(--text-tertiary)] group-hover:text-[var(--state-warning)] group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100">›</span>
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
    <details className="group" open={isStreaming}>
      <summary className="list-none cursor-pointer inline-flex items-center gap-1.5 text-[12px] leading-5 text-[var(--text-tertiary)]">
        <span className="transition-transform group-open:rotate-90">›</span>
        <span className={cx(
          "font-semibold",
          isStreaming && "text-transparent bg-clip-text bg-[linear-gradient(110deg,var(--text-secondary),35%,var(--brand-accent),50%,var(--text-secondary),65%)] bg-[length:250%_100%] animate-pulse",
        )}>
          {isStreaming ? "Thinking" : `Thought${durationMs ? ` · ${Math.max(1, Math.round(durationMs / 1000))}s` : ""}`}
        </span>
      </summary>
      <div className="mt-1 pl-4 border-l border-[var(--border-default)]">
        <pre className="text-[11px] leading-5 text-[var(--text-tertiary)] whitespace-pre-wrap font-mono">{text}</pre>
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
    <div className="pt-1 space-y-2">
      {filepaths.map((filepath) => (
        <div key={`present-file-${filepath}`}>
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
  const canNavigate =
    state === "result"
    && resultData.success !== false
    && typeof resultData.resourceType === "string"
    && typeof resultData.resourceId === "string";

  if (renderToolInvocation) {
    return (
      <div className="pl-4 border-l border-[var(--border-default)]">
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
    <div className="pl-4 border-l border-[var(--border-default)] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-[var(--text-secondary)]">{formatToolDisplayName(toolName)}</div>
        {canNavigate && onNavigateResource ? (
          <button
            type="button"
            onClick={() => onNavigateResource(resultData.resourceType as string, resultData.resourceId as string, resultData)}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--state-success)] hover:text-[var(--state-success)] transition-colors"
          >
            Open ›
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-tertiary)] mb-1">Input</div>
          <div className="p-2 rounded bg-[color:color-mix(in_srgb,_var(--bg-canvas)_70%,_transparent)] font-mono text-[11px] max-h-24 overflow-auto">
            <pre className="text-[var(--text-secondary)] whitespace-pre-wrap">{JSON.stringify(args, null, 2)}</pre>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-tertiary)] mb-1">Output</div>
          <div className="p-2 rounded bg-[color:color-mix(in_srgb,_var(--bg-canvas)_70%,_transparent)] font-mono text-[11px] max-h-24 overflow-auto">
            <pre className="text-[var(--text-secondary)] whitespace-pre-wrap">
              {Object.keys(resultData).length > 0 ? JSON.stringify(resultData, null, 2) : "No output yet"}
            </pre>
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
}: {
  invocation: AssistantToolInvocation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const resultData = (invocation.result || {}) as ToolCardResult;
  const isExecuting = invocation.state !== "result";
  const isComplete = invocation.state === "result" && resultData.success !== false;
  const isFailed = invocation.state === "result" && resultData.success === false;
  const summary = isExecuting
    ? formatActiveToolSummary(invocation.toolName, invocation.args)
    : isFailed
      ? (typeof resultData.error === "string" ? resultData.error : "Tool failed")
      : (formatToolResultSummary(invocation.toolName, invocation.args, resultData) || "Completed");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full text-left inline-flex items-center gap-1.5 text-[12px] leading-5 transition-colors hover:text-[var(--text-primary)]",
        isExecuting && "text-[var(--state-info)]",
        isComplete && "text-[var(--state-success)]",
        isFailed && "text-[var(--state-error)]",
        !isExecuting && !isComplete && !isFailed && "text-[var(--text-secondary)]",
      )}
    >
      <span className="font-medium whitespace-nowrap">{formatToolDisplayName(invocation.toolName)}</span>
      <span className="text-current/80 truncate">{summary}</span>
      <span className="ml-auto transition-transform">{isSelected ? "⌄" : "›"}</span>
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

  const activeInvocation = [...toolParts]
    .reverse()
    .find((part) => part.toolInvocation.state !== "result")
    ?.toolInvocation;
  const failedCount = toolParts.filter((part) => (
    part.toolInvocation.state === "result" && part.toolInvocation.result?.success === false
  )).length;
  const isWorking = !!activeInvocation || reasoningParts.some((part) => part.state === "streaming");
  const summary = activeInvocation
    ? formatActiveToolSummary(activeInvocation.toolName, activeInvocation.args)
    : `Worked across ${toolParts.length} tool${toolParts.length === 1 ? "" : "s"}${failedCount > 0 ? ` · ${failedCount} failed` : ""}`;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-[12px] leading-5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <span className={cx("transition-transform", isExpanded && "rotate-90")}>›</span>
        {isWorking ? <span className="inline-flex h-2 w-2 rounded-full bg-[var(--brand-accent)]" /> : null}
        <span className={cx("text-[var(--text-secondary)]", isWorking && "font-medium")}>{summary}</span>
      </button>

      {isExpanded ? (
        <div className="pl-4 border-l border-[var(--border-default)] space-y-1.5">
          {detailParts.map((part) => {
            if (part.type === "reasoning") {
              return (
                <div
                  key={`thinking-${part.id}`}
                  className="rounded-md bg-[var(--bg-canvas)] px-2.5 py-2"
                >
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    {part.state === "streaming" ? "Thinking" : "Thought"}
                  </div>
                  <pre className="text-[11px] leading-5 text-[var(--text-secondary)] whitespace-pre-wrap font-mono max-h-40 overflow-auto">
                    {part.text}
                  </pre>
                </div>
              );
            }

            const invocation = part.toolInvocation;
            const isSelected = activeToolCallId === invocation.toolCallId;
            return (
              <div key={part.id} className="space-y-1">
                <InlineToolCall
                  invocation={invocation}
                  isSelected={isSelected}
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
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold text-[var(--state-info)]">{displayName}</div>
        <span className={cx(
          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
          isExecuting && "bg-[color:color-mix(in_srgb,_var(--state-info)_16%,_transparent)] text-[var(--state-info)]",
          isFailed && "bg-[color:color-mix(in_srgb,_var(--state-error)_12%,_transparent)] text-[var(--state-error)]",
          !isExecuting && !isFailed && "bg-[color:color-mix(in_srgb,_var(--state-success)_12%,_transparent)] text-[var(--state-success)]",
        )}>
          {isExecuting ? "Rendering" : isFailed ? "Failed" : "Ready"}
        </span>
      </div>

      {isFailed ? (
        <p className="text-[11px] text-[var(--state-error)]">
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
          className="w-full border-0 bg-transparent rounded-xl"
        />
      ) : null}

      {!isFailed && !payload ? (
        <p className="text-[11px] text-[var(--text-secondary)]">
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

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72ch] rounded-xl bg-[var(--brand-primary)] text-[var(--text-on-brand)] px-3.5 py-2.5">
          {renderMessageContent({
            message: {
              ...message,
              content: message.content,
              parts: undefined,
              toolInvocations: undefined,
            },
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="px-1 py-0.5 space-y-1.5 max-w-[78ch]">
      {showAssistantHeader ? (
        <div className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:color-mix(in_srgb,_var(--brand-primary)_40%,_transparent)]" />
          Lemma
        </div>
      ) : null}

      <div className="space-y-2">
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
              <div key={part.id} className="text-[13px] text-[var(--text-secondary)] leading-6">
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
  placeholder = "Message Lemma Assistant",
  emptyState,
  draft: controlledDraft,
  onDraftChange,
  showConversationList = false,
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPinnedToBottomRef = useRef(true);
  const loadingOlderFromScrollRef = useRef(false);
  const isConversationBusy = controller.isLoading || controller.isActiveConversationRunning;

  const availableModels = useMemo(
    () => Object.values(AvailableModels) as ConversationModel[],
    [],
  );

  const resizeComposer = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const minHeight = 48;
    const maxHeight = 220;

    textarea.style.height = "0px";
    const nextHeight = Math.min(maxHeight, Math.max(minHeight, textarea.scrollHeight));
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });
    isPinnedToBottomRef.current = true;
  }, []);

  const updatePinnedState = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isPinnedToBottomRef.current = distanceFromBottom <= 112;

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
        scrollToLatest(isConversationBusy ? "auto" : "smooth");
      });
    }
  }, [controller.messages, isConversationBusy, scrollToLatest]);

  useEffect(() => {
    resizeComposer();
  }, [draft, resizeComposer]);

  const displayMessageRows = useMemo(() => buildDisplayMessageRows(controller.messages), [controller.messages]);
  const activeToolBanner = useMemo(() => getActiveToolBanner(controller.messages), [controller.messages]);
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

  const handleUploadSelection = useCallback(async (files: FileList | null) => {
    const selectedFiles = files ? Array.from(files) : [];
    if (selectedFiles.length === 0) return;

    try {
      await controller.uploadFiles(selectedFiles);
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

  return (
    <div className={cx(
      "flex h-full min-h-0 flex-col gap-3 font-sans antialiased",
      showConversationList && "lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-3",
    )}>
      {showConversationList ? (
        <aside className="hidden min-h-0 overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,_var(--border-default)_80%,_transparent)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] lg:flex lg:flex-col">
          <div className="border-b border-[color:color-mix(in_srgb,_var(--border-default)_80%,_transparent)] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">Conversations</div>
                <div className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                  {controller.conversations.length} total
                </div>
              </div>
              <button
                type="button"
                onClick={controller.clearMessages}
                className="rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                New
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-2">
            {controller.conversations.map((conversation) => {
              const isActive = conversation.id === controller.activeConversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => controller.selectConversation(conversation.id)}
                  className={cx(
                    "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "border-[color:color-mix(in_srgb,_var(--brand-primary)_44%,_var(--border-default))] bg-[color:color-mix(in_srgb,_var(--brand-glow)_42%,_var(--bg-surface))]"
                      : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]",
                  )}
                >
                  <div className="text-[12px] font-medium text-[var(--text-primary)]">
                    {renderConversationLabel({ conversation, isActive })}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                    {(conversation.status || "waiting").toLowerCase()}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      ) : null}

      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,_var(--border-default)_80%,_transparent)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
          <div className="flex items-center justify-between border-b border-[color:color-mix(in_srgb,_var(--border-default)_80%,_transparent)] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-secondary))] flex items-center justify-center shadow-[var(--shadow-xs)]">
                <span className="text-[var(--text-on-brand)] text-xs">✨</span>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] text-[13px] leading-tight">{title}</h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <select
                value={controller.conversationModel || ""}
                onChange={(event) => { void handleModelChange(event.target.value || null); }}
                disabled={isConversationBusy || isUpdatingModel}
                className="h-8 rounded-full border border-[color:color-mix(in_srgb,_var(--border-default)_80%,_transparent)] bg-[var(--bg-surface)] px-3 text-[11px] text-[var(--text-secondary)]"
              >
                <option value="">Auto</option>
                {availableModels.map((availableModel) => (
                  <option key={availableModel} value={availableModel}>
                    {availableModel}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={controller.clearMessages}
                title="New conversation"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-secondary)]"
              >
                ↺
              </button>
            </div>
          </div>

          <AssistantMessageViewport
            className="min-h-[180px]"
            ref={messagesContainerRef}
            onScroll={updatePinnedState}
          >
            {controller.messages.length === 0 && !isConversationBusy ? (
              emptyState || <EmptyState onSendMessage={(message) => { void controller.sendMessage(message); }} />
            ) : null}

            {(controller.isLoadingMessages && controller.messages.length === 0) ? (
              <div className="flex justify-center py-6">
                <span className="text-[var(--text-tertiary)] text-sm">Loading…</span>
              </div>
            ) : null}

            {(controller.isLoadingOlderMessages && controller.messages.length > 0) ? (
              <div className="flex justify-center py-1">
                <span className="text-[var(--text-tertiary)] text-xs">Loading older…</span>
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

            {isConversationBusy && controller.messages.length > 0 && !activeToolBanner && !lastMessageHasContent ? (
              <ThinkingIndicator />
            ) : null}

            {controller.error ? (
              <div className="bg-[color:color-mix(in_srgb,_var(--state-error)_12%,_transparent)] border border-[color:color-mix(in_srgb,_var(--state-error)_48%,_var(--border-subtle))] rounded-lg p-3 text-xs text-[var(--state-error)] flex items-start gap-2.5">
                <div>
                  <p className="font-medium">Something went wrong</p>
                  <p className="text-[var(--state-error)] mt-1">{controller.error}</p>
                </div>
              </div>
            ) : null}
            {(controller.messages.length > 0 || isConversationBusy || !!controller.error) ? (
              <div aria-hidden="true" className="h-14 shrink-0" />
            ) : null}
          </AssistantMessageViewport>
        </div>

        <div className="relative rounded-2xl border border-[color:color-mix(in_srgb,_var(--border-default)_80%,_transparent)] bg-[var(--bg-surface)] p-2 shadow-[var(--shadow-md)]">
          {planSummary ? (
            <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20">
              {isPlanHidden ? (
                <button
                  type="button"
                  onClick={() => setIsPlanHidden(false)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  Show plan ({planSummary.completedCount}/{planSummary.steps.length})
                </button>
              ) : (
                <PlanSummaryStrip
                  plan={planSummary}
                  onHide={() => setIsPlanHidden(true)}
                />
              )}
            </div>
          ) : null}

          {isConversationBusy && activeToolBanner ? (
            <div className="px-2 pb-1">
              <div className="inline-flex max-w-full items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] animate-in fade-in duration-200">
                <span className="truncate">{activeToolBanner.summary}</span>
              </div>
            </div>
          ) : null}

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
            <div className="space-y-1.5">
              {controller.pendingFiles.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 px-1">
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
                </div>
              ) : null}
              <div className="relative flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => { void handleUploadSelection(event.target.files); }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isConversationBusy || controller.isUploadingFiles}
                  className={cx(
                    "mb-1.5 ml-1 h-9 w-9 rounded-full flex items-center justify-center transition-colors",
                    isConversationBusy || controller.isUploadingFiles
                      ? "bg-[var(--bg-subtle)] text-[var(--text-tertiary)]"
                      : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-canvas)] hover:text-[var(--text-primary)]",
                  )}
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
                  className="flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-[14px] text-[var(--text-primary)] leading-6 focus:ring-0 focus:outline-none placeholder:text-[var(--text-tertiary)] min-h-[48px] max-h-[220px]"
                  rows={1}
                  disabled={isConversationBusy}
                />
                <div className="pb-1.5 pr-1.5">
                  <button
                    onClick={isConversationBusy ? controller.stop : () => { void handleSubmit(); }}
                    disabled={!isConversationBusy && !draft.trim()}
                    className={cx(
                      "h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200",
                      isConversationBusy
                        ? "bg-[var(--text-primary)] text-[var(--text-inverse)] hover:bg-[color:color-mix(in_srgb,_var(--text-primary)_80%,_transparent)] hover:scale-105"
                        : draft.trim()
                          ? "bg-[var(--brand-primary)] text-[var(--text-on-brand)] shadow-[var(--shadow-xs)] hover:bg-[color:color-mix(in_srgb,_var(--brand-primary)_88%,_var(--text-primary))]"
                          : "bg-[var(--bg-subtle)] text-[var(--text-tertiary)]",
                    )}
                    title={isConversationBusy ? "Stop generating" : "Send message"}
                  >
                    {isConversationBusy ? "■" : "→"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
