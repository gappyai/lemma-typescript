import { useCallback, useMemo } from "react";
import { isTerminalFlowStatus, normalizeRunStatus } from "../run-utils.js";
import type { FlowRun, WorkflowRunInputs } from "../types.js";
import {
  useFlowSession,
  type UseFlowSessionOptions,
  type UseFlowSessionResult,
} from "./useFlowSession.js";

export interface UseWorkflowRunOptions
  extends Omit<UseFlowSessionOptions, "flowName"> {
  workflowName?: string;
}

export interface UseWorkflowRunResult
  extends Omit<UseFlowSessionResult, "start" | "listHistory"> {
  output: FlowRun["execution_context"] | null;
  finalOutput: FlowRun["execution_context"] | null;
  isWaitingForInput: boolean;
  isFinished: boolean;
  start: (
    inputs?: WorkflowRunInputs,
    options?: { workflowName?: string; connect?: boolean },
  ) => Promise<FlowRun>;
  listRuns: (options?: {
    workflowName?: string;
    limit?: number;
    pageToken?: string;
  }) => Promise<FlowRun[]>;
}

function resolveWorkflowName(base?: string, override?: string): string {
  const resolved = override ?? base;
  if (!resolved) {
    throw new Error("workflowName is required.");
  }
  return resolved;
}

export function useWorkflowRun({
  workflowName,
  ...options
}: UseWorkflowRunOptions): UseWorkflowRunResult {
  const session = useFlowSession({
    ...options,
    flowName: workflowName,
  });

  const start = useCallback(async (
    inputs?: WorkflowRunInputs,
    startOptions: { workflowName?: string; connect?: boolean } = {},
  ): Promise<FlowRun> => {
    return session.start({
      flowName: resolveWorkflowName(workflowName, startOptions.workflowName),
      inputs,
      connect: startOptions.connect,
    });
  }, [session, workflowName]);

  const listRuns = useCallback(async (listOptions: {
    workflowName?: string;
    limit?: number;
    pageToken?: string;
  } = {}): Promise<FlowRun[]> => {
    return session.listHistory({
      flowName: resolveWorkflowName(workflowName, listOptions.workflowName),
      limit: listOptions.limit,
      pageToken: listOptions.pageToken,
    });
  }, [session, workflowName]);

  return useMemo(() => {
    const normalizedStatus = normalizeRunStatus(session.status);
    const isFinished = isTerminalFlowStatus(normalizedStatus);
    const isWaitingForInput = normalizedStatus === "WAITING"
      || !!session.run?.waiting_task_id
      || !!session.run?.waiting_function_run_id
      || !!session.run?.waiting_trigger_id;
    const output = session.run?.execution_context ?? null;
    const finalOutput = isFinished ? output : null;

    return {
      ...session,
      output,
      finalOutput,
      isWaitingForInput,
      isFinished,
      start,
      listRuns,
    };
  }, [listRuns, session, start]);
}
