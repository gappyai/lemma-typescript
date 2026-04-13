import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { Task } from "../types.js";

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

function resolvePodClient(client: LemmaClient, podId?: string): LemmaClient {
  if (!podId || podId === client.podId) return client;
  return client.withPod(podId);
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
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
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async (overrides: { limit?: number; pageToken?: string } = {}): Promise<Task[]> => {
    if (!enabled) {
      setRuns([]);
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
      const nextRuns = response.items ?? [];
      setRuns(nextRuns);
      setNextPageToken(response.next_page_token ?? null);
      setSelectedTaskId((current) => (
        current && nextRuns.some((run) => run.id === current) ? current : initialTaskId
      ));
      return nextRuns;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to load agent runs.");
      setError(normalized);
      return [];
    } finally {
      setIsLoading(false);
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
      setNextPageToken(null);
      setError(null);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, enabled, refresh]);

  const effectiveSelectedTaskId = selectedTaskId ?? runs[0]?.id ?? null;
  const selectedRun = useMemo(() => {
    if (!effectiveSelectedTaskId) return null;
    return runs.find((run) => run.id === effectiveSelectedTaskId) ?? null;
  }, [effectiveSelectedTaskId, runs]);

  const selectRun = useCallback((taskId: string | null) => {
    setSelectedTaskId(taskId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  return useMemo(() => ({
    runs,
    total: runs.length,
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
  }), [
    clearSelection,
    effectiveSelectedTaskId,
    error,
    isLoading,
    isLoadingMore,
    loadMore,
    nextPageToken,
    refresh,
    runs,
    selectRun,
    selectedRun,
    selectedTaskId,
  ]);
}
