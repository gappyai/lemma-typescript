import { useCallback, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { DatastoreMessageResponse } from "../types.js";

export interface UseDeleteRecordOptions {
  client: LemmaClient;
  podId?: string;
  tableName: string;
  recordId?: string | null;
  enabled?: boolean;
  onSuccess?: (response: DatastoreMessageResponse) => void;
  onError?: (error: unknown) => void;
}

export interface UseDeleteRecordResult {
  isSubmitting: boolean;
  error: Error | null;
  lastMessage: string | null;
  remove: (overrides?: { recordId?: string | null }) => Promise<boolean>;
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

export function useDeleteRecord({
  client,
  podId,
  tableName,
  recordId = null,
  enabled = true,
  onSuccess,
  onError,
}: UseDeleteRecordOptions): UseDeleteRecordResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const trimmedTableName = tableName.trim();
  const trimmedRecordId = typeof recordId === "string" ? recordId.trim() : "";
  const isEnabled = enabled && trimmedTableName.length > 0;

  const remove = useCallback(async (
    overrides: { recordId?: string | null } = {},
  ): Promise<boolean> => {
    const nextRecordId = typeof overrides.recordId === "string"
      ? overrides.recordId.trim()
      : trimmedRecordId;

    if (!isEnabled || nextRecordId.length === 0) {
      const disabledError = new Error("Record deletion requires a table and record ID.");
      setError(disabledError);
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const scopedClient = resolvePodClient(client, podId);
      const response = await scopedClient.records.delete(trimmedTableName, nextRecordId);
      setLastMessage(response.message ?? "Record deleted.");
      onSuccess?.(response);
      return true;
    } catch (mutationError) {
      const normalized = normalizeError(mutationError, "Failed to delete record.");
      setError(normalized);
      onError?.(mutationError);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [client, isEnabled, onError, onSuccess, podId, trimmedRecordId, trimmedTableName]);

  const reset = useCallback(() => {
    setError(null);
    setIsSubmitting(false);
    setLastMessage(null);
  }, []);

  return useMemo(() => ({
    isSubmitting,
    error,
    lastMessage,
    remove,
    reset,
  }), [error, isSubmitting, lastMessage, remove, reset]);
}
