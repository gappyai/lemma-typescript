import { useCallback, useEffect, useState } from "react";
import type { LemmaClient } from "../client.js";
import { isTerminalFlowStatus, normalizeRunStatus, sleep } from "../run-utils.js";
import type { FlowRun, WorkflowRunInputs } from "../types.js";

export interface UseFlowSessionOptions {
  client: LemmaClient;
  podId?: string;
  flowName?: string;
  runId?: string | null;
  autoPoll?: boolean;
  pollIntervalMs?: number;
  onRun?: (run: FlowRun) => void;
  onError?: (error: unknown) => void;
}

export interface UseFlowSessionResult {
  runId: string | null;
  run: FlowRun | null;
  status?: string;
  isPolling: boolean;
  error: Error | null;
  setRunId: (runId: string | null) => void;
  start: (options?: {
    flowName?: string;
    inputs?: WorkflowRunInputs;
    connect?: boolean;
  }) => Promise<FlowRun>;
  resume: (options: {
    runId?: string | null;
    inputs?: WorkflowRunInputs;
    connect?: boolean;
  }) => Promise<FlowRun>;
  refresh: (runId?: string | null) => Promise<FlowRun | null>;
  listHistory: (options?: {
    flowName?: string;
    limit?: number;
    pageToken?: string;
  }) => Promise<FlowRun[]>;
  cancel: (runId?: string | null) => Promise<void>;
  retry: (runId?: string | null) => Promise<void>;
}

function resolvePodId(client: LemmaClient, podId?: string): string {
  const resolved = podId ?? client.podId;
  if (!resolved) {
    throw new Error("podId is required. Pass podId or set it on LemmaClient.");
  }
  return resolved;
}

function resolveFlowName(base?: string, override?: string): string {
  const resolved = override ?? base;
  if (!resolved) {
    throw new Error("flowName is required.");
  }
  return resolved;
}

function resolveRunId(base?: string | null, override?: string | null): string {
  const resolved = override ?? base;
  if (!resolved) {
    throw new Error("runId is required.");
  }
  return resolved;
}

