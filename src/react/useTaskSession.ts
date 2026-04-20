import { useCallback, useEffect, useRef, useState } from "react";
import type { LemmaClient } from "../client.js";
import { parseSSEJson, readSSE, type SseRawEvent } from "../streams.js";
import { isTerminalTaskStatus, normalizeRunStatus } from "../run-utils.js";
import { parseTaskStreamEvent, upsertTaskMessage } from "../task-events.js";
import type { Task, TaskMessage } from "../types.js";
import { normalizeError, resolvePodClient, resolvePodId } from "./utils.js";

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const previousExternalTaskIdRef = useRef<string | null>(externalTaskId);
  const taskIdRef = useRef<string | null>(externalTaskId);
  const statusRef = useRef<string | undefined>(undefined);
  const onEventRef = useRef(onEvent);
  const onStatusRef = useRef(onStatus);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  const setTaskStatus = useCallback((nextStatus?: string) => {
    const normalized = normalizeRunStatus(nextStatus);
    setStatus(normalized);
    statusRef.current = normalized;
    if (normalized) {
      onStatusRef.current?.(normalized);
    }
  }, []);

  const setTaskId = useCallback((nextTaskId: string | null) => {
    setTaskIdState((currentTaskId) => {
      if (currentTaskId === nextTaskId) {
        return currentTaskId;
      }

      abortRef.current?.abort();
      abortRef.current = null;
      taskIdRef.current = nextTaskId;
      setError(null);
      setIsStreaming(false);

      if (!nextTaskId) {
        setTask(null);
        setTaskStatus(undefined);
        setMessages([]);
      }

      return nextTaskId;
    });
  }, [setTaskStatus]);

  const disconnect = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    taskIdRef.current = taskId;
  }, [taskId]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

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
    if (previousExternalTaskIdRef.current === externalTaskId) {
      return;
    }

    previousExternalTaskIdRef.current = externalTaskId;
    setTaskId(externalTaskId);
  }, [externalTaskId, setTaskId]);

  const refreshTask = useCallback(async (explicitTaskId?: string | null): Promise<Task | null> => {
    const id = explicitTaskId ?? taskIdRef.current;
    if (!id) return null;

    try {
      const scopedClient = resolvePodClient(client, resolvePodId(client, podId));
      const nextTask = await scopedClient.tasks.get(id);
      setTask(nextTask);
      setTaskStatus(nextTask.status);
      return nextTask;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to fetch task.");
      setError(normalized);
      onErrorRef.current?.(refreshError);
      return null;
    }
  }, [client, podId, setTaskStatus]);

  const loadMessages = useCallback(async (explicitTaskId?: string | null): Promise<TaskMessage[]> => {
    const id = explicitTaskId ?? taskIdRef.current;
    if (!id) return [];

    try {
      const scopedClient = resolvePodClient(client, resolvePodId(client, podId));
      const response = await scopedClient.tasks.messages.list(id, { limit: 100 });
      const nextMessages = response.items ?? [];
      setMessages(nextMessages);
      return nextMessages;
    } catch (messageError) {
      const normalized = normalizeError(messageError, "Failed to fetch task messages.");
      setError(normalized);
      onErrorRef.current?.(messageError);
      return [];
    }
  }, [client, podId]);

  const connect = useCallback(async (explicitTaskId?: string | null): Promise<void> => {
    const id = explicitTaskId ?? taskIdRef.current;
    if (!id) return;

    setTaskIdState(id);
    taskIdRef.current = id;
    disconnect();

    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setIsStreaming(true);

    let reconnectDelayMs = 1000;

    try {
      while (!controller.signal.aborted) {
        if (isTerminalTaskStatus(statusRef.current)) {
          break;
        }

        try {
          const scopedClient = resolvePodClient(client, resolvePodId(client, podId));
          const stream = await scopedClient.tasks.stream(id, { signal: controller.signal });
          reconnectDelayMs = 1000;

          for await (const event of readSSE(stream)) {
            if (controller.signal.aborted) {
              break;
            }

            const payload = parseSSEJson(event);
            onEventRef.current?.(event, payload);

            const parsed = parseTaskStreamEvent(payload);

            if (parsed.task?.id === id) {
              setTask(parsed.task);
              setTaskStatus(parsed.task.status);
            }

            if (parsed.message) {
              setMessages((previous) => upsertTaskMessage(previous, parsed.message!));
              onMessageRef.current?.(parsed.message);
            }

            if (parsed.status) {
              setTaskStatus(parsed.status);
              setTask((previous) => {
                if (!previous || previous.id !== id) return previous;
                return {
                  ...previous,
                  status: parsed.status as Task["status"],
                };
              });
            }

            if (isTerminalTaskStatus(statusRef.current)) {
              break;
            }
          }

          if (controller.signal.aborted || isTerminalTaskStatus(statusRef.current)) {
            break;
          }

          await sleep(Math.max(reconnectDelayMs, 2000));
          reconnectDelayMs = Math.min(Math.max(reconnectDelayMs * 2, 2000), 6000);
        } catch (streamError) {
          if (streamError instanceof Error && streamError.name === "AbortError") {
            break;
          }

          const normalized = normalizeError(streamError, "Failed to stream task run.");
          setError(normalized);
          onErrorRef.current?.(streamError);

          await sleep(reconnectDelayMs);
          reconnectDelayMs = Math.min(reconnectDelayMs * 2, 6000);
        }
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsStreaming(false);
    }
  }, [client, disconnect, podId, setTaskStatus]);

  const start = useCallback(async (input: CreateTaskInput): Promise<Task> => {
    setError(null);

    const scopedClient = resolvePodClient(client, resolvePodId(client, podId));
    const created = await scopedClient.tasks.create({
      agent_name: input.agentName,
      input_data: input.inputData,
    });

    taskIdRef.current = created.id;
    setTask(created);
    setTaskIdState(created.id);
    setMessages([]);
    setTaskStatus(created.status);

    if (autoConnectOnStart && !autoConnect) {
      await connect(created.id);
    }

    return created;
  }, [autoConnect, autoConnectOnStart, client, connect, podId, setTaskStatus]);

  const stop = useCallback(async (): Promise<Task | null> => {
    const id = taskIdRef.current;
    if (!id) return null;

    try {
      const scopedClient = resolvePodClient(client, resolvePodId(client, podId));
      const stopped = await scopedClient.tasks.stop(id);
      setTask(stopped);
      setTaskStatus(stopped.status);
      return stopped;
    } catch (stopError) {
      const normalized = normalizeError(stopError, "Failed to stop task run.");
      setError(normalized);
      onErrorRef.current?.(stopError);
      return null;
    }
  }, [client, podId, setTaskStatus]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    if (!taskId) return;

    let cancelled = false;

    const bootstrapTask = async () => {
      const latestTask = await refreshTask(taskId);
      if (cancelled) return;

      await loadMessages(taskId);
      if (cancelled || !autoConnect) return;

      const latestStatus = normalizeRunStatus(latestTask?.status) ?? normalizeRunStatus(statusRef.current);
      if (isTerminalTaskStatus(latestStatus)) {
        return;
      }

      await connect(taskId);
    };

    void bootstrapTask();
    return () => {
      cancelled = true;
      disconnect();
    };
  }, [autoConnect, connect, disconnect, loadMessages, refreshTask, taskId]);

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
