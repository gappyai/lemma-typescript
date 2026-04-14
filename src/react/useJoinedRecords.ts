import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import { buildJoinedRecordsQuery, type JoinedRecordsQueryDefinition } from "../datastore-query.js";
import { normalizeError, resolvePodId, stringifyComparable } from "./utils.js";

export interface UseJoinedRecordsOptions {
  client: LemmaClient;
  podId?: string;
  query: JoinedRecordsQueryDefinition;
  enabled?: boolean;
  autoLoad?: boolean;
}

export interface UseJoinedRecordsResult<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  records: TRecord[];
  total: number;
  sql: string;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<TRecord[]>;
}

export function useJoinedRecords<TRecord extends Record<string, unknown> = Record<string, unknown>>({
  client,
  podId,
  query,
  enabled = true,
  autoLoad = true,
}: UseJoinedRecordsOptions): UseJoinedRecordsResult<TRecord> {
  const [records, setRecords] = useState<TRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const queryKey = stringifyComparable(query);
  const stableQuery = useMemo(() => query, [queryKey]);
  const sql = useMemo(() => buildJoinedRecordsQuery(stableQuery), [stableQuery]);

  const refresh = useCallback(async (signal?: AbortSignal): Promise<TRecord[]> => {
    if (!enabled) {
      setRecords([]);
      setTotal(0);
      setError(null);
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const resolvedPodId = resolvePodId(client, podId);
      const scopedClient = resolvedPodId === client.podId ? client : client.withPod(resolvedPodId);
      const response = await scopedClient.datastore.query(sql);
      if (signal?.aborted) return [];
      const nextRecords = (response.items ?? []) as TRecord[];
      setRecords(nextRecords);
      setTotal(response.total ?? nextRecords.length);
      return nextRecords;
    } catch (refreshError) {
      if (signal?.aborted) return [];
      const normalized = normalizeError(refreshError, "Failed to load joined records.");
      setError(normalized);
      return [];
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [client, enabled, podId, sql]);

  useEffect(() => {
    if (!enabled) {
      setRecords([]);
      setTotal(0);
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
          setError(normalizeError(new Error("Failed to load joined records."), "Failed to load joined records."));
        }
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [autoLoad, enabled, refresh]);

  return useMemo(() => ({
    records,
    total,
    sql,
    isLoading,
    error,
    refresh,
  }), [error, isLoading, records, refresh, sql, total]);
}
