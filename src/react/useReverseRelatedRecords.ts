import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import { parseForeignKeyReference } from "../datastore-query.js";
import type { Table } from "../types.js";

export interface ReverseRelationSelector {
  tableName: string;
  foreignKey: string;
}

export interface ReverseRelatedRelation {
  tableName: string;
  foreignKey: string;
  referencedColumn: string;
  label: string;
}

export interface ReverseRelatedRecordsColumn {
  key: string;
  field: string;
  label: string;
}

export interface UseReverseRelatedRecordsOptions {
  client: LemmaClient;
  podId?: string;
  tableName: string;
  recordId?: string | null;
  relation?: ReverseRelationSelector | null;
  fields?: string[];
  limit?: number;
  offset?: number;
  sortBy?: string;
  order?: "asc" | "desc" | string;
  tablesLimit?: number;
  enabled?: boolean;
  autoLoad?: boolean;
}

export interface UseReverseRelatedRecordsResult<TRow extends Record<string, unknown> = Record<string, unknown>> {
  parentTable: Table | null;
  relatedTable: Table | null;
  parentRecord: Record<string, unknown> | null;
  relations: ReverseRelatedRelation[];
  selectedRelation: ReverseRelatedRelation | null;
  columns: ReverseRelatedRecordsColumn[];
  records: TRow[];
  total: number;
  nextPageToken: string | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<TRow[]>;
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

function sentenceCase(value: string): string {
  return value
    .replace(/[_\.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function pickDefaultFields(table: Table, foreignKey: string): string[] {
  const names = table.columns
    .map((column) => column.name)
    .filter((name) => name !== "created_at" && name !== "updated_at");

  const prioritized = ["id", "name", "title", "label", "status", foreignKey];
  const next: string[] = [];

  prioritized.forEach((name) => {
    if (names.includes(name) && !next.includes(name)) {
      next.push(name);
    }
  });

  names.forEach((name) => {
    if (!next.includes(name)) {
      next.push(name);
    }
  });

  return next.slice(0, 6);
}

export function useReverseRelatedRecords<TRow extends Record<string, unknown> = Record<string, unknown>>({
  client,
  podId,
  tableName,
  recordId = null,
  relation = null,
  fields,
  limit = 20,
  offset,
  sortBy,
  order,
  tablesLimit = 100,
  enabled = true,
  autoLoad = true,
}: UseReverseRelatedRecordsOptions): UseReverseRelatedRecordsResult<TRow> {
  const [parentTable, setParentTable] = useState<Table | null>(null);
  const [relatedTable, setRelatedTable] = useState<Table | null>(null);
  const [parentRecord, setParentRecord] = useState<Record<string, unknown> | null>(null);
  const [relations, setRelations] = useState<ReverseRelatedRelation[]>([]);
  const [selectedRelation, setSelectedRelation] = useState<ReverseRelatedRelation | null>(null);
  const [columns, setColumns] = useState<ReverseRelatedRecordsColumn[]>([]);
  const [records, setRecords] = useState<TRow[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trimmedTableName = tableName.trim();
  const trimmedRecordId = typeof recordId === "string" ? recordId.trim() : "";
  const relationKey = stringifyComparable(relation);
  const fieldsKey = stringifyComparable(fields);
  const stableRelation = useMemo(() => relation, [relationKey]);
  const stableFields = useMemo(() => fields, [fieldsKey]);
  const isEnabled = enabled && trimmedTableName.length > 0 && trimmedRecordId.length > 0;

  const refresh = useCallback(async (): Promise<TRow[]> => {
    if (!isEnabled) {
      setParentTable(null);
      setRelatedTable(null);
      setParentRecord(null);
      setRelations([]);
      setSelectedRelation(null);
      setColumns([]);
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
      const [tablesResponse, parentRecordResponse] = await Promise.all([
        scopedClient.tables.list({ limit: tablesLimit }),
        scopedClient.records.get(trimmedTableName, trimmedRecordId),
      ]);

      const listedTables = tablesResponse.items ?? [];
      const nextParentTable = listedTables.find((tableEntry) => tableEntry.name === trimmedTableName)
        ?? await scopedClient.tables.get(trimmedTableName);
      const nextParentRecord = parentRecordResponse.data ?? null;

      setParentTable(nextParentTable);
      setParentRecord(nextParentRecord);

      const nextRelations = listedTables.flatMap((candidateTable) => candidateTable.columns.flatMap((column) => {
        const reference = column.foreign_key?.references
          ? parseForeignKeyReference(column.foreign_key.references)
          : null;

        if (!reference || reference.table !== trimmedTableName) {
          return [];
        }

        return [{
          tableName: candidateTable.name,
          foreignKey: column.name,
          referencedColumn: reference.column,
          label: `${candidateTable.name}.${column.name} -> ${trimmedTableName}.${reference.column}`,
        }];
      }));

      setRelations(nextRelations);

      const nextSelectedRelation = stableRelation
        ? nextRelations.find((entry) => (
          entry.tableName === stableRelation.tableName
          && entry.foreignKey === stableRelation.foreignKey
        )) ?? null
        : (nextRelations[0] ?? null);

      setSelectedRelation(nextSelectedRelation);

      if (!nextSelectedRelation) {
        setRelatedTable(null);
        setColumns([]);
        setRecords([]);
        setTotal(0);
        setNextPageToken(null);
        return [];
      }

      const nextRelatedTable = listedTables.find((tableEntry) => tableEntry.name === nextSelectedRelation.tableName)
        ?? await scopedClient.tables.get(nextSelectedRelation.tableName);
      const referenceValue = nextParentRecord?.[nextSelectedRelation.referencedColumn]
        ?? (nextSelectedRelation.referencedColumn === "id" ? trimmedRecordId : undefined);

      setRelatedTable(nextRelatedTable);

      if (typeof referenceValue === "undefined" || referenceValue === null) {
        setColumns([]);
        setRecords([]);
        setTotal(0);
        setNextPageToken(null);
        return [];
      }

      const resolvedFields = (stableFields?.length ? stableFields : pickDefaultFields(nextRelatedTable, nextSelectedRelation.foreignKey))
        .filter((field, index, allFields) => field.trim().length > 0 && allFields.indexOf(field) === index);

      const response = await scopedClient.records.list(nextSelectedRelation.tableName, {
        filters: [{
          field: nextSelectedRelation.foreignKey,
          op: "eq",
          value: referenceValue,
        }],
        limit,
        offset,
        sortBy,
        order,
      });

      const nextRecords = (response.items ?? []) as TRow[];
      setColumns(resolvedFields.map((field) => ({
        key: field,
        field,
        label: sentenceCase(field),
      })));
      setRecords(nextRecords);
      setTotal(response.total ?? nextRecords.length);
      setNextPageToken(response.next_page_token ?? null);
      return nextRecords;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to load reverse-related records.");
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
    podId,
    sortBy,
    stableFields,
    stableRelation,
    tablesLimit,
    trimmedRecordId,
    trimmedTableName,
  ]);

  useEffect(() => {
    if (!isEnabled) {
      setParentTable(null);
      setRelatedTable(null);
      setParentRecord(null);
      setRelations([]);
      setSelectedRelation(null);
      setColumns([]);
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
    parentTable,
    relatedTable,
    parentRecord,
    relations,
    selectedRelation,
    columns,
    records,
    total,
    nextPageToken,
    isLoading,
    error,
    refresh,
  }), [
    columns,
    error,
    isLoading,
    nextPageToken,
    parentRecord,
    parentTable,
    records,
    refresh,
    relatedTable,
    relations,
    selectedRelation,
    total,
  ]);
}
