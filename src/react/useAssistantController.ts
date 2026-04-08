import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LemmaClient } from "../client.js";
import type {
  AvailableModelInfo,
  Conversation,
  ConversationMessage,
  ConversationModel,
} from "../types.js";
import { useAssistantRuntime } from "./useAssistantRuntime.js";
import { useAssistantSession } from "./useAssistantSession.js";

export interface AssistantConversationScope {
  podId?: string | null;
  assistantName?: string | null;
  /**
   * @deprecated Use assistantName instead.
   */
  assistantId?: string | null;
  organizationId?: string | null;
}

export interface AssistantToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: "call" | "result";
  result?: Record<string, unknown>;
}

export type AssistantMessagePart =
  | {
      id: string;
      type: "text";
      text: string;
    }
  | {
      id: string;
      type: "reasoning";
      text: string;
      state?: "streaming" | "done";
      durationMs?: number;
      startedAtMs?: number;
    }
  | {
      id: string;
      type: "tool";
      toolInvocation: AssistantToolInvocation;
    };

export interface AssistantRenderableMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolInvocations?: AssistantToolInvocation[];
  parts?: AssistantMessagePart[];
  createdAt?: Date;
}

export interface AssistantAction {
  id: string;
  type: "tool_call" | "message" | "thinking";
  status: "pending" | "executing" | "completed" | "failed";
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  timestamp: Date;
}

export interface UseAssistantControllerOptions extends AssistantConversationScope {
  client: LemmaClient;
  enabled?: boolean;
}

export interface UseAssistantControllerResult {
  messages: AssistantRenderableMessage[];
  conversations: Conversation[];
  activeConversationId: string | null;
  availableModels: AvailableModelInfo[];
  conversationModel: ConversationModel | null;
  isActiveConversationRunning: boolean;
  isLoading: boolean;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isLoadingOlderMessages: boolean;
  hasOlderMessages: boolean;
  isUploadingFiles: boolean;
  pendingFiles: File[];
  error: string | null;
  pendingActions: AssistantAction[];
  completedActions: AssistantAction[];
  selectConversation: (conversationId: string | null) => void;
  setConversationModel: (model: ConversationModel | null) => Promise<void>;
  sendMessage: (content: string, options?: { forceNewConversation?: boolean }) => Promise<void>;
  uploadFiles: (files: File[], options?: { deferUntilSend?: boolean }) => Promise<void>;
  removePendingFile: (fileKey: string) => void;
  clearPendingFiles: () => void;
  loadOlderMessages: () => Promise<boolean>;
  clearMessages: () => void;
  stop: () => void;
}

interface AssistantMessageMetadata {
  tool_name?: string;
  message_type?: "tool_call" | "tool_return";
  tool_call_id?: string;
  args?: Record<string, unknown>;
  result?: {
    success?: boolean;
    message?: string;
    error?: string | null;
    [key: string]: unknown;
  };
}

type AssistantApiConversationMessage = ConversationMessage & {
  conversation_id?: string;
  metadata?: (Record<string, unknown> & AssistantMessageMetadata) | null;
  message_metadata?: AssistantMessageMetadata;
  tool_calls?: Record<string, unknown>[];
};

