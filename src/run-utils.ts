import type { FlowRunStatus, FunctionRunStatus, TaskStatus } from "./openapi_client/index.js";

export type AnyRunStatus = TaskStatus | FunctionRunStatus | FlowRunStatus | (string & {});

interface BackoffOptions {
  baseMs?: number;
  maxMs?: number;
  factor?: number;
}

const TASK_TERMINAL = new Set<string>(["COMPLETED", "FAILED", "CANCELLED", "STOPPED"]);
const FUNCTION_TERMINAL = new Set<string>(["COMPLETED", "FAILED", "CANCELLED"]);
const FLOW_TERMINAL = new Set<string>(["COMPLETED", "FAILED", "CANCELLED"]);

export function normalizeRunStatus(status: unknown): string | undefined {
  if (typeof status !== "string") {
    return undefined;
  }

  const normalized = status.trim().toUpperCase();
  return normalized.length > 0 ? normalized : undefined;
}

export function isTerminalTaskStatus(status: unknown, options: { treatWaitingAsTerminal?: boolean } = {}): boolean {
  const normalized = normalizeRunStatus(status);
  if (!normalized) return false;

  if (normalized === "WAITING") {
    return options.treatWaitingAsTerminal === true;
  }

  return TASK_TERMINAL.has(normalized);
}

export function isTerminalFunctionStatus(status: unknown): boolean {
  const normalized = normalizeRunStatus(status);
  return !!normalized && FUNCTION_TERMINAL.has(normalized);
}

export function isTerminalFlowStatus(status: unknown, options: { treatWaitingAsTerminal?: boolean } = {}): boolean {
  const normalized = normalizeRunStatus(status);
  if (!normalized) return false;

  if (normalized === "WAITING") {
    return options.treatWaitingAsTerminal === true;
  }

  return FLOW_TERMINAL.has(normalized);
}

export async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (!Number.isFinite(ms) || ms <= 0) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Operation aborted", "AbortError"));
    };

    if (signal?.aborted) {
      clearTimeout(timer);
      reject(new DOMException("Operation aborted", "AbortError"));
      return;
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function nextBackoffDelay(attempt: number, options: BackoffOptions = {}): number {
  const baseMs = options.baseMs ?? 500;
  const maxMs = options.maxMs ?? 6000;
  const factor = options.factor ?? 2;

  const safeAttempt = Math.max(0, Math.floor(attempt));
  const delay = Math.round(baseMs * Math.pow(factor, safeAttempt));

  return Math.min(Math.max(baseMs, delay), maxMs);
}
