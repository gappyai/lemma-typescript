import type { LemmaClient } from "../client.js";
import type { SseRawEvent } from "../streams.js";
import { useAssistantSession } from "./useAssistantSession.js";

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

export function useAssistantRun({
  client,
  podId,
  conversationId,
  onEvent,
  onError,
}: UseAssistantRunOptions): UseAssistantRunResult {
  const session = useAssistantSession({
    client,
    podId,
    conversationId,
    onEvent,
    onError,
  });

  const sendMessage = async (content: string) => {
    await session.sendMessage(content, {
      conversationId: requireConversationId(conversationId ?? session.conversationId),
      createIfMissing: false,
    });
  };

  const resume = async () => {
    await session.resume(requireConversationId(conversationId ?? session.conversationId));
  };

  const stop = async () => {
    await session.stop(requireConversationId(conversationId ?? session.conversationId));
  };

  return {
    isStreaming: session.isStreaming,
    error: session.error,
    sendMessage,
    resume,
    stop,
    cancel: session.cancel,
  };
}
