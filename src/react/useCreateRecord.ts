import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { RecordResponse } from "../types.js";
import { normalizeError, resolvePodClient } from "./utils.js";

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

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const trimmedTableName = tableName.trim();
  const isEnabled = enabled && trimmedTableName.length > 0;

  const create = useCallback(async (data: Record<string, unknown>): Promise<TRecord | null> => {
    if (!isEnabled) {
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
        onSuccessRef.current?.(nextRecord, response);
      }
      return nextRecord;
    } catch (mutationError) {
      const normalized = normalizeError(mutationError, "Failed to create record.");
      setError(normalized);
      onErrorRef.current?.(mutationError);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [client, isEnabled, podId, trimmedTableName]);

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
