import { useCallback, useMemo } from "react";
import type { LemmaClient } from "../client.js";
import type { SseRawEvent } from "../streams.js";
import type { ConversationMessage } from "../types.js";
import { useConversationMessages } from "./useConversationMessages.js";

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
  status?: string;
  messages: ConversationMessage[];
  output: ConversationMessage["content"] | null;
  outputText: string;
  finalOutput: ConversationMessage["content"] | null;
  finalOutputText: string;
  latestAssistantMessage: ConversationMessage | null;
  refresh: () => Promise<ConversationMessage[]>;
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
  const messages = useConversationMessages({
    client,
    podId,
    conversationId,
    autoLoad: true,
    autoResume: false,
    onEvent,
    onError,
  });

  const sendMessage = useCallback(async (content: string) => {
    await messages.sendMessage(content, {
      conversationId: requireConversationId(conversationId ?? messages.conversationId),
      createIfMissing: false,
    });
  }, [conversationId, messages]);

  const resume = useCallback(async () => {
    await messages.resume(requireConversationId(conversationId ?? messages.conversationId));
  }, [conversationId, messages]);

  const stop = useCallback(async () => {
    await messages.stop(requireConversationId(conversationId ?? messages.conversationId));
  }, [conversationId, messages]);

  return useMemo(() => ({
    isStreaming: messages.isStreaming,
    error: messages.error,
    status: messages.status,
    messages: messages.messages,
    output: messages.output,
    outputText: messages.outputText,
    finalOutput: messages.finalOutput,
    finalOutputText: messages.finalOutputText,
    latestAssistantMessage: messages.latestAssistantMessage,
    refresh: messages.refresh,
    sendMessage,
    resume,
    stop,
    cancel: messages.cancel,
  }), [messages, sendMessage, resume, stop]);
}
