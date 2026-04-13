import { useMemo } from "react";
import type { LemmaClient } from "../client.js";
import {
  buildRecordFormValues,
  buildRecordSchemaFields,
  getEditableRecordFields,
  type RecordSchemaField,
} from "../record-form.js";
import type { Table } from "../types.js";
import { useTable } from "./useTable.js";

export interface UseRecordSchemaOptions {
  client: LemmaClient;
  podId?: string;
  tableName: string;
  enabled?: boolean;
  autoLoad?: boolean;
}

export interface UseRecordSchemaResult {
  table: Table | null;
  fields: RecordSchemaField[];
  editableFields: RecordSchemaField[];
  defaults: Record<string, unknown>;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<Table | null>;
}

export function useRecordSchema({
  client,
  podId,
  tableName,
  enabled = true,
  autoLoad = true,
}: UseRecordSchemaOptions): UseRecordSchemaResult {
  const tableState = useTable({
    client,
    podId,
    tableName,
    enabled,
    autoLoad,
  });

  const fields = useMemo(() => (tableState.table ? buildRecordSchemaFields(tableState.table) : []), [tableState.table]);
  const editableFields = useMemo(
    () => (tableState.table ? getEditableRecordFields(tableState.table) : []),
    [tableState.table],
  );
  const defaults = useMemo(() => (tableState.table ? buildRecordFormValues(tableState.table) : {}), [tableState.table]);

  return useMemo(() => ({
    table: tableState.table,
    fields,
    editableFields,
    defaults,
    isLoading: tableState.isLoading,
    error: tableState.error,
    refresh: tableState.refresh,
  }), [defaults, editableFields, fields, tableState.error, tableState.isLoading, tableState.refresh, tableState.table]);
}
