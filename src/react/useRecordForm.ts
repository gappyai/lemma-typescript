import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import {
  buildRecordFormValues,
  buildRecordPayload,
  type RecordSchemaField,
} from "../record-form.js";
import type { RecordResponse } from "../types.js";
import { normalizeError, resolvePodClient, stringifyComparable } from "./utils.js";
import {
  useRecordSchema,
  type UseRecordSchemaResult,
} from "./useRecordSchema.js";

const EMPTY_VALUES: Record<string, unknown> = {};

export interface UseRecordFormOptions {
  client: LemmaClient;
  podId?: string;
  tableName: string;
  recordId?: string | null;
  initialValues?: Record<string, unknown>;
  mode?: "auto" | "create" | "update";
  enabled?: boolean;
  autoLoad?: boolean;
  onSubmitSuccess?: (record: Record<string, unknown>, response: RecordResponse) => void;
  onError?: (error: unknown) => void;
}

export interface UseRecordFormResult {
  table: UseRecordSchemaResult["table"];
  fields: RecordSchemaField[];
  editableFields: RecordSchemaField[];
  defaults: Record<string, unknown>;
  values: Record<string, unknown>;
  baselineValues: Record<string, unknown>;
  record: Record<string, unknown> | null;
  fieldErrors: Record<string, string>;
  isLoadingSchema: boolean;
  isLoadingRecord: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  error: Error | null;
  refreshSchema: UseRecordSchemaResult["refresh"];
  refreshRecord: () => Promise<Record<string, unknown> | null>;
  refresh: () => Promise<void>;
  setValue: (fieldName: string, value: unknown) => void;
  setValues: (values: Record<string, unknown>) => void;
  reset: (nextValues?: Record<string, unknown>) => void;
  validate: () => boolean;
  submit: (overrides?: { mode?: "create" | "update" }) => Promise<Record<string, unknown> | null>;
}




