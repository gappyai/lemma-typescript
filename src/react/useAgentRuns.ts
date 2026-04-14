import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { Task } from "../types.js";
import { normalizeError, resolvePodClient } from "./utils.js";

export interface UseAgentRunsOptions {
  client: LemmaClient;
  podId?: string;
  agentName?: string;
  enabled?: boolean;
  autoLoad?: boolean;
  limit?: number;
  pageToken?: string;
  initialTaskId?: string | null;
}

export interface UseAgentRunsResult {
  runs: Task[];
  total: number;
  nextPageToken: string | null;
  selectedTaskId: string | null;
  effectiveSelectedTaskId: string | null;
  selectedRun: Task | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  selectRun: (taskId: string | null) => void;
  clearSelection: () => void;
  refresh: (overrides?: { limit?: number; pageToken?: string }) => Promise<Task[]>;
  loadMore: (overrides?: { limit?: number }) => Promise<Task[]>;
}

export function useAgentRuns({
  client,
  podId,
  agentName,
  enabled = true,
  autoLoad = true,
  limit = 100,
  pageToken,
  initialTaskId = null,
}: UseAgentRunsOptions): UseAgentRunsResult {
  const [runs, setRuns] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async (overrides: { limit?: number; pageToken?: string } = {}, signal?: AbortSignal): Promise<Task[]> => {
    if (!enabled) {
      setRuns([]);
      setTotal(0);
      setNextPageToken(null);
      setError(null);
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const scopedClient = resolvePodClient(client, podId);
      const response = await scopedClient.tasks.list({
        agent_name: agentName,
        limit: overrides.limit ?? limit,
        page_token: overrides.pageToken ?? pageToken,
      });
      if (signal?.aborted) return [];
      const nextRuns = response.items ?? [];
      setRuns(nextRuns);
      setTotal((response as { total?: number }).total ?? nextRuns.length);
      setNextPageToken(response.next_page_token ?? null);
      setSelectedTaskId((current) => (
        current && nextRuns.some((run) => run.id === current) ? current : initialTaskId
      ));
      return nextRuns;
    } catch (refreshError) {
      if (signal?.aborted) return [];
      const normalized = normalizeError(refreshError, "Failed to load agent runs.");
      setError(normalized);
      return [];
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [agentName, client, enabled, initialTaskId, limit, pageToken, podId]);

  const loadMore = useCallback(async (overrides: { limit?: number } = {}): Promise<Task[]> => {
    if (!enabled || !nextPageToken || isLoading || isLoadingMore) {
      return [];
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const scopedClient = resolvePodClient(client, podId);
      const response = await scopedClient.tasks.list({
        agent_name: agentName,
        limit: overrides.limit ?? limit,
        page_token: nextPageToken,
      });
      const moreRuns = response.items ?? [];
      setRuns((previous) => [...previous, ...moreRuns]);
      setTotal((response as { total?: number }).total ?? runs.length + moreRuns.length);
      setNextPageToken(response.next_page_token ?? null);
      return moreRuns;
    } catch (loadError) {
      const normalized = normalizeError(loadError, "Failed to load more agent runs.");
      setError(normalized);
      return [];
    } finally {
      setIsLoadingMore(false);
    }
  }, [agentName, client, enabled, isLoading, isLoadingMore, limit, nextPageToken, podId]);

  useEffect(() => {
    setSelectedTaskId(initialTaskId);
  }, [initialTaskId]);

  useEffect(() => {
    if (!enabled) {
      setRuns([]);
      setTotal(0);
      setNextPageToken(null);
      setError(null);
      setIsLoading(false);
      setIsLoadingMore(false);
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
          setError(normalizeError(new Error("Failed to load agent runs."), "Failed to load agent runs."));
        }
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [autoLoad, enabled, refresh]);

  const selectRun = useCallback((taskId: string | null) => {
    setSelectedTaskId(taskId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  return useMemo(() => {
    const effectiveSelectedTaskId = selectedTaskId ?? runs[0]?.id ?? null;
    const selectedRun = effectiveSelectedTaskId
      ? runs.find((run) => run.id === effectiveSelectedTaskId) ?? null
      : null;

    return {
      runs,
      total,
      nextPageToken,
      selectedTaskId,
      effectiveSelectedTaskId,
      selectedRun,
      isLoading,
      isLoadingMore,
      error,
      selectRun,
      clearSelection,
      refresh,
      loadMore,
    };
  }, [
    clearSelection,
    error,
    isLoading,
    isLoadingMore,
    loadMore,
    nextPageToken,
    refresh,
    runs,
    selectRun,
    selectedTaskId,
    total,
  ]);
}
