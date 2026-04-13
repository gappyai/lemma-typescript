import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { Table } from "../types.js";

export interface UseTablesOptions {
  client: LemmaClient;
  podId?: string;
  enabled?: boolean;
  autoLoad?: boolean;
  limit?: number;
  pageToken?: string;
}

export interface UseTablesResult {
  tables: Table[];
  total: number;
  nextPageToken: string | null;
  isLoading: boolean;
  error: Error | null;
  refresh: (overrides?: { limit?: number; pageToken?: string }) => Promise<Table[]>;
}

function resolvePodClient(client: LemmaClient, podId?: string): LemmaClient {
  if (!podId || podId === client.podId) return client;
  return client.withPod(podId);
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function useTables({
  client,
  podId,
  enabled = true,
  autoLoad = true,
  limit = 100,
  pageToken,
}: UseTablesOptions): UseTablesResult {
  const [tables, setTables] = useState<Table[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async (overrides: { limit?: number; pageToken?: string } = {}): Promise<Table[]> => {
    if (!enabled) {
      setTables([]);
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
      const response = await scopedClient.tables.list({
        limit: overrides.limit ?? limit,
        pageToken: overrides.pageToken ?? pageToken,
      });

      const nextTables = response.items ?? [];
      setTables(nextTables);
      setTotal(nextTables.length);
      setNextPageToken(response.next_page_token ?? null);
      return nextTables;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to load tables.");
      setError(normalized);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [client, enabled, limit, pageToken, podId]);

  useEffect(() => {
    if (!enabled) {
      setTables([]);
      setTotal(0);
      setNextPageToken(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, enabled, refresh]);

  return useMemo(() => ({
    tables,
    total,
    nextPageToken,
    isLoading,
    error,
    refresh,
  }), [error, isLoading, nextPageToken, refresh, tables, total]);
}
