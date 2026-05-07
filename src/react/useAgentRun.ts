import { useCallback, useMemo } from "react";
import type { LemmaClient } from "../client.js";
import type { Conversation, ConversationMessage, Task } from "../types.js";
import {
  extractConversationMessageText,
  getLatestAssistantMessage,
  isConversationRunningStatus,
  normalizeConversationStatus,
} from "./assistant-output.js";
import {
  useAssistantSession,
  type UseAssistantSessionOptions,
} from "./useAssistantSession.js";

export interface UseAgentRunOptions
  extends Omit<UseAssistantSessionOptions, "agentName" | "assistantName" | "assistantId" | "conversationId"> {
  agentName?: string;
  conversationId?: string | null;
  taskId?: string | null;
  autoConnect?: boolean;
  autoConnectOnStart?: boolean;
}

export interface UseAgentRunResult {
  taskId: string | null;
  conversationId: string | null;
  task: Task | null;
  conversation: Conversation | null;
  status?: string;
  messages: ConversationMessage[];
  output: unknown;
  finalOutput: unknown;
  outputText: string;
  finalOutputText: string;
  isStreaming: boolean;
  error: Error | null;
  isWaitingForInput: boolean;
  isFinished: boolean;
  setTaskId: (taskId: string | null) => void;
  setConversationId: (conversationId: string | null) => void;
  start: (
    inputData?: Record<string, unknown> | null,
    options?: { agentName?: string },
  ) => Promise<Task>;
  submitInput: (content: string) => Promise<Task | null>;
  refreshTask: (taskId?: string | null) => Promise<Task | null>;
  loadMessages: (taskId?: string | null) => Promise<ConversationMessage[]>;
  connect: (taskId?: string | null) => Promise<void>;
  disconnect: () => void;
  stop: () => Promise<Task | null>;
  clearMessages: () => void;
}

function resolveAgentName(base?: string, override?: string): string {
  const resolved = override ?? base;
  if (!resolved) {
    throw new Error("agentName is required.");
  }
  return resolved;
}

function stringifyAgentInput(inputData?: Record<string, unknown> | null): string {
  if (!inputData || Object.keys(inputData).length === 0) {
    return "";
  }

  const prompt = inputData.prompt ?? inputData.message ?? inputData.content;
  if (typeof prompt === "string" && prompt.trim().length > 0 && Object.keys(inputData).length === 1) {
    return prompt.trim();
  }

  return JSON.stringify(inputData, null, 2);
}

function taskFromConversation(
  conversation: Conversation | null,
  status: string | undefined,
  inputData?: Record<string, unknown> | null,
  output?: unknown,
): Task | null {
  if (!conversation) return null;
  return {
    id: conversation.id,
    agent_id: conversation.agent_id,
    pod_id: conversation.pod_id,
    user_id: conversation.user_id,
    input_data: inputData ?? null,
    output_data: output ?? null,
    error: null,
    status: (normalizeConversationStatus(status ?? conversation.status) as Task["status"] | undefined) ?? "WAITING",
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
    conversation,
  };
}

export function useAgentRun({
  client,
  podId,
  agentName,
  conversationId,
  taskId = null,
  autoConnect = true,
  autoConnectOnStart = true,
  autoLoad,
  autoResume,
  syncOnTurnEnd,
  onEvent,
  onStatus,
  onMessage,
  onError,
}: UseAgentRunOptions): UseAgentRunResult {
  const session = useAssistantSession({
    client,
    podId,
    agentName,
    conversationId: conversationId ?? taskId,
    autoLoad: autoLoad ?? autoConnect,
    autoResume: autoResume ?? autoConnect,
    syncOnTurnEnd,
    onEvent,
    onStatus,
    onMessage,
    onError,
  });

  const start = useCallback(async (
    inputData?: Record<string, unknown> | null,
    options?: { agentName?: string },
  ): Promise<Task> => {
    const resolvedAgentName = resolveAgentName(agentName, options?.agentName);
    const content = stringifyAgentInput(inputData);
    const conversation = await session.createConversation({
      agentName: resolvedAgentName,
      title: content ? content.slice(0, 120) : resolvedAgentName,
      setActive: true,
    });

    if (content) {
      await session.sendMessage(content, {
        conversationId: conversation.id,
        createIfMissing: false,
        syncOnTurnEnd,
      });
    } else if (autoConnectOnStart) {
      await session.resume(conversation.id);
    }

    return taskFromConversation(conversation, session.status, inputData) ?? {
      id: conversation.id,
      agent_id: conversation.agent_id,
      pod_id: conversation.pod_id,
      user_id: conversation.user_id,
      input_data: inputData ?? null,
      output_data: null,
      error: null,
      status: "WAITING",
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      conversation,
    };
  }, [agentName, autoConnectOnStart, session, syncOnTurnEnd]);

  const submitInput = useCallback(async (content: string): Promise<Task | null> => {
    const resolvedConversationId = session.conversationId;
    if (!resolvedConversationId) {
      throw new Error("conversationId is required to submit additional agent input.");
    }

    await session.sendMessage(content, {
      conversationId: resolvedConversationId,
      createIfMissing: false,
      syncOnTurnEnd,
    });
    return taskFromConversation(session.conversation, session.status);
  }, [session, syncOnTurnEnd]);

  const refreshTask = useCallback(async (explicitTaskId?: string | null): Promise<Task | null> => {
    const conversation = await session.refreshConversation(explicitTaskId);
    return taskFromConversation(conversation, session.status);
  }, [session]);

  const loadMessages = useCallback(async (explicitTaskId?: string | null): Promise<ConversationMessage[]> => {
    const response = await session.loadMessages({ conversationId: explicitTaskId });
    return response.items;
  }, [session]);

  const connect = useCallback(async (explicitTaskId?: string | null): Promise<void> => {
    await session.resume(explicitTaskId);
  }, [session]);

  const stop = useCallback(async (): Promise<Task | null> => {
    await session.stop();
    return taskFromConversation(session.conversation, "WAITING");
  }, [session]);

  return useMemo(() => {
    const latestAssistantMessage = getLatestAssistantMessage(session.messages);
    const output = latestAssistantMessage?.content ?? session.output ?? null;
    const outputText = latestAssistantMessage
      ? extractConversationMessageText(latestAssistantMessage.content)
      : session.outputText;
    const normalizedStatus = normalizeConversationStatus(session.status);
    const running = isConversationRunningStatus(normalizedStatus) || session.isStreaming;
    const isWaitingForInput = normalizedStatus === "WAITING";
    const isFinished = !!latestAssistantMessage && !running;
    const task = taskFromConversation(session.conversation, session.status, null, output);

    return {
      taskId: session.conversationId,
      conversationId: session.conversationId,
      task,
      conversation: session.conversation,
      status: normalizedStatus,
      messages: session.messages,
      output,
      finalOutput: isFinished ? output : null,
      outputText,
      finalOutputText: isFinished ? outputText : "",
      isStreaming: session.isStreaming,
      error: session.error,
      isWaitingForInput,
      isFinished,
      setTaskId: session.setConversationId,
      setConversationId: session.setConversationId,
      start,
      submitInput,
      refreshTask,
      loadMessages,
      connect,
      disconnect: session.cancel,
      stop,
      clearMessages: session.clearMessages,
    };
  }, [connect, loadMessages, refreshTask, session, start, stop, submitInput]);
}
