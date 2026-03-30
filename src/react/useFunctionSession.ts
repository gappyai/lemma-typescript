import { useCallback, useEffect, useState } from "react";
import type { LemmaClient } from "../client.js";
import { isTerminalFunctionStatus, normalizeRunStatus, sleep } from "../run-utils.js";
import type { FunctionRun } from "../types.js";

export interface UseFunctionSessionOptions {
  client: LemmaClient;
  podId?: string;
  functionName?: string;
  runId?: string | null;
  autoPoll?: boolean;
  pollIntervalMs?: number;
  onRun?: (run: FunctionRun) => void;
  onError?: (error: unknown) => void;
}

export interface UseFunctionSessionResult {
  runId: string | null;
  run: FunctionRun | null;
  status?: string;
  isPolling: boolean;
  error: Error | null;
  setRunId: (runId: string | null) => void;
  start: (options?: {
    functionName?: string;
    input?: Record<string, unknown>;
    connect?: boolean;
  }) => Promise<FunctionRun>;
  refresh: (runId?: string | null) => Promise<FunctionRun | null>;
  listHistory: (options?: {
    functionName?: string;
    limit?: number;
    pageToken?: string;
  }) => Promise<FunctionRun[]>;
}

function resolvePodId(client: LemmaClient, podId?: string): string {
  const resolved = podId ?? client.podId;
  if (!resolved) {
    throw new Error("podId is required. Pass podId or set it on LemmaClient.");
  }
  return resolved;
}

function resolveFunctionName(base?: string, override?: string): string {
  const resolved = override ?? base;
  if (!resolved) {
    throw new Error("functionName is required.");
  }
  return resolved;
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function useFunctionSession({
  client,
  podId,
  functionName,
  runId: initialRunId = null,
  autoPoll = true,
  pollIntervalMs = 2000,
  onRun,
  onError,
}: UseFunctionSessionOptions): UseFunctionSessionResult {
  const [runId, setRunIdState] = useState<string | null>(initialRunId);
  const [run, setRun] = useState<FunctionRun | null>(null);
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

  const refresh = useCallback(async (explicitRunId?: string | null): Promise<FunctionRun | null> => {
    const id = explicitRunId ?? runId;
    if (!id) return null;

    try {
      client.setPodId(resolvePodId(client, podId));
      const name = resolveFunctionName(functionName);
      const nextRun = await client.functions.runs.get(name, id);

      setRun(nextRun);
      const nextStatus = normalizeRunStatus(nextRun.status);
      setStatus(nextStatus);
      onRun?.(nextRun);

      return nextRun;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to fetch function run.");
      setError(normalized);
      onError?.(refreshError);
      return null;
    }
  }, [client, functionName, onError, onRun, podId, runId]);

  const listHistory = useCallback(async (options: {
    functionName?: string;
    limit?: number;
    pageToken?: string;
  } = {}): Promise<FunctionRun[]> => {
    try {
      client.setPodId(resolvePodId(client, podId));
      const name = resolveFunctionName(functionName, options.functionName);
      const response = await client.functions.runs.list(name, {
        limit: options.limit,
        pageToken: options.pageToken,
      });

      return response.items ?? [];
    } catch (listError) {
      const normalized = normalizeError(listError, "Failed to list function runs.");
      setError(normalized);
      onError?.(listError);
      return [];
    }
  }, [client, functionName, onError, podId]);

  const start = useCallback(async (options: {
    functionName?: string;
    input?: Record<string, unknown>;
    connect?: boolean;
  } = {}): Promise<FunctionRun> => {
    setError(null);

    client.setPodId(resolvePodId(client, podId));
    const name = resolveFunctionName(functionName, options.functionName);

    const created = await client.functions.runs.create(name, {
      input: options.input,
    });

    setRun(created);
    setRunIdState(created.id);
    const nextStatus = normalizeRunStatus(created.status);
    setStatus(nextStatus);
    onRun?.(created);

    if (options.connect !== false) {
      await refresh(created.id);
    }

    return created;
  }, [client, functionName, onRun, podId, refresh]);

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

        if (latestStatus && isTerminalFunctionStatus(latestStatus)) {
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
      const normalized = normalizeError(pollError, "Failed while polling function run.");
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
    refresh,
    listHistory,
  };
}
