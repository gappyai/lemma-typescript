import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { ListRecordsOptions } from "../types.js";

export interface UseRecordsOptions extends ListRecordsOptions {
  client: LemmaClient;
  podId?: string;
  tableName: string;
  enabled?: boolean;
  autoLoad?: boolean;
}

export interface UseRecordsResult<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  records: TRecord[];
  total: number;
  nextPageToken: string | null;
  isLoading: boolean;
  error: Error | null;
  refresh: (overrides?: Partial<ListRecordsOptions>) => Promise<TRecord[]>;
}

function resolvePodClient(client: LemmaClient, podId?: string): LemmaClient {
  if (!podId || podId === client.podId) return client;
  return client.withPod(podId);
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

function stringifyComparable(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function useRecords<TRecord extends Record<string, unknown> = Record<string, unknown>>({
  client,
  podId,
  tableName,
  filters,
  sort,
  limit = 20,
  pageToken,
  offset,
  sortBy,
  order,
  params,
  enabled = true,
  autoLoad = true,
}: UseRecordsOptions): UseRecordsResult<TRecord> {
  const [records, setRecords] = useState<TRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trimmedTableName = tableName.trim();
  const isEnabled = enabled && trimmedTableName.length > 0;
  const filtersKey = stringifyComparable(filters);
  const sortKey = stringifyComparable(sort);
  const paramsKey = stringifyComparable(params);
  const stableFilters = useMemo(() => filters, [filtersKey]);
  const stableSort = useMemo(() => sort, [sortKey]);
  const stableParams = useMemo(() => params, [paramsKey]);

  const refresh = useCallback(async (overrides: Partial<ListRecordsOptions> = {}): Promise<TRecord[]> => {
    if (!isEnabled) {
      setRecords([]);
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
      const response = await scopedClient.records.list(trimmedTableName, {
        filters: overrides.filters ?? stableFilters,
        sort: overrides.sort ?? stableSort,
        limit: overrides.limit ?? limit,
        pageToken: overrides.pageToken ?? pageToken,
        offset: overrides.offset ?? offset,
        sortBy: overrides.sortBy ?? sortBy,
        order: overrides.order ?? order,
        params: overrides.params ?? stableParams,
      });

      const nextRecords = (response.items ?? []) as TRecord[];
      setRecords(nextRecords);
      setTotal(response.total ?? nextRecords.length);
      setNextPageToken(response.next_page_token ?? null);
      return nextRecords;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to load records.");
      setError(normalized);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [
    client,
    isEnabled,
    limit,
    offset,
    order,
    pageToken,
    podId,
    sortBy,
    stableFilters,
    stableParams,
    stableSort,
    trimmedTableName,
  ]);

  useEffect(() => {
    if (!isEnabled) {
      setRecords([]);
      setTotal(0);
      setNextPageToken(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, isEnabled, refresh]);

  return useMemo(() => ({
    records,
    total,
    nextPageToken,
    isLoading,
    error,
    refresh,
  }), [error, isLoading, nextPageToken, records, refresh, total]);
}
