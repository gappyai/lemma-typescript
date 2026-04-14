import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { Table } from "../types.js";
import { normalizeError, resolvePodClient } from "./utils.js";

export interface UseTableOptions {
  client: LemmaClient;
  podId?: string;
  tableName: string;
  enabled?: boolean;
  autoLoad?: boolean;
}

export interface UseTableResult {
  table: Table | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<Table | null>;
}



export function useTable({
  client,
  podId,
  tableName,
  enabled = true,
  autoLoad = true,
}: UseTableOptions): UseTableResult {
  const [table, setTable] = useState<Table | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trimmedTableName = tableName.trim();
  const isEnabled = enabled && trimmedTableName.length > 0;

  const refresh = useCallback(async (signal?: AbortSignal): Promise<Table | null> => {
    if (!isEnabled) {
      setTable(null);
      setError(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const scopedClient = resolvePodClient(client, podId);
      const nextTable = await scopedClient.tables.get(trimmedTableName);
      if (signal?.aborted) return null;
      setTable(nextTable);
      return nextTable;
    } catch (refreshError) {
      if (signal?.aborted) return null;
      const normalized = normalizeError(refreshError, "Failed to load table.");
      setError(normalized);
      return null;
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [client, isEnabled, podId, trimmedTableName]);

  useEffect(() => {
    if (!isEnabled) {
      setTable(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!autoLoad) return;
    const controller = new AbortController();
    let cancelled = false;
    (async () => {
      try {
        await refresh(controller.signal);
      } catch {
        if (!cancelled) {
          setError(normalizeError(new Error("Failed to load table."), "Failed to load table."));
        }
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [autoLoad, isEnabled, refresh]);

  return useMemo(() => ({
    table,
    isLoading,
    error,
    refresh,
  }), [error, isLoading, refresh, table]);
}
