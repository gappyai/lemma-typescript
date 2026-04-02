import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LemmaClient } from "../client.js";
import { parseSSEJson, readSSE, type SseRawEvent } from "../streams.js";
import type {
  Conversation,
  ConversationMessage,
  ConversationModel,
  CursorPage,
} from "../types.js";
import { parseAssistantStreamEvent, upsertConversationMessage } from "../assistant-events.js";

interface ConversationScope {
  podId?: string | null;
  assistantId?: string | null;
  organizationId?: string | null;
}

export interface UseAssistantSessionOptions {
  client: LemmaClient;
  podId?: string;
  assistantId?: string;
  organizationId?: string;
  conversationId?: string | null;
  autoLoad?: boolean;
  autoResume?: boolean;
  syncOnTurnEnd?: boolean;
  onEvent?: (event: SseRawEvent, payload: unknown | null) => void;
  onStatus?: (status: string) => void;
  onMessage?: (message: ConversationMessage) => void;
  onError?: (error: unknown) => void;
}

export interface CreateConversationInput {
  title?: string | null;
  model?: ConversationModel | null;
  podId?: string | null;
  assistantId?: string | null;
  organizationId?: string | null;
  setActive?: boolean;
}

export interface SendAssistantMessageOptions {
  conversationId?: string | null;
  createIfMissing?: boolean;
  createConversation?: CreateConversationInput;
  syncOnTurnEnd?: boolean;
}

export interface ResumeAssistantOptions {
  conversationId?: string | null;
  /**
   * When true, skips resume unless conversation status is currently RUNNING.
   */
  onlyIfRunning?: boolean;
  syncOnTurnEnd?: boolean;
}

export interface UseAssistantSessionResult {
  conversationId: string | null;
  conversation: Conversation | null;
  status?: string;
  messages: ConversationMessage[];
  streamingText: string;
  isStreaming: boolean;
  error: Error | null;
  setConversationId: (conversationId: string | null) => void;
  listConversations: (options?: {
    limit?: number;
    pageToken?: string;
    scope?: ConversationScope;
  }) => Promise<CursorPage<Conversation>>;
  createConversation: (input?: CreateConversationInput) => Promise<Conversation>;
  refreshConversation: (conversationId?: string | null) => Promise<Conversation | null>;
  loadMessages: (options?: {
    conversationId?: string | null;
    limit?: number;
    pageToken?: string;
  }) => Promise<CursorPage<ConversationMessage>>;
  sendMessage: (content: string, options?: SendAssistantMessageOptions) => Promise<Conversation>;
  resume: (conversationId?: string | null | ResumeAssistantOptions) => Promise<void>;
  resumeIfRunning: (conversationId?: string | null) => Promise<boolean>;
  stop: (conversationId?: string | null) => Promise<void>;
  cancel: () => void;
  clearMessages: () => void;
}

function resolveOptionalPodId(client: LemmaClient, podId?: string | null): string | undefined {
  return podId ?? client.podId;
}

function applyPodScope(client: LemmaClient, podId?: string | null): string | undefined {
  const resolvedPodId = resolveOptionalPodId(client, podId);
  if (resolvedPodId) {
    client.setPodId(resolvedPodId);
  }
  return resolvedPodId;
}