const EMPTY_SCOPE_KEY = JSON.stringify({
  podId: null,
  assistantName: null,
  assistantId: null,
  organizationId: null,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function stringifyContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const text = value
      .map((entry) => extractTextFromStructuredContentEntry(entry))
      .filter((entry) => entry.length > 0)
      .join("\n\n")
      .trim();
    if (text.length > 0) return text;
    return "";
  }
  if (!isRecord(value)) return "";

  const direct = value.content;
  if (typeof direct === "string") return direct;
  if (Array.isArray(direct)) {
    const text = direct
      .map((entry) => extractTextFromStructuredContentEntry(entry))
      .filter((entry) => entry.length > 0)
      .join("\n\n")
      .trim();
    if (text.length > 0) return text;
  }
  const text = value.text;
  if (typeof text === "string") return text;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

function parseMaybeJsonObject(value: unknown): Record<string, unknown> {
  if (isRecord(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function parseMaybeJsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function extractTextFromStructuredContentEntry(entry: unknown): string {
  if (typeof entry === "string") return entry.trim();
  if (!isRecord(entry)) return "";

  if (typeof entry.text === "string") return entry.text.trim();
  if (typeof entry.content === "string") return entry.content.trim();
  if (typeof entry.value === "string") return entry.value.trim();

  if (Array.isArray(entry.content)) {
    const nested = entry.content
      .map((child) => extractTextFromStructuredContentEntry(child))
      .filter((text) => text.length > 0)
      .join("\n")
      .trim();
    if (nested.length > 0) return nested;
  }

  if (Array.isArray(entry.summary)) {
    const summary = entry.summary
      .map((child) => extractTextFromStructuredContentEntry(child))
      .filter((text) => text.length > 0)
      .join("\n")
      .trim();
    if (summary.length > 0) return summary;
  }

  return "";
}

function parseTimestampMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const timestamp = new Date(value).getTime();
    if (Number.isFinite(timestamp) && timestamp > 0) {
      return timestamp;
    }
  }
  return null;
}

function parseDurationMs(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }
  return undefined;
}

function getFileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function parseThinkingDurationFromRecord(record: Record<string, unknown>): number | undefined {
  return parseDurationMs(record.duration_ms)
    ?? parseDurationMs(record.durationMs)
    ?? parseDurationMs(record.elapsed_ms)
    ?? parseDurationMs(record.elapsedMs)
    ?? parseDurationMs(record.thought_duration_ms)
    ?? parseDurationMs(record.thoughtDurationMs);
}

function extractThinkingPartFromContent(content: unknown): {
  text: string;
  state: "streaming" | "done";
  durationMs?: number;
} | null {
  if (!isRecord(content)) return null;

  const rawType = typeof content.type === "string" ? content.type.toLowerCase() : "";
  if (rawType !== "thinking" && rawType !== "reasoning") {
    return null;
  }

  const text = extractTextFromStructuredContentEntry(
    content.content ?? content.text ?? content.value ?? content.summary,
  );
  if (!text) return null;

  const stateValue = [content.state, content.status, content.phase]
    .find((value) => typeof value === "string") as string | undefined;
  const normalizedState = stateValue?.toLowerCase() || "";
  const isStreaming = normalizedState.includes("stream")
    || normalizedState.includes("progress")
    || normalizedState.includes("running")
    || normalizedState.includes("thinking");

  return {
    text,
    state: isStreaming ? "streaming" : "done",
    durationMs: parseThinkingDurationFromRecord(content),
  };
}

function normalizeToolResult(value: unknown): Record<string, unknown> {
  if (isRecord(value)) return value;
  if (Array.isArray(value)) return { output: value };
  if (typeof value === "undefined" || value === null) return {};
  return { output: value };
}

function getMessageMetadata(msg: AssistantApiConversationMessage): AssistantMessageMetadata | undefined {
  return (msg.message_metadata || msg.metadata || undefined) as AssistantMessageMetadata | undefined;
}

function getNativeToolPayload(content: unknown): {
  kind: "call" | "result";
  toolCallId: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
} | null {
  if (!isRecord(content)) return null;

  const toolCallId = typeof content.tool_call_id === "string" ? content.tool_call_id : null;
  if (!toolCallId) return null;

  const toolName = typeof content.tool_name === "string" ? content.tool_name : undefined;

  if (typeof content.tool_name === "string") {
    return {
      kind: "call",
      toolCallId,
      toolName,
      args: parseMaybeJsonObject(parseMaybeJsonValue(content.tool_input)),
    };
  }

  if ("tool_output" in content) {
    return {
      kind: "result",
      toolCallId,
      toolName,
      result: normalizeToolResult(content.tool_output),
    };
  }

  return null;
}

function hasNativeToolPayloadContent(content: unknown): boolean {
  return getNativeToolPayload(content) !== null;
}

function toolInvocationKey(tool: AssistantToolInvocation): string {
  return `${tool.toolCallId}:${tool.state}`;
}

function toolInvocationFromStructuredContentEntry(
  entry: Record<string, unknown>,
  fallbackId: string,
): AssistantToolInvocation | null {
  const type = typeof entry.type === "string" ? entry.type.toLowerCase() : "";
  const functionObj = isRecord(entry.function) ? entry.function : {};
  const hasToolShape = type.includes("tool")
    || type.includes("function_call")
    || type.includes("function_result")
    || typeof entry.tool_call_id === "string"
    || typeof entry.call_id === "string"
    || typeof entry.tool_name === "string"
    || typeof functionObj.name === "string"
    || "tool_output" in entry
    || ("result" in entry && typeof entry.call_id === "string");

  if (!hasToolShape) return null;

  const rawResult = entry.tool_output ?? entry.output ?? entry.result;
  const isResultLike = type.includes("result")
    || type.includes("output")
    || type.includes("return")
    || typeof rawResult !== "undefined";

  const toolCallId = (
    (typeof entry.tool_call_id === "string" && entry.tool_call_id)
    || (typeof entry.toolCallId === "string" && entry.toolCallId)
    || (typeof entry.call_id === "string" && entry.call_id)
    || (typeof entry.id === "string" && entry.id)
    || fallbackId
  );

  const toolName = (
    (typeof entry.tool_name === "string" && entry.tool_name)
    || (typeof entry.toolName === "string" && entry.toolName)
    || (typeof functionObj.name === "string" && functionObj.name)
    || (typeof entry.name === "string" && entry.name)
    || "tool"
  );

  const argsRaw = functionObj.arguments
    ?? entry.tool_input
    ?? entry.input
    ?? entry.args
    ?? entry.arguments;

  const state: AssistantToolInvocation["state"] = isResultLike ? "result" : "call";

  return {
    toolCallId,
    toolName,
    args: parseMaybeJsonObject(parseMaybeJsonValue(argsRaw)),
    state,
    ...(isResultLike ? { result: normalizeToolResult(rawResult) } : {}),
  };
}

function parseStructuredAssistantParts(content: unknown): {
  parts: AssistantMessagePart[];
  textContent: string;
  representedToolKeys: Set<string>;
} | null {
  if (!Array.isArray(content)) return null;

  const parts: AssistantMessagePart[] = [];
  const textChunks: string[] = [];
  const representedToolKeys = new Set<string>();

  content.forEach((rawPart, index) => {
    if (!isRecord(rawPart)) return;

    const partType = typeof rawPart.type === "string" ? rawPart.type.toLowerCase() : "";
    const partId = (typeof rawPart.id === "string" && rawPart.id) || `content-part-${index}`;

    const toolInvocation = toolInvocationFromStructuredContentEntry(rawPart, `${partId}-tool`);
    if (toolInvocation) {
      representedToolKeys.add(toolInvocationKey(toolInvocation));
      parts.push({
        id: `${partId}-tool`,
        type: "tool",
        toolInvocation,
      });
      return;
    }

    const text = extractTextFromStructuredContentEntry(rawPart);
    if (!text) return;

    if (partType.includes("reasoning") || partType.includes("thinking")) {
      const stateValue = [rawPart.state, rawPart.status, rawPart.phase]
        .find((value) => typeof value === "string") as string | undefined;
      const normalizedState = stateValue?.toLowerCase() || partType;
      const isStreaming = normalizedState.includes("stream")
        || normalizedState.includes("progress")
        || normalizedState.includes("running")
        || normalizedState.includes("thinking");
      parts.push({
        id: `${partId}-reasoning`,
        type: "reasoning",
        text,
        state: isStreaming ? "streaming" : "done",
        durationMs: parseThinkingDurationFromRecord(rawPart),
        startedAtMs:
          parseTimestampMs(rawPart.started_at)
          ?? parseTimestampMs(rawPart.startedAt)
          ?? parseTimestampMs(rawPart.created_at)
          ?? parseTimestampMs(rawPart.createdAt)
          ?? undefined,
      });
      return;
    }

    textChunks.push(text);
    parts.push({
      id: `${partId}-text`,
      type: "text",
      text,
    });
  });

  return {
    parts,
    textContent: textChunks.join("\n\n").trim(),
    representedToolKeys,
  };
}

function mapToolInvocations(msg: AssistantApiConversationMessage): AssistantToolInvocation[] {
  const invocations: AssistantToolInvocation[] = [];
  const metadata = getMessageMetadata(msg);
  const nativeToolPayload = getNativeToolPayload(msg.content);

  if (metadata?.message_type === "tool_call") {
    invocations.push({
      toolCallId: metadata.tool_call_id || `${msg.id}-tool-call`,
      toolName: metadata.tool_name || "tool",
      args: metadata.args || {},
      state: "call",
    });
  }

  if (metadata?.message_type === "tool_return") {
    invocations.push({
      toolCallId: metadata.tool_call_id || `${msg.id}-tool-result`,
      toolName: metadata.tool_name || "tool",
      args: metadata.args || {},
      state: "result",
      result: metadata.result as Record<string, unknown> | undefined,
    });
  }

  if (Array.isArray(msg.tool_calls)) {
    msg.tool_calls.forEach((rawTool, index) => {
      const tool = isRecord(rawTool) ? rawTool : {};
      const fn = isRecord(tool.function) ? tool.function : {};
      const toolName = (
        (typeof fn.name === "string" && fn.name)
        || (typeof tool.tool_name === "string" && tool.tool_name)
        || (typeof tool.name === "string" && tool.name)
        || "tool"
      );
      const argsRaw = fn.arguments ?? tool.args ?? tool.arguments ?? tool.input;
      invocations.push({
        toolCallId:
          (typeof tool.id === "string" && tool.id)
          || (typeof tool.tool_call_id === "string" && tool.tool_call_id)
          || `${msg.id}-tool-${index}`,
        toolName,
        args: parseMaybeJsonObject(argsRaw),
        state: "call",
      });
    });
  }

  if (nativeToolPayload?.kind === "call") {
    invocations.push({
      toolCallId: nativeToolPayload.toolCallId,
      toolName: nativeToolPayload.toolName || metadata?.tool_name || "tool",
      args: nativeToolPayload.args || metadata?.args || {},
      state: "call",
    });
  }

  if (nativeToolPayload?.kind === "result") {
    invocations.push({
      toolCallId: nativeToolPayload.toolCallId,
      toolName: nativeToolPayload.toolName || metadata?.tool_name || "tool",
      args: metadata?.args || {},
      state: "result",
      result: nativeToolPayload.result || {},
    });
  }

  const contentObj = isRecord(msg.content) ? (msg.content as Record<string, unknown>) : null;
  if (contentObj && nativeToolPayload === null && "tool_output" in contentObj) {
    invocations.push({
      toolCallId:
        (typeof contentObj.tool_call_id === "string" && contentObj.tool_call_id)
        || metadata?.tool_call_id
        || `${msg.id}-tool-output`,
      toolName:
        (typeof contentObj.tool_name === "string" && contentObj.tool_name)
        || metadata?.tool_name
        || "tool",
      args: metadata?.args || {},
      state: "result",
      result: normalizeToolResult(contentObj.tool_output),
    });
  }

  const seen = new Set<string>();
  return invocations.filter((invocation) => {
    const key = toolInvocationKey(invocation);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapConversationMessage(
  msg: AssistantApiConversationMessage,
  options?: { thinkingDurationMs?: number },
): AssistantRenderableMessage {
  const toolInvocations = mapToolInvocations(msg);
  const structured = parseStructuredAssistantParts(msg.content);
  const explicitThinkingPart = extractThinkingPartFromContent(msg.content);
  const createdAtMs = parseTimestampMs(msg.created_at) ?? undefined;
  const parts: AssistantMessagePart[] = structured
    ? structured.parts.map((part) => (
      part.type === "reasoning"
        ? {
            ...part,
            startedAtMs: part.startedAtMs ?? createdAtMs,
          }
        : part
    ))
    : [];
  const representedToolKeys = structured?.representedToolKeys || new Set<string>();
  let content = structured
    ? structured.textContent
    : (hasNativeToolPayloadContent(msg.content) ? "" : stringifyContent(msg.content));

  if (explicitThinkingPart) {
    content = "";
    parts.push({
      id: `${msg.id}-reasoning`,
      type: "reasoning",
      text: explicitThinkingPart.text,
      state: explicitThinkingPart.state,
      durationMs: explicitThinkingPart.durationMs ?? options?.thinkingDurationMs,
      startedAtMs: createdAtMs,
    });
  } else if (!structured && content.trim()) {
    parts.push({
      id: `${msg.id}-text`,
      type: "text",
      text: content,
    });
  }

  toolInvocations.forEach((toolInvocation, index) => {
    const key = toolInvocationKey(toolInvocation);
    if (representedToolKeys.has(key)) return;
    parts.push({
      id: `${msg.id}-tool-${index}`,
      type: "tool",
      toolInvocation,
    });
  });

  return {
    id: msg.id,
    role: msg.role === "user" ? "user" : "assistant",
    content,
    toolInvocations,
    parts,
    createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
  };
}

function mapConversationMessages(messages: AssistantApiConversationMessage[]): AssistantRenderableMessage[] {
  const mappedMessages: AssistantRenderableMessage[] = [];
  const pendingToolCalls = new Map<string, AssistantToolInvocation>();

  const estimateThinkingDurationMs = (index: number): number | undefined => {
    const message = messages[index];
    if (!message || !extractThinkingPartFromContent(message.content)) return undefined;

    const startedAtMs = parseTimestampMs(message.created_at);
    if (!startedAtMs) return undefined;

    for (let i = index + 1; i < messages.length; i += 1) {
      const nextCreatedAtMs = parseTimestampMs(messages[i]?.created_at);
      if (!nextCreatedAtMs || nextCreatedAtMs <= startedAtMs) continue;

      const durationMs = nextCreatedAtMs - startedAtMs;
      if (durationMs > 0 && durationMs <= 30 * 60 * 1000) {
        return durationMs;
      }
      break;
    }

    return undefined;
  };

  messages.forEach((rawMessage, index) => {
    const mappedMessage = mapConversationMessage(rawMessage, {
      thinkingDurationMs: estimateThinkingDurationMs(index),
    });

    mappedMessage.toolInvocations?.forEach((invocation) => {
      if (invocation.state === "call") {
        pendingToolCalls.set(invocation.toolCallId, invocation);
      }
    });

    const nativePayload = getNativeToolPayload(rawMessage.content);
    const isToolRole = rawMessage.role === "tool";

    if (isToolRole && nativePayload?.kind === "result" && mappedMessage.toolInvocations && mappedMessage.toolInvocations.length > 0) {
      let mergedIntoPriorCall = false;

      mappedMessage.toolInvocations.forEach((resultInvocation) => {
        if (resultInvocation.state !== "result") return;
        const pendingInvocation = pendingToolCalls.get(resultInvocation.toolCallId);
        if (!pendingInvocation) return;

        pendingInvocation.state = "result";
        pendingInvocation.result = resultInvocation.result || {};
        if (pendingInvocation.toolName === "tool" && resultInvocation.toolName !== "tool") {
          pendingInvocation.toolName = resultInvocation.toolName;
        }
        mergedIntoPriorCall = true;
      });

      if (mergedIntoPriorCall) {
        return;
      }
    }

    if (mappedMessage.toolInvocations) {
      mappedMessage.toolInvocations.forEach((invocation) => {
        if (invocation.state === "result") {
          const pendingInvocation = pendingToolCalls.get(invocation.toolCallId);
          if (pendingInvocation) {
            if ((invocation.toolName === "tool" || !invocation.toolName) && pendingInvocation.toolName) {
              invocation.toolName = pendingInvocation.toolName;
            }
            if (Object.keys(invocation.args).length === 0 && Object.keys(pendingInvocation.args).length > 0) {
              invocation.args = pendingInvocation.args;
            }
          }
        }
      });
    }

    mappedMessages.push(mappedMessage);
  });

  return mappedMessages;
}

function sortConversationsByUpdatedAt(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at).getTime();
    const bTime = new Date(b.updated_at || b.created_at).getTime();
    return bTime - aTime;
  });
}

function sortMessagesByCreatedAt(messages: AssistantApiConversationMessage[]): AssistantApiConversationMessage[] {
  return [...messages].sort((a, b) => {
    const aTime = Number.isFinite(new Date(a.created_at).getTime()) ? new Date(a.created_at).getTime() : 0;
    const bTime = Number.isFinite(new Date(b.created_at).getTime()) ? new Date(b.created_at).getTime() : 0;
    return aTime - bTime;
  });
}

function isConversationRunning(status: unknown): boolean {
  if (typeof status !== "string") return false;
  const normalized = status.trim().toLowerCase();
  if (!normalized) return false;
  if (
    normalized === "waiting"
    || normalized === "completed"
    || normalized === "failed"
    || normalized === "cancelled"
    || normalized === "stopped"
  ) {
    return false;
  }
  return true;
}

export function useAssistantController({
  client,
  podId,
  assistantName,
  assistantId,
  organizationId,
  enabled = true,
}: UseAssistantControllerOptions): UseAssistantControllerResult {
  const [localError, setLocalError] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantRenderableMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<AvailableModelInfo[]>([]);
  const [conversationModel, setConversationModelState] = useState<ConversationModel | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [olderMessagesCursor, setOlderMessagesCursor] = useState<string | null>(null);

  const activeConversationIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const suppressAutoSelectRef = useRef(false);
  const lastAutoLoadedConversationIdRef = useRef<string | null>(null);
  const loadingConversationIdRef = useRef<string | null>(null);
  const skipInitialLoadConversationIdsRef = useRef<Set<string>>(new Set());

  const scope = useMemo<AssistantConversationScope>(() => ({
    podId: podId ?? null,
    assistantName: assistantName ?? assistantId ?? null,
    assistantId: assistantId ?? null,
    organizationId: organizationId ?? null,
  }), [assistantId, assistantName, organizationId, podId]);

  const scopeKey = useMemo(
    () => JSON.stringify({
      podId: scope.podId ?? null,
      assistantName: scope.assistantName ?? null,
      assistantId: scope.assistantId ?? null,
      organizationId: scope.organizationId ?? null,
    }),
    [scope.assistantId, scope.assistantName, scope.organizationId, scope.podId],
  );

  const handleAssistantSessionError = useCallback((sessionError: unknown) => {
    setLocalError((prev) => prev || (sessionError instanceof Error ? sessionError.message : "Assistant session failed"));
  }, []);

  const assistantSession = useAssistantSession({
    client,
    podId: scope.podId ?? undefined,
    assistantName: scope.assistantName ?? undefined,
    assistantId: scope.assistantId ?? undefined,
    organizationId: scope.organizationId ?? undefined,
    conversationId: activeConversationId ?? undefined,
    autoLoad: false,
    onError: handleAssistantSessionError,
  });

  const {
    conversationId: sessionConversationId,
    listConversations: sessionListConversations,
    loadMessages: sessionLoadMessages,
    sendMessage: sessionSendMessage,
    createConversation: sessionCreateConversation,
    resumeIfRunning: sessionResumeIfRunning,
    stop: sessionStop,
    cancel: sessionCancel,
    isStreaming: sessionIsStreaming,
    messages: sessionMessages,
    streamingText: sessionStreamingText,
    status: sessionStatus,
  } = assistantSession;

  const {
    runtimeMessages,
    appendOptimisticUserMessage,
    replaceLoadedMessages,
    mergeMessages,
    clear: clearRuntimeMessages,
  } = useAssistantRuntime({
    conversationId: activeConversationId,
    sessionConversationId,
    sessionMessages,
  });

  const error = localError;
  const isLoading = isStreaming || sessionIsStreaming;

  const touchConversation = useCallback((conversationId: string, updates?: Partial<Conversation>) => {
    setConversations((prev) => {
      const now = new Date().toISOString();
      let found = false;
      const next = prev.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        found = true;
        return {
          ...conversation,
          ...updates,
          updated_at: updates?.updated_at || now,
        };
      });
      return found ? sortConversationsByUpdatedAt(next) : next;
    });
  }, []);

  const setConversationModel = useCallback(async (model: ConversationModel | null) => {
    setConversationModelState(model);

    const conversationId = activeConversationIdRef.current;
    if (!conversationId) return;

    const knownConversation = conversationsRef.current.find((conversation) => conversation.id === conversationId);
    const resolvedPodId = knownConversation?.pod_id ?? scope.podId;
    const previousModel = knownConversation?.model ?? null;

    touchConversation(conversationId, { model: model as Conversation["model"] });
    try {
      const updatedConversation = await client.conversations.update(
        conversationId,
        { model: model as never },
        { pod_id: resolvedPodId ?? undefined },
      );
      touchConversation(conversationId, {
        model: (updatedConversation.model ?? model) as Conversation["model"],
        updated_at: updatedConversation.updated_at,
      });
      setConversationModelState((updatedConversation.model ?? model) as ConversationModel | null);
    } catch (error) {
      touchConversation(conversationId, { model: previousModel });
      setConversationModelState(previousModel);
      throw error;
    }
  }, [client, scope.podId, touchConversation]);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const response = await sessionListConversations({ scope });
      const nextConversations = sortConversationsByUpdatedAt(response.items || []);
      setConversations(nextConversations);

      setActiveConversationId((current) => {
        if (current && nextConversations.some((conversation) => conversation.id === current)) {
          return current;
        }
        if (suppressAutoSelectRef.current) {
          return null;
        }
        return nextConversations[0]?.id ?? null;
      });
    } catch (err) {
      setLocalError((prev) => prev || (err instanceof Error ? err.message : "Failed to load conversations"));
    } finally {
      setIsLoadingConversations(false);
    }
  }, [scope, sessionListConversations]);

  const loadAvailableModels = useCallback(async (): Promise<AvailableModelInfo[]> => {
    try {
      const response = await client.conversations.listModels();
      return response.items ?? [];
    } catch {
      return [];
    }
  }, [client]);

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await sessionLoadMessages({
        conversationId,
        limit: 100,
      });
      if (activeConversationIdRef.current !== conversationId) {
        return;
      }
      const sorted = sortMessagesByCreatedAt((response.items || []) as AssistantApiConversationMessage[]);
      replaceLoadedMessages(sorted);
      setOlderMessagesCursor(response.next_page_token ?? null);
    } catch (err) {
      setLocalError((prev) => prev || (err instanceof Error ? err.message : "Failed to load messages"));
      setOlderMessagesCursor(null);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [replaceLoadedMessages, sessionLoadMessages]);

  const loadOlderMessages = useCallback(async (): Promise<boolean> => {
    const conversationId = activeConversationIdRef.current;
    const cursor = olderMessagesCursor;

    if (!conversationId || !cursor || isLoadingMessages || isLoadingOlderMessages) {
      return false;
    }

    setIsLoadingOlderMessages(true);
    try {
      const response = await sessionLoadMessages({
        conversationId,
        limit: 100,
        pageToken: cursor,
      });

      if (activeConversationIdRef.current !== conversationId) {
        return false;
      }

      const older = sortMessagesByCreatedAt((response.items || []) as AssistantApiConversationMessage[]);
      mergeMessages(older);
      setOlderMessagesCursor(response.next_page_token ?? null);
      return older.length > 0;
    } catch (err) {
      setLocalError((prev) => prev || (err instanceof Error ? err.message : "Failed to load older messages"));
      return false;
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [isLoadingMessages, isLoadingOlderMessages, mergeMessages, olderMessagesCursor, sessionLoadMessages]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (!enabled) {
      setAvailableModels([]);
      return;
    }

    let cancelled = false;
    void loadAvailableModels()
      .then((models) => {
        if (cancelled) return;
        setAvailableModels(models);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [enabled, loadAvailableModels]);

  useEffect(() => {
    const conversationId = activeConversationIdRef.current;
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const normalized = sortMessagesByCreatedAt(runtimeMessages as AssistantApiConversationMessage[])
      .filter((message) => message.conversation_id === conversationId);
    if (normalized.length === 0) {
      setMessages([]);
      return;
    }

    const nextMessages = mapConversationMessages(normalized);
    const pendingText = sessionStreamingText.trim();
    if (pendingText.length > 0) {
      const streamingId = `streaming-${conversationId}`;
      nextMessages.push({
        id: streamingId,
        role: "assistant",
        content: pendingText,
        createdAt: new Date(),
        parts: [{ id: `${streamingId}-text`, type: "text", text: pendingText }],
      });
    }

    setMessages(nextMessages);
  }, [runtimeMessages, sessionStreamingText]);

  useEffect(() => {
    if (!activeConversationId) return;
    if (!sessionStatus) return;

    touchConversation(activeConversationId, {
      status: sessionStatus.toLowerCase() as Conversation["status"],
    });
  }, [activeConversationId, sessionStatus, touchConversation]);

  useEffect(() => {
    if (!activeConversationId) return;
    const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
    if (!activeConversation) return;
    setConversationModelState(activeConversation.model ?? null);
  }, [activeConversationId, conversations]);

  useEffect(() => {
    if (!enabled) {
      sessionCancel();
      clearRuntimeMessages();
      suppressAutoSelectRef.current = false;
      activeConversationIdRef.current = null;
      lastAutoLoadedConversationIdRef.current = null;
      loadingConversationIdRef.current = null;
      skipInitialLoadConversationIdsRef.current.clear();
      setActiveConversationId(null);
      setAvailableModels([]);
      setConversationModelState(null);
      setConversations([]);
      setMessages([]);
      setLocalError(null);
      setOlderMessagesCursor(null);
      setIsLoadingConversations(false);
      setIsLoadingMessages(false);
      setIsLoadingOlderMessages(false);
      return;
    }

    suppressAutoSelectRef.current = false;
    activeConversationIdRef.current = null;
    lastAutoLoadedConversationIdRef.current = null;
    loadingConversationIdRef.current = null;
    skipInitialLoadConversationIdsRef.current.clear();
    setActiveConversationId(null);
    setConversationModelState(null);
    setConversations([]);
    setMessages([]);
    setLocalError(null);
    clearRuntimeMessages();
    setOlderMessagesCursor(null);
    if (scopeKey !== EMPTY_SCOPE_KEY) {
      void loadConversations();
    }
  }, [clearRuntimeMessages, enabled, loadConversations, scopeKey, sessionCancel]);

  useEffect(() => {
    if (!enabled || !activeConversationId) {
      clearRuntimeMessages();
      lastAutoLoadedConversationIdRef.current = null;
      loadingConversationIdRef.current = null;
      setMessages([]);
      setOlderMessagesCursor(null);
      return;
    }

    if (skipInitialLoadConversationIdsRef.current.has(activeConversationId)) {
      skipInitialLoadConversationIdsRef.current.delete(activeConversationId);
      lastAutoLoadedConversationIdRef.current = activeConversationId;
      return;
    }

    if (lastAutoLoadedConversationIdRef.current === activeConversationId) {
      return;
    }
    if (loadingConversationIdRef.current === activeConversationId) {
      return;
    }

    let cancelled = false;
    loadingConversationIdRef.current = activeConversationId;
    const loadConversation = async () => {
      setOlderMessagesCursor(null);
      await loadConversationMessages(activeConversationId);
      if (cancelled) return;
      lastAutoLoadedConversationIdRef.current = activeConversationId;
      try {
        await sessionResumeIfRunning(activeConversationId);
      } catch (error) {
        if (cancelled) return;
        setLocalError((prev) => prev || (error instanceof Error ? error.message : "Failed to resume conversation"));
      }
    };

    void loadConversation().finally(() => {
      if (loadingConversationIdRef.current === activeConversationId) {
        loadingConversationIdRef.current = null;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeConversationId, clearRuntimeMessages, enabled, loadConversationMessages, sessionResumeIfRunning]);

  const stop = useCallback(() => {
    const hadActiveStream = sessionIsStreaming || isStreaming;
    sessionCancel();
    setIsStreaming(false);
    const conversationId = activeConversationIdRef.current;
    if (!conversationId) return;
    const activeConversation = conversationsRef.current.find((conversation) => conversation.id === conversationId);
    const conversationIsRunning = isConversationRunning(activeConversation?.status);
    if (!hadActiveStream && !conversationIsRunning) return;
    const previousStatus = activeConversation?.status;
    touchConversation(conversationId, { status: "waiting" as Conversation["status"] });
    void sessionStop(conversationId).catch((error) => {
      touchConversation(conversationId, { status: previousStatus });
      setLocalError((prev) => prev || (error instanceof Error ? error.message : "Failed to stop conversation"));
    });
  }, [isStreaming, sessionCancel, sessionIsStreaming, sessionStop, touchConversation]);

  const selectConversation = useCallback((conversationId: string | null) => {
    if (sessionIsStreaming || isStreaming) {
      sessionCancel();
      setIsStreaming(false);
    }
    const wasSameConversation = conversationId && conversationId === activeConversationIdRef.current;
    suppressAutoSelectRef.current = conversationId === null;
    setLocalError(null);
    activeConversationIdRef.current = conversationId;
    lastAutoLoadedConversationIdRef.current = null;
    loadingConversationIdRef.current = null;
    setOlderMessagesCursor(null);
    clearRuntimeMessages();
    setMessages([]);
    if (wasSameConversation) {
      void loadConversationMessages(conversationId);
      void sessionResumeIfRunning(conversationId).catch((error) => {
        setLocalError((prev) => prev || (error instanceof Error ? error.message : "Failed to resume conversation"));
      });
    }
    setActiveConversationId(conversationId);
  }, [clearRuntimeMessages, isStreaming, loadConversationMessages, sessionCancel, sessionIsStreaming, sessionResumeIfRunning]);

  const resetConversationState = useCallback((keepPendingFiles = false) => {
    stop();
    clearRuntimeMessages();
    suppressAutoSelectRef.current = true;
    activeConversationIdRef.current = null;
    lastAutoLoadedConversationIdRef.current = null;
    loadingConversationIdRef.current = null;
    skipInitialLoadConversationIdsRef.current.clear();
    setActiveConversationId(null);
    setMessages([]);
    setLocalError(null);
    setOlderMessagesCursor(null);
    if (!keepPendingFiles) {
      setPendingFiles([]);
    }
  }, [clearRuntimeMessages, stop]);

  const clearMessages = useCallback(() => {
    resetConversationState(false);
  }, [resetConversationState]);

  const ensureConversation = useCallback(async (titleSeed: string): Promise<string> => {
    const existingConversationId = activeConversationIdRef.current;
    if (existingConversationId) {
      return existingConversationId;
    }

    const createdConversation = await sessionCreateConversation({
      title: titleSeed.slice(0, 120),
      model: conversationModel as unknown as never,
      ...scope,
    });

    suppressAutoSelectRef.current = false;
    setConversations((prev) => sortConversationsByUpdatedAt([
      createdConversation,
      ...prev.filter((conversation) => conversation.id !== createdConversation.id),
    ]));
    activeConversationIdRef.current = createdConversation.id;
    lastAutoLoadedConversationIdRef.current = createdConversation.id;
    loadingConversationIdRef.current = null;
    skipInitialLoadConversationIdsRef.current.add(createdConversation.id);
    setActiveConversationId(createdConversation.id);
    setConversationModelState((createdConversation.model ?? conversationModel ?? null) as ConversationModel | null);
    clearRuntimeMessages();
    setMessages([]);
    setOlderMessagesCursor(null);

    return createdConversation.id;
  }, [clearRuntimeMessages, conversationModel, scope, sessionCreateConversation]);

  const queuePendingFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    setPendingFiles((prev) => {
      const byKey = new Map<string, File>();
      prev.forEach((file) => byKey.set(getFileKey(file), file));
      files.forEach((file) => byKey.set(getFileKey(file), file));
      return Array.from(byKey.values());
    });
  }, []);

  const removePendingFile = useCallback((fileKey: string) => {
    setPendingFiles((prev) => prev.filter((file) => getFileKey(file) !== fileKey));
  }, []);

  const clearPendingFiles = useCallback(() => {
    setPendingFiles([]);
  }, []);

  const sendMessage = useCallback(async (content: string, options?: { forceNewConversation?: boolean }) => {
    const trimmed = content.trim();
    if (!enabled || !trimmed || isStreaming || sessionIsStreaming) return;
    const forceNewConversation = options?.forceNewConversation === true;

    setLocalError(null);
    if (forceNewConversation) {
      resetConversationState(true);
    }

    let conversationId = forceNewConversation ? null : activeConversationId;
    try {
      if (!conversationId) {
        conversationId = await ensureConversation(trimmed);
      }
      if (!conversationId) {
        throw new Error("Conversation could not be initialized");
      }
      const finalConversationId = conversationId;

      if (pendingFiles.length > 0) {
        setIsUploadingFiles(true);
        try {
          await Promise.all(
            pendingFiles.map((file) => client.resources.upload("conversation", finalConversationId, file, {
              name: file.name,
            })),
          );
          setPendingFiles([]);
          touchConversation(finalConversationId, { updated_at: new Date().toISOString() });
        } finally {
          setIsUploadingFiles(false);
        }
      }

      appendOptimisticUserMessage(trimmed, {
        conversationId: finalConversationId,
      });

      setIsStreaming(true);
      touchConversation(finalConversationId, { status: "running" as Conversation["status"] });
      await sessionSendMessage(trimmed, {
        conversationId: finalConversationId,
        createIfMissing: false,
      });
      touchConversation(finalConversationId, { updated_at: new Date().toISOString() });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setLocalError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsStreaming(false);
    }
  }, [
    activeConversationId,
    appendOptimisticUserMessage,
    client.resources,
    enabled,
    ensureConversation,
    isStreaming,
    pendingFiles,
    resetConversationState,
    sessionIsStreaming,
    sessionSendMessage,
    touchConversation,
  ]);

  const uploadFiles = useCallback(async (
    files: File[],
    options?: { deferUntilSend?: boolean },
  ) => {
    const normalizedFiles = files.filter((file) => file instanceof File);
    if (!enabled || normalizedFiles.length === 0 || isLoading || isUploadingFiles) return;

    setLocalError(null);
    const activeId = activeConversationIdRef.current;
    const shouldQueueForNextSend = options?.deferUntilSend === true;

    if (!activeId || shouldQueueForNextSend) {
      queuePendingFiles(normalizedFiles);
      return;
    }

    setIsUploadingFiles(true);
    try {
      await Promise.all(
        normalizedFiles.map((file) => client.resources.upload("conversation", activeId, file, {
          name: file.name,
        })),
      );

      await loadConversationMessages(activeId);
      touchConversation(activeId, { updated_at: new Date().toISOString() });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to upload files");
      throw err;
    } finally {
      setIsUploadingFiles(false);
    }
  }, [
    client.resources,
    enabled,
    isLoading,
    isUploadingFiles,
    loadConversationMessages,
    queuePendingFiles,
    touchConversation,
  ]);

  const { pendingActions, completedActions } = useMemo(() => {
    const pending: AssistantAction[] = [];
    const completed: AssistantAction[] = [];

    messages.forEach((message) => {
      if (!message.toolInvocations) return;
      message.toolInvocations.forEach((toolInvocation) => {
        const status = toolInvocation.state === "result"
          ? (toolInvocation.result?.success === false ? "failed" : "completed")
          : "executing";

        const action: AssistantAction = {
          id: toolInvocation.toolCallId,
          type: "tool_call",
          status,
          toolName: toolInvocation.toolName,
          toolArgs: toolInvocation.args,
          result: toolInvocation.result,
          timestamp: message.createdAt || new Date(),
        };

        if (status === "executing") {
          pending.push(action);
        } else {
          completed.push(action);
        }
      });
    });

    return { pendingActions: pending, completedActions: completed };
  }, [messages]);

  const isActiveConversationRunning = useMemo(() => {
    if (!activeConversationId) return false;
    const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
    return isConversationRunning(activeConversation?.status);
  }, [activeConversationId, conversations]);

  return {
    messages,
    conversations,
    activeConversationId,
    availableModels,
    conversationModel,
    isActiveConversationRunning,
    isLoading,
    isLoadingConversations,
    isLoadingMessages,
    isLoadingOlderMessages,
    hasOlderMessages: !!olderMessagesCursor,
    isUploadingFiles,
    pendingFiles,
    error,
    pendingActions,
    completedActions,
    selectConversation,
    setConversationModel,
    sendMessage,
    uploadFiles,
    removePendingFile,
    clearPendingFiles,
    loadOlderMessages,
    clearMessages,
    stop,
  };
}
