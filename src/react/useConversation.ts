import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { Conversation } from "../types.js";

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

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
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
      setConversation(nextConversation);
      return nextConversation;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to load conversation.");
      setError(normalized);
      return null;
    } finally {
      setIsLoading(false);
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
    void refresh();
  }, [autoLoad, isEnabled, refresh]);

  return useMemo(() => ({
    conversation,
    isLoading,
    error,
    refresh,
  }), [conversation, error, isLoading, refresh]);
}