function requireConversationId(conversationId?: string | null): string {
  if (!conversationId) {
    throw new Error("conversationId is required.");
  }
  return conversationId;
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

function normalizeScope(
  client: LemmaClient,
  defaults: ConversationScope,
  override?: ConversationScope,
): ConversationScope {
  return {
    podId: override?.podId ?? defaults.podId ?? client.podId ?? null,
    assistantId: override?.assistantId ?? defaults.assistantId ?? null,
    organizationId: override?.organizationId ?? defaults.organizationId ?? null,
  };
}

function normalizeConversationStatus(status: unknown): string | undefined {
  if (typeof status !== "string") return undefined;
  const normalized = status.trim().toUpperCase();
  return normalized.length > 0 ? normalized : undefined;
}

function isConversationRunningStatus(status: unknown): boolean {
  const normalized = normalizeConversationStatus(status);
  if (!normalized) return false;
  return normalized === "RUNNING" || normalized === "IN_PROGRESS" || normalized === "PROCESSING";
}

function resolveResumeInput(
  input?: string | null | ResumeAssistantOptions,
): ResumeAssistantOptions {
  if (typeof input === "string" || input === null) {
    return { conversationId: input };
  }
  return input ?? {};
}

export function useAssistantSession(options: UseAssistantSessionOptions): UseAssistantSessionResult {
  const {
    client,
    podId: defaultPodId,
    assistantId: defaultAssistantId,
    organizationId: defaultOrganizationId,
    conversationId: externalConversationId = null,
    autoLoad = true,
    autoResume = false,
    syncOnTurnEnd = false,
    onEvent,
    onStatus,
    onMessage,
    onError,
  } = options;

  const [conversationId, setConversationIdState] = useState<string | null>(externalConversationId);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const statusRef = useRef<string | undefined>(undefined);
  const streamingTextRef = useRef("");
  const autoResumedKeyRef = useRef<string | null>(null);
  const onEventRef = useRef(onEvent);
  const onStatusRef = useRef(onStatus);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  const setConversationId = useCallback((nextConversationId: string | null) => {
    setConversationIdState(nextConversationId);
    autoResumedKeyRef.current = null;
    streamingTextRef.current = "";
    setStreamingText("");
    if (!nextConversationId) {
      setConversation(null);
      setStatus(undefined);
      statusRef.current = undefined;
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    setConversationIdState(externalConversationId);
  }, [externalConversationId]);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onStatusRef.current = onStatus;
  }, [onStatus]);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const setConversationStatus = useCallback((nextStatus?: string) => {
    const normalized = normalizeConversationStatus(nextStatus);
    setStatus(normalized);
    statusRef.current = normalized;
    if (normalized) {
      onStatusRef.current?.(normalized);
    }
  }, []);

  const clearStreamingText = useCallback(() => {
    streamingTextRef.current = "";
    setStreamingText("");
  }, []);

  const appendStreamingToken = useCallback((token: string) => {
    if (!token) return;
    streamingTextRef.current += token;
    setStreamingText(streamingTextRef.current);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const defaultScope = useMemo<ConversationScope>(() => ({
    podId: defaultPodId ?? null,
    assistantId: defaultAssistantId ?? null,
    organizationId: defaultOrganizationId ?? null,
  }), [defaultAssistantId, defaultOrganizationId, defaultPodId]);

  const listConversations = useCallback(async (input: {
    limit?: number;
    pageToken?: string;
    scope?: ConversationScope;
  } = {}): Promise<CursorPage<Conversation>> => {
    try {
      const scope = normalizeScope(client, defaultScope, input.scope);
      applyPodScope(client, scope.podId);

      const response = await client.conversations.list({
        pod_id: scope.podId ?? undefined,
        assistant_id: scope.assistantId ?? undefined,
        organization_id: scope.organizationId ?? undefined,
        limit: input.limit,
        page_token: input.pageToken,
      });

      return {
        items: response.items ?? [],
        limit: response.limit ?? input.limit ?? 20,
        next_page_token: response.next_page_token,
      };
    } catch (listError) {
      const normalized = normalizeError(listError, "Failed to list conversations.");
      setError(normalized);
      onErrorRef.current?.(listError);
      return {
        items: [],
        limit: input.limit ?? 20,
        next_page_token: null,
      };
    }
  }, [client, defaultScope]);

  const createConversation = useCallback(async (input: CreateConversationInput = {}): Promise<Conversation> => {
    applyPodScope(client, input.podId ?? defaultPodId ?? null);

    const payload = {
      title: input.title ?? undefined,
      pod_id: input.podId ?? defaultPodId ?? client.podId ?? undefined,
      assistant_id: input.assistantId ?? defaultAssistantId ?? undefined,
      organization_id: input.organizationId ?? defaultOrganizationId ?? undefined,
      model: typeof input.model === "undefined"
        ? undefined
        : (input.model as unknown as never),
    };

    const created = await client.conversations.create(payload);

    if (input.setActive !== false) {
      setConversationIdState(created.id);
      setConversation(created);
      setConversationStatus(created.status);
      setMessages([]);
      clearStreamingText();
      autoResumedKeyRef.current = null;
    }

    return created;
  }, [clearStreamingText, client, defaultAssistantId, defaultOrganizationId, defaultPodId, setConversationStatus]);

  const refreshConversation = useCallback(async (explicitConversationId?: string | null): Promise<Conversation | null> => {
    const id = explicitConversationId ?? conversationId;
    if (!id) return null;

    try {
      const scope = normalizeScope(client, defaultScope);
      applyPodScope(client, scope.podId);

      const nextConversation = await client.conversations.get(id, {
        pod_id: scope.podId ?? undefined,
      });

      setConversation(nextConversation);
      const nextStatus = typeof nextConversation.status === "string"
        ? nextConversation.status
        : undefined;
      setConversationStatus(nextStatus);

      return nextConversation;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to fetch conversation.");
      setError(normalized);
      onErrorRef.current?.(refreshError);
      return null;
    }
  }, [client, conversationId, defaultScope, setConversationStatus]);

  const loadMessages = useCallback(async (input: {
    conversationId?: string | null;
    limit?: number;
    pageToken?: string;
  } = {}): Promise<CursorPage<ConversationMessage>> => {
    const id = input.conversationId ?? conversationId;
    if (!id) {
      return { items: [], limit: input.limit ?? 20, next_page_token: null };
    }

    try {
      const response = await client.conversations.messages.list(id, {
        limit: input.limit,
        page_token: input.pageToken,
      });

      const nextMessages = response.items ?? [];
      setMessages((previous) => nextMessages.reduce(
        (accumulator, message) => upsertConversationMessage(accumulator, message),
        previous,
      ));

      return {
        items: nextMessages,
        limit: response.limit ?? input.limit ?? 20,
        next_page_token: response.next_page_token,
      };
    } catch (messageError) {
      const normalized = normalizeError(messageError, "Failed to fetch conversation messages.");
      setError(normalized);
      onErrorRef.current?.(messageError);
      return {
        items: [],
        limit: input.limit ?? 20,
        next_page_token: null,
      };
    }
  }, [clearStreamingText, client, conversationId, defaultScope, setConversationStatus]);

  const consume = useCallback(async ({
    stream,
    controller,
    streamConversationId,
    syncAfterStream,
  }: {
    stream: ReadableStream<Uint8Array>;
    controller: AbortController;
    streamConversationId?: string | null;
    syncAfterStream?: boolean;
  }): Promise<void> => {
    setIsStreaming(true);
    setError(null);
    clearStreamingText();
    let sawTerminalStatus = false;

    try {
      for await (const event of readSSE(stream)) {
        if (controller.signal.aborted) {
          break;
        }

        const payload = parseSSEJson(event);
        onEventRef.current?.(event, payload);

        const parsed = parseAssistantStreamEvent(payload);
        if (parsed.token) {
          appendStreamingToken(parsed.token);
        }
        if (parsed.message) {
          setMessages((previous) => upsertConversationMessage(previous, parsed.message!));
          onMessageRef.current?.(parsed.message);
          const role = typeof parsed.message.role === "string"
            ? parsed.message.role.toLowerCase()
            : "";
          if (role === "assistant" || role === "tool") {
            clearStreamingText();
          }
        }
        if (parsed.status) {
          setConversationStatus(parsed.status);
          if (!isConversationRunningStatus(parsed.status)) {
            sawTerminalStatus = true;
            clearStreamingText();
          }
        }
      }

      if (!controller.signal.aborted) {
        if (!sawTerminalStatus && isConversationRunningStatus(statusRef.current)) {
          setConversationStatus("WAITING");
        }
        clearStreamingText();

        const shouldSync = syncAfterStream ?? syncOnTurnEnd;
        const syncConversationId = streamConversationId ?? conversationId;
        if (shouldSync && syncConversationId) {
          await refreshConversation(syncConversationId);
          await loadMessages({ conversationId: syncConversationId, limit: 100 });
        }
      }
    } catch (streamError) {
      if (!(streamError instanceof Error && streamError.name === "AbortError")) {
        const normalized = normalizeError(streamError, "Failed to stream assistant run.");
        setError(normalized);
        onErrorRef.current?.(streamError);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsStreaming(false);
    }
  }, [
    appendStreamingToken,
    clearStreamingText,
    conversationId,
    loadMessages,
    refreshConversation,
    setConversationStatus,
    syncOnTurnEnd,
  ]);

  const ensureConversation = useCallback(async (
    overrideConversationId?: string | null,
    options?: SendAssistantMessageOptions,
  ): Promise<Conversation> => {
    const existingId = overrideConversationId ?? conversationId;
    if (existingId) {
      // Avoid a network roundtrip on every send when we already have this conversation in state.
      if (conversation?.id === existingId) {
        return conversation;
      }

      const existing = await refreshConversation(existingId);
      if (existing) return existing;
      throw new Error("Failed to resolve existing conversation.");
    }

    if (options?.createIfMissing !== true) {
      throw new Error("conversationId is required.");
    }

    return createConversation({
      ...(options.createConversation ?? {}),
      setActive: true,
    });
  }, [conversation, conversationId, createConversation, refreshConversation]);

  const sendMessage = useCallback(async (
    content: string,
    input: SendAssistantMessageOptions = {},
  ): Promise<Conversation> => {
    const resolvedConversation = await ensureConversation(input.conversationId, input);
    const resolvedConversationId = requireConversationId(resolvedConversation.id);

    cancel();
    const controller = new AbortController();
    abortRef.current = controller;

    const scope = normalizeScope(client, defaultScope, input.createConversation);
    applyPodScope(client, scope.podId);

    const stream = await client.conversations.sendMessageStream(
      resolvedConversationId,
      { content },
      {
        pod_id: scope.podId ?? undefined,
        signal: controller.signal,
      },
    );

    setConversationStatus("RUNNING");
    await consume({
      stream,
      controller,
      streamConversationId: resolvedConversationId,
      syncAfterStream: input.syncOnTurnEnd,
    });
    return resolvedConversation;
  }, [cancel, client, consume, defaultScope, ensureConversation, setConversationStatus]);

  const resume = useCallback(async (input?: string | null | ResumeAssistantOptions): Promise<void> => {
    const resumeInput = resolveResumeInput(input);
    const id = requireConversationId(resumeInput.conversationId ?? conversationId);

    if (resumeInput.onlyIfRunning && !isConversationRunningStatus(statusRef.current)) {
      return;
    }

    cancel();
    const controller = new AbortController();
    abortRef.current = controller;

    const scope = normalizeScope(client, defaultScope);
    applyPodScope(client, scope.podId);

    const stream = await client.conversations.resumeStream(id, {
      pod_id: scope.podId ?? undefined,
      signal: controller.signal,
    });

    setConversationStatus("RUNNING");
    await consume({
      stream,
      controller,
      streamConversationId: id,
      syncAfterStream: resumeInput.syncOnTurnEnd,
    });
  }, [cancel, client, consume, conversationId, defaultScope, setConversationStatus]);

  const resumeIfRunning = useCallback(async (explicitConversationId?: string | null): Promise<boolean> => {
    const id = explicitConversationId ?? conversationId;
    if (!id) return false;
    if (isStreaming) return false;

    const statusKey = normalizeConversationStatus(statusRef.current);
    const resumeKey = `${id}:${statusKey ?? "UNKNOWN"}`;
    if (autoResumedKeyRef.current === resumeKey) {
      return false;
    }

    const knownRunning = isConversationRunningStatus(statusRef.current);
    if (!knownRunning) {
      const latestConversation = await refreshConversation(id);
      if (!latestConversation || !isConversationRunningStatus(latestConversation.status)) {
        return false;
      }
    }

    autoResumedKeyRef.current = resumeKey;
    await resume({
      conversationId: id,
      onlyIfRunning: true,
    });
    return true;
  }, [conversationId, isStreaming, refreshConversation, resume]);

  const stop = useCallback(async (explicitConversationId?: string | null): Promise<void> => {
    const id = requireConversationId(explicitConversationId ?? conversationId);

    const scope = normalizeScope(client, defaultScope);
    applyPodScope(client, scope.podId);

    await client.conversations.stopRun(id, {
      pod_id: scope.podId ?? undefined,
    });
    setConversationStatus("WAITING");
    clearStreamingText();
  }, [client, conversationId, defaultScope]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    autoResumedKeyRef.current = null;
  }, [conversationId]);

  useEffect(() => {
    if (!isConversationRunningStatus(status)) {
      autoResumedKeyRef.current = null;
    }
  }, [status]);

  useEffect(() => {
    if (!autoLoad || !conversationId) {
      return;
    }

    let cancelled = false;

    const bootstrapConversation = async () => {
      const latestConversation = await refreshConversation(conversationId);
      if (cancelled) return;

      await loadMessages({ conversationId, limit: 100 });
      if (cancelled) return;

      if (!autoResume) return;
      const latestStatus = normalizeConversationStatus(latestConversation?.status) ?? normalizeConversationStatus(statusRef.current);
      if (!isConversationRunningStatus(latestStatus)) return;
      await resumeIfRunning(conversationId);
    };

    void bootstrapConversation();
    return () => {
      cancelled = true;
    };
  }, [autoLoad, autoResume, conversationId, loadMessages, refreshConversation, resumeIfRunning]);

  return {
    conversationId,
    conversation,
    status,
    messages,
    streamingText,
    isStreaming,
    error,
    setConversationId,
    listConversations,
    createConversation,
    refreshConversation,
    loadMessages,
    sendMessage,
    resume,
    resumeIfRunning,
    stop,
    cancel,
    clearMessages,
  };
}
