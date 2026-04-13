import { useCallback } from "react";
import type { LemmaClient } from "../client.js";
import { isTerminalTaskStatus, normalizeRunStatus } from "../run-utils.js";
import type { Task } from "../types.js";
import {
  useTaskSession,
  type UseTaskSessionOptions,
  type UseTaskSessionResult,
} from "./useTaskSession.js";

export interface UseAgentRunOptions
  extends Omit<UseTaskSessionOptions, "taskId"> {
  agentName?: string;
  taskId?: string | null;
}

export interface UseAgentRunResult
  extends Omit<UseTaskSessionResult, "start"> {
  output: Task["output_data"];
  finalOutput: Task["output_data"];
  isWaitingForInput: boolean;
  isFinished: boolean;
  start: (
    inputData?: Record<string, unknown> | null,
    options?: { agentName?: string },
  ) => Promise<Task>;
  submitInput: (content: string) => Promise<Task | null>;
}

function resolveAgentName(base?: string, override?: string): string {
  const resolved = override ?? base;
  if (!resolved) {
    throw new Error("agentName is required.");
  }
  return resolved;
}

function resolvePodClient(client: LemmaClient, podId?: string): LemmaClient {
  if (!podId || podId === client.podId) return client;
  return client.withPod(podId);
}

export function useAgentRun({
  client,
  podId,
  agentName,
  taskId = null,
  autoConnect = true,
  autoConnectOnStart = true,
  onEvent,
  onStatus,
  onMessage,
  onError,
}: UseAgentRunOptions): UseAgentRunResult {
  const session = useTaskSession({
    client,
    podId,
    taskId,
    autoConnect,
    autoConnectOnStart,
    onEvent,
    onStatus,
    onMessage,
    onError,
  });

  const start = useCallback(async (
    inputData?: Record<string, unknown> | null,
    options?: { agentName?: string },
  ): Promise<Task> => {
    return session.start({
      agentName: resolveAgentName(agentName, options?.agentName),
      inputData: inputData ?? undefined,
    });
  }, [agentName, session]);

  const submitInput = useCallback(async (content: string): Promise<Task | null> => {
    const resolvedTaskId = session.taskId;
    if (!resolvedTaskId) {
      throw new Error("taskId is required to submit additional agent input.");
    }

    const scopedClient = resolvePodClient(client, podId);
    await scopedClient.tasks.messages.add(resolvedTaskId, { content });
    await session.loadMessages(resolvedTaskId);
    return session.refreshTask(resolvedTaskId);
  }, [client, podId, session]);

  const normalizedStatus = normalizeRunStatus(session.status);
  const isFinished = isTerminalTaskStatus(normalizedStatus);
  const isWaitingForInput = normalizedStatus === "WAITING";
  const output = session.task?.output_data ?? null;
  const finalOutput = isFinished ? output : null;

  return {
    ...session,
    output,
    finalOutput,
    isWaitingForInput,
    isFinished,
    start,
    submitInput,
  };
}
