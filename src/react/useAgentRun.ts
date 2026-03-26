import { useCallback, useEffect, useRef, useState } from "react";
import type { LemmaClient } from "../client.js";
import { parseSSEJson, readSSE, type SseRawEvent } from "../streams.js";

export interface UseAgentRunStreamOptions {
  client: LemmaClient;
  podId?: string;
  taskId?: string | null;
  autoConnect?: boolean;
  onEvent?: (event: SseRawEvent, payload: unknown | null) => void;
  onError?: (error: unknown) => void;
}

export interface UseAgentRunStreamResult {
  isStreaming: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

function resolvePodId(client: LemmaClient, podId?: string): string {
  const resolved = podId ?? client.podId;
  if (!resolved) {
    throw new Error("podId is required. Pass podId or set it on LemmaClient.");
  }
  return resolved;
}

export function useAgentRunStream({
  client,
  podId,
  taskId,
  autoConnect = true,
  onEvent,
  onError,
}: UseAgentRunStreamOptions): UseAgentRunStreamResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const disconnect = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    if (!taskId) {
      return;
    }

    disconnect();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setIsStreaming(true);

    try {
      client.setPodId(resolvePodId(client, podId));
      const stream = await client.tasks.stream(taskId, { signal: controller.signal });

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
          : new Error("Failed to stream agent run.");
        setError(normalized);
        onError?.(streamError);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsStreaming(false);
    }
  }, [client, disconnect, onError, onEvent, podId, taskId]);

  useEffect(() => {
    if (!autoConnect || !taskId) {
      return;
    }

    void connect();
    return () => disconnect();
  }, [autoConnect, connect, disconnect, taskId]);

  return {
    isStreaming,
    error,
    connect,
    disconnect,
  };
}