function resolvePodClient(client: LemmaClient, podId?: string): LemmaClient {
  if (!podId || podId === client.podId) return client;
  return client.withPod(podId);
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function useFlowSession({
  client,
  podId,
  flowName,
  runId: initialRunId = null,
  autoPoll = true,
  pollIntervalMs = 2000,
  onRun,
  onError,
}: UseFlowSessionOptions): UseFlowSessionResult {
  const [runId, setRunIdState] = useState<string | null>(initialRunId);
  const [run, setRun] = useState<FlowRun | null>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setRunId = useCallback((nextRunId: string | null) => {
    setRunIdState(nextRunId);
    if (!nextRunId) {
      setRun(null);
      setStatus(undefined);
    }
  }, []);

  const refresh = useCallback(async (explicitRunId?: string | null): Promise<FlowRun | null> => {
    const id = explicitRunId ?? runId;
    if (!id) return null;

    try {
      const resolvedPodId = resolvePodId(client, podId);
      const nextRun = await client.workflows.runs.get(id, resolvedPodId);

      setRun(nextRun);
      const nextStatus = normalizeRunStatus(nextRun.status);
      setStatus(nextStatus);
      onRun?.(nextRun);

      return nextRun;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to fetch flow run.");
      setError(normalized);
      onError?.(refreshError);
      return null;
    }
  }, [client, onError, onRun, podId, runId]);

  const listHistory = useCallback(async (options: {
    flowName?: string;
    limit?: number;
    pageToken?: string;
  } = {}): Promise<FlowRun[]> => {
    try {
      const scopedClient = resolvePodClient(client, resolvePodId(client, podId));
      const name = resolveFlowName(flowName, options.flowName);
      const response = await scopedClient.workflows.runs.list(name, {
        limit: options.limit,
        pageToken: options.pageToken,
      });

      return response.items ?? [];
    } catch (listError) {
      const normalized = normalizeError(listError, "Failed to list flow runs.");
      setError(normalized);
      onError?.(listError);
      return [];
    }
  }, [client, flowName, onError, podId]);

  const start = useCallback(async (options: {
    flowName?: string;
    inputs?: WorkflowRunInputs;
    connect?: boolean;
  } = {}): Promise<FlowRun> => {
    setError(null);

    const scopedClient = resolvePodClient(client, resolvePodId(client, podId));
    const name = resolveFlowName(flowName, options.flowName);

    const created = await scopedClient.workflows.runs.start(name, options.inputs);

    setRun(created);
    setRunIdState(created.id ?? null);
    const nextStatus = normalizeRunStatus(created.status);
    setStatus(nextStatus);
    onRun?.(created);

    if (options.connect !== false && created.id) {
      await refresh(created.id);
    }

    return created;
  }, [client, flowName, onRun, podId, refresh]);

  const resume = useCallback(async (options: {
    runId?: string | null;
    inputs?: WorkflowRunInputs;
    connect?: boolean;
  }): Promise<FlowRun> => {
    setError(null);

    const resolvedPodId = resolvePodId(client, podId);
    const id = resolveRunId(runId, options.runId);
    const resumed = await client.workflows.runs.resume(id, options.inputs, resolvedPodId);

    setRun(resumed);
    setRunIdState(resumed.id ?? id);
    const nextStatus = normalizeRunStatus(resumed.status);
    setStatus(nextStatus);
    onRun?.(resumed);

    if (options.connect !== false) {
      await refresh(resumed.id ?? id);
    }

    return resumed;
  }, [client, onRun, podId, refresh, runId]);

  const cancel = useCallback(async (explicitRunId?: string | null): Promise<void> => {
    try {
      const resolvedPodId = resolvePodId(client, podId);
      const id = resolveRunId(runId, explicitRunId);
      await client.workflows.runs.cancel(id, resolvedPodId);
      await refresh(id);
    } catch (cancelError) {
      const normalized = normalizeError(cancelError, "Failed to cancel flow run.");
      setError(normalized);
      onError?.(cancelError);
    }
  }, [client, onError, podId, refresh, runId]);

  const retry = useCallback(async (explicitRunId?: string | null): Promise<void> => {
    try {
      const resolvedPodId = resolvePodId(client, podId);
      const id = resolveRunId(runId, explicitRunId);
      await client.workflows.runs.retry(id, resolvedPodId);
      await refresh(id);
    } catch (retryError) {
      const normalized = normalizeError(retryError, "Failed to retry flow run.");
      setError(normalized);
      onError?.(retryError);
    }
  }, [client, onError, podId, refresh, runId]);

  useEffect(() => {
    if (!runId) {
      return;
    }

    void refresh(runId);
  }, [refresh, runId]);

  useEffect(() => {
    if (!autoPoll || !runId) {
      return;
    }

    let active = true;
    const abortController = new AbortController();

    const loop = async () => {
      setIsPolling(true);

      while (active) {
        const latest = await refresh(runId);
        if (!latest) {
          break;
        }
        const latestStatus = normalizeRunStatus(latest?.status);

        if (latestStatus && isTerminalFlowStatus(latestStatus)) {
          break;
        }

        try {
          await sleep(pollIntervalMs, abortController.signal);
        } catch (sleepError) {
          if (sleepError instanceof Error && sleepError.name === "AbortError") {
            break;
          }
          throw sleepError;
        }
      }

      setIsPolling(false);
    };

    void loop().catch((pollError) => {
      const normalized = normalizeError(pollError, "Failed while polling flow run.");
      setError(normalized);
      onError?.(pollError);
      setIsPolling(false);
    });

    return () => {
      active = false;
      abortController.abort();
    };
  }, [autoPoll, onError, pollIntervalMs, refresh, runId]);

  return {
    runId,
    run,
    status,
    isPolling,
    error,
    setRunId,
    start,
    resume,
    refresh,
    listHistory,
    cancel,
    retry,
  };
}