export function useRecordForm({
  client,
  podId,
  tableName,
  recordId = null,
  initialValues = EMPTY_VALUES,
  mode = "auto",
  enabled = true,
  autoLoad = true,
  onSubmitSuccess,
  onError,
}: UseRecordFormOptions): UseRecordFormResult {
  const schema = useRecordSchema({
    client,
    podId,
    tableName,
    enabled,
    autoLoad,
  });

  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [values, setValuesState] = useState<Record<string, unknown>>({});
  const [baselineValues, setBaselineValues] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [recordError, setRecordError] = useState<Error | null>(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialValuesKey = stringifyComparable(initialValues);
  const stableInitialValues = useMemo(() => initialValues, [initialValuesKey]);
  const schemaTable = schema.table;
  const refreshSchema = schema.refresh;

  const hydrateValues = useCallback((source: Record<string, unknown>) => {
    if (!schemaTable) return;
    const nextValues = buildRecordFormValues(schemaTable, source);
    setValuesState(nextValues);
    setBaselineValues(nextValues);
    setFieldErrors({});
  }, [schemaTable]);

  const refreshRecord = useCallback(async (): Promise<Record<string, unknown> | null> => {
    if (!enabled || !recordId) {
      setRecord(null);
      return null;
    }

    setIsLoadingRecord(true);
    setRecordError(null);

    try {
      const scopedClient = resolvePodClient(client, podId);
      const response = await scopedClient.records.get(tableName, recordId);
      const nextRecord = response.data ?? null;
      setRecord(nextRecord);
      return nextRecord;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to load record.");
      setRecordError(normalized);
      onError?.(refreshError);
      return null;
    } finally {
      setIsLoadingRecord(false);
    }
  }, [client, enabled, onError, podId, recordId, tableName]);

  useEffect(() => {
    if (!enabled) {
      setRecord(null);
      setValuesState({});
      setBaselineValues({});
      setFieldErrors({});
      setRecordError(null);
      setIsLoadingRecord(false);
      setIsSubmitting(false);
      return;
    }

    if (!autoLoad || !recordId) return;
    void refreshRecord();
  }, [autoLoad, enabled, recordId, refreshRecord]);

  const recordKey = stringifyComparable(record);

  useEffect(() => {
    if (!schemaTable) return;

    const source = {
      ...(record ?? {}),
      ...stableInitialValues,
    };

    hydrateValues(source);
  }, [hydrateValues, recordKey, schemaTable, stableInitialValues]);

  const refresh = useCallback(async (): Promise<void> => {
    const nextTable = await refreshSchema();
    if (recordId) {
      const nextRecord = await refreshRecord();
      if (nextTable && nextRecord) {
        hydrateValues({
          ...nextRecord,
          ...stableInitialValues,
        });
      }
      return;
    }

    if (nextTable) {
      hydrateValues(stableInitialValues);
    }
  }, [hydrateValues, recordId, refreshRecord, refreshSchema, stableInitialValues]);

  const setValue = useCallback((fieldName: string, value: unknown) => {
    setValuesState((current) => ({
      ...current,
      [fieldName]: value,
    }));
    setFieldErrors((current) => {
      if (!(fieldName in current)) return current;
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
  }, []);

  const setValues = useCallback((nextValues: Record<string, unknown>) => {
    setValuesState((current) => ({
      ...current,
      ...nextValues,
    }));
  }, []);

  const reset = useCallback((nextValues?: Record<string, unknown>) => {
    if (!schemaTable) return;
    const source = nextValues ?? {
      ...(record ?? {}),
      ...stableInitialValues,
    };
    hydrateValues(source);
  }, [hydrateValues, record, schemaTable, stableInitialValues]);

  const validate = useCallback((): boolean => {
    if (!schemaTable) return false;
    const resolvedMode = mode === "auto" ? (recordId ? "update" : "create") : mode;
    const result = buildRecordPayload(schemaTable, values, { mode: resolvedMode });
    setFieldErrors(result.errors);
    return result.isValid;
  }, [mode, recordId, schemaTable, values]);

  const submit = useCallback(async (
    overrides: { mode?: "create" | "update" } = {},
  ): Promise<Record<string, unknown> | null> => {
    if (!schemaTable) {
      const error = new Error("Record schema is not loaded.");
      setRecordError(error);
      return null;
    }

    const resolvedMode = overrides.mode ?? (mode === "auto" ? (recordId ? "update" : "create") : mode);
    const payload = buildRecordPayload(schemaTable, values, { mode: resolvedMode });
    setFieldErrors(payload.errors);

    if (!payload.isValid) {
      return null;
    }

    setIsSubmitting(true);
    setRecordError(null);

    try {
      const scopedClient = resolvePodClient(client, podId);
      const response = resolvedMode === "update" && recordId
        ? await scopedClient.records.update(tableName, recordId, payload.data)
        : await scopedClient.records.create(tableName, payload.data);
      const nextRecord = response.data ?? null;
      setRecord(nextRecord);
      hydrateValues({
        ...(nextRecord ?? {}),
        ...stableInitialValues,
      });
      onSubmitSuccess?.(nextRecord ?? {}, response);
      return nextRecord;
    } catch (submitError) {
      const normalized = normalizeError(submitError, "Failed to save record.");
      setRecordError(normalized);
      onError?.(submitError);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [client, hydrateValues, mode, onError, onSubmitSuccess, podId, recordId, schemaTable, stableInitialValues, tableName, values]);

  const isDirty = useMemo(() => {
    return stringifyComparable(values) !== stringifyComparable(baselineValues);
  }, [baselineValues, values]);

  return useMemo(() => ({
    table: schema.table,
    fields: schema.fields,
    editableFields: schema.editableFields,
    defaults: schema.defaults,
    values,
    baselineValues,
    record,
    fieldErrors,
    isLoadingSchema: schema.isLoading,
    isLoadingRecord,
    isSubmitting,
    isDirty,
    error: schema.error ?? recordError,
    refreshSchema: schema.refresh,
    refreshRecord,
    refresh,
    setValue,
    setValues,
    reset,
    validate,
    submit,
  }), [
    baselineValues,
    fieldErrors,
    isDirty,
    isLoadingRecord,
    isSubmitting,
    record,
    recordError,
    refresh,
    refreshRecord,
    reset,
    schema.defaults,
    schema.editableFields,
    schema.error,
    schema.fields,
    schema.isLoading,
    schema.refresh,
    schema.table,
    setValue,
    setValues,
    submit,
    validate,
    values,
  ]);
}
