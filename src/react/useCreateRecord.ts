import { useCallback, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { RecordResponse } from "../types.js";

export interface UseCreateRecordOptions {
  client: LemmaClient;
  podId?: string;
  tableName: string;
  enabled?: boolean;
  onSuccess?: (record: Record<string, unknown>, response: RecordResponse) => void;
  onError?: (error: unknown) => void;
}

export interface UseCreateRecordResult<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  createdRecord: TRecord | null;
  isSubmitting: boolean;
  error: Error | null;
  create: (data: Record<string, unknown>) => Promise<TRecord | null>;
  reset: () => void;
}

function resolvePodClient(client: LemmaClient, podId?: string): LemmaClient {
  if (!podId || podId === client.podId) return client;
  return client.withPod(podId);
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function useCreateRecord<TRecord extends Record<string, unknown> = Record<string, unknown>>({
  client,
  podId,
  tableName,
  enabled = true,
  onSuccess,
  onError,
}: UseCreateRecordOptions): UseCreateRecordResult<TRecord> {
  const [createdRecord, setCreatedRecord] = useState<TRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trimmedTableName = tableName.trim();
  const isEnabled = enabled && trimmedTableName.length > 0;

  const create = useCallback(async (data: Record<string, unknown>): Promise<TRecord | null> => {
    if (!isEnabled) {
      const disabledError = new Error("Record creation is disabled.");
      setError(disabledError);
      return null;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const scopedClient = resolvePodClient(client, podId);
      const response = await scopedClient.records.create(trimmedTableName, data);
      const nextRecord = (response.data ?? null) as TRecord | null;
      setCreatedRecord(nextRecord);
      if (nextRecord) {
        onSuccess?.(nextRecord, response);
      }
      return nextRecord;
    } catch (mutationError) {
      const normalized = normalizeError(mutationError, "Failed to create record.");
      setError(normalized);
      onError?.(mutationError);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [client, isEnabled, onError, onSuccess, podId, trimmedTableName]);

  const reset = useCallback(() => {
    setCreatedRecord(null);
    setError(null);
    setIsSubmitting(false);
  }, []);

  return useMemo(() => ({
    createdRecord,
    isSubmitting,
    error,
    create,
    reset,
  }), [create, createdRecord, error, isSubmitting, reset]);
}
