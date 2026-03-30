import { useCallback, useEffect, useRef, useState } from "react";
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
}

export interface UseAssistantSessionResult {
  conversationId: string | null;
  conversation: Conversation | null;
  status?: string;
  messages: ConversationMessage[];
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
  resume: (conversationId?: string | null) => Promise<void>;
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
  options: UseAssistantSessionOptions,
  override?: ConversationScope,
): ConversationScope {
  return {
    podId: override?.podId ?? options.podId ?? client.podId ?? null,
    assistantId: override?.assistantId ?? options.assistantId ?? null,
    organizationId: override?.organizationId ?? options.organizationId ?? null,
  };
}

export function useAssistantSession(options: UseAssistantSessionOptions): UseAssistantSessionResult {
  const {
    client,
    conversationId: externalConversationId = null,
    autoLoad = true,
    onEvent,
    onStatus,
    onMessage,
    onError,
  } = options;

  const [conversationId, setConversationIdState] = useState<string | null>(externalConversationId);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const setConversationId = useCallback((nextConversationId: string | null) => {
    setConversationIdState(nextConversationId);
    if (!nextConversationId) {
      setConversation(null);
      setStatus(undefined);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    setConversationIdState(externalConversationId);
  }, [externalConversationId]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const listConversations = useCallback(async (input: {
    limit?: number;
    pageToken?: string;
    scope?: ConversationScope;
  } = {}): Promise<CursorPage<Conversation>> => {
    try {
      const scope = normalizeScope(client, options, input.scope);
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
      onError?.(listError);
      return {
        items: [],
        limit: input.limit ?? 20,
        next_page_token: null,
      };
    }
  }, [client, onError, options]);

  const createConversation = useCallback(async (input: CreateConversationInput = {}): Promise<Conversation> => {
    applyPodScope(client, input.podId ?? options.podId ?? null);

    const payload = {
      title: input.title ?? undefined,
      pod_id: input.podId ?? options.podId ?? client.podId ?? undefined,
      assistant_id: input.assistantId ?? options.assistantId ?? undefined,
      organization_id: input.organizationId ?? options.organizationId ?? undefined,
      model: typeof input.model === "undefined"
        ? undefined
        : (input.model as unknown as never),
    };

    const created = await client.conversations.create(payload);

    if (input.setActive !== false) {
      setConversationIdState(created.id);
      setConversation(created);
      setStatus(typeof created.status === "string" ? created.status.toUpperCase() : undefined);
      setMessages([]);
    }

    return created;
  }, [client, options.assistantId, options.organizationId, options.podId]);

  const refreshConversation = useCallback(async (explicitConversationId?: string | null): Promise<Conversation | null> => {
    const id = explicitConversationId ?? conversationId;
    if (!id) return null;

    try {
      const scope = normalizeScope(client, options);
      applyPodScope(client, scope.podId);

      const nextConversation = await client.conversations.get(id, {
        pod_id: scope.podId ?? undefined,
      });

      setConversation(nextConversation);
      const nextStatus = typeof nextConversation.status === "string"
        ? nextConversation.status.toUpperCase()
        : undefined;
      setStatus(nextStatus);
      if (nextStatus) {
        onStatus?.(nextStatus);
      }

      return nextConversation;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to fetch conversation.");
      setError(normalized);
      onError?.(refreshError);
      return null;
    }
  }, [client, conversationId, onError, onStatus, options]);

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
      const scope = normalizeScope(client, options);
      applyPodScope(client, scope.podId);

      const response = await client.conversations.messages.list(id, {
        pod_id: scope.podId ?? undefined,
        limit: input.limit,
        page_token: input.pageToken,
      });

      const nextMessages = response.items ?? [];
      setMessages(nextMessages);

      return {
        items: nextMessages,
        limit: response.limit ?? input.limit ?? 20,
        next_page_token: response.next_page_token,
      };
    } catch (messageError) {
      const normalized = normalizeError(messageError, "Failed to fetch conversation messages.");
      setError(normalized);
      onError?.(messageError);
      return {
        items: [],
        limit: input.limit ?? 20,
        next_page_token: null,
      };
    }
  }, [client, conversationId, onError, options]);

  const consume = useCallback(async (
    stream: ReadableStream<Uint8Array>,
    controller: AbortController,
  ): Promise<void> => {
    setIsStreaming(true);
    setError(null);

    try {
      for await (const event of readSSE(stream)) {
        if (controller.signal.aborted) {
          break;
        }

        const payload = parseSSEJson(event);
        onEvent?.(event, payload);

        const parsed = parseAssistantStreamEvent(payload);
        if (parsed.message) {
          setMessages((previous) => upsertConversationMessage(previous, parsed.message!));
          onMessage?.(parsed.message);
        }
        if (parsed.status) {
          setStatus(parsed.status);
          onStatus?.(parsed.status);
        }
      }
    } catch (streamError) {
      if (!(streamError instanceof Error && streamError.name === "AbortError")) {
        const normalized = normalizeError(streamError, "Failed to stream assistant run.");
        setError(normalized);
        onError?.(streamError);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsStreaming(false);
    }
  }, [onError, onEvent, onMessage, onStatus]);

  const ensureConversation = useCallback(async (
    overrideConversationId?: string | null,
    options?: SendAssistantMessageOptions,
  ): Promise<Conversation> => {
    const existingId = overrideConversationId ?? conversationId;
    if (existingId) {
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
  }, [conversationId, createConversation, refreshConversation]);

  const sendMessage = useCallback(async (
    content: string,
    input: SendAssistantMessageOptions = {},
  ): Promise<Conversation> => {
    const resolvedConversation = await ensureConversation(input.conversationId, input);
    const resolvedConversationId = requireConversationId(resolvedConversation.id);

    cancel();
    const controller = new AbortController();
    abortRef.current = controller;

    const scope = normalizeScope(client, options, input.createConversation);
    applyPodScope(client, scope.podId);

    const stream = await client.conversations.sendMessageStream(
      resolvedConversationId,
      { content },
      {
        pod_id: scope.podId ?? undefined,
        signal: controller.signal,
      },
    );

    await consume(stream, controller);
    return resolvedConversation;
  }, [cancel, client, consume, ensureConversation, options]);

  const resume = useCallback(async (explicitConversationId?: string | null): Promise<void> => {
    const id = requireConversationId(explicitConversationId ?? conversationId);

    cancel();
    const controller = new AbortController();
    abortRef.current = controller;

    const scope = normalizeScope(client, options);
    applyPodScope(client, scope.podId);

    const stream = await client.conversations.resumeStream(id, {
      pod_id: scope.podId ?? undefined,
      signal: controller.signal,
    });

    await consume(stream, controller);
  }, [cancel, client, consume, conversationId, options]);

  const stop = useCallback(async (explicitConversationId?: string | null): Promise<void> => {
    const id = requireConversationId(explicitConversationId ?? conversationId);

    const scope = normalizeScope(client, options);
    applyPodScope(client, scope.podId);

    await client.conversations.stopRun(id, {
      pod_id: scope.podId ?? undefined,
    });
  }, [client, conversationId, options]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    if (!autoLoad || !conversationId) {
      return;
    }

    void refreshConversation(conversationId);
    void loadMessages({ conversationId });
  }, [autoLoad, conversationId, loadMessages, refreshConversation]);

  return {
    conversationId,
    conversation,
    status,
    messages,
    isStreaming,
    error,
    setConversationId,
    listConversations,
    createConversation,
    refreshConversation,
    loadMessages,
    sendMessage,
    resume,
    stop,
    cancel,
    clearMessages,
  };
}
