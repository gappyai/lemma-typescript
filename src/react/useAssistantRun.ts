import { useCallback, useRef, useState } from "react";
import type { LemmaClient } from "../client.js";
import { parseSSEJson, readSSE, type SseRawEvent } from "../streams.js";

export interface UseAssistantRunOptions {
  client: LemmaClient;
  podId?: string;
  conversationId?: string | null;
  onEvent?: (event: SseRawEvent, payload: unknown | null) => void;
  onError?: (error: unknown) => void;
}

export interface UseAssistantRunResult {
  isStreaming: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => void;
}

function requireConversationId(conversationId?: string | null): string {
  if (!conversationId) {
    throw new Error("conversationId is required.");
  }
  return conversationId;
}

function resolvePodId(client: LemmaClient, podId?: string): string {
  const resolved = podId ?? client.podId;
  if (!resolved) {
    throw new Error("podId is required. Pass podId or set it on LemmaClient.");
  }
  return resolved;
}

export function useAssistantRun({
  client,
  podId,
  conversationId,
  onEvent,
  onError,
}: UseAssistantRunOptions): UseAssistantRunResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const consume = useCallback(
    async (stream: ReadableStream<Uint8Array>, controller: AbortController) => {
      setIsStreaming(true);
      setError(null);

      try {
        for await (const event of readSSE(stream)) {
          if (controller.signal.aborted) {
            break;
          }
          onEvent?.(event, parseSSEJson(event));
        }
      } catch (streamError) {
        if (!(streamError instanceof Error && streamError.name === "AbortError")) {
          const normalized = streamError instanceof Error
            ? streamError
            : new Error("Failed to stream assistant run.");
          setError(normalized);
          onError?.(streamError);
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setIsStreaming(false);
      }
    },
    [onError, onEvent],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const id = requireConversationId(conversationId);

    cancel();
    const controller = new AbortController();
    abortRef.current = controller;

    client.setPodId(resolvePodId(client, podId));
    const stream = await client.conversations.sendMessageStream(
      id,
      { content },
      { signal: controller.signal },
    );

    await consume(stream, controller);
  }, [cancel, client, consume, conversationId, podId]);

  const resume = useCallback(async () => {
    const id = requireConversationId(conversationId);

    cancel();
    const controller = new AbortController();
    abortRef.current = controller;

    client.setPodId(resolvePodId(client, podId));
    const stream = await client.conversations.resumeStream(id, { signal: controller.signal });
    await consume(stream, controller);
  }, [cancel, client, consume, conversationId, podId]);

  const stop = useCallback(async () => {
    const id = requireConversationId(conversationId);
    client.setPodId(resolvePodId(client, podId));
    await client.conversations.stopRun(id);
  }, [client, conversationId, podId]);

  return {
    isStreaming,
    error,
    sendMessage,
    resume,
    stop,
    cancel,
  };
}
