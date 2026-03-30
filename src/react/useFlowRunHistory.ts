import { useCallback, useEffect, useMemo, useState } from "react";
import type { FlowRun } from "../types.js";
import type { UseFlowSessionResult } from "./useFlowSession.js";

export interface UseFlowRunHistoryOptions {
  session: Pick<UseFlowSessionResult, "run" | "runId" | "setRunId" | "listHistory">;
  flowName: string;
  limit?: number;
  autoRefresh?: boolean;
}

export interface UseFlowRunHistoryResult {
  runs: FlowRun[];
  selectedRunId: string | null;
  effectiveSelectedRunId: string | null;
  selectedRun: FlowRun | null;
  isLoading: boolean;
  error: Error | null;
  setSelectedRunId: (runId: string | null) => void;
  refresh: () => Promise<FlowRun[]>;
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function useFlowRunHistory({
  session,
  flowName,
  limit = 100,
  autoRefresh = true,
}: UseFlowRunHistoryOptions): UseFlowRunHistoryResult {
  const { listHistory, run: liveRun, runId: liveRunId, setRunId } = session;
  const [runs, setRuns] = useState<FlowRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const effectiveSelectedRunId = selectedRunId ?? runs[0]?.id ?? null;

  const refresh = useCallback(async (): Promise<FlowRun[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const nextRuns = await listHistory({ flowName, limit });
      setRuns(nextRuns);
      setSelectedRunId((previous) => (
        previous && nextRuns.some((run) => run.id === previous) ? previous : null
      ));
      return nextRuns;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to list flow runs.");
      setError(normalized);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [flowName, limit, listHistory]);

  useEffect(() => {
    if (!autoRefresh) return;
    void refresh();
  }, [autoRefresh, flowName, refresh]);

  useEffect(() => {
    if (!autoRefresh || !liveRunId) return;
    void refresh();
  }, [autoRefresh, liveRunId, refresh]);

  useEffect(() => {
    if (!effectiveSelectedRunId) return;
    setRunId(effectiveSelectedRunId);
  }, [effectiveSelectedRunId, setRunId]);

  useEffect(() => {
    if (!liveRun?.id) return;

    setRuns((previous) => {
      const index = previous.findIndex((run) => run.id === liveRun.id);
      if (index === -1) {
        return [liveRun, ...previous];
      }

      const next = [...previous];
      next[index] = { ...next[index], ...liveRun };
      return next;
    });
  }, [liveRun]);

  const selectedRun = useMemo(() => {
    if (!effectiveSelectedRunId) return null;
    if (liveRun?.id === effectiveSelectedRunId) return liveRun;
    return runs.find((run) => run.id === effectiveSelectedRunId) ?? null;
  }, [effectiveSelectedRunId, liveRun, runs]);

  return {
    runs,
    selectedRunId,
    effectiveSelectedRunId,
    selectedRun,
    isLoading,
    error,
    setSelectedRunId,
    refresh,
  };
}
