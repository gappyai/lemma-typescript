import { useCallback, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { DatastoreMessageResponse } from "../types.js";

export interface UseBulkRecordsOptions {
  client: LemmaClient;
  podId?: string;
  tableName: string;
  enabled?: boolean;
  onSuccess?: (response: DatastoreMessageResponse) => void;
  onError?: (error: unknown) => void;
}

export interface UseBulkRecordsResult {
  isSubmitting: boolean;
  error: Error | null;
  lastMessage: string | null;
  createMany: (records: Record<string, unknown>[]) => Promise<DatastoreMessageResponse | null>;
  updateMany: (records: Record<string, unknown>[]) => Promise<DatastoreMessageResponse | null>;
  deleteMany: (recordIds: Array<string | number>) => Promise<DatastoreMessageResponse | null>;
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

export function useBulkRecords({
  client,
  podId,
  tableName,
  enabled = true,
  onSuccess,
  onError,
}: UseBulkRecordsOptions): UseBulkRecordsResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const trimmedTableName = tableName.trim();
  const isEnabled = enabled && trimmedTableName.length > 0;

  const runBulkOperation = useCallback(async (
    action: (scopedClient: LemmaClient) => Promise<DatastoreMessageResponse>,
    fallbackError: string,
  ): Promise<DatastoreMessageResponse | null> => {
    if (!isEnabled) {
      const disabledError = new Error("Bulk record operations are disabled.");
      setError(disabledError);
      return null;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const scopedClient = resolvePodClient(client, podId);
      const response = await action(scopedClient);
      setLastMessage(response.message ?? null);
      onSuccess?.(response);
      return response;
    } catch (mutationError) {
      const normalized = normalizeError(mutationError, fallbackError);
      setError(normalized);
      onError?.(mutationError);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [client, isEnabled, onError, onSuccess, podId]);

  const createMany = useCallback(async (
    records: Record<string, unknown>[],
  ): Promise<DatastoreMessageResponse | null> => {
    if (records.length === 0) return null;
    return runBulkOperation(
      (scopedClient) => scopedClient.records.bulk.create(trimmedTableName, records),
      "Failed to bulk create records.",
    );
  }, [runBulkOperation, trimmedTableName]);

  const updateMany = useCallback(async (
    records: Record<string, unknown>[],
  ): Promise<DatastoreMessageResponse | null> => {
    if (records.length === 0) return null;
    return runBulkOperation(
      (scopedClient) => scopedClient.records.bulk.update(trimmedTableName, records),
      "Failed to bulk update records.",
    );
  }, [runBulkOperation, trimmedTableName]);

  const deleteMany = useCallback(async (
    recordIds: Array<string | number>,
  ): Promise<DatastoreMessageResponse | null> => {
    if (recordIds.length === 0) return null;
    return runBulkOperation(
      (scopedClient) => scopedClient.records.bulk.delete(trimmedTableName, recordIds),
      "Failed to bulk delete records.",
    );
  }, [runBulkOperation, trimmedTableName]);

  const reset = useCallback(() => {
    setError(null);
    setIsSubmitting(false);
    setLastMessage(null);
  }, []);

  return useMemo(() => ({
    isSubmitting,
    error,
    lastMessage,
    createMany,
    updateMany,
    deleteMany,
    reset,
  }), [createMany, deleteMany, error, isSubmitting, lastMessage, reset, updateMany]);
}
