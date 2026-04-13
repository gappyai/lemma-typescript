import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { FlowRun } from "../types.js";

export interface UseWorkflowRunsOptions {
  client: LemmaClient;
  podId?: string;
  workflowName: string;
  enabled?: boolean;
  autoLoad?: boolean;
  limit?: number;
  pageToken?: string;
  initialRunId?: string | null;
}

export interface UseWorkflowRunsResult {
  runs: FlowRun[];
  total: number;
  nextPageToken: string | null;
  selectedRunId: string | null;
  effectiveSelectedRunId: string | null;
  selectedRun: FlowRun | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  selectRun: (runId: string | null) => void;
  clearSelection: () => void;
  refresh: (overrides?: { limit?: number; pageToken?: string }) => Promise<FlowRun[]>;
  loadMore: (overrides?: { limit?: number }) => Promise<FlowRun[]>;
}

function resolvePodClient(client: LemmaClient, podId?: string): LemmaClient {
  if (!podId || podId === client.podId) return client;
  return client.withPod(podId);
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function useWorkflowRuns({
  client,
  podId,
  workflowName,
  enabled = true,
  autoLoad = true,
  limit = 100,
  pageToken,
  initialRunId = null,
}: UseWorkflowRunsOptions): UseWorkflowRunsResult {
  const [runs, setRuns] = useState<FlowRun[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(initialRunId);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trimmedWorkflowName = workflowName.trim();
  const isEnabled = enabled && trimmedWorkflowName.length > 0;

  const refresh = useCallback(async (overrides: { limit?: number; pageToken?: string } = {}): Promise<FlowRun[]> => {
    if (!isEnabled) {
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
      const response = await scopedClient.workflows.runs.list(trimmedWorkflowName, {
        limit: overrides.limit ?? limit,
        pageToken: overrides.pageToken ?? pageToken,
      });
      const nextRuns = response.items ?? [];
      setRuns(nextRuns);
      setNextPageToken(response.next_page_token ?? null);
      setSelectedRunId((current) => (
        current && nextRuns.some((run) => run.id === current) ? current : initialRunId
      ));
      return nextRuns;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to load workflow runs.");
      setError(normalized);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [client, initialRunId, isEnabled, limit, pageToken, podId, trimmedWorkflowName]);

  const loadMore = useCallback(async (overrides: { limit?: number } = {}): Promise<FlowRun[]> => {
    if (!isEnabled || !nextPageToken || isLoading || isLoadingMore) {
      return [];
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const scopedClient = resolvePodClient(client, podId);
      const response = await scopedClient.workflows.runs.list(trimmedWorkflowName, {
        limit: overrides.limit ?? limit,
        pageToken: nextPageToken,
      });
      const moreRuns = response.items ?? [];
      setRuns((previous) => [...previous, ...moreRuns]);
      setNextPageToken(response.next_page_token ?? null);
      return moreRuns;
    } catch (loadError) {
      const normalized = normalizeError(loadError, "Failed to load more workflow runs.");
      setError(normalized);
      return [];
    } finally {
      setIsLoadingMore(false);
    }
  }, [client, isEnabled, isLoading, isLoadingMore, limit, nextPageToken, podId, trimmedWorkflowName]);

  useEffect(() => {
    setSelectedRunId(initialRunId);
  }, [initialRunId]);

  useEffect(() => {
    if (!isEnabled) {
      setRuns([]);
      setNextPageToken(null);
      setError(null);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, isEnabled, refresh]);

  const effectiveSelectedRunId = selectedRunId ?? runs[0]?.id ?? null;
  const selectedRun = useMemo(() => {
    if (!effectiveSelectedRunId) return null;
    return runs.find((run) => run.id === effectiveSelectedRunId) ?? null;
  }, [effectiveSelectedRunId, runs]);

  const selectRun = useCallback((runId: string | null) => {
    setSelectedRunId(runId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRunId(null);
  }, []);

  return useMemo(() => ({
    runs,
    total: runs.length,
    nextPageToken,
    selectedRunId,
    effectiveSelectedRunId,
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
    effectiveSelectedRunId,
    error,
    isLoading,
    isLoadingMore,
    loadMore,
    nextPageToken,
    refresh,
    runs,
    selectRun,
    selectedRun,
    selectedRunId,
  ]);
}
