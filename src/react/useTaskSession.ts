import { useCallback, useEffect, useRef, useState } from "react";
import type { LemmaClient } from "../client.js";
import { parseSSEJson, readSSE, type SseRawEvent } from "../streams.js";
import { isTerminalTaskStatus, normalizeRunStatus } from "../run-utils.js";
import { parseTaskStreamEvent, upsertTaskMessage } from "../task-events.js";
import type { Task, TaskMessage } from "../types.js";

export interface CreateTaskInput {
  agentName: string;
  inputData?: Record<string, unknown> | null;
}

export interface UseTaskSessionOptions {
  client: LemmaClient;
  podId?: string;
  taskId?: string | null;
  autoConnect?: boolean;
  autoConnectOnStart?: boolean;
  onEvent?: (event: SseRawEvent, payload: unknown | null) => void;
  onStatus?: (status: string) => void;
  onMessage?: (message: TaskMessage) => void;
  onError?: (error: unknown) => void;
}

export interface UseTaskSessionResult {
  taskId: string | null;
  task: Task | null;
  status?: string;
  messages: TaskMessage[];
  isStreaming: boolean;
  error: Error | null;
  setTaskId: (taskId: string | null) => void;
  start: (input: CreateTaskInput) => Promise<Task>;
  refreshTask: (taskId?: string | null) => Promise<Task | null>;
  loadMessages: (taskId?: string | null) => Promise<TaskMessage[]>;
  connect: (taskId?: string | null) => Promise<void>;
  disconnect: () => void;
  stop: () => Promise<Task | null>;
  clearMessages: () => void;
}

function resolvePodId(client: LemmaClient, podId?: string): string {
  const resolved = podId ?? client.podId;
  if (!resolved) {
    throw new Error("podId is required. Pass podId or set it on LemmaClient.");
  }
  return resolved;
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function useTaskSession({
  client,
  podId,
  taskId: externalTaskId = null,
  autoConnect = true,
  autoConnectOnStart = true,
  onEvent,
  onStatus,
  onMessage,
  onError,
}: UseTaskSessionOptions): UseTaskSessionResult {
  const [taskId, setTaskIdState] = useState<string | null>(externalTaskId);
  const [task, setTask] = useState<Task | null>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const setTaskId = useCallback((nextTaskId: string | null) => {
    setTaskIdState(nextTaskId);
    if (!nextTaskId) {
      setTask(null);
      setStatus(undefined);
      setMessages([]);
    }
  }, []);

  const disconnect = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => {
    if (externalTaskId === taskId) return;
    setTaskIdState(externalTaskId);
    if (!externalTaskId) {
      disconnect();
      setTask(null);
      setStatus(undefined);
      setMessages([]);
    }
  }, [disconnect, externalTaskId, taskId]);

  const refreshTask = useCallback(async (explicitTaskId?: string | null): Promise<Task | null> => {
    const id = explicitTaskId ?? taskId;
    if (!id) return null;

    try {
      client.setPodId(resolvePodId(client, podId));
      const nextTask = await client.tasks.get(id);
      setTask(nextTask);

      const nextStatus = normalizeRunStatus(nextTask.status);
      setStatus(nextStatus);
      if (nextStatus) {
        onStatus?.(nextStatus);
      }

      return nextTask;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to fetch task.");
      setError(normalized);
      onError?.(refreshError);
      return null;
    }
  }, [client, onError, onStatus, podId, taskId]);

  const loadMessages = useCallback(async (explicitTaskId?: string | null): Promise<TaskMessage[]> => {
    const id = explicitTaskId ?? taskId;
    if (!id) return [];

    try {
      client.setPodId(resolvePodId(client, podId));
      const response = await client.tasks.messages.list(id, { limit: 100 });
      const nextMessages = response.items ?? [];
      setMessages(nextMessages);
      return nextMessages;
    } catch (messageError) {
      const normalized = normalizeError(messageError, "Failed to fetch task messages.");
      setError(normalized);
      onError?.(messageError);
      return [];
    }
  }, [client, onError, podId, taskId]);

  const connect = useCallback(async (explicitTaskId?: string | null): Promise<void> => {
    const id = explicitTaskId ?? taskId;
    if (!id) return;

    setTaskIdState(id);
    disconnect();

    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setIsStreaming(true);

    try {
      client.setPodId(resolvePodId(client, podId));
      const stream = await client.tasks.stream(id, { signal: controller.signal });

      for await (const event of readSSE(stream)) {
        if (controller.signal.aborted) {
          break;
        }

        const payload = parseSSEJson(event);
        onEvent?.(event, payload);

        const parsed = parseTaskStreamEvent(payload);

        if (parsed.message) {
          setMessages((previous) => upsertTaskMessage(previous, parsed.message!));
          onMessage?.(parsed.message);
        }

        if (parsed.status) {
          setStatus(parsed.status);
          onStatus?.(parsed.status);

          if (isTerminalTaskStatus(parsed.status)) {
            break;
          }
        }
      }
    } catch (streamError) {
      if (!(streamError instanceof Error && streamError.name === "AbortError")) {
        const normalized = normalizeError(streamError, "Failed to stream task run.");
        setError(normalized);
        onError?.(streamError);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsStreaming(false);
    }
  }, [client, disconnect, onError, onEvent, onMessage, onStatus, podId, taskId]);

  const start = useCallback(async (input: CreateTaskInput): Promise<Task> => {
    setError(null);

    client.setPodId(resolvePodId(client, podId));
    const created = await client.tasks.create({
      agent_name: input.agentName,
      input_data: input.inputData,
    });

    setTask(created);
    setTaskIdState(created.id);

    const nextStatus = normalizeRunStatus(created.status);
    setStatus(nextStatus);
    if (nextStatus) {
      onStatus?.(nextStatus);
    }

    if (autoConnectOnStart && !autoConnect) {
      await connect(created.id);
    }

    return created;
  }, [autoConnect, autoConnectOnStart, client, connect, onStatus, podId]);

  const stop = useCallback(async (): Promise<Task | null> => {
    if (!taskId) return null;

    try {
      client.setPodId(resolvePodId(client, podId));
      const stopped = await client.tasks.stop(taskId);
      setTask(stopped);

      const nextStatus = normalizeRunStatus(stopped.status);
      setStatus(nextStatus);
      if (nextStatus) {
        onStatus?.(nextStatus);
      }

      return stopped;
    } catch (stopError) {
      const normalized = normalizeError(stopError, "Failed to stop task run.");
      setError(normalized);
      onError?.(stopError);
      return null;
    }
  }, [client, onError, onStatus, podId, taskId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    if (!taskId) return;
    void refreshTask(taskId);
    void loadMessages(taskId);
  }, [loadMessages, refreshTask, taskId]);

  useEffect(() => {
    if (!autoConnect || !taskId) {
      return;
    }

    void connect(taskId);
    return () => disconnect();
  }, [autoConnect, connect, disconnect, taskId]);

  return {
    taskId,
    task,
    status,
    messages,
    isStreaming,
    error,
    setTaskId,
    start,
    refreshTask,
    loadMessages,
    connect,
    disconnect,
    stop,
    clearMessages,
  };
}
