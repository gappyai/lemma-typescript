import { useCallback, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { FlowRun, WorkflowRunInputs } from "../types.js";

export interface UseWorkflowResumeOptions {
  client: LemmaClient;
  podId?: string;
  runId?: string | null;
  onRun?: (run: FlowRun) => void;
  onError?: (error: unknown) => void;
}

export interface UseWorkflowResumeResult {
  run: FlowRun | null;
  isResuming: boolean;
  error: Error | null;
  resume: (inputs?: WorkflowRunInputs, options?: { runId?: string | null }) => Promise<FlowRun>;
}

function resolvePodId(client: LemmaClient, podId?: string): string {
  const resolved = podId ?? client.podId;
  if (!resolved) {
    throw new Error("podId is required. Pass podId or set it on LemmaClient.");
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

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function useWorkflowResume({
  client,
  podId,
  runId,
  onRun,
  onError,
}: UseWorkflowResumeOptions): UseWorkflowResumeResult {
  const [run, setRun] = useState<FlowRun | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resume = useCallback(async (
    inputs: WorkflowRunInputs = {},
    options: { runId?: string | null } = {},
  ): Promise<FlowRun> => {
    setIsResuming(true);
    setError(null);

    try {
      const resolvedPodId = resolvePodId(client, podId);
      const resolvedRunId = resolveRunId(runId, options.runId);
      const nextRun = await client.workflows.runs.resume(resolvedRunId, inputs, resolvedPodId);
      setRun(nextRun);
      onRun?.(nextRun);
      return nextRun;
    } catch (resumeError) {
      const normalized = normalizeError(resumeError, "Failed to resume workflow run.");
      setError(normalized);
      onError?.(resumeError);
      throw normalized;
    } finally {
      setIsResuming(false);
    }
  }, [client, onError, onRun, podId, runId]);

  return useMemo(() => ({
    run,
    isResuming,
    error,
    resume,
  }), [error, isResuming, resume, run]);
}
