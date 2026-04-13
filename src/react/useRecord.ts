import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";

export interface UseRecordOptions {
  client: LemmaClient;
  podId?: string;
  tableName: string;
  recordId?: string | null;
  enabled?: boolean;
  autoLoad?: boolean;
}

export interface UseRecordResult<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  record: TRecord | null;
  isLoading: boolean;
  error: Error | null;
  refresh: (overrides?: { recordId?: string | null }) => Promise<TRecord | null>;
}

function resolvePodClient(client: LemmaClient, podId?: string): LemmaClient {
  if (!podId || podId === client.podId) return client;
  return client.withPod(podId);
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function useRecord<TRecord extends Record<string, unknown> = Record<string, unknown>>({
  client,
  podId,
  tableName,
  recordId = null,
  enabled = true,
  autoLoad = true,
}: UseRecordOptions): UseRecordResult<TRecord> {
  const [record, setRecord] = useState<TRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trimmedTableName = tableName.trim();
  const trimmedRecordId = typeof recordId === "string" ? recordId.trim() : "";
  const isEnabled = enabled && trimmedTableName.length > 0 && trimmedRecordId.length > 0;

  const refresh = useCallback(async (
    overrides: { recordId?: string | null } = {},
  ): Promise<TRecord | null> => {
    const nextRecordId = typeof overrides.recordId === "string"
      ? overrides.recordId.trim()
      : trimmedRecordId;

    if (!enabled || trimmedTableName.length === 0 || nextRecordId.length === 0) {
      setRecord(null);
      setError(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const scopedClient = resolvePodClient(client, podId);
      const response = await scopedClient.records.get(trimmedTableName, nextRecordId);
      const nextRecord = (response.data ?? null) as TRecord | null;
      setRecord(nextRecord);
      return nextRecord;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to load record.");
      setError(normalized);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client, enabled, podId, trimmedRecordId, trimmedTableName]);

  useEffect(() => {
    if (!isEnabled) {
      setRecord(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, isEnabled, refresh]);

  return useMemo(() => ({
    record,
    isLoading,
    error,
    refresh,
  }), [error, isLoading, record, refresh]);
}
