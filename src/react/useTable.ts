import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { Table } from "../types.js";

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

function resolvePodClient(client: LemmaClient, podId?: string): LemmaClient {
  if (!podId || podId === client.podId) return client;
  return client.withPod(podId);
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
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

  const refresh = useCallback(async (): Promise<Table | null> => {
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
      setTable(nextTable);
      return nextTable;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to load table.");
      setError(normalized);
      return null;
    } finally {
      setIsLoading(false);
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
    void refresh();
  }, [autoLoad, isEnabled, refresh]);

  return useMemo(() => ({
    table,
    isLoading,
    error,
    refresh,
  }), [error, isLoading, refresh, table]);
}
