import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { Conversation } from "../types.js";
import { normalizeError } from "./utils.js";

export interface UseConversationOptions {
  client: LemmaClient;
  podId?: string;
  conversationId?: string | null;
  enabled?: boolean;
  autoLoad?: boolean;
}

export interface UseConversationResult {
  conversation: Conversation | null;
  isLoading: boolean;
  error: Error | null;
  refresh: (overrides?: { conversationId?: string | null }) => Promise<Conversation | null>;
}

export function useConversation({
  client,
  podId,
  conversationId = null,
  enabled = true,
  autoLoad = true,
}: UseConversationOptions): UseConversationResult {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trimmedConversationId = typeof conversationId === "string" ? conversationId.trim() : "";
  const isEnabled = enabled && trimmedConversationId.length > 0;

  const refresh = useCallback(async (
    overrides: { conversationId?: string | null } = {},
    signal?: AbortSignal,
  ): Promise<Conversation | null> => {
    const nextConversationId = typeof overrides.conversationId === "string"
      ? overrides.conversationId.trim()
      : trimmedConversationId;

    if (!enabled || nextConversationId.length === 0) {
      setConversation(null);
      setError(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const scopedClient = podId ? client.withPod(podId) : client;
      const nextConversation = await scopedClient.conversations.get(nextConversationId, {
        pod_id: podId,
      });
      if (signal?.aborted) return null;
      setConversation(nextConversation);
      return nextConversation;
    } catch (refreshError) {
      if (signal?.aborted) return null;
      const normalized = normalizeError(refreshError, "Failed to load conversation.");
      setError(normalized);
      return null;
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [client, enabled, podId, trimmedConversationId]);

  useEffect(() => {
    if (!isEnabled) {
      setConversation(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!autoLoad) return;
    const controller = new AbortController();
    let cancelled = false;
    (async () => {
      try {
        await refresh({}, controller.signal);
      } catch {
        if (!cancelled) {
          setError(normalizeError(new Error("Failed to load conversation."), "Failed to load conversation."));
        }
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [autoLoad, isEnabled, refresh]);

  return useMemo(() => ({
    conversation,
    isLoading,
    error,
    refresh,
  }), [conversation, error, isLoading, refresh]);
}
