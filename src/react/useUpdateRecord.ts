import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { RecordResponse } from "../types.js";
import { normalizeError, resolvePodClient } from "./utils.js";

export interface UseUpdateRecordOptions {
  client: LemmaClient;
  podId?: string;
  tableName: string;
  recordId?: string | null;
  enabled?: boolean;
  onSuccess?: (record: Record<string, unknown>, response: RecordResponse) => void;
  onError?: (error: unknown) => void;
}

export interface UseUpdateRecordResult<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  updatedRecord: TRecord | null;
  isSubmitting: boolean;
  error: Error | null;
  update: (
    data: Record<string, unknown>,
    overrides?: { recordId?: string | null },
  ) => Promise<TRecord | null>;
  reset: () => void;
}

export function useUpdateRecord<TRecord extends Record<string, unknown> = Record<string, unknown>>({
  client,
  podId,
  tableName,
  recordId = null,
  enabled = true,
  onSuccess,
  onError,
}: UseUpdateRecordOptions): UseUpdateRecordResult<TRecord> {
  const [updatedRecord, setUpdatedRecord] = useState<TRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const trimmedTableName = tableName.trim();
  const trimmedRecordId = typeof recordId === "string" ? recordId.trim() : "";
  const isEnabled = enabled && trimmedTableName.length > 0;

  const update = useCallback(async (
    data: Record<string, unknown>,
    overrides: { recordId?: string | null } = {},
  ): Promise<TRecord | null> => {
    const nextRecordId = typeof overrides.recordId === "string"
      ? overrides.recordId.trim()
      : trimmedRecordId;

    if (!isEnabled || nextRecordId.length === 0) {
      return null;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const scopedClient = resolvePodClient(client, podId);
      const response = await scopedClient.records.update(trimmedTableName, nextRecordId, data);
      const nextRecord = (response.data ?? null) as TRecord | null;
      setUpdatedRecord(nextRecord);
      if (nextRecord) {
        onSuccessRef.current?.(nextRecord, response);
      }
      return nextRecord;
    } catch (mutationError) {
      const normalized = normalizeError(mutationError, "Failed to update record.");
      setError(normalized);
      onErrorRef.current?.(mutationError);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [client, isEnabled, podId, trimmedRecordId, trimmedTableName]);

  const reset = useCallback(() => {
    setUpdatedRecord(null);
    setError(null);
    setIsSubmitting(false);
  }, []);

  return useMemo(() => ({
    updatedRecord,
    isSubmitting,
    error,
    update,
    reset,
  }), [error, isSubmitting, reset, update, updatedRecord]);
}
